import React, { useState, useEffect } from 'react'; // เพิ่ม useEffect
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Store, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
// *** เพิ่ม Imports สำหรับ Select Components ***
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
// *** เพิ่ม Import สำหรับ supabase client ***
import { supabase } from '@/integrations/supabase/client'; 

const Auth = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn, signUp } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  // *** เพิ่ม State สำหรับ Branch และ Role ***
  const [branches, setBranches] = useState<{ id: string; name_th: string }[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<string>('staff'); // กำหนด Role เริ่มต้นเป็น 'staff'

  // *** useEffect สำหรับโหลดข้อมูลสาขา ***
  useEffect(() => {
    const loadBranches = async () => {
      // ตรวจสอบว่ามีสิทธิ์ในการดึงข้อมูลสาขาหรือไม่
      const { data, error } = await supabase.from('branches').select('id, name').order('name');
      if (error) {
        console.error('Error loading branches for signup:', error);
        toast({ title: "ข้อผิดพลาด", description: "ไม่สามารถโหลดข้อมูลสาขาได้", variant: "destructive" });
        return;
      }
      setBranches(data || []);
      // หากมีสาขาเดียว อาจจะเลือกให้อัตโนมัติ หรือเลือกสาขาแรกเป็นค่า default
      if (data && data.length > 0 && !selectedBranchId) {
        setSelectedBranchId(data[0].id); // เลือกสาขาแรกเป็นค่าเริ่มต้น
      }
    };
    loadBranches();
  }, []); // ไม่มี dependencies เพื่อให้โหลดแค่ครั้งเดียวเมื่อคอมโพเนนต์โหลด

  

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let result;
      if (isSignUp) {

    
        // *** เพิ่มการตรวจสอบข้อมูลสำหรับ SignUp ***
        if (!email || !password || !fullName || !username || !selectedBranchId || !selectedRole) {
          toast({
            variant: "destructive",
            title: "ข้อมูลไม่ครบถ้วน",
            description: "กรุณากรอกข้อมูลสำหรับสมัครสมาชิกให้ครบถ้วน (รวมถึงสาขาและบทบาท)",
          });
          setLoading(false);
          return;
        }
        // *** แก้ไขการเรียกใช้ signUp function ***
        // ส่ง selectedBranchId และ selectedRole เข้าไปด้วย
        result = await signUp(email, password, fullName, username, selectedBranchId, selectedRole);

         
      if (!result.error) {
        toast({
          title: "สมัครสมาชิกสำเร็จ",
          description: "กรุณาตรวจสอบอีเมลเพื่อยืนยันบัญชี",
        });
        setIsSignUp(false); 
        
        setLoading(false); 
        return; 
      }
    

      } else {
        if (!loginIdentifier || !password) {
          toast({
            variant: "destructive",
            title: "ข้อมูลไม่ครบถ้วน",
            description: "กรุณากรอกชื่อผู้ใช้หรืออีเมล และรหัสผ่าน",
          });
          setLoading(false);
          return;
        }
        // *** แก้ไขการเรียกใช้ signIn function ***
        // ส่ง loginIdentifier (แทน loginEmail) เข้าไปด้วย
        result = await signIn(loginIdentifier, password);
      }

      if (result.error) {
        toast({
          variant: "destructive",
          title: "เกิดข้อผิดพลาด",
          description: result.error.message,
        });
      } else {
        toast({
          title: isSignUp ? "สมัครสมาชิกสำเร็จ" : "เข้าสู่ระบบสำเร็จ",
          description: isSignUp ? "กรุณาตรวจสอบอีเมลเพื่อยืนยันบัญชี" : "ยินดีต้อนรับเข้าสู่ระบบ",
        });
        if (!isSignUp) {
          navigate('/');
        }
      }
    } catch (error) {
      console.error("Auth catch error:", error); // เพิ่ม log
      toast({
        variant: "destructive",
        title: "เกิดข้อผิดพลาด",
        description: "กรุณาลองใหม่อีกครั้ง",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-700 rounded-lg flex items-center justify-center">
              <Store className="h-7 w-7 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-black">
            AKK Sell and Service
          </CardTitle>
          <CardDescription className="text-black">
            {isSignUp ? 'สร้างบัญชีใหม่' : 'เข้าสู่ระบบ'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && (
              <>
                <div>
                  <label className="block text-sm font-medium text-black mb-1">
                    ชื่อ-นามสกุล
                  </label>
                  <Input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    placeholder="กรอกชื่อ-นามสกุล"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-black mb-1">
                    ชื่อผู้ใช้
                  </label>
                  <Input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    placeholder="กรอกชื่อผู้ใช้"
                  />
                </div>
              </>
            )}
            <div>
              
              <label className="block text-sm font-medium text-black mb-1">
                อีเมล หรือ ชื่อผู้ใช้
              </label>
              <Input
                type="text" 
                value={isSignUp ? email : loginIdentifier} 
                onChange={(e) => isSignUp ? setEmail(e.target.value) : setLoginIdentifier(e.target.value)} 
                required
                placeholder="กรอกอีเมล หรือ ชื่อผู้ใช้"
              />
            </div>
            {isSignUp && (
              <>
                {/* *** เพิ่ม Field สำหรับเลือกสาขา *** */}
                <div>
                  <label className="block text-sm font-medium text-black mb-1">
                    สาขา *
                  </label>
                  <Select
                    onValueChange={(value) => setSelectedBranchId(value)}
                    value={selectedBranchId || ''}
                    // disabled={branches.length === 0} // ปิดการใช้งานถ้ายังโหลดสาขาไม่เสร็จ
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="เลือกสาขา" />
                    </SelectTrigger>
                    <SelectContent>
                      {branches.map(branch => (
                        <SelectItem key={branch.id} value={branch.id}>
                          {branch.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* *** เพิ่ม Field สำหรับเลือกบทบาท *** */}
                {/* หาก Admin เป็นผู้สร้าง User และต้องการกำหนด Role เอง */}
                <div>
                  <label className="block text-sm font-medium text-black mb-1">
                    บทบาท *
                  </label>
                  <Select
                    onValueChange={(value) => setSelectedRole(value)}
                    value={selectedRole}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="เลือกบทบาท" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="staff">พนักงานทั่วไป</SelectItem>
                      <SelectItem value="branch_manager">ผู้จัดการสาขา</SelectItem>
                      {/* หากมี Super Admin และต้องการกำหนด Role นี้ ให้เพิ่ม Option นี้ */}
                      {/* <SelectItem value="super_admin">ผู้ดูแลระบบสูงสุด</SelectItem> */}
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}
            <div>
              <label className="block text-sm font-medium text-black mb-1">
                รหัสผ่าน
              </label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="กรอกรหัสผ่าน"
                minLength={6}
              />
            </div>
            <Button
              type="submit"
              className="w-full bg-red-600 hover:bg-red-700"
              disabled={loading}
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isSignUp ? 'สมัครสมาชิก' : 'เข้าสู่ระบบ'}
            </Button>
          </form>
          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-sm text-red-600 hover:text-red-700"
            >
              {isSignUp ? 'มีบัญชีแล้ว? เข้าสู่ระบบ' : 'ยังไม่มีบัญชี? สมัครสมาชิก'}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;