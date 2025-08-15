import { NextRequest } from 'next/server'

// Simple in-memory rate limiter for development
// In production, you'd use Redis or another persistent store
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()

export function rateLimit(request: NextRequest, limit: number = 3, windowMs: number = 60000): boolean {
  const ip = request.ip || request.headers.get('x-forwarded-for') || 'unknown'
  const now = Date.now()
  
  // Clean up old entries
  for (const [key, value] of rateLimitMap.entries()) {
    if (now > value.resetTime) {
      rateLimitMap.delete(key)
    }
  }
  
  const current = rateLimitMap.get(ip)
  
  if (!current) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + windowMs })
    return true
  }
  
  if (now > current.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + windowMs })
    return true
  }
  
  if (current.count >= limit) {
    return false
  }
  
  current.count++
  return true
}
