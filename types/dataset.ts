// Create this new file for proper typing
export interface DataRow {
  [key: string]: string | number | boolean | Date | null
}

export interface DatasetColumn {
  name: string
  type: 'string' | 'integer' | 'float' | 'date' | 'boolean'
}

export interface ColumnStats {
  type: string
  count: number
  nullCount: number
  unique?: number
  // Numeric stats
  min?: number
  max?: number
  mean?: number
  median?: number
  stdDev?: number
  sum?: number
  // String stats
  maxLength?: number
  minLength?: number
  topValues?: Array<{
    value: string
    count: number
    percentage: number
  }>
  // Boolean stats
  trueCount?: number
  falseCount?: number
  truePercentage?: number
  // Date stats
  earliest?: Date
  latest?: Date
}

export interface ChartData {
  [key: string]: string | number | Date
}

export interface Dataset {
  id: string
  name: string
  description: string | null
  rowCount: number | null
  columnCount: number | null
  columns: string[]
  types: Record<string, string>
  stats: Record<string, ColumnStats>
  sourceType: string
  createdAt: Date
  data?: DataRow[]
}