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
        Schema::create('property_enquiries', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('general_property_id')->constrained()->onDelete('cascade');
            $table->text('message')->nullable();
            $table->dateTime('preferred_date')->nullable();
            $table->string('contact_phone', 20)->nullable();
            $table->timestamps();

            // Index for faster queries
            $table->index(['user_id', 'general_property_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('property_enquiries');
    }
};
