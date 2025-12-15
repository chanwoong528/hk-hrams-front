import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";
import { useMutation } from "@tanstack/react-query";
import { POST_signIn } from "@/api/auth/auth";
import { useCurrentUserStore } from "@/store/currentUserStore";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [email, setEmail] = useState("mooncw@hankookilbo.com");
  const [password, setPassword] = useState("123456789");

  const { setAccessToken, setRefreshToken } = useCurrentUserStore();
  const navigate = useNavigate();

  const { mutate: postSignIn, isPending: isLoading } = useMutation({
    mutationFn: (payload: SignInPayload) => POST_signIn(payload),
    onSuccess: (data) => {
      console.log(data.data.accessToken);
      setAccessToken(data.data.accessToken);
      setRefreshToken(data.data.refreshToken);
      navigate("/");
      toast.success("로그인 성공");
    },
    onError: () => {
      toast.error("로그인 실패");
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    postSignIn({ email, pw: password });
  };

  return (
    <div className='flex items-center justify-center h-screen bg-gradient-to-br from-blue-50 to-blue-100 p-4'>
      <Card className='w-full max-w-md'>
        <CardHeader className='space-y-1'>
          <div className='flex items-center justify-center mb-4'>
            <div className='w-16 h-16 rounded-full bg-blue-600 flex items-center justify-center text-white text-2xl'>
              HR
            </div>
          </div>
          <CardTitle className='text-center text-blue-600'>HRAMS</CardTitle>
          <CardDescription className='text-center'>
            인사 성과 관리 시스템
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className='space-y-4'>
            <div className='space-y-2'>
              <Label htmlFor='email'>이메일</Label>
              <Input
                id='email'
                type='email'
                placeholder='your@email.com'
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
              />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='password'>비밀번호</Label>
              <Input
                id='password'
                type='password'
                placeholder=''
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
              />
            </div>
            <Button
              type='submit'
              className='w-full bg-blue-600 hover:bg-blue-700'
              disabled={isLoading}>
              {isLoading ? "로그인 중..." : "로그인"}
            </Button>
          </form>

          <div className='mt-6 p-4 bg-blue-50 rounded-lg'>
            <p className='text-sm text-gray-700 mb-2'>데모 계정:</p>
            <div className='space-y-1 text-sm text-gray-600'>
              <div>• admin@company.com / admin123</div>
              <div>• manager@company.com / manager123</div>
              <div>• user@company.com / user123</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
