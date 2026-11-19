<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('a_m_c_s', function (Blueprint $table) {
            $table->id();
            $table->foreignId('subproject_id');
            $table->unsignedSmallInteger('evaluation_year');
            $table->decimal('total_annual_maintenance_cost_economic', 18, 2);
            $table->timestamps();

            $table->unique(['subproject_id', 'evaluation_year'], 'amc_subproject_year_unique');
            $table->foreign('subproject_id')
                ->references('subproject_id')->on('subproject')
                ->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('a_m_c_s');
    }
};
