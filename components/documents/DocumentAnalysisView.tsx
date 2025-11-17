'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Brain,
  Heart,
  Tag,
  FileText,
  TrendingUp,
  Smile,
  Frown,
  Meh
} from 'lucide-react'

interface DocumentAnalysisViewProps {
  document: {
    id: string
    name: string
    description: string | null
    content: string
    themes: unknown
    sentiment: unknown
    keywords: unknown
    summary: string | null
  }
}

export default function DocumentAnalysisView({ document }: DocumentAnalysisViewProps) {
  const themes = document.themes as Array<{ name: string; description: string; relevance: number }> || []
  const sentiment = document.sentiment as {
    overall: string
    score: number
    breakdown: { positive: number; neutral: number; negative: number }
  } || { overall: 'neutral', score: 0, breakdown: { positive: 0, neutral: 1, negative: 0 } }
  const keywords = document.keywords as string[] || []

  const getSentimentIcon = () => {
    switch (sentiment.overall) {
      case 'positive':
        return <Smile className="w-5 h-5 text-green-500" />
      case 'negative':
        return <Frown className="w-5 h-5 text-red-500" />
      default:
        return <Meh className="w-5 h-5 text-yellow-500" />
    }
  }

  const getSentimentColor = () => {
    switch (sentiment.overall) {
      case 'positive':
        return 'text-green-600 dark:text-green-400'
      case 'negative':
        return 'text-red-600 dark:text-red-400'
      default:
        return 'text-yellow-600 dark:text-yellow-400'
    }
  }

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      {document.summary && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              <CardTitle>Summary</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground leading-relaxed">
              {document.summary}
            </p>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sentiment Analysis Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Heart className="w-5 h-5 text-primary" />
              <CardTitle>Sentiment Analysis</CardTitle>
            </div>
            <CardDescription>
              Overall emotional tone of the document
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Overall Sentiment */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {getSentimentIcon()}
                <div>
                  <p className="text-sm text-muted-foreground">Overall</p>
                  <p className={`text-lg font-semibold capitalize ${getSentimentColor()}`}>
                    {sentiment.overall}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Score</p>
                <p className="text-2xl font-bold">
                  {((sentiment.score + 1) / 2 * 100).toFixed(0)}%
                </p>
              </div>
            </div>

            {/* Sentiment Breakdown */}
            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Positive</span>
                  <span className="text-sm text-muted-foreground">
                    {(sentiment.breakdown.positive * 100).toFixed(0)}%
                  </span>
                </div>
                <Progress value={sentiment.breakdown.positive * 100} className="h-2 bg-green-100 dark:bg-green-900/20">
                  <div className="h-full bg-green-500 rounded-full transition-all" />
                </Progress>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Neutral</span>
                  <span className="text-sm text-muted-foreground">
                    {(sentiment.breakdown.neutral * 100).toFixed(0)}%
                  </span>
                </div>
                <Progress value={sentiment.breakdown.neutral * 100} className="h-2 bg-yellow-100 dark:bg-yellow-900/20">
                  <div className="h-full bg-yellow-500 rounded-full transition-all" />
                </Progress>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Negative</span>
                  <span className="text-sm text-muted-foreground">
                    {(sentiment.breakdown.negative * 100).toFixed(0)}%
                  </span>
                </div>
                <Progress value={sentiment.breakdown.negative * 100} className="h-2 bg-red-100 dark:bg-red-900/20">
                  <div className="h-full bg-red-500 rounded-full transition-all" />
                </Progress>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Keywords Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Tag className="w-5 h-5 text-primary" />
              <CardTitle>Keywords</CardTitle>
            </div>
            <CardDescription>
              Most important terms in the document
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {keywords.length > 0 ? (
                keywords.map((keyword, index) => (
                  <Badge key={index} variant="secondary" className="text-sm">
                    {keyword}
                  </Badge>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No keywords extracted</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Themes Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-primary" />
            <CardTitle>Extracted Themes</CardTitle>
          </div>
          <CardDescription>
            Main topics and concepts identified in the document
          </CardDescription>
        </CardHeader>
        <CardContent>
          {themes.length > 0 ? (
            <div className="space-y-4">
              {themes.map((theme, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-muted-foreground" />
                        <h4 className="font-semibold">{theme.name}</h4>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {theme.description}
                      </p>
                    </div>
                    <Badge variant="outline" className="ml-4">
                      {(theme.relevance * 100).toFixed(0)}%
                    </Badge>
                  </div>
                  <Progress value={theme.relevance * 100} className="h-1" />
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No themes extracted</p>
          )}
        </CardContent>
      </Card>

      {/* Document Content */}
      <Card>
        <CardHeader>
          <CardTitle>Document Content</CardTitle>
          <CardDescription>
            Full text of the uploaded document
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="formatted">
            <TabsList>
              <TabsTrigger value="formatted">Formatted</TabsTrigger>
              <TabsTrigger value="raw">Raw Text</TabsTrigger>
            </TabsList>
            <TabsContent value="formatted" className="mt-4">
              <div className="prose prose-sm dark:prose-invert max-w-none">
                {document.content.split('\n').map((paragraph, index) => (
                  paragraph.trim() && <p key={index} className="mb-4">{paragraph}</p>
                ))}
              </div>
            </TabsContent>
            <TabsContent value="raw" className="mt-4">
              <pre className="whitespace-pre-wrap font-mono text-sm bg-muted p-4 rounded-lg overflow-x-auto">
                {document.content}
              </pre>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
