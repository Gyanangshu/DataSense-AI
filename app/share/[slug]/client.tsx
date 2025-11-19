'use client'

import { useState, useEffect, useRef } from 'react'
import { Loader2 } from 'lucide-react'
import PublicCorrelationView from '@/components/share/PublicCorrelationView'
import PasswordProtectionModal from '@/components/share/PasswordProtectionModal'

interface PublicShareClientProps {
  slug: string
  shareType: string
  isPasswordProtected: boolean
  initialData: any
  brandingConfig: any
  viewCount: number
}

export default function PublicShareClient({
  slug,
  shareType,
  isPasswordProtected,
  initialData,
  brandingConfig,
  viewCount: initialViewCount
}: PublicShareClientProps) {
  const [isVerifying, setIsVerifying] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState(initialData)
  const [viewCount, setViewCount] = useState(initialViewCount)
  const [isUnlocked, setIsUnlocked] = useState(!isPasswordProtected)
  const startTimeRef = useRef<number>(Date.now())

  // Track time spent and send beacon on unmount
  useEffect(() => {
    if (!isUnlocked || !data) return

    const trackTimeSpent = () => {
      const timeSpent = Math.floor((Date.now() - startTimeRef.current) / 1000) // seconds

      // Send beacon (works even when page is closing)
      // Use Blob with correct content-type for proper JSON parsing
      const beaconData = new Blob(
        [JSON.stringify({ slug, timeSpent })],
        { type: 'application/json' }
      )

      if (navigator.sendBeacon) {
        const success = navigator.sendBeacon('/api/share/track-time', beaconData)
        if (!success) {
          console.warn('[Analytics] Beacon send failed, trying fetch')
          // Fallback to fetch if beacon fails
          fetch('/api/share/track-time', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ slug, timeSpent }),
            keepalive: true // Important for requests during page unload
          }).catch(() => {
            // Ignore errors - tracking is optional
          })
        }
      }
    }

    // Track on unmount
    return () => {
      trackTimeSpent()
    }
  }, [slug, isUnlocked, data])

  const handlePasswordSubmit = async (password: string) => {
    setIsVerifying(true)
    setError(null)

    try {
      // Verify password
      const verifyRes = await fetch('/api/share/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, password })
      })

      if (!verifyRes.ok) {
        const errorData = await verifyRes.json()
        setError(errorData.error || 'Verification failed')
        setIsVerifying(false)
        return
      }

      // Fetch data
      const dataRes = await fetch(`/api/share/${slug}`)
      if (!dataRes.ok) {
        setError('Failed to load analysis')
        setIsVerifying(false)
        return
      }

      const result = await dataRes.json()
      setData(result.data)
      setViewCount(result.viewCount)
      setIsUnlocked(true)
    } catch (err) {
      setError('An error occurred. Please try again.')
    } finally {
      setIsVerifying(false)
    }
  }

  // Show password modal if password protected and not unlocked
  if (isPasswordProtected && !isUnlocked) {
    return (
      <PasswordProtectionModal
        onSubmit={handlePasswordSubmit}
        isVerifying={isVerifying}
        error={error}
        brandingConfig={brandingConfig}
      />
    )
  }

  // Show loading if data is being fetched
  if (!data) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  // Render based on share type
  if (shareType === 'correlation') {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <PublicCorrelationView
            data={data}
            brandingConfig={brandingConfig}
          />
        </div>
      </div>
    )
  }

  // TODO: Add dashboard view component
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <h2 className="text-2xl font-bold">Dashboard View Coming Soon</h2>
        <p className="text-muted-foreground mt-2">
          Public dashboard sharing will be available in the next update.
        </p>
      </div>
    </div>
  )
}
