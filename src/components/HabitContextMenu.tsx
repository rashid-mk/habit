import { useEffect, useRef } from 'react'

interface HabitContextMenuProps {
  isOpen: boolean
  onClose: () => void
  onEdit: () => void
  onDelete: () => void
  position: { x: number; y: number }
}

export function HabitContextMenu({ isOpen, onClose, onEdit, onDelete, position }: HabitContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isOpen) return

    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose()
      }
    }

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)
    document.addEventListener('touchstart', handleClickOutside as any)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
      document.removeEventListener('touchstart', handleClickOutside as any)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  // Adjust position to keep menu on screen
  const adjustedPosition = {
    x: Math.min(Math.max(position.x, 120), window.innerWidth - 120),
    y: Math.min(Math.max(position.y, 100), window.innerHeight - 200),
  }

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/20 dark:bg-black/40 z-[60] backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />
      
      {/* Menu */}
      <div
        ref={menuRef}
        className="fixed z-[70] bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden min-w-[200px] animate-context-menu"
        style={{
          top: `${adjustedPosition.y}px`,
          left: `${adjustedPosition.x}px`,
          transform: 'translate(-50%, -50%)',
        }}
      >
        <div className="py-2">
          <button
            onClick={(e) => {
              e.stopPropagation()
              onEdit()
              onClose()
            }}
            className="w-full px-4 py-3 flex items-center gap-3 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-left transition-colors group"
          >
            <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center group-hover:bg-blue-200 dark:group-hover:bg-blue-900/50 transition-colors">
              <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </div>
            <div>
              <div className="font-semibold text-gray-900 dark:text-white">Edit Habit</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Modify settings</div>
            </div>
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation()
              onDelete()
              onClose()
            }}
            className="w-full px-4 py-3 flex items-center gap-3 hover:bg-red-50 dark:hover:bg-red-900/20 text-left transition-colors group"
          >
            <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center group-hover:bg-red-200 dark:group-hover:bg-red-900/50 transition-colors">
              <svg className="w-5 h-5 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
            <div>
              <div className="font-semibold text-gray-900 dark:text-white">Delete Habit</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Remove permanently</div>
            </div>
          </button>
        </div>
      </div>
    </>
  )
}
