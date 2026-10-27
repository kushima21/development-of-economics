<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SRC extends Model
{
    protected $table = 's_r_c_s';

    protected $fillable = [
        'subproject_id',
        'evaluation_year',
        'input_values',
        'total_financial_cost',
        'total_economic_cost',
    ];

    protected function casts(): array
    {
        return [
            'subproject_id' => 'integer',
            'evaluation_year' => 'integer',
            'input_values' => 'array',
            'total_financial_cost' => 'decimal:2',
            'total_economic_cost' => 'decimal:2',
        ];
    }
}