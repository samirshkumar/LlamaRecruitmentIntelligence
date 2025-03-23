import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { formatDate, formatTime, getStatusColor } from "@/lib/utils";

// UI Components
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Loader, Video, SkipForward, Play, Pause, Camera, CameraOff, Mic, MicOff } from "lucide-react";

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

interface VideoQuestion {
  question: string;
  answer?: string;
  recordingUrl?: string;
}

const VideoInterview = () => {
  const { toast } = useToast();
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  
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
  const [isInterviewActive, setIsInterviewActive] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState("");
  const [questionNumber, setQuestionNumber] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [questions, setQuestions] = useState<VideoQuestion[]>([]);
  const [activeTab, setActiveTab] = useState("conduct");
  const [isRecording, setIsRecording] = useState(false);
  const [recordedChunks, setRecordedChunks] = useState<BlobPart[]>([]);
  const [recordingTime, setRecordingTime] = useState(0);
  const [recordingInterval, setRecordingInterval] = useState<number | null>(null);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [isMicOn, setIsMicOn] = useState(false);
  
  // Cleanup media resources when component unmounts
  useEffect(() => {
    return () => {
      stopMediaStream();
      if (recordingInterval) {
        clearInterval(recordingInterval);
      }
    };
  }, []);
  
  // Start video interview mutation
  const startInterviewMutation = useMutation({
    mutationFn: async (interviewId: number) => {
      const response = await apiRequest("POST", "/api/video-interview", { interviewId });
      return response.json();
    },
    onSuccess: (data) => {
      setIsInterviewActive(true);
      setCurrentQuestion(data.question);
      setQuestionNumber(data.questionNumber);
      setTotalQuestions(data.totalQuestions);
      setQuestions([{ question: data.question }]);
      
      toast({
        title: "Interview started",
        description: "The video interview has been successfully started.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to start interview: " + error,
        variant: "destructive",
      });
    },
  });
  
  // Submit video response mutation
  const submitResponseMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/video-interview", data);
      return response.json();
    },
    onSuccess: (data) => {
      if (data.status === "completed") {
        setIsInterviewActive(false);
        
        toast({
          title: "Interview completed",
          description: "The video interview has been successfully completed.",
        });
      } else {
        setCurrentQuestion(data.question);
        setQuestionNumber(data.questionNumber);
        setTotalQuestions(data.totalQuestions);
        
        // Add the new question to the list
        setQuestions(prevQuestions => [...prevQuestions, { question: data.question }]);
      }
      
      // Reset recording state
      setIsRecording(false);
      setRecordedChunks([]);
      setRecordingTime(0);
      if (recordingInterval) {
        clearInterval(recordingInterval);
        setRecordingInterval(null);
      }
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to submit response: " + error,
        variant: "destructive",
      });
    },
  });
  
  // Function to start the media stream
  const startMediaStream = async () => {
    try {
      const constraints = {
        video: true,
        audio: true
      };
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      
      setIsCameraOn(true);
      setIsMicOn(true);
      
      return stream;
    } catch (error) {
      console.error("Error accessing media devices:", error);
      toast({
        title: "Camera/Microphone Error",
        description: "Failed to access your camera or microphone. Please check permissions.",
        variant: "destructive",
      });
      return null;
    }
  };
  
  // Function to stop the media stream
  const stopMediaStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
      
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
      
      setIsCameraOn(false);
      setIsMicOn(false);
    }
  };
  
  // Function to toggle camera
  const toggleCamera = () => {
    if (streamRef.current) {
      const videoTracks = streamRef.current.getVideoTracks();
      if (videoTracks.length > 0) {
        const isEnabled = videoTracks[0].enabled;
        videoTracks[0].enabled = !isEnabled;
        setIsCameraOn(!isEnabled);
      }
    }
  };
  
  // Function to toggle microphone
  const toggleMicrophone = () => {
    if (streamRef.current) {
      const audioTracks = streamRef.current.getAudioTracks();
      if (audioTracks.length > 0) {
        const isEnabled = audioTracks[0].enabled;
        audioTracks[0].enabled = !isEnabled;
        setIsMicOn(!isEnabled);
      }
    }
  };
  
  // Function to start recording
  const startRecording = async () => {
    if (!streamRef.current) {
      const stream = await startMediaStream();
      if (!stream) return;
    }
    
    try {
      const options = { mimeType: 'video/webm;codecs=vp9' };
      const mediaRecorder = new MediaRecorder(streamRef.current!, options);
      
      mediaRecorderRef.current = mediaRecorder;
      
      // Set up data handler
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          setRecordedChunks(prev => [...prev, event.data]);
        }
      };
      
      // Start recording
      mediaRecorder.start(1000); // Collect data every second
      setIsRecording(true);
      
      // Start timer
      const interval = window.setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
      
      setRecordingInterval(interval);
      
    } catch (error) {
      console.error("Error starting recording:", error);
      toast({
        title: "Recording Error",
        description: "Failed to start recording. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  // Function to stop recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      // Stop the timer
      if (recordingInterval) {
        clearInterval(recordingInterval);
        setRecordingInterval(null);
      }
    }
  };
  
  // Function to submit the recording
  const submitRecording = () => {
    if (recordedChunks.length === 0) {
      toast({
        title: "No Recording",
        description: "Please record your answer before submitting.",
        variant: "destructive",
      });
      return;
    }
    
    // Create a video blob
    const blob = new Blob(recordedChunks, { type: 'video/webm' });
    
    // Update the current question with the answer
    const updatedQuestions = [...questions];
    updatedQuestions[questionNumber - 1].answer = "Video Response";
    
    // In a real implementation, we would upload the blob to a server
    // and get a URL to store. For this demo, we'll just create a temporary URL
    const videoUrl = URL.createObjectURL(blob);
    updatedQuestions[questionNumber - 1].recordingUrl = videoUrl;
    
    setQuestions(updatedQuestions);
    
    // Submit the response
    submitResponseMutation.mutate({
      interviewId: selectedInterviewId,
      videoResponse: "video_response", // In a real app, this would be the URL to the video
      previousQuestions: updatedQuestions
    });
  };
  
  // Function to skip recording (for demo purposes)
  const skipRecording = () => {
    // Update the current question with a placeholder answer
    const updatedQuestions = [...questions];
    updatedQuestions[questionNumber - 1].answer = "Skipped";
    
    setQuestions(updatedQuestions);
    
    // Submit the response
    submitResponseMutation.mutate({
      interviewId: selectedInterviewId,
      previousQuestions: updatedQuestions
    });
  };
  
  // Handlers
  const handleInterviewSelect = (value: string) => {
    const interviewId = value ? parseInt(value) : "";
    setSelectedInterviewId(interviewId);
    
    // Reset state
    setIsInterviewActive(false);
    setCurrentQuestion("");
    setQuestionNumber(0);
    setTotalQuestions(0);
    setQuestions([]);
    setIsRecording(false);
    setRecordedChunks([]);
    setRecordingTime(0);
    
    if (recordingInterval) {
      clearInterval(recordingInterval);
      setRecordingInterval(null);
    }
    
    stopMediaStream();
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
  
  // Format recording time
  const formatRecordingTime = () => {
    const minutes = Math.floor(recordingTime / 60);
    const seconds = recordingTime % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };
  
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
      <div className="pb-5 border-b border-gray-200">
        <h2 className="text-2xl font-bold leading-7 text-gray-700 sm:text-3xl">
          Video Interview
        </h2>
        <p className="mt-2 text-sm text-gray-500">
          Conduct AI-driven video interviews using Llama 3.x
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
                    <Select 
                      value={selectedInterviewId.toString()} 
                      onValueChange={handleInterviewSelect}
                      disabled={isInterviewActive}
                    >
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
                        <Video className="mr-2 h-4 w-4" />
                        Start Video Interview
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
              
              {/* Video Interview Area */}
              <Card className="shadow-sm lg:col-span-2">
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-lg font-medium text-gray-700">
                      Video Interview
                    </CardTitle>
                    {isInterviewActive && (
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-500">
                          Question {questionNumber} of {totalQuestions}
                        </span>
                        <Progress value={(questionNumber / totalQuestions) * 100} className="w-24 h-2" />
                      </div>
                    )}
                  </div>
                </CardHeader>
                
                <CardContent className="p-0 relative">
                  {/* Video Container */}
                  <div className="aspect-video bg-black relative">
                    {!isInterviewActive ? (
                      <div className="h-full flex flex-col items-center justify-center text-center text-white">
                        <Video className="h-16 w-16 mb-4 text-gray-600" />
                        <p className="text-gray-400">Select an interview and click "Start Video Interview" to begin.</p>
                      </div>
                    ) : (
                      <>
                        <video 
                          ref={videoRef} 
                          autoPlay 
                          muted 
                          playsInline 
                          className="w-full h-full object-cover"
                        />
                        
                        {/* Recording indicator */}
                        {isRecording && (
                          <div className="absolute top-4 right-4 bg-red-600 text-white px-3 py-1 rounded-full flex items-center">
                            <div className="w-3 h-3 bg-white rounded-full mr-2 animate-pulse" />
                            <span>{formatRecordingTime()}</span>
                          </div>
                        )}
                        
                        {/* Question overlay */}
                        <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-75 text-white p-4">
                          <p className="text-sm text-gray-300 mb-1">Question {questionNumber}:</p>
                          <p className="text-lg">{currentQuestion}</p>
                        </div>
                      </>
                    )}
                  </div>
                </CardContent>
                
                <CardFooter className="p-4 border-t">
                  {isInterviewActive ? (
                    <div className="w-full">
                      <div className="flex space-x-2 mb-4">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={toggleCamera}
                          className="flex-shrink-0"
                        >
                          {isCameraOn ? (
                            <Camera className="h-4 w-4" />
                          ) : (
                            <CameraOff className="h-4 w-4" />
                          )}
                        </Button>
                        
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={toggleMicrophone}
                          className="flex-shrink-0"
                        >
                          {isMicOn ? (
                            <Mic className="h-4 w-4" />
                          ) : (
                            <MicOff className="h-4 w-4" />
                          )}
                        </Button>
                        
                        <div className="flex-grow" />
                        
                        {!isRecording ? (
                          <Button
                            onClick={startRecording}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            <Play className="mr-2 h-4 w-4" />
                            Start Recording
                          </Button>
                        ) : (
                          <Button
                            onClick={stopRecording}
                            variant="destructive"
                          >
                            <Pause className="mr-2 h-4 w-4" />
                            Stop Recording
                          </Button>
                        )}
                      </div>
                      
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          onClick={skipRecording}
                          className="flex-1"
                        >
                          <SkipForward className="mr-2 h-4 w-4" />
                          Skip
                        </Button>
                        
                        <Button
                          onClick={submitRecording}
                          disabled={isRecording || recordedChunks.length === 0 || submitResponseMutation.isPending}
                          className="flex-1"
                        >
                          {submitResponseMutation.isPending ? (
                            <Loader className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <>Submit Answer</>
                          )}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-center w-full text-gray-500">
                      Start an interview to enable the video controls.
                    </p>
                  )}
                </CardFooter>
              </Card>
            </div>
          </TabsContent>
          
          {/* Interview History Tab */}
          <TabsContent value="history">
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-medium text-gray-700">
                  Completed Video Interviews
                </CardTitle>
              </CardHeader>
              
              <CardContent>
                {isLoadingInterviews ? (
                  <div className="flex justify-center py-4">
                    <Loader className="h-8 w-8 animate-spin text-gray-400" />
                  </div>
                ) : interviews?.filter((i: Interview) => 
                    i.status === "completed" && i.transcript?.includes('[Video Response]')).length === 0 ? (
                  <div className="text-center py-4 text-gray-500">
                    <p>No completed video interviews found.</p>
                    <p className="text-sm mt-2">Complete a video interview to see it here.</p>
                  </div>
                ) : (
                  <div className="divide-y">
                    {interviews
                      ?.filter((i: Interview) => 
                        i.status === "completed" && i.transcript?.includes('[Video Response]'))
                      .map((interview: Interview) => (
                        <div key={interview.id} className="py-4 first:pt-0 last:pb-0">
                          <div className="flex items-center justify-between">
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
                                <p className="font-medium">{getCandidateName(interview.candidateId)}</p>
                                <p className="text-sm text-gray-500">
                                  {getJobTitle(interview.jobId)} - {formatDate(interview.scheduledAt)}
                                </p>
                              </div>
                            </div>
                            <Badge className={getStatusColor(interview.status)}>
                              {interview.status.charAt(0).toUpperCase() + interview.status.slice(1)}
                            </Badge>
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

export default VideoInterview;