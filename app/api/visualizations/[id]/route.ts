import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const visualization = await prisma.visualization.findFirst({
      where: {
        id,
        dataset: {
          userId: session.user.id
        }
      },
      include: {
        dataset: {
          select: {
            id: true,
            name: true,
            columns: true,
            types: true
          }
        }
      }
    })

    if (!visualization) {
      return NextResponse.json({ error: 'Visualization not found' }, { status: 404 })
    }

    return NextResponse.json(visualization)
  } catch (error) {
    console.error('Visualization fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch visualization' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Verify ownership before deleting
    const visualization = await prisma.visualization.findFirst({
      where: {
        id,
        dataset: {
          userId: session.user.id
        }
      }
    })

    if (!visualization) {
      return NextResponse.json({ error: 'Visualization not found' }, { status: 404 })
    }

    await prisma.visualization.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Visualization deletion error:', error)
    return NextResponse.json(
      { error: 'Failed to delete visualization' },
      { status: 500 }
    )
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await req.json()
    const { name, type, config } = body

    // Verify ownership
    const visualization = await prisma.visualization.findFirst({
      where: {
        id,
        dataset: {
          userId: session.user.id
        }
      }
    })

    if (!visualization) {
      return NextResponse.json({ error: 'Visualization not found' }, { status: 404 })
    }

    const updated = await prisma.visualization.update({
      where: { id },
      data: {
        name,
        type,
        config
      }
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Visualization update error:', error)
    return NextResponse.json(
      { error: 'Failed to update visualization' },
      { status: 500 }
    )
  }
}
