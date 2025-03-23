import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { formatDate, formatTime, getStatusColor } from "@/lib/utils";

// UI Components
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarIcon, Clock, Loader, CalendarCheck, Users, RefreshCw } from "lucide-react";

interface Candidate {
  id: number;
  name: string;
  email: string;
  status: string;
  jobId: number;
}

interface Job {
  id: number;
  title: string;
  department: string;
}

interface Interview {
  id: number;
  candidateId: number;
  jobId: number;
  scheduledAt: string;
  status: string;
}

const InterviewScheduler = () => {
  const { toast } = useToast();
  
  // Queries
  const { data: candidates, isLoading: isLoadingCandidates } = useQuery({
    queryKey: ["/api/candidates"],
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
  
  const { data: jobs, isLoading: isLoadingJobs } = useQuery({
    queryKey: ["/api/jobs"],
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
  
  const { data: interviews, isLoading: isLoadingInterviews, refetch: refetchInterviews } = useQuery({
    queryKey: ["/api/interviews"],
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
  
  // Form state
  const [selectedCandidateId, setSelectedCandidateId] = useState<number | "">("");
  const [selectedJobId, setSelectedJobId] = useState<number | "">("");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState("");
  
  // Tab state
  const [activeTab, setActiveTab] = useState("schedule");
  
  // Schedule interview mutation
  const scheduleMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/schedule-interview", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Interview scheduled",
        description: "The interview has been scheduled successfully.",
      });
      
      // Reset form
      setSelectedCandidateId("");
      setSelectedJobId("");
      setSelectedDate(undefined);
      setSelectedTime("");
      
      // Refresh interviews
      refetchInterviews();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to schedule interview: " + error,
        variant: "destructive",
      });
    },
  });
  
  const handleScheduleInterview = () => {
    if (!selectedCandidateId || !selectedJobId || !selectedDate || !selectedTime) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }
    
    // Combine date and time into a single Date object
    const [hours, minutes] = selectedTime.split(":").map(Number);
    const scheduledAt = new Date(selectedDate);
    scheduledAt.setHours(hours, minutes);
    
    scheduleMutation.mutate({
      candidateId: selectedCandidateId,
      jobId: selectedJobId,
      scheduledAt: scheduledAt.toISOString()
    });
  };
  
  const getCandidateName = (candidateId: number) => {
    const candidate = candidates?.find((c: Candidate) => c.id === candidateId);
    return candidate ? candidate.name : "Unknown Candidate";
  };
  
  const getJobTitle = (jobId: number) => {
    const job = jobs?.find((j: Job) => j.id === jobId);
    return job ? job.title : "Unknown Position";
  };
  
  // Generate time slots
  const generateTimeSlots = () => {
    const slots = [];
    
    for (let hour = 9; hour <= 17; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const formattedHour = hour.toString().padStart(2, "0");
        const formattedMinute = minute.toString().padStart(2, "0");
        slots.push(`${formattedHour}:${formattedMinute}`);
      }
    }
    
    return slots;
  };
  
  const timeSlots = generateTimeSlots();
  
  // Filter eligible candidates (those in screening or interview status)
  const eligibleCandidates = candidates?.filter(
    (candidate: Candidate) => candidate.status === "new" || candidate.status === "screening" || candidate.status === "interview"
  );
  
  return (
    <div>
      <div className="pb-5 border-b border-gray-200">
        <h2 className="text-2xl font-bold leading-7 text-gray-700 sm:text-3xl">
          Interview Scheduler
        </h2>
        <p className="mt-2 text-sm text-gray-500">
          Schedule interviews and send automated calendar invites
        </p>
      </div>
      
      <div className="mt-6">
        <Tabs defaultValue="schedule" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="schedule">Schedule Interview</TabsTrigger>
            <TabsTrigger value="upcoming">Upcoming Interviews</TabsTrigger>
          </TabsList>
          
          {/* Schedule Interview Tab */}
          <TabsContent value="schedule">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {/* Scheduling Form */}
              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg font-medium text-gray-700">
                    Schedule New Interview
                  </CardTitle>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="candidate">Select Candidate</Label>
                    <Select value={selectedCandidateId.toString()} onValueChange={(value) => setSelectedCandidateId(value ? parseInt(value) : "")}>
                      <SelectTrigger id="candidate">
                        <SelectValue placeholder="Select a candidate" />
                      </SelectTrigger>
                      <SelectContent>
                        {isLoadingCandidates ? (
                          <div className="p-2 text-center">Loading candidates...</div>
                        ) : eligibleCandidates?.length === 0 ? (
                          <div className="p-2 text-center">No eligible candidates</div>
                        ) : (
                          eligibleCandidates?.map((candidate: Candidate) => (
                            <SelectItem key={candidate.id} value={candidate.id.toString()}>
                              {candidate.name} - {candidate.email}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="job">Select Position</Label>
                    <Select value={selectedJobId.toString()} onValueChange={(value) => setSelectedJobId(value ? parseInt(value) : "")}>
                      <SelectTrigger id="job">
                        <SelectValue placeholder="Select a position" />
                      </SelectTrigger>
                      <SelectContent>
                        {isLoadingJobs ? (
                          <div className="p-2 text-center">Loading positions...</div>
                        ) : (
                          jobs?.map((job: Job) => (
                            <SelectItem key={job.id} value={job.id.toString()}>
                              {job.title} - {job.department}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Select Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left font-normal"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {selectedDate ? formatDate(selectedDate) : "Select date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={selectedDate}
                          onSelect={setSelectedDate}
                          initialFocus
                          disabled={(date) => {
                            const today = new Date();
                            today.setHours(0, 0, 0, 0);
                            return date < today || date.getDay() === 0 || date.getDay() === 6;
                          }}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="time">Select Time</Label>
                    <Select value={selectedTime} onValueChange={setSelectedTime}>
                      <SelectTrigger id="time">
                        <SelectValue placeholder="Select time">
                          {selectedTime ? (
                            <div className="flex items-center">
                              <Clock className="mr-2 h-4 w-4" />
                              {selectedTime}
                            </div>
                          ) : (
                            "Select time"
                          )}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {timeSlots.map((time) => (
                          <SelectItem key={time} value={time}>
                            {time}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
                
                <CardFooter>
                  <Button
                    onClick={handleScheduleInterview}
                    className="w-full"
                    disabled={!selectedCandidateId || !selectedJobId || !selectedDate || !selectedTime || scheduleMutation.isPending}
                  >
                    {scheduleMutation.isPending ? (
                      <>
                        <Loader className="mr-2 h-4 w-4 animate-spin" />
                        Scheduling...
                      </>
                    ) : (
                      <>
                        <CalendarCheck className="mr-2 h-4 w-4" />
                        Schedule Interview
                      </>
                    )}
                  </Button>
                </CardFooter>
              </Card>
              
              {/* Calendar Preview */}
              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg font-medium text-gray-700">
                    Calendar Preview
                  </CardTitle>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {!selectedCandidateId || !selectedJobId || !selectedDate || !selectedTime ? (
                    <div className="text-center py-8 text-gray-500">
                      <CalendarCheck className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p>Complete the form to preview the interview details.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="bg-gray-50 p-4 rounded-md">
                        <div className="flex items-center mb-4">
                          <CalendarCheck className="h-6 w-6 text-primary mr-2" />
                          <h3 className="text-lg font-medium text-gray-700">Interview Details</h3>
                        </div>
                        
                        <div className="space-y-3">
                          <div>
                            <p className="text-sm font-medium text-gray-500">Candidate</p>
                            <p className="text-gray-700">{getCandidateName(selectedCandidateId as number)}</p>
                          </div>
                          
                          <div>
                            <p className="text-sm font-medium text-gray-500">Position</p>
                            <p className="text-gray-700">{getJobTitle(selectedJobId as number)}</p>
                          </div>
                          
                          <div>
                            <p className="text-sm font-medium text-gray-500">Date</p>
                            <p className="text-gray-700">{formatDate(selectedDate as Date)}</p>
                          </div>
                          
                          <div>
                            <p className="text-sm font-medium text-gray-500">Time</p>
                            <p className="text-gray-700">{selectedTime}</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-blue-50 p-4 rounded-md">
                        <p className="text-sm text-blue-700">
                          <strong>Note:</strong> When you schedule this interview, an automated email will be sent to the candidate with the details above and a calendar invitation.
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          {/* Upcoming Interviews Tab */}
          <TabsContent value="upcoming">
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-medium text-gray-700">
                  Interview Calendar
                </CardTitle>
              </CardHeader>
              
              <CardContent>
                {isLoadingInterviews ? (
                  <div className="flex justify-center py-4">
                    <Loader className="h-8 w-8 animate-spin text-gray-400" />
                  </div>
                ) : interviews?.length === 0 ? (
                  <div className="text-center py-4 text-gray-500">
                    <p>No interviews scheduled.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date & Time</TableHead>
                          <TableHead>Candidate</TableHead>
                          <TableHead>Position</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {interviews?.map((interview: Interview) => (
                          <TableRow key={interview.id}>
                            <TableCell>
                              <div className="flex flex-col">
                                <span className="font-medium">{formatDate(interview.scheduledAt)}</span>
                                <span className="text-sm text-gray-500">{formatTime(interview.scheduledAt)}</span>
                              </div>
                            </TableCell>
                            <TableCell>{getCandidateName(interview.candidateId)}</TableCell>
                            <TableCell>{getJobTitle(interview.jobId)}</TableCell>
                            <TableCell>
                              <Badge className={getStatusColor(interview.status)}>
                                {interview.status.charAt(0).toUpperCase() + interview.status.slice(1)}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
              
              <CardFooter className="justify-between">
                <div className="text-sm text-gray-500">
                  {interviews?.length || 0} interviews scheduled
                </div>
                <Button variant="outline" onClick={() => refetchInterviews()}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Refresh
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default InterviewScheduler;
