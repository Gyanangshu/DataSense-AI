'use client'

import { useState, useRef } from 'react'
import { Upload, X } from 'lucide-react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

interface BrandingEditorProps {
  brandingConfig: {
    logo?: string
    primaryColor?: string
    secondaryColor?: string
    companyName?: string
  } | null
  onChange: (config: any) => void
  disabled?: boolean
}

export default function BrandingEditor({
  brandingConfig,
  onChange,
  disabled = false
}: BrandingEditorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [logo, setLogo] = useState(brandingConfig?.logo || '')
  const [primaryColor, setPrimaryColor] = useState(brandingConfig?.primaryColor || '#3b82f6')
  const [secondaryColor, setSecondaryColor] = useState(brandingConfig?.secondaryColor || '#8b5cf6')
  const [companyName, setCompanyName] = useState(brandingConfig?.companyName || '')
  const [isDragging, setIsDragging] = useState(false)

  const processFile = (file: File) => {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file')
      return
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      alert('Image must be smaller than 2MB')
      return
    }

    // Convert to base64
    const reader = new FileReader()
    reader.onloadend = () => {
      const base64 = reader.result as string
      setLogo(base64)
      updateConfig({ logo: base64 })
    }
    reader.readAsDataURL(file)
  }

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) processFile(file)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!disabled) setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    if (disabled) return

    const file = e.dataTransfer.files?.[0]
    if (file) processFile(file)
  }

  const handleBoxClick = () => {
    if (!disabled) {
      fileInputRef.current?.click()
    }
  }

  const handleRemoveLogo = () => {
    setLogo('')
    updateConfig({ logo: '' })
  }

  const updateConfig = (updates: Partial<typeof brandingConfig>) => {
    const newConfig = {
      logo,
      primaryColor,
      secondaryColor,
      companyName,
      ...updates
    }
    onChange(newConfig)
  }

  return (
    <div className="space-y-6">
      <div>
        <Label>Company Logo</Label>
        <p className="text-sm text-muted-foreground mb-3">
          Upload a logo to display on your shared analysis (max 2MB)
        </p>

        {logo ? (
          <div className="space-y-2">
            <div className="relative inline-block">
              <img
                src={logo}
                alt="Company Logo"
                className="h-20 object-contain border border-border rounded-lg p-2"
              />
              {!disabled && (
                <Button
                  size="icon"
                  variant="destructive"
                  className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                  onClick={handleRemoveLogo}
                >
                  <X className="w-3 h-3" />
                </Button>
              )}
            </div>
          </div>
        ) : (
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
              isDragging
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-primary/50 hover:bg-accent/50'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={handleBoxClick}
          >
            <Upload className={`w-10 h-10 mx-auto mb-3 ${isDragging ? 'text-primary' : 'text-muted-foreground'}`} />
            <p className="text-sm font-medium mb-1">
              Click to upload or drag and drop
            </p>
            <p className="text-xs text-muted-foreground">
              PNG, JPG, SVG up to 2MB
            </p>
            <Input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleLogoUpload}
              disabled={disabled}
              className="hidden"
            />
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="companyName">Company Name</Label>
        <Input
          id="companyName"
          value={companyName}
          onChange={(e) => {
            setCompanyName(e.target.value)
            updateConfig({ companyName: e.target.value })
          }}
          placeholder="e.g., Acme Corporation"
          disabled={disabled}
        />
        <p className="text-sm text-muted-foreground">
          Will be displayed in the footer of shared pages
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="primaryColor">Primary Color</Label>
          <div className="flex gap-2">
            <Input
              id="primaryColor"
              type="color"
              value={primaryColor}
              onChange={(e) => {
                setPrimaryColor(e.target.value)
                updateConfig({ primaryColor: e.target.value })
              }}
              disabled={disabled}
              className="w-16 h-10 p-1 cursor-pointer"
            />
            <Input
              value={primaryColor}
              onChange={(e) => {
                setPrimaryColor(e.target.value)
                updateConfig({ primaryColor: e.target.value })
              }}
              placeholder="#3b82f6"
              disabled={disabled}
              className="flex-1 font-mono text-sm"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="secondaryColor">Secondary Color</Label>
          <div className="flex gap-2">
            <Input
              id="secondaryColor"
              type="color"
              value={secondaryColor}
              onChange={(e) => {
                setSecondaryColor(e.target.value)
                updateConfig({ secondaryColor: e.target.value })
              }}
              disabled={disabled}
              className="w-16 h-10 p-1 cursor-pointer"
            />
            <Input
              value={secondaryColor}
              onChange={(e) => {
                setSecondaryColor(e.target.value)
                updateConfig({ secondaryColor: e.target.value })
              }}
              placeholder="#8b5cf6"
              disabled={disabled}
              className="flex-1 font-mono text-sm"
            />
          </div>
        </div>
      </div>

      <div className="bg-muted p-4 rounded-lg">
        <p className="text-sm font-medium mb-2">Preview</p>
        <div className="bg-background p-4 rounded border border-border">
          <div className="flex items-center gap-3">
            {logo && (
              <img src={logo} alt="Logo" className="h-8 object-contain" />
            )}
            <div>
              {companyName && (
                <div className="font-semibold" style={{ color: primaryColor }}>
                  {companyName}
                </div>
              )}
              <div className="text-sm text-muted-foreground">
                Shared Analysis Preview
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
