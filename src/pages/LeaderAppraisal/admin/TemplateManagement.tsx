import { useQuery } from "@tanstack/react-query";
import { GET_templates } from "@/api/leader-review/leader-review";
import { Button } from "@/components/ui/button";
import { Plus, Edit, FileText } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function TemplateManagement() {
  const navigate = useNavigate();
  const { data: templates, isLoading } = useQuery({
    queryKey: ["templates"],
    queryFn: GET_templates,
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">평가 템플릿 관리</h1>
          <p className="text-muted-foreground mt-2">
            리더 평가에 사용할 템플릿을 생성하고 관리합니다.
          </p>
        </div>
        <Button onClick={() => navigate("/leader-appraisal/templates/new")}>
          <Plus className="mr-2 h-4 w-4" /> 템플릿 생성
        </Button>
      </div>

      {isLoading ? (
        <div>Loading...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates?.map((template) => (
            <Card key={template.templateId} className="hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                <div className="space-y-1">
                  <CardTitle className="text-xl font-semibold">{template.title}</CardTitle>
                  <CardDescription className="line-clamp-2 min-h-[40px]">
                    {template.description || "설명 없음"}
                  </CardDescription>
                </div>
                <div className="flex items-center space-x-2">
                   {template.isActive && <Badge variant="default">Active</Badge>} 
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center text-sm text-muted-foreground mb-4">
                  <FileText className="mr-2 h-4 w-4" />
                  문항 수: {template.questions?.length || 0}개
                </div>
                <div className="flex space-x-2">
                   <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => navigate(`/leader-appraisal/templates/${template.templateId}/edit`)}
                   >
                     <Edit className="mr-2 h-4 w-4" /> 수정
                   </Button>
                </div>
              </CardContent>
            </Card>
          ))}
          
          {templates?.length === 0 && (
            <div className="col-span-full py-12 text-center text-muted-foreground bg-slate-50 rounded-lg border border-dashed">
              등록된 템플릿이 없습니다. 새로운 템플릿을 생성해주세요.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
