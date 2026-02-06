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
        Schema::dropIfExists('property_images');
        Schema::dropIfExists('properties');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Recreate old tables if needed for rollback
        Schema::create('properties', function (Blueprint $table) {
            $table->id();
            $table->foreignId('agent_id')->constrained('users')->onDelete('cascade');
            $table->string('name');
            $table->decimal('price', 12, 2);
            $table->string('location');
            $table->integer('size_sqft');
            $table->timestamps();
        });

        Schema::create('property_images', function (Blueprint $table) {
            $table->id();
            $table->foreignId('property_id')->constrained()->onDelete('cascade');
            $table->string('image_path');
            $table->integer('order');
            $table->timestamps();
        });
    }
};
