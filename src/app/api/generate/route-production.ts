import { NextRequest, NextResponse } from 'next/server'

// Production-ready implementation with real Google Custom Search
// Rename this to route.ts when your environment variables are properly set

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
}

// Rate limiting (simple in-memory implementation)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()

// Helper function to get client IP from headers (Vercel-compatible)
function getClientIp(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    request.headers.get('x-vercel-forwarded-for') ||
    request.headers.get('cf-connecting-ip') ||
    'unknown'
  )
}

function rateLimit(request: NextRequest, limit: number = 3, windowMs: number = 60000): boolean {
  const ip = getClientIp(request)
  const now = Date.now()
  
  const current = rateLimitMap.get(ip)
  
  if (!current) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + windowMs })
    return true
  }
  
  if (now > current.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + windowMs })
    return true
  }
  
  if (current.count >= limit) {
    return false
  }
  
  current.count++
  return true
}

// Google Custom Search implementation
async function discoverNicheWebsites(niche: string): Promise<string[]> {
  const queries = [
    `best ${niche} websites`,
    `top ${niche} blogs`,
    `${niche} resources`,
  ]
  
  const allResults: any[] = []
  
  console.info('[discover] Starting search for niche:', niche, { queries })
  
  for (const query of queries) {
    try {
      console.info('[discover] Searching:', query)
      
      // Make Google Custom Search API calls
      const page1Results = await searchGoogle(query, 1)
      allResults.push(...page1Results)
      
      if (page1Results.length > 0) {
        const page2Results = await searchGoogle(query, 11)
        allResults.push(...page2Results)
      }
      
      await new Promise(resolve => setTimeout(resolve, 200))
    } catch (error) {
      console.warn('[discover] Query failed:', query, error)
    }
  }
  
  // Extract and dedupe origins
  const originSet = new Set<string>()
  const origins: string[] = []
  
  for (const result of allResults) {
    try {
      const url = new URL(result.link)
      const origin = url.origin
      
      if (shouldSkipDomain(url.hostname) || originSet.has(origin)) {
        continue
      }
      
      originSet.add(origin)
      origins.push(origin)
      
      if (origins.length >= 15) break
    } catch (error) {
      continue
    }
  }
  
  console.info('[discover]', niche, { 
    items: allResults.length, 
    unique: origins.length 
  })
  
  return origins.slice(0, 10)
}

async function searchGoogle(query: string, startIndex: number = 1): Promise<any[]> {
  const apiUrl = new URL('https://www.googleapis.com/customsearch/v1')
  apiUrl.searchParams.set('key', process.env.GOOGLE_SEARCH_API_KEY!)
  apiUrl.searchParams.set('cx', process.env.GOOGLE_SEARCH_ENGINE_ID!)
  apiUrl.searchParams.set('q', query)
  apiUrl.searchParams.set('num', '10')
  apiUrl.searchParams.set('start', startIndex.toString())
  apiUrl.searchParams.set('safe', 'active')

  const response = await fetch(apiUrl.toString(), {
    headers: { 'Accept': 'application/json' },
  })

  if (!response.ok) {
    throw new Error(`Google Search API error: ${response.status}`)
  }

  const data = await response.json()
  return data.items || []
}

function shouldSkipDomain(hostname: string): boolean {
  const skipDomains = [
    'google.com', 'youtube.com', 'facebook.com', 'twitter.com',
    'instagram.com', 'linkedin.com', 'reddit.com', 'wikipedia.org'
  ]
  
  const domain = hostname.replace(/^www\./, '')
  return skipDomains.includes(domain)
}

// Scoring implementation
async function scoreSites(origins: string[]): Promise<any[]> {
  const results: any[] = []
  
  for (let i = 0; i < origins.length; i++) {
    const origin = origins[i]
    console.info('[score] Analyzing:', origin)
    
    let performanceScore = 0
    let authorityScore = 0
    let title = new URL(origin).hostname
    let description = `Website for ${new URL(origin).hostname}`
    let usabilityScore = 0
    
    let psiOk = false
    let oprOk = false
    let siteOk = false
    
    // Try to get real scores with timeouts
    try {
      const siteInfo = await Promise.race([
        analyzeSite(origin),
        new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 10000))
      ]) as any
      
      title = siteInfo.title || title
      description = siteInfo.description || description
      usabilityScore = (siteInfo.usabilityScore || 0) * 100
      siteOk = true
    } catch (error) {
      console.warn('[fallback] Site analysis failed for', origin)
    }

    try {
      const psiResult = await Promise.race([
        getPerformanceScore(origin),
        new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 15000))
      ]) as any
      
      performanceScore = (psiResult.performanceScore || 0) * 100
      psiOk = true
    } catch (error) {
      console.warn('[fallback] PageSpeed failed for', origin)
    }

    try {
      const oprResult = await Promise.race([
        getAuthorityScore(origin),
        new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 10000))
      ]) as any
      
      authorityScore = (oprResult.authorityScore || 0) * 100
      oprOk = true
    } catch (error) {
      console.warn('[fallback] OpenPageRank failed for', origin)
    }

    const searchScore = Math.max(0, 100 - i * 10)
    const freshnessScore = 75
    
    const components = {
      search: Math.round(searchScore),
      performance: Math.round(performanceScore),
      authority: Math.round(authorityScore),
      freshness: Math.round(freshnessScore),
      usability: Math.round(usabilityScore)
    }
    
    const totalScore = Math.round(
      components.search * 0.40 +
      components.performance * 0.25 +
      components.authority * 0.15 +
      components.freshness * 0.10 +
      components.usability * 0.10
    )

    console.info('[score]', origin, { psiOk, oprOk, siteOk, score: totalScore })

    results.push({
      rank: i + 1,
      site: {
        url: origin,
        title,
        description,
        domain: new URL(origin).hostname.replace('www.', ''),
        favicon: `https://www.google.com/s2/favicons?domain=${new URL(origin).hostname}&sz=64`
      },
      score: totalScore,
      components
    })
  }
  
  return results.sort((a, b) => b.score - a.score).map((result, index) => ({
    ...result,
    rank: index + 1
  }))
}

