import { useQuery } from '@tanstack/react-query'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '../config/firebase'
import { useAuthState } from './useAuth'

export interface UserProfile {
  uid: string
  email: string | null
  displayName: string | null
  createdAt: any
}

export function useUserProfile() {
  const { user } = useAuthState()

  return useQuery({
    queryKey: ['userProfile', user?.uid],
    queryFn: async () => {
      if (!user) return null

      const userDoc = await getDoc(doc(db, 'users', user.uid))
      
      if (!userDoc.exists()) {
        // Return basic info from auth if profile doesn't exist
        return {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName || user.email?.split('@')[0] || 'User',
          createdAt: null,
        } as UserProfile
      }

      return userDoc.data() as UserProfile
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}
