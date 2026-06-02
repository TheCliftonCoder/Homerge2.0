<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Conversation;
use App\Models\Message;
use App\Models\GeneralProperty;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class MessageTest extends TestCase
{
    use RefreshDatabase;

    public function test_guests_cannot_view_or_modify_messages(): void
    {
        $response = $this->get('/messages');
        $response->assertRedirect('/login');

        $response = $this->post('/messages', [
            'body' => 'Hello',
            'recipient_id' => 2,
            'property_id' => 1
        ]);
        $response->assertRedirect('/login');
    }

    public function test_user_can_view_conversations(): void
    {
        $user = User::factory()->create(['role' => 'applicant']);
        $response = $this->actingAs($user)->get('/messages');
        $response->assertStatus(200);
    }

    public function test_user_can_soft_delete_conversation_they_are_part_of(): void
    {
        $applicant = User::factory()->create(['role' => 'applicant']);
        $agent = User::factory()->create(['role' => 'agent']);

        // Create a property
        $property = GeneralProperty::create([
            'agent_id' => $agent->id,
            'name' => 'Beautiful Villa',
            'location' => 'London',
            'price' => 1200000,
            'size_sqft' => 3000,
            'property_category_type' => 'App\Models\ResidentialProperty',
            'property_category_id' => 1,
        ]);

        $conversation = Conversation::create([
            'agent_id' => $agent->id,
            'applicant_id' => $applicant->id,
            'general_property_id' => $property->id,
            'initiated_by' => 'applicant',
            'status' => 'active'
        ]);

        Message::create([
            'conversation_id' => $conversation->id,
            'sender_id' => $applicant->id,
            'body' => 'Hello agent!'
        ]);

        $this->assertDatabaseHas('conversations', ['id' => $conversation->id]);

        // Applicant deletes conversation
        $response = $this->actingAs($applicant)->delete("/messages/{$conversation->id}");
        $response->assertRedirect('/messages');

        // Verify it is not deleted from DB but applicant_deleted_at is set
        $this->assertDatabaseHas('conversations', [
            'id' => $conversation->id,
            'agent_deleted_at' => null,
        ]);
        $this->assertNotNull(Conversation::find($conversation->id)->applicant_deleted_at);

        // Verify applicant cannot access it directly anymore
        $response = $this->actingAs($applicant)->get("/messages/{$conversation->id}");
        $response->assertStatus(403);

        // Verify agent can still access it
        $response = $this->actingAs($agent)->get("/messages/{$conversation->id}");
        $response->assertStatus(200);
    }

    public function test_user_cannot_delete_conversation_they_are_not_part_of(): void
    {
        $applicant1 = User::factory()->create(['role' => 'applicant']);
        $applicant2 = User::factory()->create(['role' => 'applicant']);
        $agent = User::factory()->create(['role' => 'agent']);

        $property = GeneralProperty::create([
            'agent_id' => $agent->id,
            'name' => 'Beautiful Villa',
            'location' => 'London',
            'price' => 1200000,
            'size_sqft' => 3000,
            'property_category_type' => 'App\Models\ResidentialProperty',
            'property_category_id' => 1,
        ]);

        $conversation = Conversation::create([
            'agent_id' => $agent->id,
            'applicant_id' => $applicant1->id,
            'general_property_id' => $property->id,
            'initiated_by' => 'applicant',
            'status' => 'active'
        ]);

        // Applicant 2 tries to delete conversation
        $response = $this->actingAs($applicant2)->delete("/messages/{$conversation->id}");
        $response->assertStatus(403);
        
        $this->assertDatabaseHas('conversations', [
            'id' => $conversation->id,
            'applicant_deleted_at' => null,
            'agent_deleted_at' => null,
        ]);
    }

    public function test_conversation_deleted_when_both_users_delete(): void
    {
        $applicant = User::factory()->create(['role' => 'applicant']);
        $agent = User::factory()->create(['role' => 'agent']);

        $property = GeneralProperty::create([
            'agent_id' => $agent->id,
            'name' => 'Beautiful Villa',
            'location' => 'London',
            'price' => 1200000,
            'size_sqft' => 3000,
            'property_category_type' => 'App\Models\ResidentialProperty',
            'property_category_id' => 1,
        ]);

        $conversation = Conversation::create([
            'agent_id' => $agent->id,
            'applicant_id' => $applicant->id,
            'general_property_id' => $property->id,
            'initiated_by' => 'applicant',
            'status' => 'active'
        ]);

        // Applicant deletes conversation
        $this->actingAs($applicant)->delete("/messages/{$conversation->id}");

        // Agent deletes conversation
        $response = $this->actingAs($agent)->delete("/messages/{$conversation->id}");
        $response->assertRedirect('/messages');

        // Verify conversation is now hard-deleted from database
        $this->assertDatabaseMissing('conversations', ['id' => $conversation->id]);
    }

    public function test_conversation_restored_when_messaged_again(): void
    {
        $applicant = User::factory()->create(['role' => 'applicant']);
        $agent = User::factory()->create(['role' => 'agent']);

        $property = GeneralProperty::create([
            'agent_id' => $agent->id,
            'name' => 'Beautiful Villa',
            'location' => 'London',
            'price' => 1200000,
            'size_sqft' => 3000,
            'property_category_type' => 'App\Models\ResidentialProperty',
            'property_category_id' => 1,
        ]);

        $conversation = Conversation::create([
            'agent_id' => $agent->id,
            'applicant_id' => $applicant->id,
            'general_property_id' => $property->id,
            'initiated_by' => 'applicant',
            'status' => 'active',
            'applicant_deleted_at' => now(),
        ]);

        // Applicant messages agent again
        $response = $this->actingAs($applicant)->get("/messages?user_id={$agent->id}&property_id={$property->id}");
        $response->assertRedirect(route('messages.show', $conversation->id));

        // Verify applicant_deleted_at is restored (set to null)
        $this->assertDatabaseHas('conversations', [
            'id' => $conversation->id,
            'applicant_deleted_at' => null,
        ]);
    }

    public function test_applicant_draft_visible_to_applicant_hidden_from_agent(): void
    {
        $applicant = User::factory()->create(['role' => 'applicant']);
        $agent = User::factory()->create(['role' => 'agent']);

        $property = GeneralProperty::create([
            'agent_id' => $agent->id,
            'name' => 'Beautiful Villa',
            'location' => 'London',
            'price' => 1200000,
            'size_sqft' => 3000,
            'property_category_type' => 'App\Models\ResidentialProperty',
            'property_category_id' => 1,
        ]);

        // Create applicant-initiated conversation with 0 messages (draft)
        $conversation = Conversation::create([
            'agent_id' => $agent->id,
            'applicant_id' => $applicant->id,
            'general_property_id' => $property->id,
            'initiated_by' => 'applicant',
            'status' => 'active',
        ]);

        // Verify it is returned to the applicant
        $response = $this->actingAs($applicant)->get('/messages');
        $response->assertStatus(200);
        $response->assertSee($property->name); // Conversations list shows it

        // Verify it is NOT returned to the agent
        $response = $this->actingAs($agent)->get('/messages');
        $response->assertStatus(200);
        $response->assertDontSee($property->name);
    }

    public function test_agent_blocked_from_direct_access_to_applicant_draft(): void
    {
        $applicant = User::factory()->create(['role' => 'applicant']);
        $agent = User::factory()->create(['role' => 'agent']);

        $property = GeneralProperty::create([
            'agent_id' => $agent->id,
            'name' => 'Beautiful Villa',
            'location' => 'London',
            'price' => 1200000,
            'size_sqft' => 3000,
            'property_category_type' => 'App\Models\ResidentialProperty',
            'property_category_id' => 1,
        ]);

        $conversation = Conversation::create([
            'agent_id' => $agent->id,
            'applicant_id' => $applicant->id,
            'general_property_id' => $property->id,
            'initiated_by' => 'applicant',
            'status' => 'active',
        ]);

        // Agent tries to access directly -> 403
        $response = $this->actingAs($agent)->get("/messages/{$conversation->id}");
        $response->assertStatus(403);

        // Applicant can access directly -> 200
        $response = $this->actingAs($applicant)->get("/messages/{$conversation->id}");
        $response->assertStatus(200);
    }

    public function test_draft_becomes_visible_to_agent_after_first_message(): void
    {
        $applicant = User::factory()->create(['role' => 'applicant']);
        $agent = User::factory()->create(['role' => 'agent']);

        $property = GeneralProperty::create([
            'agent_id' => $agent->id,
            'name' => 'Beautiful Villa',
            'location' => 'London',
            'price' => 1200000,
            'size_sqft' => 3000,
            'property_category_type' => 'App\Models\ResidentialProperty',
            'property_category_id' => 1,
        ]);

        $conversation = Conversation::create([
            'agent_id' => $agent->id,
            'applicant_id' => $applicant->id,
            'general_property_id' => $property->id,
            'initiated_by' => 'applicant',
            'status' => 'active',
        ]);

        // Applicant sends the first message
        $response = $this->actingAs($applicant)->post('/messages', [
            'conversation_id' => $conversation->id,
            'body' => 'Hello agent! I want to view this property.',
        ]);
        $response->assertRedirect();

        // Verify conversation is now visible to the agent in list
        $response = $this->actingAs($agent)->get('/messages');
        $response->assertStatus(200);
        $response->assertSee($property->name);

        // Verify agent can now access it directly
        $response = $this->actingAs($agent)->get("/messages/{$conversation->id}");
        $response->assertStatus(200);
    }

    public function test_applicant_can_submit_viewing_enquiry(): void
    {
        $applicant = User::factory()->create(['role' => 'applicant']);
        $agent = User::factory()->create(['role' => 'agent']);

        $property = GeneralProperty::create([
            'agent_id' => $agent->id,
            'name' => 'Enquiry House',
            'location' => 'Cardiff',
            'price' => 450000,
            'size_sqft' => 1500,
            'property_category_type' => 'App\Models\ResidentialProperty',
            'property_category_id' => 1,
        ]);

        $response = $this->actingAs($applicant)->post("/properties/{$property->id}/enquire", [
            'message' => 'I would love to view this beautiful house!',
            'preferred_date' => date('Y-m-d H:i:s', strtotime('+2 days')),
            'contact_phone' => '07999888777',
        ]);

        // Should redirect to messages.show
        $conversation = Conversation::where('applicant_id', $applicant->id)
            ->where('general_property_id', $property->id)
            ->firstOrFail();

        $response->assertRedirect(route('messages.show', $conversation->id));

        // Verify conversation is enquiry and restored
        $this->assertTrue((bool)$conversation->is_enquiry);
        $this->assertNull($conversation->applicant_deleted_at);
        $this->assertNull($conversation->agent_deleted_at);

        // Verify message was created
        $this->assertDatabaseHas('messages', [
            'conversation_id' => $conversation->id,
            'sender_id' => $applicant->id,
        ]);

        // Verify property_enquiries entry was also created for compatibility
        $this->assertDatabaseHas('property_enquiries', [
            'user_id' => $applicant->id,
            'general_property_id' => $property->id,
            'contact_phone' => '07999888777',
        ]);
    }

    public function test_applicant_can_submit_viewing_enquiry_without_message(): void
    {
        $applicant = User::factory()->create(['role' => 'applicant']);
        $agent = User::factory()->create(['role' => 'agent']);

        $property = GeneralProperty::create([
            'agent_id' => $agent->id,
            'name' => 'Enquiry House',
            'location' => 'Cardiff',
            'price' => 450000,
            'size_sqft' => 1500,
            'property_category_type' => 'App\Models\ResidentialProperty',
            'property_category_id' => 1,
        ]);

        $response = $this->actingAs($applicant)->post("/properties/{$property->id}/enquire", [
            'message' => '',
            'preferred_date' => '',
            'contact_phone' => '',
        ]);

        $conversation = Conversation::where('applicant_id', $applicant->id)
            ->where('general_property_id', $property->id)
            ->firstOrFail();

        $response->assertRedirect(route('messages.show', $conversation->id));

        // Follow redirect to see if it causes a 403 or other issue
        $followResponse = $this->actingAs($applicant)->get(route('messages.show', $conversation->id));
        $followResponse->assertStatus(200);

        // Verify message was created
        $this->assertDatabaseHas('messages', [
            'conversation_id' => $conversation->id,
            'sender_id' => $applicant->id,
        ]);
    }

    public function test_agent_responding_to_enquiry_clears_is_enquiry_flag(): void
    {
        $applicant = User::factory()->create(['role' => 'applicant']);
        $agent = User::factory()->create(['role' => 'agent']);

        $property = GeneralProperty::create([
            'agent_id' => $agent->id,
            'name' => 'Enquiry House',
            'location' => 'Cardiff',
            'price' => 450000,
            'size_sqft' => 1500,
            'property_category_type' => 'App\Models\ResidentialProperty',
            'property_category_id' => 1,
        ]);

        $conversation = Conversation::create([
            'agent_id' => $agent->id,
            'applicant_id' => $applicant->id,
            'general_property_id' => $property->id,
            'initiated_by' => 'applicant',
            'status' => 'active',
            'is_enquiry' => true,
        ]);

        // Agent replies
        $response = $this->actingAs($agent)->post('/messages', [
            'conversation_id' => $conversation->id,
            'body' => 'Sure, let us schedule a viewing!',
        ]);
        $response->assertRedirect();

        // Verify is_enquiry is set to false
        $conversation->refresh();
        $this->assertFalse((bool)$conversation->is_enquiry);
    }

    public function test_submitting_enquiry_restores_soft_deleted_conversation(): void
    {
        $applicant = User::factory()->create(['role' => 'applicant']);
        $agent = User::factory()->create(['role' => 'agent']);

        $property = GeneralProperty::create([
            'agent_id' => $agent->id,
            'name' => 'Enquiry House',
            'location' => 'Cardiff',
            'price' => 450000,
            'size_sqft' => 1500,
            'property_category_type' => 'App\Models\ResidentialProperty',
            'property_category_id' => 1,
        ]);

        $conversation = Conversation::create([
            'agent_id' => $agent->id,
            'applicant_id' => $applicant->id,
            'general_property_id' => $property->id,
            'initiated_by' => 'applicant',
            'status' => 'active',
            'applicant_deleted_at' => now(),
            'agent_deleted_at' => now(),
        ]);

        $response = $this->actingAs($applicant)->post("/properties/{$property->id}/enquire", [
            'message' => 'Restoring soft-deleted conversation',
        ]);

        $conversation->refresh();
        $this->assertNull($conversation->applicant_deleted_at);
        $this->assertNull($conversation->agent_deleted_at);
    }
}
