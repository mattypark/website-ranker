import { env } from '@/lib/env'

export interface PageRankResult {
  authorityScore: number // 0-1 normalized
  error?: string
}

export interface OpenPageRankResponse {
  status_code: number
  error?: string
  response?: Array<{
    domain: string
    page_rank_decimal: number
    rank: number
  }>
}

/**
 * Get authority score from Open PageRank API
 * Returns normalized score 0-1 (PageRank 0-10 normalized)
 */
export async function getAuthorityScore(origin: string): Promise<PageRankResult> {
  try {
    const url = new URL(origin)
    const domain = url.hostname.replace('www.', '')
    
    const apiUrl = new URL('https://openpagerank.com/api/v1.0/getPageRank')
    apiUrl.searchParams.set('domains[]', domain)

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000) // 10s timeout

    const response = await fetch(apiUrl.toString(), {
      headers: {
        'API-OPR': env.OPEN_PAGERANK_API_KEY,
        'Accept': 'application/json',
      },
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      throw new Error(`Open PageRank API error: ${response.status} ${response.statusText}`)
    }

    const data: OpenPageRankResponse = await response.json()

    if (data.status_code !== 200) {
      throw new Error(`Open PageRank API error: ${data.error || 'Unknown error'}`)
    }

    if (!data.response || data.response.length === 0) {
      return { authorityScore: 0 }
    }

    const result = data.response[0]
    const pageRank = result.page_rank_decimal || 0
    
    // Normalize PageRank from 0-10 scale to 0-1 scale
    const normalizedScore = Math.max(0, Math.min(1, pageRank / 10))
    
    return {
      authorityScore: normalizedScore
    }

  } catch (error) {
    console.error(`PageRank error for ${origin}:`, error)
    
    // Return 0 on any error (timeout, API error, etc.)
    return {
      authorityScore: 0,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}