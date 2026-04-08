import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { toast } from "sonner";
import { useMutation } from "@tanstack/react-query";
import { POST_resetPassword } from "@/api/auth/auth";
import { useNavigate, useLocation } from "react-router-dom";
import Logo from "@/components/Logo";

const MAX_PASSWORD_LENGTH = 30;
const MIN_PASSWORD_LENGTH = 8;

const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(
        MIN_PASSWORD_LENGTH,
        `비밀번호는 최소 ${MIN_PASSWORD_LENGTH}자 이상이어야 합니다.`,
      )
      .regex(
        /^(?=.*[a-zA-Z])(?=.*[0-9]).{8,}$/,
        "비밀번호는 영문과 숫자를 포함해야 합니다.",
      )
      .max(
        MAX_PASSWORD_LENGTH,
        `비밀번호는 최대 ${MAX_PASSWORD_LENGTH}자까지 가능합니다.`,
      ),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "비밀번호가 일치하지 않습니다.",
    path: ["confirmPassword"],
  });

type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

export default function ResetPassword() {
  const navigate = useNavigate();
  const location = useLocation();

  const token = new URLSearchParams(location.search).get("token");

  useEffect(() => {
    if (!token) {
      toast.error("유효하지 않은 접근입니다.");
      navigate("/login");
    }
  }, [token, navigate]);

  const form = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  const { mutate, isPending } = useMutation({
    mutationFn: (payload: { token: string; newPw: string }) =>
      POST_resetPassword(payload),
    onSuccess: () => {
      toast.success("비밀번호가 성공적으로 재설정되었습니다.");
      navigate("/login");
    },
    onError: () => {
      toast.error(
        "비밀번호 재설정에 실패했습니다. 링크가 만료되었는지 확인해주세요.",
      );
    },
  });

  const onSubmit = (data: ResetPasswordFormValues) => {
    if (token) {
      mutate({ token, newPw: data.password });
    }
  };

  return (
    <div className="flex items-center justify-center h-screen bg-gradient-to-br from-blue-50 to-blue-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-center text-blue-600 flex items-center justify-center mb-4">
            <Logo type="rectangle" width={200} height={80} />
          </CardTitle>
          <CardTitle className="text-center text-xl">
            새 비밀번호 설정
          </CardTitle>
          <CardDescription className="text-center">
            새로 사용할 비밀번호를 입력해주세요.
          </CardDescription>
          <CardDescription className="text-center">
            비밀번호는 {MIN_PASSWORD_LENGTH}자 ~ {MAX_PASSWORD_LENGTH}자 영문과
            숫자를 포함해야 합니다.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">새 비밀번호</Label>
              <Input
                id="password"
                type="password"
                disabled={isPending}
                {...form.register("password")}
              />
              {form.formState.errors.password && (
                <p className="text-sm text-red-500 mt-1">
                  {form.formState.errors.password.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">비밀번호 확인</Label>
              <Input
                id="confirmPassword"
                type="password"
                disabled={isPending}
                {...form.register("confirmPassword")}
              />
              {form.formState.errors.confirmPassword && (
                <p className="text-sm text-red-500 mt-1">
                  {form.formState.errors.confirmPassword.message}
                </p>
              )}
            </div>
            <Button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 mt-2"
              disabled={isPending}
            >
              {isPending ? "처리 중..." : "비밀번호 변경하기"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
