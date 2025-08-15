import { getPerformanceScore } from './google-pagespeed'
import { getAuthorityScore } from './open-pagerank'
import { analyzeSite } from './site-analyzer'

export interface SiteScoreComponents {
  search: number      // 0-100 (search presence)
  performance: number // 0-100 (PageSpeed score)
  authority: number   // 0-100 (OpenPageRank score)
  freshness: number   // 0-100 (content freshness)
  usability: number   // 0-100 (HTTPS, mobile, etc.)
}

export interface ScoredSite {
  url: string
  title?: string
  description?: string
  score: number // Total weighted score 0-100
  components: SiteScoreComponents
}

/**
 * Score a website comprehensively with fail-soft behavior
 */
export async function scoreSite(
  origin: string, 
  searchRank: number
): Promise<ScoredSite> {
  console.info('[score] Starting analysis for:', origin)
  
  let psiOk = false
  let oprOk = false
  let siteOk = false
  
  // Initialize with defaults (fail-soft)
  let performanceScore = 0
  let authorityScore = 0
  let title: string | undefined
  let description: string | undefined
  let usabilityScore = 0
  
  try {
    // Get basic site info with timeout
    const siteInfo = await Promise.race([
      analyzeSite(origin),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Site analysis timeout')), 10000))
    ]) as any
    
    title = siteInfo.title
    description = siteInfo.description
    usabilityScore = (siteInfo.usabilityScore || 0) * 100
    siteOk = true
  } catch (error) {
    console.warn('[fallback] Site analysis failed for', origin, error instanceof Error ? error.message : 'unknown')
  }

  try {
    // Get PageSpeed score with timeout
    const psiResult = await Promise.race([
      getPerformanceScore(origin),
      new Promise((_, reject) => setTimeout(() => reject(new Error('PSI timeout')), 15000))
    ]) as any
    
    performanceScore = (psiResult.performanceScore || 0) * 100
    psiOk = true
  } catch (error) {
    console.warn('[fallback] PageSpeed failed for', origin, error instanceof Error ? error.message : 'unknown')
  }

  try {
    // Get authority score with timeout
    const oprResult = await Promise.race([
      getAuthorityScore(origin),
      new Promise((_, reject) => setTimeout(() => reject(new Error('OPR timeout')), 10000))
    ]) as any
    
    authorityScore = (oprResult.authorityScore || 0) * 100
    oprOk = true
  } catch (error) {
    console.warn('[fallback] OpenPageRank failed for', origin, error instanceof Error ? error.message : 'unknown')
  }

  // Calculate search presence score (based on rank position)
  const searchScore = Math.max(0, 100 - (searchRank - 1) * 10)
  
  // Calculate freshness score (simplified - could be enhanced)
  const freshnessScore = 75 // Default reasonable score
  
  // Create components
  const components: SiteScoreComponents = {
    search: Math.round(searchScore),
    performance: Math.round(performanceScore),
    authority: Math.round(authorityScore),
    freshness: Math.round(freshnessScore),
    usability: Math.round(usabilityScore)
  }
  
  // Calculate weighted total score
  // Search: 40%, Performance: 25%, Authority: 15%, Freshness: 10%, Usability: 10%
  const totalScore = Math.round(
    components.search * 0.40 +
    components.performance * 0.25 +
    components.authority * 0.15 +
    components.freshness * 0.10 +
    components.usability * 0.10
  )

  console.info('[score]', origin, { 
    psiOk, 
    oprOk, 
    siteOk,
    score: totalScore,
    components 
  })

  return {
    url: origin,
    title: title || new URL(origin).hostname,
    description: description || `Website for ${new URL(origin).hostname}`,
    score: totalScore,
    components
  }
}

/**
 * Score multiple sites in parallel with controlled concurrency
 */
export async function scoreMultipleSites(origins: string[]): Promise<ScoredSite[]> {
  const results: ScoredSite[] = []
  
  // Process in batches to avoid overwhelming APIs
  const batchSize = 3
  for (let i = 0; i < origins.length; i += batchSize) {
    const batch = origins.slice(i, i + batchSize)
    
    const batchResults = await Promise.all(
      batch.map((origin, index) => 
        scoreSite(origin, i + index + 1).catch(error => {
          console.error('[score] Failed to score', origin, error)
          // Return minimal result even on complete failure
          return {
            url: origin,
            title: new URL(origin).hostname,
            description: `Website for ${new URL(origin).hostname}`,
            score: 30, // Minimal default score
            components: {
              search: Math.max(0, 100 - (i + index) * 10),
              performance: 0,
              authority: 0,
              freshness: 50,
              usability: 0
            }
          }
        })
      )
    )
    
    results.push(...batchResults)
    
    // Small delay between batches
    if (i + batchSize < origins.length) {
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
  }
  
  return results
}
