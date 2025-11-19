'use client'

import { useState, useEffect } from 'react'
import { Share2, Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import ShareSettingsModal from './ShareSettingsModal'

interface ShareButtonProps {
  shareType: 'correlation' | 'dashboard'
  resourceId: string
  resourceName: string
  variant?: 'default' | 'outline' | 'ghost'
  size?: 'default' | 'sm' | 'lg' | 'icon'
}

export default function ShareButton({
  shareType,
  resourceId,
  resourceName,
  variant = 'outline',
  size = 'default'
}: ShareButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [existingShare, setExistingShare] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check if this resource is already shared
    fetchExistingShare()
  }, [resourceId])

  const fetchExistingShare = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/share/list?resourceId=${resourceId}`)
      if (response.ok) {
        const data = await response.json()
        setExistingShare(data.share || null)
      }
    } catch (error) {
      console.error('Failed to fetch existing share:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleClick = () => {
    setIsOpen(true)
  }

  const handleClose = () => {
    setIsOpen(false)
    // Refresh share status
    fetchExistingShare()
  }

  return (
    <>
      <div className="relative">
        <Button
          variant={variant}
          size={size}
          onClick={handleClick}
          disabled={isLoading}
        >
          <Share2 className="w-4 h-4 mr-2" />
          {existingShare ? 'Manage Share' : 'Share'}
        </Button>
        {existingShare && (
          <Badge
            variant="secondary"
            className="absolute -top-2 -right-2 h-5 px-1.5 text-xs flex items-center gap-1"
          >
            <Eye className="w-3 h-3" />
            {existingShare.viewCount}
          </Badge>
        )}
      </div>

      <ShareSettingsModal
        isOpen={isOpen}
        onClose={handleClose}
        shareType={shareType}
        resourceId={resourceId}
        resourceName={resourceName}
        existingShare={existingShare}
      />
    </>
  )
}
