/**
 * Analytics Service
 * Provides statistical analysis and data aggregation functions
 */

import { mean, median, standardDeviation, sum, min, max, variance, quantile } from 'simple-statistics'

export interface StatisticalSummary {
  count: number
  sum?: number
  mean?: number
  median?: number
  mode?: number
  stdDev?: number
  variance?: number
  min?: number
  max?: number
  q1?: number
  q3?: number
  iqr?: number
  range?: number
  skewness?: number
  outliers?: number[]
}

export interface ColumnAnalysis {
  column: string
  type: 'numeric' | 'categorical' | 'date' | 'boolean'
  stats: StatisticalSummary | CategoricalSummary | DateSummary
  quality: DataQualityMetrics
}

export interface CategoricalSummary {
  count: number
  uniqueCount: number
  topValues: Array<{ value: string; count: number; percentage: number }>
  mode: string
  entropy?: number
}

export interface DateSummary {
  count: number
  earliest: string
  latest: string
  range: string
  uniqueCount: number
}

export interface DataQualityMetrics {
  totalCount: number
  nullCount: number
  nullPercentage: number
  uniqueCount: number
  duplicateCount: number
  completeness: number // 0-1 score
}

export interface CorrelationResult {
  column1: string
  column2: string
  coefficient: number // Pearson correlation coefficient (-1 to 1)
  strength: 'very weak' | 'weak' | 'moderate' | 'strong' | 'very strong'
  direction: 'positive' | 'negative' | 'none'
  pValue?: number
}

export class AnalyticsService {
  /**
   * Calculate comprehensive statistics for numeric data
   */
  static analyzeNumericColumn(values: number[]): StatisticalSummary {
    const cleanValues = values.filter(v => typeof v === 'number' && !isNaN(v))

    if (cleanValues.length === 0) {
      return { count: 0 }
    }

    const sorted = [...cleanValues].sort((a, b) => a - b)
    const q1Value = quantile(sorted, 0.25)
    const q3Value = quantile(sorted, 0.75)
    const iqrValue = q3Value - q1Value

    // Detect outliers using IQR method
    const lowerBound = q1Value - 1.5 * iqrValue
    const upperBound = q3Value + 1.5 * iqrValue
    const outliers = cleanValues.filter(v => v < lowerBound || v > upperBound)

    return {
      count: cleanValues.length,
      sum: sum(cleanValues),
      mean: mean(cleanValues),
      median: median(cleanValues),
      mode: this.calculateMode(cleanValues),
      stdDev: standardDeviation(cleanValues),
      variance: variance(cleanValues),
      min: min(cleanValues),
      max: max(cleanValues),
      q1: q1Value,
      q3: q3Value,
      iqr: iqrValue,
      range: max(cleanValues) - min(cleanValues),
      skewness: this.calculateSkewness(cleanValues),
      outliers
    }
  }

  /**
   * Calculate mode (most frequent value)
   */
  private static calculateMode(values: number[]): number | undefined {
    const frequency: Record<number, number> = {}
    let maxFreq = 0
    let mode: number | undefined

    values.forEach(v => {
      frequency[v] = (frequency[v] || 0) + 1
      if (frequency[v] > maxFreq) {
        maxFreq = frequency[v]
        mode = v
      }
    })

    return maxFreq > 1 ? mode : undefined
  }

  /**
   * Calculate skewness (measure of asymmetry)
   */
  private static calculateSkewness(values: number[]): number {
    const meanValue = mean(values)
    const stdDevValue = standardDeviation(values)
    const n = values.length

    const sum = values.reduce((acc, v) => {
      return acc + Math.pow((v - meanValue) / stdDevValue, 3)
    }, 0)

    return (n / ((n - 1) * (n - 2))) * sum
  }

