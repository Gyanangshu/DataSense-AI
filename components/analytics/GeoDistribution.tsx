'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Badge } from '@/components/ui/badge'

interface GeoDistributionProps {
  data: {
    country: string
    count: number
  }[]
}

// Country code to full name mapping (top countries)
const COUNTRY_NAMES: Record<string, string> = {
  US: 'United States',
  GB: 'United Kingdom',
  CA: 'Canada',
  AU: 'Australia',
  DE: 'Germany',
  FR: 'France',
  IN: 'India',
  JP: 'Japan',
  CN: 'China',
  BR: 'Brazil',
  MX: 'Mexico',
  ES: 'Spain',
  IT: 'Italy',
  NL: 'Netherlands',
  SE: 'Sweden',
  SG: 'Singapore',
  // Add more as needed
}

export default function GeoDistribution({ data }: GeoDistributionProps) {
  const chartData = data.map(item => ({
    country: COUNTRY_NAMES[item.country] || item.country,
    countryCode: item.country,
    count: item.count
  }))

  return (
    <div className="space-y-4">
      {/* Bar Chart */}
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={chartData} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis
            type="number"
            className="text-xs text-muted-foreground"
            allowDecimals={false}
          />
          <YAxis
            type="category"
            dataKey="country"
            className="text-xs text-muted-foreground"
            width={120}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '8px'
            }}
          />
          <Bar
            dataKey="count"
            fill="hsl(var(--primary))"
            radius={[0, 4, 4, 0]}
          />
        </BarChart>
      </ResponsiveContainer>

      {/* List View */}
      <div className="space-y-2">
        {data.slice(0, 5).map((item, idx) => (
          <div
            key={item.country}
            className="flex items-center justify-between p-2 rounded-lg hover:bg-accent"
          >
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="w-8 text-center">
                {idx + 1}
              </Badge>
              <span className="font-medium">
                {COUNTRY_NAMES[item.country] || item.country}
              </span>
            </div>
            <Badge>{item.count} views</Badge>
          </div>
        ))}
      </div>
    </div>
  )
}
