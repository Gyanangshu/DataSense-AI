'use client'

import { useState, useEffect } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  ChevronLeft,
  ChevronRight,
  Database,
  Hash,
  Type,
  Calendar,
  ToggleLeft,
  Loader2,
} from 'lucide-react'
import { formatNumber } from '@/lib/utils'
import { Dataset, DataRow, ColumnStats } from '@/types/dataset'

interface DatasetViewerProps {
  dataset: Dataset
}

interface PaginatedResponse {
  data: DataRow[]
  total: number
  limit: number
  offset: number
  hasMore: boolean
}

export default function DatasetViewer({ dataset }: DatasetViewerProps) {
  const [data, setData] = useState<DataRow[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const pageSize = 50

  // Fetch data whenever `page` or `dataset.id` changes
  useEffect(() => {
    if (!dataset?.id) {
      // Nothing to fetch
      setData([])
      setHasMore(false)
      setLoading(false)
      return
    }

    const controller = new AbortController()
    const signal = controller.signal

    const fetchPage = async () => {
      setLoading(true)
      try {
        const url = `/api/datasets/${encodeURIComponent(
          dataset.id
        )}/data?limit=${pageSize}&offset=${page * pageSize}`
        const res = await fetch(url, { signal })

        if (!res.ok) {
          // Better error message for non-2xx responses
          const text = await res.text().catch(() => '')
          throw new Error(`Fetch error ${res.status}: ${res.statusText} ${text}`)
        }

        const result: PaginatedResponse = await res.json()
        // Optional: log for debugging
        console.debug('Fetched dataset page', page, result)

        setData(result.data ?? [])
        setHasMore(Boolean(result.hasMore))
      } catch (err: any) {
        if (err.name === 'AbortError') {
          // fetch aborted - ignore
          console.debug('Fetch aborted')
        } else {
          console.error('Failed to fetch dataset page:', err)
        }
      } finally {
        setLoading(false)
      }
    }

    fetchPage()

    return () => {
      // cancel pending fetch when component unmounts or deps change
      controller.abort()
    }
  }, [page, dataset?.id]) // effect depends on page and dataset id

  // Helpers
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'integer':
      case 'float':
        return <Hash className="w-4 h-4" />
      case 'string':
        return <Type className="w-4 h-4" />
      case 'date':
        return <Calendar className="w-4 h-4" />
      case 'boolean':
        return <ToggleLeft className="w-4 h-4" />
      default:
        return <Database className="w-4 h-4" />
    }
  }

  const formatCellValue = (value: string | number | boolean | Date | null, type: string) => {
    if (value === null || value === undefined) {
      return <span className="text-muted-foreground">—</span>
    }

    switch (type) {
      case 'integer':
      case 'float':
        return formatNumber(Number(value))
      case 'date':
        return new Date(String(value)).toLocaleDateString()
      case 'boolean':
        return value ? '✓' : '✗'
      default:
        const str = String(value)
        return str.length > 50 ? str.substring(0, 50) + '...' : str
    }
  }

  const columns = dataset.columns ?? []
  const types = dataset.types ?? {}
  const stats = dataset.stats ?? {}

  // Safety: clamp page so it doesn't go negative
  const prevPage = () => setPage((p) => Math.max(0, p - 1))
  const nextPage = () => {
    if (hasMore) setPage((p) => p + 1)
  }

  return (
    <Tabs defaultValue="data" className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="data">Data Preview</TabsTrigger>
        <TabsTrigger value="stats">Statistics</TabsTrigger>
        <TabsTrigger value="columns">Column Analysis</TabsTrigger>
      </TabsList>

      <TabsContent value="data" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Data Preview</CardTitle>
            <CardDescription>
              Showing rows {page * pageSize + 1} to{' '}
              {Math.min((page + 1) * pageSize, dataset.rowCount || 0)} of{' '}
              {(dataset.rowCount ?? 0).toLocaleString()} total
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {columns.map((col) => (
                          <TableHead key={col} className="min-w-[100px]">
                            <div className="flex items-center gap-2">
                              {getTypeIcon(types[col])}
                              <span>{col}</span>
                            </div>
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={columns.length ?? 1}>
                            <div className="py-6 text-center text-sm text-muted-foreground">
                              No data available
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : (
                        data.map((row, idx) => (
                          <TableRow key={idx}>
                            {columns.map((col) => (
                              <TableCell key={col}>
                                {formatCellValue(row[col], types[col])}
                              </TableCell>
                            ))}
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-between mt-4">
                  <Button variant="outline" size="sm" onClick={prevPage} disabled={page === 0}>
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    Previous
                  </Button>

                  <span className="text-sm text-muted-foreground">Page {page + 1}</span>

                  <Button variant="outline" size="sm" onClick={nextPage} disabled={!hasMore}>
                    Next
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="stats" className="space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          {columns.map((col) => {
            const colStats = stats[col] as ColumnStats
            if (!colStats) return null

            return (
              <Card key={col}>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    {getTypeIcon(types[col])}
                    {col}
                  </CardTitle>
                  <CardDescription>Type: {types[col]}</CardDescription>
                </CardHeader>
                <CardContent>
                  <dl className="space-y-2">
                    {colStats.type === 'integer' || colStats.type === 'float' ? (
                      <>
                        <div className="flex justify-between">
                          <dt className="text-sm text-muted-foreground">Mean</dt>
                          <dd className="text-sm font-medium">{formatNumber(colStats.mean || 0)}</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-sm text-muted-foreground">Median</dt>
                          <dd className="text-sm font-medium">{formatNumber(colStats.median || 0)}</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-sm text-muted-foreground">Min</dt>
                          <dd className="text-sm font-medium">{formatNumber(colStats.min || 0)}</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-sm text-muted-foreground">Max</dt>
                          <dd className="text-sm font-medium">{formatNumber(colStats.max || 0)}</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-sm text-muted-foreground">Std Dev</dt>
                          <dd className="text-sm font-medium">{formatNumber(colStats.stdDev || 0)}</dd>
                        </div>
                      </>
                    ) : colStats.type === 'string' ? (
                      <>
                        <div className="flex justify-between">
                          <dt className="text-sm text-muted-foreground">Unique</dt>
                          <dd className="text-sm font-medium">{colStats.unique}</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-sm text-muted-foreground">Max Length</dt>
                          <dd className="text-sm font-medium">{colStats.maxLength}</dd>
                        </div>
                        {colStats.topValues && (
                          <div>
                            <dt className="text-sm text-muted-foreground mb-1">Top Values</dt>
                            {colStats.topValues.map((v, i) => (
                              <div key={i} className="flex justify-between text-xs">
                                <span className="truncate">{v.value}</span>
                                <span>{v.percentage}%</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </>
                    ) : colStats.type === 'boolean' ? (
                      <>
                        <div className="flex justify-between">
                          <dt className="text-sm text-muted-foreground">True</dt>
                          <dd className="text-sm font-medium">
                            {colStats.trueCount} ({colStats.truePercentage}%)
                          </dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-sm text-muted-foreground">False</dt>
                          <dd className="text-sm font-medium">
                            {colStats.falseCount} ({100 - (colStats.truePercentage || 0)}%)
                          </dd>
                        </div>
                      </>
                    ) : null}

                    <div className="flex justify-between pt-2 border-t">
                      <dt className="text-sm text-muted-foreground">Non-null</dt>
                      <dd className="text-sm font-medium">{colStats.count}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-sm text-muted-foreground">Null</dt>
                      <dd className="text-sm font-medium">{colStats.nullCount}</dd>
                    </div>
                  </dl>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </TabsContent>

      <TabsContent value="columns" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Column Overview</CardTitle>
            <CardDescription>Detailed analysis of each column in your dataset</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Column</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Non-null</TableHead>
                  <TableHead>Null</TableHead>
                  <TableHead>Unique</TableHead>
                  <TableHead>Key Stats</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {columns.map((col) => {
                  const colStats = stats[col] as ColumnStats
                  return (
                    <TableRow key={col}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {getTypeIcon(types[col])}
                          {col}
                        </div>
                      </TableCell>
                      <TableCell>{types[col]}</TableCell>
                      <TableCell>{colStats?.count || 0}</TableCell>
                      <TableCell>{colStats?.nullCount || 0}</TableCell>
                      <TableCell>{colStats?.unique || '—'}</TableCell>
                      <TableCell>
                        {colStats?.type === 'integer' || colStats?.type === 'float' ? (
                          <span className="text-sm">
                            {formatNumber(colStats.min || 0)} - {formatNumber(colStats.max || 0)}
                          </span>
                        ) : colStats?.type === 'string' ? (
                          <span className="text-sm">Max length: {colStats.maxLength}</span>
                        ) : colStats?.type === 'boolean' ? (
                          <span className="text-sm">{colStats.truePercentage}% true</span>
                        ) : (
                          '—'
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  )
}
