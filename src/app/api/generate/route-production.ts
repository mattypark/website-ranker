import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { searchStudyWebsites } from '@/lib/services/google-search'
import { analyzeSite } from '@/lib/services/site-analyzer'
import { calculateSiteScore } from '@/lib/scoring'
import { canonicalizeUrl, deduplicateUrls, getFaviconUrl } from '@/lib/utils'
import type { Prisma } from '@prisma/client';

export async function POST(request: NextRequest) {
  try {
    const { category = 'study', limit = 10 } = await request.json()
    
    // Create a new run
    const run = await prisma.run.create({
      data: {
        status: 'RUNNING',
        category,
        query: `best ${category} websites online learning education`,
      }
    })
    
    console.log(`Starting run ${run.id} for category: ${category}`)
    
    // Step 1: Search for study websites using Google Custom Search
    console.log('Searching for study websites...')
    const searchResults = await searchStudyWebsites(
      `best ${category} websites online learning education platform`,
      30 // Get more results to have options after deduplication
    )
    
    if (searchResults.length === 0) {
      await prisma.run.update({
        where: { id: run.id },
        data: { status: 'FAILED' }
      })
      return NextResponse.json({
        success: false,
        error: 'No study websites found in search results'
      }, { status: 404 })
    }
    
    // Step 2: Extract and deduplicate URLs
    const urls = deduplicateUrls(
      searchResults.map(result => canonicalizeUrl(result.link))
    ).slice(0, 20) // Limit to 20 for analysis to manage API costs
    
    console.log(`Found ${urls.length} unique URLs to analyze`)
    
    // Step 3: Analyze each site and calculate scores
    const siteAnalyses = []
    let processedCount = 0
    
    for (const url of urls) {
      try {
        console.log(`Analyzing ${url}... (${++processedCount}/${urls.length})`)
        
        // Perform comprehensive site analysis
        const analysis = await analyzeSite(url)
        
        // Calculate scores using the specified formula
        const scores = calculateSiteScore(analysis)
        
        // Create or update site record
        const site = await prisma.site.upsert({
          where: { url },
          update: {
            updatedAt: new Date(),
            title: analysis.title,
            metaDescription: analysis.metaDescription,
          },
          create: {
            url,
            domain: analysis.domain,
            name: extractSiteName(analysis.title || url),
            title: analysis.title,
            description: analysis.metaDescription || `A ${category} website offering educational content and resources.`,
            favicon: getFaviconUrl(url),
            category,
            metaDescription: analysis.metaDescription,
            keywords: extractKeywords(analysis.metaDescription || ''),
          }
        })
        
        // Store comprehensive metrics
        await prisma.siteMetric.create({
          data: {
            siteId: site.id,
            runId: run.id,
            
            // Performance metrics
            performanceScore: analysis.performanceScore,
            accessibilityScore: analysis.accessibilityScore,
            bestPracticesScore: analysis.bestPracticesScore,
            seoScore: analysis.seoScore,
            
            // Core Web Vitals
            firstContentfulPaint: analysis.firstContentfulPaint,
            largestContentfulPaint: analysis.largestContentfulPaint,
            cumulativeLayoutShift: analysis.cumulativeLayoutShift,
            firstInputDelay: analysis.firstInputDelay,
            totalBlockingTime: analysis.totalBlockingTime,
            speedIndex: analysis.speedIndex,
            
            // Authority metrics
            pageRank: analysis.pageRank,
            domainRank: analysis.domainRank,
            
            // Search presence
            searchResults: analysis.searchResults,
            searchRank: analysis.searchRank,
            
            // Technical metrics
            loadTime: analysis.loadTime,
            pageSize: analysis.pageSize,
            httpsEnabled: analysis.httpsEnabled,
            mobileOptimized: analysis.mobileOptimized,
            hasRobotsTxt: analysis.hasRobotsTxt,
            hasSitemap: analysis.hasSitemap,
            
            // Content freshness
            lastModified: analysis.lastModified,
            contentAge: analysis.contentAge,
            
            // Response info
            statusCode: analysis.statusCode,
            responseTime: analysis.responseTime,
            errorMessage: analysis.errorMessage,
          }
        })
        
        // Store calculated scores
        await prisma.siteScore.create({
          data: {
            siteId: site.id,
            runId: run.id,
            searchPresenceScore: scores.searchPresenceScore,
            performanceScore: scores.performanceScore,
            backlinkAuthorityScore: scores.backlinkAuthorityScore,
            freshnessScore: scores.freshnessScore,
            usabilityScore: scores.usabilityScore,
            totalScore: scores.totalScore,
            scoreBreakdown: scores.breakdown,
          }
        })
        
        siteAnalyses.push({
          site,
          scores,
          analysis,
        })
        
        console.log(`✓ Analyzed ${url} - Score: ${scores.totalScore}`)
        
        // Add a small delay to be respectful to APIs
        await new Promise(resolve => setTimeout(resolve, 500))
        
      } catch (error) {
        console.error(`Error analyzing ${url}:`, error)
        // Continue with other sites even if one fails
        continue
      }
    }
    
    if (siteAnalyses.length === 0) {
      await prisma.run.update({
        where: { id: run.id },
        data: { status: 'FAILED' }
      })
      return NextResponse.json({
        success: false,
        error: 'Failed to analyze any websites'
      }, { status: 500 })
    }
    
    // Step 4: Sort by total score and get top sites
    siteAnalyses.sort((a, b) => b.scores.totalScore - a.scores.totalScore)
    const topSites = siteAnalyses.slice(0, limit)
    
    // Update ranks in database
    for (let i = 0; i < topSites.length; i++) {
      await prisma.siteScore.updateMany({
        where: {
          siteId: topSites[i].site.id,
          runId: run.id,
        },
        data: {
          rank: i + 1,
        }
      })
    }
    
    // Step 5: Update run status
    await prisma.run.update({
      where: { id: run.id },
      data: {
        status: 'COMPLETED',
        totalSites: siteAnalyses.length,
        completedAt: new Date()
      }
    })
    
    console.log(`✅ Run ${run.id} completed. Analyzed ${siteAnalyses.length} sites, returning top ${topSites.length}.`)
    
    // Return top sites with rankings
    const results = topSites.map((analysis, index) => ({
      rank: index + 1,
      site: {
        id: analysis.site.id,
        name: analysis.site.name,
        url: analysis.site.url,
        title: analysis.site.title,
        description: analysis.site.description,
        favicon: analysis.site.favicon,
        domain: analysis.site.domain,
      },
      score: {
        total: analysis.scores.totalScore,
        searchPresence: analysis.scores.searchPresenceScore,
        performance: analysis.scores.performanceScore,
        backlinkAuthority: analysis.scores.backlinkAuthorityScore,
        freshness: analysis.scores.freshnessScore,
        usability: analysis.scores.usabilityScore,
        breakdown: analysis.scores.breakdown,
      },
      metrics: {
        performanceScore: analysis.analysis.performanceScore,
        searchResults: analysis.analysis.searchResults,
        pageRank: analysis.analysis.pageRank,
        loadTime: analysis.analysis.loadTime,
        mobileOptimized: analysis.analysis.mobileOptimized,
        httpsEnabled: analysis.analysis.httpsEnabled,
      }
    }))
    
    return NextResponse.json({
      success: true,
      runId: run.id,
      category,
      totalAnalyzed: siteAnalyses.length,
      results
    })
    
  } catch (error) {
    console.error('Error in /api/generate:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to generate rankings',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const runId = searchParams.get('runId')
  
  if (!runId) {
    return NextResponse.json({
      message: 'Use POST method to generate rankings or provide runId parameter',
      usage: {
        post: 'POST /api/generate with body { category: "study", limit: 10 }',
        get: 'GET /api/generate?runId=<run_id>'
      }
    })
  }

  try {
    // Fetch run data with related sites and scores
    const run = await prisma.run.findUnique({
      where: { id: runId },
      include: {
        scores: {
          include: { site: true },      // <-- important
          orderBy: { score: 'desc' }
        }
      }
    });
    if (!run) {
      return Response.json({ error: 'Run not found' }, { status: 404 });
    }

    if (!run) {
      return NextResponse.json(
        { success: false, error: 'Run not found' },
        { status: 404 }
      )
    }

    if (run.status === 'RUNNING') {
      return NextResponse.json({
        success: false,
        status: 'running',
        message: 'Analysis is still in progress. Please try again in a few moments.'
      })
    }

    if (run.status === 'FAILED') {
      return NextResponse.json({
        success: false,
        status: 'failed',
        error: 'Analysis failed. Please try generating new rankings.'
      })
    }

    // Format results
    type ScoredSite = Prisma.SiteScoreGetPayload<{ include: { site: true } }>;
    const results = run.scores.map((score: ScoredSite, index: number) => ({
      rank: score.rank ?? index + 1,
      site: {
        id: score.site.id,
        url: score.site.url,
        title: score.site.title ?? null,
        description: score.site.description ?? null,
      },
      score: score.score,
      components: score.components,
    }));

    return NextResponse.json({
      success: true,
      runId: run.id,
      category: run.category,
      status: run.status.toLowerCase(),
      totalAnalyzed: run.totalSites,
      completedAt: run.completedAt,
      results
    })

  } catch (error) {
    console.error('Error fetching results:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch results' },
      { status: 500 }
    )
  }
}

/**
 * Extract site name from title or URL
 */
function extractSiteName(titleOrUrl: string): string {
  try {
    // If it looks like a URL, extract domain name
    if (titleOrUrl.includes('://') || titleOrUrl.includes('.')) {
      const hostname = new URL(titleOrUrl.startsWith('http') ? titleOrUrl : `https://${titleOrUrl}`).hostname
      const domain = hostname.replace('www.', '')
      const name = domain.split('.')[0]
      return name.charAt(0).toUpperCase() + name.slice(1)
    }
    
    // Otherwise, clean up the title
    const name = titleOrUrl
      .replace(/\s*[-|–—]\s*.*$/, '') // Remove everything after dash
      .replace(/\s*\|\s*.*$/, '')     // Remove everything after pipe
      .trim()
    
    return name || 'Unknown Site'
  } catch {
    return 'Unknown Site'
  }
}

/**
 * Extract keywords from meta description
 */
function extractKeywords(description: string): string[] {
  if (!description) return []
  
  const commonWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'can', 'this', 'that', 'these', 'those'
  ])
  
  return description
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 2 && !commonWords.has(word))
    .slice(0, 10) // Limit to 10 keywords
}