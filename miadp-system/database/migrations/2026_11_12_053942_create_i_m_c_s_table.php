<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('i_m_c_s', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('subproject_id');
            $table->unsignedSmallInteger('evaluation_year');
            $table->decimal('investment_economic_cost', 20, 2);
            $table->decimal('annual_maintenance_economic_cost', 20, 2);
            $table->decimal('total_20_year_cost', 20, 2);
            $table->json('yearly_costs');
            $table->timestamps();
            $table->unique(['subproject_id', 'evaluation_year'], 'imc_subproject_year_unique');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('i_m_c_s');
    }
};
