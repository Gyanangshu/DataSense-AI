/**
 * Chart Service
 * Provides intelligent chart configuration and recommendations
 */

export type ChartType = 'line' | 'bar' | 'pie' | 'scatter' | 'area' | 'histogram'
export type AggregationType = 'none' | 'sum' | 'avg' | 'count' | 'min' | 'max'
export type ColorTheme = 'primary' | 'categorical' | 'sequential' | 'diverging'

export interface ColumnMetadata {
  name: string
  type: 'integer' | 'float' | 'string' | 'date' | 'boolean'
  uniqueCount?: number
  min?: number
  max?: number
  mean?: number
  median?: number
  nullCount?: number
}

export interface ChartConfig {
  type: ChartType
  title: string
  description?: string
  xAxis: string
  yAxis: string[]
  aggregation: AggregationType
  colorTheme: ColorTheme
  showGrid: boolean
  showLegend: boolean
  showLabels: boolean
  animated: boolean
  stacked?: boolean
  curved?: boolean
  donut?: boolean
  confidence: number // 0-1 score for recommendation quality
  reasoning: string // Why this chart was recommended
}

export interface ChartRecommendation {
  config: ChartConfig
  priority: number // 1-5, 5 being highest priority
  reasoning: string
}

export class ChartService {
  /**
   * Analyze dataset columns and generate smart chart recommendations
   */
  static analyzeColumns(
    columns: string[],
    types: Record<string, string>,
    stats?: Record<string, Record<string, number | string | undefined>>
  ): ColumnMetadata[] {
    return columns.map(col => {
      const colStats = stats?.[col] || {}
      return {
        name: col,
        type: types[col] as ColumnMetadata['type'],
        uniqueCount: typeof colStats.uniqueCount === 'number' ? colStats.uniqueCount : undefined,
        min: typeof colStats.min === 'number' ? colStats.min : undefined,
        max: typeof colStats.max === 'number' ? colStats.max : undefined,
        mean: typeof colStats.mean === 'number' ? colStats.mean : undefined,
        median: typeof colStats.median === 'number' ? colStats.median : undefined,
        nullCount: typeof colStats.nullCount === 'number' ? colStats.nullCount : undefined
      }
    })
  }

