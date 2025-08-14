// Queue functionality disabled for build compatibility
// TODO: Re-enable when Redis/BullMQ configuration is properly set up

export interface SiteAnalysisJob {
  url: string
  runId: string
  category: string
}

export const siteAnalysisQueue = null

export function createSiteAnalysisWorker() {
  throw new Error('Queue functionality is disabled')
}

export async function addSiteAnalysisJob(data: SiteAnalysisJob) {
  throw new Error('Queue functionality is disabled')
}

export async function getQueueStatus() {
  return {
    waiting: 0,
    active: 0,
    completed: 0,
    failed: 0,
  }
}
