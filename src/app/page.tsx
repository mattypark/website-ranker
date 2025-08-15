'use client'

import { useState, useEffect } from 'react'
import { Search, TrendingUp, Award, Clock } from 'lucide-react'

export default function Home() {
  const [isLoading, setIsLoading] = useState(false)

  const handleGenerateRankings = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          category: 'study',
          limit: 10
        })
      })

      const data = await response.json()
      
      if (data.success) {
        // Redirect to results page with run ID
        window.location.href = `/results?runId=${data.runId}`
      } else {
        console.error('Failed to generate rankings:', data.error)
        alert('Failed to generate rankings. Please try again.')
      }
    } catch (error) {
      console.error('Error:', error)
      alert('An error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <TrendingUp className="h-8 w-8 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              StudyRank
            </h1>
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Discover the best study websites
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto text-center">
          {/* Hero Section */}
          <div className="mb-12">
            <h2 className="text-5xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
              Top 10 Study
              <span className="text-blue-600 block">Websites</span>
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
              Discover the highest-ranked study websites based on performance, authority, 
              content freshness, and trust signals. Updated regularly with comprehensive analysis.
            </p>
          </div>

          {/* Features */}
          <div className="grid md:grid-cols-3 gap-8 mb-12">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
              <Search className="h-12 w-12 text-blue-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Comprehensive Analysis
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                We analyze performance, authority, freshness, and trust signals to rank websites
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
              <Award className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Quality Rankings
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Only the best study websites make it to our top 10 list
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
              <Clock className="h-12 w-12 text-purple-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Fresh Data
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Rankings are updated regularly to ensure accuracy and relevance
              </p>
            </div>
          </div>

          {/* CTA Button */}
          <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-xl">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Ready to discover the best study websites?
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Click below to generate the latest rankings of top study websites
            </p>
            <button
              onClick={handleGenerateRankings}
              disabled={isLoading}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-4 px-8 rounded-lg text-lg transition-colors duration-200 inline-flex items-center space-x-2"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Analyzing Websites...</span>
                </>
              ) : (
                <>
                  <Search className="h-5 w-5" />
                  <span>See the Top Study Websites</span>
                </>
              )}
            </button>
          </div>

          {/* Additional Info */}
          <div className="mt-12 text-center">
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              Our algorithm analyzes website performance, domain authority, content freshness, 
              and trust signals to provide you with the most reliable study resources.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-8 mt-16 border-t border-gray-200 dark:border-gray-700">
        <div className="text-center text-gray-500 dark:text-gray-400">
          <p>&copy; 2024 StudyRank. Helping students find the best learning resources.</p>
        </div>
      </footer>
    </div>
  )
}