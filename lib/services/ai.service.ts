// import OpenAI from 'openai'
// import { z } from 'zod'

// // Initialize OpenAI client
// const openai = new OpenAI({
//   apiKey: process.env.OPENAI_API_KEY || '',
// })

// // Response schemas for structured outputs
// const ThemeExtractionSchema = z.object({
//   themes: z.array(z.object({
//     theme: z.string(),
//     description: z.string(),
//     relevance: z.number().min(0).max(1),
//     keywords: z.array(z.string()),
//     frequency: z.number()
//   })),
//   summary: z.string()
// })

// const SentimentAnalysisSchema = z.object({
//   overall_sentiment: z.enum(['positive', 'negative', 'neutral', 'mixed']),
//   sentiment_scores: z.object({
//     positive: z.number().min(0).max(1),
//     negative: z.number().min(0).max(1),
//     neutral: z.number().min(0).max(1)
//   }),
//   key_emotions: z.array(z.string()),
//   confidence: z.number().min(0).max(1)
// })

// const CorrelationInsightSchema = z.object({
//   correlations: z.array(z.object({
//     qualitative_theme: z.string(),
//     quantitative_metric: z.string(),
//     correlation_strength: z.number().min(-1).max(1),
//     insight: z.string(),
//     confidence: z.number().min(0).max(1)
//   })),
//   key_findings: z.array(z.string()),
//   recommendations: z.array(z.string())
// })

// export class AIService {
//   /**
//    * Extract themes from text data
//    */
//   static async extractThemes(
//     texts: string[],
//     maxThemes: number = 5
//   ): Promise<z.infer<typeof ThemeExtractionSchema>> {
//     try {
//       const combinedText = texts.join('\n\n')
//       const truncatedText = combinedText.substring(0, 8000) // Limit context

//       const completion = await openai.chat.completions.create({
//         model: 'gpt-3.5-turbo-1106',
//         messages: [
//           {
//             role: 'system',
//             content: `You are an expert qualitative data analyst. Extract the main themes from the provided text data. 
//             Return a JSON object with themes array and summary. Each theme should have:
//             - theme: concise name
//             - description: brief explanation
//             - relevance: 0-1 score
//             - keywords: related terms
//             - frequency: approximate occurrence count`
//           },
//           {
//             role: 'user',
//             content: `Extract up to ${maxThemes} main themes from this text:\n\n${truncatedText}`
//           }
//         ],
//         response_format: { type: 'json_object' },
//         temperature: 0.3,
//         max_tokens: 1000
//       })

//       const response = completion.choices[0].message.content
//       if (!response) throw new Error('No response from AI')

//       const parsed = JSON.parse(response)
//       return ThemeExtractionSchema.parse(parsed)
//     } catch (error) {
//       console.error('Theme extraction error:', error)
//       throw new Error('Failed to extract themes')
//     }
//   }

//   /**
//    * Analyze sentiment of text data
//    */
//   static async analyzeSentiment(
//     text: string
//   ): Promise<z.infer<typeof SentimentAnalysisSchema>> {
//     try {
//       const truncatedText = text.substring(0, 4000)

//       const completion = await openai.chat.completions.create({
//         model: 'gpt-3.5-turbo-1106',
//         messages: [
//           {
//             role: 'system',
//             content: `You are a sentiment analysis expert. Analyze the sentiment of the provided text.
//             Return a JSON object with:
//             - overall_sentiment: positive, negative, neutral, or mixed
//             - sentiment_scores: object with positive, negative, neutral scores (0-1)
//             - key_emotions: array of detected emotions
//             - confidence: 0-1 score`
//           },
//           {
//             role: 'user',
//             content: `Analyze sentiment of: ${truncatedText}`
//           }
//         ],
//         response_format: { type: 'json_object' },
//         temperature: 0.2,
//         max_tokens: 500
//       })

//       const response = completion.choices[0].message.content
//       if (!response) throw new Error('No response from AI')

//       const parsed = JSON.parse(response)
//       return SentimentAnalysisSchema.parse(parsed)
//     } catch (error) {
//       console.error('Sentiment analysis error:', error)
//       throw new Error('Failed to analyze sentiment')
//     }
//   }

