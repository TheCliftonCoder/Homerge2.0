<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class ApplicantCardController extends Controller
{
    /**
     * Display all applicant cards for agents.
     */
    public function index(): Response
    {
        // Only get applicants with at least one favourite or enquiry
        $applicants = User::where('role', 'applicant')
            ->where(function ($query) {
                $query->whereHas('favouriteProperties')
                      ->orWhereHas('propertyEnquiries');
            })
            ->with(['favouriteProperties', 'propertyEnquiries.property'])
            ->get()
            ->map(function ($applicant) {
                $favouritesAnalytics = $this->calculateFavouritesAnalytics($applicant);
                $enquiriesAnalytics = $this->calculateEnquiriesAnalytics($applicant);
                
                // Only include if they have at least one activity
                if ($favouritesAnalytics['count'] === 0 && $enquiriesAnalytics['count'] === 0) {
                    return null;
                }

                return [
                    'id' => $applicant->id,
                    'name' => $applicant->name,
                    'email' => $applicant->email,
                    'favourites_analytics' => $favouritesAnalytics,
                    'enquiries_analytics' => $enquiriesAnalytics,
                    'overall_activity' => $this->calculateOverallActivity($applicant, $favouritesAnalytics, $enquiriesAnalytics),
                ];
            })
            ->filter() // Remove nulls
            ->values(); // Re-index array

        return Inertia::render('Agent/ApplicantCards', [
            'applicants' => $applicants,
        ]);
    }

    /**
     * Calculate analytics from favourited properties.
     */
    private function calculateFavouritesAnalytics(User $applicant): array
    {
        $favourites = $applicant->favouriteProperties;
        
        if ($favourites->isEmpty()) {
            return [
                'count' => 0,
                'price_min' => null,
                'price_max' => null,
                'price_avg' => null,
                'top_locations' => [],
                'top_property_types' => [],
                'bedroom_stats' => ['min' => null, 'max' => null, 'modal' => []],
                'last_favourited' => null,
                'days_since_last_favourite' => null,
            ];
        }

        $prices = $favourites->pluck('price')->filter();
        
        // Get top 3 locations with counts
        $locationCounts = $favourites->pluck('location')->filter()->countBy()->sortDesc()->take(3);
        $topLocations = $locationCounts->map(function ($count, $location) {
            return ['name' => $location, 'count' => $count];
        })->values()->toArray();
        
        // Get bedrooms from property categories
        $bedroomsList = $favourites->map(function ($property) {
            return $property->propertyCategory?->bedrooms;
        })->filter();
        
        $bedroomCounts = $bedroomsList->countBy()->sortDesc();
        $bedroomStats = [
            'min' => $bedroomsList->isNotEmpty() ? $bedroomsList->min() : null,
            'max' => $bedroomsList->isNotEmpty() ? $bedroomsList->max() : null,
            'modal' => $bedroomCounts->map(function ($count, $bedrooms) {
                return ['bedrooms' => $bedrooms, 'count' => $count];
            })->values()->toArray(),
        ];

        // Get top 3 property types with counts
        $propertyTypeCounts = $favourites->map(function ($property) {
            return $property->propertyCategory?->property_type;
        })->filter()->countBy()->sortDesc()->take(3);
        $topPropertyTypes = $propertyTypeCounts->map(function ($count, $type) {
            return ['name' => $type, 'count' => $count];
        })->values()->toArray();

        // Get last favourited date from pivot
        $lastFavourited = $applicant->favouriteProperties()
            ->orderBy('property_favourites.created_at', 'desc')
            ->first()?->pivot?->created_at;

        return [
            'count' => $favourites->count(),
            'price_min' => $prices->isNotEmpty() ? $prices->min() : null,
            'price_max' => $prices->isNotEmpty() ? $prices->max() : null,
            'price_avg' => $prices->isNotEmpty() ? round($prices->avg(), 2) : null,
            'top_locations' => $topLocations,
            'top_property_types' => $topPropertyTypes,
            'bedroom_stats' => $bedroomStats,
            'last_favourited' => $lastFavourited,
            'days_since_last_favourite' => $lastFavourited ? abs(round(now()->diffInDays($lastFavourited, false))) : null,
        ];
    }

    /**
     * Calculate analytics from property enquiries.
     */
    private function calculateEnquiriesAnalytics(User $applicant): array
    {
        $enquiries = $applicant->propertyEnquiries;
        
        if ($enquiries->isEmpty()) {
            return [
                'count' => 0,
                'price_min' => null,
                'price_max' => null,
                'price_avg' => null,
                'top_locations' => [],
                'top_property_types' => [],
                'bedroom_stats' => ['min' => null, 'max' => null, 'modal' => []],
                'last_enquiry' => null,
                'days_since_last_enquiry' => null,
            ];
        }

        $properties = $enquiries->pluck('property')->filter();
        $prices = $properties->pluck('price')->filter();
        
        // Get top 3 locations with counts
        $locationCounts = $properties->pluck('location')->filter()->countBy()->sortDesc()->take(3);
        $topLocations = $locationCounts->map(function ($count, $location) {
            return ['name' => $location, 'count' => $count];
        })->values()->toArray();
        
        // Get bedrooms from property categories
        $bedroomsList = $properties->map(function ($property) {
            return $property->propertyCategory?->bedrooms;
        })->filter();
        
        $bedroomCounts = $bedroomsList->countBy()->sortDesc();
        $bedroomStats = [
            'min' => $bedroomsList->isNotEmpty() ? $bedroomsList->min() : null,
            'max' => $bedroomsList->isNotEmpty() ? $bedroomsList->max() : null,
            'modal' => $bedroomCounts->map(function ($count, $bedrooms) {
                return ['bedrooms' => $bedrooms, 'count' => $count];
            })->values()->toArray(),
        ];

        // Get top 3 property types with counts
        $propertyTypeCounts = $properties->map(function ($property) {
            return $property->propertyCategory?->property_type;
        })->filter()->countBy()->sortDesc()->take(3);
        $topPropertyTypes = $propertyTypeCounts->map(function ($count, $type) {
            return ['name' => $type, 'count' => $count];
        })->values()->toArray();

        $lastEnquiry = $enquiries->sortByDesc('created_at')->first()?->created_at;
        
        return [
            'count' => $enquiries->count(),
            'price_min' => $prices->isNotEmpty() ? $prices->min() : null,
            'price_max' => $prices->isNotEmpty() ? $prices->max() : null,
            'price_avg' => $prices->isNotEmpty() ? round($prices->avg(), 2) : null,
            'top_locations' => $topLocations,
            'top_property_types' => $topPropertyTypes,
            'bedroom_stats' => $bedroomStats,
            'last_enquiry' => $lastEnquiry,
            'days_since_last_enquiry' => $lastEnquiry ? abs(round(now()->diffInDays($lastEnquiry, false))) : null,
        ];
    }

    /**
     * Calculate overall activity metrics.
     */
    private function calculateOverallActivity(User $applicant, array $favouritesAnalytics, array $enquiriesAnalytics): array
    {
        $totalActivity = $favouritesAnalytics['count'] + $enquiriesAnalytics['count'];
        
        // Get most recent activity
        $lastActivity = collect([
            $favouritesAnalytics['last_favourited'],
            $enquiriesAnalytics['last_enquiry'],
        ])->filter()->max();

        return [
            'total_count' => $totalActivity,
            'last_activity' => $lastActivity,
            'account_age_days' => $applicant->created_at->diffInDays(now()),
        ];
    }
}