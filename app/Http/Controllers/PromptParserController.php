<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class PromptParserController extends Controller
{
    private function callGemini(string $prompt, string $systemInstruction): array
    {
        $apiKey = config('services.gemini.api_key');

        if (!$apiKey) {
            return ['error' => 'Gemini API key not configured. Please add GEMINI_API_KEY to your .env file.'];
        }

        $body = [
            'contents' => [
                [
                    'role' => 'user',
                    'parts' => [['text' => $prompt]],
                ],
            ],
            'systemInstruction' => [
                'parts' => [['text' => $systemInstruction]],
            ],
            'generationConfig' => [
                'responseMimeType' => 'application/json',
                'temperature' => 0,
            ],
        ];

        $response = Http::timeout(15)
            ->withoutVerifying() // bypasses Windows SSL cert issues on php -S dev server
            ->post(
            "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={$apiKey}",
            $body
        );

        if ($response->failed()) {
            $status = $response->status();
            $detail = $response->json('error.message') ?? $response->body();
            return ['error' => "Gemini API error ({$status}): {$detail}"];
        }

        $text = $response->json('candidates.0.content.parts.0.text');

        if (!$text) {
            return ['error' => 'Unexpected response from Gemini. Please try again.'];
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
- property_type: one of "detached","semi_detached","terraced","flat","bungalow" or null
- location: string (UK town/city) or null
- last_activity: one of "24h","48h","7d","1m","6m" or null
- activity_level: one of "low","medium","high" or null

Return ONLY the JSON object, no markdown, no explanation.
PROMPT;

        $filters = $this->callGemini($request->input('prompt'), $systemInstruction);

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
- property_type: one of "detached","semi_detached","terraced","flat","bungalow" or null
- location: string (UK town/city) or null
- min_price: integer in GBP or null  (for rentals, interpret monthly rent)
- max_price: integer in GBP or null
- bedrooms: integer (exact number) or null
- bathrooms: integer (exact number) or null
- parking: "1" if mentioned, else null
- garden: "1" if mentioned, else null
- furnished: "furnished" or "unfurnished" or null
- pets_allowed: "1" if mentioned, else null

Return ONLY the JSON object, no markdown, no explanation.
PROMPT;

        $filters = $this->callGemini($request->input('prompt'), $systemInstruction);

        if (isset($filters['error'])) {
            return response()->json(['error' => $filters['error']], 422);
        }

        return response()->json(['filters' => $filters]);
    }
}
