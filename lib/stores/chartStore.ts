import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

export interface ChartAnnotation {
  id: string
  visualizationId: string
  type: 'point' | 'line' | 'area' | 'text'
  x?: number | string
  y?: number | string
  x1?: number | string
  y1?: number | string
  x2?: number | string
  y2?: number | string
  text?: string
  color?: string
  strokeWidth?: number
  createdAt: number
}

export interface DrillDownState {
  visualizationId: string
  dataPoint: Record<string, unknown>
  timestamp: number
}

interface ChartStore {
  // Annotations per visualization
  annotations: Record<string, ChartAnnotation[]>

  // Drill-down state
  drillDown: DrillDownState | null

  // Add annotation
  addAnnotation: (annotation: ChartAnnotation) => void

  // Remove annotation
  removeAnnotation: (visualizationId: string, annotationId: string) => void

  // Update annotation
  updateAnnotation: (visualizationId: string, annotationId: string, updates: Partial<ChartAnnotation>) => void

  // Get annotations for visualization
  getAnnotations: (visualizationId: string) => ChartAnnotation[]

  // Clear all annotations for visualization
  clearAnnotations: (visualizationId: string) => void

  // Set drill-down data
  setDrillDown: (state: DrillDownState | null) => void

  // Clear drill-down
  clearDrillDown: () => void

  // Get drill-down state
  getDrillDown: () => DrillDownState | null
}

export const useChartStore = create<ChartStore>()(
  persist(
    (set, get) => ({
      annotations: {},
      drillDown: null,

      addAnnotation: (annotation) => {
        set((state) => ({
          annotations: {
            ...state.annotations,
            [annotation.visualizationId]: [
              ...(state.annotations[annotation.visualizationId] || []),
              annotation
            ]
          }
        }))
      },

      removeAnnotation: (visualizationId, annotationId) => {
        set((state) => {
          const vizAnnotations = state.annotations[visualizationId]
          if (!vizAnnotations) return state

          return {
            annotations: {
              ...state.annotations,
              [visualizationId]: vizAnnotations.filter(a => a.id !== annotationId)
            }
          }
        })
      },

      updateAnnotation: (visualizationId, annotationId, updates) => {
        set((state) => {
          const vizAnnotations = state.annotations[visualizationId]
          if (!vizAnnotations) return state

          return {
            annotations: {
              ...state.annotations,
              [visualizationId]: vizAnnotations.map(a =>
                a.id === annotationId ? { ...a, ...updates } : a
              )
            }
          }
        })
      },

      getAnnotations: (visualizationId) => {
        return get().annotations[visualizationId] || []
      },

      clearAnnotations: (visualizationId) => {
        set((state) => {
          const newAnnotations = { ...state.annotations }
          delete newAnnotations[visualizationId]
          return { annotations: newAnnotations }
        })
      },

      setDrillDown: (drillDownState) => {
        set({ drillDown: drillDownState })
      },

      clearDrillDown: () => {
        set({ drillDown: null })
      },

      getDrillDown: () => {
        return get().drillDown
      }
    }),
    {
      name: 'datasense-charts',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        // Only persist annotations, not drill-down state
        annotations: state.annotations
      })
    }
  )
)
