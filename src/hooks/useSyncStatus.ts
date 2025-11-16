import { useState, useEffect } from 'react'
import { onSnapshot, collection, query, limit } from 'firebase/firestore'
import { db } from '../config/firebase'
import { useAuthState } from './useAuth'

export type SyncStatus = 'online' | 'offline' | 'syncing'

export function useSyncStatus() {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('online')
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const { user } = useAuthState()

  useEffect(() => {
    // Listen to browser online/offline events
    const handleOnline = () => {
      setIsOnline(true)
      setSyncStatus('syncing')
    }

    const handleOffline = () => {
      setIsOnline(false)
      setSyncStatus('offline')
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  useEffect(() => {
    if (!user || !isOnline) {
      return
    }

    // Monitor Firestore connection by listening to a query
    // This helps detect when Firestore is syncing
    const habitsRef = collection(db, 'users', user.uid, 'habits')
    const habitsQuery = query(habitsRef, limit(1))

    const unsubscribe = onSnapshot(
      habitsQuery,
      { includeMetadataChanges: true },
      (snapshot) => {
        if (snapshot.metadata.fromCache) {
          // Data is from cache, might be syncing
          setSyncStatus('syncing')
        } else {
          // Data is from server, we're online
          setSyncStatus('online')
        }
      },
      (error) => {
        console.error('Sync status error:', error)
        setSyncStatus('offline')
      }
    )

    return () => unsubscribe()
  }, [user, isOnline])

  return { syncStatus, isOnline }
}
