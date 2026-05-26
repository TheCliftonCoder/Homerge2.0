<?php

namespace App\Jobs;

use App\Models\GeneralProperty;
use App\Models\PropertyPOICache;
use App\Services\GeocodingService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class ComputePropertyPOIJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /**
     * Create a new job instance.
     */
    public function __construct(protected GeneralProperty $property)
    {
    }

    /**
     * Execute the job.
     */
    public function handle(GeocodingService $geocoder): void
    {
        if (!$this->property->latitude || !$this->property->longitude) {
            return;
        }

        $categories = [
            'train_station' => 'train station',
            'school'        => 'school',
            'hospital'      => 'hospital',
            'supermarket'   => 'supermarket',
            'gym'           => 'gym',
            'park'          => 'park',
        ];

        $results = $geocoder->findNearestPOIs(
            $this->property->latitude,
            $this->property->longitude,
            $categories,
            $this->property->town_city,
            $this->property->postcode
        );

        foreach ($results as $type => $data) {
            PropertyPOICache::updateOrCreate(
                [
                    'general_property_id' => $this->property->id,
                    'poi_type'            => $type,
                ],
                [
                    'name'           => $data['name'],
                    'distance_miles' => $data['distance_miles'],
                    'latitude'       => $data['lat'],
                    'longitude'      => $data['lng'],
                    'fetched_at'     => now(),
                ]
            );
        }
    }
}
