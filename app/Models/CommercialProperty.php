<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\MorphOne;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class CommercialProperty extends Model
{
    protected $fillable = [
        'property_type',
        'transaction_type',
        'transaction_id',
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
