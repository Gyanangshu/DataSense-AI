import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const resourceId = searchParams.get('resourceId')

    if (!resourceId) {
      return NextResponse.json(
        { error: 'Missing resourceId parameter' },
        { status: 400 }
      )
    }

    // Find share for this resource belonging to the user
    const share = await prisma.sharedAnalysis.findFirst({
      where: {
        resourceId,
        userId: session.user.id
      },
      select: {
        id: true,
        slug: true,
        shareType: true,
        shareMode: true,
        expiresAt: true,
        brandingConfig: true,
        viewCount: true,
        createdAt: true
      }
    })

    return NextResponse.json({
      share: share || null
    })
  } catch (error) {
    console.error('Share list error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch shares' },
      { status: 500 }
    )
  }
}
