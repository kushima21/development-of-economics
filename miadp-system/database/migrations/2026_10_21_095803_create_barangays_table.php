
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('barangays', function (Blueprint $table) {
            $table->id();

            $table->foreignId('municipality_id')
                ->constrained('municipalities')
                ->restrictOnDelete();

            $table->string('barangay_name', 150);
            $table->enum('status', ['Active', 'Inactive'])
                ->default('Active');

            $table->timestamps();

            $table->unique(
                ['municipality_id', 'barangay_name'],
                'barangays_municipality_name_unique'
            );

            $table->index(['municipality_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('barangays');
    }
};
