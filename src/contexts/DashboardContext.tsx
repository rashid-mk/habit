import { createContext, useContext, useState, ReactNode } from 'react'

interface DashboardContextType {
  hasHabitsForSelectedDate: boolean
  setHasHabitsForSelectedDate: (value: boolean) => void
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined)

export function DashboardProvider({ children }: { children: ReactNode }) {
  const [hasHabitsForSelectedDate, setHasHabitsForSelectedDate] = useState(true)

  return (
    <DashboardContext.Provider value={{ hasHabitsForSelectedDate, setHasHabitsForSelectedDate }}>
      {children}
    </DashboardContext.Provider>
  )
}

export function useDashboard() {
  const context = useContext(DashboardContext)
  if (context === undefined) {
    throw new Error('useDashboard must be used within a DashboardProvider')
  }
  return context
}
