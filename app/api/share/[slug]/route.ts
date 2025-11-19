import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { hashIP, getClientIP } from '@/lib/utils/ip-hash'
import { detectDeviceType } from '@/lib/utils/device-detector'
import { lookupGeoLocation } from '@/lib/utils/geo-lookup'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params

    // Find shared analysis
    const share = await prisma.sharedAnalysis.findUnique({
      where: { slug },
      include: {
        user: {
          select: {
            name: true,
            brandingConfig: true
          }
        }
      }
    })

    if (!share) {
      return NextResponse.json(
        { error: 'Share not found' },
        { status: 404 }
      )
    }

    // Check if expired
    if (share.expiresAt && share.expiresAt < new Date()) {
      return NextResponse.json(
        { error: 'This share link has expired' },
        { status: 410 }
      )
    }

    // If password protected, check if user has verified
    if (share.password) {
      const verificationCookie = req.cookies.get(`share_verified_${slug}`)

      // If not verified, return minimal info
      if (!verificationCookie || verificationCookie.value !== 'true') {
        return NextResponse.json({
          requiresPassword: true,
          shareType: share.shareType,
          brandingConfig: share.brandingConfig || share.user.brandingConfig,
          createdAt: share.createdAt
        })
      }
      // Cookie exists, allow access to continue
    }

    // Fetch the actual resource data
    let resourceData = null

    if (share.shareType === 'correlation') {
      resourceData = await prisma.correlationAnalysis.findUnique({
        where: { id: share.resourceId },
        select: {
          id: true,
          name: true,
          description: true,
          correlations: true,
          insights: true,
          narrative: true,
          createdAt: true,
          datasetId: true,
          documentId: true
        }
      })
    } else if (share.shareType === 'dashboard') {
      resourceData = await prisma.dashboard.findUnique({
        where: { id: share.resourceId },
        include: {
          visualizations: {
            include: {
              dataset: {
                select: {
                  name: true,
                  columns: true,
                  data: true
                }
              }
            }
          }
        }
      })
    }

    if (!resourceData) {
      return NextResponse.json(
        { error: 'Resource not found' },
        { status: 404 }
      )
    }

    // Track view analytics (async, don't wait)
    trackView(req, share.id).catch(console.error)

    // Increment view count (async)
    incrementViewCount(share.id).catch(console.error)

    return NextResponse.json({
      success: true,
      shareType: share.shareType,
      data: resourceData,
      brandingConfig: share.brandingConfig || share.user.brandingConfig,
      viewCount: share.viewCount + 1, // Optimistic increment for display
      createdAt: share.createdAt
    })
  } catch (error) {
    console.error('Share fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch share' },
      { status: 500 }
    )
  }
}

// Helper function to track view
async function trackView(req: NextRequest, sharedAnalysisId: string) {
  try {
    const ip = getClientIP(req)
    const ipHash = hashIP(ip)
    const userAgent = req.headers.get('user-agent') || ''
    const referrer = req.headers.get('referer') || req.headers.get('referrer') || null
    const deviceType = detectDeviceType(userAgent)
    const geo = lookupGeoLocation(ip)

    console.log('[Analytics] Tracking view:', { ip, ipHash: ipHash.substring(0, 8) + '...', deviceType })

    // Create view record
    await prisma.shareView.create({
      data: {
        sharedAnalysisId,
        ipHash,
        userAgent,
        referrer,
        deviceType,
        country: geo.country,
        city: geo.city
      }
    })

    // Update uniqueViewers array if this is a new viewer
    // Check if IP hash already exists to avoid duplicates
    const share = await prisma.sharedAnalysis.findUnique({
      where: { id: sharedAnalysisId },
      select: { uniqueViewers: true }
    })

    if (share && !share.uniqueViewers.includes(ipHash)) {
      await prisma.sharedAnalysis.update({
        where: { id: sharedAnalysisId },
        data: {
          uniqueViewers: {
            push: ipHash
          }
        }
      })
      console.log('[Analytics] New unique viewer added')
    } else {
      console.log('[Analytics] Returning viewer (IP hash exists)')
    }
  } catch (error) {
    console.error('[Analytics] Track view error:', error)
    // Don't throw - tracking failure shouldn't break the request
  }
}

// Helper function to increment view count
async function incrementViewCount(sharedAnalysisId: string) {
  try {
    const result = await prisma.sharedAnalysis.update({
      where: { id: sharedAnalysisId },
      data: {
        viewCount: {
          increment: 1
        }
      },
      select: { viewCount: true }
    })
    console.log('[Analytics] View count incremented to:', result.viewCount)
  } catch (error) {
    console.error('[Analytics] Increment view count error:', error)
  }
}

// DELETE - Revoke share access
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { slug } = await params

    // Find and verify ownership
    const share = await prisma.sharedAnalysis.findUnique({
      where: { slug }
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

    // Delete share (cascade will delete associated views)
    await prisma.sharedAnalysis.delete({
      where: { slug }
    })

    return NextResponse.json({
      success: true,
      message: 'Share revoked successfully'
    })
  } catch (error) {
    console.error('Share deletion error:', error)
    return NextResponse.json(
      { error: 'Failed to revoke share' },
      { status: 500 }
    )
  }
}
