import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { name, type, config, datasetId, dashboardId } = body

    // Verify dataset ownership
    const dataset = await prisma.dataset.findFirst({
      where: {
        id: datasetId,
        userId: session.user.id
      }
    })

    if (!dataset) {
      return NextResponse.json({ error: 'Dataset not found' }, { status: 404 })
    }

    const visualization = await prisma.visualization.create({
      data: {
        name,
        type,
        config,
        datasetId,
        dashboardId
      }
    })

    return NextResponse.json(visualization)
  } catch (error) {
    console.error('Visualization creation error:', error)
    return NextResponse.json(
      { error: 'Failed to create visualization' },
      { status: 500 }
    )
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = req.nextUrl.searchParams
    const datasetId = searchParams.get('datasetId')
    const dashboardId = searchParams.get('dashboardId')

    const where: any = {}
    
    if (datasetId) {
      where.dataset = {
        id: datasetId,
        userId: session.user.id
      }
    }
    
    if (dashboardId) {
      where.dashboard = {
        id: dashboardId,
        userId: session.user.id
      }
    }

    const visualizations = await prisma.visualization.findMany({
      where,
      include: {
        dataset: {
          select: {
            name: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(visualizations)
  } catch (error) {
    console.error('Visualization fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch visualizations' },
      { status: 500 }
    )
  }
}