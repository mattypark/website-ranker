import { env } from '@/lib/env'

export interface PageSpeedResult {
  performanceScore: number
  accessibilityScore: number
  bestPracticesScore: number
  seoScore: number
  firstContentfulPaint: number
  largestContentfulPaint: number
  cumulativeLayoutShift: number
  firstInputDelay: number
  totalBlockingTime: number
  speedIndex: number
  loadTime: number
  pageSize: number
  mobileOptimized: boolean
}

export interface PageSpeedInsightsResponse {
  lighthouseResult: {
    categories: {
      performance: { score: number }
      accessibility: { score: number }
      'best-practices': { score: number }
      seo: { score: number }
    }
    audits: {
      'first-contentful-paint': { numericValue: number }
      'largest-contentful-paint': { numericValue: number }
      'cumulative-layout-shift': { numericValue: number }
      'first-input-delay': { numericValue: number }
      'total-blocking-time': { numericValue: number }
      'speed-index': { numericValue: number }
      'interactive': { numericValue: number }
      'total-byte-weight': { numericValue: number }
    }
  }
  loadingExperience?: {
    overall_category: string
  }
}

/**
 * Get PageSpeed Insights data for a URL
 */
export async function getPageSpeedInsights(url: string): Promise<PageSpeedResult> {
  const apiUrl = new URL('https://www.googleapis.com/pagespeedonline/v5/runPagespeed')
  apiUrl.searchParams.set('url', url)
  apiUrl.searchParams.set('key', env.GOOGLE_PAGESPEED_API_KEY)
  apiUrl.searchParams.set('strategy', 'desktop')
  apiUrl.searchParams.set('category', 'performance')
  apiUrl.searchParams.set('category', 'accessibility')
  apiUrl.searchParams.set('category', 'best-practices')
  apiUrl.searchParams.set('category', 'seo')

  try {
    const response = await fetch(apiUrl.toString(), {
      headers: {
        'Accept': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`PageSpeed API error: ${response.status} ${response.statusText}`)
    }

    const data: PageSpeedInsightsResponse = await response.json()
    const lighthouse = data.lighthouseResult

    return {
      performanceScore: Math.round((lighthouse.categories.performance?.score || 0) * 100),
      accessibilityScore: Math.round((lighthouse.categories.accessibility?.score || 0) * 100),
      bestPracticesScore: Math.round((lighthouse.categories['best-practices']?.score || 0) * 100),
      seoScore: Math.round((lighthouse.categories.seo?.score || 0) * 100),
      
      // Core Web Vitals (convert from milliseconds to seconds where needed)
      firstContentfulPaint: (lighthouse.audits['first-contentful-paint']?.numericValue || 0) / 1000,
      largestContentfulPaint: (lighthouse.audits['largest-contentful-paint']?.numericValue || 0) / 1000,
      cumulativeLayoutShift: lighthouse.audits['cumulative-layout-shift']?.numericValue || 0,
      firstInputDelay: (lighthouse.audits['first-input-delay']?.numericValue || 0) / 1000,
      totalBlockingTime: (lighthouse.audits['total-blocking-time']?.numericValue || 0) / 1000,
      speedIndex: (lighthouse.audits['speed-index']?.numericValue || 0) / 1000,
      
      // Additional metrics
      loadTime: (lighthouse.audits['interactive']?.numericValue || 0) / 1000,
      pageSize: (lighthouse.audits['total-byte-weight']?.numericValue || 0) / 1024, // Convert to KB
      mobileOptimized: data.loadingExperience?.overall_category !== 'SLOW',
    }
  } catch (error) {
    console.error('Error fetching PageSpeed Insights:', error)
    throw error
  }
}

/**
 * Get mobile PageSpeed Insights data
 */
export async function getMobilePageSpeedInsights(url: string): Promise<Partial<PageSpeedResult>> {
  const apiUrl = new URL('https://www.googleapis.com/pagespeedonline/v5/runPagespeed')
  apiUrl.searchParams.set('url', url)
  apiUrl.searchParams.set('key', env.GOOGLE_PAGESPEED_API_KEY)
  apiUrl.searchParams.set('strategy', 'mobile')
  apiUrl.searchParams.set('category', 'performance')

  try {
    const response = await fetch(apiUrl.toString())
    
    if (!response.ok) {
      throw new Error(`Mobile PageSpeed API error: ${response.status}`)
    }

    const data: PageSpeedInsightsResponse = await response.json()
    const lighthouse = data.lighthouseResult

    return {
      performanceScore: Math.round((lighthouse.categories.performance?.score || 0) * 100),
      mobileOptimized: data.loadingExperience?.overall_category !== 'SLOW',
    }
  } catch (error) {
    console.error('Error fetching mobile PageSpeed Insights:', error)
    return { mobileOptimized: false }
  }
}
