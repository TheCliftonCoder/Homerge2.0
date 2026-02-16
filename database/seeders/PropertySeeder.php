<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\GeneralProperty;
use App\Models\ResidentialProperty;
use App\Models\CommercialProperty;
use App\Models\SalesProperty;
use App\Models\RentalProperty;
use App\Models\PropertyImage;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Storage;

class PropertySeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Create test agents if they don't exist
        $agent1 = User::firstOrCreate(
        ['email' => 'agent1@test.com'],
        [
            'name' => 'Sarah Johnson',
            'password' => Hash::make('password'),
            'role' => 'agent',
        ]
        );

        $agent2 = User::firstOrCreate(
        ['email' => 'agent2@test.com'],
        [
            'name' => 'Michael Chen',
            'password' => Hash::make('password'),
            'role' => 'agent',
        ]
        );

        // Define seed image directories
        $seedImagePath = storage_path('app/public/seed-images');

        // Get all available images by category
        $imageCategories = [
            'front house' => File::glob($seedImagePath . '/front house/*.{jpg,jpeg,png}', GLOB_BRACE),
            'bedroom' => File::glob($seedImagePath . '/bedroom/*.{jpg,jpeg,png}', GLOB_BRACE),
            'living room' => File::glob($seedImagePath . '/living room/*.{jpg,jpeg,png}', GLOB_BRACE),
            'dining room' => File::glob($seedImagePath . '/dining room/*.{jpg,jpeg,png}', GLOB_BRACE),
            'garden' => File::glob($seedImagePath . '/garden/*.{jpg,jpeg,png}', GLOB_BRACE),
        ];

        // Property data templates
        $properties = [
            // AGENT 1 - SALES PROPERTIES (12 total: 3 Reading, 3 Wokingham, 3 Bracknell, 3 Caversham)

            // Reading Sales (3)
            [
                'agent' => $agent1,
                'category' => 'residential',
                'transaction' => 'sale',
                'name' => 'Modern Family Home',
                'location' => 'Reading',
                'price' => 450000,
                'size_sqft' => 1800,
                'description' => "A beautifully presented four-bedroom detached home in a sought-after Reading location. Features include a modern kitchen, spacious living areas, and a landscaped garden.",
                'residential' => [
                    'bedrooms' => 4,
                    'bathrooms' => 2,
                    'council_tax_band' => 'D',
                    'parking' => 'driveway',
                    'garden' => true,
                    'property_type' => 'detached',
                    'access' => null,
                ],
                'sales' => [
                    'tenure' => 'freehold',
                    'lease_years_remaining' => null,
                    'ground_rent' => null,
                    'service_charge' => null,
                ],
            ],
            [
                'agent' => $agent1,
                'category' => 'residential',
                'transaction' => 'sale',
                'name' => 'Victorian Terrace',
                'location' => 'Reading',
                'price' => 375000,
                'size_sqft' => 1400,
                'description' => "Charming three-bedroom Victorian terrace with period features, close to Reading town centre and excellent transport links.",
                'residential' => [
                    'bedrooms' => 3,
                    'bathrooms' => 1,
                    'council_tax_band' => 'C',
                    'parking' => 'street',
                    'garden' => true,
                    'property_type' => 'terraced',
                    'access' => null,
                ],
                'sales' => [
                    'tenure' => 'freehold',
                    'lease_years_remaining' => null,
                    'ground_rent' => null,
                    'service_charge' => null,
                ],
            ],
            [
                'agent' => $agent1,
                'category' => 'residential',
                'transaction' => 'sale',
                'name' => 'Contemporary Apartment',
                'location' => 'Reading',
                'price' => 285000,
                'size_sqft' => 950,
                'description' => "Stylish two-bedroom apartment in a modern development with allocated parking and communal gardens.",
                'residential' => [
                    'bedrooms' => 2,
                    'bathrooms' => 2,
                    'council_tax_band' => 'C',
                    'parking' => 'garage',
                    'garden' => false,
                    'property_type' => 'flat',
                    'access' => 'Lift access',
                ],
                'sales' => [
                    'tenure' => 'leasehold',
                    'lease_years_remaining' => 120,
                    'ground_rent' => 200,
                    'service_charge' => 1500,
                ],
            ],

            // Wokingham Sales (3)
            [
                'agent' => $agent1,
                'category' => 'residential',
                'transaction' => 'sale',
                'name' => 'Executive Detached Home',
                'location' => 'Wokingham',
                'price' => 625000,
                'size_sqft' => 2200,
                'description' => "Impressive five-bedroom detached property in a prestigious Wokingham location with double garage and large garden.",
                'residential' => [
                    'bedrooms' => 5,
                    'bathrooms' => 3,
                    'council_tax_band' => 'F',
                    'parking' => 'garage',
                    'garden' => true,
                    'property_type' => 'detached',
                    'access' => null,
                ],
                'sales' => [
                    'tenure' => 'freehold',
                    'lease_years_remaining' => null,
                    'ground_rent' => null,
                    'service_charge' => null,
                ],
            ],
            [
                'agent' => $agent1,
                'category' => 'residential',
                'transaction' => 'sale',
                'name' => 'Semi-Detached Family Home',
                'location' => 'Wokingham',
                'price' => 425000,
                'size_sqft' => 1600,
                'description' => "Well-maintained three-bedroom semi-detached home with conservatory and off-road parking.",
                'residential' => [
                    'bedrooms' => 3,
                    'bathrooms' => 2,
                    'council_tax_band' => 'D',
                    'parking' => 'driveway',
                    'garden' => true,
                    'property_type' => 'semi_detached',
                    'access' => null,
                ],
                'sales' => [
                    'tenure' => 'freehold',
                    'lease_years_remaining' => null,
                    'ground_rent' => null,
                    'service_charge' => null,
                ],
            ],
            [
                'agent' => $agent1,
                'category' => 'residential',
                'transaction' => 'sale',
                'name' => 'Modern Townhouse',
                'location' => 'Wokingham',
                'price' => 395000,
                'size_sqft' => 1350,
                'description' => "Contemporary three-bedroom townhouse built in 2019, featuring open-plan living and a private garden.",
                'residential' => [
                    'bedrooms' => 3,
                    'bathrooms' => 2,
                    'council_tax_band' => 'D',
                    'parking' => 'driveway',
                    'garden' => true,
                    'property_type' => 'terraced',
                    'access' => null,
                ],
                'sales' => [
                    'tenure' => 'freehold',
                    'lease_years_remaining' => null,
                    'ground_rent' => null,
                    'service_charge' => null,
                ],
            ],

            // Bracknell Sales (3)
            [
                'agent' => $agent1,
                'category' => 'residential',
                'transaction' => 'sale',
                'name' => 'Spacious Detached Bungalow',
                'location' => 'Bracknell',
                'price' => 475000,
                'size_sqft' => 1650,
                'description' => "Rare three-bedroom detached bungalow with large plot, ideal for those seeking single-level living.",
                'residential' => [
                    'bedrooms' => 3,
                    'bathrooms' => 2,
                    'council_tax_band' => 'E',
                    'parking' => 'driveway',
                    'garden' => true,
                    'property_type' => 'bungalow',
                    'access' => 'Wheelchair accessible',
                ],
                'sales' => [
                    'tenure' => 'freehold',
                    'lease_years_remaining' => null,
                    'ground_rent' => null,
                    'service_charge' => null,
                ],
            ],
            [
                'agent' => $agent1,
                'category' => 'residential',
                'transaction' => 'sale',
                'name' => 'Four Bedroom Detached',
                'location' => 'Bracknell',
                'price' => 520000,
                'size_sqft' => 1950,
                'description' => "Impressive four-bedroom detached home with en-suite, garage, and beautifully landscaped gardens.",
                'residential' => [
                    'bedrooms' => 4,
                    'bathrooms' => 3,
                    'council_tax_band' => 'E',
                    'parking' => 'garage',
                    'garden' => true,
                    'property_type' => 'detached',
                    'access' => null,
                ],
                'sales' => [
                    'tenure' => 'freehold',
                    'lease_years_remaining' => null,
                    'ground_rent' => null,
                    'service_charge' => null,
                ],
            ],
            [
                'agent' => $agent1,
                'category' => 'residential',
                'transaction' => 'sale',
                'name' => 'Two Bedroom Flat',
                'location' => 'Bracknell',
                'price' => 225000,
                'size_sqft' => 750,
                'description' => "Well-presented two-bedroom flat in a popular development, perfect for first-time buyers.",
                'residential' => [
                    'bedrooms' => 2,
                    'bathrooms' => 1,
                    'council_tax_band' => 'B',
                    'parking' => 'street',
                    'garden' => false,
                    'property_type' => 'flat',
                    'access' => null,
                ],
                'sales' => [
                    'tenure' => 'leasehold',
                    'lease_years_remaining' => 95,
                    'ground_rent' => 150,
                    'service_charge' => 1200,
                ],
            ],

            // Caversham Sales (3)
            [
                'agent' => $agent1,
                'category' => 'residential',
                'transaction' => 'sale',
                'name' => 'Period Semi-Detached',
                'location' => 'Caversham',
                'price' => 495000,
                'size_sqft' => 1750,
                'description' => "Charming four-bedroom Edwardian semi-detached home with original features and modern updates.",
                'residential' => [
                    'bedrooms' => 4,
                    'bathrooms' => 2,
                    'council_tax_band' => 'E',
                    'parking' => 'driveway',
                    'garden' => true,
                    'property_type' => 'semi_detached',
                    'access' => null,
                ],
                'sales' => [
                    'tenure' => 'freehold',
                    'lease_years_remaining' => null,
                    'ground_rent' => null,
                    'service_charge' => null,
                ],
            ],
            [
                'agent' => $agent1,
                'category' => 'residential',
                'transaction' => 'sale',
                'name' => 'Riverside Apartment',
                'location' => 'Caversham',
                'price' => 325000,
                'size_sqft' => 1100,
                'description' => "Stunning two-bedroom apartment with river views and balcony, in a sought-after riverside development.",
                'residential' => [
                    'bedrooms' => 2,
                    'bathrooms' => 2,
                    'council_tax_band' => 'D',
                    'parking' => 'garage',
                    'garden' => false,
                    'property_type' => 'flat',
                    'access' => 'Lift access',
                ],
                'sales' => [
                    'tenure' => 'leasehold',
                    'lease_years_remaining' => 110,
                    'ground_rent' => 250,
                    'service_charge' => 1800,
                ],
            ],
            [
                'agent' => $agent1,
                'category' => 'residential',
                'transaction' => 'sale',
                'name' => 'Family Terrace',
                'location' => 'Caversham',
                'price' => 385000,
                'size_sqft' => 1450,
                'description' => "Three-bedroom Victorian terrace in the heart of Caversham village, close to shops and schools.",
                'residential' => [
                    'bedrooms' => 3,
                    'bathrooms' => 1,
                    'council_tax_band' => 'D',
                    'parking' => 'street',
                    'garden' => true,
                    'property_type' => 'terraced',
                    'access' => null,
                ],
                'sales' => [
                    'tenure' => 'freehold',
                    'lease_years_remaining' => null,
                    'ground_rent' => null,
                    'service_charge' => null,
                ],
            ],

            // AGENT 2 - RENTAL PROPERTIES (12 total: 3 Reading, 3 Wokingham, 3 Bracknell, 3 Caversham)

            // Reading Rentals (3)
            [
                'agent' => $agent2,
                'category' => 'residential',
                'transaction' => 'rental',
                'name' => 'Modern Two Bed Flat',
                'location' => 'Reading',
                'price' => 1250,
                'size_sqft' => 850,
                'description' => "Contemporary two-bedroom apartment close to Reading station, ideal for commuters.",
                'residential' => [
                    'bedrooms' => 2,
                    'bathrooms' => 1,
                    'council_tax_band' => 'C',
                    'parking' => 'garage',
                    'garden' => false,
                    'property_type' => 'flat',
                    'access' => 'Lift access',
                ],
                'rental' => [
                    'available_date' => now()->addDays(14)->format('Y-m-d'),
                    'deposit' => 1250,
                    'min_tenancy_months' => 12,
                    'let_type' => 'long_term',
                    'furnished' => 'furnished',
                    'bills_included' => false,
                    'pets_allowed' => false,
                ],
            ],
            [
                'agent' => $agent2,
                'category' => 'residential',
                'transaction' => 'rental',
                'name' => 'Three Bed Semi',
                'location' => 'Reading',
                'price' => 1650,
                'size_sqft' => 1400,
                'description' => "Well-maintained three-bedroom semi-detached home with garden and parking.",
                'residential' => [
                    'bedrooms' => 3,
                    'bathrooms' => 2,
                    'council_tax_band' => 'D',
                    'parking' => 'driveway',
                    'garden' => true,
                    'property_type' => 'semi_detached',
                    'access' => null,
                ],
                'rental' => [
                    'available_date' => now()->addDays(21)->format('Y-m-d'),
                    'deposit' => 1650,
                    'min_tenancy_months' => 12,
                    'let_type' => 'long_term',
                    'furnished' => 'unfurnished',
                    'bills_included' => false,
                    'pets_allowed' => true,
                ],
            ],
            [
                'agent' => $agent2,
                'category' => 'residential',
                'transaction' => 'rental',
                'name' => 'Studio Apartment',
                'location' => 'Reading',
                'price' => 850,
                'size_sqft' => 450,
                'description' => "Compact studio apartment in central Reading, perfect for a single professional.",
                'residential' => [
                    'bedrooms' => 1,
                    'bathrooms' => 1,
                    'council_tax_band' => 'A',
                    'parking' => 'street',
                    'garden' => false,
                    'property_type' => 'flat',
                    'access' => null,
                ],
                'rental' => [
                    'available_date' => now()->addDays(7)->format('Y-m-d'),
                    'deposit' => 850,
                    'min_tenancy_months' => 6,
                    'let_type' => 'long_term',
                    'furnished' => 'furnished',
                    'bills_included' => true,
                    'pets_allowed' => false,
                ],
            ],

            // Wokingham Rentals (3)
            [
                'agent' => $agent2,
                'category' => 'residential',
                'transaction' => 'rental',
                'name' => 'Four Bed Detached',
                'location' => 'Wokingham',
                'price' => 2200,
                'size_sqft' => 1900,
                'description' => "Spacious four-bedroom detached family home with large garden and double garage.",
                'residential' => [
                    'bedrooms' => 4,
                    'bathrooms' => 3,
                    'council_tax_band' => 'E',
                    'parking' => 'garage',
                    'garden' => true,
                    'property_type' => 'detached',
                    'access' => null,
                ],
                'rental' => [
                    'available_date' => now()->addDays(30)->format('Y-m-d'),
                    'deposit' => 2200,
                    'min_tenancy_months' => 12,
                    'let_type' => 'long_term',
                    'furnished' => 'unfurnished',
                    'bills_included' => false,
                    'pets_allowed' => true,
                ],
            ],
            [
                'agent' => $agent2,
                'category' => 'residential',
                'transaction' => 'rental',
                'name' => 'Two Bed Townhouse',
                'location' => 'Wokingham',
                'price' => 1450,
                'size_sqft' => 1100,
                'description' => "Modern two-bedroom townhouse in a popular development with allocated parking.",
                'residential' => [
                    'bedrooms' => 2,
                    'bathrooms' => 2,
                    'council_tax_band' => 'C',
                    'parking' => 'driveway',
                    'garden' => true,
                    'property_type' => 'terraced',
                    'access' => null,
                ],
                'rental' => [
                    'available_date' => now()->addDays(14)->format('Y-m-d'),
                    'deposit' => 1450,
                    'min_tenancy_months' => 12,
                    'let_type' => 'long_term',
                    'furnished' => 'part_furnished',
                    'bills_included' => false,
                    'pets_allowed' => false,
                ],
            ],
            [
                'agent' => $agent2,
                'category' => 'residential',
                'transaction' => 'rental',
                'name' => 'One Bed Flat',
                'location' => 'Wokingham',
                'price' => 950,
                'size_sqft' => 600,
                'description' => "Cosy one-bedroom flat in a quiet location, ideal for a single person or couple.",
                'residential' => [
                    'bedrooms' => 1,
                    'bathrooms' => 1,
                    'council_tax_band' => 'B',
                    'parking' => 'street',
                    'garden' => false,
                    'property_type' => 'flat',
                    'access' => null,
                ],
                'rental' => [
                    'available_date' => now()->addDays(10)->format('Y-m-d'),
                    'deposit' => 950,
                    'min_tenancy_months' => 6,
                    'let_type' => 'long_term',
                    'furnished' => 'furnished',
                    'bills_included' => false,
                    'pets_allowed' => false,
                ],
            ],

            // Bracknell Rentals (3)
            [
                'agent' => $agent2,
                'category' => 'residential',
                'transaction' => 'rental',
                'name' => 'Three Bed Detached',
                'location' => 'Bracknell',
                'price' => 1850,
                'size_sqft' => 1600,
                'description' => "Attractive three-bedroom detached home with conservatory and landscaped garden.",
                'residential' => [
                    'bedrooms' => 3,
                    'bathrooms' => 2,
                    'council_tax_band' => 'D',
                    'parking' => 'driveway',
                    'garden' => true,
                    'property_type' => 'detached',
                    'access' => null,
                ],
                'rental' => [
                    'available_date' => now()->addDays(21)->format('Y-m-d'),
                    'deposit' => 1850,
                    'min_tenancy_months' => 12,
                    'let_type' => 'long_term',
                    'furnished' => 'unfurnished',
                    'bills_included' => false,
                    'pets_allowed' => true,
                ],
            ],
            [
                'agent' => $agent2,
                'category' => 'residential',
                'transaction' => 'rental',
                'name' => 'Two Bed Bungalow',
                'location' => 'Bracknell',
                'price' => 1350,
                'size_sqft' => 950,
                'description' => "Charming two-bedroom bungalow with garden, perfect for those seeking single-level living.",
                'residential' => [
                    'bedrooms' => 2,
                    'bathrooms' => 1,
                    'council_tax_band' => 'C',
                    'parking' => 'driveway',
                    'garden' => true,
                    'property_type' => 'bungalow',
                    'access' => 'Wheelchair accessible',
                ],
                'rental' => [
                    'available_date' => now()->addDays(14)->format('Y-m-d'),
                    'deposit' => 1350,
                    'min_tenancy_months' => 12,
                    'let_type' => 'long_term',
                    'furnished' => 'part_furnished',
                    'bills_included' => false,
                    'pets_allowed' => true,
                ],
            ],
            [
                'agent' => $agent2,
                'category' => 'residential',
                'transaction' => 'rental',
                'name' => 'Modern Apartment',
                'location' => 'Bracknell',
                'price' => 1100,
                'size_sqft' => 750,
                'description' => "Contemporary two-bedroom apartment with balcony and allocated parking space.",
                'residential' => [
                    'bedrooms' => 2,
                    'bathrooms' => 1,
                    'council_tax_band' => 'B',
                    'parking' => 'garage',
                    'garden' => false,
                    'property_type' => 'flat',
                    'access' => 'Lift access',
                ],
                'rental' => [
                    'available_date' => now()->addDays(7)->format('Y-m-d'),
                    'deposit' => 1100,
                    'min_tenancy_months' => 12,
                    'let_type' => 'long_term',
                    'furnished' => 'furnished',
                    'bills_included' => false,
                    'pets_allowed' => false,
                ],
            ],

            // Caversham Rentals (3)
            [
                'agent' => $agent2,
                'category' => 'residential',
                'transaction' => 'rental',
                'name' => 'Period Terrace',
                'location' => 'Caversham',
                'price' => 1750,
                'size_sqft' => 1450,
                'description' => "Beautiful three-bedroom Victorian terrace with character features and garden.",
                'residential' => [
                    'bedrooms' => 3,
                    'bathrooms' => 1,
                    'council_tax_band' => 'D',
                    'parking' => 'street',
                    'garden' => true,
                    'property_type' => 'terraced',
                    'access' => null,
                ],
                'rental' => [
                    'available_date' => now()->addDays(28)->format('Y-m-d'),
                    'deposit' => 1750,
                    'min_tenancy_months' => 12,
                    'let_type' => 'long_term',
                    'furnished' => 'unfurnished',
                    'bills_included' => false,
                    'pets_allowed' => false,
                ],
            ],
            [
                'agent' => $agent2,
                'category' => 'residential',
                'transaction' => 'rental',
                'name' => 'Luxury Riverside Flat',
                'location' => 'Caversham',
                'price' => 1550,
                'size_sqft' => 1000,
                'description' => "Stunning two-bedroom apartment with river views and access to communal gardens.",
                'residential' => [
                    'bedrooms' => 2,
                    'bathrooms' => 2,
                    'council_tax_band' => 'D',
                    'parking' => 'garage',
                    'garden' => false,
                    'property_type' => 'flat',
                    'access' => 'Lift access',
                ],
                'rental' => [
                    'available_date' => now()->addDays(14)->format('Y-m-d'),
                    'deposit' => 1550,
                    'min_tenancy_months' => 12,
                    'let_type' => 'long_term',
                    'furnished' => 'furnished',
                    'bills_included' => false,
                    'pets_allowed' => false,
                ],
            ],
            [
                'agent' => $agent2,
                'category' => 'residential',
                'transaction' => 'rental',
                'name' => 'Family Semi-Detached',
                'location' => 'Caversham',
                'price' => 1650,
                'size_sqft' => 1350,
                'description' => "Well-presented three-bedroom semi-detached home close to Caversham village.",
                'residential' => [
                    'bedrooms' => 3,
                    'bathrooms' => 2,
                    'council_tax_band' => 'D',
                    'parking' => 'driveway',
                    'garden' => true,
                    'property_type' => 'semi_detached',
                    'access' => null,
                ],
                'rental' => [
                    'available_date' => now()->addDays(21)->format('Y-m-d'),
                    'deposit' => 1650,
                    'min_tenancy_months' => 12,
                    'let_type' => 'long_term',
                    'furnished' => 'part_furnished',
                    'bills_included' => false,
                    'pets_allowed' => true,
                ],
            ],
        ];

        // Create properties
        foreach ($properties as $propertyData) {
            $this->createProperty($propertyData, $imageCategories);
        }

        $this->command->info('Created ' . count($properties) . ' properties with images!');
    }

    /**
     * Create a single property with all relationships and images
     */
    private function createProperty(array $data, array $imageCategories): void
    {
        // 1. Create transaction record
        if ($data['transaction'] === 'sale') {
            $transaction = SalesProperty::create($data['sales']);
            $transactionType = SalesProperty::class;
        }
        else {
            $transaction = RentalProperty::create($data['rental']);
            $transactionType = RentalProperty::class;
        }

        // 2. Create category record
        if ($data['category'] === 'residential') {
            $categoryData = $data['residential'];
            $categoryData['transaction_type'] = $transactionType;
            $categoryData['transaction_id'] = $transaction->id;
            $category = ResidentialProperty::create($categoryData);
            $categoryType = ResidentialProperty::class;
        }
        else {
            $categoryData = $data['commercial'];
            $categoryData['transaction_type'] = $transactionType;
            $categoryData['transaction_id'] = $transaction->id;
            $category = CommercialProperty::create($categoryData);
            $categoryType = CommercialProperty::class;
        }

        // 3. Create general property
        $generalProperty = GeneralProperty::create([
            'agent_id' => $data['agent']->id,
            'name' => $data['name'],
            'location' => $data['location'],
            'price' => $data['price'],
            'size_sqft' => $data['size_sqft'],
            'description' => $data['description'],
            'property_category_type' => $categoryType,
            'property_category_id' => $category->id,
        ]);

        // 4. Add images (3-6 random images per property)
        $this->addImagesToProperty($generalProperty, $imageCategories);
    }

    /**
     * Add random images to a property
     */
    private function addImagesToProperty(GeneralProperty $property, array $imageCategories): void
    {
        $imageCount = rand(3, 6);
        $selectedImages = [];

        // Always include a front house image first
        if (!empty($imageCategories['front house'])) {
            $selectedImages[] = $imageCategories['front house'][array_rand($imageCategories['front house'])];
        }

        // Add random images from other categories
        $otherCategories = ['bedroom', 'living room', 'dining room', 'garden'];
        shuffle($otherCategories);

        foreach ($otherCategories as $category) {
            if (count($selectedImages) >= $imageCount) {
                break;
            }

            if (!empty($imageCategories[$category])) {
                $selectedImages[] = $imageCategories[$category][array_rand($imageCategories[$category])];
            }
        }

        // Copy images to property directory and create database records
        $order = 1;
        foreach ($selectedImages as $sourcePath) {
            $filename = basename($sourcePath);
            $destinationPath = "properties/{$property->id}/" . uniqid() . '_' . $filename;

            // Copy file to property directory
            Storage::disk('public')->put(
                $destinationPath,
                File::get($sourcePath)
            );

            // Create database record
            PropertyImage::create([
                'general_property_id' => $property->id,
                'image_path' => $destinationPath,
                'order' => $order++,
            ]);
        }
    }
}
