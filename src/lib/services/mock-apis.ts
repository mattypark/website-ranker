import { sleep } from '@/lib/utils'

// Mock study websites data
const STUDY_WEBSITES = [
  'https://www.khanacademy.org',
  'https://www.coursera.org',
  'https://www.edx.org',
  'https://www.udemy.com',
  'https://www.codecademy.com',
  'https://www.duolingo.com',
  'https://www.brilliant.org',
  'https://www.skillshare.com',
  'https://www.lynda.com',
  'https://www.pluralsight.com',
  'https://www.udacity.com',
  'https://www.futurelearn.com',
  'https://www.memrise.com',
  'https://www.babbel.com',
  'https://www.masterclass.com',
  'https://www.quizlet.com',
  'https://www.anki.com',
  'https://www.studyblue.com',
  'https://www.chegg.com',
  'https://www.studystack.com'
]

export interface BingSearchResult {
  name: string
  url: string
  snippet: string
  displayUrl: string
}

export interface PageSpeedResult {
  performanceScore: number
  loadTime: number
  firstContentfulPaint: number
  largestContentfulPaint: number
  cumulativeLayoutShift: number
}

export interface PageRankResult {
  pageRank: number
  domainAuthority: number
  backlinks: number
}

/**
 * Mock Bing Search API
 * TODO: Replace with actual Bing Search API call
 */
export async function mockBingSearch(query: string, count: number = 20): Promise<BingSearchResult[]> {
  await sleep(500) // Simulate API delay
  
  // Return a subset of study websites with mock data
  const results: BingSearchResult[] = STUDY_WEBSITES.slice(0, count).map((url, index) => {
    const domain = new URL(url).hostname.replace('www.', '')
    const name = domain.split('.')[0]
    
    return {
      name: name.charAt(0).toUpperCase() + name.slice(1),
      url,
      snippet: `${name} is a leading online learning platform offering comprehensive study materials and courses.`,
      displayUrl: url.replace('https://', '')
    }
  })
  
  // Shuffle to simulate real search results
  return results.sort(() => Math.random() - 0.5)
}

/**
 * Mock Google PageSpeed Insights API
 * TODO: Replace with actual PageSpeed Insights API call
 */
export async function mockPageSpeedInsights(url: string): Promise<PageSpeedResult> {
  await sleep(300) // Simulate API delay
  
  // Generate realistic mock performance scores
  const baseScore = 60 + Math.random() * 35 // 60-95 range
  
  return {
    performanceScore: Math.round(baseScore),
    loadTime: 1.2 + Math.random() * 2.8, // 1.2-4.0 seconds
    firstContentfulPaint: 0.8 + Math.random() * 1.7, // 0.8-2.5 seconds
    largestContentfulPaint: 1.5 + Math.random() * 3.0, // 1.5-4.5 seconds
    cumulativeLayoutShift: Math.random() * 0.25 // 0-0.25
  }
}

/**
 * Mock Open PageRank API
 * TODO: Replace with actual Open PageRank API call
 */
export async function mockOpenPageRank(url: string): Promise<PageRankResult> {
  await sleep(200) // Simulate API delay
  
  // Generate realistic mock authority scores based on known sites
  const domain = new URL(url).hostname
  let baseAuthority = 30 + Math.random() * 40 // 30-70 base
  
  // Boost scores for well-known educational sites
  const highAuthorityDomains = [
    'khanacademy.org', 'coursera.org', 'edx.org', 'udemy.com',
    'codecademy.com', 'duolingo.com', 'brilliant.org'
  ]
  
  if (highAuthorityDomains.some(d => domain.includes(d))) {
    baseAuthority = 70 + Math.random() * 25 // 70-95 for known sites
  }
  
  return {
    pageRank: Math.round(baseAuthority) / 10, // Convert to 0-10 scale
    domainAuthority: Math.round(baseAuthority),
    backlinks: Math.round(1000 + Math.random() * 50000) // 1K-51K backlinks
  }
}

/**
 * Mock comprehensive site analysis
 */
export async function mockSiteAnalysis(url: string) {
  const [pageSpeed, pageRank] = await Promise.all([
    mockPageSpeedInsights(url),
    mockOpenPageRank(url)
  ])
  
  // Mock additional metrics
  const httpsEnabled = url.startsWith('https://')
  const mobileOptimized = Math.random() > 0.1 // 90% of sites are mobile optimized
  const hasRobotsTxt = Math.random() > 0.2 // 80% have robots.txt
  
  // Mock trust signals
  const trustSignals = {
    hasPrivacyPolicy: Math.random() > 0.1,
    hasTermsOfService: Math.random() > 0.15,
    hasContactInfo: Math.random() > 0.05,
    hasSSLCertificate: httpsEnabled,
    socialMediaPresence: Math.random() > 0.3
  }
  
  return {
    ...pageSpeed,
    ...pageRank,
    httpsEnabled,
    mobileOptimized,
    hasRobotsTxt,
    trustSignals
  }
}
