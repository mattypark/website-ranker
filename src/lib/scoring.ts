import { ComprehensiveSiteAnalysis } from './services/site-analyzer'

export interface SiteScoreBreakdown {
  searchPresenceScore: number
  performanceScore: number
  backlinkAuthorityScore: number
  freshnessScore: number
  usabilityScore: number
  totalScore: number
  breakdown: {
    searchPresence: {
      score: number
      weight: number
      details: {
        searchResults: number
        searchRank: number | null
        searchResultsScore: number
        searchRankScore: number
      }
    }
    performance: {
      score: number
      weight: number
      details: {
        performanceScore: number
        loadTimeScore: number
        coreWebVitalsScore: number
        pageSizeScore: number
      }
    }
    backlinkAuthority: {
      score: number
      weight: number
      details: {
        pageRankScore: number
        domainAuthorityScore: number
        backlinksScore: number
      }
    }
    freshness: {
      score: number
      weight: number
      details: {
        contentAgeScore: number
        lastModifiedScore: number
      }
    }
    usability: {
      score: number
      weight: number
      details: {
        mobileScore: number
        accessibilityScore: number
        seoScore: number
        httpsScore: number
        technicalScore: number
      }
    }
  }
}

// Scoring weights as specified: 40% + 25% + 15% + 10% + 10% = 100%
const SCORING_WEIGHTS = {
  searchPresence: 0.40,    // 40% - Search visibility and ranking
  performance: 0.25,       // 25% - Site performance and speed
  backlinkAuthority: 0.15, // 15% - Domain authority and backlinks
  freshness: 0.10,         // 10% - Content freshness and updates
  usability: 0.10,         // 10% - Mobile, accessibility, SEO
} as const

/**
 * Calculate search presence score based on search results and ranking
 */
function calculateSearchPresenceScore(analysis: ComprehensiveSiteAnalysis) {
  const searchResults = analysis.searchResults || 0
  const searchRank = analysis.searchRank

  // Score based on number of indexed pages (logarithmic scale)
  const searchResultsScore = Math.min(100, Math.log10(searchResults + 1) * 25)
  
  // Score based on search ranking position (inverse relationship)
  let searchRankScore = 0
  if (searchRank !== null && searchRank > 0) {
    searchRankScore = Math.max(0, 100 - (searchRank - 1) * 10) // 100 for rank 1, decreasing by 10 per position
  }

  // Weighted combination
  const score = Math.round(searchResultsScore * 0.6 + searchRankScore * 0.4)

  return {
    score,
    details: {
      searchResults,
      searchRank,
      searchResultsScore: Math.round(searchResultsScore),
      searchRankScore: Math.round(searchRankScore),
    }
  }
}

/**
 * Calculate performance score based on PageSpeed metrics
 */
function calculatePerformanceScore(analysis: ComprehensiveSiteAnalysis) {
  const performanceScore = analysis.performanceScore || 0
  
  // Load time score (penalty for slow loading)
  const loadTimeScore = Math.max(0, 100 - Math.max(0, (analysis.loadTime - 2) * 20))
  
  // Core Web Vitals score
  const fcpScore = Math.max(0, 100 - Math.max(0, (analysis.firstContentfulPaint - 1.5) * 30))
  const lcpScore = Math.max(0, 100 - Math.max(0, (analysis.largestContentfulPaint - 2.5) * 25))
  const clsScore = Math.max(0, 100 - (analysis.cumulativeLayoutShift * 400))
  const coreWebVitalsScore = (fcpScore + lcpScore + clsScore) / 3
  
  // Page size score (penalty for large pages)
  const pageSizeScore = Math.max(0, 100 - Math.max(0, (analysis.pageSize - 1000) * 0.01))

  // Weighted combination
  const score = Math.round(
    performanceScore * 0.5 +
    loadTimeScore * 0.2 +
    coreWebVitalsScore * 0.2 +
    pageSizeScore * 0.1
  )

  return {
    score,
    details: {
      performanceScore: Math.round(performanceScore),
      loadTimeScore: Math.round(loadTimeScore),
      coreWebVitalsScore: Math.round(coreWebVitalsScore),
      pageSizeScore: Math.round(pageSizeScore),
    }
  }
}

/**
 * Calculate backlink authority score
 */
