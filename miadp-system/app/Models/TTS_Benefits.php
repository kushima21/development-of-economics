<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TTS_Benefits extends Model
{
    protected $table = 'tts_benefits';

    protected $primaryKey = 'id';

    protected $fillable = [
        'subproject_id',
        'tts_id',
        'project_year',
        'calendar_year',
        'annual_savings',
    ];

    protected $casts = [
        'subproject_id' => 'integer',
        'tts_id' => 'integer',
        'project_year' => 'integer',
        'calendar_year' => 'integer',
        'annual_savings' => 'decimal:2',
    ];

    /**
     * Parent TTS worksheet.
     */
    public function tts(): BelongsTo
    {
        return $this->belongsTo(TTS::class, 'tts_id', 'id');
    }
}