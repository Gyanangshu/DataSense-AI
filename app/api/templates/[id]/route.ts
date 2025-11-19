import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const template = await prisma.analysisTemplate.findFirst({
      where: {
        id,
        OR: [
          { userId: null }, // System template
          { userId: session.user.id } // User's template
        ]
      }
    })

    if (!template) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      )
    }

    // Increment usage count
    await prisma.analysisTemplate.update({
      where: { id },
      data: {
        usageCount: {
          increment: 1
        }
      }
    })

    return NextResponse.json(template)
  } catch (error) {
    console.error('Template fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch template' },
      { status: 500 }
    )
  }
}
