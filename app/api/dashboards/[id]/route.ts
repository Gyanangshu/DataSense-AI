import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET single dashboard
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

    const dashboard = await prisma.dashboard.findFirst({
      where: {
        id,
        userId: session.user.id
      },
      include: {
        visualizations: {
          include: {
            dataset: {
              select: {
                id: true,
                name: true,
                columns: true,
                types: true,
                data: true
              }
            }
          }
        }
      }
    })

    if (!dashboard) {
      return NextResponse.json({ error: 'Dashboard not found' }, { status: 404 })
    }

    return NextResponse.json(dashboard)
  } catch (error) {
    console.error('Error fetching dashboard:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dashboard' },
      { status: 500 }
    )
  }
}

// PUT update dashboard
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
    const { name, description, config, isPublic } = body

    const dashboard = await prisma.dashboard.findFirst({
      where: {
        id,
        userId: session.user.id
      }
    })

    if (!dashboard) {
      return NextResponse.json({ error: 'Dashboard not found' }, { status: 404 })
    }

    const updated = await prisma.dashboard.update({
      where: { id },
      data: {
        name,
        description,
        config,
        isPublic
      }
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Error updating dashboard:', error)
    return NextResponse.json(
      { error: 'Failed to update dashboard' },
      { status: 500 }
    )
  }
}

// DELETE dashboard
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

    const dashboard = await prisma.dashboard.findFirst({
      where: {
        id,
        userId: session.user.id
      }
    })

    if (!dashboard) {
      return NextResponse.json({ error: 'Dashboard not found' }, { status: 404 })
    }

    // Unlink visualizations
    await prisma.visualization.updateMany({
      where: { dashboardId: id },
      data: { dashboardId: null }
    })

    // Delete dashboard
    await prisma.dashboard.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting dashboard:', error)
    return NextResponse.json(
      { error: 'Failed to delete dashboard' },
      { status: 500 }
    )
  }
}
