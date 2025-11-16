import { useMutation, useQueryClient } from '@tanstack/react-query'
import { User } from 'firebase/auth'
import { auth } from '../config/firebase'
import { 
  signInWithEmailAndPassword, 
  signInWithPopup, 
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged
} from 'firebase/auth'
import { doc, setDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../config/firebase'
import { useEffect, useState } from 'react'

export function useAuthState() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user)
      setLoading(false)
    })

    return unsubscribe
  }, [])

  return { user, loading }
}

export function useAuth() {
  const queryClient = useQueryClient()

  const loginWithEmail = useMutation({
    mutationFn: async ({ email, password }: { email: string; password: string }) => {
      const result = await signInWithEmailAndPassword(auth, email, password)
      return result.user
    },
  })

  const loginWithGoogle = useMutation({
    mutationFn: async () => {
      const provider = new GoogleAuthProvider()
      const result = await signInWithPopup(auth, provider)
      return result.user
    },
  })

  const signup = useMutation({
    mutationFn: async ({ email, password, name }: { email: string; password: string; name: string }) => {
      const result = await createUserWithEmailAndPassword(auth, email, password)
      const user = result.user

      // Create user profile document in Firestore
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        email: user.email,
        displayName: name,
        createdAt: serverTimestamp(),
      })

      return user
    },
  })

  const signOut = useMutation({
    mutationFn: async () => {
      await firebaseSignOut(auth)
    },
    onSuccess: () => {
      queryClient.clear()
    },
  })

  return {
    loginWithEmail,
    loginWithGoogle,
    signup,
    signOut,
  }
}
