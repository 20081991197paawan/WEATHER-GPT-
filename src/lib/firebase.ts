import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDocFromServer,
  collection,
  onSnapshot,
  setDoc,
  deleteDoc,
  serverTimestamp,
  query,
  limit,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { SavedLocationItem, UserPreferencesItem } from '../types';

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// Initialize Firestore with custom database ID (Mandatory)
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

// Initialize Authentication
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

// Operation types for security error reporting
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

// Mandatory Firestore Error Handler per Firebase Integration Skill
export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Mandatory startup connection test
export async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    }
  }
}

// Authentication Helpers
export async function signInWithGoogle(): Promise<User | null> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error('Sign in failed:', error);
    return null;
  }
}

export async function signOutUser(): Promise<void> {
  try {
    await signOut(auth);
  } catch (error) {
    console.error('Sign out failed:', error);
  }
}

// Subscribed Saved Locations
export function subscribeSavedLocations(
  userId: string,
  onUpdate: (locations: SavedLocationItem[]) => void
) {
  const path = `users/${userId}/savedLocations`;
  const colRef = collection(db, 'users', userId, 'savedLocations');

  return onSnapshot(
    colRef,
    (snapshot) => {
      const items: SavedLocationItem[] = [];
      snapshot.forEach((docSnap) => {
        items.push({
          id: docSnap.id,
          ...(docSnap.data() as Omit<SavedLocationItem, 'id'>),
        });
      });
      onUpdate(items);
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    }
  );
}

// Add a saved favorite location
export async function addSavedLocation(
  userId: string,
  location: { name: string; region?: string; country?: string; lat: number; lon: number }
) {
  // Generate safe sanitized ID
  const sanitizedId = location.name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '_')
    .slice(0, 40) + '_' + Date.now();
  const path = `users/${userId}/savedLocations/${sanitizedId}`;

  try {
    await setDoc(doc(db, 'users', userId, 'savedLocations', sanitizedId), {
      name: location.name.slice(0, 100),
      region: (location.region || '').slice(0, 100),
      country: (location.country || '').slice(0, 100),
      lat: Number(location.lat),
      lon: Number(location.lon),
      userId,
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

// Remove a saved location
export async function removeSavedLocation(userId: string, locationId: string) {
  const path = `users/${userId}/savedLocations/${locationId}`;
  try {
    await deleteDoc(doc(db, 'users', userId, 'savedLocations', locationId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// Save User Preferences
export async function saveUserPreferences(
  userId: string,
  prefs: Partial<UserPreferencesItem>
) {
  const path = `users/${userId}/preferences/settings`;
  try {
    await setDoc(
      doc(db, 'users', userId, 'preferences', 'settings'),
      {
        userId,
        temperatureUnit: prefs.temperatureUnit || 'celsius',
        ...(prefs.voiceEnabled !== undefined ? { voiceEnabled: prefs.voiceEnabled } : {}),
        ...(prefs.visualMode ? { visualMode: prefs.visualMode } : {}),
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// Subscribe User Preferences
export function subscribeUserPreferences(
  userId: string,
  onUpdate: (prefs: UserPreferencesItem | null) => void
) {
  const path = `users/${userId}/preferences/settings`;
  const docRef = doc(db, 'users', userId, 'preferences', 'settings');

  return onSnapshot(
    docRef,
    (docSnap) => {
      if (docSnap.exists()) {
        onUpdate(docSnap.data() as UserPreferencesItem);
      } else {
        onUpdate(null);
      }
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    }
  );
}

// Record Chat Message into Firestore
export async function persistChatMessage(
  userId: string,
  message: { sender: 'user' | 'assistant'; text: string }
) {
  const msgId = `msg_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  const path = `users/${userId}/chatHistory/${msgId}`;

  try {
    await setDoc(doc(db, 'users', userId, 'chatHistory', msgId), {
      userId,
      sender: message.sender,
      text: message.text.slice(0, 2000),
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}
