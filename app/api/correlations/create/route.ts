import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { CorrelationService } from '@/lib/services/correlation.service'

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { name, description, datasetId, documentId } = body

    if (!name || !datasetId) {
      return NextResponse.json(
        { error: 'Name and dataset are required' },
        { status: 400 }
      )
    }

    // Fetch the dataset
    const dataset = await prisma.dataset.findFirst({
      where: { id: datasetId, userId: session.user.id }
    })

    if (!dataset) {
      return NextResponse.json({ error: 'Dataset not found' }, { status: 404 })
    }

    // Fetch the document if provided
    let document = null
    if (documentId) {
      document = await prisma.textDocument.findFirst({
        where: { id: documentId, userId: session.user.id }
      })

      if (!document) {
        return NextResponse.json({ error: 'Document not found' }, { status: 404 })
      }
    }

    // Perform correlation analysis
    const analysisResults = await CorrelationService.analyze({
      dataset,
      document
    })

    // Save the analysis
    const correlation = await prisma.correlationAnalysis.create({
      data: {
        name,
        description,
        datasetId,
        documentId: documentId || null,
        correlations: analysisResults.correlations,
        insights: analysisResults.insights,
        narrative: analysisResults.narrative,
        userId: session.user.id
      }
    })

    return NextResponse.json(correlation)
  } catch (error) {
    console.error('Correlation analysis error:', error)
    return NextResponse.json(
      { error: 'Failed to create correlation analysis' },
      { status: 500 }
    )
  }
}
