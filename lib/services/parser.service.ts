import Papa from 'papaparse'
import ExcelJS from 'exceljs'
import { Readable } from 'stream'

// Define proper types
type DataRow = Record<string, unknown>

interface NumericStats {
  type: 'integer' | 'float'
  count: number
  nullCount: number
  min: number
  max: number
  mean: number
  median: number
  stdDev: number
  sum: number
  unique: number
}

interface StringStats {
  type: 'string'
  count: number
  nullCount: number
  unique: number
  maxLength: number
  minLength: number
  topValues: Array<{ value: string; count: number; percentage: number }>
}

interface DateStats {
  type: 'date'
  count: number
  nullCount: number
  earliest: Date
  latest: Date
  unique: number
}

interface BooleanStats {
  type: 'boolean'
  count: number
  nullCount: number
  trueCount: number
  falseCount: number
  truePercentage: number
}

interface EmptyStats {
  type: string
  count: number
  nullCount: number
}

type ColumnStats = NumericStats | StringStats | DateStats | BooleanStats | EmptyStats

export interface ParsedData {
  data: DataRow[]
  columns: string[]
  types: Record<string, string>
  stats: Record<string, ColumnStats>
  rowCount: number
}

export class ParserService {
  /**
   * Parse CSV file using PapaParse
   */
  static async parseCSV(buffer: Buffer): Promise<ParsedData> {
    const text = buffer.toString('utf-8')
    
    return new Promise((resolve, reject) => {
      Papa.parse(text, {
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true,
        complete: (results) => {
          const data = results.data as DataRow[]
          const columns = results.meta.fields || []
          
          if (data.length === 0) {
            reject(new Error('File is empty or invalid'))
            return
          }
          
          const types = this.inferTypes(data, columns)
          const stats = this.computeStats(data, columns, types)
          
          resolve({
            data,
            columns,
            types,
            stats,
            rowCount: data.length,
          })
        },
        error: (err: Error) => reject(new Error(`CSV parsing failed: ${err.message}`)),
      })
    })
  }
  
  /**
   * Parse Excel file using ExcelJS
   */
  static async parseExcel(buffer: Buffer): Promise<ParsedData> {
    try {
      const workbook = new ExcelJS.Workbook()
      
      // Use stream for better compatibility
      const stream = Readable.from(buffer)
      await workbook.xlsx.read(stream)
      
      const worksheet = workbook.worksheets[0]
      
      if (!worksheet) {
        throw new Error('No worksheets found in Excel file')
      }
      
      // Extract headers from first row
      const headerRow = worksheet.getRow(1)
      const columns: string[] = []
      
      headerRow.eachCell((cell, colNumber) => {
        const value = cell.value?.toString().trim() || `Column${colNumber}`
        columns.push(value)
      })
      
      if (columns.length === 0) {
        throw new Error('No columns found in Excel file')
      }
      
      // Extract data rows
      const data: DataRow[] = []
      
      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return // Skip header row
        
        const rowData: DataRow = {}
        let hasData = false
        
        row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
          if (colNumber <= columns.length) {
            const columnName = columns[colNumber - 1]
            let value: unknown = cell.value
            
            // Handle different cell types
            if (cell.type === ExcelJS.ValueType.Date) {
              value = cell.value
            } else if (cell.type === ExcelJS.ValueType.Formula) {
              value = cell.result
            } else if (
              cell.type === ExcelJS.ValueType.RichText && 
              typeof cell.value === 'object' && 
              cell.value !== null && 
              'richText' in cell.value
            ) {
              const richTextValue = cell.value as { richText: Array<{ text: string }> }
              value = richTextValue.richText.map(rt => rt.text).join('')
            }
            
            // Convert Excel date serial numbers if needed
            if (typeof value === 'number' && value > 25569 && value < 2958466) {
              // Likely an Excel date (between 1970 and 9999)
              const date = new Date((value - 25569) * 86400 * 1000)
              if (!isNaN(date.getTime())) {
                value = date
              }
            }
            
            rowData[columnName] = value
            if (value !== null && value !== undefined && value !== '') {
              hasData = true
            }
          }
        })
        
