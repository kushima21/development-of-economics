<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('users', function (Blueprint $table) {
            $table->user_id('user_id');

            $table->string('fullname');
            $table->string('gender', 20)->nullable();
            $table->date('birthdate')->nullable();

            $table->foreignId('municipality_id')
                ->nullable()
                ->constrained('municipalities')
                ->nullOnDelete();

            $table->string('phonenumber', 30)->nullable();
            $table->string('email')->unique();
            $table->string('password');

            // Multiple roles: ["admin", "miadp", "lgu"]
            $table->json('roles');

            $table->string('status', 20)->default('Active');

            $table->rememberToken();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('users');
    }
};
