import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Plus, ArrowUpRight } from "lucide-react";
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
import { formatDate } from "@/lib/utils";
import { getStatusColor } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getInitials } from "@/lib/utils";

interface Candidate {
  id: number;
  name: string;
  email: string;
  jobId: number;
  status: string;
  score: number | null;
  resumeText: string;
  createdAt: string;
}

interface Job {
  id: number;
  title: string;
  department: string;
}

const Candidates = () => {
  const { toast } = useToast();
  
  // Query to fetch candidates
  const { data: candidates, isLoading: candidatesLoading, isError: candidatesError } = useQuery({
    queryKey: ["/api/candidates"],
  });
  
  // Query to fetch jobs for reference
  const { data: jobs, isLoading: jobsLoading, isError: jobsError } = useQuery({
    queryKey: ["/api/jobs"],
  });
  
  if (candidatesError || jobsError) {
    toast({
      title: "Error",
      description: "Failed to load candidate data. Please try again.",
      variant: "destructive",
    });
  }
  
  const isLoading = candidatesLoading || jobsLoading;
  
  return (
    <div>
      {/* Page header */}
      <div className="pb-5 border-b border-gray-200 sm:flex sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold leading-7 text-gray-700 sm:text-3xl">
            All Candidates
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            View and manage candidates in your recruitment pipeline
          </p>
        </div>
        <div className="mt-3 flex sm:mt-0 sm:ml-4">
          <Link href="/resume-ranker">
            <Button className="inline-flex items-center">
              <Plus className="w-4 h-4 mr-2" />
              Add Candidate
            </Button>
          </Link>
        </div>
      </div>
      
      {/* Candidates grid */}
      <div className="mt-6">
        {isLoading ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="shadow-sm hover:shadow-md transition-shadow duration-300 opacity-70">
                <CardHeader className="animate-pulse bg-gray-100 h-24" />
                <CardContent className="animate-pulse space-y-3">
                  <div className="h-4 bg-gray-200 rounded-md" />
                  <div className="h-4 bg-gray-200 rounded-md w-3/4" />
                </CardContent>
                <CardFooter className="animate-pulse bg-gray-50 h-14" />
              </Card>
            ))}
          </div>
        ) : candidates && candidates.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {candidates.map((candidate: Candidate) => {
              const job = jobs?.find((j: Job) => j.id === candidate.jobId);
              
              return (
                <Card 
                  key={candidate.id} 
                  className="shadow-sm hover:shadow-md transition-shadow duration-300 transform hover:-translate-y-1 transition-transform duration-300"
                >
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start mb-2">
                      <Badge className={getStatusColor(candidate.status)}>
                        {candidate.status}
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
                  
                  <CardContent className="pb-2">
                    <div className="mb-2">
                      <span className="text-xs font-medium text-gray-500">Position</span>
                      <p className="text-sm font-medium">{job?.title || 'Unknown position'}</p>
                    </div>
                    <div>
                      <span className="text-xs font-medium text-gray-500">Department</span>
                      <p className="text-sm font-medium">{job?.department || 'Unknown department'}</p>
                    </div>
                  </CardContent>
                  
                  <CardFooter className="bg-gray-50 flex justify-between items-center">
                    <div className="text-xs text-gray-500">
                      Added {formatDate(new Date(candidate.createdAt))}
                    </div>
                    <Link href={`/resume-ranker?id=${candidate.id}`}>
                      <Button variant="ghost" size="sm" className="text-primary">
                        <ArrowUpRight className="w-4 h-4 mr-1" />
                        View
                      </Button>
                    </Link>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <h3 className="mt-2 text-lg font-medium text-gray-700">No candidates found</h3>
            <p className="mt-1 text-sm text-gray-500">Get started by adding a new candidate</p>
            <div className="mt-6">
              <Link href="/resume-ranker">
                <Button className="inline-flex items-center">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Candidate
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Candidates;