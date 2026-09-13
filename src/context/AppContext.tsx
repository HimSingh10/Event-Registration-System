import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  User,
  UserRole,
  EventItem,
  EventStatus,
  Registration,
  AppNotification,
  EventFeedback,
  ActivityLog,
  ToastMessage,
  UserLocationState,
  AiRecommendationResult,
  EventCategory,
} from '../types';
import { calculateDistanceKm, findClosestCity, SUPPORTED_CITIES } from '../utils/location';
import { computeSmartRecommendations } from '../services/aiService';
import {
  auth,
  db,
  googleProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  onAuthStateChanged,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  onSnapshot,
  runTransaction,
  handleFirestoreError,
  OperationType,
} from '../firebase';
import { generateQrCodeUrl, generateRegistrationId, generateTicketId } from '../utils/helpers';
import {
  INITIAL_EVENTS,
  INITIAL_USERS,
  INITIAL_REGISTRATIONS,
  INITIAL_NOTIFICATIONS,
  INITIAL_FEEDBACK,
  INITIAL_ACTIVITY_LOGS,
} from '../data/mockData';

const ADMIN_EMAILS = [
  'himanshu.singh120799@marwadiuniversity.ac.in',
  'admin@eventease.io',
  'marcus.vance@eventease.io',
];

interface AppContextType {
  currentUser: User;
  users: User[];
  role: UserRole;
  firebaseAuthLoading: boolean;
  isFirebaseConnected: boolean;

  // Auth methods
  loginWithGoogle: () => Promise<boolean>;
  loginWithEmail: (email: string, pass: string) => Promise<boolean>;
  registerWithEmail: (userData: {
    name: string;
    email: string;
    password?: string;
    phone?: string;
    role: UserRole;
    organization?: string;
  }) => Promise<boolean>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  switchRole: (role: UserRole) => void;
  updateUserProfile: (updates: Partial<User>) => Promise<void>;
  toggleUserStatus: (userId: string) => Promise<void>;
  changeUserRole: (userId: string, newRole: UserRole) => Promise<void>;

  // Events CRUD
  events: EventItem[];
  eventsLoading: boolean;
  getEventById: (id: string) => EventItem | undefined;
  addEvent: (eventData: Omit<EventItem, 'id' | 'registeredCount' | 'checkedInCount' | 'createdAt'>) => Promise<string>;
  updateEvent: (id: string, updates: Partial<EventItem>) => Promise<void>;
  deleteEvent: (id: string) => Promise<void>;
  duplicateEvent: (id: string) => Promise<string | undefined>;
  updateUserRole: (userId: string, newRole: UserRole) => Promise<void>;

  // Registrations & Digital Passes
  registrations: Registration[];
  registrationsLoading: boolean;
  registerForEvent: (data: {
    eventId: string;
    attendeeName: string;
    attendeeEmail: string;
    attendeePhone: string;
    organization?: string;
    department?: string;
    designation?: string;
    dietaryPreference?: string;
    customNotes?: string;
    tshirtSize?: string;
  }) => Promise<Registration>;
  cancelRegistration: (registrationId: string) => Promise<void>;
  checkInAttendee: (
    identifier: string,
    eventId?: string,
    checkedInBy?: string
  ) => Promise<{
    success: boolean;
    status?: 'success' | 'duplicate' | 'cancelled' | 'wrong_event' | 'invalid';
    message: string;
    registration?: Registration;
    duplicate?: boolean;
    checkInTime?: string;
  }>;
  getRegistrationsByUser: (userId: string) => Registration[];
  getRegistrationsByEvent: (eventId: string) => Registration[];

  // Notifications
  notifications: AppNotification[];
  unreadNotificationCount: number;
  markNotificationAsRead: (id: string) => Promise<void>;
  markAllNotificationsAsRead: () => Promise<void>;
  sendAnnouncement: (eventId: string, title: string, message: string) => Promise<void>;

  // Feedbacks
  feedbacks: EventFeedback[];
  submitFeedback: (feedback: Omit<EventFeedback, 'id' | 'createdAt'>) => Promise<void>;
  getEventFeedbacks: (eventId: string) => EventFeedback[];

  // Activity Logs
  activityLogs: ActivityLog[];
  logActivity: (action: string, details: string, eventId?: string) => Promise<void>;

  // UI States
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  toasts: ToastMessage[];
  showToast: (type: 'success' | 'error' | 'info' | 'warning', title: string, message?: string) => void;
  removeToast: (id: string) => void;

  // Wishlist & Saved Events
  wishlist: string[];
  toggleWishlist: (eventId: string) => Promise<void>;
  isWishlisted: (eventId: string) => boolean;

  // Location & Geolocation
  userLocation: UserLocationState;
  requestBrowserLocation: () => Promise<boolean>;
  setManualCity: (cityName: string) => void;
  radiusFilter: number;
  setRadiusFilter: (radiusKm: number) => void;
  getEventDistance: (event: EventItem) => number | null;

  // User Interests & Preferences
  userInterests: EventCategory[];
  updateUserInterests: (interests: EventCategory[]) => Promise<void>;

  // AI Assistant & Recommendations
  isAiAssistantOpen: boolean;
  setIsAiAssistantOpen: (open: boolean) => void;
  aiActiveEvent: EventItem | null;
  setAiActiveEvent: (event: EventItem | null) => void;
  openAiAssistantWithEvent: (event?: EventItem | null) => void;
  getAiRecommendations: () => AiRecommendationResult[];

