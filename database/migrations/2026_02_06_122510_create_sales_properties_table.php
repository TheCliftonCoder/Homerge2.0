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
        Schema::create('sales_properties', function (Blueprint $table) {
            $table->id();
            $table->enum('tenure', ['freehold', 'leasehold', 'share_of_freehold']);
            $table->integer('lease_years_remaining')->nullable(); // For leasehold properties
            $table->decimal('ground_rent', 10, 2)->nullable();
            $table->decimal('service_charge', 10, 2)->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('sales_properties');
    }
};
