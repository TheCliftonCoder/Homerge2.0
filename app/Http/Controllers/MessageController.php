<?php

namespace App\Http\Controllers;

use App\Models\Conversation;
use App\Models\Message;
use App\Models\GeneralProperty;
use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class MessageController extends Controller
{
    /**
     * Display a listing of the conversations.
     */
    public function index(Request $request): Response|RedirectResponse
    {
        $user = Auth::user();

        // Handle direct lookup via query params (for redirects from property/applicant pages)
        if ($request->has('user_id') && $request->has('property_id')) {
            $agentId = $user->role === 'agent' ? $user->id : $request->user_id;
            $applicantId = $user->role === 'applicant' ? $user->id : $request->user_id;
            
            $conversation = Conversation::where('agent_id', $agentId)
                ->where('applicant_id', $applicantId)
                ->where('general_property_id', $request->property_id)
                ->first();

            if ($conversation) {
                return redirect()->route('messages.show', $conversation->id);
            }
            
            // If no conversation exists yet, we could potentially pass data to prep a new one,
            // but for now let's just let the Index render and handle "New Message" logic if needed.
            // Actually, let's just create it and redirect if it's a direct "Message" click.
            $conversation = Conversation::create([
                'agent_id' => $agentId,
                'applicant_id' => $applicantId,
                'general_property_id' => $request->property_id,
                'initiated_by' => $user->role,
                'status' => $user->role === 'agent' ? 'pending' : 'active',
            ]);
            return redirect()->route('messages.show', $conversation->id);
        }
        
        // Fetch conversations for the sidebar
        $query = Conversation::where(function ($q) use ($user) {
                $q->where('agent_id', $user->id)
                  ->orWhere('applicant_id', $user->id);
            })
            ->with(['agent', 'applicant', 'generalProperty', 'latestMessage.sender'])
            ->orderBy('updated_at', 'desc');

        $conversations = $query->get();

        // Categorize for applicants
        $active = $conversations;
        $requests = collect();

        if ($user->role === 'applicant') {
            $active = $conversations->filter(fn($c) => $c->status === 'active')->values();
            $requests = $conversations->filter(fn($c) => $c->status === 'pending' && $c->initiated_by === 'agent')->values();
        } else {
            $active = $conversations->values();
        }

        return Inertia::render('Messages/Index', [
            'conversations' => $active,
            'requests' => $requests,
            'auth_role' => $user->role,
        ]);
    }

    /**
     * Display the specified conversation.
     */
    public function show(Conversation $conversation): Response
    {
        $user = Auth::user();

        // Authorization check
        if ($conversation->agent_id !== $user->id && $conversation->applicant_id !== $user->id) {
            abort(403);
        }

        $conversation->load(['agent', 'applicant', 'generalProperty', 'messages' => function($q) {
            $q->orderBy('created_at', 'asc')->with('sender');
        }]);

        // Mark messages as read
        $conversation->messages()
            ->where('sender_id', '!=', $user->id)
            ->whereNull('read_at')
            ->update(['read_at' => now()]);

        // Fetch conversations for the sidebar just like index
        $query = Conversation::where(function ($q) use ($user) {
                $q->where('agent_id', $user->id)
                  ->orWhere('applicant_id', $user->id);
            })
            ->with(['agent', 'applicant', 'generalProperty', 'latestMessage'])
            ->orderBy('updated_at', 'desc');

        $active = (clone $query)->where('status', 'active')->get();
        $requests = (clone $query)->where('status', 'pending')->get();

        return Inertia::render('Messages/Show', [
            'conversation' => $conversation,
            'conversations' => $active,
            'requests' => $requests,
            'auth_role' => $user->role,
        ]);
    }

    /**
     * Store a new message.
     */
    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'body' => 'required|string',
            'conversation_id' => 'nullable|exists:conversations,id',
            'recipient_id' => 'required_without:conversation_id|exists:users,id',
            'property_id' => 'required_without:conversation_id|exists:general_properties,id',
        ]);

        $user = Auth::user();
        $conversationId = $request->conversation_id;

        if (!$conversationId) {
            // Check for existing conversation with this agent/applicant/property combo
            $agentId = $user->role === 'agent' ? $user->id : $request->recipient_id;
            $applicantId = $user->role === 'applicant' ? $user->id : $request->recipient_id;
            $propertyId = $request->property_id;

            $conversation = Conversation::firstOrCreate(
                [
                    'agent_id' => $agentId,
                    'applicant_id' => $applicantId,
                    'general_property_id' => $propertyId,
                ],
                [
                    'initiated_by' => $user->role,
                    'status' => $user->role === 'agent' ? 'pending' : 'active',
                ]
            );
            $conversationId = $conversation->id;
        }

        Message::create([
            'conversation_id' => $conversationId,
            'sender_id' => $user->id,
            'body' => $request->body,
        ]);

        // Explicitly update the conversation's updated_at timestamp to bring it to the top
        Conversation::find($conversationId)->touch();

        return back();
    }

    /**
     * Accept a pending conversation.
     */
    public function accept(Conversation $conversation): RedirectResponse
    {
        if ($conversation->applicant_id !== Auth::id()) {
            abort(403);
        }

        $conversation->update(['status' => 'active']);

        return back()->with('message', 'Conversation accepted.');
    }
}
