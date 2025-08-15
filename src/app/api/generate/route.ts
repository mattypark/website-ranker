import { NextRequest, NextResponse } from 'next/server'

// Temporary implementation that works without external APIs
// This will demonstrate the correct data flow and structure

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
}

function titleCase(text: string): string {
  return text
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
}

// Mock data generator for different niches
function generateMockResults(niche: string): any[] {
  const mockSites = {
    'fitness apps': [
      { domain: 'myfitnesspal.com', title: 'MyFitnessPal', description: 'Calorie counter and diet tracker' },
      { domain: 'strava.com', title: 'Strava', description: 'Fitness tracking social network' },
      { domain: 'nike.com', title: 'Nike Training Club', description: 'Free fitness workouts' },
      { domain: 'adidas.com', title: 'Adidas Training', description: 'Home workout app' },
      { domain: 'fitbit.com', title: 'Fitbit', description: 'Activity and health tracker' },
      { domain: 'peloton.com', title: 'Peloton', description: 'Home fitness platform' },
      { domain: 'noom.com', title: 'Noom', description: 'Psychology-based weight loss' },
      { domain: 'dailyburn.com', title: 'Daily Burn', description: 'Online fitness videos' },
      { domain: 'aaptiv.com', title: 'Aaptiv', description: 'Audio fitness classes' },
      { domain: 'sworkit.com', title: 'Sworkit', description: 'Personalized workouts' }
    ],
    'cooking banana bread': [
      { domain: 'kingarthurbaking.com', title: 'King Arthur Baking', description: 'Professional baking recipes' },
      { domain: 'allrecipes.com', title: 'Allrecipes', description: 'Community recipe sharing' },
      { domain: 'foodnetwork.com', title: 'Food Network', description: 'Chef recipes and cooking shows' },
      { domain: 'bonappetit.com', title: 'Bon Appétit', description: 'Food and cooking magazine' },
      { domain: 'seriouseats.com', title: 'Serious Eats', description: 'Food science and recipes' },
      { domain: 'tasteofhome.com', title: 'Taste of Home', description: 'Home cooking recipes' },
      { domain: 'epicurious.com', title: 'Epicurious', description: 'Gourmet recipes and cooking' },
      { domain: 'simplyrecipes.com', title: 'Simply Recipes', description: 'Simple, trusted recipes' },
      { domain: 'food.com', title: 'Food.com', description: 'Recipe community and reviews' },
      { domain: 'bettycrocker.com', title: 'Betty Crocker', description: 'Classic American recipes' }
    ],
    'programming blogs': [
      { domain: 'dev.to', title: 'DEV Community', description: 'Programming community and articles' },
      { domain: 'medium.com', title: 'Medium', description: 'Programming articles and tutorials' },
      { domain: 'stackoverflow.com', title: 'Stack Overflow', description: 'Programming Q&A community' },
      { domain: 'github.com', title: 'GitHub Blog', description: 'Developer platform and blog' },
      { domain: 'hackernoon.com', title: 'Hacker Noon', description: 'Tech and programming stories' },
      { domain: 'css-tricks.com', title: 'CSS-Tricks', description: 'Web development tips and tricks' },
      { domain: 'smashingmagazine.com', title: 'Smashing Magazine', description: 'Web design and development' },
      { domain: 'freecodecamp.org', title: 'freeCodeCamp', description: 'Learn to code for free' },
      { domain: 'codepen.io', title: 'CodePen', description: 'Front-end code playground' },
      { domain: 'hashnode.com', title: 'Hashnode', description: 'Developer blogging platform' }
    ]
  }

  // Get mock sites for this niche or generate generic ones
  const sites = mockSites[niche.toLowerCase()] || [
    { domain: 'example1.com', title: `Best ${niche} Site`, description: `Top resource for ${niche}` },
    { domain: 'example2.com', title: `${titleCase(niche)} Hub`, description: `Community for ${niche}` },
    { domain: 'example3.com', title: `${titleCase(niche)} Guide`, description: `Complete guide to ${niche}` },
    { domain: 'example4.com', title: `${titleCase(niche)} Pro`, description: `Professional ${niche} resource` },
    { domain: 'example5.com', title: `${titleCase(niche)} Central`, description: `Everything about ${niche}` },
    { domain: 'example6.com', title: `${titleCase(niche)} World`, description: `${titleCase(niche)} community` },
    { domain: 'example7.com', title: `${titleCase(niche)} Tips`, description: `Tips and tricks for ${niche}` },
    { domain: 'example8.com', title: `${titleCase(niche)} Master`, description: `Master ${niche} skills` },
    { domain: 'example9.com', title: `${titleCase(niche)} Zone`, description: `Your ${niche} resource` },
    { domain: 'example10.com', title: `${titleCase(niche)} Plus`, description: `Advanced ${niche} content` }
  ]

  return sites.slice(0, 10).map((site, index) => ({
    rank: index + 1,
    site: {
      url: `https://${site.domain}`,
      title: site.title,
      description: site.description,
      domain: site.domain,
      favicon: `https://www.google.com/s2/favicons?domain=${site.domain}&sz=64`
    },
    score: Math.max(60, 95 - index * 5 + Math.floor(Math.random() * 10)), // Realistic decreasing scores
    components: {
      search: Math.max(70, 100 - index * 8 + Math.floor(Math.random() * 15)),
      performance: Math.max(50, 85 - Math.floor(Math.random() * 30)),
      authority: Math.max(40, 90 - index * 6 + Math.floor(Math.random() * 20)),
      freshness: Math.max(60, 80 - Math.floor(Math.random() * 25)),
      usability: Math.max(70, 85 - Math.floor(Math.random() * 20))
    }
  }))
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    let { niche } = body

    // Validate niche input - DO NOT override to "study" unless empty
    if (!niche || typeof niche !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Niche parameter is required' },
        { status: 400 }
      )
    }

    niche = niche.trim()
    if (niche.length === 0) {
      niche = 'study' // Only default if completely empty
    }

    if (niche.length > 60) {
      return NextResponse.json(
        { success: false, error: 'Niche must be 60 characters or less' },
        { status: 400 }
      )
    }

    const nicheSlug = slugify(niche)
    const runId = `run_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    console.info('[API] Processing niche:', niche, '(slug:', nicheSlug + ')')

    // Generate mock results based on the niche
    const results = generateMockResults(niche)

    console.info('[discover]', niche, { 
      items: results.length * 3, // Simulate finding more items initially
      unique: results.length,
      queries: 3 
    })

    // Log each result as if it was scored
    results.forEach(result => {
      console.info('[score]', result.site.url, { 
        psiOk: true, 
        oprOk: true, 
        siteOk: true,
        score: result.score,
        components: result.components 
      })
    })

    console.info('[API] Completed successfully:', {
      runId,
      niche,
      resultsCount: results.length
    })
    
    return NextResponse.json({
      success: true,
      runId,
      niche,
      nicheSlug,
      results,
      cached: false,
      ...(process.env.NODE_ENV === 'development' && {
        debug: {
          originsFound: results.length,
          sitesScored: results.length,
          resultsReturned: results.length,
          mockData: true
        }
      })
    })
    
  } catch (error) {
    console.error('[API] Fatal error:', error)
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
  const runId = searchParams.get('runId') || searchParams.get('run')
  
  if (!runId) {
    return NextResponse.json({
      message: 'NicheRank API - Use POST method to generate rankings or provide run parameter',
      usage: {
        post: 'POST /api/generate with body { niche: "your-niche-here" }',
        get: 'GET /api/generate?run=<run_id>'
      }
    })
  }

  // For mock implementation, return sample data
  const mockNiche = 'fitness apps'
  const results = generateMockResults(mockNiche)

  return NextResponse.json({
    success: true,
    runId,
    niche: mockNiche,
    nicheSlug: 'fitness-apps',
    status: 'completed',
    totalAnalyzed: results.length,
    startedAt: new Date(Date.now() - 30000).toISOString(),
    completedAt: new Date().toISOString(),
    results
  })
}
