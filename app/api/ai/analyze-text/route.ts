import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { AIService } from '@/lib/services/ai.service'

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!AIService.isConfigured()) {
      return NextResponse.json(
        { error: 'AI service not configured. Please add OPENAI_API_KEY to environment variables.' },
        { status: 503 }
      )
    }

    const body = await req.json()
    const { texts, datasetId, analysisType } = body

    if (!texts || !Array.isArray(texts) || texts.length === 0) {
      return NextResponse.json({ error: 'No text data provided' }, { status: 400 })
    }

    // Verify dataset ownership if datasetId provided and keep the dataset for later
    let existingDataset: { id: string; stats?: unknown } | null = null
    if (datasetId) {
      const dataset = await prisma.dataset.findFirst({
        where: {
          id: datasetId,
          userId: session.user.id
        },
        select: { id: true, stats: true }
      })

      if (!dataset) {
        return NextResponse.json({ error: 'Dataset not found' }, { status: 404 })
      }

      existingDataset = dataset
    }

    let result: any

    switch (analysisType) {
      case 'themes':
        result = await AIService.extractThemes(texts)
        break

      case 'sentiment':
        // Analyze sentiment for each text (sample up to 10)
        const sentiments = await Promise.all(
          texts.slice(0, 10).map(text => AIService.analyzeSentiment(text))
        )

        // Aggregate results
        const overallPositive = sentiments.reduce((acc, s) => acc + (s.sentiment_scores?.positive ?? 0), 0) / sentiments.length
        const overallNegative = sentiments.reduce((acc, s) => acc + (s.sentiment_scores?.negative ?? 0), 0) / sentiments.length
        const overallNeutral = sentiments.reduce((acc, s) => acc + (s.sentiment_scores?.neutral ?? 0), 0) / sentiments.length

        result = {
          individual: sentiments,
          aggregate: {
            overall_sentiment:
              overallPositive > overallNegative ? 'positive' :
              overallNegative > overallPositive ? 'negative' : 'neutral',
            sentiment_scores: {
              positive: overallPositive,
              negative: overallNegative,
              neutral: overallNeutral
            },
            sample_size: sentiments.length,
            total_texts: texts.length
          }
        }
        break

      case 'both':
        const [themes, sentimentResults] = await Promise.all([
          AIService.extractThemes(texts),
          Promise.all(texts.slice(0, 5).map(text => AIService.analyzeSentiment(text)))
        ])

        result = {
          themes,
          sentiments: sentimentResults
        }
        break

      default:
        return NextResponse.json({ error: 'Invalid analysis type' }, { status: 400 })
    }

    // Store analysis results if dataset provided
    if (datasetId && existingDataset) {
      // Ensure we have a plain object to spread. database JSON fields can be anything (null, array, string, ...)
      const statsCandidate = existingDataset.stats
      let existingStats: Record<string, any> = {}

      if (statsCandidate && typeof statsCandidate === 'object' && !Array.isArray(statsCandidate)) {
        // safe to spread
        existingStats = statsCandidate as Record<string, any>
      }

      const mergedStats = {
        ...existingStats,
        aiAnalysis: {
          ...result,
          analyzedAt: new Date().toISOString()
        }
      }

      await prisma.dataset.update({
        where: { id: datasetId },
        data: {
          stats: mergedStats
        }
      })
    }

    return NextResponse.json({
      success: true,
      analysis: result,
      tokensUsed: texts.join(' ').length / 4, // Rough estimate
      estimatedCost: AIService.estimateCost(texts.join(' ').length / 4)
    })
  } catch (error) {
    console.error('AI analysis error:', error)
    return NextResponse.json({ error: 'Failed to analyze text' }, { status: 500 })
  }
}
