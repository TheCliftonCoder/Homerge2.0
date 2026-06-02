<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\SavedSearch;
use App\Models\GeneralProperty;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SavedSearchTest extends TestCase
{
    use RefreshDatabase;

    public function test_guests_cannot_view_or_save_searches(): void
    {
        // Guests cannot view searches page
        $response = $this->get('/searches');
        $response->assertRedirect('/login');

        // Guests cannot save searches
        $response = $this->post('/searches', [
            'name' => 'My Search',
            'filters' => ['location' => 'London']
        ]);
        $response->assertRedirect('/login');
    }

    public function test_applicants_can_view_and_save_searches(): void
    {
        $user = User::factory()->create([
            'role' => 'applicant',
            'last_login_at' => now(),
            'previous_login_at' => now(),
        ]);

        $response = $this->actingAs($user)->get('/searches');
        $response->assertStatus(200);

        $response = $this->actingAs($user)->post('/searches', [
            'name' => 'London Flats',
            'filters' => ['location' => 'London', 'property_category' => 'Residential']
        ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('saved_searches', [
            'user_id' => $user->id,
            'name' => 'London Flats'
        ]);
    }

    public function test_applicants_cannot_save_more_than_five_searches(): void
    {
        $user = User::factory()->create([
            'role' => 'applicant',
        ]);

        // Create 5 saved searches directly
        for ($i = 1; $i <= 5; $i++) {
            SavedSearch::create([
                'user_id' => $user->id,
                'name' => "Search $i",
                'filters' => ['location' => 'London']
            ]);
        }

        $this->assertEquals(5, $user->savedSearches()->count());

        // Attempt to create a 6th one
        $response = $this->actingAs($user)->post('/searches', [
            'name' => '6th Search',
            'filters' => ['location' => 'Reading']
        ]);

        $response->assertSessionHasErrors(['error']);
        $this->assertEquals(5, $user->savedSearches()->count());
    }

    public function test_applicants_can_rename_their_saved_searches(): void
    {
        $user = User::factory()->create([
            'role' => 'applicant',
        ]);

        $search = SavedSearch::create([
            'user_id' => $user->id,
            'name' => 'Old Name',
            'filters' => ['location' => 'London']
        ]);

        $response = $this->actingAs($user)->patch("/searches/{$search->id}", [
            'name' => 'New Name'
        ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('saved_searches', [
            'id' => $search->id,
            'name' => 'New Name'
        ]);
    }

    public function test_applicants_cannot_rename_other_users_saved_searches(): void
    {
        $user1 = User::factory()->create(['role' => 'applicant']);
        $user2 = User::factory()->create(['role' => 'applicant']);

        $search = SavedSearch::create([
            'user_id' => $user1->id,
            'name' => 'User 1 Search',
            'filters' => ['location' => 'London']
        ]);

        $response = $this->actingAs($user2)->patch("/searches/{$search->id}", [
            'name' => 'Hacked Name'
        ]);

        $response->assertStatus(403);
        $this->assertDatabaseHas('saved_searches', [
            'id' => $search->id,
            'name' => 'User 1 Search'
        ]);
    }

    public function test_applicants_can_delete_their_saved_searches(): void
    {
        $user = User::factory()->create([
            'role' => 'applicant',
        ]);

        $search = SavedSearch::create([
            'user_id' => $user->id,
            'name' => 'My Search',
            'filters' => ['location' => 'London']
        ]);

        $response = $this->actingAs($user)->delete("/searches/{$search->id}");

        $response->assertRedirect();
        $this->assertDatabaseMissing('saved_searches', [
            'id' => $search->id
        ]);
    }

    public function test_new_properties_count_since_previous_login(): void
    {
        $user = User::factory()->create([
            'role' => 'applicant',
            'previous_login_at' => now()->subDay(),
            'last_login_at' => now(),
        ]);

        $agent = User::factory()->create(['role' => 'agent']);

        // Create a saved search
        $search = SavedSearch::create([
            'user_id' => $user->id,
            'name' => 'London Search',
            'filters' => ['location' => 'London']
        ]);

        // Create a property matching search created BEFORE previous_login_at
        $p1 = new GeneralProperty([
            'agent_id' => $agent->id,
            'name' => 'Old London Property',
            'location' => 'London',
            'price' => 500000,
            'size_sqft' => 1000,
            'property_category_type' => 'App\Models\ResidentialProperty',
            'property_category_id' => 1,
        ]);
        $p1->created_at = now()->subDays(2);
        $p1->save();

        // Create a property matching search created AFTER previous_login_at
        $p2 = new GeneralProperty([
            'agent_id' => $agent->id,
            'name' => 'New London Property',
            'location' => 'London',
            'price' => 600000,
            'size_sqft' => 1200,
            'property_category_type' => 'App\Models\ResidentialProperty',
            'property_category_id' => 2,
        ]);
        $p2->created_at = now()->subHours(12);
        $p2->save();

        // Create a property NOT matching search created AFTER previous_login_at
        $p3 = new GeneralProperty([
            'agent_id' => $agent->id,
            'name' => 'New Manchester Property',
            'location' => 'Manchester',
            'price' => 400000,
            'size_sqft' => 800,
            'property_category_type' => 'App\Models\ResidentialProperty',
            'property_category_id' => 3,
        ]);
        $p3->created_at = now()->subHours(12);
        $p3->save();

        $response = $this->actingAs($user)->get('/searches');
        $response->assertStatus(200);

        // Verify the map data passed to Inertia view has new_count = 1
        $savedSearchesData = $response->original->getData()['page']['props']['savedSearches'];
        $this->assertCount(1, $savedSearchesData);
        $this->assertEquals(1, $savedSearchesData[0]['new_count']);
    }

    public function test_applicants_cannot_save_duplicate_searches(): void
    {
        $user = User::factory()->create([
            'role' => 'applicant',
        ]);

        // Create an existing saved search
        SavedSearch::create([
            'user_id' => $user->id,
            'name' => 'First Search',
            'filters' => [
                'location' => 'London',
                'min_price' => '100000',
                'max_price' => '', // empty value
                'proximity_pins' => [
                    ['type' => 'commute', 'query' => 'Reading', 'value' => '20', 'mode' => 'driving']
                ]
            ]
        ]);

        // Attempt to save same search with different keys order and some missing/empty keys
        $response = $this->actingAs($user)->post('/searches', [
            'name' => 'Duplicate Search',
            'filters' => [
                'min_price' => '100000',
                'location' => 'London',
                'proximity_pins' => [
                    ['query' => 'Reading', 'type' => 'commute', 'mode' => 'driving', 'value' => '20']
                ]
            ]
        ]);

        $response->assertSessionHasErrors(['error']);
        $this->assertEquals(1, $user->savedSearches()->count());
    }
}
