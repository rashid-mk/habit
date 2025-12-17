import { createContext, useContext, useState, ReactNode } from 'react'

interface CelebrationContextType {
  triggerCelebration: () => void
  showCelebration: boolean
}

const CelebrationContext = createContext<CelebrationContextType | undefined>(undefined)

export function CelebrationProvider({ children }: { children: ReactNode }) {
  const [showCelebration, setShowCelebration] = useState(false)
  
  const triggerCelebration = () => {
    setShowCelebration(true)
    setTimeout(() => setShowCelebration(false), 3000)
  }

  return (
    <CelebrationContext.Provider value={{ triggerCelebration, showCelebration }}>
      {children}
    </CelebrationContext.Provider>
  )
}

export function useCelebration() {
  const context = useContext(CelebrationContext)
  if (context === undefined) {
    throw new Error('useCelebration must be used within a CelebrationProvider')
  }
  return context
}
