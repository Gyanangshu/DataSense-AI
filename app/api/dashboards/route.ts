import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET all dashboards for current user
export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const dashboards = await prisma.dashboard.findMany({
      where: { userId: session.user.id },
      include: {
        visualizations: {
          include: {
            dataset: {
              select: {
                id: true,
                name: true
              }
            }
          }
        },
        _count: {
          select: { visualizations: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(dashboards)
  } catch (error) {
    console.error('Error fetching dashboards:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dashboards' },
      { status: 500 }
    )
  }
}

// POST create new dashboard
export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { name, description, config } = body

    if (!name || !config) {
      return NextResponse.json(
        { error: 'Name and config are required' },
        { status: 400 }
      )
    }

    // Create dashboard
    const dashboard = await prisma.dashboard.create({
      data: {
        name,
        description,
        config,
        userId: session.user.id
      }
    })

    // Update visualizations to link to dashboard
    if (config.layout && Array.isArray(config.layout)) {
      const visualizationIds = config.layout.map((item: { visualizationId: string }) => item.visualizationId)

      await prisma.visualization.updateMany({
        where: {
          id: { in: visualizationIds }
        },
        data: {
          dashboardId: dashboard.id
        }
      })
    }

    return NextResponse.json(dashboard)
  } catch (error) {
    console.error('Error creating dashboard:', error)
    return NextResponse.json(
      { error: 'Failed to create dashboard' },
      { status: 500 }
    )
  }
}
