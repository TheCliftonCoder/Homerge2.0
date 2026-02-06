<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\MorphOne;

class RentalProperty extends Model
{
    protected $fillable = [
        'available_date',
        'deposit',
        'min_tenancy_months',
        'let_type',
        'furnished',
        'bills_included',
        'pets_allowed',
    ];

    protected $casts = [
        'available_date' => 'date',
        'deposit' => 'decimal:2',
        'min_tenancy_months' => 'integer',
        'bills_included' => 'boolean',
        'pets_allowed' => 'boolean',
    ];

    /**
     * Get the residential property record.
     */
    public function residentialProperty(): MorphOne
    {
        return $this->morphOne(ResidentialProperty::class , 'transaction');
    }

    /**
     * Get the commercial property record.
     */
    public function commercialProperty(): MorphOne
    {
        return $this->morphOne(CommercialProperty::class , 'transaction');
    }
}
