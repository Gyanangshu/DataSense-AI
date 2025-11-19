import { nanoid } from 'nanoid'

/**
 * Generate a secure, URL-friendly slug for shared analyses
 * Uses nanoid for cryptographically secure random IDs
 */
export function generateSlug(length: number = 12): string {
  // Use URL-safe characters (A-Za-z0-9_-)
  return nanoid(length)
}

/**
 * Generate a custom slug from a name with fallback to random
 */
export function generateCustomSlug(name: string, fallbackLength: number = 8): string {
  // Convert name to URL-friendly format
  const baseSlug = name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove non-word chars except spaces and hyphens
    .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with hyphens
    .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens

  // Add random suffix for uniqueness
  const suffix = nanoid(fallbackLength)

  return `${baseSlug}-${suffix}`
}
