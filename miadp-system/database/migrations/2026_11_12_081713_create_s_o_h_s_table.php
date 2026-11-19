<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('s_o_h_s', function (Blueprint $table) {
            $table->id();
            $table->foreignId('subproject_id');
            $table->string('benefit_category')->default('Saving Output Hauling');
            $table->decimal('annual_savings', 20, 2)->default(0);
            $table->decimal('twenty_year_savings', 22, 2)->default(0);
            $table->json('data');
            $table->timestamps();
            $table->unique('subproject_id');
            $table->foreign('subproject_id')->references('subproject_id')->on('subproject')->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('s_o_h_s');
    }
};
