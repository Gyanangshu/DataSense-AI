'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Eye, Users, Clock, Globe, Smartphone, Loader2 } from 'lucide-react'
import ViewsChart from './ViewsChart'
import DeviceBreakdown from './DeviceBreakdown'
import GeoDistribution from './GeoDistribution'
import { Badge } from '@/components/ui/badge'

interface AnalyticsDashboardProps {
  shareId: string
}

export default function AnalyticsDashboard({ shareId }: AnalyticsDashboardProps) {
  const [analytics, setAnalytics] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchAnalytics()
  }, [shareId])

  const fetchAnalytics = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/analytics/${shareId}`)

      if (!response.ok) {
        throw new Error('Failed to fetch analytics')
      }

      const data = await response.json()
      setAnalytics(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load analytics')
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-destructive">{error}</p>
      </div>
    )
  }

  if (!analytics) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No analytics data available</p>
      </div>
    )
  }

  const formatTimeSpent = (seconds: number | null) => {
    if (!seconds) return 'N/A'
    if (seconds < 60) return `${seconds}s`
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}m ${remainingSeconds}s`
  }

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <Eye className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <div className="text-2xl font-bold">{analytics.totalViews}</div>
                <div className="text-sm text-muted-foreground">Total Views</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                <Users className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <div className="text-2xl font-bold">{analytics.uniqueViewers}</div>
                <div className="text-sm text-muted-foreground">Unique Viewers</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                <Clock className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <div className="text-2xl font-bold">
                  {formatTimeSpent(analytics.avgTimeSpent)}
                </div>
                <div className="text-sm text-muted-foreground">Avg. Time Spent</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-lg">
                <Globe className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <div className="text-2xl font-bold">{analytics.geoDistribution.length}</div>
                <div className="text-sm text-muted-foreground">Countries</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Views Over Time Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Views Over Time</CardTitle>
          <CardDescription>Daily view counts since share creation</CardDescription>
        </CardHeader>
        <CardContent>
          {analytics.viewsOverTime.length > 0 ? (
            <ViewsChart data={analytics.viewsOverTime} />
          ) : (
            <p className="text-center text-muted-foreground py-8">No views yet</p>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Device Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Device Types</CardTitle>
            <CardDescription>How viewers access your analysis</CardDescription>
          </CardHeader>
          <CardContent>
            {analytics.deviceBreakdown.length > 0 ? (
              <DeviceBreakdown data={analytics.deviceBreakdown} />
            ) : (
              <p className="text-center text-muted-foreground py-8">No device data</p>
            )}
          </CardContent>
        </Card>

        {/* Geographic Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Geographic Distribution</CardTitle>
            <CardDescription>Top countries by view count</CardDescription>
          </CardHeader>
          <CardContent>
            {analytics.geoDistribution.length > 0 ? (
              <GeoDistribution data={analytics.geoDistribution} />
            ) : (
              <p className="text-center text-muted-foreground py-8">No location data</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top Referrers */}
      {analytics.topReferrers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Top Referrers</CardTitle>
            <CardDescription>Where your viewers are coming from</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {analytics.topReferrers.map((ref: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between p-3 border border-border rounded-lg">
                  <span className="font-medium">{ref.referrer}</span>
                  <Badge variant="secondary">{ref.count} views</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Views */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Views</CardTitle>
          <CardDescription>Latest 10 views with details</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {analytics.recentViews.map((view: any, idx: number) => (
              <div key={idx} className="flex items-center justify-between p-3 border border-border rounded-lg">
                <div className="flex items-center gap-3">
                  <Smartphone className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <div className="text-sm font-medium">
                      {new Date(view.viewedAt).toLocaleString()}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {view.location} • {view.deviceType}
                    </div>
                  </div>
                </div>
                {view.timeSpent && (
                  <Badge variant="outline">{formatTimeSpent(view.timeSpent)}</Badge>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
