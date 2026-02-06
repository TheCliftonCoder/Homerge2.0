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
        Schema::create('commercial_properties', function (Blueprint $table) {
            $table->id();
            $table->enum('property_type', ['retail', 'leisure', 'industrial', 'land_development', 'other']);

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
        Schema::dropIfExists('commercial_properties');
    }
};