//   /**
//    * Find correlations between qualitative and quantitative data
//    */
//   static async findCorrelations(
//     themes: Array<{ theme: string; keywords: string[] }>,
//     quantitativeData: Array<{ column: string; values: number[]; stats: any }>,
//     textData: string[]
//   ): Promise<z.infer<typeof CorrelationInsightSchema>> {
//     try {
//       const completion = await openai.chat.completions.create({
//         model: 'gpt-3.5-turbo-1106',
//         messages: [
//           {
//             role: 'system',
//             content: `You are a mixed-methods data analysis expert. Find meaningful correlations between qualitative themes and quantitative metrics.
//             Return a JSON object with:
//             - correlations: array of correlation objects
//             - key_findings: array of important discoveries
//             - recommendations: array of actionable insights`
//           },
//           {
//             role: 'user',
//             content: `Find correlations between:
            
//             Themes: ${JSON.stringify(themes)}
            
//             Quantitative columns: ${JSON.stringify(quantitativeData.map(d => ({
//               column: d.column,
//               mean: d.stats.mean,
//               min: d.stats.min,
//               max: d.stats.max
//             })))}
            
//             Sample texts containing themes: ${textData.slice(0, 5).join('\n')}`
//           }
//         ],
//         response_format: { type: 'json_object' },
//         temperature: 0.4,
//         max_tokens: 1500
//       })

//       const response = completion.choices[0].message.content
//       if (!response) throw new Error('No response from AI')

//       const parsed = JSON.parse(response)
//       return CorrelationInsightSchema.parse(parsed)
//     } catch (error) {
//       console.error('Correlation analysis error:', error)
//       throw new Error('Failed to find correlations')
//     }
//   }

//   /**
//    * Generate insights from data patterns
//    */
//   static async generateInsights(
//     dataset: {
//       name: string
//       rowCount: number
//       columns: string[]
//       stats: any
//     },
//     themes?: any,
//     sentiments?: any
//   ): Promise<{
//     insights: string[]
//     patterns: Array<{ pattern: string; significance: string }>
//     suggestions: string[]
//   }> {
//     try {
//       const completion = await openai.chat.completions.create({
//         model: 'gpt-3.5-turbo-1106',
//         messages: [
//           {
//             role: 'system',
//             content: `You are a data insights expert. Generate meaningful insights from the provided data analysis.
//             Focus on actionable findings and patterns that would be valuable for decision-making.`
//           },
//           {
//             role: 'user',
//             content: `Generate insights from this analysis:
            
//             Dataset: ${dataset.name}
//             Rows: ${dataset.rowCount}
//             Columns: ${dataset.columns.join(', ')}
            
//             ${themes ? `Themes found: ${JSON.stringify(themes)}` : ''}
//             ${sentiments ? `Sentiment analysis: ${JSON.stringify(sentiments)}` : ''}
            
//             Stats summary: ${JSON.stringify(dataset.stats)}`
//           }
//         ],
//         temperature: 0.5,
//         max_tokens: 1000
//       })

//       const response = completion.choices[0].message.content
//       if (!response) throw new Error('No response from AI')

//       // Parse insights from response
//       const insights: string[] = []
//       const patterns: Array<{ pattern: string; significance: string }> = []
//       const suggestions: string[] = []

//       // Simple parsing of the response
//       const lines = response.split('\n').filter(line => line.trim())
//       let currentSection = 'insights'

//       for (const line of lines) {
//         if (line.toLowerCase().includes('pattern')) {
//           currentSection = 'patterns'
//         } else if (line.toLowerCase().includes('suggestion') || line.toLowerCase().includes('recommend')) {
//           currentSection = 'suggestions'
//         }

//         if (currentSection === 'insights' && !line.includes(':')) {
//           insights.push(line.replace(/^[-•*]\s*/, '').trim())
//         } else if (currentSection === 'patterns') {
//           patterns.push({
//             pattern: line.replace(/^[-•*]\s*/, '').trim(),
//             significance: 'medium'
//           })
//         } else if (currentSection === 'suggestions') {
//           suggestions.push(line.replace(/^[-•*]\s*/, '').trim())
//         }
//       }

//       return {
//         insights: insights.slice(0, 5),
//         patterns: patterns.slice(0, 3),
//         suggestions: suggestions.slice(0, 3)
//       }
//     } catch (error) {
//       console.error('Insight generation error:', error)
//       throw new Error('Failed to generate insights')
//     }
//   }

//   /**
//    * Check if API key is configured
//    */
//   static isConfigured(): boolean {
//     return !!process.env.OPENAI_API_KEY
//   }

//   /**
//    * Estimate token usage for cost calculation
//    */
//   static estimateTokens(text: string): number {
//     // Rough estimation: 1 token ≈ 4 characters
//     return Math.ceil(text.length / 4)
//   }

