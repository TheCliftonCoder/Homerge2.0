# Advanced Proximity Search Setup

This system uses a hybrid approach for location-based filtering, combining pre-computed SQL queries, on-the-fly geocoding, and isochrone polygon filtering.

## Dependencies

1. **Mapbox API Token**: Ensure `MAPBOX_TOKEN` is set in your `.env` file.
2. **Gemini API Token**: Ensure `GEMINI_API_KEY` is set for AI prompt parsing.

## Infrastructure Requirements

### 1. Queue Worker (CRITICAL)
POI calculations (Phase 1) are handled asynchronously to prevent slow property uploads. You **MUST** have a queue worker running to process these jobs.

**Run locally:**
```bash
php artisan queue:work
```

**Production:**
Use Supervisor or a similar process manager to keep `php artisan queue:work` running continuously.

### 2. Task Scheduler
In the future, a cleanup task for expired geocoding caches may be added. Ensure the Laravel scheduler is running in your crontab:

```bash
* * * * * cd /path-to-your-project && php artisan schedule:run >> /dev/null 2>&1
```

## How it Works

### Pre-computed POIs
When a property is created or updated, `ComputePropertyPOIJob` fetches the nearest points of interest (train stations, schools, etc.) from Mapbox and caches them in the `property_poi_cache` table.

### Geocoding Cache
Specific address searches (Mode 2) are cached for 30 days to minimize API costs.

### Travel Time (Isochrones)
Travel time filtering (Mode 3) uses the Mapbox Isochrone API. Results are cached for 24 hours. The system uses a Ray Casting algorithm to determine if properties fall within the travel-time polygon.
