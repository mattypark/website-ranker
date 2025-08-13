import { Redis } from '@upstash/redis'
import { env } from './env'

// Initialize Redis client (optional for development)
export const redis = env.REDIS_URL 
  ? env.REDIS_URL.startsWith('redis://')
    ? // Traditional Redis connection (for BullMQ compatibility)
      null // We'll handle this in the queue setup
    : // Upstash Redis REST API
      new Redis({
        url: env.REDIS_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN || '',
      })
  : null

// For BullMQ, we need a traditional Redis connection
export const redisConnection = env.REDIS_URL && env.REDIS_URL.startsWith('redis://')
  ? env.REDIS_URL
  : null

// Cache keys
export const CACHE_KEYS = {
  SITE_ANALYSIS: (url: string) => `site:analysis:${url}`,
  RUN_RESULTS: (runId: string) => `run:results:${runId}`,
  TOP_SITES: (category: string) => `top:sites:${category}`,
} as const

// Cache TTL (Time To Live) in seconds
export const CACHE_TTL = {
  SITE_ANALYSIS: 60 * 60 * 24, // 24 hours
  RUN_RESULTS: 60 * 60 * 24 * 7, // 7 days
  TOP_SITES: 60 * 60, // 1 hour
} as const
