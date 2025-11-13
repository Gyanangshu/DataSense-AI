import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import html2canvas from 'html2canvas'

interface ReportMetadata {
  title: string
  subtitle?: string
  author?: string
  date?: Date
}

interface TableData {
  title?: string
  headers: string[]
  rows: (string | number)[][]
}

interface ChartImage {
  title?: string
  imageData: string
  description?: string
}

export class PDFService {
  /**
   * Generate PDF report with multiple sections
   */
  static async generateReport(
    metadata: ReportMetadata,
    sections: {
      tables?: TableData[]
      charts?: ChartImage[]
      insights?: Array<{ title: string; content: string }>
    }
  ): Promise<void> {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    })

    let yPosition = 20

    // Header
    doc.setFontSize(24)
    doc.setTextColor(37, 99, 235) // Primary color
    doc.text(metadata.title, 20, yPosition)
    yPosition += 10

    if (metadata.subtitle) {
      doc.setFontSize(12)
      doc.setTextColor(100, 100, 100)
      doc.text(metadata.subtitle, 20, yPosition)
      yPosition += 8
    }

    // Metadata line
    doc.setFontSize(9)
    doc.setTextColor(150, 150, 150)
    const dateStr = (metadata.date || new Date()).toLocaleDateString()
    const authorStr = metadata.author ? `by ${metadata.author}` : ''
    doc.text(`Generated on ${dateStr} ${authorStr}`, 20, yPosition)
    yPosition += 15

    // Add separator line
    doc.setDrawColor(200, 200, 200)
    doc.line(20, yPosition, 190, yPosition)
    yPosition += 10

    // Add Tables
    if (sections.tables && sections.tables.length > 0) {
      for (const table of sections.tables) {
        if (yPosition > 250) {
          doc.addPage()
          yPosition = 20
        }

        if (table.title) {
          doc.setFontSize(14)
          doc.setTextColor(0, 0, 0)
          doc.text(table.title, 20, yPosition)
          yPosition += 8
        }

        autoTable(doc, {
          head: [table.headers],
          body: table.rows,
          startY: yPosition,
          margin: { left: 20, right: 20 },
          styles: { fontSize: 9 },
          headStyles: { fillColor: [37, 99, 235] },
          theme: 'striped'
        })

        yPosition = (doc as any).lastAutoTable.finalY + 10
      }
    }

    // Add Charts
    if (sections.charts && sections.charts.length > 0) {
      for (const chart of sections.charts) {
        if (yPosition > 200) {
          doc.addPage()
          yPosition = 20
        }

        if (chart.title) {
          doc.setFontSize(14)
          doc.setTextColor(0, 0, 0)
          doc.text(chart.title, 20, yPosition)
          yPosition += 8
        }

        // Add chart image
        try {
          doc.addImage(chart.imageData, 'PNG', 20, yPosition, 170, 100)
          yPosition += 105

          if (chart.description) {
            doc.setFontSize(9)
            doc.setTextColor(100, 100, 100)
            const lines = doc.splitTextToSize(chart.description, 170)
            doc.text(lines, 20, yPosition)
            yPosition += lines.length * 4 + 10
          }
        } catch (error) {
          console.error('Error adding chart image:', error)
        }
      }
    }

    // Add Insights
    if (sections.insights && sections.insights.length > 0) {
      if (yPosition > 200) {
        doc.addPage()
        yPosition = 20
      }

      doc.setFontSize(16)
      doc.setTextColor(37, 99, 235)
      doc.text('Key Insights', 20, yPosition)
      yPosition += 10

      for (const insight of sections.insights) {
        if (yPosition > 250) {
          doc.addPage()
          yPosition = 20
        }

        doc.setFontSize(12)
        doc.setTextColor(0, 0, 0)
        doc.text(`• ${insight.title}`, 25, yPosition)
        yPosition += 6

        doc.setFontSize(10)
        doc.setTextColor(60, 60, 60)
        const lines = doc.splitTextToSize(insight.content, 160)
        doc.text(lines, 30, yPosition)
        yPosition += lines.length * 5 + 8
      }
    }

    // Footer on each page
    const pageCount = doc.getNumberOfPages()
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i)
      doc.setFontSize(8)
      doc.setTextColor(150, 150, 150)
      doc.text(
        `Page ${i} of ${pageCount} | DataSense AI`,
        doc.internal.pageSize.getWidth() / 2,
        doc.internal.pageSize.getHeight() - 10,
        { align: 'center' }
      )
    }

    // Download
    const filename = `${metadata.title.replace(/\s+/g, '-')}-${Date.now()}.pdf`
    doc.save(filename)
  }

  /**
   * Capture chart element as image
   */
  static async captureChartImage(elementId: string): Promise<string> {
    const element = document.getElementById(elementId)
    if (!element) {
      throw new Error(`Element with id "${elementId}" not found`)
    }

    const canvas = await html2canvas(element, {
      backgroundColor: '#ffffff',
      scale: 2,
      logging: false
    })

    return canvas.toDataURL('image/png')
  }

  /**
   * Export dataset as PDF table
   */
  static exportDatasetToPDF(
    datasetName: string,
    columns: string[],
    data: Record<string, unknown>[]
  ): void {
    const doc = new jsPDF({
      orientation: data.length > 50 ? 'landscape' : 'portrait',
      unit: 'mm',
      format: 'a4'
    })

    // Title
    doc.setFontSize(18)
    doc.setTextColor(37, 99, 235)
    doc.text(datasetName, 20, 20)

    // Metadata
    doc.setFontSize(10)
    doc.setTextColor(100, 100, 100)
    doc.text(`${data.length} rows • ${columns.length} columns`, 20, 28)
    doc.text(`Generated on ${new Date().toLocaleDateString()}`, 20, 34)

    // Table
    const rows = data.map(row =>
      columns.map(col => {
        const value = row[col]
        if (value === null || value === undefined) return '-'
        if (typeof value === 'number') return value.toLocaleString()
        return String(value).substring(0, 50) // Truncate long strings
      })
    )

    autoTable(doc, {
      head: [columns],
      body: rows,
      startY: 40,
      margin: { left: 10, right: 10 },
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [37, 99, 235], fontStyle: 'bold' },
      theme: 'striped',
      showHead: 'everyPage'
    })

    // Footer
    const pageCount = doc.getNumberOfPages()
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i)
      doc.setFontSize(8)
      doc.setTextColor(150, 150, 150)
      doc.text(
        `Page ${i} of ${pageCount}`,
        doc.internal.pageSize.getWidth() / 2,
        doc.internal.pageSize.getHeight() - 10,
        { align: 'center' }
      )
    }

    const filename = `${datasetName.replace(/\s+/g, '-')}-${Date.now()}.pdf`
    doc.save(filename)
  }

  /**
   * Export dashboard as PDF with all visualizations
   */
  static async exportDashboardToPDF(
    dashboardName: string,
    description: string | null,
    chartImages: ChartImage[]
  ): Promise<void> {
    await this.generateReport(
      {
        title: dashboardName,
        subtitle: description || undefined,
        author: 'DataSense AI User',
        date: new Date()
      },
      {
        charts: chartImages,
        insights: [
          {
            title: 'Dashboard Summary',
            content: `This dashboard contains ${chartImages.length} visualization${chartImages.length !== 1 ? 's' : ''} providing comprehensive data insights.`
          }
        ]
      }
    )
  }
}
