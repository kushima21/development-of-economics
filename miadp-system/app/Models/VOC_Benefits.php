<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class VOC_Benefits extends Model
{
    protected $table = 'v_o_c__benefits';

    protected $fillable = [
        'subproject_id',
        'svoc_id',
        'year',
        'annual_savings',
    ];

    protected $casts = [
        'year' => 'integer',
        'annual_savings' => 'decimal:2',
    ];
}
