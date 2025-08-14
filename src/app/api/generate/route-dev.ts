import { NextRequest, NextResponse } from 'next/server'

// Mock data for development
const MOCK_STUDY_WEBSITES = [
  {
    name: 'Khan Academy',
    url: 'https://www.khanacademy.org',
    description: 'Free online courses, lessons and practice',
    favicon: 'https://www.google.com/s2/favicons?domain=khanacademy.org&sz=64',
    score: {
      total: 92,
      searchPresence: 95,
      performance: 88,
      backlinkAuthority: 94,
      freshness: 85,
      usability: 90,
    }
  },
  {
    name: 'Coursera',
    url: 'https://www.coursera.org',
    description: 'Online courses from top universities and companies',
    favicon: 'https://www.google.com/s2/favicons?domain=coursera.org&sz=64',
    score: {
      total: 89,
      searchPresence: 92,
      performance: 85,
      backlinkAuthority: 91,
      freshness: 88,
      usability: 87,
    }
  },
  {
    name: 'edX',
    url: 'https://www.edx.org',
    description: 'High-quality courses from the world\'s best universities',
    favicon: 'https://www.google.com/s2/favicons?domain=edx.org&sz=64',
    score: {
      total: 87,
      searchPresence: 89,
      performance: 83,
      backlinkAuthority: 90,
      freshness: 86,
      usability: 89,
    }
  },
  {
    name: 'Udemy',
    url: 'https://www.udemy.com',
    description: 'Online learning and teaching marketplace',
    favicon: 'https://www.google.com/s2/favicons?domain=udemy.com&sz=64',
    score: {
      total: 85,
      searchPresence: 88,
      performance: 81,
      backlinkAuthority: 87,
      freshness: 84,
      usability: 85,
    }
  },
  {
    name: 'Codecademy',
    url: 'https://www.codecademy.com',
    description: 'Learn to code interactively, for free',
    favicon: 'https://www.google.com/s2/favicons?domain=codecademy.com&sz=64',
    score: {
      total: 84,
      searchPresence: 86,
      performance: 82,
      backlinkAuthority: 85,
      freshness: 83,
      usability: 84,
    }
  },
  {
    name: 'Duolingo',
    url: 'https://www.duolingo.com',
    description: 'Learn languages for free',
    favicon: 'https://www.google.com/s2/favicons?domain=duolingo.com&sz=64',
    score: {
      total: 83,
      searchPresence: 85,
      performance: 80,
      backlinkAuthority: 84,
      freshness: 82,
      usability: 86,
    }
  },
  {
    name: 'Brilliant',
    url: 'https://www.brilliant.org',
    description: 'Build quantitative skills in math, science, and computer science',
    favicon: 'https://www.google.com/s2/favicons?domain=brilliant.org&sz=64',
    score: {
      total: 82,
      searchPresence: 84,
      performance: 79,
      backlinkAuthority: 83,
      freshness: 81,
      usability: 83,
    }
  },
  {
    name: 'Skillshare',
    url: 'https://www.skillshare.com',
    description: 'Online creative classes',
    favicon: 'https://www.google.com/s2/favicons?domain=skillshare.com&sz=64',
    score: {
      total: 80,
      searchPresence: 82,
      performance: 77,
      backlinkAuthority: 81,
      freshness: 80,
      usability: 82,
    }
  },
  {
    name: 'Pluralsight',
    url: 'https://www.pluralsight.com',
    description: 'Technology skills platform',
    favicon: 'https://www.google.com/s2/favicons?domain=pluralsight.com&sz=64',
    score: {
      total: 79,
      searchPresence: 81,
      performance: 76,
      backlinkAuthority: 80,
      freshness: 79,
      usability: 81,
    }
  },
  {
    name: 'Udacity',
    url: 'https://www.udacity.com',
    description: 'Advance your career with online courses',
    favicon: 'https://www.google.com/s2/favicons?domain=udacity.com&sz=64',
    score: {
      total: 78,
      searchPresence: 80,
      performance: 75,
      backlinkAuthority: 79,
      freshness: 78,
      usability: 80,
    }
  }
]

