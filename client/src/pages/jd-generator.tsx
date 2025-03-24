import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { llamaClient } from "@/lib/llamaClient";
import { useRecruitmentApp } from "@/context";

// UI Components
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader, FileText, Save } from "lucide-react";
import { BackButton } from "@/components/ui/back-button";

const JDGenerator = () => {
  const { toast } = useToast();
  const { user } = useRecruitmentApp();
  
  // Form state
  const [title, setTitle] = useState("");
  const [department, setDepartment] = useState("");
  const [experience, setExperience] = useState("");
  const [skills, setSkills] = useState("");
  
  // Generated content state
  const [generatedDescription, setGeneratedDescription] = useState("");
  const [generatedRequirements, setGeneratedRequirements] = useState("");
  const [generatedResponsibilities, setGeneratedResponsibilities] = useState("");
  
  // Loading states
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Mutation for saving the job description
  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/jd-generator", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Job description saved successfully!",
      });
      
      // Reset form
      setTitle("");
      setDepartment("");
      setExperience("");
      setSkills("");
      setGeneratedDescription("");
      setGeneratedRequirements("");
      setGeneratedResponsibilities("");
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to save job description: " + error,
        variant: "destructive",
      });
    },
  });
  
  const handleGenerate = async () => {
    if (!title || !department || !experience || !skills) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }
    
    setIsGenerating(true);
    
    try {
      // In a real implementation, we would call the Llama API
      const result = await llamaClient.process({
        task: "generate-job-description",
        inputs: {
          title,
          department,
          experience,
          skills,
        },
      });
      
      if (result.success && result.data) {
        setGeneratedDescription(result.data.description);
        setGeneratedRequirements(result.data.requirements);
        setGeneratedResponsibilities(result.data.responsibilities);
        
        toast({
          title: "Job description generated",
          description: "Your job description has been created successfully.",
        });
      } else {
        throw new Error(result.error || "Failed to generate job description");
      }
    } catch (error) {
      toast({
        title: "Generation failed",
        description: "There was an error generating the job description. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };
  
  const handleSave = () => {
    if (!generatedDescription || !generatedRequirements) {
      toast({
        title: "Missing content",
        description: "Please generate a job description first.",
        variant: "destructive",
      });
      return;
    }
    
    saveMutation.mutate({
      title,
      department,
      experience,
      skills,
      createdBy: user?.id
    });
  };
  
  return (
    <div>
      <BackButton to="/jobs" label="Back to Jobs" />
      <div className="pb-5 border-b border-gray-200">
        <h2 className="text-2xl font-bold leading-7 text-gray-700 sm:text-3xl">
          Job Description Generator
        </h2>
        <p className="mt-2 text-sm text-gray-500">
          Create professional job descriptions powered by Llama 3.x AI
        </p>
      </div>
      
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Input Form */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-medium text-gray-700">
              Job Details
            </CardTitle>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Job Title</Label>
              <Input
                id="title"
                placeholder="e.g. Senior Software Engineer"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="department">Department</Label>
              <Select value={department} onValueChange={setDepartment}>
                <SelectTrigger id="department">
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Engineering">Engineering</SelectItem>
                  <SelectItem value="Product">Product</SelectItem>
                  <SelectItem value="Design">Design</SelectItem>
                  <SelectItem value="Marketing">Marketing</SelectItem>
                  <SelectItem value="Sales">Sales</SelectItem>
                  <SelectItem value="Finance">Finance</SelectItem>
                  <SelectItem value="HR">HR</SelectItem>
                  <SelectItem value="Operations">Operations</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="experience">Experience Level</Label>
              <Select value={experience} onValueChange={setExperience}>
                <SelectTrigger id="experience">
                  <SelectValue placeholder="Select experience level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Entry level">Entry level</SelectItem>
                  <SelectItem value="1-3 years">1-3 years</SelectItem>
                  <SelectItem value="3-5 years">3-5 years</SelectItem>
                  <SelectItem value="5+ years">5+ years</SelectItem>
                  <SelectItem value="7+ years">7+ years</SelectItem>
                  <SelectItem value="10+ years">10+ years</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="skills">Required Skills</Label>
              <Textarea
                id="skills"
                placeholder="e.g. JavaScript, React, Node.js"
                rows={4}
                value={skills}
                onChange={(e) => setSkills(e.target.value)}
              />
              <p className="text-xs text-gray-500">Separate skills with commas</p>
            </div>
          </CardContent>
          
          <CardFooter>
            <Button
              onClick={handleGenerate}
              className="w-full"
              disabled={!title || !department || !experience || !skills || isGenerating}
            >
              {isGenerating ? (
                <>
                  <Loader className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <FileText className="mr-2 h-4 w-4" />
                  Generate Job Description
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
        
        {/* Generated Content */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-medium text-gray-700">
              Generated Job Description
            </CardTitle>
          </CardHeader>
          
          <CardContent className="space-y-4">
            {!generatedDescription ? (
              <div className="text-center py-8 text-gray-500">
                <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>Your AI-generated job description will appear here.</p>
                <p className="text-sm mt-2">Fill in the form and click "Generate"</p>
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <Label>Job Title</Label>
                  <p className="text-lg font-medium text-gray-800">{title}</p>
                </div>
                
                <div className="space-y-2">
                  <Label>Description</Label>
                  <div className="p-3 bg-gray-50 rounded-md text-gray-700">
                    {generatedDescription}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Requirements</Label>
                  <div 
                    className="p-3 bg-gray-50 rounded-md text-gray-700"
                    dangerouslySetInnerHTML={{ __html: generatedRequirements.replace(/\n/g, '<br/>') }}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Responsibilities</Label>
                  <div 
                    className="p-3 bg-gray-50 rounded-md text-gray-700"
                    dangerouslySetInnerHTML={{ __html: generatedResponsibilities.replace(/\n/g, '<br/>') }}
                  />
                </div>
              </>
            )}
          </CardContent>
          
          <CardFooter>
            <Button
              onClick={handleSave}
              className="w-full"
              disabled={!generatedDescription || saveMutation.isPending}
              variant={generatedDescription ? "default" : "outline"}
            >
              {saveMutation.isPending ? (
                <>
                  <Loader className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Job Description
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default JDGenerator;
