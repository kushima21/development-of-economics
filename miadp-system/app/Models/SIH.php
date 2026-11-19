<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SIH extends Model
{
    protected $table = 's_i_h_s';

    protected $fillable = [
        'subproject_id',
        'benefit_category',
        'annual_savings',
        'twenty_year_savings',
        'data',
    ];

    protected $casts = [
        'data' => 'array',
        'annual_savings' => 'decimal:2',
        'twenty_year_savings' => 'decimal:2',
    ];

    public function subproject(): BelongsTo
    {
        return $this->belongsTo(Subproject::class, 'subproject_id', 'subproject_id');
    }
}
