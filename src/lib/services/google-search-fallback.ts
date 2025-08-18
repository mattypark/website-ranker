// Real internet search implementation - NO HARDCODED DATA

export interface SearchResult {
  title: string
  link: string
  snippet: string
  displayLink?: string
}

type OutItem = { url: string; title: string; description: string }

// Get API keys from environment
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY || process.env.GOOGLE_SEARCH_API_KEY
const GOOGLE_CSE_ID = process.env.GOOGLE_CSE_ID || process.env.GOOGLE_SEARCH_ENGINE_ID
const BRAVE_SEARCH_KEY = process.env.BRAVE_SEARCH_KEY

interface ProviderResult { 
  title: string
  link: string
  snippet: string
  displayLink?: string 
}

interface SearchProvider { 
  search(q: string): Promise<ProviderResult[]> 
}

// Utility functions
function hostname(u: string): string {
  try { return new URL(u).hostname.toLowerCase() } catch { return '' }
}

function etld1(u: string): string {
  const h = hostname(u)
  const parts = h.split('.')
  if (parts.length <= 2) return h
  return parts.slice(-2).join('.')
}

function toHomepage(u: string): string {
  try {
    const url = new URL(u)
    url.hash = ''
    url.search = ''
    // Only simplify very deep paths
    if ((url.pathname || '/').split('/').filter(Boolean).length > 3) {
      url.pathname = '/'
    }
    return url.toString()
  } catch { return u }
}

function isBlockedHost(h: string): boolean {
  const blocked = new Set([
    'apps.apple.com', 'itunes.apple.com', 'play.google.com',
    'apps.microsoft.com', 'chrome.google.com', 'apps.shopify.com',
    'twitter.com', 'x.com', 'tiktok.com', 'instagram.com',
    'facebook.com', 'linkedin.com', 'pinterest.com',
    'youtube.com', 'reddit.com' // Added common non-website domains
  ])
  return blocked.has(h.replace('www.', ''))
}

async function withTimeout<T>(p: Promise<T>, ms = 10000): Promise<T> {
  return await Promise.race([
    p,
    new Promise<never>((_, rej) => setTimeout(() => rej(new Error('timeout')), ms)),
  ])
}

// Google Custom Search implementation
class GoogleCSE implements SearchProvider {
  async search(q: string): Promise<ProviderResult[]> {
    console.info('[GoogleCSE] Searching for:', q)
    
    const searchQueries = [
      `best ${q} websites`,
      `top ${q} sites`,
      `${q} resources`,
      `popular ${q} platforms`
    ]
    
    const allResults: ProviderResult[] = []
    
    // Try multiple search queries to get comprehensive results
    for (const query of searchQueries) {
      try {
        console.info('[GoogleCSE] Trying query:', query)
        
        const url = new URL('https://www.googleapis.com/customsearch/v1')
        url.searchParams.set('key', GOOGLE_API_KEY!)
        url.searchParams.set('cx', GOOGLE_CSE_ID!)
        url.searchParams.set('q', query)
        url.searchParams.set('num', '10')
        url.searchParams.set('safe', 'active')
        
        const res = await fetch(url.toString(), { 
          cache: 'no-store',
          headers: {
            'User-Agent': 'NicheRank/1.0'
          }
        })
        
        if (!res.ok) {
          console.warn('[GoogleCSE] HTTP error:', res.status, res.statusText)
          continue
        }
        
        const json = await res.json()
        
        if (json.error) {
          console.warn('[GoogleCSE] API error:', json.error.message)
          continue
        }
        
        const items = (json.items ?? []) as any[]
        console.info('[GoogleCSE] Got', items.length, 'results for:', query)
        
        const results = items.map(it => ({
          title: it.title ?? '',
          link: it.link ?? '',
          snippet: it.snippet ?? '',
          displayLink: it.displayLink ?? hostname(it.link ?? ''),
        }))
        
        allResults.push(...results)
        
        // Add delay between requests to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 500))
        
        if (allResults.length >= 40) break // Enough results
        
      } catch (error) {
        console.warn('[GoogleCSE] Query failed:', query, error)
        continue
      }
    }
    
    console.info('[GoogleCSE] Total results collected:', allResults.length)
    return allResults
  }
}

