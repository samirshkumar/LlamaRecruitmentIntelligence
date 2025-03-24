import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarIcon, ArrowUpRight, Plus } from "lucide-react";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate, formatTime } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getInitials } from "@/lib/utils";
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
  email: string;
  jobId: number;
}

interface Job {
  id: number;
  title: string;
  department: string;
}

const ScheduledInterviews = () => {
  const { toast } = useToast();
  
  // Fetch all interviews
  const { data: interviews, isLoading: interviewsLoading, isError: interviewsError } = useQuery({
    queryKey: ["/api/interviews"],
  });
  
  // Fetch candidates for reference
  const { data: candidates, isLoading: candidatesLoading, isError: candidatesError } = useQuery({
    queryKey: ["/api/candidates"],
  });
  
  // Fetch jobs for reference
  const { data: jobs, isLoading: jobsLoading, isError: jobsError } = useQuery({
    queryKey: ["/api/jobs"],
  });
  
  if (interviewsError || candidatesError || jobsError) {
    toast({
      title: "Error",
      description: "Failed to load interview data. Please try again.",
      variant: "destructive",
    });
  }
  
  const isLoading = interviewsLoading || candidatesLoading || jobsLoading;
  
  // Filter interviews to only include scheduled ones
  const scheduledInterviews = interviews?.filter((interview: Interview) => 
    interview.status === "scheduled"
  );
  
  // Group interviews by date for better organization
  const groupedInterviews = scheduledInterviews?.reduce((groups: Record<string, Interview[]>, interview: Interview) => {
    const date = new Date(interview.scheduledAt).toDateString();
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(interview);
    return groups;
  }, {});
  
  return (
    <div>
      <BackButton to="/" label="Back to Dashboard" />
      {/* Page header */}
      <div className="pb-5 border-b border-gray-200 sm:flex sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold leading-7 text-gray-700 sm:text-3xl">
            Scheduled Interviews
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            View and manage upcoming interviews
          </p>
        </div>
        <div className="mt-3 flex sm:mt-0 sm:ml-4">
          <Link href="/interview-scheduler">
            <Button className="inline-flex items-center">
              <Plus className="w-4 h-4 mr-2" />
              Schedule Interview
            </Button>
          </Link>
        </div>
      </div>
      
      {/* Interviews by date */}
      <div className="mt-6">
        {isLoading ? (
          <div className="space-y-6">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="shadow-sm opacity-70">
                <CardHeader className="animate-pulse bg-gray-100 h-16" />
                <CardContent className="animate-pulse space-y-3">
                  {[1, 2, 3].map((j) => (
                    <div key={j} className="h-20 bg-gray-200 rounded-md mb-2" />
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : scheduledInterviews?.length > 0 ? (
          <div className="space-y-6">
            {Object.entries(groupedInterviews || {}).map(([date, interviews]) => (
              <Card key={date} className="shadow-sm">
                <CardHeader className="bg-gray-50 py-4">
                  <div className="flex items-center">
                    <CalendarIcon className="w-5 h-5 mr-2 text-primary" />
                    <CardTitle className="text-lg">{date}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="divide-y divide-gray-100">
                  {interviews.map((interview: Interview) => {
                    const candidate = candidates?.find((c: Candidate) => c.id === interview.candidateId);
                    const job = jobs?.find((j: Job) => j.id === interview.jobId);
                    
                    return (
                      <div key={interview.id} className="py-4 flex items-center justify-between">
                        <div className="flex items-center">
                          <Avatar className="h-10 w-10 mr-4">
                            <AvatarFallback>{candidate ? getInitials(candidate.name) : "??"}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-gray-800">{candidate?.name || 'Unknown Candidate'}</p>
                            <p className="text-sm text-gray-500">
                              {job?.title || 'Unknown Position'} • {job?.department || 'Unknown Department'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center">
                          <div className="text-right mr-4">
                            <p className="font-medium text-gray-800">{formatTime(new Date(interview.scheduledAt))}</p>
                            <Badge variant="outline">{interview.status}</Badge>
                          </div>
                          <Link href={`/interview-agent?id=${interview.id}`}>
                            <Button variant="ghost" size="sm">
                              <ArrowUpRight className="w-4 h-4 mr-1" />
                              Conduct
                            </Button>
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <h3 className="mt-2 text-lg font-medium text-gray-700">No scheduled interviews</h3>
            <p className="mt-1 text-sm text-gray-500">Schedule interviews with your candidates</p>
            <div className="mt-6">
              <Link href="/interview-scheduler">
                <Button className="inline-flex items-center">
                  <Plus className="w-4 h-4 mr-2" />
                  Schedule Interview
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ScheduledInterviews;