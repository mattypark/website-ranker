// Job types
export interface SiteAnalysisJob {
  url: string
  runId: string
  category: string
}

// Queue disabled for MVP - using direct processing instead
export const siteAnalysisQueue = null

// Worker disabled for MVP
export function createSiteAnalysisWorker() {
  throw new Error('Background workers not configured in MVP')
}

// Helper function to add site analysis job (disabled for MVP)
export async function addSiteAnalysisJob(data: SiteAnalysisJob) {
  throw new Error('Background jobs not configured in MVP')
}

// Helper function to get queue status (disabled for MVP)
export async function getQueueStatus() {
  return {
    waiting: 0,
    active: 0,
    completed: 0,
    failed: 0,
  }
}
