import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { formatDate, formatTime, getStatusColor } from "@/lib/utils";
import { llamaClient } from "@/lib/llamaClient";

// UI Components
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader, Bot, Send, User, MessageCircle } from "lucide-react";
import { BackButton } from "@/components/ui/back-button";

interface Interview {
  id: number;
  candidateId: number;
  jobId: number;
  scheduledAt: string;
  status: string;
  transcript?: string;
}

interface Candidate {
  id: number;
  name: string;
  jobId: number;
}

interface Job {
  id: number;
  title: string;
}

interface Message {
  type: "ai" | "human";
  content: string;
  isThinking?: boolean;
}

const InterviewAgent = () => {
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Queries
  const { data: interviews, isLoading: isLoadingInterviews } = useQuery({
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
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState("");
  const [userResponse, setUserResponse] = useState("");
  const [isInterviewActive, setIsInterviewActive] = useState(false);
  const [activeTab, setActiveTab] = useState("conduct");
  
  // Start interview mutation
  const startInterviewMutation = useMutation({
    mutationFn: async (interviewId: number) => {
      const response = await apiRequest("POST", "/api/conduct-interview", { interviewId });
      return response.json();
    },
    onSuccess: (data) => {
      setIsInterviewActive(true);
      setCurrentQuestion(data.question);
      setMessages([
        { type: "ai", content: "Welcome to your interview. I'll be asking you some questions about your experience and skills." },
        { type: "ai", content: data.question }
      ]);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to start interview: " + error,
        variant: "destructive",
      });
    },
  });
  
  // Submit response mutation with direct Llama integration
  const submitResponseMutation = useMutation({
    mutationFn: async (data: any) => {
      // First try to use local Llama processing for more interactive experience
      try {
        // Show thinking animation
        setMessages(prevMessages => [
          ...prevMessages,
          { type: "ai", content: "Thinking...", isThinking: true }
        ]);

        // Process via Llama directly for more dynamic responses
        const llamaResponse = await llamaClient.process({
          task: 'suggest-interview-questions',
          inputs: {
            jobTitle: getJobTitle(currentInterview?.jobId || 0),
            previousResponses: data.responses,
            candidateResponse: data.responses[data.responses.length - 1].answer
          }
        });

        // If successful Llama processing, use that response
        if (llamaResponse.success && llamaResponse.data) {
          // Remove thinking message
          setMessages(prevMessages => prevMessages.filter(msg => !msg.isThinking));
          
          // For ongoing interview
          if (data.responses.length < 5) {
            // For variety, sometimes add a follow-up comment before the next question
            const followUp = Math.random() > 0.5 
              ? `That's interesting. ${llamaResponse.data.question}` 
              : llamaResponse.data.question;
              
            setCurrentQuestion(followUp);
            
            // Add the AI message directly here
            setMessages(prevMessages => [
              ...prevMessages.filter(msg => !msg.isThinking),
              { type: "ai", content: followUp }
            ]);
            
            setUserResponse("");
            
            // Return the status but don't include the question
            // since we've already displayed it above
            return { 
              status: "in-progress" 
            };
          } else {
            // End interview after 5 questions
            setIsInterviewActive(false);
            setMessages(prevMessages => [
              ...prevMessages.filter(msg => !msg.isThinking),
              { type: "ai", content: "Thank you for completing the interview! Your responses were insightful. We'll review them and get back to you soon." }
            ]);
            
            toast({
              title: "Interview completed",
              description: "The interview has been successfully completed.",
            });
            
            return { 
              status: "completed"
            };
          }
        }

        // Fallback to server API if Llama processing fails
        const response = await apiRequest("POST", "/api/conduct-interview", data);
        return response.json();
      } catch (error) {
        // Fallback to server API if any error occurs
        console.error("Error in local Llama processing:", error);
        const response = await apiRequest("POST", "/api/conduct-interview", data);
        return response.json();
      }
    },
    onSuccess: (data) => {
      // Remove any thinking messages
      setMessages(prevMessages => prevMessages.filter(msg => !msg.isThinking));
      
      if (data.status === "completed") {
        setIsInterviewActive(false);
        if (!messages.some(m => m.content.includes("Thank you for completing"))) {
          setMessages(prevMessages => [
            ...prevMessages,
            { type: "ai", content: "Thank you for completing the interview! We'll review your responses and get back to you soon." }
          ]);
        }
        
        toast({
          title: "Interview completed",
          description: "The interview has been successfully completed.",
        });
      } else if (data.question && !data.hasOwnProperty('status')) {
        // Only add the message if we didn't already add it in the mutationFn
        // and if we got a response from the server (not our local Llama processing)
        setCurrentQuestion(data.question);
        setMessages(prevMessages => [
          ...prevMessages,
          { type: "ai", content: data.question }
        ]);
      }
      
      setUserResponse("");
    },
    onError: (error) => {
      // Remove thinking message on error
      setMessages(prevMessages => prevMessages.filter(msg => !msg.isThinking));
      
      toast({
        title: "Error",
        description: "Failed to submit response: " + error,
        variant: "destructive",
      });
    },
  });
  
  // Handlers
  const handleInterviewSelect = (value: string) => {
    const interviewId = value ? parseInt(value) : "";
    setSelectedInterviewId(interviewId);
    
    // Reset state
    setMessages([]);
    setCurrentQuestion("");
    setUserResponse("");
    setIsInterviewActive(false);
  };
  
  const handleStartInterview = () => {
    if (!selectedInterviewId) {
      toast({
        title: "No interview selected",
        description: "Please select an interview to begin.",
        variant: "destructive",
      });
      return;
    }
    
    startInterviewMutation.mutate(selectedInterviewId as number);
  };
  
  const handleSendResponse = () => {
    if (!userResponse.trim()) {
      toast({
        title: "Empty response",
        description: "Please enter a response to the question.",
        variant: "destructive",
      });
      return;
    }
    
    // Add user response to messages
    setMessages(prevMessages => [
      ...prevMessages,
      { type: "human", content: userResponse }
    ]);
    
    // Get previous responses
    const previousResponses = [];
    for (let i = 0; i < messages.length; i += 2) {
      if (i + 1 < messages.length) {
        previousResponses.push({
          question: messages[i].content,
          answer: messages[i + 1].content
        });
      }
    }
    
    // Submit response
    submitResponseMutation.mutate({
      interviewId: selectedInterviewId,
      responses: [
        ...previousResponses,
        {
          question: currentQuestion,
          answer: userResponse
        }
      ]
    });
  };
  
  // Auto-scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  
  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  // Get candidate name
  const getCandidateName = (candidateId: number) => {
    const candidate = candidates?.find((c: Candidate) => c.id === candidateId);
    return candidate ? candidate.name : "Unknown Candidate";
  };
  
  // Get job title
  const getJobTitle = (jobId: number) => {
    const job = jobs?.find((j: Job) => j.id === jobId);
    return job ? job.title : "Unknown Position";
  };
  
  // Filter interviews that are scheduled but not completed
  const scheduledInterviews = interviews?.filter(
    (interview: Interview) => interview.status === "scheduled"
  );
  
  // Get current interview details
  const currentInterview = interviews?.find(
    (interview: Interview) => interview.id === selectedInterviewId
  );
  
  const currentCandidate = currentInterview
    ? candidates?.find((c: Candidate) => c.id === currentInterview.candidateId)
    : null;
  
  return (
    <div>
      <BackButton to="/" label="Back to Dashboard" />
      <div className="pb-5 border-b border-gray-200">
        <h2 className="text-2xl font-bold leading-7 text-gray-700 sm:text-3xl">
          Interview Agent
        </h2>
        <p className="mt-2 text-sm text-gray-500">
          Conduct AI-driven interviews using Llama 3.x
        </p>
      </div>
      
      <div className="mt-6">
        <Tabs defaultValue="conduct" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="conduct">Conduct Interview</TabsTrigger>
            <TabsTrigger value="history">Interview History</TabsTrigger>
          </TabsList>
          
          {/* Conduct Interview Tab */}
          <TabsContent value="conduct">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              {/* Interview Selection */}
              <Card className="shadow-sm lg:col-span-1">
                <CardHeader>
                  <CardTitle className="text-lg font-medium text-gray-700">
                    Select Interview
                  </CardTitle>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Select value={selectedInterviewId.toString()} onValueChange={handleInterviewSelect}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select scheduled interview" />
                      </SelectTrigger>
                      <SelectContent>
                        {isLoadingInterviews ? (
                          <div className="p-2 text-center">Loading interviews...</div>
                        ) : scheduledInterviews?.length === 0 ? (
                          <div className="p-2 text-center">No scheduled interviews</div>
                        ) : (
                          scheduledInterviews?.map((interview: Interview) => (
                            <SelectItem key={interview.id} value={interview.id.toString()}>
                              {getCandidateName(interview.candidateId)} - {formatDate(interview.scheduledAt)}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {currentInterview && currentCandidate && (
                    <div className="bg-gray-50 p-4 rounded-md">
                      <div className="flex items-center space-x-3 mb-3">
                        <Avatar>
                          <AvatarFallback>
                            {currentCandidate.name.split(" ").map(n => n[0]).join("").toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-gray-700">{currentCandidate.name}</p>
                          <p className="text-sm text-gray-500">{getJobTitle(currentCandidate.jobId)}</p>
                        </div>
                      </div>
                      
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-500">Date:</span>
                          <span className="text-gray-700">{formatDate(currentInterview.scheduledAt)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Time:</span>
                          <span className="text-gray-700">{formatTime(currentInterview.scheduledAt)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Status:</span>
                          <Badge className={getStatusColor(currentInterview.status)}>
                            {currentInterview.status.charAt(0).toUpperCase() + currentInterview.status.slice(1)}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <Button
                    onClick={handleStartInterview}
                    className="w-full"
                    disabled={!selectedInterviewId || isInterviewActive || startInterviewMutation.isPending}
                  >
                    {startInterviewMutation.isPending ? (
                      <>
                        <Loader className="mr-2 h-4 w-4 animate-spin" />
                        Preparing...
                      </>
                    ) : (
                      <>
                        <MessageCircle className="mr-2 h-4 w-4" />
                        Start Interview
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
              
              {/* Interview Chat */}
              <Card className="shadow-sm lg:col-span-2">
                <CardHeader className="border-b">
                  <CardTitle className="text-lg font-medium text-gray-700">
                    Interview Conversation
                  </CardTitle>
                </CardHeader>
                
                <CardContent className="p-0">
                  {/* Messages Container */}
                  <div className="h-96 overflow-y-auto p-4 space-y-4">
                    {messages.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-center py-8 text-gray-500">
                        <Bot className="h-12 w-12 mb-4 text-gray-300" />
                        <p>Select an interview and click "Start Interview" to begin.</p>
                        <p className="text-sm mt-2">The AI will guide you through the interview process.</p>
                      </div>
                    ) : (
                      messages.map((message, index) => (
                        <div
                          key={index}
                          className={`flex ${message.type === "ai" ? "justify-start" : "justify-end"}`}
                        >
                          <div
                            className={`max-w-3/4 rounded-lg p-3 ${
                              message.type === "ai"
                                ? "bg-gray-100 text-gray-700"
                                : "bg-primary text-white"
                            }`}
                          >
                            <div className="flex items-start">
                              {message.type === "ai" && (
                                <Bot className={`h-5 w-5 mr-2 mt-0.5 ${message.isThinking ? 'animate-pulse text-primary' : ''}`} />
                              )}
                              <div className={message.isThinking ? 'animate-pulse' : ''}>
                                {message.content}
                                {message.isThinking && (
                                  <span className="inline-block ml-1">
                                    <span className="animate-[bounce_1s_ease-in-out_0s_infinite]">.</span>
                                    <span className="animate-[bounce_1s_ease-in-out_0.2s_infinite]">.</span>
                                    <span className="animate-[bounce_1s_ease-in-out_0.4s_infinite]">.</span>
                                  </span>
                                )}
                              </div>
                              {message.type === "human" && (
                                <User className="h-5 w-5 ml-2 mt-0.5" />
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                </CardContent>
                
                <CardFooter className="border-t p-4">
                  <div className="flex w-full space-x-2">
                    <Textarea
                      placeholder="Type your response here..."
                      value={userResponse}
                      onChange={(e) => setUserResponse(e.target.value)}
                      className="flex-grow"
                      disabled={!isInterviewActive || submitResponseMutation.isPending}
                    />
                    <Button
                      onClick={handleSendResponse}
                      disabled={!isInterviewActive || !userResponse.trim() || submitResponseMutation.isPending}
                    >
                      {submitResponseMutation.isPending ? (
                        <Loader className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            </div>
          </TabsContent>
          
          {/* Interview History Tab */}
          <TabsContent value="history">
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-medium text-gray-700">
                  Completed Interviews
                </CardTitle>
              </CardHeader>
              
              <CardContent>
                {isLoadingInterviews ? (
                  <div className="flex justify-center py-4">
                    <Loader className="h-8 w-8 animate-spin text-gray-400" />
                  </div>
                ) : interviews?.filter((i: Interview) => i.status === "completed").length === 0 ? (
                  <div className="text-center py-4 text-gray-500">
                    <p>No completed interviews yet.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {interviews
                      ?.filter((interview: Interview) => interview.status === "completed")
                      .map((interview: Interview) => (
                        <div key={interview.id} className="border rounded-md p-4">
                          <div className="flex justify-between items-start mb-3">
                            <div className="flex items-center space-x-3">
                              <Avatar>
                                <AvatarFallback>
                                  {getCandidateName(interview.candidateId)
                                    .split(" ")
                                    .map((n) => n[0])
                                    .join("")
                                    .toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium text-gray-700">{getCandidateName(interview.candidateId)}</p>
                                <p className="text-sm text-gray-500">{getJobTitle(interview.jobId)}</p>
                              </div>
                            </div>
                            <Badge className={getStatusColor(interview.status)}>
                              {interview.status.charAt(0).toUpperCase() + interview.status.slice(1)}
                            </Badge>
                          </div>
                          
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-500">Date:</span>
                              <span className="text-gray-700">{formatDate(interview.scheduledAt)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-500">Transcript:</span>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-primary hover:text-primary-light"
                                onClick={() => {
                                  // In a real app, this would show the transcript in a modal
                                  toast({
                                    title: "Transcript",
                                    description: "Transcript functionality would be implemented here.",
                                  });
                                }}
                              >
                                View
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
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

export default InterviewAgent;
