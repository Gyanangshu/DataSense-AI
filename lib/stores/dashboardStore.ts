import { create } from 'zustand'

interface DashboardItem {
  id: string
  visualizationId: string
  x: number
  y: number
  w: number
  h: number
}

interface DashboardStore {
  // Edit mode state
  isEditMode: Record<string, boolean>

  // Temporary layout state (before saving)
  tempLayouts: Record<string, DashboardItem[]>

  // Set edit mode
  setEditMode: (dashboardId: string, isEdit: boolean) => void

  // Check if in edit mode
  isEditing: (dashboardId: string) => boolean

  // Update temporary layout
  updateTempLayout: (dashboardId: string, items: DashboardItem[]) => void

  // Get temporary layout
  getTempLayout: (dashboardId: string) => DashboardItem[] | null

  // Clear temporary layout
  clearTempLayout: (dashboardId: string) => void

  // Reset all state
  reset: () => void
}

export const useDashboardStore = create<DashboardStore>((set, get) => ({
  isEditMode: {},
  tempLayouts: {},

  setEditMode: (dashboardId, isEdit) => {
    set((state) => ({
      isEditMode: {
        ...state.isEditMode,
        [dashboardId]: isEdit
      }
    }))
  },

  isEditing: (dashboardId) => {
    return get().isEditMode[dashboardId] || false
  },

  updateTempLayout: (dashboardId, items) => {
    set((state) => ({
      tempLayouts: {
        ...state.tempLayouts,
        [dashboardId]: items
      }
    }))
  },

  getTempLayout: (dashboardId) => {
    return get().tempLayouts[dashboardId] || null
  },

  clearTempLayout: (dashboardId) => {
    set((state) => {
      const newTempLayouts = { ...state.tempLayouts }
      delete newTempLayouts[dashboardId]
      return { tempLayouts: newTempLayouts }
    })
  },

  reset: () => {
    set({ isEditMode: {}, tempLayouts: {} })
  }
}))
