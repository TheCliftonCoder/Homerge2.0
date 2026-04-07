<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\GeneralProperty;
use App\Services\GeocodingService;
use Illuminate\Support\Facades\Log;

class GeocodeExistingPropertiesSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(GeocodingService $geocoder): void
    {
        $properties = GeneralProperty::whereNull('latitude')->get();
        
        $this->command->info("Found {$properties->count()} properties without coordinates.");

        foreach ($properties as $property) {
            $this->command->info("Geocoding {$property->name} ({$property->location})...");
            
            $fullAddress = trim(($property->building_name_number ?? '') . ' ' . $property->street_address . ', ' . $property->town_city . ', ' . $property->postcode);
            if (empty($property->street_address) && empty($property->postcode)) {
                $fullAddress = $property->location;
            }
            $coords = $geocoder->geocode($fullAddress);
            
            if (isset($coords['lat']) && isset($coords['lng'])) {
                $property->update([
                    'latitude' => $coords['lat'],
                    'longitude' => $coords['lng'],
                    'geocoded_at' => now(),
                ]);
                $this->command->info("✓ Success");
            } else {
                $error = $coords['error'] ?? 'Unknown error';
                $this->command->error("✗ Failed: {$error}");
            }
            
            // Sleep to avoid hitting Mapbox free tier limits aggressively (e.g. 50 calls per minute)
            usleep(300000); // 300ms
        }
        
        $this->command->info('Geocoding complete.');
    }
}
