import Papa from 'papaparse'

export class ExportService {
  /**
   * Export dataset to CSV format
   */
  static exportToCSV(
    data: Record<string, unknown>[],
    filename: string = 'export.csv'
  ): void {
    if (!data || data.length === 0) {
      throw new Error('No data to export')
    }

    const csv = Papa.unparse(data, {
      header: true,
      skipEmptyLines: true
    })

    this.downloadFile(csv, filename, 'text/csv')
  }

  /**
   * Export visualization data to CSV
   */
  static exportVisualizationToCSV(
    data: Record<string, unknown>[],
    config: {
      xAxis?: string
      yAxis?: string[]
      title?: string
    }
  ): void {
    const filename = `${config.title || 'visualization'}-${Date.now()}.csv`

    // Filter data to only include relevant columns
    const relevantColumns = new Set<string>()
    if (config.xAxis) relevantColumns.add(config.xAxis)
    if (config.yAxis) {
      config.yAxis.forEach(col => relevantColumns.add(col))
    }

    const filteredData = data.map(row => {
      const filtered: Record<string, unknown> = {}
      relevantColumns.forEach(col => {
        if (col in row) {
          filtered[col] = row[col]
        }
      })
      return filtered
    })

    this.exportToCSV(filteredData, filename)
  }

  /**
   * Export dashboard data (all visualizations) to CSV
   */
  static exportDashboardToCSV(
    dashboardName: string,
    visualizations: Array<{
      name: string
      data: Record<string, unknown>[]
    }>
  ): void {
    // Create a combined CSV with all visualizations
    const combined: Record<string, unknown>[] = []

    visualizations.forEach(viz => {
      viz.data.forEach(row => {
        combined.push({
          'Visualization': viz.name,
          ...row
        })
      })
    })

    const filename = `${dashboardName}-${Date.now()}.csv`
    this.exportToCSV(combined, filename)
  }

  /**
   * Download file helper
   */
  private static downloadFile(
    content: string | Blob,
    filename: string,
    mimeType: string
  ): void {
    const blob = content instanceof Blob
      ? content
      : new Blob([content], { type: mimeType })

    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  /**
   * Export multiple datasets as separate CSV files in a zip
   * Note: This requires JSZip library which we'll add if needed
   */
  static exportMultipleToCSV(
    datasets: Array<{
      name: string
      data: Record<string, unknown>[]
    }>
  ): void {
    // For now, export each dataset separately
    datasets.forEach(dataset => {
      const filename = `${dataset.name}-${Date.now()}.csv`
      this.exportToCSV(dataset.data, filename)
    })
  }
}
