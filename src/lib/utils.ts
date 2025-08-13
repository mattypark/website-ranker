import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Canonicalize URL by removing query parameters, fragments, and trailing slashes
 */
export function canonicalizeUrl(url: string): string {
  try {
    const urlObj = new URL(url)
    
    // Remove common tracking parameters
    const paramsToRemove = [
      'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content',
      'fbclid', 'gclid', 'ref', 'source', 'campaign'
    ]
    
    paramsToRemove.forEach(param => {
      urlObj.searchParams.delete(param)
    })
    
    // Remove fragment
    urlObj.hash = ''
    
    // Remove trailing slash unless it's the root path
    if (urlObj.pathname !== '/' && urlObj.pathname.endsWith('/')) {
      urlObj.pathname = urlObj.pathname.slice(0, -1)
    }
    
    // Ensure https
    if (urlObj.protocol === 'http:') {
      urlObj.protocol = 'https:'
    }
    
    return urlObj.toString()
  } catch (error) {
    console.error('Error canonicalizing URL:', error)
    return url
  }
}

/**
 * Extract domain from URL
 */
export function extractDomain(url: string): string {
  try {
    const urlObj = new URL(url)
    return urlObj.hostname
  } catch (error) {
    console.error('Error extracting domain:', error)
    return url
  }
}

/**
 * Parse robots.txt content (mocked for MVP)
 * TODO: Replace with actual robots.txt parsing logic
 */
export async function parseRobotsTxt(url: string): Promise<{
  allowsCrawling: boolean
  crawlDelay?: number
  sitemap?: string[]
}> {
  try {
    const domain = extractDomain(url)
    const robotsUrl = `https://${domain}/robots.txt`
    
    // TODO: Implement actual robots.txt fetching and parsing
    // For MVP, return mock data
    return {
      allowsCrawling: true,
      crawlDelay: 1,
      sitemap: [`https://${domain}/sitemap.xml`]
    }
  } catch (error) {
    console.error('Error parsing robots.txt:', error)
    return {
      allowsCrawling: true
    }
  }
}

/**
 * Extract last modified date from website (mocked for MVP)
 * TODO: Replace with actual last-modified header parsing or content analysis
 */
export async function extractLastModified(url: string): Promise<Date | null> {
  try {
    // TODO: Implement actual last-modified extraction
    // This could involve:
    // 1. Checking Last-Modified header
    // 2. Looking for <meta> tags with dates
    // 3. Analyzing content for publication dates
    // 4. Checking sitemap.xml for lastmod entries
    
    // For MVP, return a mock recent date
    const mockDate = new Date()
    mockDate.setDate(mockDate.getDate() - Math.floor(Math.random() * 30))
    return mockDate
  } catch (error) {
    console.error('Error extracting last modified date:', error)
    return null
  }
}

/**
 * Calculate freshness score based on last modified date
 */
export function calculateFreshnessScore(lastModified: Date | null): number {
  if (!lastModified) return 0
  
  const now = new Date()
  const daysSinceUpdate = (now.getTime() - lastModified.getTime()) / (1000 * 60 * 60 * 24)
  
  // Score decreases as content gets older
  // 100 for content updated today, decreasing to 0 for content older than 365 days
  if (daysSinceUpdate <= 1) return 100
  if (daysSinceUpdate <= 7) return 90
  if (daysSinceUpdate <= 30) return 75
  if (daysSinceUpdate <= 90) return 50
  if (daysSinceUpdate <= 180) return 25
  if (daysSinceUpdate <= 365) return 10
  
  return 0
}

/**
 * Generate favicon URL from domain
 */
export function getFaviconUrl(url: string): string {
  try {
    const domain = extractDomain(url)
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`
  } catch (error) {
    console.error('Error generating favicon URL:', error)
    return '/favicon.ico'
  }
}

/**
 * Validate URL format
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

/**
 * Sleep utility for rate limiting
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Deduplicate URLs by canonical form
 */
export function deduplicateUrls(urls: string[]): string[] {
  const canonical = new Set<string>()
  const result: string[] = []
  
  for (const url of urls) {
    const canonicalUrl = canonicalizeUrl(url)
    if (!canonical.has(canonicalUrl)) {
      canonical.add(canonicalUrl)
      result.push(canonicalUrl)
    }
  }
  
  return result
}
