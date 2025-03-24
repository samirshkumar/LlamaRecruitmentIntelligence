import { useQuery } from "@tanstack/react-query";
import { ArrowUpRight, ThumbsUp } from "lucide-react";
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
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getInitials } from "@/lib/utils";

interface Candidate {
  id: number;
  name: string;
  email: string;
  jobId: number;
  status: string;
  createdAt: string;
  score?: number | null;
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
  recommendation?: string;
}

const HiredCandidates = () => {
  const { toast } = useToast();
  
  // Fetch all candidates
  const { data: candidates, isLoading: candidatesLoading, isError: candidatesError } = useQuery({
    queryKey: ["/api/candidates"],
  });
  
  // Fetch jobs for reference
  const { data: jobs, isLoading: jobsLoading, isError: jobsError } = useQuery({
    queryKey: ["/api/jobs"],
  });
  
  // Fetch interviews for recommendation data
  const { data: interviews, isLoading: interviewsLoading, isError: interviewsError } = useQuery({
    queryKey: ["/api/interviews"],
  });
  
  if (candidatesError || jobsError || interviewsError) {
    toast({
      title: "Error",
      description: "Failed to load hired candidates data. Please try again.",
      variant: "destructive",
    });
  }
  
  const isLoading = candidatesLoading || jobsLoading || interviewsLoading;
  
  // Filter candidates to show only hired ones
  const hiredCandidates = candidates?.filter((candidate: Candidate) => 
    candidate.status === "hired"
  );
  
  // Get the most recent interview with recommendation for each candidate
  const getRecommendation = (candidateId: number) => {
    const candidateInterviews = interviews?.filter((interview: Interview) => 
      interview.candidateId === candidateId && interview.recommendation
    );
    
    if (candidateInterviews?.length > 0) {
      // Sort by most recent and get the recommendation
      return candidateInterviews.sort((a, b) => 
        new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime()
      )[0].recommendation;
    }
    
    return null;
  };
  
  return (
    <div>
      {/* Page header */}
      <div className="pb-5 border-b border-gray-200">
        <h2 className="text-2xl font-bold leading-7 text-gray-700 sm:text-3xl">
          Hired Candidates
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          View and manage candidates who have been hired
        </p>
      </div>
      
      {/* Hired candidates grid */}
      <div className="mt-6">
        {isLoading ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="shadow-sm hover:shadow-md transition-shadow duration-300 opacity-70">
                <CardHeader className="animate-pulse bg-gray-100 h-24" />
                <CardContent className="animate-pulse space-y-3">
                  <div className="h-4 bg-gray-200 rounded-md" />
                  <div className="h-4 bg-gray-200 rounded-md w-3/4" />
                  <div className="h-20 bg-gray-200 rounded-md" />
                </CardContent>
                <CardFooter className="animate-pulse bg-gray-50 h-14" />
              </Card>
            ))}
          </div>
        ) : hiredCandidates?.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {hiredCandidates.map((candidate: Candidate) => {
              const job = jobs?.find((j: Job) => j.id === candidate.jobId);
              const recommendation = getRecommendation(candidate.id);
              
              return (
                <Card 
                  key={candidate.id} 
                  className="shadow-sm hover:shadow-md transition-shadow duration-300 transform hover:-translate-y-1 transition-transform duration-300"
                >
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start mb-2">
                      <Badge className="bg-green-500 hover:bg-green-600">
                        Hired
                      </Badge>
                      {candidate.score !== null && (
                        <Badge variant="outline" className="ml-2">
                          Score: {candidate.score}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center">
                      <Avatar className="h-10 w-10 mr-3">
                        <AvatarFallback>{getInitials(candidate.name)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="text-lg">{candidate.name}</CardTitle>
                        <CardDescription className="text-xs mt-1">{candidate.email}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="pb-4">
                    <div className="mb-3">
                      <span className="text-xs font-medium text-gray-500">Position</span>
                      <p className="text-sm font-medium">{job?.title || 'Unknown position'}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {job?.department || 'Unknown department'}
                      </p>
                    </div>
                    
                    {recommendation && (
                      <div className="mt-4 bg-green-50 p-3 rounded-md border border-green-100">
                        <div className="flex items-center mb-1">
                          <ThumbsUp className="w-4 h-4 text-green-600 mr-1" />
                          <span className="text-xs font-medium text-green-600">Recommendation</span>
                        </div>
                        <p className="text-sm text-gray-700">{recommendation}</p>
                      </div>
                    )}
                  </CardContent>
                  
                  <CardFooter className="bg-gray-50 flex justify-between items-center">
                    <div className="text-xs text-gray-500">
                      Hired on {formatDate(new Date(candidate.createdAt))}
                    </div>
                    <Link href={`/hire-recommendation?id=${candidate.id}`}>
                      <Button variant="ghost" size="sm" className="text-primary">
                        <ArrowUpRight className="w-4 h-4 mr-1" />
                        Details
                      </Button>
                    </Link>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <h3 className="mt-2 text-lg font-medium text-gray-700">No hired candidates yet</h3>
            <p className="mt-1 text-sm text-gray-500">
              Candidates who receive a "hire" recommendation will appear here
            </p>
            <div className="mt-6">
              <Link href="/hire-recommendation">
                <Button>
                  View Hiring Recommendations
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HiredCandidates;