import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { UserProfile } from '@/hooks/useUserProfiles';

interface ProfileContextType {
  selectedProfile: UserProfile | null;
  setSelectedProfile: (profile: UserProfile | null) => void;
  clearProfile: () => void;
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

const SELECTED_PROFILE_KEY = 'rezeflix-selected-profile';

export function ProfileProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [selectedProfile, setSelectedProfileState] = useState<UserProfile | null>(null);

  // Load profile from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(SELECTED_PROFILE_KEY);
    if (stored) {
      try {
        const profile = JSON.parse(stored);
        // Verify the profile belongs to current user
        if (profile.user_id === user?.id) {
          setSelectedProfileState(profile);
        } else {
          localStorage.removeItem(SELECTED_PROFILE_KEY);
        }
      } catch {
        localStorage.removeItem(SELECTED_PROFILE_KEY);
      }
    }
  }, [user?.id]);

  // Clear profile when user logs out
  useEffect(() => {
    if (!user) {
      setSelectedProfileState(null);
      localStorage.removeItem(SELECTED_PROFILE_KEY);
    }
  }, [user]);

  const setSelectedProfile = (profile: UserProfile | null) => {
    setSelectedProfileState(profile);
    if (profile) {
      localStorage.setItem(SELECTED_PROFILE_KEY, JSON.stringify(profile));
    } else {
      localStorage.removeItem(SELECTED_PROFILE_KEY);
    }
  };

  const clearProfile = () => {
    setSelectedProfileState(null);
    localStorage.removeItem(SELECTED_PROFILE_KEY);
  };

  return (
    <ProfileContext.Provider value={{ selectedProfile, setSelectedProfile, clearProfile }}>
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfileContext() {
  const context = useContext(ProfileContext);
  if (context === undefined) {
    throw new Error('useProfileContext must be used within a ProfileProvider');
  }
  return context;
}
