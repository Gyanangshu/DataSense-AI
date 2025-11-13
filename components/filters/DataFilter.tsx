'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Filter,
  Plus,
  Trash2,
  X,
  CheckCircle2,
  AlertCircle
} from 'lucide-react'
import { useFilterStore, FilterCondition } from '@/lib/stores/filterStore'
import { toast } from 'sonner'

interface DataFilterProps {
  datasetId: string
  columns: string[]
  types: Record<string, string>
  onFilterChange?: (filteredCount: number, totalCount: number) => void
}

const operatorsByType: Record<string, Array<{ value: string; label: string }>> = {
  string: [
    { value: 'equals', label: 'Equals' },
    { value: 'notEquals', label: 'Not Equals' },
    { value: 'contains', label: 'Contains' }
  ],
  integer: [
    { value: 'equals', label: 'Equals' },
    { value: 'notEquals', label: 'Not Equals' },
    { value: 'greaterThan', label: 'Greater Than' },
    { value: 'lessThan', label: 'Less Than' },
    { value: 'between', label: 'Between' }
  ],
  float: [
    { value: 'equals', label: 'Equals' },
    { value: 'notEquals', label: 'Not Equals' },
    { value: 'greaterThan', label: 'Greater Than' },
    { value: 'lessThan', label: 'Less Than' },
    { value: 'between', label: 'Between' }
  ],
  date: [
    { value: 'equals', label: 'Equals' },
    { value: 'greaterThan', label: 'After' },
    { value: 'lessThan', label: 'Before' },
    { value: 'between', label: 'Between' }
  ],
  boolean: [
    { value: 'equals', label: 'Is' }
  ]
}

