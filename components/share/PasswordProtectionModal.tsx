'use client'

import { useState } from 'react'
import { Lock } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'

interface PasswordProtectionModalProps {
  onSubmit: (password: string) => void
  isVerifying: boolean
  error: string | null
  brandingConfig?: {
    logo?: string
    companyName?: string
  }
}

export default function PasswordProtectionModal({
  onSubmit,
  isVerifying,
  error,
  brandingConfig
}: PasswordProtectionModalProps) {
  const [password, setPassword] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(password)
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          {brandingConfig?.logo && (
            <div className="flex justify-center mb-4">
              <img
                src={brandingConfig.logo}
                alt={brandingConfig.companyName || 'Logo'}
                className="h-12 object-contain"
              />
            </div>
          )}
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-primary/10 rounded-full">
              <Lock className="w-8 h-8 text-primary" />
            </div>
          </div>
          <CardTitle>Password Protected</CardTitle>
          <CardDescription>
            This analysis is password protected. Please enter the password to view.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                disabled={isVerifying}
                className="mt-2"
                autoFocus
              />
              {error && (
                <p className="text-sm text-destructive mt-2">{error}</p>
              )}
            </div>
            <Button
              type="submit"
              className="w-full"
              disabled={!password.trim() || isVerifying}
            >
              {isVerifying ? 'Verifying...' : 'Unlock'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