        // Only add rows that have at least one non-empty cell
        if (hasData) {
          data.push(rowData)
        }
      })
      
      if (data.length === 0) {
        throw new Error('No data found in Excel file')
      }
      
      const types = this.inferTypes(data, columns)
      const stats = this.computeStats(data, columns, types)
      
      return {
        data,
        columns,
        types,
        stats,
        rowCount: data.length,
      }
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Excel parsing failed: ${error.message}`)
      }
      throw new Error('Excel parsing failed')
    }
  }
  
  /**
   * Intelligently detect data types for each column
   */
  private static inferTypes(data: DataRow[], columns: string[]): Record<string, string> {
    const types: Record<string, string> = {}
    
    for (const column of columns) {
      const samples = data
        .slice(0, Math.min(100, data.length)) // Sample first 100 rows
        .map(row => row[column])
        .filter(val => val !== null && val !== undefined && val !== '')
      
      if (samples.length === 0) {
        types[column] = 'string'
        continue
      }
      
      // Check if all samples are booleans
      const booleanValues = ['true', 'false', '0', '1', 'yes', 'no', 'y', 'n']
      const areBooleans = samples.every(val => 
        typeof val === 'boolean' ||
        booleanValues.includes(String(val).toLowerCase())
      )
      
      if (areBooleans) {
        types[column] = 'boolean'
        continue
      }
      
      // Check if all samples are dates
      const areDates = samples.every(val => {
        if (val instanceof Date) return true
        const parsed = Date.parse(String(val))
        return !isNaN(parsed) && (String(val).includes('-') || String(val).includes('/'))
      })
      
      if (areDates) {
        types[column] = 'date'
        continue
      }
      
      // Check if all samples are numbers
      const areNumbers = samples.every(val => {
        const num = Number(val)
        return !isNaN(num) && isFinite(num)
      })
      
      if (areNumbers) {
        const hasDecimals = samples.some(val => {
          const str = String(val)
          return str.includes('.') && !str.endsWith('.0')
        })
        types[column] = hasDecimals ? 'float' : 'integer'
        continue
      }
      
      // Default to string
      types[column] = 'string'
    }
    
    return types
  }
  
  /**
   * Compute statistics for each column based on its type
   */
  private static computeStats(
    data: DataRow[], 
    columns: string[], 
    types: Record<string, string>
  ): Record<string, ColumnStats> {
    const stats: Record<string, ColumnStats> = {}
    
    for (const column of columns) {
      const values = data
        .map(row => row[column])
        .filter(val => val !== null && val !== undefined && val !== '')
      
      const nullCount = data.length - values.length
      const type = types[column]
      
      if (type === 'integer' || type === 'float') {
        const numbers = values.map(Number).filter(n => !isNaN(n) && isFinite(n))
        
        if (numbers.length > 0) {
          const sorted = [...numbers].sort((a, b) => a - b)
          const sum = numbers.reduce((a, b) => a + b, 0)
          const mean = sum / numbers.length
          
          // Calculate median
          const mid = Math.floor(sorted.length / 2)
          const median = sorted.length % 2 === 0
            ? (sorted[mid - 1] + sorted[mid]) / 2
            : sorted[mid]
          
          // Calculate standard deviation
          const squaredDiffs = numbers.map(n => Math.pow(n - mean, 2))
          const avgSquaredDiff = squaredDiffs.reduce((a, b) => a + b, 0) / numbers.length
          const stdDev = Math.sqrt(avgSquaredDiff)
          
          stats[column] = {
            type: type as 'integer' | 'float',
            count: numbers.length,
            nullCount,
            min: Math.min(...numbers),
            max: Math.max(...numbers),
            mean: Number(mean.toFixed(2)),
            median: Number(median.toFixed(2)),
            stdDev: Number(stdDev.toFixed(2)),
            sum: Number(sum.toFixed(2)),
            unique: new Set(numbers).size,
          }
        } else {
          stats[column] = {
            type,
            count: 0,
            nullCount: data.length,
          }
        }
      } else if (type === 'string') {
        const uniqueValues = new Set(values)
        stats[column] = {
          type: 'string',
          count: values.length,
          nullCount,
          unique: uniqueValues.size,
          maxLength: Math.max(...values.map(v => String(v).length)),
          minLength: Math.min(...values.map(v => String(v).length)),
          topValues: this.getTopValues(values, 5),
        }
      } else if (type === 'date') {
        const dates = values
          .map(v => v instanceof Date ? v : new Date(String(v)))
          .filter(d => !isNaN(d.getTime()))
          .sort((a, b) => a.getTime() - b.getTime())
        
        if (dates.length > 0) {
          stats[column] = {
            type: 'date',
            count: dates.length,
            nullCount,
            earliest: dates[0],
            latest: dates[dates.length - 1],
            unique: new Set(dates.map(d => d.toISOString())).size,
          }
        } else {
          stats[column] = {
            type: 'date',
            count: 0,
            nullCount: data.length,
          }
        }
      } else if (type === 'boolean') {
        const truthy = values.filter(v => 
          v === true || v === 1 || v === '1' || 
          String(v).toLowerCase() === 'true' || 
          String(v).toLowerCase() === 'yes' ||
          String(v).toLowerCase() === 'y'
        ).length
        
        stats[column] = {
          type: 'boolean',
          count: values.length,
          nullCount,
          trueCount: truthy,
          falseCount: values.length - truthy,
          truePercentage: Number(((truthy / values.length) * 100).toFixed(1)),
        }
      }
    }
    
    return stats
  }
  
  /**
   * Get the most frequent values in an array
   */
  private static getTopValues(values: unknown[], limit: number) {
    const counts: Record<string, number> = {}
    
    values.forEach(val => {
      const key = String(val)
      counts[key] = (counts[key] || 0) + 1
    })
    
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([value, count]) => ({ 
        value: value.length > 50 ? value.substring(0, 47) + '...' : value,
        count,
        percentage: Number(((count / values.length) * 100).toFixed(1))
      }))
  }
}