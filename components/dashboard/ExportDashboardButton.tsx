'use client'

import { useState } from 'react'
import { FileText, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PDFService } from '@/lib/services/pdf.service'
import { toast } from 'sonner'

interface ExportDashboardButtonProps {
  dashboardId: string
  dashboardName: string
  description: string | null
}

// Blur overlay component - moved outside to avoid creating during render
function ExportingOverlay() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-4 p-8 rounded-lg bg-card border border-border shadow-lg">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
        <div className="text-center">
          <h3 className="text-lg font-semibold mb-2">Exporting Dashboard</h3>
          <p className="text-sm text-muted-foreground">
            Please wait while we generate your PDF...
          </p>
        </div>
      </div>
    </div>
  )
}

export default function ExportDashboardButton({
  dashboardId,
  dashboardName,
  description
}: ExportDashboardButtonProps) {
  const [isExporting, setIsExporting] = useState(false)

  const handleExport = async () => {
    setIsExporting(true)
    try {
      // Find all chart elements in the dashboard
      const chartElements = document.querySelectorAll('[data-chart-id]')
      const chartImages: Array<{
        title: string
        imageData: string
        description?: string
      }> = []

      // Capture charts SEQUENTIALLY to prevent stylesheet conflicts
      // When Promise.all runs in parallel, one chart's stylesheet restoration
      // interferes with another chart's capture, causing failures
      for (const el of Array.from(chartElements)) {
        const chartId = el.getAttribute('data-chart-id')
        const chartTitle = el.getAttribute('data-chart-title')

        try {
          console.log(`📊 Capturing chart: ${chartTitle}`)
          const imageData = await PDFService.captureChartImage(chartId!)
          chartImages.push({
            title: chartTitle || 'Chart',
            imageData,
            description: `Visualization from ${dashboardName}`
          })
          console.log(`✅ Successfully captured: ${chartTitle}`)
        } catch (error) {
          console.error(`❌ Error capturing chart ${chartTitle}:`, error)
          // Continue with other charts even if one fails
        }
      }

      if (chartImages.length === 0) {
        toast.error('No charts available to export')
        setIsExporting(false)
        return
      }

      console.log(`📄 Generating PDF with ${chartImages.length} charts`)
      await PDFService.exportDashboardToPDF(
        dashboardName,
        description,
        chartImages
      )

      toast.success('Dashboard exported successfully!')

      // Force page refresh to restore CSS
      window.location.reload()
    } catch (error) {
      console.error('Error exporting dashboard:', error)
      toast.error('Failed to export dashboard')
      setIsExporting(false)
    }
  }

  return (
    <>
      {/* Show blur overlay when exporting */}
      {isExporting && <ExportingOverlay />}

      <Button
        variant="outline"
        size="sm"
        onClick={handleExport}
        disabled={isExporting}
      >
        {isExporting ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Exporting...
          </>
        ) : (
          <>
            <FileText className="w-4 h-4 mr-2" />
            Export PDF
          </>
        )}
      </Button>
    </>
  )
}
