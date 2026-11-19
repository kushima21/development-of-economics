<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TTS extends Model
{
    use HasFactory;

    protected $table = 't_t_s';

    protected $primaryKey = 'id';

    public $timestamps = true;

    protected $fillable = [
        'subproject_id',
        'benefit_category',
        'annual_savings',
        'twenty_year_savings',
        'data',
    ];

    protected $casts = [
        'subproject_id' => 'integer',
        'annual_savings' => 'decimal:2',
        'twenty_year_savings' => 'decimal:2',
        'data' => 'array',
    ];

    /**
     * Relationship to the Subproject model.
     */
    public function subproject(): BelongsTo
    {
        return $this->belongsTo(
            Subproject::class,
            'subproject_id',
            'subproject_id'
        );
    }
}
