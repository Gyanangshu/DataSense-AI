'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Briefcase,
  Users,
  ShoppingCart,
  MousePointer,
  BookOpen,
  Heart,
  GitBranch,
  TrendingUp
} from 'lucide-react'

interface TemplateCardProps {
  template: {
    id: string
    name: string
    description: string | null
    category: string
    subcategory: string
    usageCount: number
  }
  onSelect: (templateId: string) => void
}

const CATEGORY_ICONS: Record<string, any> = {
  customer_feedback: Briefcase,
  employee_survey: Users,
  market_research: ShoppingCart,
  ux_research: MousePointer,
  grounded_theory: BookOpen,
  thematic_sentiment: Heart,
  mixed_methods: GitBranch
}

const CATEGORY_COLORS: Record<string, string> = {
  customer_feedback: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  employee_survey: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  market_research: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  ux_research: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  grounded_theory: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200',
  thematic_sentiment: 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200',
  mixed_methods: 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200'
}

export default function TemplateCard({ template, onSelect }: TemplateCardProps) {
  const Icon = CATEGORY_ICONS[template.subcategory] || TrendingUp
  const colorClass = CATEGORY_COLORS[template.subcategory] || 'bg-gray-100 text-gray-800'

  return (
    <Card className="hover:shadow-lg transition-shadow cursor-pointer group" onClick={() => onSelect(template.id)}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className={`p-3 rounded-lg ${colorClass}`}>
            <Icon className="w-6 h-6" />
          </div>
          {template.usageCount > 0 && (
            <Badge variant="secondary" className="text-xs">
              {template.usageCount} uses
            </Badge>
          )}
        </div>
        <CardTitle className="mt-4 group-hover:text-primary transition-colors">
          {template.name}
        </CardTitle>
        <CardDescription className="line-clamp-2">
          {template.description}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button
          className="w-full"
          onClick={(e) => {
            e.stopPropagation()
            onSelect(template.id)
          }}
        >
          Use Template
        </Button>
      </CardContent>
    </Card>
  )
}
