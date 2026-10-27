
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('r_m_u_c_s', function (Blueprint $table) {
            $table->id();

            // The subproject associated with this RMUC evaluation.
            $table->string('subproject_id', 100);
            $table->unsignedSmallInteger('evaluation_year');

            // Full worksheet inputs and conversion factors.
            $table->json('activities');
            $table->json('conversion_factors');

            // Calculated totals.
            $table->decimal('total_financial_cost', 18, 2)->default(0);
            $table->decimal('total_economic_cost', 18, 2)->default(0);

            $table->timestamps();

            // One RMUC record per subproject and evaluation year.
            $table->unique(
                ['subproject_id', 'evaluation_year'],
                'rmuc_subproject_year_unique'
            );
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('r_m_u_c_s');
    }
};
