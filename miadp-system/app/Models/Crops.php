<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Crops extends Model
{
    protected $table = 'crops';

    protected $primaryKey = 'crop_id';

    protected $fillable = [
        'crop',
        'crop_status',
    ];
}