import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getTimeAgo, getStatusColor } from "@/lib/utils";
import { Link } from "wouter";
import {
  FileText,
  Star,
  Mail,
  MessageSquare,
  ThumbsUp,
  AlertCircle
} from "lucide-react";

interface Activity {
  id: number;
  agent: string;
  action: string;
  details: string;
  createdAt: string;
}

interface RecentActivitiesProps {
  activities: Activity[];
}

const getAgentIcon = (agent: string) => {
  const icons: Record<string, React.ReactNode> = {
    "JD Generator": <FileText className="text-white text-sm" />,
    "Resume Ranker": <Star className="text-white text-sm" />,
    "Email Automation": <Mail className="text-white text-sm" />,
    "Interview Agent": <MessageSquare className="text-white text-sm" />,
    "Hire Recommendation": <ThumbsUp className="text-white text-sm" />,
    "Sentiment Analyzer": <AlertCircle className="text-white text-sm" />
  };
  
  return icons[agent] || <AlertCircle className="text-white text-sm" />;
};

const getAgentColor = (agent: string) => {
  const colors: Record<string, string> = {
    "JD Generator": "bg-primary",
    "Resume Ranker": "bg-pink-500",
    "Email Automation": "bg-blue-500",
    "Interview Agent": "bg-yellow-500",
    "Hire Recommendation": "bg-green-500",
    "Sentiment Analyzer": "bg-purple-500"
  };
  
  return colors[agent] || "bg-gray-500";
};

const RecentActivities = ({ activities }: RecentActivitiesProps) => {
  return (
    <Card className="shadow-sm">
      <CardHeader className="border-b">
        <CardTitle className="text-lg font-medium text-gray-700">
          Recent AI Agent Activities
        </CardTitle>
      </CardHeader>
      
      <CardContent className="p-0">
        <ul className="divide-y divide-gray-200">
          {activities.length === 0 ? (
            <li className="py-6 px-6 text-center text-gray-500">
              No recent activities
            </li>
          ) : (
            activities.map((activity) => (
              <li key={activity.id} className="block hover:bg-gray-50">
                <div className="px-6 py-4">
                  <div className="flex items-center">
                    <div className={`flex-shrink-0 h-10 w-10 rounded-full ${getAgentColor(activity.agent)} flex items-center justify-center`}>
                      {getAgentIcon(activity.agent)}
                    </div>
                    <div className="ml-4">
                      <div className="font-medium text-gray-700">{activity.agent}</div>
                      <div className="text-sm text-gray-500">{activity.details}</div>
                    </div>
                    <div className="ml-auto text-sm text-gray-400">
                      {getTimeAgo(activity.createdAt)}
                    </div>
                  </div>
                </div>
              </li>
            ))
          )}
        </ul>
      </CardContent>
      
      <CardFooter className="bg-gray-50 py-4 border-t border-gray-200">
        <Link href="/activity-log">
          <a className="text-sm font-medium text-primary hover:text-primary-light">
            View all activity
          </a>
        </Link>
      </CardFooter>
    </Card>
  );
};

export default RecentActivities;
