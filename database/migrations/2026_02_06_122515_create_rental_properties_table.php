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
        Schema::create('rental_properties', function (Blueprint $table) {
            $table->id();
            $table->date('available_date');
            $table->decimal('deposit', 10, 2);
            $table->integer('min_tenancy_months');
            $table->enum('let_type', ['long_term', 'short_term', 'corporate']);
            $table->enum('furnished', ['unfurnished', 'part_furnished', 'furnished']);
            $table->boolean('bills_included')->default(false);
            $table->boolean('pets_allowed')->default(false);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('rental_properties');
    }
};
