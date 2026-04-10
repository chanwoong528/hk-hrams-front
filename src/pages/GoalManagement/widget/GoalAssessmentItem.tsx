import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Goal as GoalIcon, Pencil, ChevronDown, ChevronUp } from "lucide-react";
import { useState, Fragment, useEffect } from "react";
import { toast } from "sonner";
import type { Goal } from "../type";

const NEW_ASSESSMENT_ID = "NEW";

interface GoalAssessmentItemProps {
  goal: Goal;
  onSave: (
    goalId: string,
    grade: string,
    comment: string,
    gradedByUserId?: string,
  ) => void;
  disabled?: boolean;
  targetUserId?: string;
  currentUserId?: string;
  isSpectator?: boolean;
  /** HR/관리자: 다른 평가자가 남긴 목표 등급 수정 */
  hrCanEditOthersGrades?: boolean;
  /** 인사팀 등: 본인 명의로 새 목표 평가 제출 불가 */
  hrCannotSubmitOwnGoalGrade?: boolean;
}

const GoalAssessmentItem = ({
  goal,
  currentUserId,
  onSave,
  disabled = false,
  targetUserId,
  isSpectator = false,
  hrCanEditOthersGrades = false,
  hrCannotSubmitOwnGoalGrade = false,
}: GoalAssessmentItemProps) => {
  const myAssessment = isSpectator
    ? goal.goalAssessmentBy?.[0]
    : goal.goalAssessmentBy?.find((a) => a.gradedBy === currentUserId);

  const hasUserAssessed = targetUserId
    ? goal.goalAssessmentBy?.some((a) => a.gradedBy === targetUserId)
    : true;

  const [editingAssessmentId, setEditingAssessmentId] = useState<string | null>(
    null,
  );
  const [expandedAssessments, setExpandedAssessments] = useState<Set<string>>(
    new Set(),
  );

  const [grade, setGrade] = useState(myAssessment?.grade || "");
  const [comment, setComment] = useState(myAssessment?.comment || "");
  const [editBadgeLabel, setEditBadgeLabel] = useState("내 평가");

  useEffect(() => {
    if (!editingAssessmentId) return;
    if (editingAssessmentId === NEW_ASSESSMENT_ID) {
      setGrade("");
      setComment("");
      setEditBadgeLabel("내 평가");
      return;
    }
    const row = goal.goalAssessmentBy?.find(
      (a) => a.goalAssessId === editingAssessmentId,
    );
    if (!row) return;
    setGrade(row.grade || "");
    setComment(row.comment || "");
    const isSelfRow = targetUserId && row.gradedBy === targetUserId;
    const name =
      row.gradedByUser?.koreanName?.trim() ||
      (isSelfRow ? "본인" : "평가자");
    const isHrEdit =
      hrCanEditOthersGrades &&
      row.gradedBy !== currentUserId &&
      !isSelfRow;
    setEditBadgeLabel(isHrEdit ? `${name} 평가 수정 (HR)` : "내 평가");
  }, [
    editingAssessmentId,
    goal.goalAssessmentBy,
    targetUserId,
    currentUserId,
    hrCanEditOthersGrades,
  ]);

  const handleSave = () => {
    if (!grade) {
      toast.error("등급을 선택해주세요");
      return;
    }
    if (editingAssessmentId === NEW_ASSESSMENT_ID) {
      onSave(goal.goalId, grade, comment);
    } else if (editingAssessmentId) {
      const row = goal.goalAssessmentBy?.find(
        (a) => a.goalAssessId === editingAssessmentId,
      );
      if (!row) return;
      onSave(goal.goalId, grade, comment, row.gradedBy);
    }
    setEditingAssessmentId(null);
  };

  const handleCancel = () => {
    setEditingAssessmentId(null);
    setGrade(myAssessment?.grade || "");
    setComment(myAssessment?.comment || "");
  };

  const toggleExpansion = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const newSet = new Set(expandedAssessments);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setExpandedAssessments(newSet);
  };

  const grades = [
    {
      value: "S",
      label: "S등급",
      desc: "탁월",
      color: "text-purple-700 bg-purple-50 border-purple-200",
    },
    {
      value: "A",
      label: "A등급",
      desc: "우수",
      color: "text-blue-700 bg-blue-50 border-blue-200",
    },
    {
      value: "B",
      label: "B등급",
      desc: "보통",
      color: "text-green-700 bg-green-50 border-green-200",
    },
    {
      value: "C",
      label: "C등급",
      desc: "미흡",
      color: "text-orange-700 bg-orange-50 border-orange-200",
    },
    {
      value: "D",
      label: "D등급",
      desc: "부족",
      color: "text-red-700 bg-red-50 border-red-200",
    },
  ];

  const renderEditRow = (key?: string) => (
    <TableRow
      key={key}
      className="bg-blue-50/30 ring-1 ring-inset ring-blue-100">
      <TableCell className="font-medium align-top py-4">
        <Badge variant="secondary" className="bg-blue-100 text-blue-700 mb-2">
          {editBadgeLabel}
        </Badge>
      </TableCell>
      <TableCell colSpan={2} className="py-4">
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2" role="group" aria-label="등급 선택">
            {grades.map((g) => (
              <div
                key={g.value}
                role="button"
                tabIndex={0}
                aria-label={`${g.label} 선택`}
                aria-pressed={grade === g.value}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setGrade(g.value);
                  }
                }}
                onClick={() => setGrade(g.value)}
                className={`cursor-pointer px-3 py-1.5 rounded-md border text-sm transition-all flex items-center gap-1.5 ${
                  grade === g.value
                    ? `${g.color} ring-1 ring-${
                        g.color.split(" ")[0].split("-")[1]
                      }-300 font-bold`
                    : "border-gray-200 bg-white hover:border-gray-300 text-gray-600"
                }`}>
                <span>{g.value}</span>
              </div>
            ))}
          </div>
          <Textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="평가 코멘트를 입력하세요 (필수)"
            className="resize-none min-h-[60px] text-sm bg-white"
            aria-label="평가 코멘트"
          />
          <div className="flex justify-end gap-2">
            <Button size="sm" variant="ghost" onClick={handleCancel}>
              취소
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              className="bg-blue-600 hover:bg-blue-700">
              저장
            </Button>
          </div>
        </div>
      </TableCell>
    </TableRow>
  );

  const showAddOwnRow =
    !myAssessment &&
    !hrCannotSubmitOwnGoalGrade &&
    !isSpectator &&
    editingAssessmentId !== NEW_ASSESSMENT_ID;

  return (
    <div className="bg-white rounded-xl border shadow-sm p-5 space-y-4 transition-all ring-1 ring-blue-50">
      <div className="flex justify-between items-start">
        <div className="space-y-1">
          <h4 className="font-semibold text-gray-900 flex items-center gap-2 text-lg">
            <GoalIcon className="w-5 h-5 text-gray-500" />
            {goal.title}
          </h4>
          <p className="text-gray-600 text-sm leading-relaxed pl-7">
            {goal.description}
          </p>
        </div>
      </div>

      <div className="pl-0 sm:pl-7 mt-4">
        <div className="border rounded-lg overflow-hidden bg-gray-50/50">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-100/80 hover:bg-gray-100/80">
                <TableHead
                  scope="col"
                  className="w-[100px] text-xs font-bold uppercase tracking-wider text-gray-500">
                  평가자
                </TableHead>
                <TableHead
                  scope="col"
                  className="w-[120px] text-xs font-bold uppercase tracking-wider text-gray-500">
                  등급
                </TableHead>
                <TableHead
                  scope="col"
                  className="w-[80px] text-right text-xs font-bold uppercase tracking-wider text-gray-500">
                  편집
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {goal.goalAssessmentBy?.map((assessment) => {
                const isMe = assessment.gradedBy === currentUserId;
                const isTargetUser = assessment.gradedBy === targetUserId;
                const isLeaderRow = !!targetUserId && !isTargetUser;
                const canHrEditThisRow =
                  hrCanEditOthersGrades &&
                  isLeaderRow &&
                  !isMe &&
                  !disabled;
                const showOwnPencil =
                  isMe && !isSpectator && !disabled && !hrCannotSubmitOwnGoalGrade;
                const isExpanded = expandedAssessments.has(
                  assessment.goalAssessId,
                );

                if (editingAssessmentId === assessment.goalAssessId) {
                  return renderEditRow(assessment.goalAssessId);
                }

                return (
                  <Fragment key={assessment.goalAssessId}>
                    <TableRow
                      className="bg-white cursor-pointer hover:bg-gray-50 transition-colors"
                      onClick={(e) =>
                        toggleExpansion(assessment.goalAssessId, e)
                      }>
                      <TableCell className="font-medium text-gray-900">
                        {(() => {
                          const name =
                            assessment.gradedByUser?.koreanName ||
                            (isTargetUser ? "본인" : "평가자");

                          return (
                            <div className="flex items-center gap-2">
                              <span
                                className={
                                  isMe || isTargetUser
                                    ? "font-semibold"
                                    : "font-medium text-gray-700"
                                }>
                                {name}
                              </span>
                              {isMe && (
                                <Badge
                                  variant="secondary"
                                  className="bg-blue-100 text-blue-700 text-xs px-1.5 py-0 rounded-sm">
                                  Me
                                </Badge>
                              )}
                              {isTargetUser && (
                                <Badge
                                  variant="outline"
                                  className="bg-gray-100 text-gray-600 text-xs px-1.5 py-0 rounded-sm border-gray-200">
                                  Self
                                </Badge>
                              )}
                            </div>
                          );
                        })()}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant="outline"
                            className={`font-bold ${
                              assessment.grade === "S"
                                ? "bg-purple-50 text-purple-700 border-purple-200"
                                : assessment.grade === "A"
                                  ? "bg-blue-50 text-blue-700 border-blue-200"
                                  : assessment.grade === "B"
                                    ? "bg-green-50 text-green-700 border-green-200"
                                    : "bg-gray-50 text-gray-700 border-gray-200"
                            }`}>
                            {assessment.grade} 등급
                          </Badge>
                          {assessment.comment && (
                            <div className="text-gray-400">
                              {isExpanded ? (
                                <ChevronUp className="w-4 h-4" />
                              ) : (
                                <ChevronDown className="w-4 h-4" />
                              )}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        {showOwnPencil && (
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 hover:text-blue-600 disabled:opacity-30"
                            aria-label="내 목표 평가 수정"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingAssessmentId(assessment.goalAssessId);
                            }}>
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                        )}
                        {canHrEditThisRow && (
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 hover:text-purple-600"
                            aria-label="HR — 타 평가자 등급 수정"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingAssessmentId(assessment.goalAssessId);
                            }}>
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                    {isExpanded && assessment.comment && (
                      <TableRow className="bg-gray-50 border-t border-gray-100">
                        <TableCell
                          colSpan={3}
                          className="p-4 text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                          {assessment.comment}
                        </TableCell>
                      </TableRow>
                    )}
                  </Fragment>
                );
              })}

              {showAddOwnRow && (
                <TableRow
                  className={`bg-white ${
                    !hasUserAssessed
                      ? "opacity-60 cursor-not-allowed bg-gray-50"
                      : "hover:bg-gray-50 cursor-pointer"
                  }`}
                  onClick={() => {
                    if (hasUserAssessed) setEditingAssessmentId(NEW_ASSESSMENT_ID);
                    else toast.error("팀원이 먼저 평가를 완료해야 합니다.");
                  }}>
                  <TableCell className="font-medium text-gray-500">
                    본인
                  </TableCell>
                  <TableCell className="text-center text-gray-400 text-sm">
                    {!hasUserAssessed
                      ? "팀원 평가 대기 중"
                      : "아직 평가하지 않았습니다."}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      disabled={!hasUserAssessed}
                      className="bg-blue-600 hover:bg-blue-700 h-8 text-xs disabled:bg-gray-300"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (hasUserAssessed)
                          setEditingAssessmentId(NEW_ASSESSMENT_ID);
                      }}>
                      평가하기
                    </Button>
                  </TableCell>
                </TableRow>
              )}

              {editingAssessmentId === NEW_ASSESSMENT_ID &&
                renderEditRow("new-assessment")}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
};

export default GoalAssessmentItem;
