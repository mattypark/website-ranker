// Analysis data interface for scoring calculations
interface ComprehensiveSiteAnalysis {
  searchResults?: number
  searchRank?: number | null
  performanceScore?: number
  pageRank?: number
  domainAuthority?: number
  contentAge?: number
  lastModified?: Date
  mobileOptimized?: boolean
  accessibilityScore?: number
  seoScore?: number
  hasHttps?: boolean
  loadTime?: number
}

export interface SiteScoreBreakdown {
  searchPresenceScore: number
  performanceScore: number
  backlinkAuthorityScore: number
  freshnessScore: number
  usabilityScore: number
  totalScore: number
}

/**
 * Calculate search presence score based on search results and ranking
 */
function calculateSearchPresenceScore(analysis: ComprehensiveSiteAnalysis) {
  const searchResults = analysis.searchResults || 0
  const searchRank = analysis.searchRank
  
  // Base score from number of search results
  let searchResultsScore = 0
  if (searchResults > 0) {
    searchResultsScore = Math.min(100, Math.log10(searchResults) * 20)
  }
  
  // Score based on search ranking position (inverse relationship)
  let searchRankScore = 0
  if (searchRank !== null && searchRank !== undefined && searchRank > 0) {
    searchRankScore = Math.max(0, 100 - (searchRank - 1) * 10)
  }
  
  // Combine both metrics (70% ranking, 30% total results)
  const combinedScore = (searchRankScore * 0.7) + (searchResultsScore * 0.3)
  
  return Math.round(Math.max(0, Math.min(100, combinedScore)))
}

/**
 * Calculate performance score based on PageSpeed metrics
 */
function calculatePerformanceScore(analysis: ComprehensiveSiteAnalysis) {
  const performanceScore = analysis.performanceScore || 0
  let score = performanceScore
  
  if (analysis.loadTime) {
    const loadTimePenalty = Math.max(0, (analysis.loadTime - 2) * 10)
    score = Math.max(0, score - loadTimePenalty)
  }
  
  return Math.round(Math.max(0, Math.min(100, score)))
}

/**
 * Calculate backlink authority score
 */
function calculateBacklinkAuthorityScore(analysis: ComprehensiveSiteAnalysis) {
  const pageRankScore = (analysis.pageRank || 0) * 10
  const domainAuthorityScore = analysis.domainAuthority || 0
  
  const combinedScore = (pageRankScore * 0.6) + (domainAuthorityScore * 0.4)
  
  return Math.round(Math.max(0, Math.min(100, combinedScore)))
}

/**
 * Calculate freshness score based on content age
 */
function calculateFreshnessScore(analysis: ComprehensiveSiteAnalysis) {
  const contentAge = analysis.contentAge
  const lastModified = analysis.lastModified
  
  let score = 50
  
  if (contentAge !== undefined) {
    if (contentAge <= 30) {
      score = 100 - (contentAge * 1.5)
    } else if (contentAge <= 365) {
      score = 55 - ((contentAge - 30) * 0.1)
    } else {
      score = 20
    }
  } else if (lastModified) {
    const daysSinceModified = (Date.now() - lastModified.getTime()) / (1000 * 60 * 60 * 24)
    if (daysSinceModified <= 30) {
      score = 100 - (daysSinceModified * 1.5)
    } else if (daysSinceModified <= 365) {
      score = 55 - ((daysSinceModified - 30) * 0.1)
    } else {
      score = 20
    }
  }
  
  return Math.round(Math.max(0, Math.min(100, score)))
}

/**
 * Calculate usability score based on mobile, accessibility, SEO, etc.
 */
function calculateUsabilityScore(analysis: ComprehensiveSiteAnalysis) {
  const mobileScore = analysis.mobileOptimized ? 100 : 0
  const accessibilityScore = analysis.accessibilityScore || 0
  const seoScore = analysis.seoScore || 0
  const httpsBonus = analysis.hasHttps ? 100 : 0
  
  const combinedScore = (
    (mobileScore * 0.4) +
    (accessibilityScore * 0.25) +
    (seoScore * 0.25) +
    (httpsBonus * 0.1)
  )
  
  return Math.round(Math.max(0, Math.min(100, combinedScore)))
}

/**
 * Calculate comprehensive site score using the specified formula
 */
export function calculateSiteScore(analysis: ComprehensiveSiteAnalysis): SiteScoreBreakdown {
  const searchPresence = calculateSearchPresenceScore(analysis)
  const performance = calculatePerformanceScore(analysis)
  const authority = calculateBacklinkAuthorityScore(analysis)
  const freshness = calculateFreshnessScore(analysis)
  const usability = calculateUsabilityScore(analysis)
  
  const totalScore = Math.round(
    (searchPresence * 0.30) +
    (performance * 0.25) +
    (authority * 0.20) +
    (freshness * 0.15) +
    (usability * 0.10)
  )
  
  return {
    searchPresenceScore: searchPresence,
    performanceScore: performance,
    backlinkAuthorityScore: authority,
    freshnessScore: freshness,
    usabilityScore: usability,
    totalScore: Math.max(0, Math.min(100, totalScore))
  }
}
