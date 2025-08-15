import { env } from '@/lib/env'

export interface PageSpeedResult {
  performanceScore: number // 0-1 normalized
  error?: string
}

export interface PageSpeedInsightsResponse {
  lighthouseResult?: {
    categories?: {
      performance?: { score: number }
    }
  }
  error?: {
    message: string
  }
}

/**
 * Get mobile performance score from PageSpeed Insights
 * Returns normalized score 0-1
 */
export async function getPerformanceScore(origin: string): Promise<PageSpeedResult> {
  const apiUrl = new URL('https://www.googleapis.com/pagespeedonline/v5/runPagespeed')
  apiUrl.searchParams.set('url', origin)
  apiUrl.searchParams.set('key', env.GOOGLE_PAGESPEED_API_KEY)
  apiUrl.searchParams.set('strategy', 'mobile')
  apiUrl.searchParams.set('category', 'performance')

  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 15000) // 15s timeout

    const response = await fetch(apiUrl.toString(), {
      headers: {
        'Accept': 'application/json',
      },
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      throw new Error(`PageSpeed API error: ${response.status} ${response.statusText}`)
    }

    const data: PageSpeedInsightsResponse = await response.json()
    
    if (data.error) {
      throw new Error(data.error.message)
    }

    const performanceScore = data.lighthouseResult?.categories?.performance?.score || 0
    
    return {
      performanceScore: Math.max(0, Math.min(1, performanceScore)) // Clamp to 0-1
    }

  } catch (error) {
    console.error(`PageSpeed error for ${origin}:`, error)
    
    // Return 0 on any error (timeout, API error, etc.)
    return {
      performanceScore: 0,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}