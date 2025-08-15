import { env } from '@/lib/env'

export interface SearchResult {
  title: string
  link: string
  snippet: string
  displayLink: string
}

export interface GoogleSearchResponse {
  items?: SearchResult[]
  searchInformation?: {
    totalResults: string
    searchTime: number
  }
}

/**
 * Discover websites for a niche using Google Custom Search
 * Uses multiple query strategies and deduplication
 */
export async function discoverNicheWebsites(niche: string): Promise<string[]> {
  const queries = buildSearchQueries(niche)
  const allResults: SearchResult[] = []
  
  console.info('[discover] Starting search for niche:', niche, { queries })
  
  // Search with each query to get diverse results
  for (const query of queries) {
    try {
      console.info('[discover] Searching:', query)
      
      // Get first page
      const page1Results = await searchGoogle(query, 1)
      allResults.push(...page1Results)
      
      // Get second page if first page had results
      if (page1Results.length > 0) {
        const page2Results = await searchGoogle(query, 11)
        allResults.push(...page2Results)
      }
      
      // Add small delay between queries to be respectful
      await new Promise(resolve => setTimeout(resolve, 200))
    } catch (error) {
      console.warn('[discover] Query failed:', query, error)
      // Continue with other queries even if one fails
    }
  }
  
  // Extract origins and deduplicate
  const originSet = new Set<string>()
  const origins: string[] = []
  
  for (const result of allResults) {
    try {
      const url = new URL(result.link)
      const origin = url.origin
      
      // Skip if we already have this origin
      if (originSet.has(origin)) {
        continue
      }
      
      // Skip common non-website domains but be permissive
      if (shouldSkipDomain(url.hostname)) {
        continue
      }
      
      originSet.add(origin)
      origins.push(origin)
      
      // Stop when we have enough origins (up to 15 to allow for scoring failures)
      if (origins.length >= 15) break
    } catch (error) {
      // Skip invalid URLs
      continue
    }
  }
  
  console.info('[discover]', niche, { 
    items: allResults.length, 
    unique: origins.length,
    queries: queries.length 
  })
  
  // Return up to 10 origins (important: don't return empty if we have some)
  return origins.slice(0, 10)
}

/**
 * Build multiple search queries for a niche
 */
function buildSearchQueries(niche: string): string[] {
  const cleanNiche = niche.toLowerCase().trim()
  
  return [
    `best ${cleanNiche} websites`,
    `top ${cleanNiche} blogs`,
    `${cleanNiche} resources`,
  ]
}

/**
 * Search Google Custom Search API
 */
async function searchGoogle(query: string, startIndex: number = 1): Promise<SearchResult[]> {
  const apiUrl = new URL('https://www.googleapis.com/customsearch/v1')
  apiUrl.searchParams.set('key', env.GOOGLE_SEARCH_API_KEY)
  apiUrl.searchParams.set('cx', env.GOOGLE_SEARCH_ENGINE_ID)
  apiUrl.searchParams.set('q', query)
  apiUrl.searchParams.set('num', '10')
  apiUrl.searchParams.set('start', startIndex.toString())
  apiUrl.searchParams.set('safe', 'active')

  const response = await fetch(apiUrl.toString(), {
    headers: {
      'Accept': 'application/json',
    },
  })

  if (!response.ok) {
    throw new Error(`Google Search API error: ${response.status} ${response.statusText}`)
  }

  const data: GoogleSearchResponse = await response.json()
  
  return data.items || []
}

/**
 * Check if we should skip this domain (be very permissive)
 */
function shouldSkipDomain(hostname: string): boolean {
  const skipDomains = [
    'google.com',
    'youtube.com', 
    'facebook.com',
    'twitter.com',
    'instagram.com',
    'linkedin.com',
    'reddit.com',
    'wikipedia.org',
  ]
  
  // Check exact domain matches (be permissive - only skip major platforms)
  const domain = hostname.replace(/^www\./, '')
  return skipDomains.includes(domain)
}
