<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\MorphOne;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class ResidentialProperty extends Model
{
    protected $fillable = [
        'bedrooms',
        'bathrooms',
        'council_tax_band',
        'parking',
        'garden',
        'property_type',
        'access',
        'transaction_type',
        'transaction_id',
    ];

    protected $casts = [
        'bedrooms' => 'integer',
        'bathrooms' => 'integer',
        'garden' => 'boolean',
    ];

    /**
     * Get the general property record.
     */
    public function generalProperty(): MorphOne
    {
        return $this->morphOne(GeneralProperty::class , 'property_category');
    }

    /**
     * Get the transaction (Sales or Rental).
     */
    public function transaction(): MorphTo
    {
        return $this->morphTo();
    }
}
