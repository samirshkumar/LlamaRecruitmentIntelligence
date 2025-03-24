import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { formatDate, getStatusColor } from "@/lib/utils";

// UI Components
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader, ThumbsUp, ThumbsDown, Check, X, User } from "lucide-react";

interface Interview {
  id: number;
  candidateId: number;
  jobId: number;
  scheduledAt: string;
  status: string;
  transcript?: string;
  feedbackSummary?: string;
  recommendation?: string;
}

interface Candidate {
  id: number;
  name: string;
  email: string;
  jobId: number;
  status: string;
}

interface Job {
  id: number;
  title: string;
  department: string;
}

const HireRecommendation = () => {
  const { toast } = useToast();
  
  // Queries
  const { data: interviews, isLoading: isLoadingInterviews, refetch: refetchInterviews } = useQuery({
    queryKey: ["/api/interviews"],
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
  
  const { data: candidates, isLoading: isLoadingCandidates } = useQuery({
    queryKey: ["/api/candidates"],
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
  
  const { data: jobs, isLoading: isLoadingJobs } = useQuery({
    queryKey: ["/api/jobs"],
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
  
  // State
  const [selectedInterviewId, setSelectedInterviewId] = useState<number | "">("");
  const [recommendation, setRecommendation] = useState<{
    strengths: string[];
    weaknesses: string[];
    recommendation: string;
    summary: string;
  } | null>(null);
  
  // Recommendation mutation
  const recommendationMutation = useMutation({
    mutationFn: async (interviewId: number) => {
      const response = await apiRequest("POST", "/api/hire-recommendation", { interviewId });
      return response.json();
    },
    onSuccess: (data) => {
      setRecommendation(data);
      toast({
        title: "Recommendation generated",
        description: "Hire recommendation has been successfully generated.",
      });
      
      // Refresh interviews to get updated status
      refetchInterviews();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to generate recommendation: " + error,
        variant: "destructive",
      });
    },
  });
  
  // Handlers
  const handleInterviewSelect = (value: string) => {
    const interviewId = value ? parseInt(value) : "";
    setSelectedInterviewId(interviewId);
    setRecommendation(null);
    
    // Check if this interview already has a recommendation
    const interview = interviews?.find((i: Interview) => i.id === interviewId);
    if (interview?.recommendation) {
      // Mock recommendation data based on the stored recommendation
      setRecommendation({
        strengths: ["Strong technical skills", "Good communication", "Problem-solving abilities"],
        weaknesses: ["Limited experience in specific domain", "Could improve cultural fit"],
        recommendation: interview.recommendation,
        summary: interview.feedbackSummary || "No feedback summary available"
      });
    }
  };
  
  const handleGenerateRecommendation = () => {
    if (!selectedInterviewId) {
      toast({
        title: "No interview selected",
        description: "Please select a completed interview first.",
        variant: "destructive",
      });
      return;
    }
    
    recommendationMutation.mutate(selectedInterviewId as number);
  };
  
  // Helper functions
  const getCandidateName = (candidateId: number) => {
    const candidate = candidates?.find((c: Candidate) => c.id === candidateId);
    return candidate ? candidate.name : "Unknown Candidate";
  };
  
  const getCandidateEmail = (candidateId: number) => {
    const candidate = candidates?.find((c: Candidate) => c.id === candidateId);
    return candidate ? candidate.email : "unknown@example.com";
  };
  
  const getJobTitle = (jobId: number) => {
    const job = jobs?.find((j: Job) => j.id === jobId);
    return job ? job.title : "Unknown Position";
  };
  
  // Filter completed interviews without recommendations
  const completedInterviews = interviews?.filter(
    (interview: Interview) => interview.status === "completed"
  );
  
  // Get current interview
  const currentInterview = interviews?.find(
    (interview: Interview) => interview.id === selectedInterviewId
  );
  
  const candidatesWithRecommendations = candidates?.filter(
    (candidate: Candidate) => candidate.status === "hired" || candidate.status === "rejected"
  );
  
  return (
    <div>
      <div className="pb-5 border-b border-gray-200">
        <h2 className="text-2xl font-bold leading-7 text-gray-700 sm:text-3xl">
          Hire Recommendation
        </h2>
        <p className="mt-2 text-sm text-gray-500">
          Generate AI-powered hiring recommendations based on interview transcripts
        </p>
      </div>
      
      <div className="mt-6">
        <Tabs defaultValue="generate">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="generate">Generate Recommendation</TabsTrigger>
            <TabsTrigger value="history">Recommendation History</TabsTrigger>
          </TabsList>
          
          {/* Generate Recommendation Tab */}
          <TabsContent value="generate">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {/* Interview Selection */}
              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg font-medium text-gray-700">
                    Select Interview
                  </CardTitle>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Select value={selectedInterviewId.toString()} onValueChange={handleInterviewSelect}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select completed interview" />
                      </SelectTrigger>
                      <SelectContent>
                        {isLoadingInterviews ? (
                          <div className="p-2 text-center">Loading interviews...</div>
                        ) : completedInterviews?.length === 0 ? (
                          <div className="p-2 text-center">No completed interviews</div>
                        ) : (
                          completedInterviews?.map((interview: Interview) => (
                            <SelectItem key={interview.id} value={interview.id.toString()}>
                              {getCandidateName(interview.candidateId)} - {formatDate(interview.scheduledAt)}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {currentInterview && (
                    <div className="bg-gray-50 p-4 rounded-md">
                      <div className="flex items-center space-x-3 mb-3">
                        <Avatar>
                          <AvatarFallback>
                            {getCandidateName(currentInterview.candidateId)
                              .split(" ")
                              .map((n) => n[0])
                              .join("")
                              .toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-gray-700">{getCandidateName(currentInterview.candidateId)}</p>
                          <p className="text-sm text-gray-500">{getJobTitle(currentInterview.jobId)}</p>
                        </div>
                      </div>
                      
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-500">Interview Date:</span>
                          <span className="text-gray-700">{formatDate(currentInterview.scheduledAt)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Status:</span>
                          <Badge className={getStatusColor(currentInterview.status)}>
                            {currentInterview.status.charAt(0).toUpperCase() + currentInterview.status.slice(1)}
                          </Badge>
                        </div>
                        {currentInterview.recommendation && (
                          <div className="flex justify-between">
                            <span className="text-gray-500">Recommendation:</span>
                            <Badge className={
                              currentInterview.recommendation === "hire"
                                ? getStatusColor("hired")
                                : getStatusColor("rejected")
                            }>
                              {currentInterview.recommendation.charAt(0).toUpperCase() + currentInterview.recommendation.slice(1)}
                            </Badge>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  
                  <Button
                    onClick={handleGenerateRecommendation}
                    className="w-full"
                    disabled={!selectedInterviewId || recommendationMutation.isPending}
                  >
                    {recommendationMutation.isPending ? (
                      <>
                        <Loader className="mr-2 h-4 w-4 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        {currentInterview?.recommendation ? (
                          <>
                            <Check className="mr-2 h-4 w-4" />
                            View Recommendation
                          </>
                        ) : (
                          <>
                            <ThumbsUp className="mr-2 h-4 w-4" />
                            Generate Recommendation
                          </>
                        )}
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
              
              {/* Recommendation Result */}
              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg font-medium text-gray-700">
                    Hire Recommendation
                  </CardTitle>
                </CardHeader>
                
                <CardContent>
                  {!recommendation ? (
                    <div className="text-center py-8 text-gray-500">
                      <ThumbsUp className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p>Select an interview and generate a recommendation to see results.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex justify-center mb-6">
                        <div className={`rounded-full w-24 h-24 flex items-center justify-center ${
                          recommendation.recommendation === "hire"
                            ? "bg-green-100"
                            : "bg-red-100"
                        }`}>
                          {recommendation.recommendation === "hire" ? (
                            <ThumbsUp className={`h-12 w-12 text-green-600`} />
                          ) : (
                            <ThumbsDown className={`h-12 w-12 text-red-600`} />
                          )}
                        </div>
                      </div>
                      
                      <div className="text-center mb-6">
                        <h3 className="text-xl font-bold text-gray-700">
                          {recommendation.recommendation === "hire"
                            ? "Recommended to Hire"
                            : "Not Recommended"}
                        </h3>
                        <p className="text-gray-500">
                          {currentInterview
                            ? `${getCandidateName(currentInterview.candidateId)} for ${getJobTitle(currentInterview.jobId)}`
                            : ""}
                        </p>
                      </div>
                      
                      <div className="space-y-4">
                        <div>
                          <h4 className="font-medium text-gray-700 mb-2">Summary</h4>
                          <p className="text-gray-600 bg-gray-50 p-3 rounded-md">
                            {recommendation.summary}
                          </p>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <h4 className="font-medium text-gray-700 mb-2">Strengths</h4>
                            <ul className="space-y-1">
                              {recommendation.strengths.map((strength, index) => (
                                <li key={index} className="flex items-start">
                                  <Check className="h-4 w-4 text-green-500 mr-2 mt-1" />
                                  <span className="text-gray-600">{strength}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                          
                          <div>
                            <h4 className="font-medium text-gray-700 mb-2">Areas for Improvement</h4>
                            <ul className="space-y-1">
                              {recommendation.weaknesses.map((weakness, index) => (
                                <li key={index} className="flex items-start">
                                  <X className="h-4 w-4 text-red-500 mr-2 mt-1" />
                                  <span className="text-gray-600">{weakness}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          {/* Recommendation History Tab */}
          <TabsContent value="history">
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-medium text-gray-700">
                  Past Recommendations
                </CardTitle>
              </CardHeader>
              
              <CardContent>
                {isLoadingCandidates ? (
                  <div className="flex justify-center py-4">
                    <Loader className="h-8 w-8 animate-spin text-gray-400" />
                  </div>
                ) : candidatesWithRecommendations?.length === 0 ? (
                  <div className="text-center py-4 text-gray-500">
                    <p>No recommendation history available.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Candidate</TableHead>
                          <TableHead>Position</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Recommendation</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {candidatesWithRecommendations?.map((candidate: Candidate) => (
                          <TableRow key={candidate.id}>
                            <TableCell>
                              <div className="flex items-center space-x-3">
                                <Avatar>
                                  <AvatarFallback>
                                    {candidate.name
                                      .split(" ")
                                      .map((n) => n[0])
                                      .join("")
                                      .toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="font-medium text-gray-700">{candidate.name}</p>
                                  <p className="text-sm text-gray-500">{candidate.email}</p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>{getJobTitle(candidate.jobId)}</TableCell>
                            <TableCell>
                              <Badge className={getStatusColor(candidate.status)}>
                                {candidate.status.charAt(0).toUpperCase() + candidate.status.slice(1)}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center">
                                {candidate.status === "hired" ? (
                                  <>
                                    <span className="bg-green-100 p-1 rounded-full mr-2">
                                      <ThumbsUp className="h-4 w-4 text-green-600" />
                                    </span>
                                    <span className="text-green-600 font-medium">Hire</span>
                                  </>
                                ) : (
                                  <>
                                    <span className="bg-red-100 p-1 rounded-full mr-2">
                                      <ThumbsDown className="h-4 w-4 text-red-600" />
                                    </span>
                                    <span className="text-red-600 font-medium">Reject</span>
                                  </>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default HireRecommendation;
