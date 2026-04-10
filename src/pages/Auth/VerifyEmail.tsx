import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { useMutation } from "@tanstack/react-query";
import { POST_forgotPassword } from "@/api/auth/auth";
import Logo from "@/components/Logo";

export default function VerifyEmail() {
  const location = useLocation();
  const navigate = useNavigate();
  const email = location.state?.email;

  const { mutate, isPending } = useMutation({
    mutationFn: (userEmail: string) => POST_forgotPassword(userEmail),
    onSuccess: () => {
      toast.success("인증 이메일이 다시 전송되었습니다. 이메일함을 확인해주세요.");
    },
    onError: () => {
      toast.error("이메일 전송에 실패했습니다.");
    },
  });

  if (!email) {
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <p>잘못된 접근입니다.</p>
        <Button onClick={() => navigate("/login")} className="mt-4">
          로그인으로 돌아가기
        </Button>
      </div>
    );
  }

  const handleResend = () => {
    mutate(email);
  };

  return (
    <div className="flex items-center justify-center h-screen bg-gradient-to-br from-blue-50 to-blue-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-center text-blue-600 flex items-center justify-center mb-4">
            <Logo type="rectangle" width={200} height={80} />
          </CardTitle>
          <CardTitle className="text-center text-xl">이메일 인증이 필요합니다</CardTitle>
          <CardDescription className="text-center mt-2">
            <strong>{email}</strong> 주소로 인증 및 비밀번호 설정 링크를 발송했습니다.
            이메일에 포함된 링크를 눌러 로그인을 완료해주세요.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center space-y-4">
          <div className="text-sm text-gray-500 text-center">
            이메일을 받지 못하셨나요? 스팸함을 확인하시거나 다시 요청해주세요.
          </div>
          <Button
            type="button"
            className="w-full bg-blue-600 hover:bg-blue-700"
            onClick={handleResend}
            disabled={isPending}
          >
            {isPending ? "전송 중..." : "인증 이메일 다시 보내기"}
          </Button>
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={() => navigate("/login")}
          >
            로그인으로 돌아가기
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
