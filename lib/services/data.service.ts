import { prisma } from '@/lib/prisma'

export interface DataQueryOptions {
  datasetId: string
  columns?: string[]
  limit?: number
  offset?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  filters?: Record<string, any>
}

export interface PaginatedData {
  data: any[]
  total: number
  limit: number
  offset: number
  hasMore: boolean
}

export class DataService {
  /**
   * Get paginated data from a dataset
   * This is more efficient than loading all data at once
   */
  static async getPaginatedData(
    options: DataQueryOptions
  ): Promise<PaginatedData> {
    const {
      datasetId,
      columns,
      limit = 100,
      offset = 0,
      sortBy,
      sortOrder = 'asc',
      filters = {}
    } = options

    // Fetch dataset metadata
    const dataset = await prisma.dataset.findUnique({
      where: { id: datasetId },
      select: {
        data: true,
        rowCount: true,
        columns: true
      }
    })

    if (!dataset) {
      throw new Error('Dataset not found')
    }

    let processedData = dataset.data as any[]

    // Apply filters
    if (Object.keys(filters).length > 0) {
      processedData = processedData.filter(row => {
        return Object.entries(filters).every(([key, value]) => {
          if (value === null || value === undefined) return true
          return row[key] === value
        })
      })
    }

    // Sort data
    if (sortBy) {
      processedData.sort((a, b) => {
        const aVal = a[sortBy]
        const bVal = b[sortBy]
        
        if (aVal === null || aVal === undefined) return 1
        if (bVal === null || bVal === undefined) return -1
        
        if (typeof aVal === 'number' && typeof bVal === 'number') {
          return sortOrder === 'asc' ? aVal - bVal : bVal - aVal
        }
        
        const aStr = String(aVal)
        const bStr = String(bVal)
        return sortOrder === 'asc' 
          ? aStr.localeCompare(bStr)
          : bStr.localeCompare(aStr)
      })
    }

    // Paginate
    const paginatedData = processedData.slice(offset, offset + limit)

    // Filter columns if specified
    let finalData = paginatedData
    if (columns && columns.length > 0) {
      finalData = paginatedData.map(row => {
        const filteredRow: any = {}
        columns.forEach(col => {
          if (col in row) {
            filteredRow[col] = row[col]
          }
        })
        return filteredRow
      })
    }

    return {
      data: finalData,
      total: processedData.length,
      limit,
      offset,
      hasMore: offset + limit < processedData.length
    }
  }

  /**
   * Get aggregated data for charts
   * More efficient for large datasets
   */
  static async getAggregatedData(
    datasetId: string,
    aggregationType: 'sum' | 'avg' | 'count' | 'min' | 'max',
    groupBy?: string,
    columns?: string[]
  ) {
    const dataset = await prisma.dataset.findUnique({
      where: { id: datasetId },
      select: {
        data: true,
        types: true
      }
    })

    if (!dataset) {
      throw new Error('Dataset not found')
    }

    const data = dataset.data as any[]
    const types = dataset.types as Record<string, string>

    // If no groupBy, return simple aggregation
    if (!groupBy) {
      const result: Record<string, any> = {}
      
      const numericColumns = columns || Object.entries(types)
        .filter(([_, type]) => type === 'integer' || type === 'float')
        .map(([col]) => col)

      numericColumns.forEach(col => {
        const values = data
          .map(row => row[col])
          .filter(val => val !== null && val !== undefined)
          .map(Number)
          .filter(n => !isNaN(n))

        if (values.length === 0) {
          result[col] = 0
          return
        }

        switch (aggregationType) {
          case 'sum':
            result[col] = values.reduce((a, b) => a + b, 0)
            break
          case 'avg':
            result[col] = values.reduce((a, b) => a + b, 0) / values.length
            break
          case 'count':
            result[col] = values.length
            break
          case 'min':
            result[col] = Math.min(...values)
            break
          case 'max':
            result[col] = Math.max(...values)
            break
        }
      })

      return result
    }

    // Group by aggregation
    const groups: Record<string, any[]> = {}
    
    data.forEach(row => {
      const key = row[groupBy]
      if (!groups[key]) {
        groups[key] = []
      }
      groups[key].push(row)
    })

    const aggregatedData = Object.entries(groups).map(([key, rows]) => {
      const result: Record<string, any> = { [groupBy]: key }
      
      const numericColumns = columns || Object.entries(types)
        .filter(([_, type]) => type === 'integer' || type === 'float')
        .map(([col]) => col)

      numericColumns.forEach(col => {
        const values = rows
          .map(row => row[col])
          .filter(val => val !== null && val !== undefined)
          .map(Number)
          .filter(n => !isNaN(n))

        if (values.length === 0) {
          result[col] = 0
          return
        }

        switch (aggregationType) {
          case 'sum':
            result[col] = values.reduce((a, b) => a + b, 0)
            break
          case 'avg':
            result[col] = values.reduce((a, b) => a + b, 0) / values.length
            break
          case 'count':
            result[col] = values.length
            break
          case 'min':
            result[col] = Math.min(...values)
            break
          case 'max':
            result[col] = Math.max(...values)
            break
        }
      })

      return result
    })

    return aggregatedData
  }

  /**
   * Get time series data
   * Optimized for date-based visualizations
   */
  static async getTimeSeriesData(
    datasetId: string,
    dateColumn: string,
    valueColumns: string[],
    interval: 'day' | 'week' | 'month' | 'year' = 'day'
  ) {
    const dataset = await prisma.dataset.findUnique({
      where: { id: datasetId },
      select: {
        data: true,
        types: true
      }
    })

    if (!dataset) {
      throw new Error('Dataset not found')
    }

    const data = dataset.data as any[]
    const types = dataset.types as Record<string, string>

    if (types[dateColumn] !== 'date') {
      throw new Error(`Column ${dateColumn} is not a date column`)
    }

    // Group data by time interval
    const groupedData: Record<string, any[]> = {}
    
    data.forEach(row => {
      const date = new Date(row[dateColumn])
      if (isNaN(date.getTime())) return
      
      let key: string
      switch (interval) {
        case 'day':
          key = date.toISOString().split('T')[0]
          break
        case 'week':
          const weekStart = new Date(date)
          weekStart.setDate(date.getDate() - date.getDay())
          key = weekStart.toISOString().split('T')[0]
          break
        case 'month':
          key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
          break
        case 'year':
          key = String(date.getFullYear())
          break
      }
      
      if (!groupedData[key]) {
        groupedData[key] = []
      }
      groupedData[key].push(row)
    })

    // Aggregate values for each time period
    const timeSeriesData = Object.entries(groupedData)
      .map(([date, rows]) => {
        const result: Record<string, any> = { date }
        
        valueColumns.forEach(col => {
          const values = rows
            .map(row => row[col])
            .filter(val => val !== null && val !== undefined)
            .map(Number)
            .filter(n => !isNaN(n))
          
          if (values.length > 0) {
            result[col] = values.reduce((a, b) => a + b, 0) / values.length
          } else {
            result[col] = 0
          }
        })
        
        return result
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

    return timeSeriesData
  }
}