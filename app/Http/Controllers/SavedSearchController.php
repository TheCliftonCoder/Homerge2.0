<?php

namespace App\Http\Controllers;

use App\Models\SavedSearch;
use App\Services\PropertySearchService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class SavedSearchController extends Controller
{
    public function __construct(
        private PropertySearchService $searchService
    ) {
    }

    /**
     * Display a list of the user's saved searches.
     */
    public function index(): Response
    {
        $user = Auth::user();
        $since = $user->previous_login_at ?? $user->created_at;

        $savedSearches = $user->savedSearches()
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($search) use ($since) {
                $results = $this->searchService->searchProperties($search->filters, $since);
                $newCount = ($results instanceof \Illuminate\Database\Eloquent\Builder)
                    ? $results->count()
                    : $results->count();

                return [
                    'id' => $search->id,
                    'name' => $search->name,
                    'filters' => $search->filters,
                    'new_count' => $newCount,
                    'created_at' => $search->created_at->toIso8601String(),
                ];
            });

        return Inertia::render('Properties/SavedSearches', [
            'savedSearches' => $savedSearches,
        ]);
    }

    /**
     * Store a newly created saved search in storage.
     */
    public function store(Request $request): RedirectResponse
    {
        $user = Auth::user();

        // Enforce the 5 saved searches limit
        if ($user->savedSearches()->count() >= 5) {
            return back()->withErrors(['error' => 'You can only save up to 5 searches. Delete an old search to save a new one.']);
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'filters' => 'required|array',
        ]);

        // Enforce uniqueness of saved search criteria
        $newNormalized = $this->normalizeFiltersForComparison($validated['filters']);
        $existingSearches = $user->savedSearches()->get();
        foreach ($existingSearches as $existing) {
            if ($this->normalizeFiltersForComparison($existing->filters) === $newNormalized) {
                return back()->withErrors(['error' => 'You have already saved a search with these filters.']);
            }
        }

        $user->savedSearches()->create([
            'name' => $validated['name'],
            'filters' => $validated['filters'],
        ]);

        return back()->with('success', 'Search saved successfully!');
    }

    /**
     * Normalize filter arrays to a canonical format for comparison.
     */
    private function normalizeFiltersForComparison(array $filters): array
    {
        $normalized = [];
        $scalarKeys = [
            'location', 'radius', 'min_price', 'max_price', 
            'property_category', 'transaction_type', 'bedrooms', 
            'bathrooms', 'property_type', 'parking', 'garden', 
            'min_size', 'max_size', 'tenure', 'furnished', 
            'pets_allowed', 'available_from'
        ];

        foreach ($scalarKeys as $key) {
            if (isset($filters[$key]) && $filters[$key] !== '') {
                $normalized[$key] = trim(strtolower((string)$filters[$key]));
            }
        }

        // Proximity pins
        if (isset($filters['proximity_pins']) && is_array($filters['proximity_pins'])) {
            $pins = [];
            foreach ($filters['proximity_pins'] as $p) {
                if (empty($p['query'])) continue;
                $pins[] = [
                    'type' => strtolower($p['type'] ?? 'commute'),
                    'query' => trim(strtolower($p['query'])),
                    'value' => isset($p['value']) ? (float)$p['value'] : null,
                    'mode' => isset($p['mode']) ? trim(strtolower($p['mode'])) : null,
                    'pin_mode' => strtolower($p['pin_mode'] ?? 'filter')
                ];
            }
            // Sort pins
            usort($pins, function ($a, $b) {
                return strcmp($a['query'], $b['query']) ?: strcmp($a['type'], $b['type']);
            });
            if (!empty($pins)) {
                $normalized['proximity_pins'] = $pins;
            }
        }

        // POI Proximity
        if (isset($filters['poi_proximity']) && is_array($filters['poi_proximity'])) {
            $pois = [];
            foreach ($filters['poi_proximity'] as $p) {
                if (empty($p['poi_type'])) continue;
                $pois[] = [
                    'poi_type' => trim(strtolower($p['poi_type'])),
                    'max_miles' => isset($p['max_miles']) ? (float)$p['max_miles'] : 1.0,
                    'pin_mode' => strtolower($p['pin_mode'] ?? 'filter')
                ];
            }
            // Sort POIs
            usort($pois, function ($a, $b) {
                return strcmp($a['poi_type'], $b['poi_type']);
            });
            if (!empty($pois)) {
                $normalized['poi_proximity'] = $pois;
            }
        }

        return $normalized;
    }

    /**
     * Update the specified saved search in storage.
     */
    public function update(Request $request, SavedSearch $savedSearch): RedirectResponse
    {
        // Authorize ownership
        if ($savedSearch->user_id !== Auth::id()) {
            abort(403, 'Unauthorized action.');
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
        ]);

        $savedSearch->update([
            'name' => $validated['name'],
        ]);

        return back()->with('success', 'Search renamed successfully.');
    }

    /**
     * Remove the specified saved search from storage.
     */
    public function destroy(SavedSearch $savedSearch): RedirectResponse
    {
        // Authorize ownership
        if ($savedSearch->user_id !== Auth::id()) {
            abort(403, 'Unauthorized action.');
        }

        $savedSearch->delete();

        return back()->with('success', 'Saved search deleted successfully.');
    }
}
