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
  error?: {
    code: number
    message: string
  }
}

/**
 * Discover websites for a niche using Google Custom Search
 * Uses multiple query strategies and returns only real results
 */
export async function discoverNicheWebsites(niche: string): Promise<{
  items: Array<{ url: string; title: string; description: string }>;
  error?: string;
}> {
  const queries = buildSearchQueries(niche)
  const allResults: SearchResult[] = []
  let lastError: string | null = null
  
  console.info('[cse] Starting discovery for niche:', niche, { queries: queries.length })
  
  // Try each query variant
  for (const [index, query] of queries.entries()) {
    try {
      console.info('[cse] Trying variant', index + 1, ':', query)
      
      // Get first page
      const page1Results = await searchGoogle(query, 1)
      allResults.push(...page1Results)
      
      console.info('[cse]', { 
        niche, 
        variant: `${index + 1}/${queries.length}`, 
        query,
        httpStatus: 200, 
        got: page1Results.length 
      })
      
      // Get second page if first page had results
      if (page1Results.length > 0) {
        try {
          const page2Results = await searchGoogle(query, 11)
          allResults.push(...page2Results)
          console.info('[cse] Got page 2:', page2Results.length, 'more results')
        } catch (error) {
          // Page 2 failure is not critical
          console.warn('[cse] Page 2 failed for', query, error)
        }
      }
      
      // Add delay between queries
      if (index < queries.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 200))
      }
      
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error'
      console.warn('[cse-error]', { 
        niche, 
        variant: `${index + 1}/${queries.length}`,
        query,
        error: errorMsg 
      })
      lastError = errorMsg
      continue
    }
  }
  
  if (allResults.length === 0) {
    return {
      items: [],
      error: lastError || 'No results found from any search variant'
    }
  }
  
  // Extract origins and deduplicate - NO FABRICATION
  const uniqueItems: Array<{ url: string; title: string; description: string }> = []
  const seenOrigins = new Set<string>()
  
  for (const result of allResults) {
    try {
      // Validate URL
      const url = new URL(result.link)
      const origin = url.origin
      
      // Skip if we already have this origin
      if (seenOrigins.has(origin)) {
        continue
      }
      
      // Skip common non-website domains but be very permissive
      if (shouldSkipDomain(url.hostname)) {
        continue
      }
      
      seenOrigins.add(origin)
      uniqueItems.push({
        url: result.link, // Use original link, not origin
        title: result.title || url.hostname,
        description: result.snippet || `Website from ${url.hostname}`
      })
      
      // Stop at reasonable limit to avoid overwhelming scoring
      if (uniqueItems.length >= 15) break
      
    } catch (error) {
      // Skip invalid URLs - do NOT fabricate replacements
      console.warn('[cse] Skipping invalid URL:', result.link)
      continue
    }
  }
  
  console.info('[cse]', { 
    niche, 
    got: allResults.length, 
    unique: uniqueItems.length,
    queries: queries.length
  })
  
  // Return actual results - NO PADDING to 10
  return {
    items: uniqueItems.slice(0, 10) // Limit to 10 but don't pad
  }
}

/**
 * Build multiple search queries for a niche (in priority order)
 */
function buildSearchQueries(niche: string): string[] {
  const cleanNiche = niche.toLowerCase().trim()
  
  return [
    `best ${cleanNiche} websites`,
    `top ${cleanNiche} sites`, 
    `top ${cleanNiche} blogs`,
    `${cleanNiche} resources`,
    `best ${cleanNiche} tools`
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
    const errorText = await response.text()
    console.warn('[cse-error]', { 
      query,
      status: response.status, 
      body: errorText.slice(0, 200) 
    })
    throw new Error(`Google Search API error: ${response.status} ${response.statusText}`)
  }

  const data: GoogleSearchResponse = await response.json()
  
  if (data.error) {
    console.warn('[cse-error]', {
      query,
      status: data.error.code,
      body: data.error.message
    })
    throw new Error(`Google Search API error: ${data.error.message}`)
  }
  
  return data.items || []
}

/**
 * Check if we should skip this domain (be very permissive - only skip major platforms)
 */
function shouldSkipDomain(hostname: string): boolean {
  const skipDomains = [
    'google.com',
    'youtube.com', 
    'facebook.com',
    'twitter.com',
    'instagram.com',
    'linkedin.com'
  ]
  
  const domain = hostname.replace(/^www\./, '')
  return skipDomains.includes(domain)
}
