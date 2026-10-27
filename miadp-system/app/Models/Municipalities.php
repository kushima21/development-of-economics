<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use App\Models\Users;

class Municipalities extends Model
{
    use HasFactory;

    protected $table = 'municipalities';

    protected $fillable = [
        'municipality',
        'region',
        'zipcode',
        'status',
    ];

    public function barangays(): HasMany
{
    return $this->hasMany(Barangay::class, 'municipality_id');
}
public function users(): HasMany
{
    return $this->hasMany(Users::class, 'municipality_id');
}
}


