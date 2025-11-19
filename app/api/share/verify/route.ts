import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { slug, password } = body

    if (!slug) {
      return NextResponse.json(
        { error: 'Missing slug' },
        { status: 400 }
      )
    }

    // Find shared analysis
    const share = await prisma.sharedAnalysis.findUnique({
      where: { slug },
      select: {
        id: true,
        password: true,
        expiresAt: true
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
        { status: 410 } // 410 Gone
      )
    }

    // If password protected, verify password
    if (share.password) {
      if (!password) {
        return NextResponse.json(
          { error: 'Password required', requiresPassword: true },
          { status: 401 }
        )
      }

      const isValid = await bcrypt.compare(password, share.password)
      if (!isValid) {
        return NextResponse.json(
          { error: 'Incorrect password' },
          { status: 401 }
        )
      }
    }

    // Verification successful - set a cookie to allow access
    const response = NextResponse.json({
      success: true,
      shareId: share.id
    })

    // Set a cookie that expires in 24 hours
    response.cookies.set(`share_verified_${slug}`, 'true', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 // 24 hours
    })

    return response
  } catch (error) {
    console.error('Share verification error:', error)
    return NextResponse.json(
      { error: 'Failed to verify share' },
      { status: 500 }
    )
  }
}
