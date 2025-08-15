# NicheRank Testing Guide

## Overview
The app has been successfully transformed from a hardcoded "study" website finder to a dynamic niche-based website ranking system.

## Key Changes Made

1. **Dynamic Niche Input**: Homepage now requires users to enter a niche/topic
2. **Multiple Search Variations**: Uses 5 different search queries per niche:
   - `best ${niche} websites`
   - `top ${niche} blogs` 
   - `best ${niche} tools`
   - `top ${niche} sites`
   - `${niche} resources`
3. **Domain Deduplication**: Uses `new URL(url).origin` to ensure unique domains
4. **24-Hour Caching**: Cached results stored in Prisma database
5. **Shareable URLs**: Results pages use format `/results?topic=cooking-banana-bread`
6. **Comprehensive Scoring**: 5-factor scoring system (40% search presence, 25% performance, 15% authority, 10% freshness, 10% usability)

## Required Environment Variables

Before testing, ensure these are set in your `.env` file:

```env
DATABASE_URL="your-postgresql-url"
GOOGLE_SEARCH_API_KEY="your-google-custom-search-api-key"
GOOGLE_SEARCH_ENGINE_ID="your-google-custom-search-engine-id"
GOOGLE_PAGESPEED_API_KEY="your-google-pagespeed-api-key"
OPEN_PAGERANK_API_KEY="your-open-pagerank-api-key"
```

## Setup Steps

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Generate Prisma Client**:
   ```bash
   npx prisma generate
   ```

3. **Run Database Migrations** (if needed):
   ```bash
   npx prisma db push
   ```

4. **Start Development Server**:
   ```bash
   npm run dev
   ```

## Test Cases

### Test 1: Healthy Recipes
1. Navigate to `http://localhost:3000`
2. Enter "healthy recipes" in the niche input
3. Click "Find Top 10 Websites"
4. Verify:
   - URL becomes `/results?topic=healthy-recipes&runId=...`
   - Page shows "Top 10 Healthy Recipes Websites"
   - Results include food/recipe websites
   - Each result shows domain, score breakdown, and metrics
   - Scores are calculated using the 5-factor system

### Test 2: Programming Blogs
1. Enter "programming blogs" in the niche input
2. Click "Find Top 10 Websites"  
3. Verify:
   - URL becomes `/results?topic=programming-blogs&runId=...`
   - Page shows "Top 10 Programming Blogs Websites"
   - Results include programming/tech blogs
   - All results are unique domains (no duplicates)

### Test 3: Caching Behavior
1. Search for "healthy recipes" again within 24 hours
2. Verify:
   - Results load faster (from cache)
   - Page shows "⚡ Results from cache (updated within 24 hours)"
   - Same results as previous search

### Test 4: Shareable URLs
1. Copy the results URL (e.g., `/results?topic=healthy-recipes&runId=...`)
2. Open in new browser tab/window
3. Verify results display correctly

## Expected API Behavior

### POST /api/generate
- **Input**: `{ "niche": "healthy recipes" }`
- **Output**: 
  ```json
  {
    "success": true,
    "runId": "cuid-string",
    "niche": "healthy recipes",
    "cached": false,
    "totalAnalyzed": 10,
    "results": [...]
  }
  ```

### GET /api/generate?runId=...
- Returns cached results for a specific run ID
- Used by results page to display data

## Database Schema

The app now uses two main tables:
- `NicheAnalysis`: Stores niche searches with timestamps
- `SiteResult`: Stores individual website results with scores

## Troubleshooting

### Common Issues:
1. **API Key Errors**: Ensure all environment variables are set correctly
2. **Database Errors**: Run `npx prisma db push` to sync schema
3. **Empty Results**: Check Google Custom Search API limits/quotas
4. **Slow Loading**: Performance analysis can take 30-60 seconds per site

### Performance Notes:
- First search for a niche takes longer (60+ seconds for 10 sites)
- Subsequent searches within 24 hours are instant (cached)
- Google PageSpeed API has rate limits
- Open PageRank API has daily quotas

## Success Criteria ✅

All requirements have been implemented:
- ✅ Dynamic niche input on homepage
- ✅ Google Custom Search with multiple query variations
- ✅ Domain deduplication using URL.origin
- ✅ 10 unique domains limit
- ✅ Comprehensive scoring system with Prisma storage
- ✅ 24-hour caching logic
- ✅ Clean results table with rank, domain, score, last updated
- ✅ Shareable URLs with topic slugs
- ✅ No hardcoded "study" references
- ✅ Modular, maintainable code structure
