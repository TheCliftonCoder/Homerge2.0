<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AgentRequest extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'email',
        'password',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'password' => 'hashed',
        ];
    }
}
