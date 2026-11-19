<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AMC extends Model
{
    protected $table = 'a_m_c_s';

    protected $fillable = [
        'subproject_id',
        'evaluation_year',
        'total_annual_maintenance_cost_economic',
    ];

    protected $casts = [
        'evaluation_year' => 'integer',
        'total_annual_maintenance_cost_economic' => 'decimal:2',
    ];

    public function subproject(): BelongsTo
    {
        return $this->belongsTo(Subproject::class, 'subproject_id', 'subproject_id');
    }
}
