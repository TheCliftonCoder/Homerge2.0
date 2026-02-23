<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Inertia\Response;

class ApplicantSearchController extends Controller
{
    /**
     * Display the applicant search page.
     */
    public function index(Request $request): Response
    {
        $filters = [
            'activity_type'    => $request->input('activity_type', 'favourites'),
            'transaction_type' => $request->input('transaction_type', ''),
            'price_min'        => $request->input('price_min', ''),
            'price_max'        => $request->input('price_max', ''),
            'bedrooms_min'     => $request->input('bedrooms_min', ''),
            'bedrooms_max'     => $request->input('bedrooms_max', ''),
            'last_activity'    => $request->input('last_activity', ''),
            'property_type'    => $request->input('property_type', ''),
            'location'         => $request->input('location', ''),
            'activity_level'   => $request->input('activity_level', ''),
        ];

        // A search is in progress whenever activity_type appears in the query string.
        // It is always sent by every toggle/search action, but never present on the initial page load.
        $hasFilters = $request->has('activity_type');

        Log::info('[ApplicantSearch] index() called', [
            'all_query_params' => $request->query(),
            'has_activity_type' => $request->has('activity_type'),
            'hasFilters' => $hasFilters,
            'filters' => $filters,
        ]);

        $applicants = $hasFilters ? $this->runSearch($filters) : collect();

        Log::info('[ApplicantSearch] Returning applicants', [
            'applicant_count' => $applicants->count(),
        ]);

        return Inertia::render('Agent/ApplicantSearch', [
            'filters'    => $filters,
            'applicants' => $applicants,
            'searched'   => $hasFilters,
        ]);
    }

