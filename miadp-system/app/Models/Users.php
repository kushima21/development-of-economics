<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Notifications\Notifiable;

class Users extends Authenticatable
{
    use HasFactory, Notifiable;

    protected $table = 'users';

    protected $primaryKey = 'user_id';

    protected $fillable = [
        'fullname',
        'gender',
        'birthdate',
        'municipality_id',
        'phonenumber',
        'email',
        'password',
        'roles',
        'status',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'birthdate' => 'date',
            'password' => 'hashed',
            'roles' => 'array',
        ];
    }

    public function municipality(): BelongsTo
    {
        return $this->belongsTo(
            Municipalities::class,
            'municipality_id'
        );
    }
}
