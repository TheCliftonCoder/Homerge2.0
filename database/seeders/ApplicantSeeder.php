<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\GeneralProperty;
use App\Models\PropertyEnquiry;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class ApplicantSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Create 10 applicants with varied activity
        // Half interested in sales, half in rentals
        $applicants = [
            // SALES INTERESTED APPLICANTS
            [
                'name' => 'John Smith',
                'email' => 'john.smith@example.com',
                'favourites_count' => 5,
                'enquiries_count' => 3,
                'interest_type' => 'sale',
            ],
            [
                'name' => 'Emma Wilson',
                'email' => 'emma.wilson@example.com',
                'favourites_count' => 8,
                'enquiries_count' => 2,
                'interest_type' => 'sale',
            ],
            [
                'name' => 'Michael Brown',
                'email' => 'michael.brown@example.com',
                'favourites_count' => 3,
                'enquiries_count' => 5,
                'interest_type' => 'sale',
            ],
            [
                'name' => 'Sophie Taylor',
                'email' => 'sophie.taylor@example.com',
                'favourites_count' => 6,
                'enquiries_count' => 4,
                'interest_type' => 'sale',
            ],
            [
                'name' => 'James Anderson',
                'email' => 'james.anderson@example.com',
                'favourites_count' => 4,
                'enquiries_count' => 6,
                'interest_type' => 'sale',
            ],

            // RENTAL INTERESTED APPLICANTS
            [
                'name' => 'Olivia Martinez',
                'email' => 'olivia.martinez@example.com',
                'favourites_count' => 7,
                'enquiries_count' => 1,
                'interest_type' => 'rental',
            ],
            [
                'name' => 'William Davis',
                'email' => 'william.davis@example.com',
                'favourites_count' => 2,
                'enquiries_count' => 4,
                'interest_type' => 'rental',
            ],
            [
                'name' => 'Charlotte Johnson',
                'email' => 'charlotte.johnson@example.com',
                'favourites_count' => 9,
                'enquiries_count' => 7,
                'interest_type' => 'rental',
            ],
            [
                'name' => 'Daniel Thompson',
                'email' => 'daniel.thompson@example.com',
                'favourites_count' => 5,
                'enquiries_count' => 3,
                'interest_type' => 'rental',
            ],
            [
                'name' => 'Isabella Garcia',
                'email' => 'isabella.garcia@example.com',
                'favourites_count' => 4,
                'enquiries_count' => 5,
                'interest_type' => 'rental',
            ],
        ];

        // Get all properties
        $allProperties = GeneralProperty::with('propertyCategory')->get();

        if ($allProperties->isEmpty()) {
            $this->command->error('No properties found! Please run PropertySeeder first.');
            return;
        }

        foreach ($applicants as $applicantData) {
            // Create applicant user
            $applicant = User::firstOrCreate(
            ['email' => $applicantData['email']],
            [
                'name' => $applicantData['name'],
                'password' => Hash::make('password'),
                'role' => 'applicant',
            ]
            );

            // Filter properties based on interest type (sale or rental)
            $filteredProperties = $allProperties->filter(function ($property) use ($applicantData) {
                $transactionType = class_basename($property->propertyCategory->transaction_type);

                if ($applicantData['interest_type'] === 'sale') {
                    return $transactionType === 'SalesProperty';
                }
                else {
                    return $transactionType === 'RentalProperty';
                }
            });

            if ($filteredProperties->isEmpty()) {
                $this->command->warn("No {$applicantData['interest_type']} properties found for {$applicant->name}");
                continue;
            }

            // Add random favourites (only from filtered properties)
            $favouriteCount = min($applicantData['favourites_count'], $filteredProperties->count());
            $favouriteProperties = $filteredProperties->random($favouriteCount);

            foreach ($favouriteProperties as $property) {
                // Attach with random created_at date (within last 60 days)
                $applicant->favouriteProperties()->syncWithoutDetaching([
                    $property->id => [
                        'created_at' => now()->subDays(rand(1, 60)),
                        'updated_at' => now()->subDays(rand(1, 60)),
                    ]
                ]);
            }

            // Add random enquiries (only from filtered properties)
            $enquiryCount = min($applicantData['enquiries_count'], $filteredProperties->count());
            $enquiryProperties = $filteredProperties->random($enquiryCount);

            foreach ($enquiryProperties as $property) {
                PropertyEnquiry::create([
                    'user_id' => $applicant->id,
                    'general_property_id' => $property->id,
                    'message' => $this->generateEnquiryMessage($applicantData['interest_type']),
                    'created_at' => now()->subDays(rand(1, 60)),
                    'updated_at' => now()->subDays(rand(1, 60)),
                ]);
            }

            $interestLabel = $applicantData['interest_type'] === 'sale' ? 'SALES' : 'RENTAL';
            $this->command->info("Created applicant: {$applicant->name} ({$interestLabel}) with {$favouriteCount} favourites and {$enquiryCount} enquiries");
        }

        $this->command->info('Successfully created ' . count($applicants) . ' applicants with activity!');
    }

    /**
     * Generate a realistic enquiry message
     */
    private function generateEnquiryMessage(string $interestType): string
    {
        $messages = [
            "I'm very interested in this property. Could you please provide more information about viewing times?",
            "This looks perfect for my needs. Is the property still available? I'd like to arrange a viewing.",
            "Could you tell me more about the local area and nearby amenities?",
            "I'd like to schedule a viewing at your earliest convenience. What dates are available?",
            "Is there any flexibility on the price? I'm a serious buyer and ready to proceed quickly.",
            "Could you provide more details about the condition of the property and any recent renovations?",
            "I'm interested in making an offer. What's the best way to proceed?",
            "Are pets allowed in this property? Also, when would the earliest move-in date be?",
            "This property caught my eye. Could we arrange a viewing this week?",
            "I have a few questions about the property. Could you give me a call to discuss?",
        ];

        return $messages[array_rand($messages)];
    }
}
