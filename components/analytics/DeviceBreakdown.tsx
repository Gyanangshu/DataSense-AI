'use client'

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'
import { Smartphone, Tablet, Monitor, HelpCircle } from 'lucide-react'

interface DeviceBreakdownProps {
  data: {
    device: string
    count: number
  }[]
}

const COLORS = {
  mobile: '#3b82f6',    // blue
  tablet: '#8b5cf6',    // purple
  desktop: '#10b981',   // green
  unknown: '#6b7280'    // gray
}

const ICONS = {
  mobile: Smartphone,
  tablet: Tablet,
  desktop: Monitor,
  unknown: HelpCircle
}

export default function DeviceBreakdown({ data }: DeviceBreakdownProps) {
  const chartData = data.map(item => ({
    name: item.device.charAt(0).toUpperCase() + item.device.slice(1),
    value: item.count,
    color: COLORS[item.device as keyof typeof COLORS] || COLORS.unknown
  }))

  const total = data.reduce((sum, item) => sum + item.count, 0)

  return (
    <div className="space-y-4">
      <ResponsiveContainer width="100%" height={250}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '8px'
            }}
          />
        </PieChart>
      </ResponsiveContainer>

      {/* Legend with icons */}
      <div className="grid grid-cols-2 gap-2">
        {data.map((item) => {
          const Icon = ICONS[item.device as keyof typeof ICONS] || HelpCircle
          const percentage = ((item.count / total) * 100).toFixed(1)

          return (
            <div
              key={item.device}
              className="flex items-center gap-2 p-2 rounded-lg border border-border"
            >
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: COLORS[item.device as keyof typeof COLORS] || COLORS.unknown }}
              />
              <Icon className="w-4 h-4 text-muted-foreground" />
              <div className="flex-1">
                <div className="text-sm font-medium capitalize">{item.device}</div>
                <div className="text-xs text-muted-foreground">
                  {item.count} ({percentage}%)
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
