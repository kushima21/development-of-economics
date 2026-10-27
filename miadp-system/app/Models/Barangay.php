<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Barangay extends Model
{
    use HasFactory;

    protected $table = 'barangays';

    // Use the actual primary key in the database.
    protected $primaryKey = 'id';

    public $incrementing = true;

    protected $keyType = 'int';

    protected $fillable = [
        'municipality_id',
        'barangay_name',
        'status',
    ];

    public function municipality(): BelongsTo
    {
        return $this->belongsTo(
            Municipalities::class,
            'municipality_id',
            'municipality_id'
        );
    }
}