  /**
   * Recommend optimal chart types based on column characteristics
   */
  static recommendCharts(
    columns: ColumnMetadata[],
    datasetName: string,
    rowCount: number
  ): ChartRecommendation[] {
    const recommendations: ChartRecommendation[] = []

    const numericCols = columns.filter(c => c.type === 'integer' || c.type === 'float')
    const categoricalCols = columns.filter(c => c.type === 'string' || c.type === 'boolean')
    const dateCols = columns.filter(c => c.type === 'date')

    // Rule 1: Time series data (date + numeric) -> Line chart
    if (dateCols.length > 0 && numericCols.length > 0) {
      const dateCol = dateCols[0]
      const valueCol = numericCols[0]

      recommendations.push({
        config: {
          type: 'line',
          title: `${valueCol.name} Over Time`,
          description: `Trend of ${valueCol.name} across ${dateCol.name}`,
          xAxis: dateCol.name,
          yAxis: [valueCol.name],
          aggregation: 'none',
          colorTheme: 'primary',
          showGrid: true,
          showLegend: numericCols.length > 1,
          showLabels: false,
          animated: true,
          curved: true,
          confidence: 0.95,
          reasoning: `Time series data detected with ${dateCol.name} and ${valueCol.name}. Line charts excel at showing trends over time.`
        },
        priority: 5,
        reasoning: 'Time series data is best visualized with line charts to show trends and patterns'
      })

      // If multiple numeric columns, suggest multi-line chart
      if (numericCols.length > 1) {
        recommendations.push({
          config: {
            type: 'line',
            title: `Multi-Metric Trends Over Time`,
            description: `Compare ${numericCols.slice(0, 3).map(c => c.name).join(', ')} over time`,
            xAxis: dateCol.name,
            yAxis: numericCols.slice(0, 3).map(c => c.name),
            aggregation: 'none',
            colorTheme: 'categorical',
            showGrid: true,
            showLegend: true,
            showLabels: false,
            animated: true,
            curved: true,
            confidence: 0.9,
            reasoning: `Multiple metrics (${numericCols.length}) can be compared over time to identify correlations`
          },
          priority: 4,
          reasoning: 'Compare multiple metrics simultaneously to find patterns'
        })
      }
    }

    // Rule 2: Categorical + Numeric -> Bar chart for comparison
    if (categoricalCols.length > 0 && numericCols.length > 0) {
      const catCol = categoricalCols.find(c => c.uniqueCount && c.uniqueCount <= 15) || categoricalCols[0]
      const valueCol = numericCols[0]

      // Only recommend if categorical column has reasonable unique count
      if (catCol.uniqueCount && catCol.uniqueCount <= 30) {
        const aggregationType: AggregationType = catCol.uniqueCount < rowCount ? 'sum' : 'none'

        recommendations.push({
          config: {
            type: 'bar',
            title: `${valueCol.name} by ${catCol.name}`,
            description: `Compare ${valueCol.name} across different ${catCol.name} categories`,
            xAxis: catCol.name,
            yAxis: [valueCol.name],
            aggregation: aggregationType,
            colorTheme: 'categorical',
            showGrid: true,
            showLegend: false,
            showLabels: catCol.uniqueCount <= 10,
            animated: true,
            stacked: false,
            confidence: 0.9,
            reasoning: `Categorical data (${catCol.uniqueCount} categories) with numeric values. Bar charts are ideal for category comparison.`
          },
          priority: 5,
          reasoning: 'Bar charts excel at comparing values across categories'
        })

        // Stacked bar chart if multiple metrics
        if (numericCols.length > 1) {
          recommendations.push({
            config: {
              type: 'bar',
              title: `Stacked Comparison by ${catCol.name}`,
              description: `See composition of ${numericCols.slice(0, 3).map(c => c.name).join(', ')}`,
              xAxis: catCol.name,
              yAxis: numericCols.slice(0, 3).map(c => c.name),
              aggregation: aggregationType,
              colorTheme: 'categorical',
              showGrid: true,
              showLegend: true,
              showLabels: false,
              animated: true,
              stacked: true,
              confidence: 0.85,
              reasoning: `Multiple metrics can be stacked to show both total and composition`
            },
            priority: 3,
            reasoning: 'Stacked bars show part-to-whole relationships'
          })
        }
      }
    }

    // Rule 3: Single categorical with counts -> Pie chart
    if (categoricalCols.length > 0) {
      const catCol = categoricalCols.find(c => c.uniqueCount && c.uniqueCount >= 2 && c.uniqueCount <= 8)

      if (catCol) {
        recommendations.push({
          config: {
            type: 'pie',
            title: `Distribution of ${catCol.name}`,
            description: `Breakdown by ${catCol.name} category`,
            xAxis: catCol.name,
            yAxis: numericCols.length > 0 ? [numericCols[0].name] : [],
            aggregation: numericCols.length > 0 ? 'sum' : 'count',
            colorTheme: 'categorical',
            showGrid: false,
            showLegend: true,
            showLabels: true,
            animated: true,
            donut: false,
            confidence: 0.8,
            reasoning: `${catCol.name} has ${catCol.uniqueCount} categories - perfect for showing proportions in a pie chart`
          },
          priority: 3,
          reasoning: 'Pie charts effectively show part-to-whole relationships for 2-8 categories'
        })

        // Donut variant
        recommendations.push({
          config: {
            type: 'pie',
            title: `${catCol.name} Breakdown (Donut)`,
            description: `Proportional view of ${catCol.name}`,
            xAxis: catCol.name,
            yAxis: numericCols.length > 0 ? [numericCols[0].name] : [],
            aggregation: numericCols.length > 0 ? 'sum' : 'count',
            colorTheme: 'categorical',
            showGrid: false,
            showLegend: true,
            showLabels: true,
            animated: true,
            donut: true,
            confidence: 0.75,
            reasoning: `Donut charts provide a modern take on pie charts with space for central summary`
          },
          priority: 2,
          reasoning: 'Donut variant provides cleaner visualization'
        })
      }
    }

    // Rule 4: Two numeric columns -> Scatter plot for correlation
    if (numericCols.length >= 2) {
      const xCol = numericCols[0]
      const yCol = numericCols[1]

      recommendations.push({
        config: {
          type: 'scatter',
          title: `${yCol.name} vs ${xCol.name}`,
          description: `Correlation analysis between ${xCol.name} and ${yCol.name}`,
          xAxis: xCol.name,
          yAxis: [yCol.name],
          aggregation: 'none',
          colorTheme: 'primary',
          showGrid: true,
          showLegend: false,
          showLabels: false,
          animated: true,
          confidence: 0.85,
          reasoning: `Two numeric variables detected. Scatter plots reveal correlations and outliers between ${xCol.name} and ${yCol.name}.`
        },
        priority: 4,
        reasoning: 'Scatter plots are essential for identifying correlations between variables'
      })
    }

    // Rule 5: Single numeric column -> Histogram/Bar for distribution
    if (numericCols.length >= 1 && categoricalCols.length === 0 && dateCols.length === 0) {
      const numCol = numericCols[0]

      recommendations.push({
        config: {
          type: 'bar',
          title: `Distribution of ${numCol.name}`,
          description: `Frequency distribution of ${numCol.name} values`,
          xAxis: numCol.name,
          yAxis: ['count'],
          aggregation: 'count',
          colorTheme: 'sequential',
          showGrid: true,
          showLegend: false,
          showLabels: false,
          animated: true,
          confidence: 0.7,
          reasoning: `Single numeric column - histogram shows value distribution and identifies patterns`
        },
        priority: 2,
        reasoning: 'Understand data distribution and identify outliers'
      })
    }

    // Sort by priority and confidence
    return recommendations.sort((a, b) => {
      if (b.priority !== a.priority) return b.priority - a.priority
      return b.config.confidence - a.config.confidence
    })
  }

