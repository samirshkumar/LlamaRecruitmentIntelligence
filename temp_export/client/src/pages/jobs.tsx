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

interface Job {
  id: number;
  title: string;
  department: string;
  description: string;
  requirements: string;
  experience: string;
  status: string;
  createdAt: string;
}

const Jobs = () => {
  const { toast } = useToast();
  
  // Query to fetch jobs
  const { data: jobs, isLoading, isError } = useQuery({
    queryKey: ["/api/jobs"],
  });
  
  if (isError) {
    toast({
      title: "Error",
      description: "Failed to load jobs. Please try again.",
      variant: "destructive",
    });
  }
  
  return (
    <div>
      {/* Page header */}
      <div className="pb-5 border-b border-gray-200 sm:flex sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold leading-7 text-gray-700 sm:text-3xl">
            Job Listings
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Manage your organization's job openings
          </p>
        </div>
        <div className="mt-3 flex sm:mt-0 sm:ml-4">
          <Link href="/jd-generator">
            <Button className="inline-flex items-center">
              <Plus className="w-4 h-4 mr-2" />
              New Job
            </Button>
          </Link>
        </div>
      </div>
      
      {/* Jobs grid */}
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
        ) : jobs && jobs.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {jobs.map((job: Job) => (
              <Card 
                key={job.id} 
                className="shadow-sm hover:shadow-md transition-shadow duration-300 transform hover:-translate-y-1 transition-transform duration-300"
              >
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <Badge variant={job.status === 'active' ? 'default' : 'outline'}>
                      {job.status === 'active' ? 'Active' : job.status}
                    </Badge>
                  </div>
                  <CardTitle className="mt-2 text-xl">{job.title}</CardTitle>
                  <CardDescription>{job.department} • {job.experience}</CardDescription>
                </CardHeader>
                
                <CardContent>
                  <p className="text-gray-600 line-clamp-4">
                    {job.description}
                  </p>
                </CardContent>
                
                <CardFooter className="bg-gray-50 flex justify-between items-center">
                  <div className="text-sm text-gray-500">
                    Posted on {formatDate(new Date(job.createdAt))}
                  </div>
                  <Link href={`/jd-generator?id=${job.id}`}>
                    <Button variant="ghost" size="sm" className="text-primary">
                      <ArrowUpRight className="w-4 h-4 mr-1" />
                      View
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <h3 className="mt-2 text-lg font-medium text-gray-700">No jobs found</h3>
            <p className="mt-1 text-sm text-gray-500">Get started by creating a new job description</p>
            <div className="mt-6">
              <Link href="/jd-generator">
                <Button className="inline-flex items-center">
                  <Plus className="w-4 h-4 mr-2" />
                  New Job
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Jobs;