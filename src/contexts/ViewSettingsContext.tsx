import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

type ViewType = 'grid' | 'list'

interface ViewSettingsContextType {
  viewType: ViewType
  setViewType: (type: ViewType) => void
}

const ViewSettingsContext = createContext<ViewSettingsContextType | undefined>(undefined)

export function ViewSettingsProvider({ children }: { children: ReactNode }) {
  const [viewType, setViewTypeState] = useState<ViewType>(() => {
    const saved = localStorage.getItem('habitViewType')
    return (saved as ViewType) || 'grid'
  })

  const setViewType = (type: ViewType) => {
    setViewTypeState(type)
    localStorage.setItem('habitViewType', type)
  }

  return (
    <ViewSettingsContext.Provider value={{ viewType, setViewType }}>
      {children}
    </ViewSettingsContext.Provider>
  )
}

export function useViewSettings() {
  const context = useContext(ViewSettingsContext)
  if (context === undefined) {
    throw new Error('useViewSettings must be used within a ViewSettingsProvider')
  }
  return context
}
