<?php

namespace App\Http\Controllers;

use App\Models\Property;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class PropertyController extends Controller
{
    /**
     * Display all properties (public page).
     */
    public function index(): Response
    {
        $properties = Property::with(['agent', 'images'])
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
     * Store a newly created property.
     */
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'price' => 'required|numeric|min:0',
            'location' => 'required|string|max:255',
            'size_sqft' => 'required|integer|min:1',
            'images' => 'nullable|array|max:10',
            'images.*' => 'image|mimes:jpeg,png,jpg|max:2048',
        ]);

        $property = Property::create([
            'name' => $validated['name'],
            'price' => $validated['price'],
            'location' => $validated['location'],
            'size_sqft' => $validated['size_sqft'],
            'agent_id' => Auth::id(),
        ]);

        // Handle image uploads
        if ($request->hasFile('images')) {
            foreach ($request->file('images') as $index => $image) {
                $path = $image->store('properties/' . $property->id, 'public');

                \App\Models\PropertyImage::create([
                    'property_id' => $property->id,
                    'image_path' => $path,
                    'order' => $index + 1,
                ]);
            }
        }

        return redirect()->route('properties.my')->with('success', 'Property listed successfully!');
    }

    /**
     * Display the authenticated agent's properties.
     */
    public function myProperties(): Response
    {
        $properties = Property::with('images')
            ->where('agent_id', Auth::id())
            ->orderBy('created_at', 'desc')
            ->get();

        return Inertia::render('Properties/MyProperties', [
            'properties' => $properties,
        ]);
    }

    /**
     * Show the form for editing the specified property.
     */
    public function edit($id): Response
    {
        $property = Property::with('images')->findOrFail($id);

        // Authorize: only property owner can edit
        if ($property->agent_id !== Auth::id()) {
            abort(403, 'Unauthorized action.');
        }

        return Inertia::render('Properties/Edit', [
            'property' => $property,
        ]);
    }

    /**
     * Update the specified property.
     */
    public function update(Request $request, $id): RedirectResponse
    {
        $property = Property::findOrFail($id);

        // Authorize: only property owner can update
        if ($property->agent_id !== Auth::id()) {
            abort(403, 'Unauthorized action.');
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'price' => 'required|numeric|min:0',
            'location' => 'required|string|max:255',
            'size_sqft' => 'required|integer|min:1',
            'images' => 'nullable|array|max:10',
            'images.*' => 'image|mimes:jpeg,png,jpg|max:2048',
        ]);

        $property->update([
            'name' => $validated['name'],
            'price' => $validated['price'],
            'location' => $validated['location'],
            'size_sqft' => $validated['size_sqft'],
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

                \App\Models\PropertyImage::create([
                    'property_id' => $property->id,
                    'image_path' => $path,
                    'order' => $currentImageCount + $index + 1,
                ]);
            }
        }

        return redirect()->route('properties.my')->with('success', 'Property updated successfully!');
    }

    /**
     * Remove the specified property.
     */
    public function destroy($id): RedirectResponse
    {
        $property = Property::with('images')->findOrFail($id);

        // Authorize: only property owner can delete
        if ($property->agent_id !== Auth::id()) {
            abort(403, 'Unauthorized action.');
        }

        // Delete all images from storage
        foreach ($property->images as $image) {
            \Storage::disk('public')->delete($image->image_path);
        }

        // Delete property directory if empty
        $directory = 'properties/' . $property->id;
        if (\Storage::disk('public')->exists($directory)) {
            \Storage::disk('public')->deleteDirectory($directory);
        }

        $property->delete();

        return redirect()->route('properties.my')->with('success', 'Property deleted successfully!');
    }

    /**
     * Delete a specific image from a property.
     */
    public function deleteImage($propertyId, $imageId): RedirectResponse
    {
        $property = Property::findOrFail($propertyId);

        // Authorize: only property owner can delete images
        if ($property->agent_id !== Auth::id()) {
            abort(403, 'Unauthorized action.');
        }

        $image = \App\Models\PropertyImage::where('property_id', $propertyId)
            ->where('id', $imageId)
            ->firstOrFail();

        // Delete file from storage
        \Storage::disk('public')->delete($image->image_path);

        // Delete database record
        $image->delete();

        return back()->with('success', 'Image deleted successfully!');
    }
}
