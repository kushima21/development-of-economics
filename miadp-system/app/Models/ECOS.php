<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ECOS extends Model
{
    protected $table = 'e_c_o_s';

    protected $primaryKey = 'id';

    protected $fillable = [
        'subproject_id',
        'evaluation_year',
        'input_values',
        'calculations',
        'foreign_factor',
        'unskilled_factor',
    ];

    protected $casts = [
        'subproject_id' => 'integer',
        'evaluation_year' => 'integer',
        'input_values' => 'array',
        'calculations' => 'array',
        'foreign_factor' => 'decimal:2',
        'unskilled_factor' => 'decimal:2',
    ];
}