  // Demo seeding for testing
  seedDemoEvents: () => Promise<void>;
  clearDemoData: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const DEFAULT_GUEST_USER: User = {
  id: 'guest-user',
  name: 'Guest Attendee',
  email: 'attendee@eventease.io',
  role: 'attendee',
  organization: 'EventEase Community',
  avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
  status: 'active',
  createdAt: new Date().toISOString(),
};

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Theme state
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    try {
      return localStorage.getItem('eventease_theme_mode') === 'dark';
    } catch {
      return false;
    }
  });

  // Auth & Connection States
  const [firebaseAuthLoading, setFirebaseAuthLoading] = useState(true);
  const [isFirebaseConnected, setIsFirebaseConnected] = useState(true);
  const [currentUser, setCurrentUser] = useState<User>(DEFAULT_GUEST_USER);
  const [users, setUsers] = useState<User[]>([]);

  // Firestore collections states
  const [events, setEvents] = useState<EventItem[]>([]);
  const [eventsLoading, setEventsLoading] = useState(true);

  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [registrationsLoading, setRegistrationsLoading] = useState(true);

  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [feedbacks, setFeedbacks] = useState<EventFeedback[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);

  // Toast State
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Wishlist & Saved Events State (persisted to localStorage)
  const [wishlist, setWishlist] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem('eventease_wishlist');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const toggleWishlist = async (eventId: string) => {
    const isAlready = wishlist.includes(eventId);
    const updated = isAlready
      ? wishlist.filter((id) => id !== eventId)
      : [...wishlist, eventId];

    setWishlist(updated);
    try {
      localStorage.setItem('eventease_wishlist', JSON.stringify(updated));
    } catch {}

    const targetEvent = events.find((e) => e.id === eventId);
    const title = targetEvent ? targetEvent.title : 'Event';

    if (isAlready) {
      showToast('info', 'Removed from Wishlist', `"${title}" has been removed from your saved events.`);
    } else {
      showToast('success', 'Saved to Wishlist', `"${title}" has been saved to your wishlist.`);
    }
  };

  const isWishlisted = (eventId: string) => wishlist.includes(eventId);

  // Location & Geolocation state
  const [userLocation, setUserLocationState] = useState<UserLocationState>(() => {
    try {
      const stored = localStorage.getItem('eventease_user_location');
      if (stored) return JSON.parse(stored);
    } catch {}
    return {
      city: 'San Francisco',
      latitude: 37.7749,
      longitude: -122.4194,
      permissionStatus: 'prompt',
      isDetecting: false,
      radiusKm: 25,
    };
  });

  const [radiusFilter, setRadiusFilter] = useState<number>(() => userLocation.radiusKm || 25);

  const requestBrowserLocation = async (): Promise<boolean> => {
    if (!navigator.geolocation) {
      showToast('warning', 'Geolocation Unsupported', 'Your browser does not support automatic location detection. Please select your city.');
      return false;
    }

    setUserLocationState((prev) => ({ ...prev, isDetecting: true }));

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lon = position.coords.longitude;
          const matchedCity = findClosestCity(lat, lon);

          const updated: UserLocationState = {
            city: matchedCity.name,
            latitude: lat,
            longitude: lon,
            permissionStatus: 'granted',
            isDetecting: false,
            radiusKm: radiusFilter,
          };

          setUserLocationState(updated);
          try {
            localStorage.setItem('eventease_user_location', JSON.stringify(updated));
          } catch {}

          showToast('success', 'Location Detected', `Events near ${matchedCity.name} (${matchedCity.region || matchedCity.country}) are now prioritized.`);
          resolve(true);
        },
        (error) => {
          console.warn('Geolocation denied or error:', error.message);
          setUserLocationState((prev) => ({
            ...prev,
            permissionStatus: 'denied',
            isDetecting: false,
          }));
          showToast('info', 'Location Permission', 'Location access was not enabled. You can pick your preferred city anytime.');
          resolve(false);
        },
        { enableHighAccuracy: false, timeout: 8000, maximumAge: 600000 }
      );
    });
  };

  const setManualCity = (cityName: string) => {
    const found = SUPPORTED_CITIES.find(
      (c) => c.name.toLowerCase() === cityName.toLowerCase()
    );
    const updated: UserLocationState = {
      city: cityName,
      latitude: found ? found.latitude : userLocation.latitude,
      longitude: found ? found.longitude : userLocation.longitude,
      permissionStatus: userLocation.permissionStatus,
      isDetecting: false,
      radiusKm: radiusFilter,
    };

    setUserLocationState(updated);
    try {
      localStorage.setItem('eventease_user_location', JSON.stringify(updated));
    } catch {}

    showToast('info', 'Location Updated', `Showing events in and around ${cityName}.`);
  };

  const getEventDistance = (event: EventItem): number | null => {
    if (!userLocation.latitude || !userLocation.longitude) return null;
    if (!event.latitude || !event.longitude) return null;
    return calculateDistanceKm(
      userLocation.latitude,
      userLocation.longitude,
      event.latitude,
      event.longitude
    );
  };

  // User Interests state
  const [userInterests, setUserInterests] = useState<EventCategory[]>(() => {
    try {
      const stored = localStorage.getItem('eventease_user_interests');
      if (stored) return JSON.parse(stored);
    } catch {}
    return ['Technology', 'Workshop', 'Hackathon'];
  });

  const updateUserInterests = async (newInterests: EventCategory[]) => {
    setUserInterests(newInterests);
    try {
      localStorage.setItem('eventease_user_interests', JSON.stringify(newInterests));
    } catch {}

    if (currentUser && currentUser.id !== 'guest-user') {
      try {
        const userDocRef = doc(db, 'users', currentUser.id);
        await updateDoc(userDocRef, { interests: newInterests });
        setCurrentUser((prev) => ({ ...prev, interests: newInterests }));
      } catch (err) {
        console.warn('Failed to sync interests to Firestore:', err);
      }
    }
    showToast('success', 'Interests Saved', 'Recommendations have been tailored to your selected event preferences.');
  };

  // AI Assistant drawer & recommendations
  const [isAiAssistantOpen, setIsAiAssistantOpen] = useState(false);
  const [aiActiveEvent, setAiActiveEvent] = useState<EventItem | null>(null);

  const openAiAssistantWithEvent = (event?: EventItem | null) => {
    setAiActiveEvent(event || null);
    setIsAiAssistantOpen(true);
  };

  const getAiRecommendations = (): AiRecommendationResult[] => {
    return computeSmartRecommendations(
      events,
      userInterests,
      wishlist,
      registrations,
      userLocation.city
    );
  };

  // Toast Helper
  const showToast = (
    type: 'success' | 'error' | 'info' | 'warning',
    title: string,
    message?: string
  ) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    setToasts((prev) => [...prev, { id, type, title, message }]);
    setTimeout(() => {
      removeToast(id);
    }, 4500);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const toggleDarkMode = () => {
    setIsDarkMode((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('eventease_theme_mode', next ? 'dark' : 'light');
      } catch {}
      return next;
    });
  };

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Activity Logger
  const logActivity = async (action: string, details: string, eventId?: string) => {
    const newLog: ActivityLog = {
      id: `act-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      actorName: currentUser.name,
      actorRole: currentUser.role,
      action,
      details,
      eventId,
    };
    try {
      await setDoc(doc(db, 'activityLogs', newLog.id), newLog);
    } catch (e) {
      console.warn('Could not write activity log to Firestore:', e);
      setActivityLogs((prev) => [newLog, ...prev.slice(0, 49)]);
    }
  };

  // 1. Listen for Firebase Auth State Changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseAuthLoading(true);
      if (fbUser) {
        const userEmail = fbUser.email?.toLowerCase() || '';
        const isSuperAdmin = ADMIN_EMAILS.some((adm) => adm.toLowerCase() === userEmail);

        try {
          const userDocRef = doc(db, 'users', fbUser.uid);
          const userSnapshot = await (await import('../firebase')).getDoc(userDocRef);

          if (userSnapshot.exists()) {
            const data = userSnapshot.data() as User;
            // Elevate to admin if authorized email
            if (isSuperAdmin && data.role !== 'admin') {
              data.role = 'admin';
              await updateDoc(userDocRef, { role: 'admin' });
            }
            setCurrentUser(data);
          } else {
            // Create user document in Firestore
            const initialRole: UserRole = isSuperAdmin ? 'admin' : 'attendee';
            const newUserDoc: User = {
              id: fbUser.uid,
              name: fbUser.displayName || userEmail.split('@')[0] || 'User',
              email: userEmail,
              role: initialRole,
              organization: 'EventEase Community',
              avatar:
                fbUser.photoURL ||
                'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
              status: 'active',
              createdAt: new Date().toISOString(),
            };
            await setDoc(userDocRef, newUserDoc);
            setCurrentUser(newUserDoc);
          }
        } catch (err) {
          console.error('Error fetching user profile from Firestore:', err);
          // Fallback user state from fbUser
          setCurrentUser({
            id: fbUser.uid,
            name: fbUser.displayName || fbUser.email?.split('@')[0] || 'User',
            email: fbUser.email || '',
            role: isSuperAdmin ? 'admin' : 'attendee',
            avatar:
              fbUser.photoURL ||
              'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
            status: 'active',
            createdAt: new Date().toISOString(),
          });
        }
      } else {
        // Fallback to guest user
        setCurrentUser(DEFAULT_GUEST_USER);
      }
      setFirebaseAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // 2. Real-Time Firestore Sync: Events
  useEffect(() => {
    setEventsLoading(true);
    const eventsCol = collection(db, 'events');

    const unsubscribe = onSnapshot(
      eventsCol,
      (snapshot) => {
        setIsFirebaseConnected(true);
        if (snapshot.empty) {
          // Fresh database: seed INITIAL_EVENTS so the platform is immediately functional
          setEvents(INITIAL_EVENTS);
          setEventsLoading(false);
          Promise.all(
            INITIAL_EVENTS.map((evt) => setDoc(doc(db, 'events', evt.id), evt))
          ).catch((err) => {
            console.warn('Background event seed to Firestore:', err?.message || err);
          });
          return;
        }

        const list: EventItem[] = [];
        snapshot.forEach((docSnap) => {
          list.push({ id: docSnap.id, ...(docSnap.data() as any) });
        });
        // Sort events by date
        list.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        setEvents(list);
        setEventsLoading(false);
      },
      (error) => {
        console.warn('Firestore events listener in offline fallback:', error?.message || error);
        setIsFirebaseConnected(false);
        setEvents((prev) => (prev.length > 0 ? prev : INITIAL_EVENTS));
        setEventsLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // 3. Real-Time Firestore Sync: Registrations
  useEffect(() => {
    setRegistrationsLoading(true);
    const regsCol = collection(db, 'registrations');

    const unsubscribe = onSnapshot(
      regsCol,
      (snapshot) => {
        setIsFirebaseConnected(true);
        if (snapshot.empty) {
          setRegistrations(INITIAL_REGISTRATIONS);
          setRegistrationsLoading(false);
          Promise.all(
            INITIAL_REGISTRATIONS.map((reg) => setDoc(doc(db, 'registrations', reg.id), reg))
          ).catch((err) => {
            console.warn('Background registration seed to Firestore:', err?.message || err);
          });
          return;
        }

        const list: Registration[] = [];
        snapshot.forEach((docSnap) => {
          list.push({ id: docSnap.id, ...(docSnap.data() as any) });
        });
        list.sort((a, b) => new Date(b.registeredAt).getTime() - new Date(a.registeredAt).getTime());
        setRegistrations(list);
        setRegistrationsLoading(false);
      },
      (error) => {
        console.warn('Firestore registrations in offline fallback:', error?.message || error);
        setIsFirebaseConnected(false);
        setRegistrations((prev) => (prev.length > 0 ? prev : INITIAL_REGISTRATIONS));
        setRegistrationsLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // 4. Real-Time Firestore Sync: Notifications
  useEffect(() => {
    const notifsCol = collection(db, 'notifications');
    const unsubscribe = onSnapshot(
      notifsCol,
      (snapshot) => {
        setIsFirebaseConnected(true);
        if (snapshot.empty) {
          setNotifications(INITIAL_NOTIFICATIONS);
          return;
        }
        const list: AppNotification[] = [];
        snapshot.forEach((docSnap) => {
          list.push({ id: docSnap.id, ...(docSnap.data() as any) });
        });
        list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setNotifications(list);
      },
      (error) => {
        console.warn('Firestore notifications in offline fallback:', error?.message || error);
        setIsFirebaseConnected(false);
        setNotifications((prev) => (prev.length > 0 ? prev : INITIAL_NOTIFICATIONS));
      }
    );

    return () => unsubscribe();
  }, []);

  // 5. Real-Time Firestore Sync: Feedback
  useEffect(() => {
    const feedbackCol = collection(db, 'feedback');
    const unsubscribe = onSnapshot(
      feedbackCol,
      (snapshot) => {
        setIsFirebaseConnected(true);
        if (snapshot.empty) {
          setFeedbacks(INITIAL_FEEDBACK);
          return;
        }
        const list: EventFeedback[] = [];
        snapshot.forEach((docSnap) => {
          list.push({ id: docSnap.id, ...(docSnap.data() as any) });
        });
        list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setFeedbacks(list);
      },
      (error) => {
        console.warn('Firestore feedback in offline fallback:', error?.message || error);
        setIsFirebaseConnected(false);
        setFeedbacks((prev) => (prev.length > 0 ? prev : INITIAL_FEEDBACK));
      }
    );

    return () => unsubscribe();
  }, []);

  // 6. Real-Time Firestore Sync: Activity Logs
  useEffect(() => {
    const logsCol = collection(db, 'activityLogs');
    const unsubscribe = onSnapshot(
      logsCol,
      (snapshot) => {
        setIsFirebaseConnected(true);
        if (snapshot.empty) {
          setActivityLogs(INITIAL_ACTIVITY_LOGS);
          return;
        }
        const list: ActivityLog[] = [];
        snapshot.forEach((docSnap) => {
          list.push({ id: docSnap.id, ...(docSnap.data() as any) });
        });
        list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        setActivityLogs(list.slice(0, 100));
      },
      (error) => {
        console.warn('Firestore activityLogs in offline fallback:', error?.message || error);
        setIsFirebaseConnected(false);
        setActivityLogs((prev) => (prev.length > 0 ? prev : INITIAL_ACTIVITY_LOGS));
      }
    );

    return () => unsubscribe();
  }, []);

  // 7. Real-Time Firestore Sync: Users List (for Admin and directory)
  useEffect(() => {
    const usersCol = collection(db, 'users');
    const unsubscribe = onSnapshot(
      usersCol,
      (snapshot) => {
        setIsFirebaseConnected(true);
        if (snapshot.empty) {
          setUsers(INITIAL_USERS);
          Promise.all(
            INITIAL_USERS.map((usr) => setDoc(doc(db, 'users', usr.id), usr))
          ).catch((err) => {
            console.warn('Background user seed to Firestore:', err?.message || err);
          });
          return;
        }
        const list: User[] = [];
        snapshot.forEach((docSnap) => {
          list.push({ id: docSnap.id, ...(docSnap.data() as any) });
        });
        setUsers(list);
      },
      (error) => {
        console.warn('Firestore users in offline fallback:', error?.message || error);
        setIsFirebaseConnected(false);
        setUsers((prev) => (prev.length > 0 ? prev : INITIAL_USERS));
      }
    );

    return () => unsubscribe();
  }, []);

  // Auth Operations
  const loginWithGoogle = async (): Promise<boolean> => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      showToast('success', 'Signed In', `Welcome back, ${result.user.displayName || 'Attendee'}!`);
      return true;
    } catch (error: any) {
      console.error('Google Sign In Error:', error);
      showToast('error', 'Sign In Failed', error.message || 'Could not sign in with Google');
      return false;
    }
  };

  const loginWithEmail = async (email: string, pass: string): Promise<boolean> => {
    try {
      await signInWithEmailAndPassword(auth, email, pass);
      showToast('success', 'Logged In', `Successfully signed in as ${email}`);
      return true;
    } catch (error: any) {
      console.error('Email Login Error:', error);
      if (error.code === 'auth/operation-not-allowed') {
        showToast(
          'info',
          'Notice',
          'Email/Password provider not enabled in Firebase console. Switched to Google or Demo sign-in.'
        );
      } else if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        showToast('error', 'Authentication Error', 'Invalid email or password.');
      } else {
        showToast('error', 'Login Error', error.message);
      }
      return false;
    }
  };

  const registerWithEmail = async (userData: {
    name: string;
    email: string;
    password?: string;
    phone?: string;
    role: UserRole;
    organization?: string;
  }): Promise<boolean> => {
    const passwordToUse = userData.password || 'EventEasePass2026!';
    try {
      const cred = await createUserWithEmailAndPassword(auth, userData.email, passwordToUse);
      if (userData.name) {
        await updateProfile(cred.user, { displayName: userData.name });
      }

      const isSuperAdmin = ADMIN_EMAILS.some((adm) => adm.toLowerCase() === userData.email.toLowerCase());
      const safeRole = isSuperAdmin ? 'admin' : userData.role === 'admin' ? 'organizer' : userData.role;

      const newUser: User = {
        id: cred.user.uid,
        name: userData.name,
        email: userData.email,
        phone: userData.phone,
        role: safeRole,
        organization: userData.organization || 'General Public',
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
        status: 'active',
        createdAt: new Date().toISOString(),
      };

      await setDoc(doc(db, 'users', cred.user.uid), newUser);
      setCurrentUser(newUser);
      showToast('success', 'Account Created', `Welcome to EventEase, ${newUser.name}!`);
      logActivity('User Registered', `New user registered as ${newUser.role}: ${newUser.name}`);
      return true;
    } catch (error: any) {
      console.error('Registration Error:', error);
      if (error.code === 'auth/operation-not-allowed') {
        // Create local user in Firestore directly
        const localUid = `user-${Date.now().toString(36)}`;
        const newUser: User = {
          id: localUid,
          name: userData.name,
          email: userData.email,
          phone: userData.phone,
          role: userData.role,
          organization: userData.organization || 'General Public',
          avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
          status: 'active',
          createdAt: new Date().toISOString(),
        };
        await setDoc(doc(db, 'users', localUid), newUser);
        setCurrentUser(newUser);
        showToast('success', 'Account Created', `Welcome, ${newUser.name}!`);
        return true;
      }
      showToast('error', 'Registration Error', error.message || 'Could not register account.');
      return false;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setCurrentUser(DEFAULT_GUEST_USER);
      showToast('info', 'Logged Out', 'You have been safely signed out.');
    } catch (error: any) {
      showToast('error', 'Sign Out Error', error.message);
    }
  };

  const resetPassword = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
      showToast('success', 'Password Reset Sent', `Check ${email} for reset instructions.`);
    } catch (error: any) {
      showToast('error', 'Reset Error', error.message);
    }
  };

  // Quick Persona Role Switcher for preview & testing
  const switchRole = (newRole: UserRole) => {
    const updated: User = {
      ...currentUser,
      role: newRole,
    };
    setCurrentUser(updated);
    showToast('info', `Switched Persona to ${newRole.toUpperCase()}`, `Now viewing as ${newRole}`);
  };

  const updateUserProfile = async (updates: Partial<User>) => {
    try {
      const updatedUser = { ...currentUser, ...updates, updatedAt: new Date().toISOString() };
      setCurrentUser(updatedUser);

      if (currentUser.id && currentUser.id !== 'guest-user') {
        await updateDoc(doc(db, 'users', currentUser.id), {
          ...updates,
          updatedAt: new Date().toISOString(),
        });
      }
      showToast('success', 'Profile Updated', 'Your profile details have been saved.');
      logActivity('Profile Updated', `Updated profile information for ${currentUser.name}`);
    } catch (error: any) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${currentUser.id}`);
    }
  };

  const toggleUserStatus = async (userId: string) => {
    const target = users.find((u) => u.id === userId);
    if (!target) return;
    const newStatus = target.status === 'active' ? 'inactive' : 'active';
    try {
      await updateDoc(doc(db, 'users', userId), { status: newStatus });
      showToast('info', 'User Status Changed', `Set to ${newStatus}`);
      logActivity('User Status Changed', `Changed status of ${target.name} to ${newStatus}`);
    } catch (e: any) {
      handleFirestoreError(e, OperationType.UPDATE, `users/${userId}`);
    }
  };

  const changeUserRole = async (userId: string, newRole: UserRole) => {
    try {
      await updateDoc(doc(db, 'users', userId), { role: newRole });
      showToast('success', 'Role Updated', `User role changed to ${newRole}`);
      logActivity('Role Changed', `Changed role of user ${userId} to ${newRole}`);
    } catch (e: any) {
      handleFirestoreError(e, OperationType.UPDATE, `users/${userId}`);
    }
  };

  // Events CRUD
  const getEventById = (id: string): EventItem | undefined => {
    return events.find((e) => e.id === id);
  };

  const addEvent = async (
    eventData: Omit<EventItem, 'id' | 'registeredCount' | 'checkedInCount' | 'createdAt'>
  ): Promise<string> => {
    const eventId = `evt-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
    const newEvent: EventItem = {
      ...eventData,
      id: eventId,
      registeredCount: 0,
      checkedInCount: 0,
      createdAt: new Date().toISOString(),
    };

    try {
      await setDoc(doc(db, 'events', eventId), newEvent);
      showToast('success', 'Event Published', `"${newEvent.title}" is now live in the directory!`);
      logActivity('Event Created', `Created event: ${newEvent.title}`, eventId);
      return eventId;
    } catch (error: any) {
      handleFirestoreError(error, OperationType.CREATE, `events/${eventId}`);
    }
  };

  const updateEvent = async (id: string, updates: Partial<EventItem>) => {
    try {
      const docRef = doc(db, 'events', id);
      await updateDoc(docRef, {
        ...updates,
        updatedAt: new Date().toISOString(),
      });
      showToast('success', 'Event Updated', 'Changes saved successfully.');
      logActivity('Event Updated', `Updated event details for ${id}`, id);
    } catch (error: any) {
      handleFirestoreError(error, OperationType.UPDATE, `events/${id}`);
    }
  };

  const deleteEvent = async (id: string) => {
    const target = events.find((e) => e.id === id);
    try {
      await deleteDoc(doc(db, 'events', id));
      showToast('info', 'Event Removed', `"${target?.title || 'Event'}" has been deleted.`);
      logActivity('Event Deleted', `Deleted event ${target?.title || id}`, id);
    } catch (error: any) {
      handleFirestoreError(error, OperationType.DELETE, `events/${id}`);
    }
  };

  const duplicateEvent = async (id: string): Promise<string | undefined> => {
    const target = events.find((e) => e.id === id);
    if (!target) return undefined;

    const newId = `evt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const duplicated: EventItem = {
      ...target,
      id: newId,
      title: `${target.title} (Copy)`,
      registeredCount: 0,
      checkedInCount: 0,
      createdAt: new Date().toISOString(),
      isDemo: false,
    };

    try {
      await setDoc(doc(db, 'events', newId), duplicated);
      showToast('success', 'Event Duplicated', `Created a copy of "${target.title}".`);
      logActivity('Event Duplicated', `Duplicated "${target.title}"`, newId);
      return newId;
    } catch (error: any) {
      handleFirestoreError(error, OperationType.CREATE, `events/${newId}`);
      return undefined;
    }
  };

  // Registrations & Digital Pass issuance using Firestore atomic transaction
  const registerForEvent = async (data: {
    eventId: string;
    attendeeName: string;
    attendeeEmail: string;
    attendeePhone: string;
    organization?: string;
    department?: string;
    designation?: string;
    dietaryPreference?: string;
    customNotes?: string;
    tshirtSize?: string;
  }): Promise<Registration> => {
    if (!currentUser || currentUser.id === 'guest-user') {
      throw new Error('You must be signed in to register for an event.');
    }

    // Check duplicate in client state first
    const existing = registrations.find(
      (r) =>
        r.eventId === data.eventId &&
        (r.userId === currentUser.id || r.attendeeEmail.toLowerCase() === data.attendeeEmail.toLowerCase()) &&
        r.status !== 'CANCELLED' &&
        r.ticketStatus !== 'Cancelled'
    );
    if (existing) {
      throw new Error(`You have already registered for this event with ticket ID ${existing.id}.`);
    }

    const regId = generateRegistrationId();
    const ticketId = generateTicketId();
    // Privacy guarantee: QR code payload strictly contains ONLY the unique ticketId
    const qrUrl = await generateQrCodeUrl(ticketId);

    let newRegRecord: Registration | null = null;

    try {
      await runTransaction(db, async (transaction) => {
        const eventRef = doc(db, 'events', data.eventId);
        const eventDoc = await transaction.get(eventRef);

        if (!eventDoc.exists()) {
          throw new Error('Event not found in the database.');
        }

        const eventData = eventDoc.data() as EventItem;

        if (eventData.status === 'Cancelled') {
          throw new Error('This event has been cancelled.');
        }
        if (eventData.status === 'Completed') {
          throw new Error('This event has already concluded.');
        }
        if (eventData.status === 'Registration Closed') {
          throw new Error('Registration for this event is closed.');
        }

        if (eventData.registrationDeadline) {
          const todayStr = new Date().toISOString().split('T')[0];
          if (todayStr > eventData.registrationDeadline) {
            throw new Error('The registration deadline for this event has passed.');
          }
        }

        // Atomic check of remaining capacity
        const currentCount = eventData.registeredCount || 0;
        if (currentCount >= eventData.maxCapacity) {
          throw new Error('Sorry, this event has reached maximum capacity!');
        }

        const newCount = currentCount + 1;
        let newStatus: EventStatus = eventData.status;
        if (newCount >= eventData.maxCapacity) {
          newStatus = 'Registration Closed';
        } else if (newCount >= eventData.maxCapacity * 0.9) {
          newStatus = 'Almost Full';
        }

        const paymentStatus =
          eventData.ticketType === 'Free' || !eventData.price ? 'NOT_REQUIRED' : 'PAID';

        const newReg: Registration = {
          id: regId,
          ticketId,
          eventId: eventData.id,
          eventTitle: eventData.title,
          eventDate: eventData.date,
          eventTime: `${eventData.startTime} - ${eventData.endTime}`,
          eventVenue: eventData.venue,
          eventBanner: eventData.bannerImage,
          userId: currentUser.id,
          attendeeId: currentUser.id,
          attendeeName: data.attendeeName,
          attendeeEmail: data.attendeeEmail,
          attendeePhone: data.attendeePhone,
          organization: data.organization || '',
          department: data.department || '',
          designation: data.designation || '',
          dietaryPreference: data.dietaryPreference || 'None',
          customNotes: data.customNotes || '',
          tshirtSize: data.tshirtSize || '',
          customResponses: {
            organization: data.organization || '',
            department: data.department || '',
            designation: data.designation || '',
            dietaryPreference: data.dietaryPreference || 'None',
            tshirtSize: data.tshirtSize || '',
            customNotes: data.customNotes || '',
          },
          qrCodeDataUrl: qrUrl,
          status: 'CONFIRMED',
          ticketStatus: 'Confirmed',
          paymentStatus,
          registeredAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          ticketPrice: eventData.price || 0,
          isDemo: eventData.isDemo || false,
        };

        // Write registration document atomically
        transaction.set(doc(db, 'registrations', regId), newReg);

        // Update event registration count atomically
        transaction.update(eventRef, {
          registeredCount: newCount,
          status: newStatus,
          updatedAt: new Date().toISOString(),
        });

        newRegRecord = newReg;
      });

      if (!newRegRecord) {
        throw new Error('Registration could not be completed.');
      }

      // Create Notification in Firestore
      const notifId = `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      const targetEvent = events.find((e) => e.id === data.eventId);
      const notif: AppNotification = {
        id: notifId,
        userId: currentUser.id,
        title: `Registration Confirmed: ${targetEvent?.title || 'Event'}`,
        message: `Your registration (${regId}) is confirmed! Ticket ID: ${ticketId}. View and download your digital pass anytime.`,
        type: 'registration',
        read: false,
        createdAt: new Date().toISOString(),
        eventId: data.eventId,
      };
      await setDoc(doc(db, 'notifications', notifId), notif);

      logActivity(
        'Event Registration',
        `${data.attendeeName} registered for "${targetEvent?.title || data.eventId}" (Pass #${regId})`,
        data.eventId
      );

      return newRegRecord;
    } catch (error: any) {
      console.error('Registration failed:', error);
      throw error;
    }
  };

  const cancelRegistration = async (registrationId: string) => {
    const reg = registrations.find((r) => r.id === registrationId);
    if (!reg) throw new Error('Registration record not found.');

    const evt = events.find((e) => e.id === reg.eventId);
    if (evt) {
      const todayStr = new Date().toISOString().split('T')[0];
      if (evt.date < todayStr) {
        throw new Error('Cannot cancel registration for an event that has already occurred.');
      }
    }

    try {
      // Atomic cancellation using transaction
      await runTransaction(db, async (transaction) => {
        const regRef = doc(db, 'registrations', registrationId);
        const regDoc = await transaction.get(regRef);
        if (!regDoc.exists()) {
          throw new Error('Registration document not found in Firestore.');
        }

        const eventRef = doc(db, 'events', reg.eventId);
        const eventDoc = await transaction.get(eventRef);

        transaction.update(regRef, {
          status: 'CANCELLED',
          ticketStatus: 'Cancelled',
          updatedAt: new Date().toISOString(),
        });

        if (eventDoc.exists()) {
          const eventData = eventDoc.data() as EventItem;
          const newCount = Math.max(0, (eventData.registeredCount || 1) - 1);
          let newStatus = eventData.status;
          if (newCount < eventData.maxCapacity && eventData.status === 'Registration Closed') {
            newStatus = 'Registration Open';
          }
          transaction.update(eventRef, {
            registeredCount: newCount,
            status: newStatus,
            updatedAt: new Date().toISOString(),
          });
        }
      });

      // Add cancellation notification
      const notifId = `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      await setDoc(doc(db, 'notifications', notifId), {
        id: notifId,
        userId: reg.userId,
        title: `Ticket Cancelled: ${reg.eventTitle}`,
        message: `Your registration (${reg.id}) has been cancelled. Available seat has been restored.`,
        type: 'update',
        read: false,
        createdAt: new Date().toISOString(),
        eventId: reg.eventId,
      });

      showToast('info', 'Registration Cancelled', `Ticket ${reg.id} has been cancelled.`);
      logActivity('Registration Cancelled', `Cancelled registration ${reg.id} for ${reg.eventTitle}`, reg.eventId);
    } catch (error: any) {
      handleFirestoreError(error, OperationType.UPDATE, `registrations/${registrationId}`);
      throw error;
    }
  };

  // QR Check-in System with full gate validation
  const checkInAttendee = async (
    identifier: string,
    eventId?: string,
    checkedInBy: string = currentUser.name
  ) => {
    const cleanId = identifier.trim();
    let targetId = cleanId;

    // Handle legacy format if encountered
    if (cleanId.startsWith('EVENT_TICKET:')) {
      const parts = cleanId.replace('EVENT_TICKET:', '').split('|');
      targetId = parts[3] || parts[0];
    }

    // Locate registration by ticketId or registration id
    const reg = registrations.find(
      (r) =>
        r.ticketId?.toLowerCase() === targetId.toLowerCase() ||
        r.id.toLowerCase() === targetId.toLowerCase() ||
        r.ticketId === targetId ||
        r.id === targetId
    );

    if (!reg) {
      return {
        success: false,
        status: 'invalid' as const,
        message: `Invalid Ticket. No registration found matching code "${targetId}".`,
      };
    }

    // Validate event match if gate is filtered to a specific event
    if (eventId && reg.eventId !== eventId) {
      const assignedEvent = events.find((e) => e.id === reg.eventId);
      return {
        success: false,
        status: 'wrong_event' as const,
        message: `Wrong Event. This ticket is registered for "${assignedEvent?.title || reg.eventTitle}".`,
        registration: reg,
      };
    }

    if (reg.status === 'CANCELLED' || reg.ticketStatus === 'Cancelled') {
      return {
        success: false,
        status: 'cancelled' as const,
        message: `Cancelled Ticket. Registration #${reg.id} was cancelled by attendee. Gate entry denied.`,
        registration: reg,
      };
    }

    if (reg.status === 'CHECKED_IN' || reg.ticketStatus === 'Checked In') {
      return {
        success: false,
        duplicate: true,
        status: 'duplicate' as const,
        message: `Already Checked In at ${new Date(reg.checkedInAt || '').toLocaleTimeString()} by ${reg.checkedInBy || 'Staff'}.`,
        registration: reg,
      };
    }

    const checkInTime = new Date().toISOString();
    const checkInDocId = `chk_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    try {
      // 1. Update registration in Firestore
      await updateDoc(doc(db, 'registrations', reg.id), {
        status: 'CHECKED_IN',
        ticketStatus: 'Checked In',
        checkedInAt: checkInTime,
        checkedInBy,
        updatedAt: checkInTime,
      });

      // 2. Create audit record in checkIns collection
      await setDoc(doc(db, 'checkIns', checkInDocId), {
        id: checkInDocId,
        ticketId: reg.ticketId || reg.id,
        registrationId: reg.id,
        eventId: reg.eventId,
        attendeeId: reg.attendeeId || reg.userId,
        checkedInBy,
        checkedInAt: checkInTime,
      });

      // 3. Increment event checkedInCount
      const evt = events.find((e) => e.id === reg.eventId);
      if (evt) {
        await updateDoc(doc(db, 'events', evt.id), {
          checkedInCount: (evt.checkedInCount || 0) + 1,
        });
      }

      // 4. Send attendee entrance confirmation notification
      const notifId = `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      await setDoc(doc(db, 'notifications', notifId), {
        id: notifId,
        userId: reg.attendeeId || reg.userId,
        title: `Gate Verified: ${reg.eventTitle}`,
        message: `Your badge #${reg.ticketId} has been successfully scanned at entrance. Welcome!`,
        type: 'checkin',
        read: false,
        createdAt: checkInTime,
        eventId: reg.eventId,
      });

      logActivity(
        'Attendee Checked In',
        `${reg.attendeeName} checked in for "${reg.eventTitle}" (Verified by: ${checkedInBy})`,
        reg.eventId
      );

      const updatedReg: Registration = {
        ...reg,
        status: 'CHECKED_IN',
        ticketStatus: 'Checked In',
        checkedInAt: checkInTime,
        checkedInBy,
      };

      return {
        success: true,
        status: 'success' as const,
        message: `Check-in Successful! Welcome to ${reg.eventTitle}, ${reg.attendeeName}.`,
        registration: updatedReg,
        checkInTime,
      };
    } catch (error: any) {
      handleFirestoreError(error, OperationType.UPDATE, `registrations/${reg.id}`);
      throw error;
    }
  };

  const getRegistrationsByUser = (userId: string) => {
    return registrations.filter((r) => r.userId === userId);
  };

  const getRegistrationsByEvent = (eventId: string) => {
    return registrations.filter((r) => r.eventId === eventId);
  };

  // Notifications
  const unreadNotificationCount = notifications.filter(
    (n) => n.userId === currentUser.id && !n.read
  ).length;

  const markNotificationAsRead = async (id: string) => {
    try {
      await updateDoc(doc(db, 'notifications', id), { read: true });
    } catch (e: any) {
      handleFirestoreError(e, OperationType.UPDATE, `notifications/${id}`);
    }
  };

  const markAllNotificationsAsRead = async () => {
    const unread = notifications.filter((n) => n.userId === currentUser.id && !n.read);
    try {
      await Promise.all(
        unread.map((n) => updateDoc(doc(db, 'notifications', n.id), { read: true }))
      );
      showToast('info', 'Notifications', 'All notifications marked as read.');
    } catch (e: any) {
      console.error('Error marking all read:', e);
    }
  };

  const sendAnnouncement = async (eventId: string, title: string, message: string) => {
    const event = events.find((e) => e.id === eventId);
    if (!event) return;

    const eventRegs = registrations.filter(
      (r) => r.eventId === eventId && r.ticketStatus !== 'Cancelled'
    );

    try {
      await Promise.all(
        eventRegs.map((reg) => {
          const notifId = `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
          return setDoc(doc(db, 'notifications', notifId), {
            id: notifId,
            userId: reg.userId,
            title: `Broadcast: ${title}`,
            message: `${event.title}: ${message}`,
            type: 'announcement',
            read: false,
            createdAt: new Date().toISOString(),
            eventId,
          });
        })
      );

      showToast('success', 'Announcement Sent', `Broadcasted to ${eventRegs.length} registered attendees.`);
      logActivity('Announcement Broadcast', `Broadcasted announcement for "${event.title}": ${title}`, eventId);
    } catch (error: any) {
      handleFirestoreError(error, OperationType.CREATE, 'notifications');
    }
  };

  // Feedbacks
  const submitFeedback = async (data: Omit<EventFeedback, 'id' | 'createdAt'>) => {
    const feedbackId = `fb-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const newFeedback: EventFeedback = {
      ...data,
      id: feedbackId,
      createdAt: new Date().toISOString(),
    };

    try {
      await setDoc(doc(db, 'feedback', feedbackId), newFeedback);
      showToast('success', 'Review Submitted', 'Thank you for rating this event!');
      logActivity('Feedback Submitted', `Rated event ${data.rating}/5 stars`, data.eventId);
    } catch (error: any) {
      handleFirestoreError(error, OperationType.CREATE, `feedback/${feedbackId}`);
    }
  };

  const getEventFeedbacks = (eventId: string) => {
    return feedbacks.filter((f) => f.eventId === eventId);
  };

  // Separate Demo Seeding Mechanism (Clearly designated for Admin / Database initialization)
  const seedDemoEvents = async () => {
    showToast('info', 'Seeding Demo Events...', 'Populating Firestore with curated sample gatherings.');
    try {
      for (const evt of INITIAL_EVENTS.slice(0, 4)) {
        const demoEvent: EventItem = {
          ...evt,
          isDemo: true,
          registeredCount: 0,
          checkedInCount: 0,
          createdAt: new Date().toISOString(),
        };
        await setDoc(doc(db, 'events', demoEvent.id), demoEvent);
      }
      showToast('success', 'Demo Events Seeded', 'Sample events added to Firestore database.');
      logActivity('Demo Events Seeded', 'Admin populated initial sample events');
    } catch (error: any) {
      handleFirestoreError(error, OperationType.CREATE, 'events');
    }
  };

  const clearDemoData = async () => {
    showToast('info', 'Clearing Demo Data...', 'Removing items marked as demo.');
    try {
      const demoEvents = events.filter((e) => e.isDemo);
      for (const evt of demoEvents) {
        await deleteDoc(doc(db, 'events', evt.id));
      }
      showToast('success', 'Cleared', 'Sample demo data removed from Firestore.');
    } catch (error: any) {
      console.error('Error clearing demo data:', error);
    }
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        users,
        role: currentUser.role,
        firebaseAuthLoading,
        isFirebaseConnected,
        loginWithGoogle,
        loginWithEmail,
        registerWithEmail,
        logout,
        resetPassword,
        switchRole,
        updateUserProfile,
        toggleUserStatus,
        changeUserRole,
        events,
        eventsLoading,
        getEventById,
        addEvent,
        updateEvent,
        deleteEvent,
        duplicateEvent,
        updateUserRole: changeUserRole,
        registrations,
        registrationsLoading,
        registerForEvent,
        cancelRegistration,
        checkInAttendee,
        getRegistrationsByUser,
        getRegistrationsByEvent,
        notifications,
        unreadNotificationCount,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        sendAnnouncement,
        feedbacks,
        submitFeedback,
        getEventFeedbacks,
        activityLogs,
        logActivity,
        isDarkMode,
        toggleDarkMode,
        toasts,
        showToast,
        removeToast,
        wishlist,
        toggleWishlist,
        isWishlisted,
        userLocation,
        requestBrowserLocation,
        setManualCity,
        radiusFilter,
        setRadiusFilter,
        getEventDistance,
        userInterests,
        updateUserInterests,
        isAiAssistantOpen,
        setIsAiAssistantOpen,
        aiActiveEvent,
        setAiActiveEvent,
        openAiAssistantWithEvent,
        getAiRecommendations,
        seedDemoEvents,
        clearDemoData,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
