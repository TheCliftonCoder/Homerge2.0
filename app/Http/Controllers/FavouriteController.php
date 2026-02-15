<?php

namespace App\Http\Controllers;

use App\Models\GeneralProperty;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class FavouriteController extends Controller
{
    /**
     * Display the user's favourite properties.
     */
    public function index(): Response
    {
        $favourites = Auth::user()
            ->favouriteProperties()
            ->with(['agent', 'images'])
            ->latest('property_favourites.created_at')
            ->get();

        return Inertia::render('Applicant/Favourites', [
            'favourites' => $favourites,
        ]);
    }

    /**
     * Toggle favourite status for a property.
     */
    public function toggle(GeneralProperty $property): RedirectResponse
    {
        $user = Auth::user();

        if ($user->favouriteProperties()->where('general_property_id', $property->id)->exists()) {
            $user->favouriteProperties()->detach($property->id);
            return back()->with('success', 'Removed from favourites');
        }
        else {
            $user->favouriteProperties()->attach($property->id);
            return back()->with('success', 'Added to favourites');
        }
    }
}
