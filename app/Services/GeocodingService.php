<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\Log;

class GeocodingService
{
    /**
     * Geocode a given location string into a latitude and longitude.
     * Uses postcodes.io for postcodes, and Mapbox as a fallback for free text.
     * 
     * @param string $location
     * @return array|null Returns ['lat' => ..., 'lng' => ...] on success, or ['error' => 'reason'] on failure.
     */
    public function geocode(string $location): ?array
    {
        $location = trim($location);
        
        if (empty($location)) {
            return ['error' => 'Location is empty.'];
        }

        // Cache the request to avoid hitting the API multiple times for the same location
        $cacheKey = 'geocode:' . md5(strtolower($location));

        return Cache::remember($cacheKey, now()->addDays(30), function () use ($location) {
            
            // Rate limiting geocoding attempts to 50 per minute (per server instance) to avoid hitting limits or being blocked.
            if (RateLimiter::tooManyAttempts('geocode-api-calls', 50)) {
                 Log::warning("Geocoding service rate limit reached.");
                 return ['error' => 'Location service temporarily unavailable — rate limit reached.'];
            }
            
            RateLimiter::hit('geocode-api-calls', 60);

            // 1. Check if it's a UK postcode (simple regex check to decide which API to try first)
            // A basic UK postcode validation regex.
            if (preg_match('/^[A-Z]{1,2}[0-9][A-Z0-9]? ?[0-9][A-Z]{2}$/i', $location)) {
                return $this->geocodePostcodesIo($location);
            }

            // 2. Otherwise use Mapbox as normal location names
            return $this->geocodeMapbox($location);
        });
    }

    /**
     * Attempt to geocode via postcodes.io.
     */
    private function geocodePostcodesIo(string $postcode): array
    {
        // Strip spaces for the API call URL
        $cleanPostcode = str_replace(' ', '', $postcode);
        
        try {
            $response = Http::timeout(5)->get("https://api.postcodes.io/postcodes/{$cleanPostcode}");
            
            if ($response->successful()) {
                $data = $response->json();
                
                if (isset($data['result']['latitude']) && isset($data['result']['longitude'])) {
                    return [
                        'lat' => $data['result']['latitude'],
                        'lng' => $data['result']['longitude']
                    ];
                }
            }
            
            if ($response->status() === 404) {
                return ['error' => 'Postcode not found — it may be new or incomplete.'];
            }
            
            Log::error("Postcodes.io Error: " . $response->body());
            
        } catch (\Exception $e) {
            Log::error("Postcodes.io Exception: " . $e->getMessage());
        }

        return ['error' => 'Geocoding service temporarily unavailable.'];
    }

    /**
     * Geocode an address or POI name and return coordinates + resolved name.
     * 
     * @param string $query
     * @return array|null
     */
    public function geocodeAddress(string $query): ?array
    {
        // Cache for 30 days to save credits
        $cacheKey = 'geocode_address:' . md5(strtolower(trim($query)));

        return Cache::remember($cacheKey, now()->addDays(30), function () use ($query) {
            $token = config('services.mapbox.token');
            
            if (empty($token)) {
                Log::error("Mapbox token is missing from config/services.php.");
                return null;
            }

            try {
                $response = Http::timeout(5)->get('https://api.mapbox.com/geocoding/v5/mapbox.places/' . urlencode($query) . '.json', [
                    'country'      => 'GB',
                    'access_token' => $token,
                    'limit'        => 1
                ]);

                if ($response->successful()) {
                    $data = $response->json();
                    if (isset($data['features'][0])) {
                        $feature = $data['features'][0];
                        return [
                            'lat'           => (float) $feature['center'][1],
                            'lng'           => (float) $feature['center'][0],
                            'resolved_name' => $feature['place_name']
                        ];
                    }
                }
            } catch (\Exception $e) {
                Log::error("Geocoding Address Exception: " . $e->getMessage());
            }

            return null;
        });
    }

