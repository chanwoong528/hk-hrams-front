import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { useMutation } from "@tanstack/react-query";
import { POST_signIn } from "@/api/auth/auth";
import { useCurrentUserStore } from "@/store/currentUserStore";
import { useNavigate } from "react-router-dom";
import Logo from "@/components/Logo";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const { setAccessToken, setRefreshToken } = useCurrentUserStore();
  const navigate = useNavigate();

  const { mutate: postSignIn, isPending: isLoading } = useMutation({
    mutationFn: (payload: SignInPayload) => POST_signIn(payload),
    onSuccess: (data: any) => {
      console.log(data.data?.accessToken);
      if (data.data?.requirePasswordReset) {
        navigate("/verify-email", { state: { email } });
        return;
      }
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
    <div className="flex items-center justify-center h-screen bg-gradient-to-br from-blue-50 to-blue-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-center text-blue-600 flex items-center justify-center">
            <Logo type="rectangle" width={250} height={100} />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">이메일</Label>
              <Input
                id="email"
                type="email"
                placeholder="your@hankookilbo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">비밀번호</Label>
              <Input
                id="password"
                type="password"
                placeholder="초기비번 사번"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
              />
            </div>
            <Button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700"
              disabled={isLoading}
            >
              {isLoading ? "로그인 중..." : "로그인"}
            </Button>

            <Button
              type="button"
              variant="link"
              className="w-full text-blue-600"
              onClick={() => navigate("/forgot-password")}
            >
              비밀번호 찾기
            </Button>
          </form>

          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-gray-700 leading-relaxed">
              초기 비밀번호는 <span className="font-medium">사번</span>입니다. 입력 시{" "}
              <span className="font-medium">영문 소문자</span>로 입력해 주세요. 첫 로그인
              이후 안내에 따라 비밀번호를 변경해 주세요.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
