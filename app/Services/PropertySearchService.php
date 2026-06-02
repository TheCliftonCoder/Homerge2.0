<?php

namespace App\Services;

use App\Models\GeneralProperty;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Collection;

class PropertySearchService
{
    public function __construct(
        private GeocodingService $geocoder,
        private IsochroneService $isochrone
    ) {
    }

    /**
     * Build the filtered properties query and return either a Collection or Builder.
     */
    public function searchProperties(array $filters, $sinceDateTime = null): Collection|Builder
    {
        $query = GeneralProperty::with(['agent', 'images', 'propertyCategory.transaction', 'poiCache']);

        if ($sinceDateTime) {
            $query->where('general_properties.created_at', '>', $sinceDateTime);
        }

        // 1. Location & Radius
        $searchCoords = null;
        $location = $filters['location'] ?? null;
        $radius = $filters['radius'] ?? null;

        if (!empty($location)) {
            if (!empty($radius) && floatval($radius) > 0) {
                $coords = $this->geocoder->geocode($location);
                if (isset($coords['lat']) && isset($coords['lng'])) {
                    $radiusMiles = (float) $radius;
                    $lat = $coords['lat'];
                    $lng = $coords['lng'];
                    $searchCoords = $coords;

                    $latRange = $radiusMiles / 69.0;
                    $lngRange = $radiusMiles / abs(cos(deg2rad($lat)) * 69.0);
                    
                    $query->whereBetween('latitude', [$lat - $latRange, $lat + $latRange])
                          ->whereBetween('longitude', [$lng - $lngRange, $lng + $lngRange]);

                    $cosLat = cos(deg2rad($lat));
                    $cosLat2 = $cosLat * $cosLat;
                    $query->select('general_properties.*');
                    $query->selectRaw(
                        '((latitude - ?) * (latitude - ?) + (longitude - ?) * (longitude - ?) * ?) AS distance_approx',
                        [$lat, $lat, $lng, $lng, $cosLat2]
                    );
                } else {
                    $query->where('location', 'like', '%' . $location . '%');
                    $query->select('general_properties.*');
                }
            } else {
                $query->where('location', 'like', '%' . $location . '%');
                $query->select('general_properties.*');
            }
        } else {
            $query->select('general_properties.*');
        }

        // 2. Base Filters
        if (!empty($filters['min_price'])) {
            $query->where('price', '>=', $filters['min_price']);
        }
        if (!empty($filters['max_price'])) {
            $query->where('price', '<=', $filters['max_price']);
        }
        if (!empty($filters['property_category'])) {
            $query->where('property_category_type', 'like', '%' . $filters['property_category'] . '%');
        }
        if (!empty($filters['min_size'])) {
            $query->where('size_sqft', '>=', $filters['min_size']);
        }
        if (!empty($filters['max_size'])) {
            $query->where('size_sqft', '<=', $filters['max_size']);
        }

        // 3. Category & Transaction Filters
        if (!empty($filters['bedrooms'])) {
            $query->whereHas('propertyCategory', function ($q) use ($filters) {
                $q->where('property_category_type', 'like', '%ResidentialProperty%')
                  ->where('bedrooms', '>=', $filters['bedrooms']);
            });
        }
        if (!empty($filters['bathrooms'])) {
            $query->whereHas('propertyCategory', function ($q) use ($filters) {
                $q->where('property_category_type', 'like', '%ResidentialProperty%')
                  ->where('bathrooms', '>=', $filters['bathrooms']);
            });
        }
        if (!empty($filters['parking'])) {
            $query->whereHas('propertyCategory', function ($q) use ($filters) {
                $q->where('property_category_type', 'like', '%ResidentialProperty%')
                  ->where('parking', $filters['parking']);
            });
        }
        if (isset($filters['garden']) && $filters['garden'] !== '') {
            $query->whereHas('propertyCategory', function ($q) use ($filters) {
                $q->where('property_category_type', 'like', '%ResidentialProperty%')
                  ->where('garden', $filters['garden'] === 'true' || $filters['garden'] === '1' || $filters['garden'] === 1);
            });
        }
        if (!empty($filters['property_type'])) {
            $query->whereHas('propertyCategory', function ($q) use ($filters) {
                $q->where('property_type', $filters['property_type']);
            });
        }
        if (!empty($filters['transaction_type'])) {
            $query->whereHas('propertyCategory.transaction', function ($q) use ($filters) {
                $q->where('transaction_type', 'like', '%' . $filters['transaction_type'] . '%');
            });
        }
        if (!empty($filters['tenure'])) {
            $query->whereHas('propertyCategory.transaction', function ($q) use ($filters) {
                $q->where('transaction_type', 'like', '%SalesProperty%')
                  ->where('tenure', $filters['tenure']);
            });
        }
        if (!empty($filters['furnished'])) {
            $query->whereHas('propertyCategory.transaction', function ($q) use ($filters) {
                $q->where('transaction_type', 'like', '%RentalProperty%')
                  ->where('furnished', $filters['furnished']);
            });
        }
        if (isset($filters['pets_allowed']) && $filters['pets_allowed'] !== '') {
            $query->whereHas('propertyCategory.transaction', function ($q) use ($filters) {
                $q->where('transaction_type', 'like', '%RentalProperty%')
                  ->where('pets_allowed', $filters['pets_allowed'] === 'true' || $filters['pets_allowed'] === '1' || $filters['pets_allowed'] === 1);
            });
        }
        if (!empty($filters['available_from'])) {
            $query->whereHas('propertyCategory.transaction', function ($q) use ($filters) {
                $q->where('transaction_type', 'like', '%RentalProperty%')
                  ->where('available_date', '>=', $filters['available_from']);
            });
        }

        // 4. POI Proximity Filters (Mode 1)
        if (!empty($filters['poi_proximity'])) {
            $poiFilters = is_array($filters['poi_proximity']) ? $filters['poi_proximity'] : json_decode($filters['poi_proximity'], true);
            if (is_array($poiFilters)) {
                $poiFilters = $this->normalizeProximityFilters($poiFilters);
                foreach ($poiFilters as $pf) {
                    if (isset($pf['poi_type']) && isset($pf['max_miles'])) {
                        $isFilter = !isset($pf['pin_mode']) || $pf['pin_mode'] === 'filter';
                        if ($isFilter) {
                            $query->whereHas('poiCache', function($q) use ($pf) {
                                $maxMiles = (float) (!empty($pf['max_miles']) ? $pf['max_miles'] : 1.0);
                                $q->where('poi_type', $pf['poi_type'])
                                  ->where('distance_miles', '<=', $maxMiles);
                            });
                        }
                    }
                }
            }
        }

        // 5. Custom Proximity Pins Filters (Mode 2 & 3)
        $commutePinFilters = [];
        $radiusPinFilters = [];
        $locationContext = !empty($filters['location']) ? ", " . $filters['location'] : "";

        if (!empty($filters['proximity_pins'])) {
            $pins = is_array($filters['proximity_pins']) ? $filters['proximity_pins'] : json_decode($filters['proximity_pins'], true);
            if (is_array($pins)) {
                $pins = $this->normalizeProximityFilters($pins);
                foreach ($pins as $pin) {
                    if (empty($pin['query'])) continue;
                    $queryText = $pin['query'] . $locationContext;
                    $coords = $this->geocoder->geocodeAddress($queryText);
                    if (!$coords) continue;

                    $pinType = $pin['type'] ?? 'commute';
                    $isFilter = !isset($pin['pin_mode']) || $pin['pin_mode'] === 'filter';

                    if ($pinType === 'commute') {
                        $mode = $pin['mode'] ?? 'driving';
                        $mins = (int) (!empty($pin['value']) ? $pin['value'] : 20);
                        if ($mins > 60) $mins = 60;
                        
                        $isoPolygons = $this->isochrone->getPolygons($coords['lat'], $coords['lng'], $mode, $mins);
                        if ($isoPolygons && $isFilter) {
                            $commutePinFilters[] = [
                                'polygons' => $isoPolygons,
                                'mode' => $mode,
                                'minutes' => $mins,
                                'query' => $pin['query']
                            ];
                        }
                    } else {
                        $radiusVal = (float) (!empty($pin['value']) ? $pin['value'] : 1.0);
                        if ($isFilter) {
                            $radiusPinFilters[] = [
                                'lat' => $coords['lat'],
                                'lng' => $coords['lng'],
                                'radius' => $radiusVal
                            ];
                            // Bounding box pre-filter
                            $latRange = $radiusVal / 69.0;
                            $lngRange = $radiusVal / abs(cos(deg2rad($coords['lat'])) * 69.0);
                            $query->whereBetween('latitude', [$coords['lat'] - $latRange, $coords['lat'] + $latRange])
                                  ->whereBetween('longitude', [$coords['lng'] - $lngRange, $coords['lng'] + $lngRange]);
                        }
                    }
                }
            }
        }

        // Apply manual collection filtering if required
        $requiresManualFiltering = !empty($commutePinFilters) || !empty($radiusPinFilters);
        if ($requiresManualFiltering) {
            // Broad bounding box pre-filter for commutes
            if (!empty($commutePinFilters)) {
                $firstIso = $commutePinFilters[0];
                $isoCoords = $this->geocoder->geocodeAddress($firstIso['query']);
                if ($isoCoords) {
                    $query->whereBetween('latitude', [$isoCoords['lat'] - 1.0, $isoCoords['lat'] + 1.0])
                          ->whereBetween('longitude', [$isoCoords['lng'] - 1.0, $isoCoords['lng'] + 1.0]);
                }
            }

            $candidates = $query->get();
            $filtered = $candidates->filter(function ($property) use ($commutePinFilters, $radiusPinFilters) {
                if (!$property->latitude || !$property->longitude) return false;

                foreach ($commutePinFilters as $cpf) {
                    if (!$this->isochrone->isPointInRange($property->latitude, $property->longitude, $cpf['polygons']['offpeak'])) {
                        return false;
                    }
                }

                foreach ($radiusPinFilters as $rpf) {
                    $earthRadius = 3959;
                    $dLat = deg2rad($property->latitude - $rpf['lat']);
                    $dLon = deg2rad($property->longitude - $rpf['lng']);
                    $a = sin($dLat/2) * sin($dLat/2) + cos(deg2rad($rpf['lat'])) * cos(deg2rad($property->latitude)) * sin($dLon/2) * sin($dLon/2);
                    $c = 2 * asin(sqrt($a));
                    if (($earthRadius * $c) > $rpf['radius']) {
                        return false;
                    }
                }

                return true;
            });

            return $filtered->values();
        }

        return $query;
    }

    private function normalizeProximityFilters(array $filters): array
    {
        $normalized = [];
        $temp = [];
        foreach ($filters as $item) {
            foreach ($item as $key => $value) {
                if (isset($temp[$key])) {
                    $normalized[] = $temp;
                    $temp = [];
                }
                $temp[$key] = $value;
            }
        }
        if (!empty($temp)) {
            $normalized[] = $temp;
        }
        return $normalized;
    }
}