    /**
     * Attempt to geocode via Mapbox Geocoding API.
     */
    private function geocodeMapbox(string $query): array
    {
        $token = config('services.mapbox.token');
        
        if (empty($token)) {
            Log::error("Mapbox token is missing from config/services.php.");
            return ['error' => 'Location service misconfigured.'];
        }

        try {
            $response = Http::timeout(5)->get('https://api.mapbox.com/geocoding/v5/mapbox.places/' . urlencode($query) . '.json', [
                'country'      => 'GB', // Restrict to UK
                'access_token' => $token,
                'limit'        => 1
            ]);

            if ($response->successful()) {
                $data = $response->json();
                
                if (isset($data['features']) && count($data['features']) > 0) {
                    $feature = $data['features'][0];
                    // Mapbox returns coordinates as [longitude, latitude]
                    $lng = $feature['center'][0];
                    $lat = $feature['center'][1];
                    
                    return [
                        'lat' => $lat,
                        'lng' => $lng
                    ];
                }
                
                return ['error' => "Couldn't find location '{$query}' — showing keyword fallback results instead."];
            }
            
            Log::error("Mapbox Error: " . $response->body());

        } catch (\Exception $e) {
            Log::error("Mapbox Exception: " . $e->getMessage());
        }

        return ['error' => 'Location service temporarily unavailable.'];
    }
    /**
     * Find nearest POIs for multiple categories in parallel using Mapbox.
     * 
     * @param float $lat
     * @param float $lng
     * @param array $categories Map of internal type => Mapbox query string
     * @return array
     */
    public function findNearestPOIs(
        float $lat,
        float $lng,
        array $categories,
        ?string $townCity = null,
        ?string $postcode = null
    ): array {
        $token = config('services.mapbox.token');
        
        if (empty($token)) {
            Log::error("Mapbox token is missing from config/services.php.");
            return [];
        }

        // Map internal keys to the Mapbox Search Box API configuration
        $configMapping = [
            'train_station_rail'   => ['type' => 'category', 'value' => 'railway_station', 'limit' => 1],
            'train_station_public' => ['type' => 'category', 'value' => 'public_transportation_station', 'limit' => 10],
            'school'               => ['type' => 'category', 'value' => 'school', 'limit' => 1],
            'hospital'             => ['type' => 'category', 'value' => 'hospital', 'limit' => 1],
            'supermarket'          => ['type' => 'category', 'value' => 'supermarket', 'limit' => 1],
            'gym'                  => ['type' => 'category', 'value' => 'fitness_center', 'limit' => 1],
            'park'                 => ['type' => 'category', 'value' => 'park', 'limit' => 1],
        ];

        // Replace 'train_station' with rail, public, and town-specific queries
        $poolKeys = [];
        foreach ($categories as $type => $query) {
            if ($type === 'train_station') {
                $poolKeys['train_station_rail'] = $query;
                $poolKeys['train_station_public'] = $query;
                if (!empty($townCity)) {
                    $poolKeys['train_station_town'] = trim($townCity);
                }
            } else {
                $poolKeys[$type] = $query;
            }
        }

        $responses = Http::pool(fn ($pool) => 
            collect($poolKeys)->map(function ($query, $type) use ($pool, $token, $lat, $lng, $configMapping) {
                $cfg = $configMapping[$type] ?? null;
                $proximity = "{$lng},{$lat}";

                if ($cfg && $cfg['type'] === 'category') {
                    return $pool->as($type)->timeout(5)->get('https://api.mapbox.com/search/searchbox/v1/category/' . urlencode($cfg['value']), [
                        'access_token' => $token,
                        'proximity'    => $proximity,
                        'limit'        => $cfg['limit'] ?? 1,
                        'country'      => 'GB'
                    ]);
                } elseif ($type === 'train_station_town') {
                    // Search forward for the town name (e.g. "Bracknell") to find the local town station
                    return $pool->as($type)->timeout(5)->get('https://api.mapbox.com/search/searchbox/v1/forward', [
                        'access_token' => $token,
                        'q'            => $query,
                        'proximity'    => $proximity,
                        'limit'        => 5,
                        'country'      => 'GB'
                    ]);
                } else {
                    // Fallback to forward text search if not predefined or configured as text search
                    $textQuery = $cfg ? $cfg['value'] : $query;
                    return $pool->as($type)->timeout(5)->get('https://api.mapbox.com/search/searchbox/v1/forward', [
                        'access_token' => $token,
                        'q'            => $textQuery,
                        'proximity'    => $proximity,
                        'limit'        => 1,
                        'country'      => 'GB'
                    ]);
                }
            })
        );

        $rawResults = [];

        foreach ($responses as $type => $response) {
            if ($response instanceof \Exception) {
                Log::error("POI Search Exception for {$type}: " . $response->getMessage());
                throw $response;
            }

            if ($response instanceof \Illuminate\Http\Client\Response && $response->successful()) {
                $data = $response->json();
                $features = $data['features'] ?? [];
                if (!empty($features)) {
                    $rawResults[$type] = $features;
                }
            } else {
                $body = $response instanceof \Illuminate\Http\Client\Response ? $response->body() : 'Unknown error';
                Log::error("POI Search Error for {$type}: " . $body);
            }
        }

        $results = [];

        // 1. Process standard POI categories (school, hospital, supermarket, gym, park)
        foreach (['school', 'hospital', 'supermarket', 'gym', 'park'] as $type) {
            if (isset($rawResults[$type][0])) {
                $feature = $rawResults[$type][0];
                if (isset($feature['geometry']['coordinates'])) {
                    $poiLng = $feature['geometry']['coordinates'][0];
                    $poiLat = $feature['geometry']['coordinates'][1];
                    $name = $feature['properties']['name'] ?? '';
                    $distance = $this->calculateDistance($lat, $lng, $poiLat, $poiLng);

                    $results[$type] = [
                        'name'           => $name,
                        'lat'            => $poiLat,
                        'lng'            => $poiLng,
                        'distance_miles' => $distance
                    ];
                }
            }
        }

        // 2. Process train station (combining rail, public, and town search results)
        $selectedStation = null;

        // Try to find the closest valid train station from public transport stations
        if (isset($rawResults['train_station_public'])) {
            foreach ($rawResults['train_station_public'] as $feature) {
                if ($this->isValidTrainStation($feature, $townCity)) {
                    $selectedStation = $feature;
                    break; // The first valid one is the closest since the API returns sorted by distance
                }
            }
        }

        // Try to find a valid train station from town-specific search results
        if (isset($rawResults['train_station_town'])) {
            foreach ($rawResults['train_station_town'] as $feature) {
                if ($this->isValidTrainStation($feature, $townCity)) {
                    if (!$selectedStation) {
                        $selectedStation = $feature;
                    } else {
                        $distSelected = $selectedStation['properties']['distance'] ?? PHP_INT_MAX;
                        $distTown = $feature['properties']['distance'] ?? PHP_INT_MAX;
                        if ($distTown < $distSelected) {
                            $selectedStation = $feature;
                        }
                    }
                    break; // The first valid one is the closest
                }
            }
        }

        // Fallback or compare with the closest railway_station category result
        $railStation = $rawResults['train_station_rail'][0] ?? null;
        if ($railStation) {
            if (!$selectedStation) {
                $selectedStation = $railStation;
            } else {
                $distSelected = $selectedStation['properties']['distance'] ?? PHP_INT_MAX;
                $distRail = $railStation['properties']['distance'] ?? PHP_INT_MAX;
                if ($distRail < $distSelected) {
                    $selectedStation = $railStation;
                }
            }
        }

        if ($selectedStation && isset($selectedStation['geometry']['coordinates'])) {
            $poiLng = $selectedStation['geometry']['coordinates'][0];
            $poiLat = $selectedStation['geometry']['coordinates'][1];
            $name = $selectedStation['properties']['name'] ?? '';

            // Format name: append " Station" if name is short/does not contain station keywords
            $nameLower = strtolower($name);
            if (strpos($nameLower, 'station') === false && strpos($nameLower, 'underground') === false && strpos($nameLower, 'dlr') === false) {
                $name .= ' Station';
            }

            $distance = $this->calculateDistance($lat, $lng, $poiLat, $poiLng);

            $results['train_station'] = [
                'name'           => $name,
                'lat'            => $poiLat,
                'lng'            => $poiLng,
                'distance_miles' => $distance
            ];
        }

        return $results;
    }

