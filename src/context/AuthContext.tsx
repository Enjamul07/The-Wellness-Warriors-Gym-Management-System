import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Profile } from '../types';

interface AuthContextType {
  user: Profile | null;
  loading: boolean;
  isDemo: boolean;
  supabaseConfigured: boolean;
  loginWithSupabase: (email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  loginDemo: (username: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DEMO_USER: Profile = {
  id: 'demo-admin-01',
  email: 'admin@wellnesswarriors.gym',
  full_name: 'Gym Administrator',
  role: 'admin',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<Profile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isDemo, setIsDemo] = useState<boolean>(false);
  const [supabaseConfigured, setSupabaseConfigured] = useState<boolean>(isSupabaseConfigured());

  useEffect(() => {
    // Check if demo session is stored
    const storedDemo = localStorage.getItem('wwg_demo_session');
    if (storedDemo === 'true') {
      setUser(DEMO_USER);
      setIsDemo(true);
      setLoading(false);
      return;
    }

    if (isSupabaseConfigured() && supabase) {
      // Check real Supabase Auth session
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) {
          setUser({
            id: session.user.id,
            email: session.user.email || 'admin@wellnesswarriors.gym',
            full_name: session.user.user_metadata?.full_name || 'Gym Administrator',
            role: 'admin',
            created_at: session.user.created_at,
            updated_at: session.user.created_at
          });
          setIsDemo(false);
        }
        setLoading(false);
      });

      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        if (session?.user) {
          setUser({
            id: session.user.id,
            email: session.user.email || 'admin@wellnesswarriors.gym',
            full_name: session.user.user_metadata?.full_name || 'Gym Administrator',
            role: 'admin',
            created_at: session.user.created_at,
            updated_at: session.user.created_at
          });
          setIsDemo(false);
        } else if (!localStorage.getItem('wwg_demo_session')) {
          setUser(null);
        }
      });

      return () => {
        subscription.unsubscribe();
      };
    } else {
      setLoading(false);
    }
  }, []);

  const loginWithSupabase = async (email: string, pass: string): Promise<{ success: boolean; error?: string }> => {
    if (!isSupabaseConfigured() || !supabase) {
      return {
        success: false,
        error: 'Supabase is not configured. Please configure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY, or use Demo Login.'
      };
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password: pass
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (data.user) {
        setUser({
          id: data.user.id,
          email: data.user.email || email,
          full_name: data.user.user_metadata?.full_name || 'Gym Administrator',
          role: 'admin',
          created_at: data.user.created_at,
          updated_at: data.user.created_at
        });
        setIsDemo(false);
        localStorage.removeItem('wwg_demo_session');
        return { success: true };
      }

      return { success: false, error: 'User not found' };
    } catch (err: any) {
      return { success: false, error: err.message || 'Authentication failed' };
    }
  };

  const loginDemo = async (username: string, pass: string): Promise<{ success: boolean; error?: string }> => {
    // Validate demo credentials (admin / demo123 or admin@wellnesswarriors.gym)
    const validUser = username === 'admin' || username === 'admin@wellnesswarriors.gym';
    const validPass = pass === 'demo123';

    if (validUser && validPass) {
      setUser(DEMO_USER);
      setIsDemo(true);
      localStorage.setItem('wwg_demo_session', 'true');
      return { success: true };
    }

    return {
      success: false,
      error: 'Invalid credentials. For demonstration use: admin / demo123'
    };
  };

  const logout = async () => {
    if (isSupabaseConfigured() && supabase) {
      await supabase.auth.signOut();
    }
    localStorage.removeItem('wwg_demo_session');
    setUser(null);
    setIsDemo(false);
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      isDemo,
      supabaseConfigured: isSupabaseConfigured(),
      loginWithSupabase,
      loginDemo,
      logout
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
