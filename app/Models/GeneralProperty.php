<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class GeneralProperty extends Model
{
    protected $fillable = [
        'agent_id',
        'name',
        'location',
        'price',
        'size_sqft',
        'description',
        'property_category_type',
        'property_category_id',
    ];

    protected $casts = [
        'price' => 'decimal:2',
        'size_sqft' => 'integer',
    ];

    /**
     * Get the agent that owns the property.
     */
    public function agent(): BelongsTo
    {
        return $this->belongsTo(User::class , 'agent_id');
    }

    /**
     * Get the property category (Residential or Commercial).
     */
    public function propertyCategory(): MorphTo
    {
        return $this->morphTo();
    }

    /**
     * Get the images for the property.
     */
    public function images(): HasMany
    {
        return $this->hasMany(PropertyImage::class)->orderBy('order');
    }

    /**
     * Get users who have favourited this property.
     */
    public function favouritedBy(): BelongsToMany
    {
        return $this->belongsToMany(User::class , 'property_favourites')
            ->withTimestamps();
    }

    /**
     * Get enquiries for this property.
     */
    public function enquiries(): HasMany
    {
        return $this->hasMany(PropertyEnquiry::class);
    }
}
