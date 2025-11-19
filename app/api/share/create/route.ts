import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { generateSlug } from '@/lib/utils/slug'
import bcrypt from 'bcryptjs'

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const {
      shareType, // 'correlation' or 'dashboard'
      resourceId, // correlationId or dashboardId
      shareMode, // 'public' or 'private'
      password, // Optional password for private shares
      expiresAt, // Optional expiration date
      brandingConfig // Optional custom branding
    } = body

    // Validate required fields
    if (!shareType || !resourceId || !shareMode) {
      return NextResponse.json(
        { error: 'Missing required fields: shareType, resourceId, shareMode' },
        { status: 400 }
      )
    }

    // Verify the resource belongs to the user
    if (shareType === 'correlation') {
      const correlation = await prisma.correlationAnalysis.findFirst({
        where: { id: resourceId, userId: session.user.id }
      })
      if (!correlation) {
        return NextResponse.json(
          { error: 'Correlation analysis not found' },
          { status: 404 }
        )
      }
    } else if (shareType === 'dashboard') {
      const dashboard = await prisma.dashboard.findFirst({
        where: { id: resourceId, userId: session.user.id }
      })
      if (!dashboard) {
        return NextResponse.json(
          { error: 'Dashboard not found' },
          { status: 404 }
        )
      }
    } else {
      return NextResponse.json(
        { error: 'Invalid shareType. Must be "correlation" or "dashboard"' },
        { status: 400 }
      )
    }

    // Generate unique slug
    const slug = generateSlug(12)

    // Hash password if provided
    let hashedPassword = null
    if (password && password.trim()) {
      hashedPassword = await bcrypt.hash(password, 10)
    }

    // Create shared analysis
    const sharedAnalysis = await prisma.sharedAnalysis.create({
      data: {
        shareType,
        resourceId,
        shareMode,
        slug,
        password: hashedPassword,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        brandingConfig: brandingConfig || null,
        userId: session.user.id
      }
    })

    // Return share URL
    const shareUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/share/${slug}`

    return NextResponse.json({
      success: true,
      share: {
        id: sharedAnalysis.id,
        slug: sharedAnalysis.slug,
        shareUrl,
        shareMode: sharedAnalysis.shareMode,
        expiresAt: sharedAnalysis.expiresAt,
        createdAt: sharedAnalysis.createdAt
      }
    })
  } catch (error) {
    console.error('Share creation error:', error)
    return NextResponse.json(
      { error: 'Failed to create share' },
      { status: 500 }
    )
  }
}
