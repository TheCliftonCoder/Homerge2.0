<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PropertyEnquiry extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'general_property_id',
        'message',
        'preferred_date',
        'contact_phone',
    ];

    protected $casts = [
        'preferred_date' => 'datetime',
    ];

    /**
     * Get the user (applicant) who made the enquiry.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the property being enquired about.
     */
    public function property(): BelongsTo
    {
        return $this->belongsTo(GeneralProperty::class , 'general_property_id');
    }
}
