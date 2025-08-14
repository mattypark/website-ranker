import { z } from 'zod'

const envSchema = z.object({
  // Database
  DATABASE_URL: z.string().url('DATABASE_URL must be a valid URL'),
  
  // Redis
  REDIS_URL: z.string().url('REDIS_URL must be a valid URL').optional(),
  
  // API Keys
  GOOGLE_PAGESPEED_API_KEY: z.string().min(1, 'GOOGLE_PAGESPEED_API_KEY is required'),
  GOOGLE_SEARCH_ENGINE_ID: z.string().min(1, 'GOOGLE_SEARCH_ENGINE_ID is required'),
  GOOGLE_SEARCH_API_KEY: z.string().min(1, 'GOOGLE_SEARCH_API_KEY is required'),
  OPEN_PAGERANK_API_KEY: z.string().min(1, 'OPEN_PAGERANK_API_KEY is required'),
  
  // App Configuration
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  NEXTAUTH_SECRET: z.string().optional(),
  NEXTAUTH_URL: z.string().url().optional(),
})

export type Env = z.infer<typeof envSchema>

let env: Env

// Only validate environment variables at runtime, not during build
if (typeof window === 'undefined' && process.env.NODE_ENV !== 'production') {
  try {
    env = envSchema.parse(process.env)
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.issues.map(issue => issue.path.join('.')).join(', ')
      console.warn(`⚠️ Missing environment variables during build: ${missingVars}`)
      console.warn('This is normal during build time. Make sure to set them in production.')
    }
    // Create a default env object for build time
    env = {
      DATABASE_URL: 'postgresql://localhost:5432/webscraper',
      GOOGLE_PAGESPEED_API_KEY: 'build-time-placeholder',
      GOOGLE_SEARCH_ENGINE_ID: 'build-time-placeholder',
      GOOGLE_SEARCH_API_KEY: 'build-time-placeholder',
      OPEN_PAGERANK_API_KEY: 'build-time-placeholder',
      NODE_ENV: 'development' as const,
    }
  }
} else {
  // In production, always validate
  try {
    env = envSchema.parse(process.env)
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.issues.map(issue => issue.path.join('.')).join(', ')
      console.error(`❌ Missing or invalid environment variables: ${missingVars}`)
      console.error('Please check your .env file and ensure all required variables are set.')
    }
    throw new Error('Invalid environment variables')
  }
}

export { env }