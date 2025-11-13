'use client'

import { useState } from 'react'
import { FileText, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PDFService } from '@/lib/services/pdf.service'
import { toast } from 'sonner'

interface ExportPDFButtonProps {
  datasetName: string
  columns: string[]
  data: Record<string, unknown>[]
  variant?: 'default' | 'outline' | 'ghost'
}

export default function ExportPDFButton({
  datasetName,
  columns,
  data,
  variant = 'outline'
}: ExportPDFButtonProps) {
  const [isExporting, setIsExporting] = useState(false)

  const handleExport = async () => {
    setIsExporting(true)
    try {
      PDFService.exportDatasetToPDF(datasetName, columns, data)
      toast.success('PDF exported successfully!')
    } catch (error) {
      console.error('Error exporting PDF:', error)
      toast.error('Failed to export PDF')
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <Button
      variant={variant}
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
