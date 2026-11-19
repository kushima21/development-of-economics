<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SVOC extends Model
{
    protected $table = 'svoc';

    protected $primaryKey = 'id';

    public $incrementing = true;

    protected $keyType = 'int';

    protected $fillable = [
        'subproject_id',
        'barangay',
        'annual_savings',
        'twenty_year_savings',
        'data',
    ];

    protected $casts = [
        'subproject_id' => 'integer',
        'annual_savings' => 'decimal:6',
        'twenty_year_savings' => 'decimal:6',
        'data' => 'array',
    ];

    public function subproject(): BelongsTo
    {
        return $this->belongsTo(
            Subproject::class,
            'subproject_id',
            'subproject_id'
        );
    }
}
