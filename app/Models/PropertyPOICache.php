<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PropertyPOICache extends Model
{
    protected $table = 'property_poi_cache';

    protected $fillable = [
        'general_property_id',
        'poi_type',
        'name',
        'distance_miles',
        'latitude',
        'longitude',
        'fetched_at',
    ];

    protected $casts = [
        'fetched_at' => 'datetime',
    ];

    public function property()
    {
        return $this->belongsTo(GeneralProperty::class, 'general_property_id');
    }

    /**
     * Scope for filtering by POI type
     */
    public function scopeOfType($query, string $type)
    {
        return $query->where('poi_type', $type);
    }

    /**
     * Scope for filtering by maximum distance
     */
    public function scopeWithinDistance($query, float $miles)
    {
        return $query->where('distance_miles', '<=', $miles);
    }
}
