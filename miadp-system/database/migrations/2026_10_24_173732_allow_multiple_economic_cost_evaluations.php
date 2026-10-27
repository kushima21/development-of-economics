<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('e_c_o_s', function (Blueprint $table) {
            // Remove the rule that allows only one record per subproject.
            $table->dropUnique(['subproject_id']);

            // Allow one record per subproject per evaluation year.
            $table->unique(
                ['subproject_id', 'evaluation_year'],
                'ecos_subproject_year_unique'
            );
        });
    }

    public function down(): void
    {
        Schema::table('e_c_o_s', function (Blueprint $table) {
            $table->dropUnique('ecos_subproject_year_unique');

            // Restore the original constraint only if each subproject
            // has no more than one evaluation record.
            $table->unique('subproject_id');
        });
    }
};