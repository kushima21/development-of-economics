<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tts_benefits', function (Blueprint $table) {
            $table->id();

            $table->unsignedBigInteger('subproject_id');
            $table->unsignedBigInteger('tts_id');

            $table->unsignedTinyInteger('project_year');
            $table->unsignedSmallInteger('calendar_year');

            $table->decimal('annual_savings', 18, 2)->default(0);

            $table->timestamps();

            $table->unique(
                ['tts_id', 'project_year'],
                'tts_benefits_tts_year_unique'
            );

            $table->index('subproject_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tts_benefits');
    }
};