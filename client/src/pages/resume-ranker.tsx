import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { truncateText, getStatusColor, generateResumePlaceholder } from "@/lib/utils";

// UI Components
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Loader, Upload, Star, List, RefreshCw } from "lucide-react";

interface Resume {
  id?: number;
  name: string;
  email: string;
  phone?: string;
  resumeText: string;
  resumeUrl?: string;
  score?: number;
  matchedSkills?: string[];
  missingSkills?: string[];
}

interface RankedResume extends Resume {
  matchScore: number;
}

const ResumeRanker = () => {
  const { toast } = useToast();
  
  // Jobs query
  const { data: jobs, isLoading: isLoadingJobs } = useQuery({
    queryKey: ["/api/jobs"],
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Form state
  const [selectedJobId, setSelectedJobId] = useState<number | "">("");
  const [resumeText, setResumeText] = useState("");
  const [candidateName, setCandidateName] = useState("");
  const [candidateEmail, setCandidateEmail] = useState("");
  const [candidatePhone, setCandidatePhone] = useState("");
  
  // Ranked resumes state
  const [rankedResumes, setRankedResumes] = useState<RankedResume[]>([]);
  
  // Rank resumes mutation
  const rankMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/resume-ranker", data);
      return response.json();
    },
    onSuccess: (data) => {
      setRankedResumes(data);
      toast({
        title: "Success",
        description: `${data.length} resumes have been ranked against the job description.`,
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to rank resumes: " + error,
        variant: "destructive",
      });
    },
  });
  
  const handleRankResumes = () => {
    if (!selectedJobId) {
      toast({
        title: "Missing job",
        description: "Please select a job to rank resumes against.",
        variant: "destructive",
      });
      return;
    }
    
    if (!resumeText || !candidateName || !candidateEmail) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }
    
    // Create the resume object
    const resume: Resume = {
      name: candidateName,
      email: candidateEmail,
      phone: candidatePhone,
      resumeText
    };
    
    // Get the selected job
    const selectedJob = jobs?.find((job: any) => job.id === selectedJobId);
    
    rankMutation.mutate({
      jobId: selectedJobId,
      resumes: [resume],
      jobDescription: selectedJob?.description
    });
  };
  
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    // In a real implementation, we would parse the resume file
    // For now, we'll just use the file name as the candidate name
    // and generate a placeholder resume text
    
    const nameFromFile = file.name.replace(/\.[^/.]+$/, "");
    setCandidateName(nameFromFile);
    
    const selectedJob = jobs?.find((job: any) => job.id === selectedJobId);
    if (selectedJob) {
      setResumeText(generateResumePlaceholder(selectedJob.title));
    } else {
      setResumeText(generateResumePlaceholder("this"));
    }
    
    toast({
      title: "Resume uploaded",
      description: `${file.name} has been processed.`,
    });
  };
  
  const handleJobChange = (value: string) => {
    setSelectedJobId(value ? parseInt(value) : "");
    
    // If we have a candidate name but no resume text yet,
    // generate a placeholder based on the selected job
    if (candidateName && !resumeText) {
      const selectedJob = jobs?.find((job: any) => job.id === parseInt(value));
      if (selectedJob) {
        setResumeText(generateResumePlaceholder(selectedJob.title));
      }
    }
  };
  
  return (
    <div>
      <div className="pb-5 border-b border-gray-200">
        <h2 className="text-2xl font-bold leading-7 text-gray-700 sm:text-3xl">
          Resume Ranker
        </h2>
        <p className="mt-2 text-sm text-gray-500">
          Rank resumes against job descriptions using Llama 3.x AI
        </p>
      </div>
      
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Input Form */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-medium text-gray-700">
              Rank Resumes
            </CardTitle>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="job">Select Job</Label>
              <Select value={selectedJobId.toString()} onValueChange={handleJobChange}>
                <SelectTrigger id="job">
                  <SelectValue placeholder="Select a job" />
                </SelectTrigger>
                <SelectContent>
                  {isLoadingJobs ? (
                    <div className="p-2 text-center">Loading jobs...</div>
                  ) : (
                    jobs?.map((job: any) => (
                      <SelectItem key={job.id} value={job.id.toString()}>
                        {job.title}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Upload Resume</Label>
              <div className="flex w-full items-center justify-center">
                <label
                  htmlFor="dropzone-file"
                  className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100"
                >
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload className="w-8 h-8 mb-2 text-gray-500" />
                    <p className="mb-2 text-sm text-gray-500">
                      <span className="font-semibold">Click to upload</span> or drag and drop
                    </p>
                    <p className="text-xs text-gray-500">PDF, DOCX, or TXT (MAX. 10MB)</p>
                  </div>
                  <input
                    id="dropzone-file"
                    type="file"
                    accept=".pdf,.docx,.txt"
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                </label>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="name">Candidate Name</Label>
              <Input
                id="name"
                placeholder="John Doe"
                value={candidateName}
                onChange={(e) => setCandidateName(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                placeholder="john@example.com"
                type="email"
                value={candidateEmail}
                onChange={(e) => setCandidateEmail(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="phone">Phone (Optional)</Label>
              <Input
                id="phone"
                placeholder="(555) 123-4567"
                value={candidatePhone}
                onChange={(e) => setCandidatePhone(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="resume">Resume Text</Label>
              <Textarea
                id="resume"
                placeholder="Paste resume text here..."
                rows={8}
                value={resumeText}
                onChange={(e) => setResumeText(e.target.value)}
              />
            </div>
          </CardContent>
          
          <CardFooter>
            <Button
              onClick={handleRankResumes}
              className="w-full"
              disabled={!selectedJobId || !resumeText || !candidateName || !candidateEmail || rankMutation.isPending}
            >
              {rankMutation.isPending ? (
                <>
                  <Loader className="mr-2 h-4 w-4 animate-spin" />
                  Ranking Resume...
                </>
              ) : (
                <>
                  <Star className="mr-2 h-4 w-4" />
                  Rank Resume
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
        
        {/* Results */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-medium text-gray-700">
              Ranking Results
            </CardTitle>
          </CardHeader>
          
          <CardContent>
            {rankedResumes.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <List className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>Your ranked resumes will appear here.</p>
                <p className="text-sm mt-2">Submit a resume to see rankings</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Candidate</TableHead>
                      <TableHead>Match Score</TableHead>
                      <TableHead>Matched Skills</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rankedResumes.map((resume) => (
                      <TableRow key={resume.email}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{resume.name}</p>
                            <p className="text-sm text-gray-500">{resume.email}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="flex items-center">
                              <Progress value={resume.matchScore} className="h-2 mr-2" />
                              <span className="text-sm font-medium">{resume.matchScore}%</span>
                            </div>
                            <Badge
                              className={
                                resume.matchScore >= 80
                                  ? getStatusColor("hired")
                                  : resume.matchScore >= 60
                                  ? getStatusColor("interview")
                                  : getStatusColor("screening")
                              }
                            >
                              {resume.matchScore >= 80
                                ? "Strong Match"
                                : resume.matchScore >= 60
                                ? "Good Match"
                                : "Potential Match"}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            {resume.matchedSkills && resume.matchedSkills.length > 0 ? (
                              <div className="mb-2">
                                <p className="text-xs font-medium text-gray-500 mb-1">Matched:</p>
                                <div className="flex flex-wrap gap-1">
                                  {resume.matchedSkills.map((skill) => (
                                    <Badge key={skill} variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                      {skill}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            ) : null}
                            
                            {resume.missingSkills && resume.missingSkills.length > 0 ? (
                              <div>
                                <p className="text-xs font-medium text-gray-500 mb-1">Missing:</p>
                                <div className="flex flex-wrap gap-1">
                                  {resume.missingSkills.map((skill) => (
                                    <Badge key={skill} variant="outline" className="bg-red-50 text-red-700 border-red-200">
                                      {skill}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            ) : null}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
          
          {rankedResumes.length > 0 && (
            <CardFooter>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setRankedResumes([])}
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Reset Results
              </Button>
            </CardFooter>
          )}
        </Card>
      </div>
    </div>
  );
};

export default ResumeRanker;
