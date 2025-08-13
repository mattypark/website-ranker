import { env } from '@/lib/env'

export interface PageRankResult {
  pageRank: number
  domainRank: number
  backlinks: number
  domainAuthority: number
}

export interface OpenPageRankResponse {
  status_code: number
  error?: string
  response?: Array<{
    domain: string
    page_rank_integer: number
    page_rank_decimal: number
    rank: number
  }>
}

/**
 * Get PageRank data from Open PageRank API
 */
export async function getPageRank(url: string): Promise<PageRankResult> {
  const domain = new URL(url).hostname.replace('www.', '')
  
  const apiUrl = new URL('https://openpagerank.com/api/v1.0/getPageRank')
  apiUrl.searchParams.set('domains[]', domain)

  try {
    const response = await fetch(apiUrl.toString(), {
      headers: {
        'API-OPR': env.OPEN_PAGERANK_API_KEY,
        'Accept': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`Open PageRank API error: ${response.status} ${response.statusText}`)
    }

    const data: OpenPageRankResponse = await response.json()

    if (data.status_code !== 200) {
      throw new Error(`Open PageRank API error: ${data.error || 'Unknown error'}`)
    }

    if (!data.response || data.response.length === 0) {
      // Return default values if no data found
      return {
        pageRank: 0,
        domainRank: 0,
        backlinks: 0,
        domainAuthority: 0,
      }
    }

    const result = data.response[0]
    
    // Convert PageRank to 0-10 scale and estimate other metrics
    const pageRank = result.page_rank_decimal || 0
    const domainRank = result.rank || 0
    
    // Estimate domain authority based on PageRank (0-100 scale)
    const domainAuthority = Math.min(100, Math.max(0, Math.round(pageRank * 10)))
    
    // Estimate backlinks based on PageRank (rough approximation)
    const backlinks = Math.round(Math.pow(10, pageRank))

    return {
      pageRank,
      domainRank,
      backlinks,
      domainAuthority,
    }

  } catch (error) {
    console.error('Error fetching PageRank data:', error)
    
    // Return default values on error
    return {
      pageRank: 0,
      domainRank: 0,
      backlinks: 0,
      domainAuthority: 0,
    }
  }
}

/**
 * Get PageRank data for multiple domains
 */
export async function getBulkPageRank(urls: string[]): Promise<Map<string, PageRankResult>> {
  const domains = urls.map(url => new URL(url).hostname.replace('www.', ''))
  const results = new Map<string, PageRankResult>()
  
  // Open PageRank allows up to 100 domains per request
  const batchSize = 100
  
  for (let i = 0; i < domains.length; i += batchSize) {
    const batch = domains.slice(i, i + batchSize)
    
    try {
      const apiUrl = new URL('https://openpagerank.com/api/v1.0/getPageRank')
      batch.forEach(domain => {
        apiUrl.searchParams.append('domains[]', domain)
      })

      const response = await fetch(apiUrl.toString(), {
        headers: {
          'API-OPR': env.OPEN_PAGERANK_API_KEY,
          'Accept': 'application/json',
        },
      })

      if (!response.ok) {
        console.error(`Bulk PageRank API error: ${response.status}`)
        continue
      }

      const data: OpenPageRankResponse = await response.json()

      if (data.status_code === 200 && data.response) {
        data.response.forEach(result => {
          const pageRank = result.page_rank_decimal || 0
          const domainRank = result.rank || 0
          const domainAuthority = Math.min(100, Math.max(0, Math.round(pageRank * 10)))
          const backlinks = Math.round(Math.pow(10, pageRank))

          results.set(result.domain, {
            pageRank,
            domainRank,
            backlinks,
            domainAuthority,
          })
        })
      }

      // Add delay between batches to respect rate limits
      if (i + batchSize < domains.length) {
        await new Promise(resolve => setTimeout(resolve, 1000))
      }

    } catch (error) {
      console.error(`Error fetching bulk PageRank for batch starting at ${i}:`, error)
    }
  }

  // Fill in missing domains with default values
  domains.forEach((domain, index) => {
    if (!results.has(domain)) {
      results.set(domain, {
        pageRank: 0,
        domainRank: 0,
        backlinks: 0,
        domainAuthority: 0,
      })
    }
  })

  return results
}

/**
 * Check API quota and usage
 */
export async function checkPageRankQuota(): Promise<{ remaining: number; limit: number }> {
  try {
    const response = await fetch('https://openpagerank.com/api/v1.0/usage', {
      headers: {
        'API-OPR': env.OPEN_PAGERANK_API_KEY,
        'Accept': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`Quota check error: ${response.status}`)
    }

    const data = await response.json()
    
    return {
      remaining: data.requests_remaining || 0,
      limit: data.requests_limit || 0,
    }

  } catch (error) {
    console.error('Error checking PageRank quota:', error)
    return { remaining: 0, limit: 0 }
  }
}