export default function DataFilter({ datasetId, columns, types, onFilterChange }: DataFilterProps) {
  const { filters, addFilter, removeFilter, updateFilter, clearFilters, setFilterLogic, getFilters } = useFilterStore()

  const activeFilters = getFilters(datasetId)
  const filterLogic = filters[datasetId]?.logic || 'and'

  const [newFilter, setNewFilter] = useState<{
    column: string
    operator: string
    value: string
    value2?: string
  }>({
    column: columns[0] || '',
    operator: 'equals',
    value: ''
  })

  const handleAddFilter = () => {
    if (!newFilter.column || !newFilter.value) {
      toast.error('Please fill in all filter fields')
      return
    }

    // Map dataset types to filter types
    const datasetType = types[newFilter.column]
    let columnType: FilterCondition['type'] = 'string'

    if (datasetType === 'integer' || datasetType === 'float') {
      columnType = 'number'
    } else if (datasetType === 'date') {
      columnType = 'date'
    } else if (datasetType === 'boolean') {
      columnType = 'boolean'
    }

    let filterValue: string | number | [number, number] | string[]

    if (newFilter.operator === 'between') {
      if (!newFilter.value2) {
        toast.error('Please provide both values for "between" filter')
        return
      }
      filterValue = [Number(newFilter.value), Number(newFilter.value2)]
    } else if (columnType === 'number') {
      filterValue = Number(newFilter.value)
    } else {
      filterValue = newFilter.value
    }

    const condition: FilterCondition = {
      id: `filter-${Date.now()}`,
      column: newFilter.column,
      operator: newFilter.operator as FilterCondition['operator'],
      value: filterValue,
      type: columnType
    }

    addFilter(datasetId, condition)
    toast.success('Filter added')

    // Notify parent component that filters changed
    if (onFilterChange) {
      onFilterChange(0, 0) // Will recalculate in parent
    }

    // Reset form
    setNewFilter({
      column: columns[0] || '',
      operator: 'equals',
      value: ''
    })
  }

  const handleRemoveFilter = (filterId: string) => {
    removeFilter(datasetId, filterId)
    toast.success('Filter removed')

    // Notify parent component
    if (onFilterChange) {
      onFilterChange(0, 0)
    }
  }

  const handleClearAll = () => {
    clearFilters(datasetId)
    toast.success('All filters cleared')

    // Notify parent component
    if (onFilterChange) {
      onFilterChange(0, 0)
    }
  }

  const handleLogicChange = (logic: 'and' | 'or') => {
    setFilterLogic(datasetId, logic)

    // Notify parent component when logic changes
    if (onFilterChange) {
      onFilterChange(0, 0)
    }
  }

  const getOperators = (column: string) => {
    const type = types[column]
    return operatorsByType[type] || operatorsByType.string
  }

  const formatFilterValue = (condition: FilterCondition) => {
    if (Array.isArray(condition.value)) {
      return `${condition.value[0]} - ${condition.value[1]}`
    }
    return String(condition.value)
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-primary" />
            <div>
              <CardTitle className="text-lg">Data Filters</CardTitle>
              <CardDescription>
                Filter data before visualization
              </CardDescription>
            </div>
          </div>
          {activeFilters.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearAll}
            >
              <X className="w-4 h-4 mr-1" />
              Clear All
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Active Filters */}
        {activeFilters.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Active Filters ({activeFilters.length})</Label>
              <Select value={filterLogic} onValueChange={(val) => handleLogicChange(val as 'and' | 'or')}>
                <SelectTrigger className="w-24 h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="and">AND</SelectItem>
                  <SelectItem value="or">OR</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 max-h-48 overflow-y-auto">
              {activeFilters.map((filter) => (
                <div
                  key={filter.id}
                  className="flex items-center gap-2 p-2 bg-secondary/50 rounded-lg group"
                >
                  <Badge variant="outline" className="shrink-0 capitalize">
                    {filter.operator.replace(/([A-Z])/g, ' $1').toLowerCase()}
                  </Badge>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{filter.column}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {formatFilterValue(filter)}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveFilter(filter.id)}
                    className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Add New Filter */}
        <div className="space-y-3 pt-3 border-t border-border">
          <Label className="text-sm font-medium">Add New Filter</Label>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label htmlFor="column" className="text-xs">Column</Label>
              <Select value={newFilter.column} onValueChange={(val) => setNewFilter({ ...newFilter, column: val, operator: 'equals' })}>
                <SelectTrigger id="column" className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {columns.map(col => (
                    <SelectItem key={col} value={col}>
                      {col}
                      <Badge variant="secondary" className="ml-2 text-xs">
                        {types[col]}
                      </Badge>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label htmlFor="operator" className="text-xs">Operator</Label>
              <Select value={newFilter.operator} onValueChange={(val) => setNewFilter({ ...newFilter, operator: val })}>
                <SelectTrigger id="operator" className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {getOperators(newFilter.column).map(op => (
                    <SelectItem key={op.value} value={op.value}>
                      {op.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="value" className="text-xs">Value</Label>
            {newFilter.operator === 'between' ? (
              <div className="flex gap-2">
                <Input
                  id="value"
                  type={types[newFilter.column] === 'string' ? 'text' : 'number'}
                  value={newFilter.value}
                  onChange={(e) => setNewFilter({ ...newFilter, value: e.target.value })}
                  placeholder="From"
                  className="h-9"
                />
                <Input
                  type={types[newFilter.column] === 'string' ? 'text' : 'number'}
                  value={newFilter.value2 || ''}
                  onChange={(e) => setNewFilter({ ...newFilter, value2: e.target.value })}
                  placeholder="To"
                  className="h-9"
                />
              </div>
            ) : types[newFilter.column] === 'boolean' ? (
              <Select value={newFilter.value} onValueChange={(val) => setNewFilter({ ...newFilter, value: val })}>
                <SelectTrigger id="value" className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">True</SelectItem>
                  <SelectItem value="false">False</SelectItem>
                </SelectContent>
              </Select>
            ) : (
              <Input
                id="value"
                type={types[newFilter.column] === 'string' ? 'text' : 'number'}
                value={newFilter.value}
                onChange={(e) => setNewFilter({ ...newFilter, value: e.target.value })}
                placeholder="Enter value..."
                className="h-9"
              />
            )}
          </div>

          <Button
            onClick={handleAddFilter}
            size="sm"
            className="w-full"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Filter
          </Button>
        </div>

        {/* Filter Summary */}
        {activeFilters.length > 0 && (
          <div className="pt-3 border-t border-border">
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              <span className="text-muted-foreground">
                {activeFilters.length} filter{activeFilters.length !== 1 ? 's' : ''} active
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
