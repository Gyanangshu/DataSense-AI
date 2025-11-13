import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import ChartService from '@/lib/services/chart.service'

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { datasetId } = body

    // Fetch dataset
    const dataset = await prisma.dataset.findFirst({
      where: {
        id: datasetId,
        userId: session.user.id
      },
      select: {
        name: true,
        columns: true,
        types: true,
        stats: true,
        rowCount: true
      }
    })

    if (!dataset) {
      return NextResponse.json({ error: 'Dataset not found' }, { status: 404 })
    }

    // Analyze columns
    const columns = ChartService.analyzeColumns(
      dataset.columns as string[],
      dataset.types as Record<string, string>,
      dataset.stats as Record<string, Record<string, number | string | undefined>>
    )

    // Get chart recommendations
    const recommendations = ChartService.recommendCharts(
      columns,
      dataset.name,
      dataset.rowCount || 0
    )

    return NextResponse.json({
      recommendations: recommendations.map(rec => ({
        type: rec.config.type,
        title: rec.config.title,
        description: rec.config.description,
        xAxis: rec.config.xAxis,
        yAxis: rec.config.yAxis,
        aggregation: rec.config.aggregation,
        config: rec.config,
        priority: rec.priority,
        reasoning: rec.reasoning,
        confidence: rec.config.confidence
      }))
    })
  } catch (error) {
    console.error('Chart suggestion error:', error)
    return NextResponse.json(
      { error: 'Failed to generate chart suggestions' },
      { status: 500 }
    )
  }
}

// GET endpoint to get suggestions for a specific dataset
export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = req.nextUrl.searchParams
    const datasetId = searchParams.get('datasetId')

    if (!datasetId) {
      return NextResponse.json({ error: 'Dataset ID required' }, { status: 400 })
    }

    // Fetch dataset
    const dataset = await prisma.dataset.findFirst({
      where: {
        id: datasetId,
        userId: session.user.id
      },
      select: {
        name: true,
        columns: true,
        types: true,
        stats: true,
        rowCount: true
      }
    })

    if (!dataset) {
      return NextResponse.json({ error: 'Dataset not found' }, { status: 404 })
    }

    // Analyze columns
    const columns = ChartService.analyzeColumns(
      dataset.columns as string[],
      dataset.types as Record<string, string>,
      dataset.stats as Record<string, Record<string, number | string | undefined>>
    )

    // Get chart recommendations
    const recommendations = ChartService.recommendCharts(
      columns,
      dataset.name,
      dataset.rowCount || 0
    )

    return NextResponse.json({
      recommendations: recommendations.slice(0, 5) // Top 5 recommendations
    })
  } catch (error) {
    console.error('Chart suggestion error:', error)
    return NextResponse.json(
      { error: 'Failed to generate chart suggestions' },
      { status: 500 }
    )
  }
}
