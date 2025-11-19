/**
 * Lookup geographic information from IP address
 * Uses free geoip-lite database (no API calls required)
 *
 * Note: geoip-lite has issues on Windows with data file paths
 * This function handles errors gracefully and returns null values if lookup fails
 */
export function lookupGeoLocation(ip: string): {
  country: string | null
  city: string | null
  region: string | null
} {
  // Skip lookup for unknown or local IPs
  if (ip === 'unknown' || ip.startsWith('127.') || ip.startsWith('192.168.') || ip.startsWith('10.')) {
    return {
      country: null,
      city: null,
      region: null
    }
  }

  try {
    // Dynamically import geoip-lite to catch initialization errors
    const geoip = require('geoip-lite')
    const geo = geoip.lookup(ip)

    if (!geo) {
      return {
        country: null,
        city: null,
        region: null
      }
    }

    return {
      country: geo.country || null,
      city: geo.city || null,
      region: geo.region || null
    }
  } catch (error) {
    // Silently handle geoip-lite errors (common on Windows/dev environments)
    // Analytics will still work, just without geographic data
    console.warn('[GeoIP] Lookup failed (this is normal in dev):', error instanceof Error ? error.message : error)
    return {
      country: null,
      city: null,
      region: null
    }
  }
}
