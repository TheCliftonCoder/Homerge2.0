<?php

namespace App\Console\Commands;

use App\Models\GeneralProperty;
use App\Jobs\ComputePropertyPOIJob;
use Illuminate\Console\Command;
use Carbon\Carbon;

class RefreshPropertyPOICommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'property-poi:refresh {--force : Force refresh even for recent caches}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Refresh missing or old POI computations for properties';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $force = $this->option('force');
        $threeWeeksAgo = Carbon::now()->subWeeks(3);

        $properties = GeneralProperty::with('poiCache')->get();
        $count = 0;

        foreach ($properties as $property) {
            $needsRefresh = false;

            if ($force || !$property->poiCache || $property->poiCache->isEmpty()) {
                $needsRefresh = true;
            } else {
                // Check if the oldest cache entry is older than 3 weeks
                $oldestCache = $property->poiCache->min('updated_at');
                if ($oldestCache && Carbon::parse($oldestCache)->lt($threeWeeksAgo)) {
                    $needsRefresh = true;
                }
            }

            if ($needsRefresh) {
                ComputePropertyPOIJob::dispatch($property);
                $this->line("Dispatching refresh for Property ID: {$property->id}");
                $count++;
            }
        }

        $this->info("Dispatched POI refresh jobs for {$count} properties.");
    }
}
