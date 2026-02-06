<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PropertyImage extends Model
{
    protected $fillable = ['general_property_id', 'image_path', 'order'];

    public function generalProperty()
    {
        return $this->belongsTo(GeneralProperty::class);
    }
}
