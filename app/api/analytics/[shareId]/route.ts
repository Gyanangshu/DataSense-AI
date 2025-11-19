import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ shareId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { shareId } = await params

    // Find share and verify ownership
    const share = await prisma.sharedAnalysis.findUnique({
      where: { id: shareId },
      select: {
        userId: true,
        viewCount: true,
        uniqueViewers: true,
        createdAt: true
      }
    })

    if (!share) {
      return NextResponse.json(
        { error: 'Share not found' },
        { status: 404 }
      )
    }

    if (share.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Unauthorized - you do not own this share' },
        { status: 403 }
      )
    }

    // Fetch all views with analytics data
    const views = await prisma.shareView.findMany({
      where: { sharedAnalysisId: shareId },
      select: {
        viewedAt: true,
        deviceType: true,
        country: true,
        city: true,
        referrer: true,
        timeSpent: true
      },
      orderBy: { viewedAt: 'desc' }
    })

    // Calculate analytics
    const analytics = {
      totalViews: share.viewCount,
      uniqueViewers: share.uniqueViewers.length,

      // Views over time (group by day)
      viewsOverTime: groupViewsByDay(views),

      // Device breakdown
      deviceBreakdown: calculateDeviceBreakdown(views),

      // Geographic distribution
      geoDistribution: calculateGeoDistribution(views),

      // Top referrers
      topReferrers: calculateTopReferrers(views),

      // Average time spent
      avgTimeSpent: calculateAverageTimeSpent(views),

      // Recent views
      recentViews: views.slice(0, 10).map(v => ({
        viewedAt: v.viewedAt,
        deviceType: v.deviceType,
        location: v.city && v.country ? `${v.city}, ${v.country}` : v.country || 'Unknown',
        timeSpent: v.timeSpent
      })),

      // Share metadata
      shareCreatedAt: share.createdAt
    }

    return NextResponse.json(analytics)
  } catch (error) {
    console.error('Analytics fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    )
  }
}

// Helper: Group views by day
function groupViewsByDay(views: any[]) {
  const grouped: Record<string, number> = {}

  views.forEach(view => {
    const date = new Date(view.viewedAt).toISOString().split('T')[0]
    grouped[date] = (grouped[date] || 0) + 1
  })

  // Convert to array and sort by date
  return Object.entries(grouped)
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date))
}

// Helper: Calculate device breakdown
function calculateDeviceBreakdown(views: any[]) {
  const breakdown: Record<string, number> = {
    mobile: 0,
    tablet: 0,
    desktop: 0,
    unknown: 0
  }

  views.forEach(view => {
    const device = view.deviceType || 'unknown'
    breakdown[device] = (breakdown[device] || 0) + 1
  })

  return Object.entries(breakdown)
    .map(([device, count]) => ({ device, count }))
    .filter(item => item.count > 0)
}

// Helper: Calculate geographic distribution
function calculateGeoDistribution(views: any[]) {
  const countryCount: Record<string, number> = {}

  views.forEach(view => {
    if (view.country) {
      countryCount[view.country] = (countryCount[view.country] || 0) + 1
    }
  })

  return Object.entries(countryCount)
    .map(([country, count]) => ({ country, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10) // Top 10 countries
}

// Helper: Calculate top referrers
function calculateTopReferrers(views: any[]) {
  const referrerCount: Record<string, number> = {}

  views.forEach(view => {
    if (view.referrer) {
      try {
        const url = new URL(view.referrer)
        const domain = url.hostname
        referrerCount[domain] = (referrerCount[domain] || 0) + 1
      } catch {
        // Invalid URL, skip
      }
    }
  })

  return Object.entries(referrerCount)
    .map(([referrer, count]) => ({ referrer, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5) // Top 5 referrers
}

// Helper: Calculate average time spent
function calculateAverageTimeSpent(views: any[]) {
  const viewsWithTime = views.filter(v => v.timeSpent && v.timeSpent > 0)

  if (viewsWithTime.length === 0) return null

  const totalTime = viewsWithTime.reduce((sum, v) => sum + v.timeSpent, 0)
  return Math.round(totalTime / viewsWithTime.length)
}
