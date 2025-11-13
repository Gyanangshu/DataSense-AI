'use client'

import { BarChart3, LineChart as LineChartIcon, PieChart as PieChartIcon, TrendingUp } from 'lucide-react'

interface Visualization {
  id: string
  name: string
  type: string
  config: unknown
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

  // For now, show a placeholder icon
  // In a full implementation, we would render the actual chart using the config
  return (
    <div className={`flex flex-col items-center justify-center h-full ${compact ? 'p-2' : 'p-8'} bg-secondary/10 rounded-lg`}>
      <Icon className={`${compact ? 'w-12 h-12' : 'w-16 h-16'} text-muted-foreground mb-2`} />
      <p className={`${compact ? 'text-xs' : 'text-sm'} text-center text-muted-foreground capitalize`}>
        {visualization.type} Chart Preview
      </p>
      {!compact && (
        <p className="text-xs text-muted-foreground mt-1 opacity-60">
          Live preview coming soon
        </p>
      )}
    </div>
  )
}
