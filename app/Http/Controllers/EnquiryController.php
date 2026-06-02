<?php

namespace App\Http\Controllers;

use App\Models\GeneralProperty;
use App\Models\PropertyEnquiry;
use App\Models\Conversation;
use App\Models\Message;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class EnquiryController extends Controller
{
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

        $user = Auth::user();

        // Check if user already has an active enquiry for this property
        $existingEnquiry = Conversation::where('applicant_id', $user->id)
            ->where('general_property_id', $property->id)
            ->where('is_enquiry', true)
            ->exists();

        if ($existingEnquiry) {
            return back()->with('error', 'You have already enquired about this property');
        }

        // Find or create conversation
        $conversation = Conversation::firstOrCreate(
            [
                'agent_id' => $property->agent_id,
                'applicant_id' => $user->id,
                'general_property_id' => $property->id,
            ],
            [
                'initiated_by' => 'applicant',
                'status' => 'active',
            ]
        );

        // Restore if soft-deleted, and mark as active enquiry
        $conversation->update([
            'is_enquiry' => true,
            'applicant_deleted_at' => null,
            'agent_deleted_at' => null,
        ]);

        // Construct the message text
        $msgBody = "Viewing Request for " . $property->name;
        if (!empty($validated['preferred_date'])) {
            $msgBody .= "\nPreferred Date: " . date('d/m/Y H:i', strtotime($validated['preferred_date']));
        }
        if (!empty($validated['contact_phone'])) {
            $msgBody .= "\nContact Phone: " . $validated['contact_phone'];
        }
        if (!empty($validated['message'])) {
            $msgBody .= "\nMessage: " . $validated['message'];
        }

        // Create the message
        Message::create([
            'conversation_id' => $conversation->id,
            'sender_id' => $user->id,
            'body' => $msgBody,
        ]);

        // Touch conversation to update updated_at timestamp
        $conversation->touch();

        // Also save a record in property_enquiries to maintain compatibility for cards/analytics/searches
        PropertyEnquiry::create([
            'user_id' => $user->id,
            'general_property_id' => $property->id,
            'message' => $validated['message'] ?? null,
            'preferred_date' => $validated['preferred_date'] ?? null,
            'contact_phone' => $validated['contact_phone'] ?? null,
        ]);

        return redirect()->route('messages.show', $conversation->id)
            ->with('success', 'Your viewing enquiry has been sent to the agent');
    }
}
