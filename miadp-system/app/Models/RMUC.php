<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class RMUC extends Model
{
    protected $table = 'r_m_u_c_s';

    protected $fillable = [
        'subproject_id',
        'evaluation_year',
        'activities',
        'conversion_factors',
        'total_financial_cost',
        'total_economic_cost',
    ];

    protected function casts(): array
    {
        return [
            'evaluation_year' => 'integer',
            'activities' => 'array',
            'conversion_factors' => 'array',
            'total_financial_cost' => 'decimal:2',
            'total_economic_cost' => 'decimal:2',
        ];
    }
}
