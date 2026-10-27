<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('e_c_o_s', function (Blueprint $table) {
            $table->id();

            // Related MIADP subproject
            $table->unsignedBigInteger('subproject_id')
                ->unique();

            // Year of economic cost evaluation
            $table->unsignedSmallInteger('evaluation_year')
                ->nullable();

            // Economic cost input values
            $table->json('input_values')->nullable();

            // Calculated financial and economic totals
            $table->json('calculations')->nullable();

            // Economic conversion factors
            $table->decimal('foreign_factor', 8, 2)
                ->nullable();

            $table->decimal('unskilled_factor', 8, 2)
                ->nullable();

            $table->timestamps();

            // Optional foreign key if subprojects.subproject_id
            // is an unsigned BIGINT primary key.
            $table->foreign('subproject_id')
                ->references('subproject_id')
                ->on('subprojects')
                ->cascadeOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('e_c_o_s');
    }
};
