'use client'

import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Brush,
  ReferenceLine,
} from 'recharts'
import { BaseChart, CHART_COLORS, ChartTheme } from './BaseChart'
import { formatNumber } from '@/lib/utils'
import { ChartData } from '@/types/dataset'
import { ChartAnnotations } from './ChartAnnotations'
import { useChartStore } from '@/lib/stores/chartStore'

interface LineChartProps {
  data: ChartData[]
  xKey: string
  yKeys: string[]
  colors?: string[]
  height?: number
  showGrid?: boolean
  showLegend?: boolean
  showBrush?: boolean
  curved?: boolean
  animated?: boolean
  strokeWidth?: number
  referenceLines?: Array<{
    y?: number
    x?: string | number
    label: string
    stroke?: string
  }>
  chartTheme?: ChartTheme
  visualizationId?: string
}

export function LineChart({
  data,
  xKey,
  yKeys,
  colors = CHART_COLORS.primary,
  height = 400,
  showGrid = true,
  showLegend = true,
  showBrush = false,
  curved = true,
  animated = true,
  strokeWidth = 2,
  referenceLines = [],
  chartTheme,
  visualizationId
}: LineChartProps) {
  const { setDrillDown } = useChartStore()

  // Handle line click for drill-down
  const handleLineClick = (dataPoint: unknown) => {
    if (visualizationId) {
      setDrillDown({
        visualizationId,
        dataPoint: dataPoint as Record<string, unknown>,
        timestamp: Date.now()
      })
    }
  }

  return (
    <BaseChart height={height}>
      <RechartsLineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        {showGrid && (
          <CartesianGrid
            strokeDasharray="3 3"
            stroke={chartTheme?.grid || '#E5E7EB'}
            opacity={0.5}
          />
        )}
        <XAxis
          dataKey={xKey}
          tick={{ fill: chartTheme?.text || '#6B7280', fontSize: 12 }}
          tickLine={{ stroke: chartTheme?.text || '#6B7280' }}
          axisLine={{ stroke: chartTheme?.text || '#6B7280' }}
        />
        <YAxis
          tick={{ fill: chartTheme?.text || '#6B7280', fontSize: 12 }}
          tickLine={{ stroke: chartTheme?.text || '#6B7280' }}
          axisLine={{ stroke: chartTheme?.text || '#6B7280' }}
          tickFormatter={(value: number) => formatNumber(value)}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: chartTheme?.tooltip || '#FFFFFF',
            border: `1px solid ${chartTheme?.tooltipBorder || '#E5E7EB'}`,
            borderRadius: '6px',
            color: chartTheme?.text || '#000000'
          }}
          labelStyle={{ color: chartTheme?.text || '#000000' }}
          formatter={(value: number) => formatNumber(value)}
        />
        {showLegend && <Legend />}

        {/* Render annotations if visualizationId is provided */}
        {visualizationId && <ChartAnnotations visualizationId={visualizationId} />}

        {yKeys.map((key, index) => (
          <Line
            key={key}
            type={curved ? 'monotone' : 'linear'}
            dataKey={key}
            stroke={colors[index % colors.length]}
            strokeWidth={strokeWidth}
            dot={false}
            animationDuration={animated ? 1500 : 0}
            animationBegin={animated ? index * 100 : 0}
            onClick={(data) => handleLineClick(data)}
            cursor="pointer"
          />
        ))}

        {referenceLines.map((line, index) => (
          <ReferenceLine
            key={index}
            {...line}
            strokeDasharray="5 5"
          />
        ))}

        {showBrush && (
          <Brush
            dataKey={xKey}
            height={30}
            stroke="hsl(var(--primary))"
          />
        )}
      </RechartsLineChart>
    </BaseChart>
  )
}