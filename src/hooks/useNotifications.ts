import { useState, useEffect } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db, messaging, getToken, onMessage } from '../config/firebase';
import { useAuthState } from './useAuth';

export function useNotifications() {
  const { user } = useAuthState();
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [token, setToken] = useState<string | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission);
      
      // Show educational prompt if permission not granted
      if (Notification.permission === 'default' && user) {
        setShowPrompt(true);
      }
    }
  }, [user]);

  useEffect(() => {
    if (!messaging || !user) return;

    // Listen for foreground messages
    const unsubscribe = onMessage(messaging, (payload) => {
      console.log('Foreground message received:', payload);
      
      // Show notification if permission granted
      if (Notification.permission === 'granted' && payload.notification) {
        new Notification(payload.notification.title || 'Habit Reminder', {
          body: payload.notification.body,
          icon: '/icon.png',
        });
      }
    });

    return () => unsubscribe();
  }, [user]);

  const requestPermission = async () => {
    if (!messaging || !user) {
      console.warn('Messaging not supported or user not authenticated');
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      setPermission(permission);

      if (permission === 'granted') {
        // Get FCM token
        const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;
        const currentToken = await getToken(messaging, { vapidKey });

        if (currentToken) {
          setToken(currentToken);
          
          // Store token in user document
          const userRef = doc(db, 'users', user.uid);
          await updateDoc(userRef, {
            fcmToken: currentToken,
          });

          setShowPrompt(false);
          return true;
        } else {
          console.warn('No registration token available');
          return false;
        }
      } else {
        setShowPrompt(false);
        return false;
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  };

  const dismissPrompt = () => {
    setShowPrompt(false);
  };

  return {
    permission,
    token,
    showPrompt,
    requestPermission,
    dismissPrompt,
  };
}
