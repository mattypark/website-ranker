'use client'

import { useState } from 'react'
import { Search, TrendingUp, Award, Clock, Sparkles } from 'lucide-react'

export default function Home() {
  const [niche, setNiche] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleGenerateRankings = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isLoading) return

    // Default to "study" if input is empty, otherwise use user's text exactly
    const targetNiche = niche.trim() || 'study'
    
    setIsLoading(true)
    
    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          niche: targetNiche
        })
      })

      const data = await response.json()
      
      if (data.success) {
        // Redirect to results page with run and niche parameters
        window.location.href = `/results?run=${data.runId}&niche=${data.nicheSlug}`
      } else {
        console.error('Failed to generate rankings:', data.error)
        alert(data.error || 'Failed to generate rankings. Please try again.')
      }
    } catch (error) {
      console.error('Error:', error)
      alert('An error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleExampleClick = (exampleNiche: string) => {
    setNiche(exampleNiche)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <TrendingUp className="h-8 w-8 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              NicheRank
            </h1>
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Discover the top websites in any niche
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto text-center">
          {/* Hero Section */}
          <div className="mb-12">
            <h2 className="text-5xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
              Top 10 Websites
              <span className="text-blue-600 block">For Any Niche</span>
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
              Enter any niche or topic to discover the highest-ranked websites based on 
              search presence, performance, authority, freshness, and usability.
            </p>
          </div>

          {/* Niche Input Form */}
          <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-xl mb-12">
            <form onSubmit={handleGenerateRankings} className="space-y-6">
              <div>
                <label htmlFor="niche" className="block text-lg font-medium text-gray-900 dark:text-white mb-3">
                  What niche do you want to explore?
                </label>
                <div className="relative">
                  <input
                    id="niche"
                    type="text"
                    value={niche}
                    onChange={(e) => setNiche(e.target.value)}
                    placeholder="e.g., fitness apps, healthy recipes, programming blogs..."
                    maxLength={60}
                    className="w-full px-4 py-3 text-lg border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                  <div className="absolute right-3 top-3">
                    <Sparkles className="h-6 w-6 text-gray-400" />
                  </div>
                </div>
                <div className="flex justify-between items-center mt-2">
                  <p className="text-sm text-gray-500">
                    Leave empty to explore study websites (default)
                  </p>
                  <span className="text-sm text-gray-400">
                    {niche.length}/60
                  </span>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-4 px-8 rounded-lg text-lg transition-colors duration-200 inline-flex items-center justify-center space-x-2"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Discovering Top Websites...</span>
                  </>
                ) : (
                  <>
                    <Search className="h-5 w-5" />
                    <span>Find Top 10 Websites</span>
                  </>
                )}
              </button>
            </form>

            {/* Example Niches */}
            <div className="mt-6">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                Try these popular niches:
              </p>
              <div className="flex flex-wrap gap-2 justify-center">
                {[
                  'fitness apps',
                  'healthy recipes',
                  'programming blogs',
                  'productivity tools',
                  'design resources',
                  'travel guides'
                ].map((example) => (
                  <button
                    key={example}
                    type="button"
                    onClick={() => handleExampleClick(example)}
                    className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-full transition-colors"
                  >
                    {example}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Features */}
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
              <Search className="h-12 w-12 text-blue-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Smart Discovery
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                We search multiple angles to find the best websites in your niche
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
              <Award className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                5-Factor Scoring
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Search presence, performance, authority, freshness, and usability
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
              <Clock className="h-12 w-12 text-purple-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Real-Time Results
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Fresh rankings generated on-demand with intelligent caching
              </p>
            </div>
          </div>

          {/* Additional Info */}
          <div className="mt-12 text-center">
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              Our algorithm analyzes search presence (40%), performance (25%), authority (15%), 
              freshness (10%), and usability (10%) to rank the best websites in any niche.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-8 mt-16 border-t border-gray-200 dark:border-gray-700">
        <div className="text-center text-gray-500 dark:text-gray-400">
          <p>&copy; 2024 NicheRank. Discover the best websites in any niche.</p>
        </div>
      </footer>
    </div>
  )
}
