'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import VisualizationBuilder from './VisualizationBuilder'

interface VisualizationBuilderWrapperProps {
  dataset: {
    id: string
    name: string
    columns: string[]
    types: Record<string, string>
    stats: Record<string, unknown>
    rowCount: number | null
  }
  visualizationId?: string
}

export default function VisualizationBuilderWrapper({ dataset, visualizationId }: VisualizationBuilderWrapperProps) {
  const [initialConfig, setInitialConfig] = useState<Record<string, unknown> | null>(null)
  const [isLoading, setIsLoading] = useState(!!visualizationId)

  useEffect(() => {
    if (visualizationId) {
      const loadVisualization = async () => {
        try {
          const response = await fetch(`/api/visualizations/${visualizationId}`)
          if (response.ok) {
            const viz = await response.json()
            setInitialConfig(viz.config as Record<string, unknown>)
            toast.success('Visualization loaded')
          } else {
            toast.error('Failed to load visualization')
          }
        } catch (error) {
          toast.error('Failed to load visualization')
        } finally {
          setIsLoading(false)
        }
      }
      loadVisualization()
    }
  }, [visualizationId])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading visualization...</p>
        </div>
      </div>
    )
  }

  return (
    <VisualizationBuilder
      dataset={dataset}
      visualizationId={visualizationId}
      initialConfig={initialConfig}
    />
  )
}
