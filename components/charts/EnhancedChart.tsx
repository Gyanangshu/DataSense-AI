'use client'

import { useChartStore } from '@/lib/stores/chartStore'
import { LineChart } from './LineChart'
import { BarChart } from './BarChart'
import { PieChart, PieChartData } from './PieChart'
import { ScatterChart } from './ScatterChart'

interface EnhancedChartProps {
  visualizationId?: string
  type: 'line' | 'bar' | 'pie' | 'scatter'
  data: Record<string, unknown>[] | PieChartData[]
  xKey?: string
  yKeys?: string[]
  yKey?: string
  colors?: string[]
  showGrid?: boolean
  showLegend?: boolean
  showLabels?: boolean
  animated?: boolean
  stacked?: boolean
  curved?: boolean
  donut?: boolean
  enableDrillDown?: boolean
}

export default function EnhancedChart({
  visualizationId,
  type,
  data,
  xKey = '',
  yKeys = [],
  yKey = '',
  colors,
  showGrid = true,
  showLegend = true,
  showLabels = false,
  animated = true,
  stacked = false,
  curved = true,
  donut = false,
  enableDrillDown = true
}: EnhancedChartProps) {
  const { setDrillDown } = useChartStore()

  // Handle chart click for drill-down
  const handleChartClick = (dataPoint: unknown) => {
    if (!enableDrillDown || !visualizationId) return

    setDrillDown({
      visualizationId,
      dataPoint: dataPoint as Record<string, unknown>,
      timestamp: Date.now()
    })
  }

  // Wrap chart component with click handler
  const chartProps = {
    data: data as any,
    colors,
    showGrid,
    showLegend,
    showLabels,
    animated,
    onClick: handleChartClick
  }

  switch (type) {
    case 'line':
      return (
        <LineChart
          {...chartProps}
          xKey={xKey}
          yKeys={yKeys}
          curved={curved}
          visualizationId={visualizationId}
        />
      )
    case 'bar':
      return (
        <BarChart
          {...chartProps}
          xKey={xKey}
          yKeys={yKeys}
          stacked={stacked}
          visualizationId={visualizationId}
        />
      )
    case 'pie':
      return (
        <PieChart
          {...chartProps}
          data={data as PieChartData[]}
          donut={donut}
          visualizationId={visualizationId}
        />
      )
    case 'scatter':
      return (
        <ScatterChart
          {...chartProps}
          xKey={xKey}
          yKey={yKey}
          visualizationId={visualizationId}
        />
      )
    default:
      return null
  }
}
