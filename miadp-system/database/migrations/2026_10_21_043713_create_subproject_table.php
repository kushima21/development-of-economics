<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('subproject', function (Blueprint $table) {
            $table->bigIncrements('subproject_id');

            // Manually entered project identifier
            $table->string('subproject_code', 50)->unique();

            // Manually entered project title
            $table->string('subproject_title', 255);

            // Selected type from the type_subproject reference table
            $table->unsignedBigInteger('type_of_sp_id')->nullable();

            $table->string('subproject_location')->nullable();
            $table->string('subproject_proponent')->nullable();

            // User-entered subject or sector category
            $table->text('subject_category')->nullable();

            $table->string('project_scale_dimension')->nullable();

            $table->decimal('total_project_cost', 15, 2)->default(0);
            $table->decimal('world_bank_share', 15, 2)->default(0);
            $table->decimal('gop_share', 15, 2)->default(0);
            $table->decimal('lgu_share', 15, 2)->default(0);

            $table->string('status', 30)->default('Draft');

            $table->timestamps();

            $table->foreign('type_of_sp_id')
                ->references('type_of_sp_id')
                ->on('type_subproject')
                ->nullOnDelete();

            $table->index('subproject_title');
            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('subproject');
    }
};
