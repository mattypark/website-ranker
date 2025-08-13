# StudyRank - Top Study Websites Ranking Platform

A minimal MVP for ranking the top 10 study websites based on comprehensive analysis of performance, authority, content freshness, and trust signals.

## Features

- **Homepage** with a prominent "See the Top Study Websites" button
- **API endpoint** (`/api/generate`) that analyzes and ranks study websites
- **Results page** displaying ranked websites with detailed score breakdowns
- **Score breakdown modal** showing "Why this rank?" with detailed metrics
- **Responsive design** with modern UI using TailwindCSS

## Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, TailwindCSS
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: PostgreSQL (configured for Supabase/Neon)
- **Caching**: Upstash Redis
- **Background Jobs**: BullMQ
- **Validation**: Zod
- **Icons**: Lucide React

## Database Schema

The application uses four main tables:

- `sites` - Website information (URL, name, description, favicon)
- `site_metrics` - Raw performance and authority metrics
- `site_scores` - Calculated scores and breakdowns
- `runs` - Analysis run metadata

## Scoring Algorithm

Websites are scored based on four weighted categories:

1. **Performance (30%)** - PageSpeed scores, load times, Core Web Vitals
2. **Authority (40%)** - Domain authority, PageRank, backlinks
3. **Freshness (15%)** - Content update frequency and recency
4. **Trust (15%)** - Security features, privacy policies, trust signals

## API Endpoints

### POST /api/generate
Generates new rankings for study websites.

**Request Body:**
```json
{
  "category": "study",
  "limit": 10
}
```

**Response:**
```json
{
  "success": true,
  "runId": "run_id",
  "category": "study",
  "totalAnalyzed": 20,
  "results": [...]
}
```

### GET /api/generate?runId=<id>
Retrieves results for a specific analysis run.

## Environment Variables

Create a `.env` file with the following variables:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/webscraper"

# Redis (Upstash)
UPSTASH_REDIS_REST_URL="https://your-redis-instance.upstash.io"
UPSTASH_REDIS_REST_TOKEN="your-redis-token"

# API Keys (Optional for MVP - using mocked data)
BING_SEARCH_API_KEY="your-bing-api-key"
GOOGLE_PAGESPEED_API_KEY="your-google-pagespeed-api-key"
OPEN_PAGERANK_API_KEY="your-open-pagerank-api-key"

# App Configuration
NODE_ENV="development"
```

## Getting Started

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up the database:**
   ```bash
   npx prisma generate
   npx prisma db push
   ```

3. **Run the development server:**
   ```bash
   npm run dev
   ```

4. **Open your browser:**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Project Structure

```
src/
├── app/
│   ├── api/generate/route.ts    # Main API endpoint
│   ├── results/page.tsx         # Results display page
│   └── page.tsx                 # Homepage
├── lib/
│   ├── services/
│   │   └── mock-apis.ts         # Mock API implementations
│   ├── env.ts                   # Environment validation
│   ├── prisma.ts                # Database client
│   ├── queue.ts                 # BullMQ setup
│   ├── redis.ts                 # Redis configuration
│   ├── scoring.ts               # Scoring algorithm
│   └── utils.ts                 # Utility functions
└── prisma/
    └── schema.prisma            # Database schema
```

## Mock Data

For the MVP, the application uses mock data for:

- **Bing Search API** - Returns predefined study websites
- **Google PageSpeed Insights** - Generates realistic performance scores
- **Open PageRank** - Creates authority and backlink metrics

## TODOs for Production

### API Integrations
- [ ] Replace mock Bing Search with real API calls
- [ ] Integrate Google PageSpeed Insights API
- [ ] Add Open PageRank API integration
- [ ] Implement robots.txt parsing
- [ ] Add sitemap.xml analysis

### Performance & Scaling
- [ ] Set up background job processing with BullMQ workers
- [ ] Implement Redis caching for expensive operations
- [ ] Add rate limiting for API calls
- [ ] Optimize database queries with indexes

### Features
- [ ] Add authentication and user accounts
- [ ] Implement category filtering (beyond just "study")
- [ ] Add historical ranking trends
- [ ] Create admin dashboard for monitoring
- [ ] Add email notifications for completed analyses

### Infrastructure
- [ ] Set up proper error tracking (Sentry)
- [ ] Add monitoring and alerting
- [ ] Configure CI/CD pipeline
- [ ] Set up staging environment

## Deployment

The application is ready to deploy to:

- **Vercel** (recommended for Next.js)
- **Railway** 
- **Render**
- **DigitalOcean App Platform**

Make sure to:
1. Set up a PostgreSQL database (Supabase/Neon/Railway)
2. Configure Upstash Redis instance
3. Set all environment variables
4. Run database migrations

## License

MIT License - see LICENSE file for details.