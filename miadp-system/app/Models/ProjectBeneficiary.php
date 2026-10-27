<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProjectBeneficiary extends Model
{
    use HasFactory;

    protected $table = 'project_beneficiaries';

    protected $fillable = [
        'subproject_id',
        'barangay_id',
        'purok',
        'barangay_purok_name',
        'households',
        'age_groups',
        'sectors',
    ];

    protected function casts(): array
    {
        return [
            'households' => 'integer',
            'age_groups' => 'array',
            'sectors' => 'array',
        ];
    }

    public function barangay(): BelongsTo
    {
        return $this->belongsTo(
            Barangay::class,
            'barangay_id',
            'id'
        );
    }
}
