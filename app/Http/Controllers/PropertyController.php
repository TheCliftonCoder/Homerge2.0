<?php

namespace App\Http\Controllers;

use App\Models\GeneralProperty;
use App\Models\ResidentialProperty;
use App\Models\CommercialProperty;
use App\Models\SalesProperty;
use App\Models\RentalProperty;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Inertia\Response;

class PropertyController extends Controller
{
    /**
     * Display all properties (public page).
     */
    public function index(): Response
    {
        $properties = GeneralProperty::with(['agent', 'images', 'propertyCategory.transaction'])
            ->orderBy('created_at', 'desc')
            ->get();

        return Inertia::render('Properties/Index', [
            'properties' => $properties,
        ]);
    }

    /**
     * Show the form for creating a new property.
     */
    public function create(): Response
    {
        return Inertia::render('Properties/Create');
    }

    /**
     * Display a single property with all details.
     */
    public function show(GeneralProperty $property): Response
    {
        $property->load(['agent', 'images', 'propertyCategory.transaction']);

        return Inertia::render('Properties/Show', [
            'property' => $property,
        ]);
    }

    /**
     * Search properties with filters.
     */
    public function search(Request $request): Response
    {
        $query = GeneralProperty::with(['agent', 'images', 'propertyCategory.transaction']);

        // Basic Filters
        if ($request->filled('location')) {
            $query->where('location', 'like', '%' . $request->location . '%');
        }

        if ($request->filled('min_price')) {
            $query->where('price', '>=', $request->min_price);
        }

        if ($request->filled('max_price')) {
            $query->where('price', '<=', $request->max_price);
        }

        if ($request->filled('property_category')) {
            $query->where('property_category_type', 'like', '%' . $request->property_category . '%');
        }

        // Size filters
        if ($request->filled('min_size')) {
            $query->where('size_sqft', '>=', $request->min_size);
        }

        if ($request->filled('max_size')) {
            $query->where('size_sqft', '<=', $request->max_size);
        }

        // Category-specific filters (Residential)
        if ($request->filled('bedrooms')) {
            $query->whereHas('propertyCategory', function ($q) use ($request) {
                $q->where('property_category_type', 'like', '%ResidentialProperty%')
                    ->where('bedrooms', '>=', $request->bedrooms);
            });
        }

        if ($request->filled('bathrooms')) {
            $query->whereHas('propertyCategory', function ($q) use ($request) {
                $q->where('property_category_type', 'like', '%ResidentialProperty%')
                    ->where('bathrooms', '>=', $request->bathrooms);
            });
        }

        if ($request->filled('parking')) {
            $query->whereHas('propertyCategory', function ($q) use ($request) {
                $q->where('property_category_type', 'like', '%ResidentialProperty%')
                    ->where('parking', $request->parking);
            });
        }

        if ($request->filled('garden')) {
            $query->whereHas('propertyCategory', function ($q) use ($request) {
                $q->where('property_category_type', 'like', '%ResidentialProperty%')
                    ->where('garden', $request->garden === 'true' || $request->garden === '1');
            });
        }

        if ($request->filled('property_type')) {
            $query->whereHas('propertyCategory', function ($q) use ($request) {
                $q->where('property_type', $request->property_type);
            });
        }

        // Transaction-specific filters
        if ($request->filled('transaction_type')) {
            $query->whereHas('propertyCategory.transaction', function ($q) use ($request) {
                $q->where('transaction_type', 'like', '%' . $request->transaction_type . '%');
            });
        }

        // Sales-specific filters
        if ($request->filled('tenure')) {
            $query->whereHas('propertyCategory.transaction', function ($q) use ($request) {
                $q->where('transaction_type', 'like', '%SalesProperty%')
                    ->where('tenure', $request->tenure);
            });
        }

        // Rental-specific filters
        if ($request->filled('furnished')) {
            $query->whereHas('propertyCategory.transaction', function ($q) use ($request) {
                $q->where('transaction_type', 'like', '%RentalProperty%')
                    ->where('furnished', $request->furnished);
            });
        }

        if ($request->filled('pets_allowed')) {
            $query->whereHas('propertyCategory.transaction', function ($q) use ($request) {
                $q->where('transaction_type', 'like', '%RentalProperty%')
                    ->where('pets_allowed', $request->pets_allowed === 'true' || $request->pets_allowed === '1');
            });
        }

        if ($request->filled('available_from')) {
            $query->whereHas('propertyCategory.transaction', function ($q) use ($request) {
                $q->where('transaction_type', 'like', '%RentalProperty%')
                    ->where('available_date', '>=', $request->available_from);
            });
        }

        // Order by most recent
        $query->orderBy('created_at', 'desc');

        // Paginate results
        $properties = $query->paginate(12)->withQueryString();

        return Inertia::render('Properties/Search', [
            'properties' => $properties,
            'filters' => $request->only([
                'location', 'min_price', 'max_price', 'property_category', 'transaction_type',
                'bedrooms', 'bathrooms', 'property_type', 'parking', 'garden',
                'min_size', 'max_size', 'tenure', 'furnished', 'pets_allowed', 'available_from'
            ]),
        ]);
    }