    private function runSearch(array $filters): \Illuminate\Support\Collection
    {
        $activityType    = $filters['activity_type'];
        $transactionType = $filters['transaction_type'];
        $priceMin    = ($filters['price_min']    !== '' && $filters['price_min']    !== null) ? (float) $filters['price_min']    : null;
$priceMax    = ($filters['price_max']    !== '' && $filters['price_max']    !== null) ? (float) $filters['price_max']    : null;
$bedroomsMin = ($filters['bedrooms_min'] !== '' && $filters['bedrooms_min'] !== null) ? (int)   $filters['bedrooms_min'] : null;
$bedroomsMax = ($filters['bedrooms_max'] !== '' && $filters['bedrooms_max'] !== null) ? (int)   $filters['bedrooms_max'] : null;
        $lastActivity    = $filters['last_activity'];
        $propertyType    = $filters['property_type'];
        $location        = trim($filters['location']);
        $activityLevel   = $filters['activity_level'];


        Log::info('[ApplicantSearch] runSearch() resolved values', [
            'activityType'    => $activityType,
            'transactionType' => $transactionType,
            'priceMin'        => $priceMin,
            'priceMax'        => $priceMax,
            'bedroomsMin'     => $bedroomsMin,
            'bedroomsMax'     => $bedroomsMax,
            'lastActivity'    => $lastActivity,
            'propertyType'    => $propertyType,
            'location'        => $location,
            'activityLevel'   => $activityLevel,
        ]);

        $activityCutoff = match($lastActivity) {
            '24h'   => now()->subHours(24),
            '48h'   => now()->subHours(48),
            '7d'    => now()->subDays(7),
            '1m'    => now()->subMonth(),
            '6m'    => now()->subMonths(6),
            default => null,
        };

        if ($activityType === 'favourites') {
            $query = User::where('role', 'applicant')
                ->whereHas('favouriteProperties', function ($q) use (
                    $transactionType, $priceMin, $priceMax,
                    $bedroomsMin, $bedroomsMax, $propertyType, $location, $activityCutoff
                ) {
                    $this->applyPropertyFilters($q, $transactionType, $priceMin, $priceMax, $bedroomsMin, $bedroomsMax, $propertyType, $location);
                    if ($activityCutoff) {
                        $q->where('property_favourites.created_at', '>=', $activityCutoff);
                    }
                })
                ->with([
                    'favouriteProperties' => function ($q) use (
                        $transactionType, $priceMin, $priceMax,
                        $bedroomsMin, $bedroomsMax, $propertyType, $location
                    ) {
                        $this->applyPropertyFilters($q, $transactionType, $priceMin, $priceMax, $bedroomsMin, $bedroomsMax, $propertyType, $location);
                        $q->withPivot('created_at');
                    },
                ]);
        } else {
            $query = User::where('role', 'applicant')
                ->whereHas('propertyEnquiries.property', function ($q) use (
                    $transactionType, $priceMin, $priceMax,
                    $bedroomsMin, $bedroomsMax, $propertyType, $location
                ) {
                    $this->applyPropertyFilters($q, $transactionType, $priceMin, $priceMax, $bedroomsMin, $bedroomsMax, $propertyType, $location);
                })
                ->when($activityCutoff, function ($q) use ($activityCutoff) {
                    $q->whereHas('propertyEnquiries', function ($q2) use ($activityCutoff) {
                        $q2->where('created_at', '>=', $activityCutoff);
                    });
                })
                ->with([
                    'propertyEnquiries' => function ($q) use (
                        $transactionType, $priceMin, $priceMax,
                        $bedroomsMin, $bedroomsMax, $propertyType, $location, $activityCutoff
                    ) {
                        if ($activityCutoff) {
                            $q->where('created_at', '>=', $activityCutoff);
                        }
                        $q->with(['property' => function ($qp) use (
                            $transactionType, $priceMin, $priceMax,
                            $bedroomsMin, $bedroomsMax, $propertyType, $location
                        ) {
                            $this->applyPropertyFilters($qp, $transactionType, $priceMin, $priceMax, $bedroomsMin, $bedroomsMax, $propertyType, $location);
                        }]);
                    },
                ]);
        }

        $rawUsers = $query->get();
        Log::info('[ApplicantSearch] Raw users from query', ['count' => $rawUsers->count()]);
        return $rawUsers
            ->map(function ($applicant) use ($activityType, $activityLevel) {
                $analytics = $activityType === 'favourites'
                    ? $this->buildFavouritesAnalytics($applicant)
                    : $this->buildEnquiriesAnalytics($applicant);

                Log::info('[ApplicantSearch] Analytics for applicant', [
                    'applicant_id' => $applicant->id,
                    'analytics' => $analytics,
                ]);

                if ($analytics['count'] === 0) return null;

                if ($activityLevel !== null && $activityLevel !== '') {
                    $count = $analytics['count'];
                    $pass = match($activityLevel) {
                        'low'    => $count >= 1 && $count <= 3,
                        'medium' => $count >= 4 && $count <= 7,
                        'high'   => $count >= 8,
                        default  => true,
                    };
                    if (!$pass) return null;
                }

                return [
                    'id'            => $applicant->id,
                    'name'          => $applicant->name,
                    'email'         => $applicant->email,
                    'analytics'     => $analytics,
                    'activity_type' => $activityType,
                ];
            })
            ->filter()
            ->values();
    }

    private function applyPropertyFilters(
        $query,
        ?string $transactionType,
        ?float $priceMin,
        ?float $priceMax,
        ?int $bedroomsMin,
        ?int $bedroomsMax,
        ?string $propertyType,
        string $location
    ): void {
        if ($priceMin !== null) $query->where('price', '>=', $priceMin);
        if ($priceMax !== null) $query->where('price', '<=', $priceMax);
        if ($location !== '')  $query->where('location', 'like', '%' . $location . '%');

        if ($bedroomsMin !== null || $bedroomsMax !== null || ($propertyType !== null && $propertyType !== '')) {
            $query->whereHas('propertyCategory', function ($q) use ($bedroomsMin, $bedroomsMax, $propertyType) {
                if ($bedroomsMin !== null) $q->where('bedrooms', '>=', $bedroomsMin);
                if ($bedroomsMax !== null) $q->where('bedrooms', '<=', $bedroomsMax);
                if ($propertyType !== null && $propertyType !== '')  $q->where('property_type', $propertyType);
            });
        }

        if ($transactionType === 'sale' || $transactionType === 'rental') {
            $transactionClass = $transactionType === 'sale'
                ? \App\Models\SalesProperty::class
                : \App\Models\RentalProperty::class;
            
            $query->whereHas('propertyCategory', function ($q) use ($transactionClass) {
                $q->where('transaction_type', $transactionClass);
            });
        }
    }

