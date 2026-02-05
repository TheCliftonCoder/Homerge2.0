<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Property extends Model
{
    protected $fillable = [
        'name',
        'price',
        'location',
        'size_sqft',
        'agent_id',
    ];

    protected function casts(): array
    {
        return [
            'price' => 'decimal:2',
            'size_sqft' => 'integer',
        ];
    }

    public function agent()
    {
        return $this->belongsTo(User::class , 'agent_id');
    }

    public function images()
    {
        return $this->hasMany(PropertyImage::class)->orderBy('order');
    }
}
