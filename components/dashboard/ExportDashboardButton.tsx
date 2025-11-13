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
      const chartImages = await Promise.all(
        Array.from(chartElements).map(async (el) => {
          const chartId = el.getAttribute('data-chart-id')
          const chartTitle = el.getAttribute('data-chart-title')

          try {
            const imageData = await PDFService.captureChartImage(chartId!)
            return {
              title: chartTitle || 'Chart',
              imageData,
              description: `Visualization from ${dashboardName}`
            }
          } catch (error) {
            console.error('Error capturing chart:', error)
            return null
          }
        })
      )

      const validChartImages = chartImages.filter(Boolean) as Array<{
        title: string
        imageData: string
        description?: string
      }>

      if (validChartImages.length === 0) {
        toast.error('No charts available to export')
        return
      }

      await PDFService.exportDashboardToPDF(
        dashboardName,
        description,
        validChartImages
      )

      toast.success('Dashboard exported successfully!')
    } catch (error) {
      console.error('Error exporting dashboard:', error)
      toast.error('Failed to export dashboard')
    } finally {
      setIsExporting(false)
    }
  }

  return (
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
  )
}
