'use client'

import { useState, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Layout,
  Grid3x3,
  Plus,
  Trash2,
  Save,
  Eye,
  Columns,
  LayoutGrid,
  Loader2,
  Sparkles
} from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import GridLayout, { Layout as LayoutItem } from 'react-grid-layout'
import 'react-grid-layout/css/styles.css'
import VisualizationPreview from './VisualizationPreview'

interface Visualization {
  id: string
  name: string
  type: string
  config: unknown
  dataset: {
    id: string
    name: string
    data?: unknown
    columns?: unknown
    types?: unknown
  }
}

interface DashboardBuilderProps {
  userId: string
  visualizations: Visualization[]
  existingDashboard?: {
    id: string
    name: string
    description: string | null
    config: {
      layout?: Array<{
        id: string
        visualizationId: string
        x: number
        y: number
        w: number
        h: number
      }>
      preset?: string
    } | null
    selectedVizIds: string[]
  }
}

interface DashboardItem {
  id: string
  visualizationId: string
  x: number
  y: number
  w: number
  h: number
}

const layoutPresets = [
  { value: 'grid-2x2', label: '2x2 Grid', cols: 12, rows: 2 },
  { value: 'grid-3x2', label: '3x2 Grid', cols: 12, rows: 2 },
  { value: 'grid-4x2', label: '4x2 Grid', cols: 12, rows: 2 },
  { value: 'single-large', label: 'Single Large', cols: 12, rows: 1 },
  { value: 'custom', label: 'Custom Layout', cols: 12, rows: 4 }
]

