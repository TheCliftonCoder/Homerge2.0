<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Create admin user
        User::create([
            'name' => 'Admin User',
            'email' => 'admin@test.com',
            'password' => Hash::make('admin'),
            'role' => 'admin',
        ]);

        // Seed properties with test data
        $this->call(PropertySeeder::class);

        // Seed applicants with favourites and enquiries
        $this->call(ApplicantSeeder::class);
    }
}
