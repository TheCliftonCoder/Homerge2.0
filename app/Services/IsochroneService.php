<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

class IsochroneService
{
    /**
     * Get peak and off-peak isochrones from Mapbox.
     * 
     * @param float $lat
     * @param float $lng
     * @param string $mode 'driving', 'walking', or 'cycling'
     * @param int $minutes
     * @return array ['offpeak' => GeoJSON, 'peak' => GeoJSON]
     */
    public function getPolygons(float $lat, float $lng, string $mode, int $minutes): array
    {
        $token = config('services.mapbox.token');
        
        if (empty($token)) {
            Log::error("Mapbox token is missing.");
            return [];
        }

        // Standardize profile names for Mapbox
        $profile = match($mode) {
            'driving' => 'driving',
            'walking' => 'walking',
            'cycling' => 'cycling',
            default => 'walking'
        };

        // If driving, fetch both peak and off-peak
        if ($profile === 'driving') {
            return [
                'offpeak' => $this->fetchIsochrone($lat, $lng, $profile, $minutes, 'offpeak'),
                'peak'    => $this->fetchIsochrone($lat, $lng, $profile, $minutes, 'peak')
            ];
        }

        // For walking/cycling, one is enough
        $poly = $this->fetchIsochrone($lat, $lng, $profile, $minutes);
        return [
            'offpeak' => $poly,
            'peak'    => $poly
        ];
    }

    /**
     * Fetch a single isochrone with caching.
     */
    private function fetchIsochrone(float $lat, float $lng, string $profile, int $minutes, ?string $trafficType = null): ?array
    {
        $cacheKey = "isochrone:{$profile}:{$minutes}:{$lat}:{$lng}:" . ($trafficType ?? 'standard');
        
        return Cache::remember($cacheKey, now()->addDays(7), function () use ($lat, $lng, $profile, $minutes, $trafficType) {
            $token = config('services.mapbox.token');
            $params = [
                'contours_minutes' => $minutes,
                'polygons'         => 'true',
                'access_token'    => $token
            ];

            if ($profile === 'driving' && $trafficType) {
                // Off-peak: Next Monday at 10:00 AM
                // Peak: Next Monday at 08:00 AM
                $hour = ($trafficType === 'peak') ? 8 : 10;
                $timestamp = Carbon::now()->next(Carbon::MONDAY)->setTime($hour, 0)->toIso8601String();
                $params['depart_at'] = $timestamp;
            }

            try {
                $url = "https://api.mapbox.com/isochrone/v1/mapbox/{$profile}/{$lng},{$lat}";
                $response = Http::timeout(10)->get($url, $params);

                if ($response->successful()) {
                    return $response->json();
                }

                Log::error("Mapbox Isochrone Error: " . $response->body());
            } catch (\Exception $e) {
                Log::error("Mapbox Isochrone Exception: " . $e->getMessage());
            }

            return null;
        });
    }

    /**
     * Check if a property is within a GeoJSON polygon using Ray Casting.
     * 
     * @param float $lat
     * @param float $lng
     * @param array $isoData GeoJSON FeatureCollection
     * @return bool
     */
    public function isPointInRange(float $lat, float $lng, ?array $isoData): bool
    {
        if (!$isoData || !isset($isoData['features'][0]['geometry'])) {
            return false;
        }

        $geometry = $isoData['features'][0]['geometry'];
        
        if ($geometry['type'] === 'Polygon') {
            return $this->pointInPolygon($lat, $lng, $geometry['coordinates']);
        } elseif ($geometry['type'] === 'MultiPolygon') {
            foreach ($geometry['coordinates'] as $polygon) {
                if ($this->pointInPolygon($lat, $lng, $polygon)) {
                    return true;
                }
            }
        }

        return false;
    }

    /**
     * Ray Casting Algorithm.
     */
    private function pointInPolygon(float $lat, float $lng, array $rings): bool
    {
        // First ring is the external boundary
        $polygon = $rings[0];
        $inside = false;
        $j = count($polygon) - 1;

        for ($i = 0; $i < count($polygon); $i++) {
            if (
                (($polygon[$i][1] > $lat) != ($polygon[$j][1] > $lat)) &&
                ($lng < ($polygon[$j][0] - $polygon[$i][0]) * ($lat - $polygon[$i][1]) / ($polygon[$j][1] - $polygon[$i][1]) + $polygon[$i][0])
            ) {
                $inside = !$inside;
            }
            $j = $i;
        }

        // If inside the boundary, check if it's in any holes (other rings)
        if ($inside && count($rings) > 1) {
            for ($k = 1; $k < count($rings); $k++) {
                if ($this->pointInPolygon($lat, $lng, [$rings[$k]])) {
                    return false; // Point is in a hole
                }
            }
        }

        return $inside;
    }
}
