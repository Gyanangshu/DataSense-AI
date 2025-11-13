'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  BarChart3, 
  LineChart as LineChartIcon, 
  PieChart as PieChartIcon,
  TrendingUp,
  Save,
  RefreshCw,
  Palette,
  Settings2,
  Eye
} from 'lucide-react'
import { LineChart } from '@/components/charts/LineChart'
import { BarChart } from '@/components/charts/BarChart'
import { PieChart, PieChartData } from '@/components/charts/PieChart'
import { ScatterChart } from '@/components/charts/ScatterChart'
import { CHART_COLORS } from '@/components/charts/BaseChart'
import { ChartData } from '@/types/dataset'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import ChartRecommendations from './ChartRecommendations'
import DataFilter from '@/components/filters/DataFilter'
import AnnotationControls from '@/components/charts/AnnotationControls'
import { useFilterStore } from '@/lib/stores/filterStore'

interface VisualizationBuilderProps {
  dataset: {
    id: string
    name: string
    columns: string[]
    types: Record<string, string>
    stats: Record<string, unknown>
    rowCount: number | null
  }
}

type ChartType = 'line' | 'bar' | 'pie' | 'scatter'
type ColorTheme = 'primary' | 'categorical' | 'sequential' | 'diverging'
type AggregationType = 'none' | 'sum' | 'avg' | 'count'

interface AggregatedData extends ChartData {
  [key: string]: string | number | Date
}

