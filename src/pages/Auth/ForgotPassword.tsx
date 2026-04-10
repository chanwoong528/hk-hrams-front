import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { useMutation } from "@tanstack/react-query";
import { POST_forgotPassword } from "@/api/auth/auth";
import { useNavigate } from "react-router-dom";
import Logo from "@/components/Logo";

const forgotPasswordSchema = z.object({
  email: z.string().min(1, "이메일을 입력해주세요.").email("올바른 이메일 형식이 아닙니다."),
});

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPassword() {
  const navigate = useNavigate();

  const form = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  const { mutate, isPending } = useMutation({
    mutationFn: (email: string) => POST_forgotPassword(email),
    onSuccess: () => {
      toast.success("이메일로 비밀번호 재설정 링크가 전송되었습니다.");
      navigate("/login");
    },
    onError: (error: any) => {
      if (error?.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error("전송에 실패했습니다. 등록된 이메일인지 확인해주세요.");
      }
    },
  });

  const onSubmit = (data: ForgotPasswordFormValues) => {
    mutate(data.email);
  };

  return (
    <div className="flex items-center justify-center h-screen bg-gradient-to-br from-blue-50 to-blue-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-center text-blue-600 flex items-center justify-center mb-4">
            <Logo type="rectangle" width={200} height={80} />
          </CardTitle>
          <CardTitle className="text-center text-xl">비밀번호 찾기</CardTitle>
          <CardDescription className="text-center">
            가입한 이메일 주소를 입력하시면 비밀번호 재설정 링크를 보내드립니다.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">이메일</Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                disabled={isPending}
                {...form.register("email")}
              />
              {form.formState.errors.email && (
                <p className="text-sm text-red-500 mt-1">
                  {form.formState.errors.email.message}
                </p>
              )}
            </div>
            <Button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 mt-2"
              disabled={isPending}
            >
              {isPending ? "전송 중..." : "재설정 링크 받기"}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => navigate("/login")}
              disabled={isPending}
            >
              로그인으로 돌아가기
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
