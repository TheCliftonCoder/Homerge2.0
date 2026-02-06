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
        Schema::create('general_properties', function (Blueprint $table) {
            $table->id();
            $table->foreignId('agent_id')->constrained('users')->onDelete('cascade');
            $table->string('name');
            $table->string('location');
            $table->decimal('price', 12, 2);
            $table->integer('size_sqft');
            $table->text('description')->nullable();

            // Polymorphic relationship to category (Residential or Commercial)
            $table->string('property_category_type'); // 'App\Models\ResidentialProperty' or 'App\Models\CommercialProperty'
            $table->unsignedBigInteger('property_category_id');

            $table->timestamps();

            // Index for polymorphic relationship
            $table->index(['property_category_type', 'property_category_id']);
        });

        // Property images now reference general_properties
        Schema::create('property_images', function (Blueprint $table) {
            $table->id();
            $table->foreignId('general_property_id')->constrained('general_properties')->onDelete('cascade');
            $table->string('image_path');
            $table->integer('order');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('property_images');
        Schema::dropIfExists('general_properties');
    }
};
