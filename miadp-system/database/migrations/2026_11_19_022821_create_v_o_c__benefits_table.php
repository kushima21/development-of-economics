<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('v_o_c__benefits', function (Blueprint $table) {
            $table->id();

            $table->unsignedBigInteger('subproject_id');
            $table->unsignedBigInteger('svoc_id');

            // Year 1 to Year 20
            $table->unsignedTinyInteger('year');

            // Annual VOC savings for the corresponding year
            $table->decimal('annual_savings', 18, 2)->default(0);

            $table->timestamps();

            // One record per year for each SVOC worksheet
            $table->unique(
                ['svoc_id', 'year'],
                'voc_benefits_svoc_year_unique'
            );

            $table->index('subproject_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('v_o_c__benefits');
    }
};
