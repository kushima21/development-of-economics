<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('s_t_l_s', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('subproject_id')->unique();
            $table->string('benefit_category')->default('Savings in Transport Losses');
            $table->decimal('annual_savings', 20, 2)->default(0);
            $table->decimal('twenty_year_savings', 20, 2)->default(0);
            $table->json('data');
            $table->timestamps();
            $table->foreign('subproject_id')->references('subproject_id')->on('subproject')->cascadeOnDelete();
        });
    }
    public function down(): void { Schema::dropIfExists('s_t_l_s'); }
};
