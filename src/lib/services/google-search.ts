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

export interface SearchPresenceResult {
  totalResults: number
  searchRank: number | null
  searchResults: SearchResult[]
}

/**
 * Search Google Custom Search for study-related websites
 */
export async function searchStudyWebsites(query: string = 'best study websites online learning education', count: number = 20): Promise<SearchResult[]> {
  const apiUrl = new URL('https://www.googleapis.com/customsearch/v1')
  apiUrl.searchParams.set('key', env.GOOGLE_SEARCH_API_KEY)
  apiUrl.searchParams.set('cx', env.GOOGLE_SEARCH_ENGINE_ID)
  apiUrl.searchParams.set('q', query)
  apiUrl.searchParams.set('num', Math.min(count, 10).toString()) // Max 10 per request
  apiUrl.searchParams.set('safe', 'active')
  apiUrl.searchParams.set('lr', 'lang_en')

  try {
    const response = await fetch(apiUrl.toString(), {
      headers: {
        'Accept': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`Google Search API error: ${response.status} ${response.statusText}`)
    }

    const data: GoogleSearchResponse = await response.json()
    
    if (!data.items || data.items.length === 0) {
      console.warn('No search results found')
      return []
    }

    return data.items.map(item => ({
      title: item.title,
      link: item.link,
      snippet: item.snippet,
      displayLink: item.displayLink
    }))

  } catch (error) {
    console.error('Error searching Google Custom Search:', error)
    throw error
  }
}

/**
 * Check search presence for a specific URL/domain
 */
export async function checkSearchPresence(url: string, searchQuery: string = 'study learning education'): Promise<SearchPresenceResult> {
  const domain = new URL(url).hostname.replace('www.', '')
  const query = `site:${domain} ${searchQuery}`
  
  const apiUrl = new URL('https://www.googleapis.com/customsearch/v1')
  apiUrl.searchParams.set('key', env.GOOGLE_SEARCH_API_KEY)
  apiUrl.searchParams.set('cx', env.GOOGLE_SEARCH_ENGINE_ID)
  apiUrl.searchParams.set('q', query)
  apiUrl.searchParams.set('num', '10')
  apiUrl.searchParams.set('safe', 'active')

  try {
    const response = await fetch(apiUrl.toString())
    
    if (!response.ok) {
      throw new Error(`Search presence API error: ${response.status}`)
    }

    const data: GoogleSearchResponse = await response.json()
    
    const totalResults = parseInt(data.searchInformation?.totalResults || '0')
    const results = data.items || []
    
    // Find the rank of the specific URL in search results
    let searchRank: number | null = null
    for (let i = 0; i < results.length; i++) {
      const resultDomain = new URL(results[i].link).hostname.replace('www.', '')
      if (resultDomain === domain) {
        searchRank = i + 1
        break
      }
    }

    return {
      totalResults,
      searchRank,
      searchResults: results
    }

  } catch (error) {
    console.error('Error checking search presence:', error)
    return {
      totalResults: 0,
      searchRank: null,
      searchResults: []
    }
  }
}

/**
 * Get multiple pages of search results for broader coverage
 */
export async function getExtendedSearchResults(query: string, maxResults: number = 50): Promise<SearchResult[]> {
  const results: SearchResult[] = []
  const maxPages = Math.ceil(maxResults / 10) // 10 results per page max
  
  for (let page = 0; page < maxPages && results.length < maxResults; page++) {
    try {
      const apiUrl = new URL('https://www.googleapis.com/customsearch/v1')
      apiUrl.searchParams.set('key', env.GOOGLE_SEARCH_API_KEY)
      apiUrl.searchParams.set('cx', env.GOOGLE_SEARCH_ENGINE_ID)
      apiUrl.searchParams.set('q', query)
      apiUrl.searchParams.set('num', '10')
      apiUrl.searchParams.set('start', (page * 10 + 1).toString())
      apiUrl.searchParams.set('safe', 'active')
      apiUrl.searchParams.set('lr', 'lang_en')

      const response = await fetch(apiUrl.toString())
      
      if (!response.ok) {
        console.warn(`Search page ${page + 1} failed: ${response.status}`)
        break
      }

      const data: GoogleSearchResponse = await response.json()
      
      if (!data.items || data.items.length === 0) {
        break // No more results
      }

      results.push(...data.items)
      
      // Add delay between requests to respect rate limits
      if (page < maxPages - 1) {
        await new Promise(resolve => setTimeout(resolve, 100))
      }

    } catch (error) {
      console.error(`Error fetching search page ${page + 1}:`, error)
      break
    }
  }

  return results.slice(0, maxResults)
}
