import { useState, useEffect, createContext, useContext } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (identifier: string, password: string) => Promise<{ error: any }>;
  signUp: (
    email: string,
    password: string,
    fullName: string,
    username: string,
    branchId: string, // *** เพิ่มตรงนี้: UUID ของสาขา
    role?: string      // *** เพิ่มตรงนี้: Role (เป็น optional ถ้ามี default หรือไม่ใช้)
  ) => Promise<{ error: any }>;
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

  const signIn = async (identifier: string, password: string) => { // *** แก้ไข signature ตรงนี้ ***
    let targetEmail = identifier; // สมมติว่าเป็น email ไว้ก่อน

    // 1. ตรวจสอบว่า identifier เป็น email หรือไม่
    const isEmail = identifier.includes('@');

    if (!isEmail) {
      // 2. ถ้าไม่ใช่ email แสดงว่าเป็น username, ต้องไปค้นหา email จากตาราง public.users
      const { data: profileData, error: profileError } = await supabase
        .from('users') // หรือ 'profiles' ตามชื่อตารางที่คุณใช้
        .select('email')
        .eq('username', identifier)
        .single(); // ใช้ single เพื่อดึงมาแค่ 1 แถว

      if (profileError || !profileData) {
        // หากหา username ไม่เจอ หรือมี Error ในการค้นหา
        return { error: { message: 'ชื่อผู้ใช้หรืออีเมลไม่ถูกต้อง' } };
      }
      targetEmail = profileData.email; // ได้ email จาก username แล้ว
    }

    // 3. ใช้ targetEmail ที่ได้มา (ไม่ว่าจะเป็น original email หรือ email จาก username) ในการ signIn
    const { data, error } = await supabase.auth.signInWithPassword({
      email: targetEmail,
      password: password,
    });

    if (error) {
      console.error('Sign in error:', error);
      return { error: { message: error.message } };
    }

    // อัปเดต session และ user state
    if (data.session && data.user) {
      setSession(data.session);
      setUser(data.user);
      // โหลด userProfile ด้วย (ถ้าคุณต้องการโหลดหลัง Login)
      const { data: userProfileData, error: userProfileError } = await supabase
        .from('users') // หรือ 'profiles'
        .select('*')
        .eq('id', data.user.id)
        .single();
      
      if (userProfileError) {
        console.error('Error fetching user profile after sign in:', userProfileError);
        setUserProfile(null);
      } else {
        setUserProfile(userProfileData);
      }
    } else {
      setSession(null);
      setUser(null);
      setUserProfile(null);
      return { error: { message: 'เข้าสู่ระบบไม่สำเร็จ กรุณาตรวจสอบชื่อผู้ใช้/อีเมลและรหัสผ่าน' } };
    }
    
    return { error: null };
  };

  const signUp = async (
  email: string,
  password: string,
  fullName: string,
  username: string,
  // เพิ่ม parameter สำหรับ branchId และ role ที่จะใช้ตอนสมัคร
  branchId: string, // สมมติว่าเป็น string ที่เก็บ UUID ของสาขา
  role: string = 'staff' // กำหนด default role หรือให้เลือกจาก UI
) => {
  try {
    console.log('Attempting to sign up with:', { email, username, fullName, branchId, role });


    const { data: existingUser } = await supabase
      .from('users') // หรือ 'profiles' ตามชื่อตารางที่คุณใช้
      .select('username')
      .eq('username', username)
      .maybeSingle();

    if (existingUser) {
      return { error: { message: 'ชื่อผู้ใช้นี้ถูกใช้แล้ว' } };
    }

    const { data: existingEmail } = await supabase
      .from('users')
      .select('email')
      .eq('email', email)
      .maybeSingle();

    if (existingEmail) {
      return { error: { message: 'อีเมลนี้ถูกใช้แล้ว' } };
    }
    // --- สิ้นสุดการตรวจสอบ Username/Email ---


    // Sign up with email and password
    const { data: authData, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          username: username,
          branch_id: branchId, // *** เพิ่มตรงนี้: ส่ง branch_id ไปให้ Trigger ***
          user_role: role,     // *** เพิ่มตรงนี้: ส่ง role ไปให้ Trigger (user_role คือชื่อที่ Trigger ใช้) ***
        },
        emailRedirectTo: `${window.location.origin}/`,
      },
    });

    console.log('Sign up result:', authData, error);

    if (error) {
      // อาจเป็น error ที่เกี่ยวกับ auth เช่น email/password ไม่ถูกต้อง
      return { error: { message: error.message } };
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
