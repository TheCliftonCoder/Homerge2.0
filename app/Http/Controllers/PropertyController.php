<?php

namespace App\Http\Controllers;

use App\Models\GeneralProperty;
use App\Models\ResidentialProperty;
use App\Models\CommercialProperty;
use App\Models\SalesProperty;
use App\Models\RentalProperty;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;
use App\Services\GeocodingService;
use App\Services\IsochroneService;
use Inertia\Inertia;
use Inertia\Response;

class PropertyController extends Controller
{
    public function __construct(
        private GeocodingService $geocoder,
        private IsochroneService $isochrone
    ) {
    }

    /**
     * Display all properties (public page).
     */
    public function index(): Response
    {
        $properties = GeneralProperty::with(['agent', 'images', 'propertyCategory.transaction'])
            ->orderBy('created_at', 'desc')
            ->get();

        return Inertia::render('Properties/Index', [
            'properties' => $properties,
        ]);
    }

    /**
     * Show the form for creating a new property.
     */
    public function create(): Response
    {
        return Inertia::render('Properties/Create');
    }

    /**
     * Display a single property with all details.
     */
    public function show(Request $request, GeneralProperty $property): Response
    {
        $property->load(['agent', 'images', 'propertyCategory.transaction', 'poiCache']);

        // Check if the authenticated user has already enquired about this property
        $hasEnquired = false;
        if (Auth::check() && Auth::user()->role === 'applicant') {
            $hasEnquired = Auth::user()
                ->propertyEnquiries()
                ->where('general_property_id', $property->id)
                ->exists();
        }

        // Parse query params and resolve pins
        $resolvedPins = [];
        $locationContext = $request->location ? ", " . $request->location : "";
        $pins = [];

        if ($request->filled('proximity_pins')) {
            $rawPins = is_array($request->proximity_pins) ? $request->proximity_pins : json_decode($request->proximity_pins, true);
            if (is_array($rawPins)) {
                $pins = $this->normalizeProximityFilters($rawPins);
                foreach ($pins as $pin) {
                    if (empty($pin['query'])) continue;
                    $queryText = $pin['query'] . $locationContext;
                    $coords = $this->geocoder->geocodeAddress($queryText);
                    if ($coords) {
                        $pinType = $pin['type'] ?? 'commute';
                        if ($pinType === 'commute') {
                            $resolvedPins[] = [
                                'type' => 'commute',
                                'label' => $pin['label'] ?? null,
                                'query' => $pin['query'],
                                'resolved_name' => $coords['resolved_name'],
                                'lat' => $coords['lat'],
                                'lng' => $coords['lng'],
                                'mode' => $pin['mode'] ?? 'driving',
                                'minutes' => (int) (!empty($pin['value']) ? $pin['value'] : 20),
                                'display' => isset($pin['display']) ? filter_var($pin['display'], FILTER_VALIDATE_BOOLEAN) : false,
                                'pin_mode' => $pin['pin_mode'] ?? 'filter'
                            ];
                        } else {
                            $resolvedPins[] = [
                                'type' => 'radius',
                                'label' => $pin['label'] ?? null,
                                'query' => $pin['query'],
                                'resolved_name' => $coords['resolved_name'],
                                'lat' => $coords['lat'],
                                'lng' => $coords['lng'],
                                'max_miles' => (float) (!empty($pin['value']) ? $pin['value'] : 1.0),
                                'display' => isset($pin['display']) ? filter_var($pin['display'], FILTER_VALIDATE_BOOLEAN) : false,
                                'pin_mode' => $pin['pin_mode'] ?? 'filter'
                            ];
                        }
                    }
                }
            }
        }

        $poiProximity = [];
        if ($request->filled('poi_proximity')) {
            $poiFilters = is_array($request->poi_proximity) ? $request->poi_proximity : json_decode($request->poi_proximity, true);
            if (is_array($poiFilters)) {
                $poiProximity = $this->normalizeProximityFilters($poiFilters);
            }
        }

        return Inertia::render('Properties/Show', [
            'property' => $property,
            'hasEnquired' => $hasEnquired,
            'filters' => [
                'poi_proximity' => $poiProximity,
                'proximity_pins' => $pins,
            ],
            'resolvedPins' => $resolvedPins,
        ]);
    }

