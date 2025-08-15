'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { ArrowLeft, ExternalLink, Info, TrendingUp, Award, Zap, Shield, Clock, Search, RefreshCw } from 'lucide-react'
import Link from 'next/link'

interface SiteResult {
  rank: number
  site: {
    url: string
    title?: string
    description?: string
    domain?: string
    favicon?: string
  }
  score: number
  components: {
    search: number
    performance: number
    authority: number
    freshness: number
    usability: number
  }
}

interface ResultsData {
  success: boolean
  runId: string
  niche: string
  nicheSlug?: string
  status?: string
  totalAnalyzed?: number
  startedAt?: string
  completedAt?: string
  results: SiteResult[]
  cached?: boolean
  debug?: any
}

function capitalizeWords(text: string): string {
  return text
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
}

function slugToNiche(slug: string): string {
  return slug.replace(/-/g, ' ')
}

export function ResultsPageContent() {
  const searchParams = useSearchParams()
  const runId = searchParams.get('run') || searchParams.get('runId')
  const nicheParam = searchParams.get('niche') || 'websites'
  
  const [data, setData] = useState<ResultsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedSite, setSelectedSite] = useState<SiteResult | null>(null)
  const [rerunning, setRerunning] = useState(false)

  // Convert slug back to readable niche
  const displayNiche = data?.niche ? capitalizeWords(data.niche) : capitalizeWords(slugToNiche(nicheParam))

  useEffect(() => {
    if (!runId) {
      setError('No run ID provided')
      setLoading(false)
      return
    }

    const fetchResults = async () => {
      try {
        const response = await fetch(`/api/generate?run=${runId}`)
        const data = await response.json()
        
        if (data.success) {
          setData(data)
          console.log('[Results] Loaded:', data)
        } else {
          setError(data.error || 'Failed to load results')
        }
      } catch (err) {
        console.error('[Results] Fetch error:', err)
        setError('Failed to fetch results')
      } finally {
        setLoading(false)
      }
    }

    fetchResults()
  }, [runId])

  const handleRerun = async () => {
    if (!data || rerunning) return
    
    setRerunning(true)
    
    try {
      console.log('[Results] Re-running analysis for:', data.niche)
      
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          niche: data.niche
        })
      })

      const result = await response.json()
      
      if (result.success) {
        // Redirect to new results
        window.location.href = `/results?run=${result.runId}&niche=${result.nicheSlug || data.nicheSlug}`
      } else {
        alert(result.error || 'Failed to rerun analysis')
      }
    } catch (error) {
      console.error('[Results] Rerun error:', error)
      alert('An error occurred while rerunning the analysis')
    } finally {
      setRerunning(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading results...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Error Loading Results</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="space-y-3">
            <Link 
              href="/"
              className="block bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg inline-flex items-center space-x-2 justify-center"
            >
              <ArrowLeft className="h-5 w-5" />
              <span>Back to Home</span>
            </Link>
            {data?.niche && (
              <button
                onClick={handleRerun}
                disabled={rerunning}
                className="block w-full bg-gray-600 hover:bg-gray-700 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-lg inline-flex items-center space-x-2 justify-center"
              >
                <RefreshCw className={`h-5 w-5 ${rerunning ? 'animate-spin' : ''}`} />
                <span>{rerunning ? 'Re-running...' : 'Try Again'}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }

  if (!data) {
    return null
  }

  const resultsCount = data.results?.length || 0
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return 'bg-green-100'
    if (score >= 60) return 'bg-yellow-100'
    return 'bg-red-100'
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link 
              href="/"
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
              <span>Back to Home</span>
            </Link>
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-8 w-8 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                NicheRank Results
              </h1>
            </div>
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {resultsCount} websites analyzed
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Results Header */}
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Top {resultsCount} {displayNiche} Websites
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              Ranked by comprehensive analysis of search presence, performance, authority, freshness, and usability
            </p>
            <div className="flex items-center justify-center space-x-4 mt-4">
              {data.completedAt && (
                <p className="text-sm text-gray-500">
                  Last updated: {new Date(data.completedAt).toLocaleString()}
                </p>
              )}
              {data.cached && (
                <p className="text-sm text-blue-600">
                  ⚡ Cached results
                </p>
              )}
              <button
                onClick={handleRerun}
                disabled={rerunning}
                className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-medium rounded-lg transition-colors"
              >
                <RefreshCw className={`h-4 w-4 ${rerunning ? 'animate-spin' : ''}`} />
                <span>{rerunning ? 'Re-running...' : 'Re-run Analysis'}</span>
              </button>
            </div>
          </div>

          {/* Debug Info (Development) */}
          {data.debug && process.env.NODE_ENV === 'development' && (
            <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <h3 className="font-semibold text-yellow-800 mb-2">Debug Info:</h3>
              <pre className="text-sm text-yellow-700">
                {JSON.stringify(data.debug, null, 2)}
              </pre>
            </div>
          )}

          {/* Results Grid */}
          <div className="grid gap-6">
            {resultsCount === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">🔍</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No Results Found</h3>
                <p className="text-gray-600 mb-6">
                  We couldn't find any websites for "{data.niche}". Try a different search term or be more specific.
                </p>
                <button
                  onClick={handleRerun}
                  disabled={rerunning}
                  className="inline-flex items-center space-x-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-lg transition-colors"
                >
                  <RefreshCw className={`h-5 w-5 ${rerunning ? 'animate-spin' : ''}`} />
                  <span>{rerunning ? 'Re-running...' : 'Try Again'}</span>
                </button>
              </div>
            ) : (
              data.results.map((result) => (
                <div
                  key={result.rank}
                  className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      {/* Rank */}
                      <div className="flex-shrink-0">
                        <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center text-xl font-bold">
                          {result.rank}
                        </div>
                      </div>

                      {/* Site Info */}
                      <div className="flex items-center space-x-4">
                        <img
                          src={result.site.favicon || `https://www.google.com/s2/favicons?domain=${result.site.domain || new URL(result.site.url).hostname}&sz=64`}
                          alt={`${result.site.title || result.site.url} favicon`}
                          className="w-8 h-8 rounded"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement
                            target.src = '/favicon.ico'
                          }}
                        />
                        <div>
                          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                            {result.site.title || new URL(result.site.url).hostname}
                          </h3>
                          <p className="text-gray-600 dark:text-gray-300 text-sm">
                            {result.site.description || `Website for ${data.niche}`}
                          </p>
                          <a
                            href={result.site.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 text-sm inline-flex items-center space-x-1 mt-1"
                          >
                            <span>{result.site.url}</span>
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </div>
                      </div>
                    </div>

                    {/* Score and Actions */}
                    <div className="flex items-center space-x-4">
                      <div className="text-center">
                        <div className={`text-3xl font-bold ${getScoreColor(result.score)}`}>
                          {result.score}
                        </div>
                        <div className="text-sm text-gray-500">Total Score</div>
                      </div>
                      
                      <button
                        onClick={() => setSelectedSite(result)}
                        className="bg-gray-100 hover:bg-gray-200 text-gray-700 p-2 rounded-lg transition-colors"
                        title="View score breakdown"
                      >
                        <Info className="h-5 w-5" />
                      </button>
                    </div>
                  </div>

                  {/* Score Breakdown Preview */}
                  <div className="mt-4 grid grid-cols-5 gap-3">
                    <div className="text-center">
                      <div className="flex items-center justify-center space-x-1 mb-1">
                        <Search className="h-4 w-4 text-green-600" />
                        <span className="text-xs font-medium text-gray-700">Search</span>
                      </div>
                      <div className={`text-sm font-semibold ${getScoreColor(result.components.search)}`}>
                        {result.components.search}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center space-x-1 mb-1">
                        <Zap className="h-4 w-4 text-blue-600" />
                        <span className="text-xs font-medium text-gray-700">Performance</span>
                      </div>
                      <div className={`text-sm font-semibold ${getScoreColor(result.components.performance)}`}>
                        {result.components.performance}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center space-x-1 mb-1">
                        <Award className="h-4 w-4 text-purple-600" />
                        <span className="text-xs font-medium text-gray-700">Authority</span>
                      </div>
                      <div className={`text-sm font-semibold ${getScoreColor(result.components.authority)}`}>
                        {result.components.authority}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center space-x-1 mb-1">
                        <Clock className="h-4 w-4 text-orange-600" />
                        <span className="text-xs font-medium text-gray-700">Freshness</span>
                      </div>
                      <div className={`text-sm font-semibold ${getScoreColor(result.components.freshness)}`}>
                        {result.components.freshness}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center space-x-1 mb-1">
                        <Shield className="h-4 w-4 text-red-600" />
                        <span className="text-xs font-medium text-gray-700">Usability</span>
                      </div>
                      <div className={`text-sm font-semibold ${getScoreColor(result.components.usability)}`}>
                        {result.components.usability}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>

      {/* Score Breakdown Modal */}
      {selectedSite && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Score Breakdown: {selectedSite.site.title || new URL(selectedSite.site.url).hostname}
                </h3>
                <button
                  onClick={() => setSelectedSite(null)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {Object.entries(selectedSite.components).map(([category, score]) => (
                  <div key={category} className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 capitalize">
                      {category} Score
                    </h4>
                    <div className="flex items-center space-x-4 mb-3">
                      <div className={`text-2xl font-bold ${getScoreColor(score)}`}>
                        {score}
                      </div>
                      <div className="text-sm text-gray-500">
                        Weight: {category === 'search' ? '40%' : category === 'performance' ? '25%' : category === 'authority' ? '15%' : '10%'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 text-center">
                <div className={`inline-block px-4 py-2 rounded-lg ${getScoreBgColor(selectedSite.score)}`}>
                  <span className="text-sm font-medium text-gray-700">
                    Final Score: 
                  </span>
                  <span className={`text-xl font-bold ml-2 ${getScoreColor(selectedSite.score)}`}>
                    {selectedSite.score}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
