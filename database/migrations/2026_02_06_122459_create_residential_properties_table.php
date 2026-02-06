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
        Schema::create('residential_properties', function (Blueprint $table) {
            $table->id();
            $table->integer('bedrooms');
            $table->integer('bathrooms');
            $table->string('council_tax_band')->nullable(); // A-H
            $table->enum('parking', ['none', 'street', 'driveway', 'garage'])->default('none');
            $table->boolean('garden')->default(false);
            $table->enum('property_type', ['detached', 'semi_detached', 'terraced', 'flat', 'bungalow']);
            $table->string('access')->nullable(); // Accessibility features

            // Polymorphic relationship to transaction (Sales or Rental)
            $table->string('transaction_type'); // 'App\Models\SalesProperty' or 'App\Models\RentalProperty'
            $table->unsignedBigInteger('transaction_id');

            $table->timestamps();

            // Index for polymorphic relationship
            $table->index(['transaction_type', 'transaction_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('residential_properties');
    }
};
