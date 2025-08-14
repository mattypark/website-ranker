import { Queue, Worker } from 'bullmq'
import { redisConnection } from './redis'

// Job types
export interface SiteAnalysisJob {
  url: string
  runId: string
  category: string
}

// Queue for site analysis jobs (only if Redis is configured)
export const siteAnalysisQueue = redisConnection 
  ? new Queue('site-analysis', {
      connection: typeof redisConnection === 'string' 
        ? redisConnection 
        : redisConnection,
      defaultJobOptions: {
        removeOnComplete: 10, // Keep 10 completed jobs
        removeOnFail: 50, // Keep 50 failed jobs
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
      },
    })
  : null

// Worker to process site analysis jobs
// TODO: Set up worker in a separate process or serverless function
export function createSiteAnalysisWorker() {
  if (!redisConnection) {
    throw new Error('Redis connection required for workers')
  }
  
  return new Worker(
    'site-analysis',
    async (job) => {
      const { url, runId, category } = job.data as SiteAnalysisJob
      
      // TODO: Implement actual site analysis processing
      // This would include:
      // 1. Fetch site data
      // 2. Run performance analysis
      // 3. Calculate scores
      // 4. Store results in database
      
      console.log(`Processing site analysis for ${url} (run: ${runId})`)
      
      // Mock processing time
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      return { url, status: 'completed' }
    },
    {
      connection: typeof redisConnection === 'string' 
        ? redisConnection 
        : redisConnection,
      concurrency: 5, // Process 5 jobs concurrently
    }
  )
}

// Helper function to add site analysis job
export async function addSiteAnalysisJob(data: SiteAnalysisJob) {
  if (!siteAnalysisQueue) {
    throw new Error('Redis queue not configured')
  }
  
  return await siteAnalysisQueue.add('analyze-site', data, {
    priority: 1,
    delay: 0,
  })
}

// Helper function to get queue status
export async function getQueueStatus() {
  if (!siteAnalysisQueue) {
    return {
      waiting: 0,
      active: 0,
      completed: 0,
      failed: 0,
    }
  }
  
  const waiting = await siteAnalysisQueue.getWaiting()
  const active = await siteAnalysisQueue.getActive()
  const completed = await siteAnalysisQueue.getCompleted()
  const failed = await siteAnalysisQueue.getFailed()
  
  return {
    waiting: waiting.length,
    active: active.length,
    completed: completed.length,
    failed: failed.length,
  }
}
