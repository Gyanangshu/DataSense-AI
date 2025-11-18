import { AIService } from './ai.service'

interface Dataset {
  data: any
  columns?: any
  types?: any
}

interface Document {
  content: string
  themes?: any
  sentiment?: any
  keywords?: any
}

interface AnalysisInput {
  dataset: Dataset
  document?: Document | null
}

interface Correlation {
  type: 'numeric' | 'thematic' | 'sentiment'
  column1?: string
  column2?: string
  theme?: string
  coefficient?: number
  strength: 'strong' | 'moderate' | 'weak'
  direction?: 'positive' | 'negative'
  description: string
}

interface Insight {
  type: 'opportunity' | 'risk' | 'trend' | 'pattern'
  title: string
  description: string
  confidence: number
  relatedCorrelations: number[]
}

export class CorrelationService {
  /**
   * Main analysis function
   */
  static async analyze(input: AnalysisInput): Promise<{
    correlations: Correlation[]
    insights: Insight[]
    narrative: string
  }> {
    const correlations: Correlation[] = []
    const insights: Insight[] = []

    // Step 1: Analyze numeric correlations in the dataset
    const numericCorrelations = this.analyzeNumericCorrelations(input.dataset)
    correlations.push(...numericCorrelations)

    // Step 2: If document exists, analyze mixed-methods correlations
    if (input.document) {
      const thematicCorrelations = await this.analyzeThematicCorrelations(
        input.dataset,
        input.document
      )
      correlations.push(...thematicCorrelations)

      const sentimentCorrelations = this.analyzeSentimentCorrelations(
        input.dataset,
        input.document
      )
      correlations.push(...sentimentCorrelations)
    }

    // Step 3: Generate insights from correlations
    const generatedInsights = this.generateInsights(correlations, input.dataset, input.document)
    insights.push(...generatedInsights)

    // Step 4: Use AI to generate narrative
    const narrative = await this.generateNarrative(correlations, insights, input)

    return {
      correlations,
      insights,
      narrative
    }
  }

  /**
   * Analyze correlations between numeric columns
   */
  private static analyzeNumericCorrelations(dataset: Dataset): Correlation[] {
    const correlations: Correlation[] = []

    try {
      const data = dataset.data as any[]
      if (!data || data.length === 0) return correlations

      // Get numeric columns
      const columns = Object.keys(data[0])
      const numericColumns = columns.filter(col => {
        const sample = data[0][col]
        return typeof sample === 'number' || !isNaN(parseFloat(sample))
      })

      // Calculate correlations between numeric columns
      for (let i = 0; i < numericColumns.length; i++) {
        for (let j = i + 1; j < numericColumns.length; j++) {
          const col1 = numericColumns[i]
          const col2 = numericColumns[j]

          const coefficient = this.pearsonCorrelation(
            data.map(row => parseFloat(row[col1])),
            data.map(row => parseFloat(row[col2]))
          )

          // Only report significant correlations
          if (Math.abs(coefficient) > 0.3) {
            const strength = Math.abs(coefficient) > 0.7 ? 'strong' :
                           Math.abs(coefficient) > 0.5 ? 'moderate' : 'weak'

            correlations.push({
              type: 'numeric',
              column1: col1,
              column2: col2,
              coefficient,
              strength,
              direction: coefficient > 0 ? 'positive' : 'negative',
              description: `${strength} ${coefficient > 0 ? 'positive' : 'negative'} correlation between ${col1} and ${col2} (r=${coefficient.toFixed(2)})`
            })
          }
        }
      }
    } catch (error) {
      console.error('Error analyzing numeric correlations:', error)
    }

    return correlations
  }

  /**
   * Analyze correlations between document themes and dataset metrics
   */
  private static async analyzeThematicCorrelations(
    dataset: Dataset,
    document: Document
  ): Promise<Correlation[]> {
    const correlations: Correlation[] = []

    try {
      const data = dataset.data as any[]
      const themes = document.themes as Array<{ name: string; relevance: number }> || []

      if (!data || data.length === 0 || themes.length === 0) return correlations

      // Look for text columns that might contain theme-related keywords
      const columns = Object.keys(data[0])
      const textColumns = columns.filter(col => {
        const sample = data[0][col]
        return typeof sample === 'string' && sample.length > 10
      })

      // For each theme, check if it appears in text columns and correlates with numeric data
      for (const theme of themes) {
        const themeKeywords = theme.name.toLowerCase().split(' ')

        for (const textCol of textColumns) {
          // Count occurrences of theme in this column
          const matchingRows = data.filter(row => {
            const text = (row[textCol] || '').toString().toLowerCase()
            return themeKeywords.some(keyword => text.includes(keyword))
          })

          const matchPercentage = (matchingRows.length / data.length) * 100

          if (matchPercentage > 10) { // Theme appears in >10% of rows
            correlations.push({
              type: 'thematic',
              theme: theme.name,
              column1: textCol,
              strength: matchPercentage > 50 ? 'strong' : matchPercentage > 25 ? 'moderate' : 'weak',
              description: `Theme "${theme.name}" appears in ${matchPercentage.toFixed(1)}% of ${textCol} entries`
            })
          }
        }
      }
    } catch (error) {
      console.error('Error analyzing thematic correlations:', error)
    }

    return correlations
  }