export async function POST(request: NextRequest) {
  try {
    const { category = 'study', limit = 10 } = await request.json()
    
    console.log(`🚀 Generating mock rankings for category: ${category}`)
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // Get top sites
    const topSites = MOCK_STUDY_WEBSITES.slice(0, limit)
    
    // Add detailed breakdown for each score
    const results = topSites.map((site, index) => ({
      rank: index + 1,
      site: {
        id: `site_${index + 1}`,
        name: site.name,
        url: site.url,
        title: site.name,
        description: site.description,
        favicon: site.favicon,
        domain: new URL(site.url).hostname.replace('www.', ''),
      },
      score: {
        ...site.score,
        breakdown: {
          searchPresence: {
            score: site.score.searchPresence,
            weight: 0.40,
            details: {
              searchResults: Math.floor(Math.random() * 50000) + 10000,
              searchRank: Math.floor(Math.random() * 5) + 1,
              searchResultsScore: site.score.searchPresence,
              searchRankScore: site.score.searchPresence,
            }
          },
          performance: {
            score: site.score.performance,
            weight: 0.25,
            details: {
              performanceScore: site.score.performance,
              loadTimeScore: site.score.performance - 5,
              coreWebVitalsScore: site.score.performance + 2,
              pageSizeScore: site.score.performance - 3,
            }
          },
          backlinkAuthority: {
            score: site.score.backlinkAuthority,
            weight: 0.15,
            details: {
              pageRankScore: site.score.backlinkAuthority - 5,
              domainAuthorityScore: site.score.backlinkAuthority,
              backlinksScore: site.score.backlinkAuthority - 10,
            }
          },
          freshness: {
            score: site.score.freshness,
            weight: 0.10,
            details: {
              contentAgeScore: site.score.freshness,
              lastModifiedScore: 100,
            }
          },
          usability: {
            score: site.score.usability,
            weight: 0.10,
            details: {
              mobileScore: 100,
              accessibilityScore: site.score.usability,
              seoScore: site.score.usability,
              httpsScore: 100,
              technicalScore: site.score.usability,
            }
          }
        }
      },
      metrics: {
        performanceScore: site.score.performance,
        searchResults: Math.floor(Math.random() * 50000) + 10000,
        pageRank: (site.score.backlinkAuthority / 10).toFixed(1),
        loadTime: (2 + Math.random() * 2).toFixed(2),
        mobileOptimized: true,
        httpsEnabled: true,
      }
    }))
    
    console.log(`✅ Mock analysis complete. Returning ${results.length} results.`)
    
    return NextResponse.json({
      success: true,
      runId: `mock_run_${Date.now()}`,
      category,
      totalAnalyzed: MOCK_STUDY_WEBSITES.length,
      results
    })
    
  } catch (error) {
    console.error('Error in mock /api/generate:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to generate mock rankings',
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
      message: 'Mock API - Use POST method to generate rankings or provide runId parameter',
      usage: {
        post: 'POST /api/generate with body { category: "study", limit: 10 }',
        get: 'GET /api/generate?runId=<run_id>'
      }
    })
  }

  // For mock data, just return the same results
  const topSites = MOCK_STUDY_WEBSITES.slice(0, 10)
  
  const results = topSites.map((site, index) => ({
    rank: index + 1,
    site: {
      id: `site_${index + 1}`,
      name: site.name,
      url: site.url,
      title: site.name,
      description: site.description,
      favicon: site.favicon,
      domain: new URL(site.url).hostname.replace('www.', ''),
    },
    score: {
      ...site.score,
      breakdown: {
        searchPresence: {
          score: site.score.searchPresence,
          weight: 0.40,
          details: {
            searchResults: Math.floor(Math.random() * 50000) + 10000,
            searchRank: Math.floor(Math.random() * 5) + 1,
          }
        },
        performance: {
          score: site.score.performance,
          weight: 0.25,
          details: {
            performanceScore: site.score.performance,
            loadTimeScore: site.score.performance - 5,
          }
        },
        backlinkAuthority: {
          score: site.score.backlinkAuthority,
          weight: 0.15,
          details: {
            pageRankScore: site.score.backlinkAuthority - 5,
            domainAuthorityScore: site.score.backlinkAuthority,
          }
        },
        freshness: {
          score: site.score.freshness,
          weight: 0.10,
          details: {
            contentAgeScore: site.score.freshness,
          }
        },
        usability: {
          score: site.score.usability,
          weight: 0.10,
          details: {
            mobileScore: 100,
            accessibilityScore: site.score.usability,
          }
        }
      }
    }
  }))

  return NextResponse.json({
    success: true,
    runId,
    category: 'study',
    status: 'completed',
    totalAnalyzed: MOCK_STUDY_WEBSITES.length,
    completedAt: new Date().toISOString(),
    results
  })
}