    /**
     * Search properties with filters.
     */
    public function search(Request $request): Response
    {
        $isDebug = (bool) config('app.debug');
        $normalizedFilters = $request->all();
        $debugLogs = [
            'location_geocoding' => null,
            'pins_geocoding' => [],
            'sql_queries' => [],
        ];
        if ($isDebug) {
            DB::enableQueryLog();
        }

        $query = GeneralProperty::with(['agent', 'images', 'propertyCategory.transaction', 'poiCache']);

        $geocodingError = null;
        $searchCoords = null;

        // Basic Filters
        if ($request->filled('location')) {
            if ($request->filled('radius') && floatval($request->radius) > 0) {
                $coords = $this->geocoder->geocode($request->location);
                if (isset($coords['lat']) && isset($coords['lng'])) {
                    $radiusMiles = (float) $request->radius;
                    $lat = $coords['lat'];
                    $lng = $coords['lng'];

                    $searchCoords = $coords;

                    $latRange = $radiusMiles / 69.0;
                    $lngRange = $radiusMiles / abs(cos(deg2rad($lat)) * 69.0);
                    
                    $query->whereBetween('latitude', [$lat - $latRange, $lat + $latRange])
                          ->whereBetween('longitude', [$lng - $lngRange, $lng + $lngRange]);

                    // Use an equirectangular approximation for SQLite sorting 
                    // distance squared approx = (dLat)^2 + (dLon * cos(lat))^2
                    $cosLat = cos(deg2rad($lat));
                    $cosLat2 = $cosLat * $cosLat;

                    $query->select('general_properties.*');
                    $query->selectRaw(
                        '((latitude - ?) * (latitude - ?) + (longitude - ?) * (longitude - ?) * ?) AS distance_approx',
                        [$lat, $lat, $lng, $lng, $cosLat2]
                    );
                } else {
                    $geocodingError = $coords['error'] ?? 'Location not recognised. Showing fallback keyword results instead.';
                    $query->where('location', 'like', '%' . $request->location . '%');
                    $query->select('general_properties.*');
                }
            } else {
                $query->where('location', 'like', '%' . $request->location . '%');
                $query->select('general_properties.*');
            }
        } else {
            $query->select('general_properties.*');
        }

        if ($request->filled('min_price')) {
            $query->where('price', '>=', $request->min_price);
        }

        if ($request->filled('max_price')) {
            $query->where('price', '<=', $request->max_price);
        }

        if ($request->filled('property_category')) {
            $query->where('property_category_type', 'like', '%' . $request->property_category . '%');
        }

        // Size filters
        if ($request->filled('min_size')) {
            $query->where('size_sqft', '>=', $request->min_size);
        }

        if ($request->filled('max_size')) {
            $query->where('size_sqft', '<=', $request->max_size);
        }

        // Category-specific filters (Residential)
        if ($request->filled('bedrooms')) {
            $query->whereHas('propertyCategory', function ($q) use ($request) {
                $q->where('property_category_type', 'like', '%ResidentialProperty%')
                    ->where('bedrooms', '>=', $request->bedrooms);
            });
        }

        if ($request->filled('bathrooms')) {
            $query->whereHas('propertyCategory', function ($q) use ($request) {
                $q->where('property_category_type', 'like', '%ResidentialProperty%')
                    ->where('bathrooms', '>=', $request->bathrooms);
            });
        }

        if ($request->filled('parking')) {
            $query->whereHas('propertyCategory', function ($q) use ($request) {
                $q->where('property_category_type', 'like', '%ResidentialProperty%')
                    ->where('parking', $request->parking);
            });
        }

        if ($request->filled('garden')) {
            $query->whereHas('propertyCategory', function ($q) use ($request) {
                $q->where('property_category_type', 'like', '%ResidentialProperty%')
                    ->where('garden', $request->garden === 'true' || $request->garden === '1');
            });
        }

        if ($request->filled('property_type')) {
            $query->whereHas('propertyCategory', function ($q) use ($request) {
                $q->where('property_type', $request->property_type);
            });
        }

        // Transaction-specific filters
        if ($request->filled('transaction_type')) {
            $query->whereHas('propertyCategory.transaction', function ($q) use ($request) {
                $q->where('transaction_type', 'like', '%' . $request->transaction_type . '%');
            });
        }

        // Sales-specific filters
        if ($request->filled('tenure')) {
            $query->whereHas('propertyCategory.transaction', function ($q) use ($request) {
                $q->where('transaction_type', 'like', '%SalesProperty%')
                    ->where('tenure', $request->tenure);
            });
        }

        // Rental-specific filters
        if ($request->filled('furnished')) {
            $query->whereHas('propertyCategory.transaction', function ($q) use ($request) {
                $q->where('transaction_type', 'like', '%RentalProperty%')
                    ->where('furnished', $request->furnished);
            });
        }

        if ($request->filled('pets_allowed')) {
            $query->whereHas('propertyCategory.transaction', function ($q) use ($request) {
                $q->where('transaction_type', 'like', '%RentalProperty%')
                    ->where('pets_allowed', $request->pets_allowed === 'true' || $request->pets_allowed === '1');
            });
        }

        if ($request->filled('available_from')) {
            $query->whereHas('propertyCategory.transaction', function ($q) use ($request) {
                $q->where('transaction_type', 'like', '%RentalProperty%')
                    ->where('available_date', '>=', $request->available_from);
            });
        }

        // POI Proximity Filters (Mode 1)
        if ($request->filled('poi_proximity')) {
            $poiFilters = is_array($request->poi_proximity) ? $request->poi_proximity : json_decode($request->poi_proximity, true);
            if (is_array($poiFilters)) {
                $poiFilters = $this->normalizeProximityFilters($poiFilters);
                $normalizedFilters['poi_proximity'] = $poiFilters;
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

        // Proximity Pins (Mode 2 & 3 Unified)
        $resolvedPins = [];
        $geocodingErrors = [];
        $locationContext = $request->location ? ", " . $request->location : "";
        $commutePinFilters = [];
        $radiusPinFilters = [];

        if ($request->filled('proximity_pins')) {
            $pins = is_array($request->proximity_pins) ? $request->proximity_pins : json_decode($request->proximity_pins, true);
            if (is_array($pins)) {
                $pins = $this->normalizeProximityFilters($pins);
                $normalizedFilters['proximity_pins'] = $pins;
                foreach ($pins as $pin) {
                    if (empty($pin['query'])) continue;

                    // Append location context to improve geocoding accuracy for local landmarks
                    $queryText = $pin['query'] . $locationContext;
                    $coords = $this->geocoder->geocodeAddress($queryText);

                    if (!$coords) {
                        $geocodingErrors[] = "Could not find landmark: \"{$pin['query']}\"";
                        continue;
                    }

                    $pinType = $pin['type'] ?? 'commute'; // Default to commute if not specified
                    $isFilter = !isset($pin['pin_mode']) || $pin['pin_mode'] === 'filter';

                    if ($isDebug) {
                        $pinDebug = [
                            'query' => $pin['query'],
                            'query_text' => $queryText,
                            'resolved_coords' => $coords,
                            'type' => $pinType,
                        ];
                    }

                    if ($pinType === 'commute') {
                        $mode = $pin['mode'] ?? 'driving';
                        $mins = (int) (!empty($pin['value']) ? $pin['value'] : 20);
                        if ($mins > 60) {
                            $geocodingErrors[] = "Commute time for '{$pin['query']}' cannot exceed 60 minutes. It has been automatically capped at 60 minutes.";
                            $mins = 60;
                        }
                        
                        $isoPolygons = $this->isochrone->getPolygons($coords['lat'], $coords['lng'], $mode, $mins);
                        
                        if ($isDebug) {
                            $pinDebug['commute_params'] = [
                                'mode' => $mode,
                                'minutes' => $mins,
                                'polygons_found' => !empty($isoPolygons),
                            ];
                        }

                        if ($isoPolygons) {
                            if ($isFilter) {
                                $commutePinFilters[] = [
                                    'polygons' => $isoPolygons,
                                    'mode' => $mode,
                                    'minutes' => $mins,
                                    'label' => $pin['label'] ?? null,
                                    'query' => $pin['query']
                                ];
                            }

                            $resolvedPins[] = [
                                'type' => 'commute',
                                'label' => $pin['label'] ?? null,
                                'query' => $pin['query'],
                                'resolved_name' => $coords['resolved_name'],
                                'lat' => $coords['lat'],
                                'lng' => $coords['lng'],
                                'mode' => $mode,
                                'minutes' => $mins,
                                'display' => isset($pin['display']) ? filter_var($pin['display'], FILTER_VALIDATE_BOOLEAN) : false,
                                'pin_mode' => $pin['pin_mode'] ?? 'filter'
                            ];
                        }
                    } else {
                        // Radius / Distance pin
                        $radius = (float) (!empty($pin['value']) ? $pin['value'] : 1.0);

                        if ($isDebug) {
                            $pinDebug['radius_params'] = [
                                'radius_miles' => $radius,
                            ];
                        }

                        if ($isFilter) {
                            $radiusPinFilters[] = [
                                'lat' => $coords['lat'],
                                'lng' => $coords['lng'],
                                'radius' => $radius,
                                'label' => $pin['label'] ?? null,
                                'query' => $pin['query']
                            ];
                        }

                        $resolvedPins[] = [
                            'type' => 'radius',
                            'label' => $pin['label'] ?? null,
                            'query' => $pin['query'],
                            'resolved_name' => $coords['resolved_name'],
                            'lat' => $coords['lat'],
                            'lng' => $coords['lng'],
                            'max_miles' => $radius,
                            'display' => isset($pin['display']) ? filter_var($pin['display'], FILTER_VALIDATE_BOOLEAN) : false,
                            'pin_mode' => $pin['pin_mode'] ?? 'filter'
                        ];

                        if ($isFilter) {
                            // Apply a SQL bounding box pre-filter for performance
                            $latRange = $radius / 69.0;
                            $lngRange = $radius / abs(cos(deg2rad($coords['lat'])) * 69.0);
                            $query->whereBetween('latitude', [$coords['lat'] - $latRange, $coords['lat'] + $latRange])
                                  ->whereBetween('longitude', [$coords['lng'] - $lngRange, $coords['lng'] + $lngRange]);
                        }
                    }

                    if ($isDebug) {
                        $debugLogs['pins_geocoding'][] = $pinDebug;
                    }

                    // If we have no primary location searchCoords, use the first pin as the result anchor
                    if ($searchCoords === null) {
                        $searchCoords = $coords;
                    }
                }
            }
        }

        // Order by distance if available, otherwise most recent
        if ($request->filled('location') && $request->filled('radius') && floatval($request->radius) > 0 && empty($geocodingError)) {
            $query->orderBy('distance_approx', 'asc');
        } else {
            $query->orderBy('created_at', 'desc');
        }

        // 1. Initial SQL Pagination
        $perPage = 12;
        $page = $request->input('page', 1);

        // Decide if we need manual collection-level filtering (if pins are present)
        $requiresManualFiltering = !empty($commutePinFilters) || !empty($radiusPinFilters);

        if ($requiresManualFiltering) {
            // Pre-filter with a broad bounding box if any commute pins exist
            if (!empty($commutePinFilters)) {
                $firstIso = $commutePinFilters[0];
                $isoCoords = $this->geocoder->geocodeAddress($firstIso['query']);
                if ($isoCoords) {
                    $query->whereBetween('latitude', [$isoCoords['lat'] - 1.0, $isoCoords['lat'] + 1.0])
                          ->whereBetween('longitude', [$isoCoords['lng'] - 1.0, $isoCoords['lng'] + 1.0]);
                }
            }

            // Fetch ALL matching candidates for precise testing
            $allCandidates = $query->get();

            // Calculate exact distance for result display (anchored to searchCoords)
            if ($searchCoords !== null) {
                $lat = $searchCoords['lat'];
                $lng = $searchCoords['lng'];
                $allCandidates->transform(function ($property) use ($lat, $lng) {
                    if (!$property->latitude || !$property->longitude) return $property;
                    $earthRadius = 3959; 
                    $dLat = deg2rad($property->latitude - $lat);
                    $dLon = deg2rad($property->longitude - $lng);
                    $a = sin($dLat/2) * sin($dLat/2) + cos(deg2rad($lat)) * cos(deg2rad($property->latitude)) * sin($dLon/2) * sin($dLon/2);
                    $c = 2 * asin(sqrt($a));
                    $property->setAttribute('distance_miles', $earthRadius * $c);
                    return $property;
                });
            }

            // Apply intersection filtering (Property must satisfy ALL pins)
            $filtered = $allCandidates->filter(function ($property) use ($commutePinFilters, $radiusPinFilters) {
                if (!$property->latitude || !$property->longitude) return false;

                // Check all commutes (Isochrones)
                foreach ($commutePinFilters as $cpf) {
                    if (!$this->isochrone->isPointInRange($property->latitude, $property->longitude, $cpf['polygons']['offpeak'])) {
                        return false;
                    }
                }

                // Check all Radii (Haversine precision)
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
            })->values();

            // Manual Pagination
            $totalCount = $filtered->count();
            $pagedItems = $filtered->forPage($page, $perPage)->values();

            $properties = new \Illuminate\Pagination\LengthAwarePaginator(
                $pagedItems, $totalCount, $perPage, $page,
                ['path' => $request->url(), 'query' => $request->query()]
            );
        } else {
            // Standard SQL Pagination
            $properties = $query->paginate($perPage)->withQueryString();

            if ($searchCoords !== null) {
                $lat = $searchCoords['lat'];
                $lng = $searchCoords['lng'];
                $properties->getCollection()->transform(function ($property) use ($lat, $lng) {
                    if (!$property->latitude || !$property->longitude) return $property;
                    $earthRadius = 3959;
                    $dLat = deg2rad($property->latitude - $lat);
                    $dLon = deg2rad($property->longitude - $lng);
                    $a = sin($dLat/2) * sin($dLat/2) + cos(deg2rad($lat)) * cos(deg2rad($property->latitude)) * sin($dLon/2) * sin($dLon/2);
                    $c = 2 * asin(sqrt($a));
                    $property->setAttribute('distance_miles', $earthRadius * $c);
                    return $property;
                });
            }
        }

        if ($isDebug) {
            $queries = DB::getQueryLog();
            foreach ($queries as $queryInfo) {
                $debugLogs['sql_queries'][] = [
                    'sql' => $queryInfo['query'],
                    'bindings' => $queryInfo['bindings'],
                    'time_ms' => $queryInfo['time'],
                ];
            }
        }

        return Inertia::render('Properties/Search', [
            'properties' => $properties,
            'filters' => $normalizedFilters,
            'geocodingError' => $geocodingError,
            'geocodingErrors' => $geocodingErrors,
            'resolvedPins' => $resolvedPins,
            'appDebug' => $isDebug,
            'debugInfo' => $isDebug ? $debugLogs : null,
        ]);
    }

    /**
     * Resiliently parse proximity filters that might have been mangled/split in the URL.
     * e.g. [0 => {query: "X"}, 1 => {max_miles: 1}] -> [0 => {query: "X", max_miles: 1}]
     */
    private function normalizeProximityFilters(array $filters): array
    {
        $normalized = [];
        $temp = [];
        
        foreach ($filters as $item) {
            foreach ($item as $key => $value) {
                // If this key already exists in our temp object, it belongs to the next "row"
                // OR if it's a completely different PIN object
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


    /**
     * Store a newly created property.
     */
    public function store(Request $request): RedirectResponse
    {
        try {
            // Base validation with custom error messages
            $validated = $request->validate([
                'name' => 'required|string|max:255',
                'price' => 'required|numeric|min:0',
                'building_name_number' => 'nullable|string|max:255',
                'street_address' => 'required|string|max:255',
                'town_city' => 'required|string|max:255',
                'postcode' => 'required|string|max:20',
                'size_sqft' => 'required|integer|min:1',
                'description' => 'nullable|string',
                'property_category' => 'required|in:residential,commercial',
                'transaction_type' => 'required|in:sale,rental',
                'images' => 'nullable|array|max:10',
                'images.*' => 'image|mimes:jpeg,png,jpg|max:5120', // 5MB per image
            ], [
                'images.*.max' => 'Each image must not exceed 5MB.',
                'images.*.image' => 'All files must be valid images.',
                'images.*.mimes' => 'Images must be in JPEG, PNG, or JPG format.',
                'images.max' => 'You can upload a maximum of 10 images.',
            ]);

            // Category-specific validation
            if ($validated['property_category'] === 'residential') {
                $categoryData = $request->validate([
                    'bedrooms' => 'required|integer|min:0',
                    'bathrooms' => 'required|integer|min:0',
                    'council_tax_band' => 'nullable|string|max:1',
                    'parking' => 'required|in:none,street,driveway,garage',
                    'garden' => 'required|boolean',
                    'property_type' => 'required|in:detached,semi_detached,terraced,flat,bungalow',
                    'access' => 'nullable|string',
                ]);
            }
            else {
                $categoryData = $request->validate([
                    'property_type' => 'required|in:retail,leisure,industrial,land_development,other',
                ]);
            }

            // Transaction-specific validation
            if ($validated['transaction_type'] === 'sale') {
                $transactionData = $request->validate([
                    'tenure' => 'required|in:freehold,leasehold,share_of_freehold',
                    'lease_years_remaining' => 'nullable|integer|min:0',
                    'ground_rent' => 'nullable|numeric|min:0',
                    'service_charge' => 'nullable|numeric|min:0',
                ]);
            }
            else {
                $transactionData = $request->validate([
                    'available_date' => 'required|date',
                    'deposit' => 'required|numeric|min:0',
                    'min_tenancy_months' => 'required|integer|min:1',
                    'let_type' => 'required|in:long_term,short_term,corporate',
                    'furnished' => 'required|in:unfurnished,part_furnished,furnished',
                    'bills_included' => 'required|boolean',
                    'pets_allowed' => 'required|boolean',
                ]);
            }

            // Create property in transaction
            
            $fullAddress = trim(($validated['building_name_number'] ?? '') . ' ' . $validated['street_address'] . ', ' . $validated['town_city'] . ', ' . $validated['postcode']);
            $coords = $this->geocoder->geocode($fullAddress);
            $lat = isset($coords['lat']) ? $coords['lat'] : null;
            $lng = isset($coords['lng']) ? $coords['lng'] : null;
            $geocodedAt = ($lat !== null) ? now() : null;

            DB::transaction(function () use ($validated, $categoryData, $transactionData, $request, $lat, $lng, $geocodedAt) {
                // 1. Create transaction record (Sales or Rental)
                if ($validated['transaction_type'] === 'sale') {
                    $transaction = SalesProperty::create($transactionData);
                    $transactionType = SalesProperty::class;
                }
                else {
                    $transaction = RentalProperty::create($transactionData);
                    $transactionType = RentalProperty::class;
                }

                // 2. Create category record (Residential or Commercial)
                $categoryData['transaction_type'] = $transactionType;
                $categoryData['transaction_id'] = $transaction->id;

                if ($validated['property_category'] === 'residential') {
                    $category = ResidentialProperty::create($categoryData);
                    $categoryType = ResidentialProperty::class;
                }
                else {
                    $category = CommercialProperty::create($categoryData);
                    $categoryType = CommercialProperty::class;
                }

                // 3. Create general property record
                $generalProperty = GeneralProperty::create([
                    'agent_id' => Auth::id(),
                    'name' => $validated['name'],
                    'location' => $validated['town_city'],
                    'building_name_number' => $validated['building_name_number'] ?? null,
                    'street_address' => $validated['street_address'],
                    'town_city' => $validated['town_city'],
                    'postcode' => $validated['postcode'],
                    'price' => $validated['price'],
                    'size_sqft' => $validated['size_sqft'],
                    'description' => $validated['description'] ?? null,
                    'property_category_type' => $categoryType,
                    'property_category_id' => $category->id,
                    'latitude' => $lat,
                    'longitude' => $lng,
                    'geocoded_at' => $geocodedAt,
                ]);

                // 4. Handle image uploads
                if ($request->hasFile('images')) {
                    foreach ($request->file('images') as $index => $image) {
                        if (!$image->isValid()) {
                            throw new \Exception('One or more images failed to upload. Please check file sizes and formats.');
                        }

                        $path = $image->store('properties/' . $generalProperty->id, 'public');
                        $generalProperty->images()->create([
                            'image_path' => $path,
                            'order' => $index + 1,
                        ]);
                    }
                }
            });

            return redirect()->route('properties.my')->with('success', 'Property listed successfully!');

        }
        catch (\Illuminate\Validation\ValidationException $e) {
            // Validation errors are automatically handled by Laravel
            throw $e;
        }
        catch (\Exception $e) {
            // Log the error for debugging
            Log::error('Property creation failed: ' . $e->getMessage(), [
                'user_id' => Auth::id(),
                'trace' => $e->getTraceAsString()
            ]);

            return back()
                ->withInput()
                ->withErrors(['error' => 'Failed to create property: ' . $e->getMessage() . ' Please check your images are under 5MB each and try again.']);
        }
    }

    /**
     * Display the agent's properties.
     */
    public function myProperties(): Response
    {
        $properties = GeneralProperty::with(['images', 'propertyCategory.transaction'])
            ->where('agent_id', Auth::id())
            ->orderBy('created_at', 'desc')
            ->get();

        return Inertia::render('Properties/MyProperties', [
            'properties' => $properties,
        ]);
    }

    /**
     * Show the form for editing a property.
     */
    public function edit(GeneralProperty $property): Response
    {
        // Authorization check
        if ($property->agent_id !== Auth::id()) {
            abort(403, 'Unauthorized action.');
        }

        $property->load(['images', 'propertyCategory.transaction']);

        return Inertia::render('Properties/Edit', [
            'property' => $property,
        ]);
    }

    /**
     * Update the specified property.
     */
    public function update(Request $request, GeneralProperty $property): RedirectResponse
    {
        // Authorization check
        if ($property->agent_id !== Auth::id()) {
            abort(403, 'Unauthorized action.');
        }

        // Base validation
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'price' => 'required|numeric|min:0',
            'building_name_number' => 'nullable|string|max:255',
            'street_address' => 'required|string|max:255',
            'town_city' => 'required|string|max:255',
            'postcode' => 'required|string|max:20',
            'size_sqft' => 'required|integer|min:1',
            'description' => 'nullable|string',
            'images' => 'nullable|array',
            'images.*' => 'image|mimes:jpeg,png,jpg|max:2048',
        ]);

        $fullAddress = trim(($validated['building_name_number'] ?? '') . ' ' . $validated['street_address'] . ', ' . $validated['town_city'] . ', ' . $validated['postcode']);
        $coords = $this->geocoder->geocode($fullAddress);
        $lat = isset($coords['lat']) ? $coords['lat'] : null;
        $lng = isset($coords['lng']) ? $coords['lng'] : null;
        $geocodedAt = ($lat !== null) ? now() : null;

        DB::transaction(function () use ($property, $validated, $request, $lat, $lng, $geocodedAt) {
            // Update general property
            $updateData = [
                'name' => $validated['name'],
                'location' => $validated['town_city'],
                'building_name_number' => $validated['building_name_number'] ?? null,
                'street_address' => $validated['street_address'],
                'town_city' => $validated['town_city'],
                'postcode' => $validated['postcode'],
                'price' => $validated['price'],
                'size_sqft' => $validated['size_sqft'],
                'description' => $validated['description'] ?? null,
            ];
            
            if ($lat !== null) {
                $updateData['latitude'] = $lat;
                $updateData['longitude'] = $lng;
                $updateData['geocoded_at'] = $geocodedAt;
            }
            
            $property->update($updateData);

            // Handle new image uploads
            if ($request->hasFile('images')) {
                $currentImageCount = $property->images()->count();
                $newImagesCount = count($request->file('images'));

                if ($currentImageCount + $newImagesCount > 10) {
                    return back()->withErrors(['images' => 'Cannot exceed 10 images per property.']);
                }

                foreach ($request->file('images') as $index => $image) {
                    $path = $image->store('properties/' . $property->id, 'public');
                    $property->images()->create([
                        'image_path' => $path,
                        'order' => $currentImageCount + $index + 1,
                    ]);
                }
            }
        });

        return redirect()->route('properties.my')->with('success', 'Property updated successfully!');
    }

    /**
     * Remove the specified property.
     */
    public function destroy(GeneralProperty $property): RedirectResponse
    {
        // Authorization check
        if ($property->agent_id !== Auth::id()) {
            abort(403, 'Unauthorized action.');
        }

        DB::transaction(function () use ($property) {
            // Delete all images from storage
            foreach ($property->images as $image) {
                Storage::disk('public')->delete($image->image_path);
            }

            // Delete property directory
            $directory = 'properties/' . $property->id;
            if (Storage::disk('public')->exists($directory)) {
                Storage::disk('public')->deleteDirectory($directory);
            }

            // Delete images from database
            $property->images()->delete();

            // Load relationships before deletion
            $category = $property->propertyCategory;
            if ($category) {
                $transaction = $category->transaction;

                // Delete in reverse order: general -> category -> transaction
                $property->delete();
                $category->delete();
                if ($transaction) {
                    $transaction->delete();
                }
            }
            else {
                $property->delete();
            }
        });

        return redirect()->route('properties.my')->with('success', 'Property deleted successfully!');
    }

    /**
     * Delete a single image from a property.
     */
    public function deleteImage(GeneralProperty $property, $imageId): RedirectResponse
    {
        // Authorization check
        if ($property->agent_id !== Auth::id()) {
            abort(403, 'Unauthorized action.');
        }

        $image = $property->images()->findOrFail($imageId);

        // Delete file from storage
        Storage::disk('public')->delete($image->image_path);

        // Delete from database
        $image->delete();

        return back()->with('success', 'Image deleted successfully!');
    }
}