     /**
     * Determine if a public transportation POI feature is a valid train station in the UK.
     *
     * @param array $feature
     * @param string|null $townCity
     * @return bool
     */
    private function isValidTrainStation(array $feature, ?string $townCity = null): bool
    {
        $properties = $feature['properties'] ?? [];
        $categoryIds = $properties['poi_category_ids'] ?? [];
        $maki = $properties['maki'] ?? '';
        $name = $properties['name'] ?? '';
        $website = $properties['metadata']['website'] ?? '';

        // 1. Explicit categories
        if (in_array('railway_station', $categoryIds) || in_array('light_rail_station', $categoryIds)) {
            return true;
        }

        // 2. Rail-related maki icons
        if (in_array($maki, ['rail', 'rail-light', 'rail-metro'])) {
            return true;
        }

        // 3. Known rail-related websites
        if (!empty($website)) {
            $websiteLower = strtolower($website);
            $railKeywords = [
                'railway', 'nationalrail', 'gwr.com', 'lner', 'avanti', 
                'thameslink', 'southernrail', 'southeastern', 'chiltern', 
                'c2c', 'merseyrail', 'northernrail', 'tpexpress', 
                'crosscountry', 'tfw.wales', 'scotrail', 'tfl.gov', 
                'networkrail', 'train'
            ];
            foreach ($railKeywords as $keyword) {
                if (strpos($websiteLower, $keyword) !== false) {
                    return true;
                }
            }
        }

        // 4. Name contains station (but not bus/coach/taxi)
        $nameLower = strtolower($name);
        if (strpos($nameLower, 'station') !== false || strpos($nameLower, 'railway') !== false) {
            if (strpos($nameLower, 'bus') === false && strpos($nameLower, 'coach') === false && strpos($nameLower, 'taxi') === false) {
                return true;
            }
        }

        // 5. If townCity is provided, and the feature is a transit station named exactly after the town
        if ($townCity) {
            $townLower = strtolower(trim($townCity));
            if (!empty($townLower) && strtolower(trim($name)) === $townLower) {
                if (in_array('public_transportation_station', $categoryIds) || in_array('bus_stop', $categoryIds) || in_array('transportation', $categoryIds)) {
                    return true;
                }
            }
        }

        return false;
    }

    /**
     * Calculate Haversine distance in miles.
     */
    public function calculateDistance(float $lat1, float $lng1, float $lat2, float $lng2): float
    {
        $earthRadius = 3959; // Miles

        $latDelta = deg2rad($lat2 - $lat1);
        $lngDelta = deg2rad($lng2 - $lng1);

        $a = sin($latDelta / 2) * sin($latDelta / 2) +
             cos(deg2rad($lat1)) * cos(deg2rad($lat2)) *
             sin($lngDelta / 2) * sin($lngDelta / 2);

        $c = 2 * atan2(sqrt($a), sqrt(1 - $a));

        return round($earthRadius * $c, 4);
    }
}
