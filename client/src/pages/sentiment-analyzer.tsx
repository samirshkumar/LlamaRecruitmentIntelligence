import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { formatDate, getStatusColor } from "@/lib/utils";

// UI Components
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader, Smile, Frown, Meh, BarChart2, RefreshCw } from "lucide-react";

// Line charts for visualization
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

interface Interview {
  id: number;
  candidateId: number;
  jobId: number;
  scheduledAt: string;
  status: string;
  transcript?: string;
  sentimentScore?: number;
  sentimentAnalysis?: any;
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

const SentimentAnalyzer = () => {
  const { toast } = useToast();
  
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
  const [sentimentAnalysis, setSentimentAnalysis] = useState<any>(null);
  
  // Sentiment analysis mutation
  const sentimentMutation = useMutation({
    mutationFn: async (interviewId: number) => {
      const response = await apiRequest("POST", "/api/sentiment-analysis", { interviewId });
      return response.json();
    },
    onSuccess: (data) => {
      setSentimentAnalysis(data);
      toast({
        title: "Analysis complete",
        description: "Sentiment analysis has been successfully generated.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to analyze sentiment: " + error,
        variant: "destructive",
      });
    },
  });
  
  // Handlers
  const handleInterviewSelect = (value: string) => {
    const interviewId = value ? parseInt(value) : "";
    setSelectedInterviewId(interviewId);
    setSentimentAnalysis(null);
    
    // Check if this interview already has sentiment analysis
    const interview = interviews?.find((i: Interview) => i.id === interviewId);
    if (interview?.sentimentAnalysis) {
      setSentimentAnalysis({
        sentimentScore: interview.sentimentScore,
        sentimentAnalysis: interview.sentimentAnalysis
      });
    }
  };
  
  const handleAnalyzeSentiment = () => {
    if (!selectedInterviewId) {
      toast({
        title: "No interview selected",
        description: "Please select a completed interview first.",
        variant: "destructive",
      });
      return;
    }
    
    sentimentMutation.mutate(selectedInterviewId as number);
  };
  
  // Helper functions
  const getCandidateName = (candidateId: number) => {
    const candidate = candidates?.find((c: Candidate) => c.id === candidateId);
    return candidate ? candidate.name : "Unknown Candidate";
  };
  
  const getJobTitle = (jobId: number) => {
    const job = jobs?.find((j: Job) => j.id === jobId);
    return job ? job.title : "Unknown Position";
  };
  
  const getSentimentLabel = (score: number) => {
    if (score >= 80) return "Very Positive";
    if (score >= 60) return "Positive";
    if (score >= 40) return "Neutral";
    if (score >= 20) return "Negative";
    return "Very Negative";
  };
  
  const getSentimentColor = (score: number) => {
    if (score >= 80) return "bg-green-500 text-white";
    if (score >= 60) return "bg-green-300 text-green-800";
    if (score >= 40) return "bg-blue-300 text-blue-800";
    if (score >= 20) return "bg-orange-300 text-orange-800";
    return "bg-red-300 text-red-800";
  };
  
  // Filter completed interviews
  const completedInterviews = interviews?.filter(
    (interview: Interview) => interview.status === "completed"
  );
  
  // Get current interview
  const currentInterview = interviews?.find(
    (interview: Interview) => interview.id === selectedInterviewId
  );
  
  // Prepare data for pie chart
  const getPieChartData = () => {
    if (!sentimentAnalysis || !sentimentAnalysis.sentimentAnalysis || !sentimentAnalysis.sentimentAnalysis.overall) return [];
    
    const { overall } = sentimentAnalysis.sentimentAnalysis;
    return [
      { name: "Positive", value: Math.round((overall.positive || 0) * 100) },
      { name: "Negative", value: Math.round((overall.negative || 0) * 100) },
      { name: "Neutral", value: Math.round((overall.neutral || 0) * 100) },
    ];
  };
  
  // Prepare data for tone analysis chart
  const getToneChartData = () => {
    if (!sentimentAnalysis || !sentimentAnalysis.sentimentAnalysis || !sentimentAnalysis.sentimentAnalysis.toneAnalysis) return [];
    
    const { toneAnalysis } = sentimentAnalysis.sentimentAnalysis;
    return Object.entries(toneAnalysis).map(([key, value]) => ({
      name: key.charAt(0).toUpperCase() + key.slice(1),
      value: Math.round(((value as number) || 0) * 100),
    }));
  };
  
  // Colors for pie chart
  const COLORS = ["#0088FE", "#FF8042", "#00C49F"];
  
  // Interviews with sentiment analysis
  const interviewsWithSentiment = interviews?.filter(
    (interview: Interview) => interview.status === "completed" && interview.sentimentScore !== undefined
  );
  
  return (
    <div>
      <div className="pb-5 border-b border-gray-200">
        <h2 className="text-2xl font-bold leading-7 text-gray-700 sm:text-3xl">
          Sentiment Analyzer
        </h2>
        <p className="mt-2 text-sm text-gray-500">
          Analyze candidate emotions and confidence during interviews using Llama 3.x AI
        </p>
      </div>
      
      <div className="mt-6">
        <Tabs defaultValue="analyze">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="analyze">Analyze Sentiment</TabsTrigger>
            <TabsTrigger value="history">Analysis History</TabsTrigger>
          </TabsList>
          
          {/* Analyze Sentiment Tab */}
          <TabsContent value="analyze">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {/* Interview Selection */}
              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg font-medium text-gray-700">
                    Select Interview to Analyze
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
                        {currentInterview.sentimentScore !== undefined && (
                          <div className="flex justify-between">
                            <span className="text-gray-500">Sentiment Score:</span>
                            <Badge className={getSentimentColor(currentInterview.sentimentScore)}>
                              {currentInterview.sentimentScore}
                            </Badge>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  
                  <Button
                    onClick={handleAnalyzeSentiment}
                    className="w-full"
                    disabled={!selectedInterviewId || sentimentMutation.isPending}
                  >
                    {sentimentMutation.isPending ? (
                      <>
                        <Loader className="mr-2 h-4 w-4 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        {currentInterview?.sentimentScore !== undefined ? (
                          <>
                            <Smile className="mr-2 h-4 w-4" />
                            View Analysis
                          </>
                        ) : (
                          <>
                            <BarChart2 className="mr-2 h-4 w-4" />
                            Analyze Sentiment
                          </>
                        )}
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
              
              {/* Analysis Result */}
              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg font-medium text-gray-700">
                    Sentiment Analysis Result
                  </CardTitle>
                </CardHeader>
                
                <CardContent>
                  {!sentimentAnalysis ? (
                    <div className="text-center py-8 text-gray-500">
                      <Smile className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p>Select an interview and analyze sentiment to see results.</p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <div className="text-center">
                        <div className="flex justify-center mb-2">
                          {sentimentAnalysis.sentimentScore >= 70 ? (
                            <Smile className="h-10 w-10 text-green-500" />
                          ) : sentimentAnalysis.sentimentScore >= 40 ? (
                            <Meh className="h-10 w-10 text-blue-500" />
                          ) : (
                            <Frown className="h-10 w-10 text-red-500" />
                          )}
                        </div>
                        <h3 className="text-xl font-bold text-gray-700">
                          Overall Sentiment Score: {sentimentAnalysis.sentimentScore}
                        </h3>
                        <Badge className={`mt-2 ${getSentimentColor(sentimentAnalysis.sentimentScore)}`}>
                          {getSentimentLabel(sentimentAnalysis.sentimentScore)}
                        </Badge>
                      </div>
                      
                      <div>
                        <h4 className="font-medium text-gray-700 mb-3">Sentiment Breakdown</h4>
                        <div className="h-64">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={getPieChartData()}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                outerRadius={80}
                                fill="#8884d8"
                                dataKey="value"
                              >
                                {getPieChartData().map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                              </Pie>
                              <Tooltip />
                              <Legend />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="font-medium text-gray-700 mb-3">Tone Analysis</h4>
                        
                        {sentimentAnalysis.sentimentAnalysis.toneAnalysis && (
                          <div className="space-y-3">
                            {Object.entries(sentimentAnalysis.sentimentAnalysis.toneAnalysis).map(([key, value]) => (
                              <div key={key} className="space-y-1">
                                <div className="flex justify-between items-center">
                                  <span className="text-sm capitalize">{key}</span>
                                  <span className="text-sm font-medium">{Math.round((value as number) * 100)}%</span>
                                </div>
                                <Progress value={Math.round((value as number) * 100)} className="h-2" />
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      
                      {sentimentAnalysis.sentimentAnalysis.keyEmotionalIndicators && (
                        <div>
                          <h4 className="font-medium text-gray-700 mb-2">Key Emotional Indicators</h4>
                          <ul className="list-disc list-inside space-y-1 text-gray-600">
                            {sentimentAnalysis.sentimentAnalysis.keyEmotionalIndicators.map((indicator: string, index: number) => (
                              <li key={index}>{indicator}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          {/* Analysis History Tab */}
          <TabsContent value="history">
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-medium text-gray-700">
                  Sentiment Analysis History
                </CardTitle>
              </CardHeader>
              
              <CardContent>
                {isLoadingInterviews ? (
                  <div className="flex justify-center py-4">
                    <Loader className="h-8 w-8 animate-spin text-gray-400" />
                  </div>
                ) : interviewsWithSentiment?.length === 0 ? (
                  <div className="text-center py-4 text-gray-500">
                    <p>No sentiment analysis history available.</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Candidate</TableHead>
                            <TableHead>Position</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Sentiment Score</TableHead>
                            <TableHead>Sentiment</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {interviewsWithSentiment?.map((interview: Interview) => (
                            <TableRow key={interview.id}>
                              <TableCell>
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
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>{getJobTitle(interview.jobId)}</TableCell>
                              <TableCell>{formatDate(interview.scheduledAt)}</TableCell>
                              <TableCell>
                                <div className="flex items-center space-x-2">
                                  <Progress
                                    value={interview.sentimentScore}
                                    className="w-24 h-2"
                                    indicatorClassName={
                                      interview.sentimentScore && interview.sentimentScore >= 70
                                        ? "bg-green-500"
                                        : interview.sentimentScore && interview.sentimentScore >= 40
                                        ? "bg-blue-500"
                                        : "bg-red-500"
                                    }
                                  />
                                  <span className="text-sm font-medium">{interview.sentimentScore}</span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge className={interview.sentimentScore !== undefined ? getSentimentColor(interview.sentimentScore) : ""}>
                                  {interview.sentimentScore !== undefined ? getSentimentLabel(interview.sentimentScore) : "Unknown"}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                    
                    <div className="mt-6">
                      <h4 className="font-medium text-gray-700 mb-3">Sentiment Score Comparison</h4>
                      <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart
                            data={interviewsWithSentiment?.map((interview: Interview) => ({
                              name: getCandidateName(interview.candidateId),
                              score: interview.sentimentScore,
                              date: formatDate(interview.scheduledAt),
                            }))}
                            margin={{
                              top: 5,
                              right: 30,
                              left: 20,
                              bottom: 5,
                            }}
                          >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis domain={[0, 100]} />
                            <Tooltip content={({ active, payload }) => {
                              if (active && payload && payload.length) {
                                return (
                                  <div className="bg-white p-3 border rounded shadow-md">
                                    <p className="font-medium">{payload[0].payload.name}</p>
                                    <p className="text-sm text-gray-500">{payload[0].payload.date}</p>
                                    <p className="font-medium text-primary">Score: {payload[0].value}</p>
                                  </div>
                                );
                              }
                              return null;
                            }} />
                            <Line
                              type="monotone"
                              dataKey="score"
                              stroke="#3f51b5"
                              strokeWidth={2}
                              activeDot={{ r: 8 }}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
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

export default SentimentAnalyzer;