  /**
   * Analyze correlation between document sentiment and numeric metrics
   */
  private static analyzeSentimentCorrelations(
    dataset: Dataset,
    document: Document
  ): Correlation[] {
    const correlations: Correlation[] = []

    try {
      const sentiment = document.sentiment as { overall: string; score: number } || null
      if (!sentiment) return correlations

      const data = dataset.data as any[]
      if (!data || data.length === 0) return correlations

      // Try to find sentiment/rating columns in the dataset
      const columns = Object.keys(data[0])
      const sentimentColumns = columns.filter(col =>
        col.toLowerCase().includes('rating') ||
        col.toLowerCase().includes('score') ||
        col.toLowerCase().includes('satisfaction') ||
        col.toLowerCase().includes('nps')
      )

      for (const col of sentimentColumns) {
        const values = data.map(row => parseFloat(row[col])).filter(v => !isNaN(v))
        if (values.length === 0) continue

        const average = values.reduce((a, b) => a + b, 0) / values.length

        // Map sentiment to numeric scale
        const sentimentNumeric = sentiment.overall === 'positive' ? 0.8 :
                                 sentiment.overall === 'negative' ? 0.2 : 0.5

        // Simple correlation: if both are high or both are low, it's correlated
        const datasetSentiment = average > 7 ? 'positive' : average < 4 ? 'negative' : 'neutral'

        if (datasetSentiment === sentiment.overall) {
          correlations.push({
            type: 'sentiment',
            column1: col,
            strength: 'moderate',
            direction: 'positive',
            description: `Document sentiment (${sentiment.overall}) aligns with ${col} (avg: ${average.toFixed(1)})`
          })
        }
      }
    } catch (error) {
      console.error('Error analyzing sentiment correlations:', error)
    }

    return correlations
  }

  /**
   * Generate insights from correlations
   */
  private static generateInsights(
    correlations: Correlation[],
    dataset: Dataset,
    document?: Document | null
  ): Insight[] {
    const insights: Insight[] = []

    // Group correlations by strength
    const strongCorrelations = correlations.filter(c => c.strength === 'strong')
    const thematicCorrelations = correlations.filter(c => c.type === 'thematic')

    // Insight 1: Strongest relationships
    if (strongCorrelations.length > 0) {
      insights.push({
        type: 'pattern',
        title: 'Strong Relationships Identified',
        description: `Found ${strongCorrelations.length} strong correlation(s) in your data that warrant attention.`,
        confidence: 0.8,
        relatedCorrelations: []
      })
    }

    // Insight 2: Thematic patterns
    if (thematicCorrelations.length > 0) {
      insights.push({
        type: 'opportunity',
        title: 'Qualitative Themes Match Data Patterns',
        description: `Discovered ${thematicCorrelations.length} theme(s) from your text data that correlate with quantitative metrics.`,
        confidence: 0.7,
        relatedCorrelations: []
      })
    }

    // Insight 3: Negative correlations (potential risks)
    const negativeCorrelations = correlations.filter(c => c.direction === 'negative')
    if (negativeCorrelations.length > 0) {
      insights.push({
        type: 'risk',
        title: 'Inverse Relationships Detected',
        description: `Found ${negativeCorrelations.length} negative correlation(s) indicating opposing trends.`,
        confidence: 0.75,
        relatedCorrelations: []
      })
    }

    return insights
  }

  /**
   * Use AI to generate a narrative explanation
   */
  private static async generateNarrative(
    correlations: Correlation[],
    insights: Insight[],
    input: AnalysisInput
  ): Promise<string> {
    try {
      const prompt = `You are a data analyst. Generate a concise 2-3 paragraph narrative explaining the following correlation analysis results:

Correlations found: ${correlations.length}
- Strong correlations: ${correlations.filter(c => c.strength === 'strong').length}
- Moderate correlations: ${correlations.filter(c => c.strength === 'moderate').length}

Key correlations:
${correlations.slice(0, 5).map(c => `- ${c.description}`).join('\n')}

Key insights:
${insights.map(i => `- ${i.title}: ${i.description}`).join('\n')}

${input.document ? 'This analysis combines quantitative dataset with qualitative document insights.' : 'This analysis focuses on quantitative correlations within the dataset.'}

Provide:
1. Summary of what was analyzed
2. Key findings and their implications
3. Actionable recommendations

Write in clear, business-friendly language. Be specific and actionable.`

      const narrative = await AIService.generateText(prompt, 500)
      return narrative || 'Analysis completed. Review the correlations and insights above for detailed findings.'
    } catch (error) {
      console.error('Error generating narrative:', error)
      return 'Analysis completed successfully. Review the correlations and insights for detailed findings.'
    }
  }

  /**
   * Calculate Pearson correlation coefficient
   */
  private static pearsonCorrelation(x: number[], y: number[]): number {
    const n = Math.min(x.length, y.length)
    if (n === 0) return 0

    const sumX = x.slice(0, n).reduce((a, b) => a + b, 0)
    const sumY = y.slice(0, n).reduce((a, b) => a + b, 0)
    const sumXY = x.slice(0, n).reduce((sum, xi, i) => sum + xi * y[i], 0)
    const sumX2 = x.slice(0, n).reduce((sum, xi) => sum + xi * xi, 0)
    const sumY2 = y.slice(0, n).reduce((sum, yi) => sum + yi * yi, 0)

    const numerator = n * sumXY - sumX * sumY
    const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY))

    if (denominator === 0) return 0

    return numerator / denominator
  }
}
