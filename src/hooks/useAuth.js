// hooks/useAuth.js
// Authentication state management

import { useEffect, useState } from "react";
import { supabase, getCurrentUser, getUserProfile } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export function useAuth() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Get initial session
    const initAuth = async () => {
      try {
        const currentUser = await getCurrentUser();
        setUser(currentUser);

        if (currentUser) {
          const userProfile = await getUserProfile(currentUser.id);
          setProfile(userProfile);
        }
      } catch (error) {
        console.error("Auth init error:", error);
      } finally {
        setLoading(false);
      }
    };

    initAuth();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      const currentUser = session?.user || null;
      setUser(currentUser);

      if (currentUser) {
        const userProfile = await getUserProfile(currentUser.id);
        setProfile(userProfile);
      } else {
        setProfile(null);
      }

      setLoading(false);
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const redirectIfNeeded = () => {
    if (!loading) {
      if (!user) {
        router.push("/auth/signin");
      } else if (profile && !profile.onboarding_completed) {
        router.push("/onboarding");
      }
    }
  };

  return {
    user,
    profile,
    loading,
    isAuthenticated: !!user,
    onboardingComplete: profile?.onboarding_completed || false,
    redirectIfNeeded,
  };
}

export default useAuth;
