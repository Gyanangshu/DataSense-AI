import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

export interface FilterCondition {
  id: string
  column: string
  operator: 'equals' | 'notEquals' | 'contains' | 'greaterThan' | 'lessThan' | 'between' | 'in'
  value: string | number | [number, number] | string[]
  type: 'string' | 'number' | 'date' | 'boolean'
}

export interface DatasetFilter {
  datasetId: string
  conditions: FilterCondition[]
  logic: 'and' | 'or'
}

interface FilterStore {
  // Active filters per dataset
  filters: Record<string, DatasetFilter>

  // Add filter condition
  addFilter: (datasetId: string, condition: FilterCondition) => void

  // Remove filter condition
  removeFilter: (datasetId: string, conditionId: string) => void

  // Update filter condition
  updateFilter: (datasetId: string, conditionId: string, updates: Partial<FilterCondition>) => void

  // Clear all filters for dataset
  clearFilters: (datasetId: string) => void

  // Set filter logic (AND/OR)
  setFilterLogic: (datasetId: string, logic: 'and' | 'or') => void

  // Get filters for dataset
  getFilters: (datasetId: string) => FilterCondition[]

  // Apply filters to data
  applyFilters: (datasetId: string, data: Record<string, unknown>[]) => Record<string, unknown>[]
}

export const useFilterStore = create<FilterStore>()(
  persist(
    (set, get) => ({
      filters: {},

      addFilter: (datasetId, condition) => {
        set((state) => ({
          filters: {
            ...state.filters,
            [datasetId]: {
              datasetId,
              conditions: [
                ...(state.filters[datasetId]?.conditions || []),
                condition
              ],
              logic: state.filters[datasetId]?.logic || 'and'
            }
          }
        }))
      },

      removeFilter: (datasetId, conditionId) => {
        set((state) => {
          const datasetFilter = state.filters[datasetId]
          if (!datasetFilter) return state

          return {
            filters: {
              ...state.filters,
              [datasetId]: {
                ...datasetFilter,
                conditions: datasetFilter.conditions.filter(c => c.id !== conditionId)
              }
            }
          }
        })
      },

      updateFilter: (datasetId, conditionId, updates) => {
        set((state) => {
          const datasetFilter = state.filters[datasetId]
          if (!datasetFilter) return state

          return {
            filters: {
              ...state.filters,
              [datasetId]: {
                ...datasetFilter,
                conditions: datasetFilter.conditions.map(c =>
                  c.id === conditionId ? { ...c, ...updates } : c
                )
              }
            }
          }
        })
      },

      clearFilters: (datasetId) => {
        set((state) => {
          const newFilters = { ...state.filters }
          delete newFilters[datasetId]
          return { filters: newFilters }
        })
      },

      setFilterLogic: (datasetId, logic) => {
        set((state) => ({
          filters: {
            ...state.filters,
            [datasetId]: {
              ...state.filters[datasetId],
              datasetId,
              conditions: state.filters[datasetId]?.conditions || [],
              logic
            }
          }
        }))
      },

      getFilters: (datasetId) => {
        return get().filters[datasetId]?.conditions || []
      },

      applyFilters: (datasetId, data) => {
        const datasetFilter = get().filters[datasetId]
        if (!datasetFilter || datasetFilter.conditions.length === 0) {
          return data
        }

        return data.filter(row => {
          const results = datasetFilter.conditions.map(condition => {
            const value = row[condition.column]

            switch (condition.operator) {
              case 'equals':
                return value === condition.value
              case 'notEquals':
                return value !== condition.value
              case 'contains':
                return String(value).toLowerCase().includes(String(condition.value).toLowerCase())
              case 'greaterThan':
                return Number(value) > Number(condition.value)
              case 'lessThan':
                return Number(value) < Number(condition.value)
              case 'between':
                if (Array.isArray(condition.value)) {
                  const num = Number(value)
                  return num >= condition.value[0] && num <= condition.value[1]
                }
                return false
              case 'in':
                if (Array.isArray(condition.value)) {
                  return condition.value.includes(String(value))
                }
                return false
              default:
                return true
            }
          })

          return datasetFilter.logic === 'and'
            ? results.every(Boolean)
            : results.some(Boolean)
        })
      }
    }),
    {
      name: 'datasense-filters',
      storage: createJSONStorage(() => localStorage)
    }
  )
)
