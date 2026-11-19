<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class IMC extends Model
{
    protected $table = 'i_m_c_s';

    protected $fillable = [
        'subproject_id', 'evaluation_year', 'investment_economic_cost',
        'annual_maintenance_economic_cost', 'total_20_year_cost', 'yearly_costs',
    ];

    protected $casts = [
        'evaluation_year' => 'integer',
        'investment_economic_cost' => 'decimal:2',
        'annual_maintenance_economic_cost' => 'decimal:2',
        'total_20_year_cost' => 'decimal:2',
        'yearly_costs' => 'array',
    ];
}
