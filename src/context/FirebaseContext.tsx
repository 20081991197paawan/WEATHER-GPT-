import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import {
  auth,
  testConnection,
  signInWithGoogle,
  signOutUser,
  subscribeSavedLocations,
  subscribeUserPreferences,
  addSavedLocation,
  removeSavedLocation,
  saveUserPreferences,
  persistChatMessage,
} from '../lib/firebase';
import { SavedLocationItem, UserPreferencesItem, LocationData } from '../types';

interface FirebaseContextType {
  currentUser: User | null;
  isAuthLoading: boolean;
  savedLocations: SavedLocationItem[];
  userPreferences: UserPreferencesItem | null;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  saveLocation: (location: LocationData) => Promise<void>;
  deleteLocation: (locationId: string) => Promise<void>;
  updatePreferences: (prefs: Partial<UserPreferencesItem>) => Promise<void>;
  saveChat: (sender: 'user' | 'assistant', text: string) => Promise<void>;
  isLocationSaved: (lat: number, lon: number) => boolean;
}

const FirebaseContext = createContext<FirebaseContextType | undefined>(undefined);

export const FirebaseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(true);
  const [savedLocations, setSavedLocations] = useState<SavedLocationItem[]>([]);
  const [userPreferences, setUserPreferences] = useState<UserPreferencesItem | null>(null);

  // 1. Initial Connection Validation
  useEffect(() => {
    testConnection();
  }, []);

  // 2. Auth State Observer
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setIsAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // 3. Sync Firestore Data when Authenticated
  useEffect(() => {
    if (!currentUser) {
      setSavedLocations([]);
      setUserPreferences(null);
      return;
    }

    // Subscribe to Saved Locations
    const unsubLocations = subscribeSavedLocations(currentUser.uid, (locations) => {
      setSavedLocations(locations);
    });

    // Subscribe to User Preferences
    const unsubPrefs = subscribeUserPreferences(currentUser.uid, (prefs) => {
      setUserPreferences(prefs);
    });

    return () => {
      unsubLocations();
      unsubPrefs();
    };
  }, [currentUser]);

  const handleSignIn = async () => {
    await signInWithGoogle();
  };

  const handleSignOut = async () => {
    await signOutUser();
  };

  const handleSaveLocation = async (loc: LocationData) => {
    if (!currentUser) {
      await handleSignIn();
      return;
    }
    await addSavedLocation(currentUser.uid, {
      name: loc.name,
      region: loc.region,
      country: loc.country,
      lat: loc.latitude,
      lon: loc.longitude,
    });
  };

  const handleDeleteLocation = async (locationId: string) => {
    if (!currentUser) return;
    await removeSavedLocation(currentUser.uid, locationId);
  };

  const handleUpdatePreferences = async (prefs: Partial<UserPreferencesItem>) => {
    if (!currentUser) return;
    await saveUserPreferences(currentUser.uid, prefs);
  };

  const handleSaveChat = async (sender: 'user' | 'assistant', text: string) => {
    if (!currentUser) return;
    await persistChatMessage(currentUser.uid, { sender, text });
  };

  const isLocationSaved = (lat: number, lon: number): boolean => {
    return savedLocations.some(
      (loc) => Math.abs(loc.lat - lat) < 0.05 && Math.abs(loc.lon - lon) < 0.05
    );
  };

  return (
    <FirebaseContext.Provider
      value={{
        currentUser,
        isAuthLoading,
        savedLocations,
        userPreferences,
        signIn: handleSignIn,
        signOut: handleSignOut,
        saveLocation: handleSaveLocation,
        deleteLocation: handleDeleteLocation,
        updatePreferences: handleUpdatePreferences,
        saveChat: handleSaveChat,
        isLocationSaved,
      }}
    >
      {children}
    </FirebaseContext.Provider>
  );
};

export const useFirebase = () => {
  const context = useContext(FirebaseContext);
  if (!context) {
    throw new Error('useFirebase must be used within a FirebaseProvider');
  }
  return context;
};
