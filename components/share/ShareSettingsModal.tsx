'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Copy, Check, Lock, Globe, Calendar, Palette, X } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import BrandingEditor from './BrandingEditor'
import AnalyticsDashboard from '../analytics/AnalyticsDashboard'

interface ShareSettingsModalProps {
  isOpen: boolean
  onClose: () => void
  shareType: 'correlation' | 'dashboard'
  resourceId: string
  resourceName: string
  existingShare?: {
    id: string
    slug: string
    shareMode: string
    expiresAt: Date | null
    brandingConfig: any
  } | null
}

export default function ShareSettingsModal({
  isOpen,
  onClose,
  shareType,
  resourceId,
  resourceName,
  existingShare
}: ShareSettingsModalProps) {
  const router = useRouter()
  const [isCreating, setIsCreating] = useState(false)
  const [shareMode, setShareMode] = useState<'public' | 'private'>(
    existingShare?.shareMode as 'public' | 'private' || 'public'
  )
  const [password, setPassword] = useState('')
  const [usePassword, setUsePassword] = useState(!!existingShare?.id || false)
  const [expiresAt, setExpiresAt] = useState<string>('')
  const [useExpiration, setUseExpiration] = useState(!!existingShare?.expiresAt || false)
  const [brandingConfig, setBrandingConfig] = useState(existingShare?.brandingConfig || null)
  const [shareUrl, setShareUrl] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (existingShare) {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin
      setShareUrl(`${baseUrl}/share/${existingShare.slug}`)
    }
  }, [existingShare])

  const handleCreateShare = async () => {
    setIsCreating(true)

    try {
      const response = await fetch('/api/share/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shareType,
          resourceId,
          shareMode,
          password: usePassword ? password : null,
          expiresAt: useExpiration ? expiresAt : null,
          brandingConfig
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create share')
      }

      const data = await response.json()
      setShareUrl(data.share.shareUrl)
      toast.success('Share link created successfully!')
      router.refresh()
    } catch (error) {
      console.error('Share creation error:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to create share')
    } finally {
      setIsCreating(false)
    }
  }

  const handleCopyLink = async () => {
    if (!shareUrl) return

    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      toast.success('Link copied to clipboard!')
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      toast.error('Failed to copy link')
    }
  }

  const handleRevokeShare = async () => {
    if (!existingShare) return

    if (!confirm('Are you sure you want to revoke this share link? It will no longer be accessible.')) {
      return
    }

    try {
      const response = await fetch(`/api/share/${existingShare.slug}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('Failed to revoke share')
      }

      toast.success('Share link revoked successfully')
      router.refresh()
      onClose()
    } catch (error) {
      toast.error('Failed to revoke share')
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Globe className="w-5 h-5" />
            Share "{resourceName}"
          </DialogTitle>
          <DialogDescription>
            Create a shareable link for this {shareType}. Configure access settings and branding.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="settings" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="settings">Share Settings</TabsTrigger>
            <TabsTrigger value="branding">Branding</TabsTrigger>
            {existingShare && <TabsTrigger value="analytics">Analytics</TabsTrigger>}
          </TabsList>

          <TabsContent value="settings" className="space-y-6 mt-4">
            {/* Share URL Display */}
            {shareUrl && (
              <div className="space-y-2">
                <Label>Share Link</Label>
                <div className="flex gap-2">
                  <Input
                    value={shareUrl}
                    readOnly
                    className="font-mono text-sm"
                  />
                  <Button
                    onClick={handleCopyLink}
                    variant="outline"
                    size="icon"
                  >
                    {copied ? (
                      <Check className="w-4 h-4 text-green-600" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>
            )}

            {/* Share Mode */}
            <div className="space-y-3">
              <Label>Visibility</Label>
              <div className="flex gap-3">
                <Button
                  variant={shareMode === 'public' ? 'default' : 'outline'}
                  onClick={() => {
                    setShareMode('public')
                    setUsePassword(false) // Automatically disable password for public links
                    setPassword('')
                  }}
                  className="flex-1"
                  disabled={!!existingShare}
                >
                  <Globe className="w-4 h-4 mr-2" />
                  Public
                </Button>
                <Button
                  variant={shareMode === 'private' ? 'default' : 'outline'}
                  onClick={() => setShareMode('private')}
                  className="flex-1"
                  disabled={!!existingShare}
                >
                  <Lock className="w-4 h-4 mr-2" />
                  Private
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                {shareMode === 'public'
                  ? 'Anyone with the link can view this analysis'
                  : 'Requires password authentication for access'}
              </p>
            </div>

            {/* Password Protection - Only shown for Private links */}
            {shareMode === 'private' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password-toggle">Password Protection</Label>
                  <Switch
                    id="password-toggle"
                    checked={usePassword}
                    onCheckedChange={setUsePassword}
                    disabled={!!existingShare}
                  />
                </div>
                {usePassword && (
                  <div>
                    <Input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter password"
                      disabled={!!existingShare}
                    />
                    <p className="text-sm text-muted-foreground mt-2">
                      Viewers will need this password to access the analysis
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Expiration */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="expiration-toggle">Link Expiration</Label>
                <Switch
                  id="expiration-toggle"
                  checked={useExpiration}
                  onCheckedChange={setUseExpiration}
                  disabled={!!existingShare}
                />
              </div>
              {useExpiration && (
                <div>
                  <Input
                    type="datetime-local"
                    value={expiresAt}
                    onChange={(e) => setExpiresAt(e.target.value)}
                    disabled={!!existingShare}
                    min={new Date().toISOString().slice(0, 16)}
                  />
                  <p className="text-sm text-muted-foreground mt-2">
                    The link will stop working after this date
                  </p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="branding" className="mt-4">
            <BrandingEditor
              brandingConfig={brandingConfig}
              onChange={setBrandingConfig}
              disabled={!!existingShare}
            />
          </TabsContent>

          {existingShare && (
            <TabsContent value="analytics" className="mt-4">
              <AnalyticsDashboard shareId={existingShare.id} />
            </TabsContent>
          )}
        </Tabs>

        <DialogFooter className="flex gap-2">
          {existingShare ? (
            <>
              <Button variant="destructive" onClick={handleRevokeShare}>
                Revoke Access
              </Button>
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button
                onClick={handleCreateShare}
                disabled={isCreating || (usePassword && !password.trim())}
              >
                {isCreating ? 'Creating...' : 'Create Share Link'}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
