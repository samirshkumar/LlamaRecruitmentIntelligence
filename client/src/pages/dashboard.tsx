import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";

// Dashboard Components
import DashboardStats from "@/components/dashboard/DashboardStats";
import HiringPipeline from "@/components/dashboard/HiringPipeline";

const Dashboard = () => {
  const { toast } = useToast();
  
  // Query to fetch dashboard data
  const { data, isError } = useQuery({
    queryKey: ["/api/dashboard"],
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
  
  // Mock hiring pipeline data
  const hiringPipeline = [
    {
      id: 1,
      title: "Senior Software Engineer",
      department: "Engineering",
      applications: 32,
      screening: 18,
      interview: 7,
      decision: 2,
      status: "In Progress",
    },
    {
      id: 2,
      title: "UX Designer",
      department: "Design",
      applications: 24,
      screening: 14,
      interview: 10,
      decision: 4,
      status: "In Progress",
    },
    {
      id: 3,
      title: "Product Manager",
      department: "Product",
      applications: 18,
      screening: 12,
      interview: 8,
      decision: 5,
      status: "Final Stage",
    },
    {
      id: 4,
      title: "Marketing Specialist",
      department: "Marketing",
      applications: 12,
      screening: 8,
      interview: 4,
      decision: 2,
      status: "On Hold",
    },
  ];
  
  // Stats data
  const statsData = {
    activeJobs: data?.stats?.jobs?.active || 12,
    totalCandidates: data?.stats?.candidates?.total || 86,
    interviewsScheduled: data?.stats?.interviews?.scheduled || 24,
    positionsFilled: data?.stats?.candidates?.hired || 8,
  };
  
  if (isError) {
    toast({
      title: "Error",
      description: "Failed to load dashboard data. Please try again.",
      variant: "destructive",
    });
  }
  
  return (
    <div>
      {/* Page header */}
      <div className="pb-5 border-b border-gray-200 sm:flex sm:items-center sm:justify-between">
        <h2 className="text-2xl font-bold leading-7 text-gray-700 sm:text-3xl">
          Dashboard
        </h2>
        <div className="mt-3 flex sm:mt-0 sm:ml-4">
          <Link href="/jd-generator">
            <Button className="inline-flex items-center">
              <Plus className="w-4 h-4 mr-2" />
              New Job
            </Button>
          </Link>
        </div>
      </div>
      
      {/* Dashboard Stats */}
      <div className="mt-6">
        <DashboardStats
          activeJobs={statsData.activeJobs}
          totalCandidates={statsData.totalCandidates}
          interviewsScheduled={statsData.interviewsScheduled}
          positionsFilled={statsData.positionsFilled}
        />
      </div>
      
      {/* Hiring Pipeline */}
      <div className="mt-8">
        <HiringPipeline positions={hiringPipeline} />
      </div>
    </div>
  );
};

export default Dashboard;