    /**
     * Store a newly created property.
     */
    public function store(Request $request): RedirectResponse
    {
        try {
            // Base validation with custom error messages
            $validated = $request->validate([
                'name' => 'required|string|max:255',
                'price' => 'required|numeric|min:0',
                'location' => 'required|string|max:255',
                'size_sqft' => 'required|integer|min:1',
                'description' => 'nullable|string',
                'property_category' => 'required|in:residential,commercial',
                'transaction_type' => 'required|in:sale,rental',
                'images' => 'nullable|array|max:10',
                'images.*' => 'image|mimes:jpeg,png,jpg|max:5120', // 5MB per image
            ], [
                'images.*.max' => 'Each image must not exceed 5MB.',
                'images.*.image' => 'All files must be valid images.',
                'images.*.mimes' => 'Images must be in JPEG, PNG, or JPG format.',
                'images.max' => 'You can upload a maximum of 10 images.',
            ]);

            // Category-specific validation
            if ($validated['property_category'] === 'residential') {
                $categoryData = $request->validate([
                    'bedrooms' => 'required|integer|min:0',
                    'bathrooms' => 'required|integer|min:0',
                    'council_tax_band' => 'nullable|string|max:1',
                    'parking' => 'required|in:none,street,driveway,garage',
                    'garden' => 'required|boolean',
                    'property_type' => 'required|in:detached,semi_detached,terraced,flat,bungalow',
                    'access' => 'nullable|string',
                ]);
            }
            else {
                $categoryData = $request->validate([
                    'property_type' => 'required|in:retail,leisure,industrial,land_development,other',
                ]);
            }

            // Transaction-specific validation
            if ($validated['transaction_type'] === 'sale') {
                $transactionData = $request->validate([
                    'tenure' => 'required|in:freehold,leasehold,share_of_freehold',
                    'lease_years_remaining' => 'nullable|integer|min:0',
                    'ground_rent' => 'nullable|numeric|min:0',
                    'service_charge' => 'nullable|numeric|min:0',
                ]);
            }
            else {
                $transactionData = $request->validate([
                    'available_date' => 'required|date',
                    'deposit' => 'required|numeric|min:0',
                    'min_tenancy_months' => 'required|integer|min:1',
                    'let_type' => 'required|in:long_term,short_term,corporate',
                    'furnished' => 'required|in:unfurnished,part_furnished,furnished',
                    'bills_included' => 'required|boolean',
                    'pets_allowed' => 'required|boolean',
                ]);
            }

            // Create property in transaction
            DB::transaction(function () use ($validated, $categoryData, $transactionData, $request) {
                // 1. Create transaction record (Sales or Rental)
                if ($validated['transaction_type'] === 'sale') {
                    $transaction = SalesProperty::create($transactionData);
                    $transactionType = SalesProperty::class;
                }
                else {
                    $transaction = RentalProperty::create($transactionData);
                    $transactionType = RentalProperty::class;
                }

                // 2. Create category record (Residential or Commercial)
                $categoryData['transaction_type'] = $transactionType;
                $categoryData['transaction_id'] = $transaction->id;

                if ($validated['property_category'] === 'residential') {
                    $category = ResidentialProperty::create($categoryData);
                    $categoryType = ResidentialProperty::class;
                }
                else {
                    $category = CommercialProperty::create($categoryData);
                    $categoryType = CommercialProperty::class;
                }

                // 3. Create general property record
                $generalProperty = GeneralProperty::create([
                    'agent_id' => Auth::id(),
                    'name' => $validated['name'],
                    'location' => $validated['location'],
                    'price' => $validated['price'],
                    'size_sqft' => $validated['size_sqft'],
                    'description' => $validated['description'] ?? null,
                    'property_category_type' => $categoryType,
                    'property_category_id' => $category->id,
                ]);

                // 4. Handle image uploads
                if ($request->hasFile('images')) {
                    foreach ($request->file('images') as $index => $image) {
                        if (!$image->isValid()) {
                            throw new \Exception('One or more images failed to upload. Please check file sizes and formats.');
                        }

                        $path = $image->store('properties/' . $generalProperty->id, 'public');
                        $generalProperty->images()->create([
                            'image_path' => $path,
                            'order' => $index + 1,
                        ]);
                    }
                }
            });

            return redirect()->route('properties.my')->with('success', 'Property listed successfully!');

        }
        catch (\Illuminate\Validation\ValidationException $e) {
            // Validation errors are automatically handled by Laravel
            throw $e;
        }
        catch (\Exception $e) {
            // Log the error for debugging
            Log::error('Property creation failed: ' . $e->getMessage(), [
                'user_id' => Auth::id(),
                'trace' => $e->getTraceAsString()
            ]);

            return back()
                ->withInput()
                ->withErrors(['error' => 'Failed to create property: ' . $e->getMessage() . ' Please check your images are under 5MB each and try again.']);
        }
    }

