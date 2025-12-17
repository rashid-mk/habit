import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface DateRestrictionContextType {
  dateRestrictionEnabled: boolean
  toggleDateRestriction: () => void
}

const DateRestrictionContext = createContext<DateRestrictionContextType | undefined>(undefined)

export function DateRestrictionProvider({ children }: { children: ReactNode }) {
  const [dateRestrictionEnabled, setDateRestrictionEnabled] = useState(() => {
    const saved = localStorage.getItem('dateRestrictionEnabled')
    return saved !== null ? JSON.parse(saved) : true // Default to enabled (restricted)
  })

  useEffect(() => {
    localStorage.setItem('dateRestrictionEnabled', JSON.stringify(dateRestrictionEnabled))
  }, [dateRestrictionEnabled])

  const toggleDateRestriction = () => {
    setDateRestrictionEnabled((prev: boolean) => !prev)
  }

  return (
    <DateRestrictionContext.Provider value={{ dateRestrictionEnabled, toggleDateRestriction }}>
      {children}
    </DateRestrictionContext.Provider>
  )
}

export function useDateRestriction() {
  const context = useContext(DateRestrictionContext)
  if (context === undefined) {
    throw new Error('useDateRestriction must be used within a DateRestrictionProvider')
  }
  return context
}
