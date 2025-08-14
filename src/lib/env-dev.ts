import { z } from 'zod'

const envSchema = z.object({
  // Database (optional for development)
  DATABASE_URL: z.string().url('DATABASE_URL must be a valid URL').optional(),
  
  // Redis (optional)
  REDIS_URL: z.string().url('REDIS_URL must be a valid URL').optional(),
  
  // API Keys (optional for development - will use mock data if not provided)
  GOOGLE_PAGESPEED_API_KEY: z.string().optional(),
  GOOGLE_SEARCH_ENGINE_ID: z.string().optional(),
  GOOGLE_SEARCH_API_KEY: z.string().optional(),
  OPEN_PAGERANK_API_KEY: z.string().optional(),
  
  // App Configuration
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  NEXTAUTH_SECRET: z.string().optional(),
  NEXTAUTH_URL: z.string().url().optional(),
})

export type Env = z.infer<typeof envSchema>

let env: Env

try {
  env = envSchema.parse(process.env)
} catch (error) {
  if (error instanceof z.ZodError) {
    console.warn('⚠️  Some environment variables are missing. Using development defaults.')
    console.warn('Missing variables:', error.issues.map(issue => issue.path.join('.')).join(', '))
  }
  
  // Use defaults for development
  env = {
    NODE_ENV: 'development',
    NEXTAUTH_URL: 'http://localhost:3000',
  } as Env
}

export { env }
