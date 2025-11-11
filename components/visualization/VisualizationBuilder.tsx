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

interface VisualizationBuilderProps {
  dataset: {
    id: string
    name: string
    columns: string[]
    types: Record<string, string>
    stats: Record<string, any>
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
        result.count = rows.length
      } else {
        valueColumns.forEach(col => {
          const values = rows
            .map(row => Number(row[col]))
            .filter(v => !isNaN(v))
          
          if (values.length > 0) {
            if (type === 'sum') {
              result[col] = values.reduce((a, b) => a + b, 0)
            } else if (type === 'avg') {
              result[col] = values.reduce((a, b) => a + b, 0) / values.length
            }
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
      
      // Process data based on aggregation
      let processedData = result.data
      
      if (aggregation !== 'none' && xAxis) {
        processedData = aggregateData(result.data, xAxis, yAxis, aggregation)
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
  }, [xAxis, yAxis, aggregation, chartType, dataset.id, aggregateData])

  // Fetch data when configuration changes
  useEffect(() => {
    if ((xAxis && yAxis.length > 0) || (chartType === 'pie' && xAxis)) {
      fetchChartData()
    }
  }, [xAxis, yAxis, aggregation, chartType, fetchChartData])

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
    
    if ((chartType === 'pie' && pieData.length === 0) || (chartType !== 'pie' && data.length === 0)) {
      return (
        <div className="h-[400px] flex items-center justify-center text-muted-foreground">
          <div className="text-center">
            <BarChart3 className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>Select axes to visualize data</p>
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
          />
        )
      default:
        return null
    }
  }

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