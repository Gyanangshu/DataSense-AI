'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Sparkles, Layers } from 'lucide-react'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import TemplateCard from './TemplateCard'
import { toast } from 'sonner'

export default function TemplateSelector() {
  const router = useRouter()
  const [templates, setTemplates] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchTemplates()
  }, [])

  const fetchTemplates = async () => {
    try {
      const response = await fetch('/api/templates')
      if (!response.ok) throw new Error('Failed to fetch templates')

      const data = await response.json()
      setTemplates(data.templates)
    } catch (error) {
      toast.error('Failed to load templates')
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSelectTemplate = (templateId: string) => {
    // Navigate to wizard with template ID
    router.push(`/correlations/create/wizard?templateId=${templateId}`)
  }

  const handleStartFromScratch = () => {
    router.push('/correlations/create')
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Start from Scratch Option */}
      <Card className="border-2 border-dashed border-primary/50 hover:border-primary transition-colors">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-primary/10 rounded-lg">
              <Sparkles className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1">
              <CardTitle>Start from Scratch</CardTitle>
              <CardDescription>
                Create a custom analysis without using a template
              </CardDescription>
            </div>
            <Button onClick={handleStartFromScratch}>
              Create Custom
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Template Categories */}
      <Accordion type="multiple" defaultValue={['industry', 'methodology']} className="space-y-4">
        {/* Industry Templates */}
        <AccordionItem value="industry" className="border rounded-lg px-4">
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center gap-3">
              <Layers className="w-5 h-5 text-blue-600" />
              <div className="text-left">
                <div className="font-semibold">Industry Templates</div>
                <div className="text-sm text-muted-foreground">
                  Pre-configured for common business scenarios ({templates?.industry?.length || 0} templates)
                </div>
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-4">
              {templates?.industry?.map((template: any) => (
                <TemplateCard
                  key={template.id}
                  template={template}
                  onSelect={handleSelectTemplate}
                />
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Methodology Templates */}
        <AccordionItem value="methodology" className="border rounded-lg px-4">
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center gap-3">
              <Layers className="w-5 h-5 text-purple-600" />
              <div className="text-left">
                <div className="font-semibold">Methodology Templates</div>
                <div className="text-sm text-muted-foreground">
                  Based on academic research methodologies ({templates?.methodology?.length || 0} templates)
                </div>
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-4">
              {templates?.methodology?.map((template: any) => (
                <TemplateCard
                  key={template.id}
                  template={template}
                  onSelect={handleSelectTemplate}
                />
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  )
}