function calculateBacklinkAuthorityScore(analysis: ComprehensiveSiteAnalysis) {
  const pageRankScore = (analysis.pageRank || 0) * 10 // Convert 0-10 to 0-100
  const domainAuthorityScore = analysis.domainAuthority || 0
  const backlinksScore = Math.min(100, Math.log10((analysis.backlinks || 0) + 1) * 20)

  // Weighted combination
  const score = Math.round(
    pageRankScore * 0.4 +
    domainAuthorityScore * 0.4 +
    backlinksScore * 0.2
  )

  return {
    score,
    details: {
      pageRankScore: Math.round(pageRankScore),
      domainAuthorityScore: Math.round(domainAuthorityScore),
      backlinksScore: Math.round(backlinksScore),
    }
  }
}

/**
 * Calculate freshness score based on content age
 */
function calculateFreshnessScore(analysis: ComprehensiveSiteAnalysis) {
  const contentAge = analysis.contentAge
  const lastModified = analysis.lastModified

  let contentAgeScore = 0
  if (contentAge !== null) {
    // Score decreases with age
    if (contentAge <= 7) contentAgeScore = 100      // Updated within a week
    else if (contentAge <= 30) contentAgeScore = 80  // Updated within a month
    else if (contentAge <= 90) contentAgeScore = 60  // Updated within 3 months
    else if (contentAge <= 180) contentAgeScore = 40 // Updated within 6 months
    else if (contentAge <= 365) contentAgeScore = 20 // Updated within a year
    else contentAgeScore = 0                          // Older than a year
  }

  const lastModifiedScore = lastModified ? 100 : 0 // Bonus for having last-modified info

  // Weighted combination
  const score = Math.round(contentAgeScore * 0.8 + lastModifiedScore * 0.2)

  return {
    score,
    details: {
      contentAgeScore,
      lastModifiedScore,
    }
  }
}

/**
 * Calculate usability score based on mobile, accessibility, SEO, etc.
 */
function calculateUsabilityScore(analysis: ComprehensiveSiteAnalysis) {
  const mobileScore = analysis.mobileOptimized ? 100 : 0
  const accessibilityScore = analysis.accessibilityScore || 0
  const seoScore = analysis.seoScore || 0
  const httpsScore = analysis.httpsEnabled ? 100 : 0
  
  // Technical features score
  let technicalScore = 0
  if (analysis.hasRobotsTxt) technicalScore += 25
  if (analysis.hasSitemap) technicalScore += 25
  if (analysis.statusCode === 200) technicalScore += 50

  // Weighted combination
  const score = Math.round(
    mobileScore * 0.25 +
    accessibilityScore * 0.25 +
    seoScore * 0.25 +
    httpsScore * 0.15 +
    technicalScore * 0.10
  )

  return {
    score,
    details: {
      mobileScore,
      accessibilityScore: Math.round(accessibilityScore),
      seoScore: Math.round(seoScore),
      httpsScore,
      technicalScore,
    }
  }
}

/**
 * Calculate comprehensive site score using the specified formula
 */
export function calculateSiteScore(analysis: ComprehensiveSiteAnalysis): SiteScoreBreakdown {
  const searchPresence = calculateSearchPresenceScore(analysis)
  const performance = calculatePerformanceScore(analysis)
  const backlinkAuthority = calculateBacklinkAuthorityScore(analysis)
  const freshness = calculateFreshnessScore(analysis)
  const usability = calculateUsabilityScore(analysis)

  // Calculate weighted total score using the specified formula
  const totalScore = Math.round(
    searchPresence.score * SCORING_WEIGHTS.searchPresence +
    performance.score * SCORING_WEIGHTS.performance +
    backlinkAuthority.score * SCORING_WEIGHTS.backlinkAuthority +
    freshness.score * SCORING_WEIGHTS.freshness +
    usability.score * SCORING_WEIGHTS.usability
  )

  return {
    searchPresenceScore: searchPresence.score,
    performanceScore: performance.score,
    backlinkAuthorityScore: backlinkAuthority.score,
    freshnessScore: freshness.score,
    usabilityScore: usability.score,
    totalScore,
    breakdown: {
      searchPresence: {
        score: searchPresence.score,
        weight: SCORING_WEIGHTS.searchPresence,
        details: searchPresence.details,
      },
      performance: {
        score: performance.score,
        weight: SCORING_WEIGHTS.performance,
        details: performance.details,
      },
      backlinkAuthority: {
        score: backlinkAuthority.score,
        weight: SCORING_WEIGHTS.backlinkAuthority,
        details: backlinkAuthority.details,
      },
      freshness: {
        score: freshness.score,
        weight: SCORING_WEIGHTS.freshness,
        details: freshness.details,
      },
      usability: {
        score: usability.score,
        weight: SCORING_WEIGHTS.usability,
        details: usability.details,
      },
    }
  }
}