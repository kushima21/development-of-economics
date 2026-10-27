<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Subproject extends Model
{
    use HasFactory;

    protected $table = 'subproject';

    protected $primaryKey = 'subproject_id';

    protected $fillable = [
        'subproject_code',
        'subproject_title',
        'type_of_sp_id',
        'subproject_location',
        'subproject_proponent',
        'subject_category',
        'project_scale_dimension',
        'total_project_cost',
        'world_bank_share',
        'gop_share',
        'lgu_share',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'total_project_cost' => 'decimal:2',
            'world_bank_share' => 'decimal:2',
            'gop_share' => 'decimal:2',
            'lgu_share' => 'decimal:2',
        ];
    }

    public function typeOfSubproject(): BelongsTo
    {
        return $this->belongsTo(
            TypeOfSubproject::class,
            'type_of_sp_id',
            'type_of_sp_id'
        );
    }
}
