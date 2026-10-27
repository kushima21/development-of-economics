<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TypeOfSubproject extends Model
{
    use HasFactory;

    protected $table = 'type_subproject';

    protected $primaryKey = 'type_of_sp_id';

    protected $fillable = [
        'subproject_id',
        'subproject_name',
        'type_subproject_name',
        'description',
        'information',
        'status',
    ];

    public function category(): BelongsTo
    {
        return $this->belongsTo(
            SubProjectCategory::class,
            'subproject_id',
            'id'
        );
    }
}
