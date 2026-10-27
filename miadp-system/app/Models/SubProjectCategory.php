<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SubProjectCategory extends Model
{
    use HasFactory;

    protected $table = 'subproject_category';

    protected $fillable = [
        'name',
        'description',
        'information',
        'status',
    ];

    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];
}