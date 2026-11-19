<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('svoc', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('subproject_id');
            $table->string('barangay');
            $table->decimal('annual_savings', 24, 6)->default(0);
            $table->decimal('twenty_year_savings', 28, 6)->default(0);
            $table->longText('data');
            $table->timestamps();
            $table->index('subproject_id');
            $table->foreign('subproject_id')->references('subproject_id')->on('subproject')->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('svoc');
    }
};
