'use client'

import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell,
  LabelList,
} from 'recharts'
import { BaseChart, CHART_COLORS, ChartTheme } from './BaseChart'
import { formatNumber } from '@/lib/utils'
import { ChartData } from '@/types/dataset'
import { ChartAnnotations } from './ChartAnnotations'

interface BarChartProps {
  data: ChartData[]
  xKey: string
  yKeys: string[]
  colors?: string[]
  height?: number
  showGrid?: boolean
  showLegend?: boolean
  stacked?: boolean
  horizontal?: boolean
  showLabels?: boolean
  animated?: boolean
  chartTheme?: ChartTheme
  visualizationId?: string
}

export function BarChart({
  data,
  xKey,
  yKeys,
  colors = CHART_COLORS.primary,
  height = 600,
  showGrid = true,
  showLegend = true,
  stacked = false,
  horizontal = false,
  showLabels = false,
  animated = true,
  chartTheme,
  visualizationId
}: BarChartProps) {
  const xAxisKey = horizontal ? undefined : xKey
  const yAxisKey = horizontal ? xKey : undefined

  return (
    <BaseChart height={height}>
      <RechartsBarChart
        data={data}
        layout={horizontal ? 'vertical' : 'horizontal'}
        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
      >
        {showGrid && (
          <CartesianGrid
            strokeDasharray="3 3"
            stroke={chartTheme?.grid || '#E5E7EB'}
            opacity={0.5}
          />
        )}
        <XAxis
          dataKey={xAxisKey}
          type={horizontal ? 'number' : 'category'}
          tick={{ fill: chartTheme?.text || '#6B7280', fontSize: 12 }}
          tickLine={{ stroke: chartTheme?.text || '#6B7280' }}
          axisLine={{ stroke: chartTheme?.text || '#6B7280' }}
          tickFormatter={horizontal ? (value: number) => formatNumber(value) : undefined}
        />
        <YAxis
          dataKey={yAxisKey}
          type={horizontal ? 'category' : 'number'}
          tick={{ fill: chartTheme?.text || '#6B7280', fontSize: 12 }}
          tickLine={{ stroke: chartTheme?.text || '#6B7280' }}
          axisLine={{ stroke: chartTheme?.text || '#6B7280' }}
          tickFormatter={!horizontal ? (value: number) => formatNumber(value) : undefined}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: chartTheme?.tooltip || '#FFFFFF',
            border: `1px solid ${chartTheme?.tooltipBorder || '#E5E7EB'}`,
            borderRadius: '6px',
            color: chartTheme?.text || '#000000'
          }}
          labelStyle={{ color: chartTheme?.text || '#000000' }}
          formatter={(value: number) => formatNumber(Number(value))}
        />
        {showLegend && <Legend />}

        {/* Render annotations if visualizationId is provided */}
        {visualizationId && <ChartAnnotations visualizationId={visualizationId} />}

        {yKeys.map((key, index) => (
          <Bar
            key={key}
            dataKey={key}
            fill={colors[index % colors.length]}
            stackId={stacked ? 'stack' : undefined}
            animationDuration={animated ? 1500 : 0}
            animationBegin={animated ? index * 100 : 0}
          >
            {showLabels && (
              <LabelList
                dataKey={key}
                position="top"
                formatter={(value: any) => String(formatNumber(Number(value)))}
              />
            )}
            {/* Individual cell colors for single series */}
            {yKeys.length === 1 && data.map((_entry, idx) => (
              <Cell key={`cell-${idx}`} fill={colors[idx % colors.length]} />
            ))}
          </Bar>
        ))}
      </RechartsBarChart>
    </BaseChart>
  )
}