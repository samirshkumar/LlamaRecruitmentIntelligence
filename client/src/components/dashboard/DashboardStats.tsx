import { Card, CardContent } from "@/components/ui/card";
import { 
  Briefcase, 
  Users, 
  Calendar, 
  CheckCircle 
} from "lucide-react";
import { Link } from "wouter";

interface StatCardProps {
  icon: React.ReactNode;
  iconBgColor: string;
  title: string;
  value: number;
  linkText: string;
  linkUrl: string;
}

const StatCard = ({ 
  icon, 
  iconBgColor, 
  title, 
  value, 
  linkText, 
  linkUrl 
}: StatCardProps) => {
  return (
    <Card className="overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300 transform hover:-translate-y-1 transition-transform duration-300">
      <CardContent className="p-0">
        <div className="p-5">
          <div className="flex items-center">
            <div className={`flex-shrink-0 rounded-md p-3 ${iconBgColor}`}>
              {icon}
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-400 truncate">
                  {title}
                </dt>
                <dd>
                  <div className="text-lg font-medium text-gray-700">{value}</div>
                </dd>
              </dl>
            </div>
          </div>
        </div>
        <div className="bg-gray-50 px-5 py-3">
          <div className="text-sm">
            <Link href={linkUrl}>
              <div className="font-medium text-primary hover:text-primary-light cursor-pointer">
                {linkText}
              </div>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

interface DashboardStatsProps {
  activeJobs: number;
  totalCandidates: number;
  interviewsScheduled: number;
  positionsFilled: number;
}

const DashboardStats = ({ 
  activeJobs, 
  totalCandidates, 
  interviewsScheduled, 
  positionsFilled 
}: DashboardStatsProps) => {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard
        icon={<Briefcase className="h-5 w-5 text-white" />}
        iconBgColor="bg-blue-500"
        title="Active Jobs"
        value={activeJobs}
        linkText="View all"
        linkUrl="/jobs"
      />
      
      <StatCard
        icon={<Users className="h-5 w-5 text-white" />}
        iconBgColor="bg-pink-500"
        title="Total Candidates"
        value={totalCandidates}
        linkText="View all"
        linkUrl="/resume-ranker"
      />
      
      <StatCard
        icon={<Calendar className="h-5 w-5 text-white" />}
        iconBgColor="bg-blue-400"
        title="Interviews Scheduled"
        value={interviewsScheduled}
        linkText="View calendar"
        linkUrl="/interview-scheduler"
      />
      
      <StatCard
        icon={<CheckCircle className="h-5 w-5 text-white" />}
        iconBgColor="bg-green-500"
        title="Positions Filled"
        value={positionsFilled}
        linkText="View details"
        linkUrl="/hire-recommendation"
      />
    </div>
  );
};

export default DashboardStats;