    private function buildFavouritesAnalytics(User $applicant): array
    {
        $favourites = $applicant->favouriteProperties;
        if ($favourites->isEmpty()) return $this->emptyAnalytics('favourites');

        $prices       = $favourites->pluck('price')->filter();
        $topLocations = $this->topItems($favourites->pluck('location')->filter());
        $topTypes     = $this->topItems($favourites->map(fn($p) => $p->propertyCategory?->property_type)->filter());
        $bedroomStats = $this->bedroomStats($favourites->map(fn($p) => $p->propertyCategory?->bedrooms)->filter());

        $lastFavourited = $applicant->favouriteProperties()
            ->orderBy('property_favourites.created_at', 'desc')
            ->withPivot('created_at')
            ->first()?->pivot?->created_at;

        return [
            'count'              => $favourites->count(),
            'price_min'          => $prices->isNotEmpty() ? $prices->min() : null,
            'price_max'          => $prices->isNotEmpty() ? $prices->max() : null,
            'price_avg'          => $prices->isNotEmpty() ? round($prices->avg(), 2) : null,
            'top_locations'      => $topLocations,
            'top_property_types' => $topTypes,
            'bedroom_stats'      => $bedroomStats,
            'last_favourited'    => $lastFavourited,
            'days_since_last'    => $lastFavourited ? abs(round(now()->diffInDays($lastFavourited, false))) : null,
        ];
    }

    private function buildEnquiriesAnalytics(User $applicant): array
    {
        $enquiries = $applicant->propertyEnquiries;
        if ($enquiries->isEmpty()) return $this->emptyAnalytics('enquiries');

        $properties   = $enquiries->pluck('property')->filter();
        $prices       = $properties->pluck('price')->filter();
        $topLocations = $this->topItems($properties->pluck('location')->filter());
        $topTypes     = $this->topItems($properties->map(fn($p) => $p->propertyCategory?->property_type)->filter());
        $bedroomStats = $this->bedroomStats($properties->map(fn($p) => $p->propertyCategory?->bedrooms)->filter());
        $lastEnquiry  = $enquiries->sortByDesc('created_at')->first()?->created_at;

        return [
            'count'              => $enquiries->count(),
            'price_min'          => $prices->isNotEmpty() ? $prices->min() : null,
            'price_max'          => $prices->isNotEmpty() ? $prices->max() : null,
            'price_avg'          => $prices->isNotEmpty() ? round($prices->avg(), 2) : null,
            'top_locations'      => $topLocations,
            'top_property_types' => $topTypes,
            'bedroom_stats'      => $bedroomStats,
            'last_enquiry'       => $lastEnquiry,
            'days_since_last'    => $lastEnquiry ? abs(round(now()->diffInDays($lastEnquiry, false))) : null,
        ];
    }

    private function emptyAnalytics(string $type): array
    {
        return [
            'count'              => 0,
            'price_min'          => null,
            'price_max'          => null,
            'price_avg'          => null,
            'top_locations'      => [],
            'top_property_types' => [],
            'bedroom_stats'      => ['min' => null, 'max' => null, 'modal' => []],
            $type === 'favourites' ? 'last_favourited' : 'last_enquiry' => null,
            'days_since_last'    => null,
        ];
    }

    private function topItems(\Illuminate\Support\Collection $items, int $take = 3): array
    {
        return $items->countBy()->sortDesc()->take($take)
            ->map(fn($count, $name) => ['name' => $name, 'count' => $count])
            ->values()->toArray();
    }

    private function bedroomStats(\Illuminate\Support\Collection $bedrooms): array
    {
        if ($bedrooms->isEmpty()) return ['min' => null, 'max' => null, 'modal' => []];
        $counts = $bedrooms->countBy()->sortDesc();
        return [
            'min'   => $bedrooms->min(),
            'max'   => $bedrooms->max(),
            'modal' => $counts->map(fn($c, $b) => ['bedrooms' => $b, 'count' => $c])->values()->toArray(),
        ];
    }
}