
import { useState, useEffect, createContext, useContext } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (username: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, fullName: string, username: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  userProfile: any;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<any>(null);

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.id);
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Fetch user profile
          setTimeout(async () => {
            try {
              const { data: profile, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', session.user.id)
                .single();
              
              console.log('Profile fetch result:', profile, error);
              if (profile) {
                setUserProfile(profile);
              }
            } catch (err) {
              console.error('Error fetching profile:', err);
            }
          }, 0);
        } else {
          setUserProfile(null);
        }
        
        setLoading(false);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (username: string, password: string) => {
    try {
      console.log('Attempting to sign in with username:', username);
      
      // First, find the user by username to get their email
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('email, id, full_name, role')
        .eq('username', username)
        .maybeSingle();

      console.log('Profile lookup result:', profile, profileError);

      if (profileError) {
        console.error('Profile lookup error:', profileError);
        return { error: { message: 'เกิดข้อผิดพลาดในการค้นหาผู้ใช้' } };
      }

      if (!profile) {
        console.log('No profile found for username:', username);
        return { error: { message: 'ไม่พบชื่อผู้ใช้นี้ในระบบ' } };
      }

      console.log('Found profile, attempting to sign in with email:', profile.email);

      // Then sign in with email and password
      const { error } = await supabase.auth.signInWithPassword({
        email: profile.email,
        password,
      });
      
      if (error) {
        console.error('Sign in error:', error);
        if (error.message.includes('Invalid login credentials')) {
          return { error: { message: 'รหัสผ่านไม่ถูกต้อง' } };
        }
        return { error: { message: error.message } };
      }

      console.log('Sign in successful');
      return { error: null };
    } catch (error) {
      console.error('Sign in catch error:', error);
      return { error: { message: 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ' } };
    }
  };

  const signUp = async (email: string, password: string, fullName: string, username: string) => {
    try {
      console.log('Attempting to sign up with:', { email, username, fullName });

      // Check if username already exists
      const { data: existingUser } = await supabase
        .from('profiles')
        .select('username')
        .eq('username', username)
        .maybeSingle();

      if (existingUser) {
        return { error: { message: 'ชื่อผู้ใช้นี้ถูกใช้แล้ว' } };
      }

      // Check if email already exists
      const { data: existingEmail } = await supabase
        .from('profiles')
        .select('email')
        .eq('email', email)
        .maybeSingle();

      if (existingEmail) {
        return { error: { message: 'อีเมลนี้ถูกใช้แล้ว' } };
      }

      // Sign up with email and password
      const { data: authData, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            username: username,
          },
          emailRedirectTo: `${window.location.origin}/`,
        },
      });
      
      console.log('Sign up result:', authData, error);

      if (error) {
        return { error: { message: error.message } };
      }

      // If signup was successful and we have a user, insert profile data
      if (authData.user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .insert([
            {
              id: authData.user.id,
              email: email,
              full_name: fullName,
              username: username,
              role: 'sales', // default role
            }
          ]);

        if (profileError) {
          console.error('Profile creation error:', profileError);
          // Don't return error here as the user was created successfully
        }
      }
      
      return { error: null };
    } catch (error) {
      console.error('Sign up catch error:', error);
      return { error: { message: 'เกิดข้อผิดพลาดในการสมัครสมาชิก' } };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setUserProfile(null);
  };

  const value = {
    user,
    session,
    loading,
    signIn,
    signUp,
    signOut,
    userProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
