// Simple cache utilities with optional Redis support
// Falls back to in-memory cache if Redis is not available

interface CacheItem {
  value: any
  expiresAt: number
}

// In-memory cache fallback
const memoryCache = new Map<string, CacheItem>()

export async function get<T>(key: string): Promise<T | null> {
  try {
    // Try Redis first if available
    if (process.env.REDIS_URL) {
      // TODO: Implement Redis get
      // const redis = new Redis(process.env.REDIS_URL)
      // const value = await redis.get(key)
      // return value ? JSON.parse(value) : null
    }
    
    // Fall back to memory cache
    const item = memoryCache.get(key)
    if (!item) return null
    
    if (Date.now() > item.expiresAt) {
      memoryCache.delete(key)
      return null
    }
    
    return item.value
  } catch (error) {
    console.error('Cache get error:', error)
    return null
  }
}

export async function set(key: string, value: any, ttlSeconds: number = 3600): Promise<void> {
  try {
    // Try Redis first if available
    if (process.env.REDIS_URL) {
      // TODO: Implement Redis set
      // const redis = new Redis(process.env.REDIS_URL)
      // await redis.setex(key, ttlSeconds, JSON.stringify(value))
      // return
    }
    
    // Fall back to memory cache
    memoryCache.set(key, {
      value,
      expiresAt: Date.now() + (ttlSeconds * 1000)
    })
  } catch (error) {
    console.error('Cache set error:', error)
  }
}

export function createCacheKey(prefix: string, ...parts: string[]): string {
  return `${prefix}:${parts.join(':')}`
}

// Clean up expired memory cache entries periodically
setInterval(() => {
  const now = Date.now()
  for (const [key, item] of memoryCache.entries()) {
    if (now > item.expiresAt) {
      memoryCache.delete(key)
    }
  }
}, 5 * 60 * 1000) // Every 5 minutes
