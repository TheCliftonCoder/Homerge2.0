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
        Schema::table('general_properties', function (Blueprint $table) {
            $table->string('building_name_number')->nullable();
            $table->string('street_address')->nullable();
            $table->string('town_city')->nullable();
            $table->string('postcode')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('general_properties', function (Blueprint $table) {
            $table->dropColumn([
                'building_name_number',
                'street_address',
                'town_city',
                'postcode'
            ]);
        });
    }
};
