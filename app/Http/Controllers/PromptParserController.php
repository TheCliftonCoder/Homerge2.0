<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class PromptParserController extends Controller
{
    private function callGroq(string $prompt, string $systemInstruction): array
    {
        $apiKey = config('services.groq.api_key');
        $model = config('services.groq.model', 'llama-3.3-70b-versatile');

        if (!$apiKey) {
            return ['error' => 'Groq API key not configured. Please add GROQ_API_KEY to your .env file.'];
        }

        $body = [
            'model' => $model,
            'messages' => [
                [
                    'role' => 'system',
                    'content' => $systemInstruction,
                ],
                [
                    'role' => 'user',
                    'content' => $prompt,
                ],
            ],
            'response_format' => ['type' => 'json_object'],
            'temperature' => 0,
        ];

        $response = Http::timeout(15)
            ->withoutVerifying() // bypasses Windows SSL cert issues on php -S dev server
            ->withToken($apiKey)
            ->post('https://api.groq.com/openai/v1/chat/completions', $body);

        if ($response->failed()) {
            $status = $response->status();
            $detail = $response->json('error.message') ?? $response->body();
            return ['error' => "Groq API error ({$status}): {$detail}"];
        }

        $text = $response->json('choices.0.message.content');

        if (!$text) {
            return ['error' => 'Unexpected response from Groq. Please try again.'];
        }

        $parsed = json_decode($text, true);

        if (json_last_error() !== JSON_ERROR_NONE) {
            return ['error' => 'Could not parse the AI response as JSON.'];
        }

        return $parsed;
    }

    /**
     * Parse a free-text agent prompt into applicant search filters.
     */
    public function parseApplicantPrompt(Request $request): JsonResponse
    {
        $request->validate(['prompt' => 'required|string|max:500']);

        $systemInstruction = <<<'PROMPT'
You are a filter extractor for a UK property applicant search tool used by estate agents.
Extract search filters from the user's query and return ONLY a JSON object with these exact keys.
Use null for any filter the query does not mention.

Keys and allowed values:
- activity_type: "favourites" or "enquiries" (default "favourites" if unclear)
- transaction_type: "sale", "rental", or null
- price_min: integer in GBP or null
- price_max: integer in GBP or null
- bedrooms_min: integer or null
- bedrooms_max: integer or null
- property_type: one of "detached","semi_detached","terraced","flat","bungalow" or null.
  - Map "apartment" or "maisonette" to "flat".
  - Map generic terms like "house", "home", "property", "place" to null (set transaction_type or category as appropriate instead). Do NOT output "house" as a value.
- location: string (UK town/city) or null
- last_activity: one of "24h","48h","7d","1m","6m" or null
- activity_level: one of "low","medium","high" or null

Return ONLY the JSON object, no markdown, no explanation.
PROMPT;

        $filters = $this->callGroq($request->input('prompt'), $systemInstruction);

        if (isset($filters['error'])) {
            return response()->json(['error' => $filters['error']], 422);
        }

        return response()->json(['filters' => $filters]);
    }

    /**
     * Parse a free-text applicant prompt into property search filters.
     */
    public function parsePropertyPrompt(Request $request): JsonResponse
    {
        $request->validate(['prompt' => 'required|string|max:500']);

        $systemInstruction = <<<'PROMPT'
You are a filter extractor for a UK property search tool.
Extract search filters from the user's query and return ONLY a JSON object with these exact keys.
Use null for any filter the query does not mention.

Keys and allowed values:
- transaction_type: "sale" or "rental" or null
- property_category: "residential" or "commercial" or null
- property_type: one of "detached","semi_detached","terraced","flat","bungalow" or null.
  - Map "apartment" or "maisonette" to "flat".
  - Map generic terms like "house", "home", "property", "place" to null (set property_category to "residential" instead). Do NOT output "house" as a value.
- location: string (UK town/city) or null
- radius: integer in miles or null (e.g., "within 10 miles of X" -> 10, "near X" -> 5)
- min_price: integer in GBP or null (for rentals, interpret monthly rent)
- max_price: integer in GBP or null
- bedrooms: integer (exact number) or null
- bathrooms: integer (exact number) or null
- parking: "1" if mentioned, else null
- garden: "1" if mentioned, else null
- furnished: "furnished" or "unfurnished" or null
- pets_allowed: "1" if mentioned, else null
- proximity_pins: array of objects { "type": "radius"|"commute", "query": string, "label": string|null, "value": number, "mode": "driving"|"walking"|"cycling"|null, "pin_mode": "filter"|"display" } or null. 
  **CRITICAL**: Use this for all specific landmarks/addresses.
  - Set "type" to "commute" if "min", "minutes", "drive", "walk" or "commute" is mentioned.
  - Set "type" to "radius" if "miles", "miles away" or a distance is specifically mentioned without a time.
  - "label": Extract a friendly name if possible (e.g. "near my office" -> "Office", "near the station" -> "Station").
  - "value": The number of minutes (for commute) or miles (for radius). Default commute to 20, default radius to 1.0.
  - "mode": Only for commute. Default to "driving" if not specified.
  - "pin_mode": Set to "display" if the user explicitly requests to show, display, or present proximity/distance to the pin without filtering the results (e.g., "display only", "display pin", "just to show distance", "not filtered by"). Otherwise, default to "filter".
- poi_proximity: array of objects { "poi_type": string, "max_miles": number, "pin_mode": "filter"|"display" } or null. 
  Allowed poi_types: "train_station", "school", "hospital", "supermarket", "gym", "park". 
  **CRITICAL**: Use this for generic category requests (e.g. "near a supermarket", "close to a school").
  - "pin_mode": Set to "display" if the user explicitly requests to show, display, or present proximity/distance to the category without filtering the results (e.g. "show parks as display only", "display supermarkets"). Otherwise, default to "filter".
  Example: "near a station" -> { "poi_type": "train_station", "max_miles": 1.0, "pin_mode": "filter" }
  Example: "show gym as display only" -> { "poi_type": "gym", "max_miles": 1.0, "pin_mode": "display" }

Return ONLY the JSON object, no markdown, no explanation.
PROMPT;

        $filters = $this->callGroq($request->input('prompt'), $systemInstruction);

        if (isset($filters['error'])) {
            return response()->json(['error' => $filters['error']], 422);
        }

        return response()->json(['filters' => $filters]);
    }
}
