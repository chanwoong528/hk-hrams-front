/** Emails that always get HR-wide visibility (matches API goal/appraisal checks). */
const ADMIN_EMAIL_ALLOWLIST = ["mooncw@hankookilbo.com"] as const;

export function isPrivilegedHrAdminEmail(
  email: string | undefined,
): boolean {
  return (
    !!email &&
    ADMIN_EMAIL_ALLOWLIST.includes(email as (typeof ADMIN_EMAIL_ALLOWLIST)[number])
  );
}

export function isHrDepartmentMember(
  departments: { departmentName?: string }[] | undefined,
): boolean {
  return (
    departments?.some((d) => departmentLooksLikeHr(d.departmentName)) ?? false
  );
}

/**
 * 인사(HR) 부서 소속은 본인 명의로 목표/최종 평가를 제출할 수 없음.
 * 예외 이메일(운영 관리자)은 기존처럼 평가 가능.
 */
export function shouldBlockHrSelfGrading(
  email: string | undefined,
  departments: { departmentName?: string }[] | undefined,
): boolean {
  if (isPrivilegedHrAdminEmail(email)) return false;
  return isHrDepartmentMember(departments);
}

export function departmentLooksLikeHr(departmentName: string | undefined): boolean {
  if (!departmentName) return false;
  const trimmed = departmentName.trim();
  const lower = trimmed.toLowerCase();
  if (lower === "hr") return true;
  
  return false;
}

export function isHrOrAdminUser(
  email: string | undefined,
  departments: { departmentName?: string }[] | undefined,
): boolean {
  if (isPrivilegedHrAdminEmail(email)) {
    return true;
  }
  return isHrDepartmentMember(departments);
}
