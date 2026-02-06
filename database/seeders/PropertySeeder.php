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
            // Residential Sales Properties
            [
                'agent' => $agent1,
                'category' => 'residential',
                'transaction' => 'sale',
                'name' => 'Charming Victorian Terrace',
                'location' => 'Brighton, East Sussex',
                'price' => 425000,
                'size_sqft' => 1450,
                'description' => "A beautifully presented Victorian terrace house featuring original period features throughout. This stunning property offers spacious accommodation over three floors with high ceilings, large sash windows, and a lovely south-facing garden.\n\nThe property has been tastefully renovated to blend modern convenience with period charm, including a contemporary kitchen and bathrooms whilst retaining original fireplaces and cornicing.",
                'residential' => [
                    'bedrooms' => 3,
                    'bathrooms' => 2,
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
            [
                'agent' => $agent2,
                'category' => 'residential',
                'transaction' => 'sale',
                'name' => 'Modern Detached Family Home',
                'location' => 'Reading, Berkshire',
                'price' => 675000,
                'size_sqft' => 2100,
                'description' => "An exceptional four-bedroom detached family home built in 2018, offering contemporary living spaces with high-quality fixtures and fittings throughout. The property features an open-plan kitchen/dining area, separate living room, and a master bedroom with en-suite.\n\nThe landscaped rear garden is perfect for family entertaining, and the property benefits from a double garage and driveway parking.",
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
                'name' => 'Stylish City Centre Apartment',
                'location' => 'Manchester City Centre',
                'price' => 285000,
                'size_sqft' => 850,
                'description' => "A stunning two-bedroom apartment on the 8th floor of a prestigious development in the heart of Manchester. Floor-to-ceiling windows provide breathtaking city views and flood the apartment with natural light.\n\nThe property features a modern open-plan living area, two double bedrooms, and a contemporary bathroom. Residents benefit from a 24-hour concierge, gym facilities, and secure underground parking.",
                'residential' => [
                    'bedrooms' => 2,
                    'bathrooms' => 1,
                    'council_tax_band' => 'C',
                    'parking' => 'garage',
                    'garden' => false,
                    'property_type' => 'flat',
                    'access' => 'Lift access, wheelchair accessible communal areas',
                ],
                'sales' => [
                    'tenure' => 'leasehold',
                    'lease_years_remaining' => 125,
                    'ground_rent' => 250,
                    'service_charge' => 1800,
                ],
            ],

            // Residential Rental Properties
            [
                'agent' => $agent2,
                'category' => 'residential',
                'transaction' => 'rental',
                'name' => 'Cosy Two-Bedroom Cottage',
                'location' => 'Cotswolds, Gloucestershire',
                'price' => 1250,
                'size_sqft' => 950,
                'description' => "A delightful stone cottage in the picturesque Cotswolds, perfect for those seeking a peaceful rural retreat. The property retains many original features including exposed beams and a working fireplace.\n\nThe cottage offers two comfortable bedrooms, a charming living room, and a country-style kitchen. The enclosed garden is ideal for enjoying the tranquil surroundings.",
                'residential' => [
                    'bedrooms' => 2,
                    'bathrooms' => 1,
                    'council_tax_band' => 'C',
                    'parking' => 'driveway',
                    'garden' => true,
                    'property_type' => 'detached',
                    'access' => null,
                ],
                'rental' => [
                    'available_date' => now()->addDays(14)->format('Y-m-d'),
                    'deposit' => 1250,
                    'min_tenancy_months' => 12,
                    'let_type' => 'long_term',
                    'furnished' => 'part_furnished',
                    'bills_included' => false,
                    'pets_allowed' => true,
                ],
            ],
            [
                'agent' => $agent1,
                'category' => 'residential',
                'transaction' => 'rental',
                'name' => 'Luxury Penthouse Suite',
                'location' => 'Canary Wharf, London',
                'price' => 3500,
                'size_sqft' => 1600,
                'description' => "An exceptional three-bedroom penthouse apartment offering unparalleled luxury living in the heart of Canary Wharf. This stunning property features a wraparound terrace with panoramic views of the Thames and London skyline.\n\nThe apartment is finished to the highest specification with designer furnishings, integrated appliances, and premium fixtures throughout. Building amenities include a gym, swimming pool, and 24-hour concierge.",
                'residential' => [
                    'bedrooms' => 3,
                    'bathrooms' => 2,
                    'council_tax_band' => 'F',
                    'parking' => 'garage',
                    'garden' => false,
                    'property_type' => 'flat',
                    'access' => 'Lift access, wheelchair accessible',
                ],
                'rental' => [
                    'available_date' => now()->addDays(7)->format('Y-m-d'),
                    'deposit' => 7000,
                    'min_tenancy_months' => 12,
                    'let_type' => 'corporate',
                    'furnished' => 'furnished',
                    'bills_included' => true,
                    'pets_allowed' => false,
                ],
            ],

            // Commercial Properties
            [
                'agent' => $agent2,
                'category' => 'commercial',
                'transaction' => 'sale',
                'name' => 'Prime Retail Unit',
                'location' => 'High Street, Oxford',
                'price' => 850000,
                'size_sqft' => 2500,
                'description' => "An exceptional retail opportunity in a prime high street location. This well-presented unit benefits from excellent footfall and prominent frontage on one of Oxford's busiest shopping streets.\n\nThe property comprises ground floor retail space with storage and staff facilities to the rear, plus additional storage on the first floor. Ideal for a variety of retail uses.",
                'commercial' => [
                    'property_type' => 'retail',
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
                'category' => 'commercial',
                'transaction' => 'rental',
                'name' => 'Modern Office Space',
                'location' => 'Business Park, Cambridge',
                'price' => 2800,
                'size_sqft' => 1800,
                'description' => "Contemporary office space in a prestigious business park location, perfect for growing businesses. The unit features air conditioning, raised floors for IT cabling, and excellent natural light throughout.\n\nOn-site amenities include ample parking, meeting rooms, and a café. The business park is easily accessible from the M11 and Cambridge city centre.",
                'commercial' => [
                    'property_type' => 'other',
                ],
                'rental' => [
                    'available_date' => now()->addDays(30)->format('Y-m-d'),
                    'deposit' => 5600,
                    'min_tenancy_months' => 24,
                    'let_type' => 'corporate',
                    'furnished' => 'unfurnished',
                    'bills_included' => false,
                    'pets_allowed' => false,
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
