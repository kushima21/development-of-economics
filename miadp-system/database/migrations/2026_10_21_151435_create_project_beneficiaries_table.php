<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('project_beneficiaries', function (Blueprint $table) {
            $table->id();

            // References the selected infrastructure subproject.
            $table->unsignedBigInteger('subproject_id')->nullable()->index();

            $table->unsignedBigInteger('barangay_id')->index();
            $table->string('purok', 150);
            $table->string('barangay_purok_name', 255)->nullable();

            $table->unsignedInteger('households')->default(0);
            $table->json('age_groups');
            $table->json('sectors');

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('project_beneficiaries');
    }
};
