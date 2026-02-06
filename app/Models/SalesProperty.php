<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\MorphOne;

class SalesProperty extends Model
{
    protected $fillable = [
        'tenure',
        'lease_years_remaining',
        'ground_rent',
        'service_charge',
    ];

    protected $casts = [
        'lease_years_remaining' => 'integer',
        'ground_rent' => 'decimal:2',
        'service_charge' => 'decimal:2',
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
