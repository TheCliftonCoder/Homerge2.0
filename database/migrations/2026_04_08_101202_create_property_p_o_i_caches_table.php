<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('property_poi_cache', function (Blueprint $table) {
            $table->id();
            $table->foreignId('general_property_id')->constrained('general_properties')->onDelete('cascade');
            $table->string('poi_type'); // Using string for flexibility, though plan said enum
            $table->string('name');
            $table->decimal('distance_miles', 8, 4);
            $table->decimal('latitude', 10, 7);
            $table->decimal('longitude', 10, 7);
            $table->timestamp('fetched_at');
            $table->timestamps();

            $table->index(['general_property_id', 'poi_type']);
            $table->index(['poi_type', 'distance_miles']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('property_poi_cache');
    }
};
