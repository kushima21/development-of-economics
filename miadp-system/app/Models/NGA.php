<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class NGA extends Model
{
    protected $table = 'n_g_a_s';
    protected $fillable = ['subproject_id', 'benefit_category', 'annual_savings', 'twenty_year_savings', 'data'];
    protected $casts = ['annual_savings' => 'decimal:2', 'twenty_year_savings' => 'decimal:2', 'data' => 'array'];

    public function subproject(): BelongsTo
    {
        return $this->belongsTo(Subproject::class, 'subproject_id', 'subproject_id');
    }
}