//   /**
//    * Calculate estimated cost for API usage
//    */
//   static estimateCost(tokens: number, model: string = 'gpt-3.5-turbo'): number {
//     const rates = {
//       'gpt-3.5-turbo': { input: 0.0015, output: 0.002 }, // per 1K tokens
//       'gpt-4': { input: 0.03, output: 0.06 }
//     }
    
//     const rate = rates[model as keyof typeof rates] || rates['gpt-3.5-turbo']
//     return (tokens / 1000) * rate.input
//   }
// }


// lib/services/ai.service.gemini.ts
import { z } from 'zod'
import { GoogleGenAI } from '@google/genai' // JS/TS SDK
// if using a different package, adapt accordingly

// Reuse your existing schemas (copy/paste them here)
const ThemeExtractionSchema = z.object({
  themes: z.array(z.object({
    theme: z.string(),
    description: z.string(),
    relevance: z.number().min(0).max(1),
    keywords: z.array(z.string()),
    frequency: z.number()
  })),
  summary: z.string()
})

const SentimentAnalysisSchema = z.object({
  overall_sentiment: z.enum(['positive', 'negative', 'neutral', 'mixed']),
  sentiment_scores: z.object({
    positive: z.number().min(0).max(1),
    negative: z.number().min(0).max(1),
    neutral: z.number().min(0).max(1)
  }),
  key_emotions: z.array(z.string()),
  confidence: z.number().min(0).max(1)
})

const CorrelationInsightSchema = z.object({
  correlations: z.array(z.object({
    qualitative_theme: z.string(),
    quantitative_metric: z.string(),
    correlation_strength: z.number().min(-1).max(1),
    insight: z.string(),
    confidence: z.number().min(0).max(1)
  })),
  key_findings: z.array(z.string()),
  recommendations: z.array(z.string())
})

// Initialize Gemini client
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || undefined
})

