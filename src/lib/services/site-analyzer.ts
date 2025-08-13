import { getPageSpeedInsights, getMobilePageSpeedInsights } from './google-pagespeed'
import { getPageRank } from './open-pagerank'
import { checkSearchPresence } from './google-search'
import { canonicalizeUrl, extractLastModified } from '@/lib/utils'

export interface ComprehensiveSiteAnalysis {
  // Basic info
  url: string
  domain: string
  title: string | null
  metaDescription: string | null
  
  // Performance metrics
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
  
  // Authority metrics
  pageRank: number
  domainRank: number
  domainAuthority: number
  backlinks: number
  
  // Search presence
  searchResults: number
  searchRank: number | null
  
  // Content freshness
  lastModified: Date | null
  contentAge: number | null
  
  // Technical features
  httpsEnabled: boolean
  mobileOptimized: boolean
  hasRobotsTxt: boolean
  hasSitemap: boolean
  statusCode: number
  responseTime: number
  
  // Errors
  errorMessage: string | null
}

/**
 * Perform comprehensive analysis of a website
 */
export async function analyzeSite(url: string): Promise<ComprehensiveSiteAnalysis> {
  const startTime = Date.now()
  const canonicalUrl = canonicalizeUrl(url)
  const domain = new URL(canonicalUrl).hostname.replace('www.', '')
  
  let analysis: Partial<ComprehensiveSiteAnalysis> = {
    url: canonicalUrl,
    domain,
    httpsEnabled: canonicalUrl.startsWith('https://'),
    errorMessage: null,
  }

  try {
    // Fetch basic page info
    const pageInfo = await fetchPageInfo(canonicalUrl)
    analysis = { ...analysis, ...pageInfo }

    // Run all analyses in parallel for better performance
    const [pageSpeedResult, pageRankResult, searchPresenceResult, lastModified] = await Promise.allSettled([
      getPageSpeedInsights(canonicalUrl),
      getPageRank(canonicalUrl),
      checkSearchPresence(canonicalUrl, 'study learning education'),
      extractLastModified(canonicalUrl),
    ])

    // Process PageSpeed results
    if (pageSpeedResult.status === 'fulfilled') {
      const pageSpeed = pageSpeedResult.value
      analysis = {
        ...analysis,
        performanceScore: pageSpeed.performanceScore,
        accessibilityScore: pageSpeed.accessibilityScore,
        bestPracticesScore: pageSpeed.bestPracticesScore,
        seoScore: pageSpeed.seoScore,
        firstContentfulPaint: pageSpeed.firstContentfulPaint,
        largestContentfulPaint: pageSpeed.largestContentfulPaint,
        cumulativeLayoutShift: pageSpeed.cumulativeLayoutShift,
        firstInputDelay: pageSpeed.firstInputDelay,
        totalBlockingTime: pageSpeed.totalBlockingTime,
        speedIndex: pageSpeed.speedIndex,
        loadTime: pageSpeed.loadTime,
        pageSize: pageSpeed.pageSize,
        mobileOptimized: pageSpeed.mobileOptimized,
      }
    } else {
      console.error('PageSpeed analysis failed:', pageSpeedResult.reason)
      // Set default values
      analysis = {
        ...analysis,
        performanceScore: 0,
        accessibilityScore: 0,
        bestPracticesScore: 0,
        seoScore: 0,
        firstContentfulPaint: 0,
        largestContentfulPaint: 0,
        cumulativeLayoutShift: 0,
        firstInputDelay: 0,
        totalBlockingTime: 0,
        speedIndex: 0,
        loadTime: 0,
        pageSize: 0,
        mobileOptimized: false,
      }
    }

    // Process PageRank results
    if (pageRankResult.status === 'fulfilled') {
      const pageRank = pageRankResult.value
      analysis = {
        ...analysis,
        pageRank: pageRank.pageRank,
        domainRank: pageRank.domainRank,
        domainAuthority: pageRank.domainAuthority,
        backlinks: pageRank.backlinks,
      }
    } else {
      console.error('PageRank analysis failed:', pageRankResult.reason)
      analysis = {
        ...analysis,
        pageRank: 0,
        domainRank: 0,
        domainAuthority: 0,
        backlinks: 0,
      }
    }

    // Process search presence results
    if (searchPresenceResult.status === 'fulfilled') {
      const searchPresence = searchPresenceResult.value
      analysis = {
        ...analysis,
        searchResults: searchPresence.totalResults,
        searchRank: searchPresence.searchRank,
      }
    } else {
      console.error('Search presence analysis failed:', searchPresenceResult.reason)
      analysis = {
        ...analysis,
        searchResults: 0,
        searchRank: null,
      }
    }

    // Process last modified date
    if (lastModified.status === 'fulfilled' && lastModified.value) {
      const lastModDate = lastModified.value
      const contentAge = Math.floor((Date.now() - lastModDate.getTime()) / (1000 * 60 * 60 * 24))
      analysis = {
        ...analysis,
        lastModified: lastModDate,
        contentAge,
      }
    } else {
      analysis = {
        ...analysis,
        lastModified: null,
        contentAge: null,
      }
    }

    // Check for robots.txt and sitemap
    const [robotsCheck, sitemapCheck] = await Promise.allSettled([
      checkRobotsTxt(canonicalUrl),
      checkSitemap(canonicalUrl),
    ])

    analysis.hasRobotsTxt = robotsCheck.status === 'fulfilled' ? robotsCheck.value : false
    analysis.hasSitemap = sitemapCheck.status === 'fulfilled' ? sitemapCheck.value : false

  } catch (error) {
    console.error(`Error analyzing site ${canonicalUrl}:`, error)
    analysis.errorMessage = error instanceof Error ? error.message : 'Unknown error'
  }

  analysis.responseTime = Date.now() - startTime

  return analysis as ComprehensiveSiteAnalysis
}

/**
 * Fetch basic page information
 */
async function fetchPageInfo(url: string): Promise<{
  title: string | null
  metaDescription: string | null
  statusCode: number
}> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'StudyRank Bot 1.0 (Website Analyzer)',
      },
    })

    const html = await response.text()
    
    // Extract title
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i)
    const title = titleMatch ? titleMatch[1].trim() : null

    // Extract meta description
    const metaMatch = html.match(/<meta[^>]*name="description"[^>]*content="([^"]*)"[^>]*>/i)
    const metaDescription = metaMatch ? metaMatch[1].trim() : null

    return {
      title,
      metaDescription,
      statusCode: response.status,
    }
  } catch (error) {
    console.error(`Error fetching page info for ${url}:`, error)
    return {
      title: null,
      metaDescription: null,
      statusCode: 0,
    }
  }
}

/**
 * Check if robots.txt exists
 */
async function checkRobotsTxt(url: string): Promise<boolean> {
  try {
    const domain = new URL(url).origin
    const robotsUrl = `${domain}/robots.txt`
    
    const response = await fetch(robotsUrl, { method: 'HEAD' })
    return response.ok
  } catch {
    return false
  }
}

/**
 * Check if sitemap exists
 */
async function checkSitemap(url: string): Promise<boolean> {
  try {
    const domain = new URL(url).origin
    const sitemapUrls = [
      `${domain}/sitemap.xml`,
      `${domain}/sitemap_index.xml`,
      `${domain}/sitemap.txt`,
    ]
    
    for (const sitemapUrl of sitemapUrls) {
      try {
        const response = await fetch(sitemapUrl, { method: 'HEAD' })
        if (response.ok) return true
      } catch {
        continue
      }
    }
    
    return false
  } catch {
    return false
  }
}
