'use client'

import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { LayoutDashboard } from 'lucide-react'
import GridLayout, { Layout as LayoutItem } from 'react-grid-layout'
import 'react-grid-layout/css/styles.css'
import { LineChart } from '@/components/charts/LineChart'
import { BarChart } from '@/components/charts/BarChart'
import { PieChart } from '@/components/charts/PieChart'
import { ScatterChart } from '@/components/charts/ScatterChart'

interface Dataset {
  id: string
  name: string
  columns: unknown
  types: unknown
  data: unknown
}

interface Visualization {
  id: string
  name: string
  type: string
  config: Record<string, unknown>
  dataset: Dataset
}

interface Dashboard {
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
  visualizations: Visualization[]
}

interface DashboardViewerProps {
  dashboard: Dashboard
}

export default function DashboardViewer({ dashboard }: DashboardViewerProps) {
  const config = dashboard.config as {
    layout?: Array<{
      id: string
      visualizationId: string
      x: number
      y: number
      w: number
      h: number
    }>
  } | null

  const items = config?.layout || []

  // Convert items to react-grid-layout format
  const layout: LayoutItem[] = items.map(item => ({
    i: item.id,
    x: item.x,
    y: item.y,
    w: item.w,
    h: item.h,
    static: true // Make items non-draggable in view mode
  }))

  const renderChart = (visualization: Visualization) => {
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

    const dataset = visualization.dataset
    const rawData = (dataset.data as Record<string, unknown>[]) || []
    // Cast to ChartData for type compatibility
    const data = rawData as Array<Record<string, string | number | Date>>

    if (!data || data.length === 0) {
      return (
        <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
          No data available
        </div>
      )
    }

    const chartType = config.type || visualization.type

    switch (chartType) {
      case 'line':
        return (
          <LineChart
            data={data}
            xKey={config.xAxis || ''}
            yKeys={config.yAxis || []}
            height={300}
            showGrid={config.showGrid ?? true}
            showLegend={config.showLegend ?? true}
            animated={config.animated ?? true}
            curved={config.curved ?? true}
            visualizationId={visualization.id}
          />
        )
      case 'bar':
        return (
          <BarChart
            data={data}
            xKey={config.xAxis || ''}
            yKeys={config.yAxis || []}
            height={300}
            showGrid={config.showGrid ?? true}
            showLegend={config.showLegend ?? true}
            showLabels={config.showLabels ?? false}
            animated={config.animated ?? true}
            stacked={config.stacked ?? false}
            visualizationId={visualization.id}
          />
        )
      case 'pie':
        // Convert data to pie chart format
        const pieData = data.map(row => ({
          name: String(row[config.xAxis || ''] || ''),
          value: Number(row[config.yAxis?.[0] || ''] || 0)
        }))
        return (
          <PieChart
            data={pieData}
            height={300}
            showLegend={config.showLegend ?? true}
            showLabels={config.showLabels ?? false}
            animated={config.animated ?? true}
            donut={config.donut ?? false}
            visualizationId={visualization.id}
          />
        )
      case 'scatter':
        return (
          <ScatterChart
            data={data}
            xKey={config.xAxis || ''}
            yKey={config.yAxis?.[0] || ''}
            height={300}
            showGrid={config.showGrid ?? true}
            animated={config.animated ?? true}
            visualizationId={visualization.id}
          />
        )
      default:
        return (
          <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
            Unsupported chart type: {chartType}
          </div>
        )
    }
  }

  if (items.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-24">
          <div className="text-center">
            <div className="p-6 bg-secondary/30 rounded-full w-fit mx-auto mb-4">
              <LayoutDashboard className="w-12 h-12 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium text-foreground mb-2">
              Empty Dashboard
            </h3>
            <p className="text-muted-foreground">
              This dashboard has no visualizations yet. Edit it to add charts.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div>
      <GridLayout
        className="layout"
        layout={layout}
        cols={12}
        rowHeight={60}
        width={1200}
        isDraggable={false}
        isResizable={false}
        compactType="vertical"
        preventCollision={false}
        margin={[16, 16]}
      >
        {items.map(item => {
          const visualization = dashboard.visualizations.find(
            v => v.id === item.visualizationId
          )
          if (!visualization) return null

          return (
            <div
              key={item.id}
              id={visualization.id}
              className="bg-card border border-border rounded-lg shadow-sm overflow-hidden"
              data-chart-id={visualization.id}
              data-chart-title={visualization.name}
            >
              <Card className="h-full border-0">
                <CardHeader className="border-b border-border bg-secondary/20 p-4">
                  <CardTitle className="text-base">{visualization.name}</CardTitle>
                  {visualization.dataset && (
                    <CardDescription className="text-xs">
                      {visualization.dataset.name}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent className="p-4 h-[calc(100%-80px)]">
                  {renderChart(visualization)}
                </CardContent>
              </Card>
            </div>
          )
        })}
      </GridLayout>
    </div>
  )
}
