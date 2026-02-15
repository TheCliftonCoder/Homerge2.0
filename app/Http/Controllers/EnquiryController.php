<?php

namespace App\Http\Controllers;

use App\Models\GeneralProperty;
use App\Models\PropertyEnquiry;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class EnquiryController extends Controller
{
    /**
     * Display the user's property enquiries.
     */
    public function index(): Response
    {
        $enquiries = Auth::user()
            ->propertyEnquiries()
            ->with(['property.agent', 'property.images'])
            ->latest()
            ->get();

        return Inertia::render('Applicant/Enquiries', [
            'enquiries' => $enquiries,
        ]);
    }

    /**
     * Store a new property enquiry.
     */
    public function store(Request $request, GeneralProperty $property): RedirectResponse
    {
        $validated = $request->validate([
            'message' => 'nullable|string|max:1000',
            'preferred_date' => 'nullable|date|after:now',
            'contact_phone' => 'nullable|string|max:20',
        ]);

        // Check if user already has an enquiry for this property
        $existingEnquiry = Auth::user()
            ->propertyEnquiries()
            ->where('general_property_id', $property->id)
            ->exists();

        if ($existingEnquiry) {
            return back()->with('error', 'You have already enquired about this property');
        }

        PropertyEnquiry::create([
            'user_id' => Auth::id(),
            'general_property_id' => $property->id,
            'message' => $validated['message'] ?? null,
            'preferred_date' => $validated['preferred_date'] ?? null,
            'contact_phone' => $validated['contact_phone'] ?? null,
        ]);

        return back()->with('success', 'Your enquiry has been sent to the agent');
    }

    /**
     * Cancel/delete an enquiry.
     */
    public function destroy(PropertyEnquiry $enquiry): RedirectResponse
    {
        // Authorization check
        if ($enquiry->user_id !== Auth::id()) {
            abort(403, 'Unauthorized action.');
        }

        $enquiry->delete();

        return back()->with('success', 'Enquiry cancelled successfully');
    }

    /**
     * Display enquiries for the agent's properties.
     */
    public function agentEnquiries(): Response
    {
        $user = Auth::user();

        // Get all enquiries for properties owned by this agent
        $enquiries = PropertyEnquiry::whereHas('property', function ($query) use ($user) {
            $query->where('agent_id', $user->id);
        })
            ->with(['user', 'property'])
            ->latest()
            ->get();

        return Inertia::render('Agent/Enquiries', [
            'enquiries' => $enquiries,
        ]);
    }
}
