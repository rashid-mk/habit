import { useSyncStatus } from '../hooks/useSyncStatus'

export function SyncStatusIndicator() {
  const { syncStatus } = useSyncStatus()

  if (syncStatus === 'online') {
    return null // Don't show anything when online
  }

  return (
    <div className="fixed top-4 right-4 z-50">
      <div
        className={`px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 ${
          syncStatus === 'offline'
            ? 'bg-yellow-100 text-yellow-800 border border-yellow-300'
            : 'bg-blue-100 text-blue-800 border border-blue-300'
        }`}
      >
        <div
          className={`w-2 h-2 rounded-full ${
            syncStatus === 'offline' ? 'bg-yellow-500' : 'bg-blue-500 animate-pulse'
          }`}
        />
        <span className="text-sm font-medium">
          {syncStatus === 'offline'
            ? 'Offline - Changes will sync when online'
            : 'Syncing...'}
        </span>
      </div>
    </div>
  )
}
