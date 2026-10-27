<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('type_subproject', function (Blueprint $table) {
            $table->id('type_of_sp_id');

            // Parent category selected from subproject_category.
            $table->foreignId('subproject_id')
                ->constrained('subproject_category')
                ->cascadeOnUpdate()
                ->restrictOnDelete();

            $table->string('subproject_name');
            $table->string('type_subproject_name');
            $table->text('description');
            $table->longText('information')->nullable();
            $table->enum('status', ['Active', 'Inactive'])->default('Active');

            $table->timestamps();

            $table->unique(
                ['subproject_id', 'type_subproject_name'],
                'type_subproject_category_name_unique'
            );

            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('type_subproject');
    }
};