
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Store, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

const Auth = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [loginEmail, setLoginEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn, signUp } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let result;
      if (isSignUp) {
        result = await signUp(email, password, fullName); 
      } else {
        result = await signIn(loginEmail, password);
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
            )}
            <div>
              <label className="block text-sm font-medium text-black mb-1">
                อีเมล
              </label>
              <Input
                type="email"
                value={isSignUp ? email : loginEmail}
                onChange={(e) => isSignUp ? setEmail(e.target.value) : setLoginEmail(e.target.value)}
                required
                placeholder="กรอกอีเมล"
              />
            </div>
            {isSignUp && (
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