export default function VisualizationBuilder({ dataset }: VisualizationBuilderProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<ChartData[]>([])
  const [pieData, setPieData] = useState<PieChartData[]>([])
  const [visualizationId] = useState(`temp-${Date.now()}`) // Temporary ID for unsaved viz
  const [showAnnotations, setShowAnnotations] = useState(false)

  // Zustand stores
  const { applyFilters } = useFilterStore()

  // Chart configuration state
  const [chartType, setChartType] = useState<ChartType>('bar')
  const [title, setTitle] = useState('New Visualization')
  const [description, setDescription] = useState('')
  const [xAxis, setXAxis] = useState('')
  const [yAxis, setYAxis] = useState<string[]>([])
  const [aggregation, setAggregation] = useState<AggregationType>('none')
  const [colorTheme, setColorTheme] = useState<ColorTheme>('primary')
  const [showGrid, setShowGrid] = useState(true)
  const [showLegend, setShowLegend] = useState(true)
  const [showLabels, setShowLabels] = useState(false)
  const [animated, setAnimated] = useState(true)
  const [stacked, setStacked] = useState(false)
  const [curved, setCurved] = useState(true)
  const [donut, setDonut] = useState(false)
  
  const columns = dataset.columns
  const types = dataset.types
  
  // Filter columns by type
  const numericColumns = useMemo(() => 
    columns.filter(col => types[col] === 'integer' || types[col] === 'float'),
    [columns, types]
  )
  
  const categoricalColumns = useMemo(() => 
    columns.filter(col => types[col] === 'string' || types[col] === 'boolean'),
    [columns, types]
  )
  
  const dateColumns = useMemo(() => 
    columns.filter(col => types[col] === 'date'),
    [columns, types]
  )

  const aggregateData = useCallback((
    rawData: ChartData[],
    groupBy: string,
    valueColumns: string[],
    type: AggregationType
  ): AggregatedData[] => {
    if (type === 'none') return rawData as AggregatedData[]

    const groups: Record<string, ChartData[]> = {}

    rawData.forEach(row => {
      const key = String(row[groupBy] || 'Unknown')
      if (!groups[key]) {
        groups[key] = []
      }
      groups[key].push(row)
    })

    return Object.entries(groups).map(([key, rows]) => {
      const result: AggregatedData = { [groupBy]: key }

      if (type === 'count') {
        // For count, create a 'count' field
        result.count = rows.length
        // Also populate original columns with count for compatibility
        valueColumns.forEach(col => {
          result[col] = rows.length
        })
      } else if (type === 'sum' || type === 'avg' || type === 'min' || type === 'max') {
        valueColumns.forEach(col => {
          const values = rows
            .map(row => Number(row[col]))
            .filter(v => !isNaN(v))

          if (values.length > 0) {
            if (type === 'sum') {
              result[col] = values.reduce((a, b) => a + b, 0)
            } else if (type === 'avg') {
              result[col] = values.reduce((a, b) => a + b, 0) / values.length
            } else if (type === 'min') {
              result[col] = Math.min(...values)
            } else if (type === 'max') {
              result[col] = Math.max(...values)
            }
          } else {
            result[col] = 0
          }
        })
      }

      return result
    })
  }, [])

  const fetchChartData = useCallback(async () => {
    if (!xAxis && chartType !== 'pie') return
    if (chartType !== 'pie' && yAxis.length === 0) return
    
    setLoading(true)
    try {
      const params = new URLSearchParams({
        limit: '1000',
        ...(xAxis && { sortBy: xAxis }),
        ...(yAxis.length > 0 && { columns: [xAxis, ...yAxis].filter(Boolean).join(',') })
      })
      
      const response = await fetch(`/api/datasets/${dataset.id}/data?${params}`)
      const result = await response.json()

      console.log('📊 Raw data fetched:', result.data.length, 'rows')

      // Apply filters from Zustand store
      const filteredData = applyFilters(dataset.id, result.data) as ChartData[]
      console.log('🔍 After filters:', filteredData.length, 'rows')

      // Process data based on aggregation
      let processedData: ChartData[] = filteredData

      if (aggregation !== 'none' && xAxis) {
        processedData = aggregateData(filteredData, xAxis, yAxis, aggregation)
        console.log('📈 After aggregation:', processedData.length, 'rows', processedData)
      } else {
        console.log('📊 No aggregation, data:', processedData.slice(0, 3))
      }

      // For pie charts, transform data
      if (chartType === 'pie' && processedData.length > 0) {
        const pieColumn = yAxis[0] || Object.keys(processedData[0]).find(key => key !== xAxis)
        if (pieColumn) {
          const transformedPieData: PieChartData[] = processedData
            .map((row: ChartData) => ({
              name: String(row[xAxis] || 'Unknown'),
              value: Number(row[pieColumn]) || 0
            }))
            .slice(0, 10) // Limit to top 10 for pie charts
          
          setPieData(transformedPieData)
        }
      } else {
        setData(processedData)
      }
    } catch (error) {
      console.error('Failed to fetch chart data:', error)
      toast.error('Failed to load chart data')
    } finally {
      setLoading(false)
    }
  }, [xAxis, yAxis, aggregation, chartType, dataset.id, aggregateData, applyFilters])

  // Fetch data when configuration changes OR filters change
  useEffect(() => {
    if ((xAxis && yAxis.length > 0) || (chartType === 'pie' && xAxis)) {
      fetchChartData()
    }
  }, [xAxis, yAxis, aggregation, chartType, fetchChartData, applyFilters])

  const handleApplyRecommendation = (config: Record<string, unknown>) => {
    // Apply the recommended configuration
    setChartType(config.type as ChartType)
    setTitle(String(config.title || 'New Visualization'))
    setDescription(String(config.description || ''))
    setXAxis(String(config.xAxis || ''))
    setYAxis(Array.isArray(config.yAxis) ? config.yAxis as string[] : [])
    setAggregation((config.aggregation as AggregationType) || 'none')
    setColorTheme((config.colorTheme as ColorTheme) || 'primary')
    setShowGrid(Boolean(config.showGrid ?? true))
    setShowLegend(Boolean(config.showLegend ?? true))
    setShowLabels(Boolean(config.showLabels ?? false))
    setAnimated(Boolean(config.animated ?? true))
    setStacked(Boolean(config.stacked ?? false))
    setCurved(Boolean(config.curved ?? true))
    setDonut(Boolean(config.donut ?? false))
  }

  const handleSaveVisualization = async () => {
    try {
      const config = {
        type: chartType,
        title,
        description,
        xAxis,
        yAxis,
        aggregation,
        colorTheme,
        showGrid,
        showLegend,
        showLabels,
        animated,
        stacked,
        curved,
        donut
      }
      
      const response = await fetch('/api/visualizations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: title,
          type: chartType,
          config,
          datasetId: dataset.id
        })
      })
      
      if (response.ok) {
        toast.success('Visualization saved successfully!')
        router.push(`/datasets/${dataset.id}`)
      } else {
        throw new Error('Failed to save')
      }
    } catch (error) {
      toast.error('Failed to save visualization')
    }
  }

  const getChartComponent = () => {
    const colors = CHART_COLORS[colorTheme]

    // Better validation and error messages
    if (!xAxis && chartType !== 'pie') {
      return (
        <div className="h-[400px] flex items-center justify-center">
          <div className="text-center max-w-md">
            <BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-50 text-muted-foreground" />
            <p className="font-medium text-foreground mb-2">Select X-Axis</p>
            <p className="text-sm text-muted-foreground">
              Please select a column for the X-axis to visualize your data.
            </p>
          </div>
        </div>
      )
    }

    if (chartType !== 'pie' && yAxis.length === 0) {
      return (
        <div className="h-[400px] flex items-center justify-center">
          <div className="text-center max-w-md">
            <BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-50 text-muted-foreground" />
            <p className="font-medium text-foreground mb-2">Select Y-Axis</p>
            <p className="text-sm text-muted-foreground">
              Please select at least one numeric column for the Y-axis.
            </p>
          </div>
        </div>
      )
    }

    // Check for incompatible axis combinations - SCATTER PLOT NEEDS NUMERIC AXES
    if (chartType === 'scatter') {
      const xAxisIsNumeric = numericColumns.includes(xAxis)
      const yAxisIsNumeric = yAxis.length > 0 && numericColumns.includes(yAxis[0])

      if (!xAxisIsNumeric || !yAxisIsNumeric) {
        return (
          <div className="h-[400px] flex items-center justify-center">
            <div className="text-center max-w-md">
              <TrendingUp className="w-12 h-12 mx-auto mb-3 opacity-50 text-amber-500" />
              <p className="font-medium text-foreground mb-2">Scatter Plot Requires Numeric Axes</p>
              <p className="text-sm text-muted-foreground mb-3">
                Scatter plots require BOTH X and Y axes to be numeric columns.
              </p>
              <div className="text-xs text-left space-y-2 bg-secondary/30 p-3 rounded-lg">
                <div>
                  <span className="font-medium">X-Axis ({xAxis || 'none'}):</span>{' '}
                  <span className={xAxisIsNumeric ? 'text-green-500' : 'text-red-500'}>
                    {xAxisIsNumeric ? '✓ Numeric' : '✗ Not Numeric (need: Sales_Amount, Profit, etc.)'}
                  </span>
                </div>
                <div>
                  <span className="font-medium">Y-Axis ({yAxis[0] || 'none'}):</span>{' '}
                  <span className={yAxisIsNumeric ? 'text-green-500' : 'text-red-500'}>
                    {yAxisIsNumeric ? '✓ Numeric' : '✗ Not Numeric (need: Units_Sold, Return_Rate, etc.)'}
                  </span>
                </div>
              </div>
              <p className="text-sm text-primary mt-3">
                Numeric columns: {numericColumns.join(', ') || 'none available'}
              </p>
            </div>
          </div>
        )
      }
    }

    // Only show "No Data" error if we have axes selected but truly no data
    const hasNoData = (chartType === 'pie' && pieData.length === 0) || (chartType !== 'pie' && data.length === 0)
    const hasAxesSelected = xAxis && (chartType === 'pie' || yAxis.length > 0)

    if (hasNoData && hasAxesSelected) {
      return (
        <div className="h-[400px] flex items-center justify-center">
          <div className="text-center max-w-md">
            <BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-50 text-amber-500" />
            <p className="font-medium text-foreground mb-2">No Data to Display</p>
            <p className="text-sm text-muted-foreground mb-3">
              The selected configuration produced no data. Possible reasons:
            </p>
            <ul className="text-xs text-muted-foreground text-left list-disc list-inside space-y-1">
              <li>Active filters excluded all rows</li>
              <li>Selected columns contain only null/empty values</li>
              <li>Aggregation type doesn not match the data</li>
            </ul>
            <p className="text-sm text-primary mt-3">
              Try removing filters or selecting different columns.
            </p>
          </div>
        </div>
      )
    }
    
    switch (chartType) {
      case 'line':
        return (
          <LineChart
            data={data}
            xKey={xAxis}
            yKeys={aggregation === 'count' ? ['count'] : yAxis}
            colors={colors}
            showGrid={showGrid}
            showLegend={showLegend}
            curved={curved}
            animated={animated}
            visualizationId={visualizationId}
          />
        )
      case 'bar':
        return (
          <BarChart
            data={data}
            xKey={xAxis}
            yKeys={aggregation === 'count' ? ['count'] : yAxis}
            colors={colors}
            showGrid={showGrid}
            showLegend={showLegend}
            stacked={stacked}
            showLabels={showLabels}
            animated={animated}
            visualizationId={visualizationId}
          />
        )
      case 'pie':
        return (
          <PieChart
            data={pieData}
            colors={colors}
            showLegend={showLegend}
            showLabels={showLabels}
            donut={donut}
            animated={animated}
            visualizationId={visualizationId}
          />
        )
      case 'scatter':
        return (
          <ScatterChart
            data={data}
            xKey={xAxis}
            yKey={yAxis[0]}
            colors={colors}
            showGrid={showGrid}
            animated={animated}
            visualizationId={visualizationId}
          />
        )
      default:
        return null
    }
  }

  console.log("chart Data is here: ", data)

  return (
    <Tabs defaultValue="config" className="w-full">
      <TabsList className="grid w-full grid-cols-2 mb-6">
        <TabsTrigger value="config">Configuration</TabsTrigger>
        <TabsTrigger value="preview">Preview</TabsTrigger>
      </TabsList>

      <TabsContent value="config">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Configuration Panel */}
          <div className="lg:col-span-1 space-y-4">
            {/* Data Filters */}
            <DataFilter
              datasetId={dataset.id}
              columns={dataset.columns}
              types={dataset.types}
              onFilterChange={() => {
                // Force re-fetch when filters change
                if (xAxis && yAxis.length > 0) {
                  fetchChartData()
                }
              }}
            />

            {/* AI Chart Recommendations */}
            <ChartRecommendations
              datasetId={dataset.id}
              onApplyRecommendation={handleApplyRecommendation}
            />

            {/* Chart Annotations */}
            <AnnotationControls
              visualizationId={visualizationId}
              collapsed={!showAnnotations}
              onToggle={() => setShowAnnotations(!showAnnotations)}
            />

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings2 className="w-5 h-5" />
                  Chart Configuration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Chart Type */}
                <div className="space-y-2">
                  <Label>Chart Type</Label>
                  <Select value={chartType} onValueChange={(v) => setChartType(v as ChartType)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bar">
                        <div className="flex items-center gap-2">
                          <BarChart3 className="w-4 h-4" />
                          Bar Chart
                        </div>
                      </SelectItem>
                      <SelectItem value="line">
                        <div className="flex items-center gap-2">
                          <LineChartIcon className="w-4 h-4" />
                          Line Chart
                        </div>
                      </SelectItem>
                      <SelectItem value="pie">
                        <div className="flex items-center gap-2">
                          <PieChartIcon className="w-4 h-4" />
                          Pie Chart
                        </div>
                      </SelectItem>
                      <SelectItem value="scatter">
                        <div className="flex items-center gap-2">
                          <TrendingUp className="w-4 h-4" />
                          Scatter Plot
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Title */}
                <div className="space-y-2">
                  <Label>Title</Label>
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Enter chart title"
                  />
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label>Description (optional)</Label>
                  <Input
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Enter chart description"
                  />
                </div>

                {/* X Axis - Show for pie charts as category selector */}
                <div className="space-y-2">
                  <Label>{chartType === 'pie' ? 'Category' : 'X Axis'}</Label>
                  <Select value={xAxis} onValueChange={setXAxis}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select column" />
                    </SelectTrigger>
                    <SelectContent>
                      {chartType === 'pie' 
                        ? [...categoricalColumns, ...dateColumns].map(col => (
                            <SelectItem key={col} value={col}>{col}</SelectItem>
                          ))
                        : columns.map(col => (
                            <SelectItem key={col} value={col}>{col}</SelectItem>
                          ))
                      }
                    </SelectContent>
                  </Select>
                </div>

                {/* Y Axis */}
                <div className="space-y-2">
                  <Label>{chartType === 'pie' ? 'Values' : 'Y Axis'}</Label>
                  <Select 
                    value={yAxis[0] || ''} 
                    onValueChange={(v) => setYAxis(chartType === 'pie' ? [v] : [...yAxis.filter(y => y !== v), v])}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select column" />
                    </SelectTrigger>
                    <SelectContent>
                      {numericColumns.map(col => (
                        <SelectItem key={col} value={col}>{col}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  {/* Selected Y columns */}
                  {yAxis.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {yAxis.map(col => (
                        <div key={col} className="flex items-center gap-1 px-2 py-1 bg-secondary rounded-md text-sm">
                          <span>{col}</span>
                          <button
                            onClick={() => setYAxis(yAxis.filter(y => y !== col))}
                            className="ml-1 hover:text-destructive"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Aggregation */}
                <div className="space-y-2">
                  <Label>Aggregation</Label>
                  <Select value={aggregation} onValueChange={(v) => setAggregation(v as AggregationType)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      <SelectItem value="sum">Sum</SelectItem>
                      <SelectItem value="avg">Average</SelectItem>
                      <SelectItem value="count">Count</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Color Theme */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Palette className="w-4 h-4" />
                    Color Theme
                  </Label>
                  <Select value={colorTheme} onValueChange={(v) => setColorTheme(v as ColorTheme)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="primary">Primary</SelectItem>
                      <SelectItem value="categorical">Categorical</SelectItem>
                      <SelectItem value="sequential">Sequential</SelectItem>
                      <SelectItem value="diverging">Diverging</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Display Options */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="w-5 h-5" />
                  Display Options
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {chartType !== 'pie' && (
                  <div className="flex items-center justify-between">
                    <Label htmlFor="grid">Show Grid</Label>
                    <Switch id="grid" checked={showGrid} onCheckedChange={setShowGrid} />
                  </div>
                )}
                
                <div className="flex items-center justify-between">
                  <Label htmlFor="legend">Show Legend</Label>
                  <Switch id="legend" checked={showLegend} onCheckedChange={setShowLegend} />
                </div>
                
                <div className="flex items-center justify-between">
                  <Label htmlFor="labels">Show Labels</Label>
                  <Switch id="labels" checked={showLabels} onCheckedChange={setShowLabels} />
                </div>
                
                <div className="flex items-center justify-between">
                  <Label htmlFor="animated">Animated</Label>
                  <Switch id="animated" checked={animated} onCheckedChange={setAnimated} />
                </div>
                
                {chartType === 'bar' && (
                  <div className="flex items-center justify-between">
                    <Label htmlFor="stacked">Stacked</Label>
                    <Switch id="stacked" checked={stacked} onCheckedChange={setStacked} />
                  </div>
                )}
                
                {chartType === 'line' && (
                  <div className="flex items-center justify-between">
                    <Label htmlFor="curved">Curved Lines</Label>
                    <Switch id="curved" checked={curved} onCheckedChange={setCurved} />
                  </div>
                )}
                
                {chartType === 'pie' && (
                  <div className="flex items-center justify-between">
                    <Label htmlFor="donut">Donut Chart</Label>
                    <Switch id="donut" checked={donut} onCheckedChange={setDonut} />
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Chart Preview */}
          <div className="lg:col-span-2">
            <Card className="h-full">
              <CardHeader>
                <CardTitle>{title}</CardTitle>
                {description && <CardDescription>{description}</CardDescription>}
              </CardHeader>
              <CardContent>
                {getChartComponent()}
              </CardContent>
            </Card>
          </div>
        </div>
      </TabsContent>

      <TabsContent value="preview">
        <Card>
          <CardHeader>
            <CardTitle>{title}</CardTitle>
            {description && <CardDescription>{description}</CardDescription>}
          </CardHeader>
          <CardContent>
            {getChartComponent()}
            
            {/* Actions */}
            <div className="flex gap-2 mt-6">
              <Button 
                onClick={handleSaveVisualization}
                disabled={!xAxis && chartType !== 'pie'}
              >
                <Save className="w-4 h-4 mr-2" />
                Save Visualization
              </Button>
              
              <Button 
                variant="outline"
                onClick={() => fetchChartData()}
                disabled={loading}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh Data
              </Button>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  )
}