'use client'

import { BarChart3, LineChart as LineChartIcon, PieChart as PieChartIcon, TrendingUp } from 'lucide-react'
import { LineChart } from '@/components/charts/LineChart'
import { BarChart } from '@/components/charts/BarChart'
import { PieChart } from '@/components/charts/PieChart'
import { ScatterChart } from '@/components/charts/ScatterChart'

interface Visualization {
  id: string
  name: string
  type: string
  config: unknown
  dataset?: {
    id: string
    name: string
    data?: unknown
    columns?: unknown
    types?: unknown
  }
}

interface VisualizationPreviewProps {
  visualization: Visualization
  compact?: boolean
}

const chartIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  bar: BarChart3,
  line: LineChartIcon,
  pie: PieChartIcon,
  scatter: TrendingUp,
  area: LineChartIcon,
  histogram: BarChart3
}

export default function VisualizationPreview({ visualization, compact = false }: VisualizationPreviewProps) {
  const Icon = chartIcons[visualization.type] || BarChart3

  // If we have dataset data, render the actual chart
  if (visualization.dataset?.data) {
    const config = visualization.config as {
      type?: string
      xAxis?: string
      yAxis?: string[]
      showGrid?: boolean
      showLegend?: boolean
      showLabels?: boolean
      animated?: boolean
      stacked?: boolean
      curved?: boolean
      donut?: boolean
    }

    const data = visualization.dataset.data as Array<Record<string, string | number | Date>>
    const chartType = config.type || visualization.type

    // Take only first 10 rows for preview
    const previewData = data.slice(0, 10)

    try {
      switch (chartType) {
        case 'line':
          return (
            <LineChart
              data={previewData}
              xKey={config.xAxis || ''}
              yKeys={config.yAxis || []}
              showGrid={config.showGrid ?? true}
              showLegend={config.showLegend ?? true}
              animated={false}
              curved={config.curved ?? true}
            />
          )
        case 'bar':
          return (
            <BarChart
              data={previewData}
              xKey={config.xAxis || ''}
              yKeys={config.yAxis || []}
              showGrid={config.showGrid ?? true}
              showLegend={config.showLegend ?? true}
              showLabels={config.showLabels ?? false}
              animated={false}
              stacked={config.stacked ?? false}
            />
          )
        case 'pie':
          const pieData = previewData.map(row => ({
            name: String(row[config.xAxis || ''] || ''),
            value: Number(row[config.yAxis?.[0] || ''] || 0)
          }))
          return (
            <PieChart
              data={pieData}
              showLegend={config.showLegend ?? true}
              showLabels={config.showLabels ?? false}
              animated={false}
              donut={config.donut ?? false}
            />
          )
        case 'scatter':
          return (
            <ScatterChart
              data={previewData}
              xKey={config.xAxis || ''}
              yKey={config.yAxis?.[0] || ''}
              showGrid={config.showGrid ?? true}
              animated={false}
            />
          )
      }
    } catch (error) {
      console.error('Error rendering chart preview:', error)
      // Fall through to icon preview
    }
  }

  // Fallback to icon preview
  return (
    <div className={`flex flex-col items-center justify-center h-full ${compact ? 'p-2' : 'p-8'} bg-secondary/10 rounded-lg`}>
      <Icon className={`${compact ? 'w-12 h-12' : 'w-16 h-16'} text-muted-foreground mb-2`} />
      <p className={`${compact ? 'text-xs' : 'text-sm'} text-center text-muted-foreground capitalize`}>
        {visualization.type} Chart Preview
      </p>
    </div>
  )
}
