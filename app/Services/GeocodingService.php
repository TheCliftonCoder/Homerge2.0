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
}
