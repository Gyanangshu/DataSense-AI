'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  MessageSquare,
  Plus,
  Trash2,
  X,
  MapPin,
  Minus,
  Type
} from 'lucide-react'
import { useChartStore, ChartAnnotation } from '@/lib/stores/chartStore'
import { toast } from 'sonner'

interface AnnotationControlsProps {
  visualizationId: string
  collapsed?: boolean
  onToggle?: () => void
}

export default function AnnotationControls({
  visualizationId,
  collapsed = false,
  onToggle
}: AnnotationControlsProps) {
  const { annotations, addAnnotation, removeAnnotation, clearAnnotations, getAnnotations } = useChartStore()

  const vizAnnotations = getAnnotations(visualizationId)

  const [newAnnotation, setNewAnnotation] = useState<{
    type: ChartAnnotation['type']
    x: string
    y: string
    text: string
    color: string
  }>({
    type: 'text',
    x: '',
    y: '',
    text: '',
    color: '#3b82f6'
  })

  const handleAddAnnotation = () => {
    if (!newAnnotation.x || !newAnnotation.y) {
      toast.error('Please provide X and Y coordinates')
      return
    }

    if (newAnnotation.type === 'text' && !newAnnotation.text) {
      toast.error('Please provide annotation text')
      return
    }

    const annotation: ChartAnnotation = {
      id: `annotation-${Date.now()}`,
      visualizationId,
      type: newAnnotation.type,
      x: newAnnotation.x,
      y: Number(newAnnotation.y),
      text: newAnnotation.text,
      color: newAnnotation.color,
      strokeWidth: 2,
      createdAt: Date.now()
    }

    addAnnotation(annotation)
    toast.success('Annotation added')

    // Reset form
    setNewAnnotation({
      type: 'text',
      x: '',
      y: '',
      text: '',
      color: '#3b82f6'
    })
  }

  const handleRemoveAnnotation = (annotationId: string) => {
    removeAnnotation(visualizationId, annotationId)
    toast.success('Annotation removed')
  }

  const handleClearAll = () => {
    clearAnnotations(visualizationId)
    toast.success('All annotations cleared')
  }

  const getAnnotationIcon = (type: ChartAnnotation['type']) => {
    switch (type) {
      case 'point':
        return <MapPin className="w-3 h-3" />
      case 'line':
        return <Minus className="w-3 h-3" />
      case 'text':
        return <Type className="w-3 h-3" />
      default:
        return <MessageSquare className="w-3 h-3" />
    }
  }

  if (collapsed) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-4">
          <Button
            variant="ghost"
            onClick={onToggle}
            className="w-full flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-primary" />
              <span className="font-medium">Annotations</span>
              {vizAnnotations.length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {vizAnnotations.length}
                </Badge>
              )}
            </div>
            <Plus className="w-4 h-4" />
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-primary" />
            <CardTitle className="text-lg">Annotations</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            {vizAnnotations.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearAll}
              >
                <X className="w-4 h-4 mr-1" />
                Clear All
              </Button>
            )}
            {onToggle && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onToggle}
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Active Annotations */}
        {vizAnnotations.length > 0 && (
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              Active Annotations ({vizAnnotations.length})
            </Label>

            <div className="space-y-2 max-h-48 overflow-y-auto">
              {vizAnnotations.map((annotation) => (
                <div
                  key={annotation.id}
                  className="flex items-center gap-2 p-2 bg-secondary/50 rounded-lg group"
                >
                  <div
                    className="w-6 h-6 rounded flex items-center justify-center shrink-0"
                    style={{ backgroundColor: annotation.color + '20' }}
                  >
                    {getAnnotationIcon(annotation.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium capitalize">{annotation.type}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {annotation.text || `(${annotation.x}, ${annotation.y})`}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveAnnotation(annotation.id)}
                    className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Add New Annotation */}
        <div className="space-y-3 pt-3 border-t border-border">
          <Label className="text-sm font-medium">Add Annotation</Label>

          <div className="space-y-2">
            <div className="space-y-1">
              <Label htmlFor="ann-type" className="text-xs">Type</Label>
              <Select
                value={newAnnotation.type}
                onValueChange={(val) => setNewAnnotation({ ...newAnnotation, type: val as ChartAnnotation['type'] })}
              >
                <SelectTrigger id="ann-type" className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="text">
                    <div className="flex items-center gap-2">
                      <Type className="w-4 h-4" />
                      Text Label
                    </div>
                  </SelectItem>
                  <SelectItem value="point">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      Point Marker
                    </div>
                  </SelectItem>
                  <SelectItem value="line">
                    <div className="flex items-center gap-2">
                      <Minus className="w-4 h-4" />
                      Reference Line
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label htmlFor="ann-x" className="text-xs">X Position</Label>
                <Input
                  id="ann-x"
                  value={newAnnotation.x}
                  onChange={(e) => setNewAnnotation({ ...newAnnotation, x: e.target.value })}
                  placeholder="X value"
                  className="h-9"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="ann-y" className="text-xs">Y Position</Label>
                <Input
                  id="ann-y"
                  type="number"
                  value={newAnnotation.y}
                  onChange={(e) => setNewAnnotation({ ...newAnnotation, y: e.target.value })}
                  placeholder="Y value"
                  className="h-9"
                />
              </div>
            </div>

            {newAnnotation.type === 'text' && (
              <div className="space-y-1">
                <Label htmlFor="ann-text" className="text-xs">Text</Label>
                <Input
                  id="ann-text"
                  value={newAnnotation.text}
                  onChange={(e) => setNewAnnotation({ ...newAnnotation, text: e.target.value })}
                  placeholder="Annotation text..."
                  className="h-9"
                />
              </div>
            )}

            <div className="space-y-1">
              <Label htmlFor="ann-color" className="text-xs">Color</Label>
              <div className="flex gap-2">
                <Input
                  id="ann-color"
                  type="color"
                  value={newAnnotation.color}
                  onChange={(e) => setNewAnnotation({ ...newAnnotation, color: e.target.value })}
                  className="h-9 w-20"
                />
                <Input
                  type="text"
                  value={newAnnotation.color}
                  onChange={(e) => setNewAnnotation({ ...newAnnotation, color: e.target.value })}
                  placeholder="#3b82f6"
                  className="h-9 flex-1"
                />
              </div>
            </div>

            <Button
              onClick={handleAddAnnotation}
              size="sm"
              className="w-full"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Annotation
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
