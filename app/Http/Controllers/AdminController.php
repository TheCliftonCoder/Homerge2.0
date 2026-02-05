<?php

namespace App\Http\Controllers;

use App\Models\AgentRequest;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;
use Inertia\Response;

class AdminController extends Controller
{
    /**
     * Display the admin dashboard with pending agent requests.
     */
    public function index(): Response
    {
        // Get all pending agent requests
        $pendingRequests = AgentRequest::where('status', 'pending')
            ->orderBy('created_at', 'desc')
            ->get();

        return Inertia::render('Admin/Dashboard', [
            'pendingRequests' => $pendingRequests,
        ]);
    }

    /**
     * Approve an agent request and create the user account.
     */
    public function approveAgent($id): RedirectResponse
    {
        $agentRequest = AgentRequest::findOrFail($id);

        // Create the user account
        User::create([
            'name' => $agentRequest->name,
            'email' => $agentRequest->email,
            'password' => $agentRequest->password, // Already hashed
            'role' => 'agent',
        ]);

        // Update request status
        $agentRequest->update(['status' => 'approved']);

        return redirect()->back()->with('success', 'Agent account approved successfully.');
    }

    /**
     * Decline an agent request.
     */
    public function declineAgent($id): RedirectResponse
    {
        $agentRequest = AgentRequest::findOrFail($id);

        // Update request status
        $agentRequest->update(['status' => 'declined']);

        return redirect()->back()->with('success', 'Agent request declined.');
    }
}
