import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hashIP, getClientIP } from '@/lib/utils/ip-hash'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { slug, timeSpent } = body

    if (!slug || !timeSpent) {
      return NextResponse.json(
        { error: 'Missing slug or timeSpent' },
        { status: 400 }
      )
    }

    // Find the share
    const share = await prisma.sharedAnalysis.findUnique({
      where: { slug },
      select: { id: true }
    })

    if (!share) {
      return NextResponse.json(
        { error: 'Share not found' },
        { status: 404 }
      )
    }

    // Get IP hash to find the view record
    const ip = getClientIP(req)
    const ipHash = hashIP(ip)

    // Update the most recent view from this IP with time spent
    await prisma.shareView.updateMany({
      where: {
        sharedAnalysisId: share.id,
        ipHash,
        timeSpent: null // Only update if not already set
      },
      data: {
        timeSpent: timeSpent
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Time tracking error:', error)
    // Don't fail - tracking is optional
    return NextResponse.json({ success: false }, { status: 200 })
  }
}
