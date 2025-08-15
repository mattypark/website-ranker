export interface SiteAnalysis {
  title: string | null
  description: string | null
  favicon: string | null
  hasHttps: boolean
  hasViewport: boolean
  hasOgTags: boolean
  usabilityScore: number // 0-1 normalized
  freshnessScore: number // 0-1 normalized
  error?: string
}

/**
 * Analyze a site for usability and freshness factors
 * Performs cheap checks only - no expensive operations
 */
export async function analyzeSite(origin: string): Promise<SiteAnalysis> {
  try {
    const url = new URL(origin)
    
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000) // 10s timeout

    const response = await fetch(origin, {
      headers: {
        'User-Agent': 'NicheRank Bot 1.0 (+https://nicherank.com)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      },
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

    const html = await response.text()
    
    // Extract basic info
    const title = extractTitle(html)
    const description = extractMetaDescription(html)
    const favicon = generateFaviconUrl(url.hostname)
    
    // Check usability factors
    const hasHttps = origin.startsWith('https://')
    const hasViewport = html.includes('name="viewport"') || html.includes("name='viewport'")
    const hasOgTags = html.includes('property="og:') || html.includes("property='og:")
    
    // Calculate usability score (0-1)
    let usabilityScore = 0
    if (hasHttps) usabilityScore += 0.4      // 40% for HTTPS
    if (hasViewport) usabilityScore += 0.3   // 30% for mobile viewport
    if (hasOgTags) usabilityScore += 0.3     // 30% for social meta tags
    
    // Calculate freshness score (simplified)
    const freshnessScore = calculateFreshnessScore(html, response.headers)
    
    return {
      title,
      description,
      favicon,
      hasHttps,
      hasViewport,
      hasOgTags,
      usabilityScore: Math.max(0, Math.min(1, usabilityScore)),
      freshnessScore: Math.max(0, Math.min(1, freshnessScore)),
    }

  } catch (error) {
    console.error(`Site analysis error for ${origin}:`, error)
    
    // Return minimal data on error
    const url = new URL(origin)
    return {
      title: null,
      description: null,
      favicon: generateFaviconUrl(url.hostname),
      hasHttps: origin.startsWith('https://'),
      hasViewport: false,
      hasOgTags: false,
      usabilityScore: origin.startsWith('https://') ? 0.4 : 0, // At least HTTPS score
      freshnessScore: 0.5, // Default middle score
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Extract page title from HTML
 */
function extractTitle(html: string): string | null {
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i)
  if (titleMatch && titleMatch[1]) {
    return titleMatch[1].trim().slice(0, 100) // Limit length
  }
  return null
}

/**
 * Extract meta description from HTML
 */
function extractMetaDescription(html: string): string | null {
  const metaMatch = html.match(/<meta[^>]*name="description"[^>]*content="([^"]*)"[^>]*>/i) ||
                   html.match(/<meta[^>]*content="([^"]*)"[^>]*name="description"[^>]*>/i)
  
  if (metaMatch && metaMatch[1]) {
    return metaMatch[1].trim().slice(0, 200) // Limit length
  }
  return null
}

/**
 * Generate favicon URL
 */
function generateFaviconUrl(hostname: string): string {
  return `https://www.google.com/s2/favicons?domain=${hostname}&sz=64`
}

/**
 * Calculate freshness score based on various signals
 */
function calculateFreshnessScore(html: string, headers: Headers): number {
  let score = 0.5 // Default middle score
  
  // Check Last-Modified header
  const lastModified = headers.get('last-modified')
  if (lastModified) {
    const lastModDate = new Date(lastModified)
    const daysSince = (Date.now() - lastModDate.getTime()) / (1000 * 60 * 60 * 24)
    
    if (daysSince <= 30) score = 1.0      // Updated within 30 days
    else if (daysSince <= 90) score = 0.8  // Updated within 3 months
    else if (daysSince <= 180) score = 0.6 // Updated within 6 months
    else if (daysSince <= 365) score = 0.4 // Updated within 1 year
    else score = 0.2                       // Older than 1 year
  }
  
  // Check for copyright year (simple heuristic)
  const currentYear = new Date().getFullYear()
  const copyrightMatch = html.match(/copyright[^0-9]*(\d{4})/i)
  if (copyrightMatch) {
    const copyrightYear = parseInt(copyrightMatch[1])
    if (copyrightYear === currentYear) {
      score = Math.max(score, 0.8) // Recent copyright suggests freshness
    } else if (copyrightYear >= currentYear - 1) {
      score = Math.max(score, 0.6) // Last year is still decent
    }
  }
  
  return Math.max(0, Math.min(1, score))
}