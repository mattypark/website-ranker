# StudyRank - Top Study Websites Ranking Platform

A production-ready web application that analyzes and ranks the top 10 study websites using real APIs for comprehensive performance, authority, search presence, freshness, and usability analysis.

## 🚀 Features

- **Real API Integration**: Uses Google PageSpeed Insights, Google Custom Search, and Open PageRank APIs
- **Comprehensive Analysis**: 5-factor scoring system with detailed breakdowns
- **Production Database**: Full Prisma schema with PostgreSQL support
- **Modern UI**: Responsive design with TailwindCSS and Lucide React icons
- **Background Jobs**: BullMQ integration for scalable processing
- **Environment Validation**: Zod-based validation for all environment variables

## 📊 Scoring Algorithm

Websites are scored using the specified formula:

```
score = 0.40 × searchPresence
      + 0.25 × performance  
      + 0.15 × backlinkAuthority
      + 0.10 × freshness
      + 0.10 × usability
```

### Score Components

1. **Search Presence (40%)** - Google search visibility and ranking
2. **Performance (25%)** - PageSpeed scores, Core Web Vitals, load times
3. **Backlink Authority (15%)** - Domain authority, PageRank, backlinks
4. **Freshness (10%)** - Content update frequency and recency
5. **Usability (10%)** - Mobile optimization, accessibility, SEO, security

## 🛠 Tech Stack

- **Frontend**: Next.js 15 (App Router), TypeScript, TailwindCSS
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: PostgreSQL (Supabase/Neon ready)
- **APIs**: Google PageSpeed Insights, Google Custom Search, Open PageRank
- **Caching**: Redis (Upstash compatible)
- **Background Jobs**: BullMQ
- **Validation**: Zod

## 🚀 Quick Start

### 1. Clone and Install

```bash
git clone <your-repo>
cd webscraper
npm install
```

### 2. Environment Setup

Copy `.env.example` to `.env` and fill in your API keys:

```bash
cp .env.example .env
```

Required environment variables:

```env
# Database (Supabase/Neon)
DATABASE_URL="postgresql://username:password@db.example.supabase.co:5432/postgres"

# Redis (Optional - for caching and background jobs)
REDIS_URL="redis://default:your-password@your-redis.upstash.io:6379"

# Google APIs
GOOGLE_PAGESPEED_API_KEY="your-google-pagespeed-api-key"
GOOGLE_SEARCH_ENGINE_ID="your-custom-search-engine-id"  
GOOGLE_SEARCH_API_KEY="your-google-search-api-key"

# Open PageRank API
OPEN_PAGERANK_API_KEY="your-open-pagerank-api-key"
```

### 3. Database Setup

```bash
# Push schema to database
npm run db:push

# Or create and run migrations
npm run db:migrate
```

### 4. Run Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

## 🔧 API Setup Guide

### Google PageSpeed Insights API

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Enable PageSpeed Insights API
3. Create API credentials
4. Add key to `GOOGLE_PAGESPEED_API_KEY`

### Google Custom Search API

1. Go to [Google Custom Search](https://cse.google.com/)
2. Create a custom search engine
3. Get the Search Engine ID → `GOOGLE_SEARCH_ENGINE_ID`
4. Enable Custom Search API in Google Cloud Console
5. Create API key → `GOOGLE_SEARCH_API_KEY`

### Open PageRank API

1. Sign up at [OpenPageRank.com](https://www.openpagerank.com/)
2. Get your API key → `OPEN_PAGERANK_API_KEY`

## 📁 Project Structure

```
src/
├── app/
│   ├── api/generate/route.ts     # Main API endpoint
│   ├── results/page.tsx          # Results display page  
│   └── page.tsx                  # Homepage
├── lib/
│   ├── services/
│   │   ├── google-pagespeed.ts   # PageSpeed Insights API
│   │   ├── google-search.ts      # Custom Search API
│   │   ├── open-pagerank.ts      # Open PageRank API
│   │   └── site-analyzer.ts      # Comprehensive site analysis
│   ├── env.ts                    # Environment validation
│   ├── prisma.ts                 # Database client
│   ├── redis.ts                  # Redis configuration
│   ├── queue.ts                  # BullMQ setup
│   ├── scoring.ts                # Scoring algorithm
│   └── utils.ts                  # Utility functions
└── prisma/
    └── schema.prisma             # Database schema
```

## 🗄 Database Schema

The application uses 4 main tables:

- **runs** - Analysis run metadata and status
- **sites** - Website information and metadata  
- **site_metrics** - Raw performance and authority metrics
- **site_scores** - Calculated scores and detailed breakdowns

## 🚀 Deployment

### Vercel Deployment

1. **Push to GitHub**
2. **Connect to Vercel**
3. **Set Environment Variables** in Vercel dashboard
4. **Deploy**

### Database Setup (Supabase)

1. Create project at [supabase.com](https://supabase.com)
2. Get connection string from Settings → Database
3. Add to `DATABASE_URL` in Vercel

### Redis Setup (Upstash)

1. Create database at [upstash.com](https://upstash.com)
2. Get Redis URL from console  
3. Add to `REDIS_URL` in Vercel

### Environment Variables in Vercel

Add all variables from `.env.example` in Vercel Dashboard → Settings → Environment Variables.

## 📊 API Endpoints

### POST /api/generate

Generate new rankings for study websites.

**Request:**
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
  "results": [
    {
      "rank": 1,
      "site": {
        "id": "site_id",
        "name": "Khan Academy",
        "url": "https://www.khanacademy.org",
        "title": "Khan Academy | Free Online Courses",
        "description": "Learn for free about math, art, computer programming...",
        "favicon": "https://www.google.com/s2/favicons?domain=khanacademy.org&sz=64",
        "domain": "khanacademy.org"
      },
      "score": {
        "total": 87,
        "searchPresence": 92,
        "performance": 78,
        "backlinkAuthority": 95,
        "freshness": 85,
        "usability": 88,
        "breakdown": { /* detailed breakdown */ }
      }
    }
  ]
}
```

### GET /api/generate?runId=<id>

Retrieve results for a specific analysis run.

## 🔧 Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run db:push      # Push schema to database  
npm run db:migrate   # Create and run migrations
npm run db:studio    # Open Prisma Studio
```

## 🚦 Rate Limits & Costs

- **Google PageSpeed**: 25,000 requests/day (free)
- **Google Custom Search**: 100 searches/day (free), $5/1000 after
- **Open PageRank**: 1,000 requests/month (free)

## 🔍 Monitoring

The application includes comprehensive error handling and logging:

- API failures are gracefully handled with fallbacks
- Database errors are logged and reported
- Rate limiting is respected with delays between requests
- Failed analyses don't stop the entire run

## 📈 Performance Tips

1. **Batch Processing**: Analyze multiple sites concurrently
2. **Caching**: Use Redis to cache expensive API calls
3. **Background Jobs**: Use BullMQ for long-running analyses
4. **Database Indexing**: Add indexes for frequently queried fields

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details.

---

**Ready for production!** 🚀 This application is now fully configured with real APIs, production database schema, and deployment-ready configuration.