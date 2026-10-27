
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('s_r_c_s', function (Blueprint $table) {
            $table->id();

            $table->unsignedBigInteger('subproject_id');
            $table->unsignedSmallInteger('evaluation_year');

            $table->json('input_values')->nullable();

            $table->decimal('total_financial_cost', 15, 2)->default(0);
            $table->decimal('total_economic_cost', 15, 2)->default(0);

            $table->timestamps();

            // Allow multiple years for the same subproject.
            $table->unique(
                ['subproject_id', 'evaluation_year'],
                'src_subproject_year_unique'
            );
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('s_r_c_s');
    }
};