    /**
     * Display the agent's properties.
     */
    public function myProperties(): Response
    {
        $properties = GeneralProperty::with(['images', 'propertyCategory.transaction'])
            ->where('agent_id', Auth::id())
            ->orderBy('created_at', 'desc')
            ->get();

        return Inertia::render('Properties/MyProperties', [
            'properties' => $properties,
        ]);
    }

    /**
     * Show the form for editing a property.
     */
    public function edit(GeneralProperty $property): Response
    {
        // Authorization check
        if ($property->agent_id !== Auth::id()) {
            abort(403, 'Unauthorized action.');
        }

        $property->load(['images', 'propertyCategory.transaction']);

        return Inertia::render('Properties/Edit', [
            'property' => $property,
        ]);
    }

    /**
     * Update the specified property.
     */
    public function update(Request $request, GeneralProperty $property): RedirectResponse
    {
        // Authorization check
        if ($property->agent_id !== Auth::id()) {
            abort(403, 'Unauthorized action.');
        }

        // Base validation
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'price' => 'required|numeric|min:0',
            'location' => 'required|string|max:255',
            'size_sqft' => 'required|integer|min:1',
            'description' => 'nullable|string',
            'images' => 'nullable|array',
            'images.*' => 'image|mimes:jpeg,png,jpg|max:2048',
        ]);

        DB::transaction(function () use ($property, $validated, $request) {
            // Update general property
            $property->update([
                'name' => $validated['name'],
                'location' => $validated['location'],
                'price' => $validated['price'],
                'size_sqft' => $validated['size_sqft'],
                'description' => $validated['description'] ?? null,
            ]);

            // Handle new image uploads
            if ($request->hasFile('images')) {
                $currentImageCount = $property->images()->count();
                $newImagesCount = count($request->file('images'));

                if ($currentImageCount + $newImagesCount > 10) {
                    return back()->withErrors(['images' => 'Cannot exceed 10 images per property.']);
                }

                foreach ($request->file('images') as $index => $image) {
                    $path = $image->store('properties/' . $property->id, 'public');
                    $property->images()->create([
                        'image_path' => $path,
                        'order' => $currentImageCount + $index + 1,
                    ]);
                }
            }
        });

        return redirect()->route('properties.my')->with('success', 'Property updated successfully!');
    }

    /**
     * Remove the specified property.
     */
    public function destroy(GeneralProperty $property): RedirectResponse
    {
        // Authorization check
        if ($property->agent_id !== Auth::id()) {
            abort(403, 'Unauthorized action.');
        }

        DB::transaction(function () use ($property) {
            // Delete all images from storage
            foreach ($property->images as $image) {
                Storage::disk('public')->delete($image->image_path);
            }

            // Delete property directory
            $directory = 'properties/' . $property->id;
            if (Storage::disk('public')->exists($directory)) {
                Storage::disk('public')->deleteDirectory($directory);
            }

            // Delete images from database
            $property->images()->delete();

            // Load relationships before deletion
            $category = $property->propertyCategory;
            if ($category) {
                $transaction = $category->transaction;

                // Delete in reverse order: general -> category -> transaction
                $property->delete();
                $category->delete();
                if ($transaction) {
                    $transaction->delete();
                }
            }
            else {
                $property->delete();
            }
        });

        return redirect()->route('properties.my')->with('success', 'Property deleted successfully!');
    }

    /**
     * Delete a single image from a property.
     */
    public function deleteImage(GeneralProperty $property, $imageId): RedirectResponse
    {
        // Authorization check
        if ($property->agent_id !== Auth::id()) {
            abort(403, 'Unauthorized action.');
        }

        $image = $property->images()->findOrFail($imageId);

        // Delete file from storage
        Storage::disk('public')->delete($image->image_path);

        // Delete from database
        $image->delete();

        return back()->with('success', 'Image deleted successfully!');
    }
}