  /**
   * Generate chart configuration from data structure
   */
  static generateConfig(
    chartType: ChartType,
    columns: ColumnMetadata[],
    title?: string
  ): Partial<ChartConfig> {
    const numericCols = columns.filter(c => c.type === 'integer' || c.type === 'float')
    const categoricalCols = columns.filter(c => c.type === 'string' || c.type === 'boolean')
    const dateCols = columns.filter(c => c.type === 'date')

    const config: Partial<ChartConfig> = {
      type: chartType,
      title: title || `${chartType.charAt(0).toUpperCase() + chartType.slice(1)} Chart`,
      animated: true,
      showGrid: true,
      showLegend: true,
      showLabels: false
    }

    // Smart axis selection based on chart type
    switch (chartType) {
      case 'line':
        config.xAxis = dateCols[0]?.name || categoricalCols[0]?.name || columns[0]?.name
        config.yAxis = numericCols.slice(0, 3).map(c => c.name)
        config.curved = true
        config.aggregation = 'none'
        config.colorTheme = 'primary'
        break

      case 'bar':
        config.xAxis = categoricalCols[0]?.name || dateCols[0]?.name || columns[0]?.name
        config.yAxis = numericCols.slice(0, 1).map(c => c.name)
        config.stacked = false
        config.aggregation = 'sum'
        config.colorTheme = 'categorical'
        break

      case 'pie':
        config.xAxis = categoricalCols[0]?.name || columns[0]?.name
        config.yAxis = numericCols.length > 0 ? [numericCols[0].name] : []
        config.donut = false
        config.aggregation = numericCols.length > 0 ? 'sum' : 'count'
        config.colorTheme = 'categorical'
        config.showGrid = false
        break

      case 'scatter':
        config.xAxis = numericCols[0]?.name || columns[0]?.name
        config.yAxis = numericCols[1] ? [numericCols[1].name] : []
        config.aggregation = 'none'
        config.colorTheme = 'primary'
        break
    }

    return config
  }

  /**
   * Validate chart configuration
   */
  static validateConfig(
    config: Partial<ChartConfig>,
    columns: ColumnMetadata[]
  ): { valid: boolean; errors: string[] } {
    const errors: string[] = []
    const columnNames = columns.map(c => c.name)

    if (!config.type) {
      errors.push('Chart type is required')
    }

    if (!config.xAxis) {
      errors.push('X-axis column is required')
    } else if (!columnNames.includes(config.xAxis)) {
      errors.push(`X-axis column "${config.xAxis}" does not exist in dataset`)
    }

    if (config.type !== 'pie' && (!config.yAxis || config.yAxis.length === 0)) {
      errors.push('At least one Y-axis column is required')
    }

    if (config.yAxis) {
      config.yAxis.forEach(col => {
        if (!columnNames.includes(col)) {
          errors.push(`Y-axis column "${col}" does not exist in dataset`)
        }
      })
    }

    return {
      valid: errors.length === 0,
      errors
    }
  }

  /**
   * Calculate optimal bin count for histograms (Sturges' rule)
   */
  static calculateBinCount(dataSize: number): number {
    return Math.ceil(Math.log2(dataSize) + 1)
  }

  /**
   * Suggest aggregation type based on data characteristics
   */
  static suggestAggregation(
    xColumn: ColumnMetadata,
    yColumns: ColumnMetadata[],
    rowCount: number
  ): AggregationType {
    // If x-axis has fewer unique values than rows, aggregation is needed
    if (xColumn.uniqueCount && xColumn.uniqueCount < rowCount) {
      // For numeric y columns, sum is usually most meaningful
      const hasNumericY = yColumns.some(c => c.type === 'integer' || c.type === 'float')

      if (hasNumericY) {
        // If values are already aggregated-looking (e.g., totals), use none
        const yAvgValue = yColumns[0]?.mean
        if (yAvgValue && yAvgValue > 1000) {
          return 'sum'
        }
        return 'avg'
      }

      return 'count'
    }

    return 'none'
  }

  /**
   * Get chart type display name and description
   */
  static getChartTypeInfo(type: ChartType): { name: string; description: string; bestFor: string } {
    const info = {
      line: {
        name: 'Line Chart',
        description: 'Shows trends and changes over time',
        bestFor: 'Time series data, trends, continuous data'
      },
      bar: {
        name: 'Bar Chart',
        description: 'Compares values across categories',
        bestFor: 'Categorical comparisons, rankings, distributions'
      },
      pie: {
        name: 'Pie Chart',
        description: 'Shows proportions of a whole',
        bestFor: 'Part-to-whole relationships, percentages (2-8 categories)'
      },
      scatter: {
        name: 'Scatter Plot',
        description: 'Reveals correlations between variables',
        bestFor: 'Correlation analysis, outlier detection, clustering'
      },
      area: {
        name: 'Area Chart',
        description: 'Shows cumulative trends over time',
        bestFor: 'Stacked metrics, cumulative values'
      },
      histogram: {
        name: 'Histogram',
        description: 'Shows frequency distribution',
        bestFor: 'Data distribution, identifying patterns and outliers'
      }
    }

    return info[type] || { name: type, description: '', bestFor: '' }
  }
}

export default ChartService
