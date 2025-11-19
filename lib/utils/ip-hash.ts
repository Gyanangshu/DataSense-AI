import { createHash } from 'crypto'

/**
 * Hash an IP address for privacy-compliant analytics
 * Uses SHA-256 to create a one-way hash
 * GDPR-compliant as original IP cannot be recovered
 */
export function hashIP(ip: string): string {
  // Add a salt for additional security (you can make this configurable via env)
  const salt = process.env.IP_HASH_SALT || 'datasense-ai-analytics-salt'

  return createHash('sha256')
    .update(`${ip}${salt}`)
    .digest('hex')
}

/**
 * Extract client IP from request headers
 * Handles various proxy scenarios (Vercel, Cloudflare, etc.)
 */
export function getClientIP(request: Request): string {
  // Try various headers in order of reliability
  const forwardedFor = request.headers.get('x-forwarded-for')
  const realIP = request.headers.get('x-real-ip')
  const cfConnectingIP = request.headers.get('cf-connecting-ip')

  if (cfConnectingIP) return cfConnectingIP
  if (realIP) return realIP
  if (forwardedFor) {
    // x-forwarded-for can contain multiple IPs, take the first one
    return forwardedFor.split(',')[0].trim()
  }

  // Fallback
  return 'unknown'
}
