<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('municipalities', function (Blueprint $table) {
            $table->id();
            $table->string('municipality', 150)->unique();
            $table->string('region', 150);
            $table->string('zipcode', 10)->nullable();
            $table->enum('status', ['Active', 'Inactive'])->default('Active');
            $table->timestamps();

            $table->index(['region', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('municipalities');
    }
};