// Placeholder functions for external APIs
async function analyzeSite(origin: string): Promise<any> {
  // This would call your site analyzer
  const response = await fetch(origin, { 
    headers: { 'User-Agent': 'NicheRank Bot 1.0' },
    signal: AbortSignal.timeout(10000)
  })
  
  if (!response.ok) throw new Error(`HTTP ${response.status}`)
  
  const html = await response.text()
  const title = html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1]?.trim()
  const description = html.match(/<meta[^>]*name="description"[^>]*content="([^"]*)"[^>]*>/i)?.[1]?.trim()
  
  return {
    title: title?.slice(0, 100),
    description: description?.slice(0, 200),
    usabilityScore: origin.startsWith('https://') ? 0.8 : 0.4
  }
}

async function getPerformanceScore(origin: string): Promise<any> {
  // This would call Google PageSpeed Insights API
  const apiUrl = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(origin)}&key=${process.env.GOOGLE_PAGESPEED_API_KEY}&strategy=mobile&category=performance`
  
  const response = await fetch(apiUrl)
  if (!response.ok) throw new Error(`PSI API error: ${response.status}`)
  
  const data = await response.json()
  return {
    performanceScore: data.lighthouseResult?.categories?.performance?.score || 0
  }
}

async function getAuthorityScore(origin: string): Promise<any> {
  // This would call Open PageRank API
  const domain = new URL(origin).hostname.replace('www.', '')
  const apiUrl = `https://openpagerank.com/api/v1.0/getPageRank?domains[]=${domain}`
  
  const response = await fetch(apiUrl, {
    headers: { 'API-OPR': process.env.OPEN_PAGERANK_API_KEY! }
  })
  
  if (!response.ok) throw new Error(`OPR API error: ${response.status}`)
  
  const data = await response.json()
  const pageRank = data.response?.[0]?.page_rank_decimal || 0
  
  return {
    authorityScore: Math.max(0, Math.min(1, pageRank / 10))
  }
}

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    if (!rateLimit(request, 3, 60 * 1000)) {
      return NextResponse.json(
        { success: false, error: 'Rate limit exceeded. Please wait before making another request.' },
        { status: 429 }
      )
    }

    const body = await request.json()
    let { niche } = body

    if (!niche || typeof niche !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Niche parameter is required' },
        { status: 400 }
      )
    }

    niche = niche.trim()
    if (niche.length === 0) {
      niche = 'study'
    }

    if (niche.length > 60) {
      return NextResponse.json(
        { success: false, error: 'Niche must be 60 characters or less' },
        { status: 400 }
      )
    }

    const nicheSlug = slugify(niche)
    const runId = `run_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    console.info('[API] Processing niche:', niche)

    // Discover websites
    const origins = await discoverNicheWebsites(niche)
    
    if (origins.length === 0) {
      return NextResponse.json({
        success: false,
        error: `No websites found for "${niche}". Try a different search term.`,
        runId,
        niche,
        results: []
      })
    }

    // Score websites
    const results = await scoreSites(origins)

    console.info('[API] Completed:', { runId, niche, resultsCount: results.length })
    
    return NextResponse.json({
      success: true,
      runId,
      niche,
      nicheSlug,
      results,
      cached: false,
      ...(process.env.NODE_ENV === 'development' && {
        debug: {
          originsFound: origins.length,
          sitesScored: results.length,
          resultsReturned: results.length
        }
      })
    })
    
  } catch (error) {
    console.error('[API] Fatal error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to generate rankings',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const runId = searchParams.get('runId') || searchParams.get('run')
  
  if (!runId) {
    return NextResponse.json({
      message: 'NicheRank API - Use POST method to generate rankings or provide run parameter',
      usage: {
        post: 'POST /api/generate with body { niche: "your-niche-here" }',
        get: 'GET /api/generate?run=<run_id>'
      }
    })
  }

  // For production, this would fetch from database
  // For now, return sample data
  return NextResponse.json({
    success: true,
    runId,
    niche: 'fitness apps',
    nicheSlug: 'fitness-apps',
    status: 'completed',
    totalAnalyzed: 10,
    results: []
  })
}