export default function DashboardBuilder({ userId, visualizations, existingDashboard }: DashboardBuilderProps) {
  const router = useRouter()
  const [name, setName] = useState(existingDashboard?.name || '')
  const [description, setDescription] = useState(existingDashboard?.description || '')
  const [layoutPreset, setLayoutPreset] = useState(existingDashboard?.config?.preset || 'custom')
  const [items, setItems] = useState<DashboardItem[]>(existingDashboard?.config?.layout || [])
  const [saving, setSaving] = useState(false)

  // Convert items to react-grid-layout format
  const layout: LayoutItem[] = items.map(item => ({
    i: item.id,
    x: item.x,
    y: item.y,
    w: item.w,
    h: item.h,
    minW: 2,
    minH: 2
  }))

  const handleLayoutChange = useCallback((newLayout: LayoutItem[]) => {
    setItems(prevItems =>
      prevItems.map(item => {
        const layoutItem = newLayout.find(l => l.i === item.id)
        if (layoutItem) {
          return {
            ...item,
            x: layoutItem.x,
            y: layoutItem.y,
            w: layoutItem.w,
            h: layoutItem.h
          }
        }
        return item
      })
    )
  }, [])

  const addVisualization = (visualization: Visualization) => {
    const newItem: DashboardItem = {
      id: `item-${Date.now()}`,
      visualizationId: visualization.id,
      x: 0,
      y: items.length > 0 ? Math.max(...items.map(i => i.y + i.h)) : 0,
      w: 6,
      h: 4
    }
    setItems([...items, newItem])
    toast.success('Visualization added to dashboard')
  }

  const removeItem = (itemId: string) => {
    setItems(items.filter(item => item.id !== itemId))
    toast.success('Visualization removed')
  }

  const applyLayoutPreset = (preset: string) => {
    if (preset === 'grid-2x2' && items.length >= 4) {
      const updatedItems = items.slice(0, 4).map((item, index) => ({
        ...item,
        x: (index % 2) * 6,
        y: Math.floor(index / 2) * 4,
        w: 6,
        h: 4
      }))
      setItems(updatedItems)
      toast.success('Applied 2x2 grid layout')
    } else if (preset === 'grid-3x2' && items.length >= 6) {
      const updatedItems = items.slice(0, 6).map((item, index) => ({
        ...item,
        x: (index % 3) * 4,
        y: Math.floor(index / 3) * 4,
        w: 4,
        h: 4
      }))
      setItems(updatedItems)
      toast.success('Applied 3x2 grid layout')
    } else if (preset === 'grid-4x2' && items.length >= 8) {
      const updatedItems = items.slice(0, 8).map((item, index) => ({
        ...item,
        x: (index % 4) * 3,
        y: Math.floor(index / 4) * 4,
        w: 3,
        h: 4
      }))
      setItems(updatedItems)
      toast.success('Applied 4x2 grid layout')
    } else if (preset === 'single-large' && items.length >= 1) {
      const updatedItems = [
        {
          ...items[0],
          x: 0,
          y: 0,
          w: 12,
          h: 6
        }
      ]
      setItems(updatedItems)
      toast.success('Applied single large layout')
    }
  }

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error('Please enter a dashboard name')
      return
    }

    if (items.length === 0) {
      toast.error('Please add at least one visualization')
      return
    }

    setSaving(true)
    try {
      const isEditing = !!existingDashboard
      const url = isEditing ? `/api/dashboards/${existingDashboard.id}` : '/api/dashboards'
      const method = isEditing ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          description,
          config: {
            layout: items,
            preset: layoutPreset
          }
        })
      })

      if (response.ok) {
        const data = await response.json()
        toast.success(isEditing ? 'Dashboard updated successfully!' : 'Dashboard created successfully!')
        router.push(`/dashboards/${data.id}`)
      } else {
        throw new Error(isEditing ? 'Failed to update dashboard' : 'Failed to create dashboard')
      }
    } catch (error) {
      console.error('Error creating dashboard:', error)
      toast.error('Failed to create dashboard')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="grid lg:grid-cols-[350px,1fr] gap-6">
      {/* Sidebar */}
      <div className="space-y-6">
        {/* Dashboard Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Layout className="w-5 h-5 text-primary" />
              Dashboard Settings
            </CardTitle>
            <CardDescription>Configure your dashboard details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Dashboard Name</Label>
              <Input
                id="name"
                placeholder="e.g., Sales Overview"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                placeholder="What insights does this dashboard show?"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="layout-preset">Layout Preset</Label>
              <Select value={layoutPreset} onValueChange={setLayoutPreset}>
                <SelectTrigger id="layout-preset">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {layoutPresets.map(preset => (
                    <SelectItem key={preset.value} value={preset.value}>
                      {preset.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {layoutPreset !== 'custom' && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => applyLayoutPreset(layoutPreset)}
                  className="w-full"
                >
                  <LayoutGrid className="w-3 h-3 mr-2" />
                  Apply Layout
                </Button>
              )}
            </div>

            <div className="pt-4 space-y-2">
              <Button
                onClick={handleSave}
                disabled={saving}
                className="w-full"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    {existingDashboard ? 'Update Dashboard' : 'Save Dashboard'}
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Available Visualizations */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              Available Charts
            </CardTitle>
            <CardDescription>
              Click to add to dashboard ({visualizations.length} available)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {visualizations.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p className="text-sm">No visualizations yet</p>
                <p className="text-xs mt-1">Create charts first to add them here</p>
              </div>
            ) : (
              <div className="space-y-2">
                {visualizations.map(viz => (
                  <button
                    key={viz.id}
                    onClick={() => addVisualization(viz)}
                    className="w-full p-3 text-left rounded-lg border border-border hover:bg-accent hover:border-primary/40 transition-all group"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate group-hover:text-primary transition-colors">
                          {viz.name}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {viz.dataset.name}
                        </p>
                      </div>
                      <Plus className="w-4 h-4 text-muted-foreground group-hover:text-primary shrink-0 mt-0.5" />
                    </div>
                    <Badge variant="outline" className="mt-2 text-xs capitalize">
                      {viz.type}
                    </Badge>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Dashboard Stats */}
        <Card className="bg-secondary/30">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Items in Dashboard:</span>
              <Badge variant="secondary">{items.length}</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Canvas */}
      <div>
        <Card className="min-h-[800px]">
          <CardHeader className="border-b border-border">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Dashboard Canvas</CardTitle>
                <CardDescription>
                  Drag and resize visualizations to customize your layout
                </CardDescription>
              </div>
              <Badge variant="outline" className="text-xs">
                <Grid3x3 className="w-3 h-3 mr-1" />
                12 Column Grid
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {items.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-32 text-center">
                <div className="p-6 bg-secondary/30 rounded-full mb-4">
                  <Layout className="w-12 h-12 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  Empty Dashboard
                </h3>
                <p className="text-sm text-muted-foreground max-w-md">
                  Add visualizations from the sidebar to start building your dashboard.
                  Drag and resize them to create the perfect layout.
                </p>
              </div>
            ) : (
              <GridLayout
                className="layout"
                layout={layout}
                cols={12}
                rowHeight={60}
                width={1400}
                onLayoutChange={handleLayoutChange}
                isDraggable={true}
                isResizable={true}
                compactType="vertical"
                preventCollision={false}
                margin={[16, 16]}
                draggableHandle=".drag-handle"
              >
                {items.map(item => {
                  const visualization = visualizations.find(
                    v => v.id === item.visualizationId
                  )
                  if (!visualization) return null

                  return (
                    <div
                      key={item.id}
                      className="bg-card border border-border rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden"
                    >
                      <div className="h-full flex flex-col">
                        {/* Item Header */}
                        <div className="flex items-center justify-between p-3 border-b border-border bg-secondary/30">
                          <div className="flex-1 min-w-0 drag-handle cursor-move">
                            <p className="text-sm font-medium truncate">
                              {visualization.name}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                              {visualization.dataset.name}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation()
                              removeItem(item.id)
                            }}
                            className="shrink-0 h-7 w-7"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>

                        {/* Visualization Preview */}
                        <div className="flex-1 p-4 overflow-hidden">
                          <VisualizationPreview
                            visualization={visualization}
                            compact={true}
                          />
                        </div>
                      </div>
                    </div>
                  )
                })}
              </GridLayout>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
