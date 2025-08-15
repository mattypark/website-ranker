'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { ArrowLeft, ExternalLink, Info, TrendingUp, Award, Zap, Shield, Clock, Search } from 'lucide-react'
import Link from 'next/link'

interface SiteResult {
  rank: number
  site: {
    id: string
    name: string
    url: string
    description: string
    favicon: string
  }
  score: {
    total: number
    searchPresence: number
    performance: number
    backlinkAuthority: number
    freshness: number
    usability: number
    breakdown: {
      searchPresence: {
        score: number
        weight: number
        details: Record<string, any>
      }
      performance: {
        score: number
        weight: number
        details: Record<string, any>
      }
      backlinkAuthority: {
        score: number
        weight: number
        details: Record<string, any>
      }
      freshness: {
        score: number
        weight: number
        details: Record<string, any>
      }
      usability: {
        score: number
        weight: number
        details: Record<string, any>
      }
    }
  }
}

interface ResultsData {
  success: boolean
  runId: string
  category: string
  totalAnalyzed: number
  results: SiteResult[]
}

export function ResultsPageContent() {
  const searchParams = useSearchParams()
  const runId = searchParams.get('runId')
  
  const [data, setData] = useState<ResultsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedSite, setSelectedSite] = useState<SiteResult | null>(null)

  useEffect(() => {
    if (!runId) {
      setError('No run ID provided')
      setLoading(false)
      return
    }

    const fetchResults = async () => {
      try {
        const response = await fetch(`/api/generate?runId=${runId}`)
        const data = await response.json()
        
        if (data.success) {
          setData(data)
        } else {
          setError(data.error || 'Failed to load results')
        }
      } catch (err) {
        setError('Failed to fetch results')
      } finally {
        setLoading(false)
      }
    }

    fetchResults()
  }, [runId])

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
          <Link 
            href="/"
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg inline-flex items-center space-x-2"
          >
            <ArrowLeft className="h-5 w-5" />
            <span>Back to Home</span>
          </Link>
        </div>
      </div>
    )
  }

  if (!data) {
    return null
  }

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
                StudyRank Results
              </h1>
            </div>
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {data.totalAnalyzed} websites analyzed
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Results Header */}
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Top {data.results.length} Study Websites
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              Ranked by comprehensive analysis of performance, authority, freshness, and trust
            </p>
          </div>

          {/* Results Grid */}
          <div className="grid gap-6">
            {data.results.map((result) => (
              <div
                key={result.site.id}
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
                        src={result.site.favicon}
                        alt={`${result.site.name} favicon`}
                        className="w-8 h-8 rounded"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement
                          target.src = '/favicon.ico'
                        }}
                      />
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                          {result.site.name}
                        </h3>
                        <p className="text-gray-600 dark:text-gray-300 text-sm">
                          {result.site.description}
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
                      <div className={`text-3xl font-bold ${getScoreColor(result.score.total)}`}>
                        {result.score.total}
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
                    <div className={`text-sm font-semibold ${getScoreColor(result.score.searchPresence)}`}>
                      {result.score.searchPresence}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center space-x-1 mb-1">
                      <Zap className="h-4 w-4 text-blue-600" />
                      <span className="text-xs font-medium text-gray-700">Performance</span>
                    </div>
                    <div className={`text-sm font-semibold ${getScoreColor(result.score.performance)}`}>
                      {result.score.performance}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center space-x-1 mb-1">
                      <Award className="h-4 w-4 text-purple-600" />
                      <span className="text-xs font-medium text-gray-700">Authority</span>
                    </div>
                    <div className={`text-sm font-semibold ${getScoreColor(result.score.backlinkAuthority)}`}>
                      {result.score.backlinkAuthority}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center space-x-1 mb-1">
                      <Clock className="h-4 w-4 text-orange-600" />
                      <span className="text-xs font-medium text-gray-700">Freshness</span>
                    </div>
                    <div className={`text-sm font-semibold ${getScoreColor(result.score.freshness)}`}>
                      {result.score.freshness}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center space-x-1 mb-1">
                      <Shield className="h-4 w-4 text-red-600" />
                      <span className="text-xs font-medium text-gray-700">Usability</span>
                    </div>
                    <div className={`text-sm font-semibold ${getScoreColor(result.score.usability)}`}>
                      {result.score.usability}
                    </div>
                  </div>
                </div>
              </div>
            ))}
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
                  Score Breakdown: {selectedSite.site.name}
                </h3>
                <button
                  onClick={() => setSelectedSite(null)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {Object.entries(selectedSite.score.breakdown).map(([category, data]) => (
                  <div key={category} className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 capitalize">
                      {category} Score
                    </h4>
                    <div className="flex items-center space-x-4 mb-3">
                      <div className={`text-2xl font-bold ${getScoreColor(data.score)}`}>
                        {data.score}
                      </div>
                      <div className="text-sm text-gray-500">
                        Weight: {(data.weight * 100).toFixed(0)}%
                      </div>
                    </div>
                    <div className="space-y-2">
                      {Object.entries(data.details).map(([metric, value]) => (
                        <div key={metric} className="flex justify-between text-sm">
                          <span className="text-gray-600 dark:text-gray-300 capitalize">
                            {metric.replace(/([A-Z])/g, ' $1').toLowerCase()}
                          </span>
                          <span className="font-medium">
                            {typeof value === 'number' ? value.toFixed(1) : value}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 text-center">
                <div className={`inline-block px-4 py-2 rounded-lg ${getScoreBgColor(selectedSite.score.total)}`}>
                  <span className="text-sm font-medium text-gray-700">
                    Final Score: 
                  </span>
                  <span className={`text-xl font-bold ml-2 ${getScoreColor(selectedSite.score.total)}`}>
                    {selectedSite.score.total}
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
