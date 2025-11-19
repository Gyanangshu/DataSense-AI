'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowLeft, ArrowRight, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Stepper } from '@/components/ui/stepper'
import { Card } from '@/components/ui/card'
import { toast } from 'sonner'
import Step1DataSources from './wizard/Step1DataSources'
import Step2Configuration from './wizard/Step2Configuration'
import Step3Insights from './wizard/Step3Insights'
import Step4Review from './wizard/Step4Review'

interface WizardCorrelationCreatorProps {
  userId: string
  datasets: any[]
  documents: any[]
  templateId?: string
}

const STEPS = [
  { title: 'Data Sources', description: 'Select your data' },
  { title: 'Configuration', description: 'Configure analysis' },
  { title: 'Customize Insights', description: 'AI preferences' },
  { title: 'Review & Launch', description: 'Final review' }
]

export default function WizardCorrelationCreator({
  userId,
  datasets,
  documents,
  templateId
}: WizardCorrelationCreatorProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [currentStep, setCurrentStep] = useState(1)
  const [isCreating, setIsCreating] = useState(false)
  const [template, setTemplate] = useState<any>(null)

  // Wizard state
  const [wizardData, setWizardData] = useState({
    // Step 1
    selectedDataset: '',
    selectedDocument: '',

    // Step 2
    analysisDepth: 'standard',
    primaryColumn: null as string | null,
    secondaryColumns: [] as string[],

    // Step 3
    insightTypes: ['opportunities', 'risks', 'patterns'],
    narrativeTone: 'business',
    customQuestions: '',

    // Step 4
    name: '',
    description: ''
  })

  useEffect(() => {
    if (templateId) {
      fetchTemplate()
    }

    // Pre-select dataset from URL
    const datasetId = searchParams.get('datasetId')
    if (datasetId && datasets.some(d => d.id === datasetId)) {
      setWizardData(prev => ({ ...prev, selectedDataset: datasetId }))
    }
  }, [templateId, searchParams])

  const fetchTemplate = async () => {
    try {
      const response = await fetch(`/api/templates/${templateId}`)
      if (response.ok) {
        const data = await response.json()
        setTemplate(data)
      }
    } catch (error) {
      console.error('Failed to fetch template:', error)
    }
  }

  const updateWizardData = (updates: Partial<typeof wizardData>) => {
    setWizardData(prev => ({ ...prev, ...updates }))
  }

  const handleNext = () => {
    // Validation for each step
    if (currentStep === 1) {
      if (!wizardData.selectedDataset) {
        toast.error('Please select a dataset')
        return
      }
    }

    if (currentStep === 4) {
      if (!wizardData.name.trim()) {
        toast.error('Please enter an analysis name')
        return
      }
    }

    if (currentStep < 4) {
      setCurrentStep(prev => prev + 1)
    } else {
      handleSubmit()
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1)
    }
  }

  const handleSubmit = async () => {
    setIsCreating(true)

    try {
      const response = await fetch('/api/correlations/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: wizardData.name,
          description: wizardData.description,
          datasetId: wizardData.selectedDataset,
          documentId: wizardData.selectedDocument || null,
          config: {
            template: template?.name || null,
            analysisDepth: wizardData.analysisDepth,
            primaryColumn: wizardData.primaryColumn,
            secondaryColumns: wizardData.secondaryColumns,
            insightTypes: wizardData.insightTypes,
            narrativeTone: wizardData.narrativeTone,
            customQuestions: wizardData.customQuestions
          }
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create analysis')
      }

      const data = await response.json()
      toast.success('Analysis created successfully!')
      router.push(`/correlations/${data.id}`)
    } catch (error) {
      console.error('Analysis creation error:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to create analysis')
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <div className="space-y-8">
      {/* Stepper */}
      <Stepper steps={STEPS} currentStep={currentStep} />

      {/* Template Info */}
      {template && (
        <Card className="p-4 bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
          <div className="flex items-center gap-3">
            <div className="text-sm">
              <span className="font-medium text-blue-900 dark:text-blue-100">
                Using Template:
              </span>
              <span className="ml-2 text-blue-700 dark:text-blue-300">
                {template.name}
              </span>
            </div>
          </div>
        </Card>
      )}

      {/* Step Content */}
      <Card className="p-6">
        {currentStep === 1 && (
          <Step1DataSources
            datasets={datasets}
            documents={documents}
            wizardData={wizardData}
            onUpdate={updateWizardData}
            template={template}
          />
        )}

        {currentStep === 2 && (
          <Step2Configuration
            selectedDataset={datasets.find(d => d.id === wizardData.selectedDataset)}
            wizardData={wizardData}
            onUpdate={updateWizardData}
            template={template}
          />
        )}

        {currentStep === 3 && (
          <Step3Insights
            wizardData={wizardData}
            onUpdate={updateWizardData}
            template={template}
          />
        )}

        {currentStep === 4 && (
          <Step4Review
            wizardData={wizardData}
            onUpdate={updateWizardData}
            datasets={datasets}
            documents={documents}
            template={template}
          />
        )}
      </Card>

      {/* Navigation Buttons */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={handleBack}
          disabled={currentStep === 1 || isCreating}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <Button
          onClick={handleNext}
          disabled={isCreating}
        >
          {isCreating ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Creating...
            </>
          ) : currentStep === 4 ? (
            'Create Analysis'
          ) : (
            <>
              Next
              <ArrowRight className="w-4 h-4 ml-2" />
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
