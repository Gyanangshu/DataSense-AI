import { UAParser } from 'ua-parser-js'

/**
 * Detect device type from user agent
 */
export function detectDeviceType(userAgent: string): 'mobile' | 'tablet' | 'desktop' {
  const parser = new UAParser(userAgent)
  const device = parser.getDevice()

  if (device.type === 'mobile') return 'mobile'
  if (device.type === 'tablet') return 'tablet'
  return 'desktop'
}

/**
 * Parse user agent to get browser and OS information
 */
export function parseUserAgent(userAgent: string) {
  const parser = new UAParser(userAgent)

  return {
    browser: {
      name: parser.getBrowser().name || 'Unknown',
      version: parser.getBrowser().version || ''
    },
    os: {
      name: parser.getOS().name || 'Unknown',
      version: parser.getOS().version || ''
    },
    device: {
      type: detectDeviceType(userAgent),
      vendor: parser.getDevice().vendor || '',
      model: parser.getDevice().model || ''
    }
  }
}
