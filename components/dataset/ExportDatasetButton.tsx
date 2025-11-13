'use client'

import { useState } from 'react'
import { Download, Loader2, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { toast } from 'sonner'
import { PDFService } from '@/lib/services/pdf.service'

interface ExportDatasetButtonProps {
  datasetId: string
  datasetName?: string
  columns?: string[]
  data?: Record<string, unknown>[]
}

export default function ExportDatasetButton({ datasetId, datasetName, columns, data }: ExportDatasetButtonProps) {
  const [isExporting, setIsExporting] = useState(false)

  const handleExportPDF = async () => {
    if (!columns || !data) {
      toast.error('Dataset data not available for PDF export')
      return
    }

    setIsExporting(true)
    try {
      PDFService.exportDatasetToPDF(datasetName || 'Dataset', columns, data)
      toast.success('PDF exported successfully!')
    } catch (error) {
      console.error('Error exporting PDF:', error)
      toast.error('Failed to export PDF')
    } finally {
      setIsExporting(false)
    }
  }

  const handleExportCSV = async () => {
    setIsExporting(true)
    try {
      const response = await fetch(`/api/datasets/${datasetId}/export`, {
        method: 'GET'
      })

      if (!response.ok) {
        throw new Error('Failed to export dataset')
      }

      // Get the blob and trigger download
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${datasetName || 'dataset'}-${Date.now()}.csv`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      toast.success('Dataset exported successfully!')
    } catch (error) {
      console.error('Error exporting dataset:', error)
      toast.error('Failed to export dataset')
    } finally {
      setIsExporting(false)
    }
  }

  const handleExportJSON = async () => {
    setIsExporting(true)
    try {
      // For now, show coming soon message
      toast.info('JSON export coming soon!')
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" disabled={isExporting}>
          {isExporting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Exporting...
            </>
          ) : (
            <>
              <Download className="w-4 h-4 mr-2" />
              Export
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={handleExportCSV} disabled={isExporting}>
          <Download className="w-4 h-4 mr-2" />
          Export as CSV
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleExportPDF} disabled={isExporting || !columns || !data}>
          <FileText className="w-4 h-4 mr-2" />
          Export as PDF
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleExportJSON} disabled={isExporting}>
          <Download className="w-4 h-4 mr-2" />
          Export as JSON
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