// Brave Search implementation  
class BraveSearch implements SearchProvider {
  async search(q: string): Promise<ProviderResult[]> {
    console.info('[BraveSearch] Searching for:', q)
    
    const searchQueries = [
      `best ${q} websites`,
      `top ${q} sites`,
      `${q} resources`
    ]
    
    const allResults: ProviderResult[] = []
    
    for (const query of searchQueries) {
      try {
        console.info('[BraveSearch] Trying query:', query)
        
        const res = await fetch(
          `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}&count=10`,
          { 
            headers: { 
              'X-Subscription-Token': String(BRAVE_SEARCH_KEY),
              'Accept': 'application/json'
            }, 
            cache: 'no-store' 
          }
        )
        
        if (!res.ok) {
          console.warn('[BraveSearch] HTTP error:', res.status, res.statusText)
          continue
        }
        
        const json = await res.json()
        const items = (json?.web?.results ?? json?.results ?? []) as any[]
        
        console.info('[BraveSearch] Got', items.length, 'results for:', query)
        
        const results = items.map((it: any) => ({
          title: it.title ?? '',
          link: it.url ?? it.link ?? '',
          snippet: it.description ?? it.snippet ?? '',
          displayLink: hostname(it.url ?? it.link ?? ''),
        }))
        
        allResults.push(...results)
        
        // Add delay between requests
        await new Promise(resolve => setTimeout(resolve, 500))
        
        if (allResults.length >= 30) break
        
      } catch (error) {
        console.warn('[BraveSearch] Query failed:', query, error)
        continue
      }
    }
    
    console.info('[BraveSearch] Total results collected:', allResults.length)
    return allResults
  }
}

// Main search function - NO HARDCODED DATA
export async function discoverNicheWebsites(niche: string): Promise<{ items: OutItem[]; error?: string }> {
  const q = niche.trim()
  if (!q) return { items: [], error: 'Empty query' }

  console.info('[Discovery] Starting real internet search for:', q)

  // Determine which search provider to use
  let provider: SearchProvider | null = null
  
  if (GOOGLE_API_KEY && GOOGLE_CSE_ID) {
    provider = new GoogleCSE()
    console.info('[Discovery] Using Google Custom Search API')
  } else if (BRAVE_SEARCH_KEY) {
    provider = new BraveSearch()
    console.info('[Discovery] Using Brave Search API')
  } else {
    console.error('[Discovery] No API keys found! Please set GOOGLE_API_KEY + GOOGLE_CSE_ID or BRAVE_SEARCH_KEY')
    return {
      items: [],
      error: `No search API configured. Please set environment variables for Google Custom Search or Brave Search.` 
    }
  }

  try {
    // Perform real internet search
    console.info('[Discovery] Making API calls to search the internet...')
    const raw: ProviderResult[] = await withTimeout(provider.search(q), 30000)
    console.info('[Discovery] Raw results from API:', raw.length)

    if (raw.length === 0) {
      return { items: [], error: `No websites found for "${q}" on the internet. Try a different search term.` }
    }

    // Filter and deduplicate results
    const filtered: OutItem[] = []
    const seen = new Set<string>()
    
    for (const r of raw) {
      if (!r.link || !r.title) continue
      
      const url = toHomepage(r.link)
      const h = hostname(url)
      
      if (!url || !h || isBlockedHost(h)) {
        console.info('[Discovery] Filtered out:', r.link, '(blocked or invalid)')
        continue
      }
      
      const key = etld1(url)
      if (seen.has(key)) {
        console.info('[Discovery] Filtered out:', url, '(duplicate domain)')
        continue
      }
      
      seen.add(key)
      filtered.push({ 
        url, 
        title: r.title.trim() || h, 
        description: (r.snippet || '').trim() || `Top website for ${q}` 
      })
      
      if (filtered.length >= 10) break // Limit to top 10
    }

    console.info('[Discovery] Final filtered results:', filtered.length)

    if (filtered.length === 0) {
      return { items: [], error: `Found websites for "${q}" but they were filtered out. Try a more specific search term.` }
    }
    
    return { items: filtered }
    
  } catch (e: any) {
    console.error('[Discovery] Search failed:', e.message)
    
    if (e.message.includes('timeout')) {
      return { items: [], error: `Search timed out for "${q}". Please try again.` }
    }
    
    return { items: [], error: `Search failed for "${q}": ${e.message}` }
  }
}

/*
This implementation:
1. Uses REAL Google Custom Search or Brave Search APIs
2. NO hardcoded website lists
3. Searches the actual internet with multiple query variations
4. Handles any niche/topic the user enters
5. Returns real websites found online
6. Proper error handling for API failures
7. Deduplication and filtering of results

To use: Set GOOGLE_API_KEY + GOOGLE_CSE_ID or BRAVE_SEARCH_KEY in your .env file
*/