  /**
   * Analyze categorical column
   */
  static analyzeCategoricalColumn(values: (string | boolean)[]): CategoricalSummary {
    const cleanValues = values.filter(v => v !== null && v !== undefined)
    const stringValues = cleanValues.map(v => String(v))

    const frequency: Record<string, number> = {}
    stringValues.forEach(v => {
      frequency[v] = (frequency[v] || 0) + 1
    })

    const uniqueCount = Object.keys(frequency).length
    const topValues = Object.entries(frequency)
      .map(([value, count]) => ({
        value,
        count,
        percentage: (count / cleanValues.length) * 100
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)

    const mode = topValues[0]?.value || ''

    return {
      count: cleanValues.length,
      uniqueCount,
      topValues,
      mode,
      entropy: this.calculateEntropy(Object.values(frequency), cleanValues.length)
    }
  }

  /**
   * Calculate Shannon entropy (measure of diversity)
   */
  private static calculateEntropy(frequencies: number[], total: number): number {
    return frequencies.reduce((entropy, freq) => {
      if (freq === 0) return entropy
      const probability = freq / total
      return entropy - probability * Math.log2(probability)
    }, 0)
  }

  /**
   * Analyze date column
   */
  static analyzeDateColumn(values: (string | Date)[]): DateSummary {
    const cleanValues = values
      .filter(v => v !== null && v !== undefined)
      .map(v => new Date(v))
      .filter(d => !isNaN(d.getTime()))

    if (cleanValues.length === 0) {
      return {
        count: 0,
        earliest: '',
        latest: '',
        range: '',
        uniqueCount: 0
      }
    }

    const sorted = cleanValues.sort((a, b) => a.getTime() - b.getTime())
    const earliest = sorted[0]
    const latest = sorted[sorted.length - 1]
    const rangeDays = Math.floor((latest.getTime() - earliest.getTime()) / (1000 * 60 * 60 * 24))

    const uniqueDates = new Set(cleanValues.map(d => d.toISOString().split('T')[0]))

    return {
      count: cleanValues.length,
      earliest: earliest.toISOString(),
      latest: latest.toISOString(),
      range: `${rangeDays} days`,
      uniqueCount: uniqueDates.size
    }
  }

  /**
   * Calculate data quality metrics
   */
  static calculateDataQuality(values: unknown[]): DataQualityMetrics {
    const totalCount = values.length
    const nullCount = values.filter(v => v === null || v === undefined || v === '').length
    const nonNullValues = values.filter(v => v !== null && v !== undefined && v !== '')
    const uniqueCount = new Set(nonNullValues).size
    const duplicateCount = nonNullValues.length - uniqueCount

    return {
      totalCount,
      nullCount,
      nullPercentage: (nullCount / totalCount) * 100,
      uniqueCount,
      duplicateCount,
      completeness: (totalCount - nullCount) / totalCount
    }
  }

  /**
   * Calculate Pearson correlation coefficient between two numeric arrays
   */
  static calculateCorrelation(values1: number[], values2: number[]): CorrelationResult | null {
    // Filter out pairs with null/undefined values
    const pairs = values1
      .map((v1, i) => ({ v1, v2: values2[i] }))
      .filter(p => typeof p.v1 === 'number' && typeof p.v2 === 'number' && !isNaN(p.v1) && !isNaN(p.v2))

    if (pairs.length < 3) {
      return null // Need at least 3 pairs for correlation
    }

    const x = pairs.map(p => p.v1)
    const y = pairs.map(p => p.v2)

    const n = x.length
    const meanX = mean(x)
    const meanY = mean(y)

    const numerator = x.reduce((sum, xi, i) => sum + (xi - meanX) * (y[i] - meanY), 0)
    const denomX = Math.sqrt(x.reduce((sum, xi) => sum + Math.pow(xi - meanX, 2), 0))
    const denomY = Math.sqrt(y.reduce((sum, yi) => sum + Math.pow(yi - meanY, 2), 0))

    const coefficient = numerator / (denomX * denomY)

    // Determine strength
    const absCoeff = Math.abs(coefficient)
    let strength: CorrelationResult['strength']
    if (absCoeff < 0.2) strength = 'very weak'
    else if (absCoeff < 0.4) strength = 'weak'
    else if (absCoeff < 0.6) strength = 'moderate'
    else if (absCoeff < 0.8) strength = 'strong'
    else strength = 'very strong'

    // Determine direction
    let direction: CorrelationResult['direction']
    if (absCoeff < 0.1) direction = 'none'
    else if (coefficient > 0) direction = 'positive'
    else direction = 'negative'

    return {
      column1: 'column1',
      column2: 'column2',
      coefficient,
      strength,
      direction
    }
  }

  /**
   * Calculate correlation matrix for multiple numeric columns
   */
  static calculateCorrelationMatrix(
    data: Record<string, number[]>,
    columnNames: string[]
  ): Record<string, Record<string, number>> {
    const matrix: Record<string, Record<string, number>> = {}

    columnNames.forEach(col1 => {
      matrix[col1] = {}
      columnNames.forEach(col2 => {
        if (col1 === col2) {
          matrix[col1][col2] = 1 // Perfect correlation with self
        } else {
          const result = this.calculateCorrelation(data[col1], data[col2])
          matrix[col1][col2] = result?.coefficient || 0
        }
      })
    })

    return matrix
  }

  /**
   * Detect anomalies using Z-score method
   */
  static detectAnomalies(values: number[], threshold: number = 3): number[] {
    const cleanValues = values.filter(v => typeof v === 'number' && !isNaN(v))
    const meanValue = mean(cleanValues)
    const stdDevValue = standardDeviation(cleanValues)

    return cleanValues.filter(v => {
      const zScore = Math.abs((v - meanValue) / stdDevValue)
      return zScore > threshold
    })
  }

  /**
   * Calculate moving average for time series
   */
  static calculateMovingAverage(values: number[], windowSize: number): number[] {
    const result: number[] = []

    for (let i = 0; i < values.length; i++) {
      const start = Math.max(0, i - windowSize + 1)
      const window = values.slice(start, i + 1)
      const cleanWindow = window.filter(v => typeof v === 'number' && !isNaN(v))
      result.push(cleanWindow.length > 0 ? mean(cleanWindow) : 0)
    }

    return result
  }

  /**
   * Calculate percentage change between values
   */
  static calculatePercentageChange(oldValue: number, newValue: number): number {
    if (oldValue === 0) return newValue === 0 ? 0 : 100
    return ((newValue - oldValue) / Math.abs(oldValue)) * 100
  }

  /**
   * Calculate compound annual growth rate (CAGR)
   */
  static calculateCAGR(beginningValue: number, endingValue: number, years: number): number {
    return (Math.pow(endingValue / beginningValue, 1 / years) - 1) * 100
  }

  /**
   * Group data by a categorical column and aggregate numeric columns
   */
  static groupBy<T extends Record<string, unknown>>(
    data: T[],
    groupByColumn: string,
    aggregations: Record<string, 'sum' | 'avg' | 'count' | 'min' | 'max'>
  ): Array<Record<string, unknown>> {
    const groups: Record<string, T[]> = {}

    // Group data
    data.forEach(row => {
      const key = String(row[groupByColumn] || 'Unknown')
      if (!groups[key]) {
        groups[key] = []
      }
      groups[key].push(row)
    })

    // Aggregate
    return Object.entries(groups).map(([key, rows]) => {
      const result: Record<string, unknown> = { [groupByColumn]: key }

      Object.entries(aggregations).forEach(([column, aggType]) => {
        const values = rows
          .map(row => Number(row[column]))
          .filter(v => !isNaN(v))

        if (values.length === 0) {
          result[column] = 0
          return
        }

        switch (aggType) {
          case 'sum':
            result[column] = sum(values)
            break
          case 'avg':
            result[column] = mean(values)
            break
          case 'count':
            result[column] = values.length
            break
          case 'min':
            result[column] = min(values)
            break
          case 'max':
            result[column] = max(values)
            break
        }
      })

      return result
    })
  }

  /**
   * Normalize values to 0-1 range
   */
  static normalize(values: number[]): number[] {
    const minValue = min(values)
    const maxValue = max(values)
    const range = maxValue - minValue

    if (range === 0) return values.map(() => 0)

    return values.map(v => (v - minValue) / range)
  }

  /**
   * Standardize values (z-score normalization)
   */
  static standardize(values: number[]): number[] {
    const meanValue = mean(values)
    const stdDevValue = standardDeviation(values)

    if (stdDevValue === 0) return values.map(() => 0)

    return values.map(v => (v - meanValue) / stdDevValue)
  }

  /**
   * Calculate linear regression (y = mx + b)
   */
  static linearRegression(x: number[], y: number[]): { slope: number; intercept: number; r2: number } {
    const n = x.length
    const meanX = mean(x)
    const meanY = mean(y)

    const numerator = x.reduce((sum, xi, i) => sum + (xi - meanX) * (y[i] - meanY), 0)
    const denominator = x.reduce((sum, xi) => sum + Math.pow(xi - meanX, 2), 0)

    const slope = numerator / denominator
    const intercept = meanY - slope * meanX

    // Calculate R²
    const predicted = x.map(xi => slope * xi + intercept)
    const ssRes = y.reduce((sum, yi, i) => sum + Math.pow(yi - predicted[i], 2), 0)
    const ssTot = y.reduce((sum, yi) => sum + Math.pow(yi - meanY, 2), 0)
    const r2 = 1 - ssRes / ssTot

    return { slope, intercept, r2 }
  }

  /**
   * Format number for display
   */
  static formatNumber(num: number, decimals: number = 2): string {
    if (Math.abs(num) >= 1e9) {
      return (num / 1e9).toFixed(decimals) + 'B'
    } else if (Math.abs(num) >= 1e6) {
      return (num / 1e6).toFixed(decimals) + 'M'
    } else if (Math.abs(num) >= 1e3) {
      return (num / 1e3).toFixed(decimals) + 'K'
    }
    return num.toFixed(decimals)
  }

  /**
   * Format percentage for display
   */
  static formatPercentage(num: number, decimals: number = 1): string {
    return num.toFixed(decimals) + '%'
  }
}

export default AnalyticsService