export class AIService {
  /**
   * Helper: run a prompt and return plain text output (Gemini SDK returns .text)
   * We send short, explicit instructions asking the model to return valid JSON.
   * Includes retry logic for handling 503 errors (model overloaded)
   */
  private static async runTextGeneration(prompt: string, model = 'gemini-2.0-flash-lite', temperature = 0.3, maxOutputTokens = 1000, retries = 3) {
    let lastError: any

    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        const resp = await ai.models.generateContent({
          model,
          // contents can be an array of messages/parts depending on SDK; simple text below
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          temperature,
          max_output_tokens: maxOutputTokens
        })

        // The SDK returns a string-friendly representation on many clients; use .text or .output?.[0]
        // Most examples show `response.text`. If your SDK returns a different field, inspect resp.
        const text = (resp as any)?.text ?? (resp?.output?.[0]?.content ?? '')
        return String(text || '')
      } catch (error: any) {
        lastError = error
        const is503 = error?.status === 503 || error?.message?.includes('overloaded') || error?.message?.includes('UNAVAILABLE')

        if (is503 && attempt < retries - 1) {
          // Exponential backoff: wait 1s, 2s, 4s...
          const waitTime = Math.pow(2, attempt) * 1000
          console.log(`Gemini API overloaded (503), retrying in ${waitTime}ms... (attempt ${attempt + 1}/${retries})`)
          await new Promise(resolve => setTimeout(resolve, waitTime))
          continue
        }

        throw error
      }
    }

    throw lastError
  }

  // Extract themes (returns structure validated by zod)
  static async extractThemes(texts: string[], maxThemes = 5) {
    try {
      const combined = texts.join('\n\n').slice(0, 12000) // keep context within model limits
      const system = `You are an expert qualitative data analyst. Extract the main themes from the provided text data. Return a JSON object with keys "themes" and "summary". 
Each theme must include: theme (string), description (string), relevance (0-1), keywords (array of strings), frequency (number).`
      const user = `Extract up to ${maxThemes} main themes from this text (output ONLY valid JSON):\n\n${combined}`

      const prompt = `${system}\n\n${user}`

      const responseText = await this.runTextGeneration(prompt, 'gemini-2.5-flash', 0.3, 1200)

      // parse JSON (Gemini often returns pure JSON if instructed). Be defensive:
      const parsed = JSON.parse(responseText.trim())
      return ThemeExtractionSchema.parse(parsed)
    } catch (err) {
      console.error('Theme extraction error (Gemini):', err)
      throw new Error('Failed to extract themes')
    }
  }

  // Analyze sentiment (returns zod-validated shape)
  static async analyzeSentiment(text: string) {
    try {
      const truncated = text.slice(0, 6000)
      const system = `You are a sentiment analysis expert. Return ONLY a JSON object with:
- overall_sentiment: 'positive'|'negative'|'neutral'|'mixed'
- sentiment_scores: { positive, negative, neutral } (0-1)
- key_emotions: array of strings
- confidence: 0-1`

      const user = `Analyze sentiment of: ${truncated}`

      const responseText = await this.runTextGeneration(`${system}\n\n${user}`, 'gemini-2.5-flash', 0.2, 600)

      const parsed = JSON.parse(responseText.trim())
      return SentimentAnalysisSchema.parse(parsed)
    } catch (err) {
      console.error('Sentiment analysis error (Gemini):', err)
      throw new Error('Failed to analyze sentiment')
    }
  }

  // Find correlations (zod-validated)
  static async findCorrelations(
    themes: Array<{ theme: string; keywords: string[] }>,
    quantitativeData: Array<{ column: string; values: number[]; stats: any }>,
    textData: string[]
  ) {
    try {
      const system = `You are a mixed-methods data analysis expert. Find meaningful correlations between qualitative themes and quantitative metrics.
Return ONLY valid JSON matching this schema: { correlations: [...], key_findings: [...], recommendations: [...] }.`

      const user = `Themes: ${JSON.stringify(themes)}
Quantitative summary: ${JSON.stringify(quantitativeData.map(d => ({ column: d.column, mean: d.stats?.mean, min: d.stats?.min, max: d.stats?.max })))}
Sample texts: ${textData.slice(0, 10).join('\n')}`

      const responseText = await this.runTextGeneration(`${system}\n\n${user}`, 'gemini-2.5-flash', 0.4, 1600)
      const parsed = JSON.parse(responseText.trim())
      return CorrelationInsightSchema.parse(parsed)
    } catch (err) {
      console.error('Correlation analysis error (Gemini):', err)
      throw new Error('Failed to find correlations')
    }
  }

  // Generate high-level insights (free text parsing)
  static async generateInsights(dataset: { name: string; rowCount: number; columns: string[]; stats: any }, themes?: any, sentiments?: any) {
    try {
      const system = `You are a data insights expert. Generate concise, actionable insights based on the analysis.`
      const user = `Dataset: ${dataset.name}\nRows: ${dataset.rowCount}\nColumns: ${dataset.columns.join(', ')}\n${themes ? `Themes: ${JSON.stringify(themes)}\n` : ''}${sentiments ? `Sentiments: ${JSON.stringify(sentiments)}\n` : ''}Stats: ${JSON.stringify(dataset.stats)}\n\nReturn a readable text containing insights, patterns, and suggestions.`

      const responseText = await this.runTextGeneration(`${system}\n\n${user}`, 'gemini-2.5-flash', 0.5, 1000)

      // Naive parsing into lists (same approach you used before)
      const lines = responseText.split('\n').filter(Boolean)
      const insights: string[] = []
      const patterns: Array<{ pattern: string; significance: string }> = []
      const suggestions: string[] = []

      let current = 'insights'
      for (const line of lines) {
        const clean = line.replace(/^[-•*]\s*/, '').trim()
        if (/pattern/i.test(line)) current = 'patterns'
        if (/suggest|recommend/i.test(line)) current = 'suggestions'
        if (current === 'insights') insights.push(clean)
        else if (current === 'patterns') patterns.push({ pattern: clean, significance: 'medium' })
        else if (current === 'suggestions') suggestions.push(clean)
      }

      return {
        insights: insights.slice(0, 5),
        patterns: patterns.slice(0, 3),
        suggestions: suggestions.slice(0, 3)
      }
    } catch (err) {
      console.error('Insight generation error (Gemini):', err)
      throw new Error('Failed to generate insights')
    }
  }

  /**
   * Analyze a text document - extract themes, sentiment, keywords, and summary
   */
  static async analyzeDocument(content: string): Promise<{
    themes: Array<{ name: string; description: string; relevance: number }>
    sentiment: {
      overall: 'positive' | 'negative' | 'neutral'
      score: number
      breakdown: { positive: number; neutral: number; negative: number }
    }
    keywords: string[]
    summary: string
  }> {
    try {
      const truncated = content.slice(0, 12000)
      const system = `You are an expert qualitative data analyst. Analyze the provided text and extract:
1. Main themes (3-5 key themes with descriptions and relevance scores 0-1)
2. Sentiment analysis (overall sentiment and breakdown percentages that sum to 1.0)
3. Keywords (10-15 most important keywords or phrases)
4. A concise summary (2-3 sentences that capture the MAIN POINTS and KEY FINDINGS, not just the first lines)

IMPORTANT: The summary must be a thoughtful synthesis of the document's main ideas, NOT just copying the opening lines.

Return ONLY valid JSON with NO markdown formatting. Use this exact structure:
{
  "themes": [{"name": "Theme Name", "description": "Brief description", "relevance": 0.95}],
  "sentiment": {
    "overall": "positive",
    "score": 0.7,
    "breakdown": {"positive": 0.7, "neutral": 0.2, "negative": 0.1}
  },
  "keywords": ["keyword1", "keyword2"],
  "summary": "Thoughtful 2-3 sentence summary of main points"
}`

      const user = `Analyze this document:\n\n${truncated}`
      const responseText = await this.runTextGeneration(`${system}\n\n${user}`, 'gemini-2.5-flash', 0.3, 1200)

      // Remove markdown code blocks if present
      let jsonText = responseText.trim()
      if (jsonText.startsWith('```json')) {
        jsonText = jsonText.replace(/^```json\s*\n/, '').replace(/\n```\s*$/, '')
      } else if (jsonText.startsWith('```')) {
        jsonText = jsonText.replace(/^```\s*\n/, '').replace(/\n```\s*$/, '')
      }

      console.log('AI Response (first 500 chars):', jsonText.slice(0, 500))
      const parsed = JSON.parse(jsonText.trim())
      console.log('Parsed themes:', parsed.themes?.length || 0, 'themes found')

      return {
        themes: parsed.themes || [],
        sentiment: {
          overall: parsed.sentiment?.overall || 'neutral',
          score: parsed.sentiment?.score || 0,
          breakdown: {
            positive: parsed.sentiment?.breakdown?.positive || 0,
            neutral: parsed.sentiment?.breakdown?.neutral || 1,
            negative: parsed.sentiment?.breakdown?.negative || 0
          }
        },
        keywords: parsed.keywords || [],
        summary: parsed.summary || 'No summary available'
      }
    } catch (error) {
      console.error('Document analysis error:', error)

      // Return fallback analysis
      return this.getFallbackAnalysis(content)
    }
  }

  /**
   * Fallback analysis when AI fails
   */
  private static getFallbackAnalysis(content: string): {
    themes: Array<{ name: string; description: string; relevance: number }>
    sentiment: {
      overall: 'positive' | 'negative' | 'neutral'
      score: number
      breakdown: { positive: number; neutral: number; negative: number }
    }
    keywords: string[]
    summary: string
  } {
    const words = content.toLowerCase().match(/\b[a-z]{4,}\b/g) || []
    const wordFreq = words.reduce((acc, word) => {
      acc[word] = (acc[word] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const keywords = Object.entries(wordFreq)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([word]) => word)

    // Create a better summary by taking sentences from throughout the document
    const sentences = content.match(/[^.!?]+[.!?]+/g) || []
    let summary = 'No summary available'
    if (sentences.length > 0) {
      // Take first sentence and a middle sentence if available
      const firstSentence = sentences[0]?.trim() || ''
      const middleSentence = sentences.length > 2 ? (sentences[Math.floor(sentences.length / 2)]?.trim() || '') : ''
      summary = middleSentence
        ? `${firstSentence} ${middleSentence}`.slice(0, 300)
        : firstSentence.slice(0, 300)
    }

    return {
      themes: [{
        name: 'General Content',
        description: 'Document contains general text content',
        relevance: 1.0
      }],
      sentiment: {
        overall: 'neutral',
        score: 0,
        breakdown: { positive: 0.33, neutral: 0.34, negative: 0.33 }
      },
      keywords,
      summary
    }
  }

  static isConfigured(): boolean {
    return !!process.env.GEMINI_API_KEY
  }

  static estimateTokens(text: string): number {
    return Math.ceil(text.length / 4)
  }

  static estimateCost(tokens: number, model: string = 'gemini-2.5-flash'): number {
    // You'll want to customize rates per Google's pricing
    const rates: Record<string, number> = {
      'gemini-2.5-flash': 0.0005, // placeholder per 1k tokens — replace with real pricing
      'gemini-2.5-pro': 0.002
    }
    const rate = rates[model] ?? rates['gemini-2.5-flash']
    return (tokens / 1000) * rate
  }
}
