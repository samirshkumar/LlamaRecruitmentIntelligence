import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader, RefreshCw, CheckCircle, AlertCircle, Info } from "lucide-react";
import { cn, getStatusColor } from "@/lib/utils";

interface AgentStatus {
  name: string;
  status: "online" | "offline" | "training" | "needs attention";
}

interface AgentStatusCardProps {
  agents: AgentStatus[];
  onRefresh: () => Promise<void>;
}

const getStatusIcon = (status: string) => {
  switch (status) {
    case "online":
      return <CheckCircle size={18} className="text-green-500 mr-2" />;
    case "offline":
      return <AlertCircle size={18} className="text-red-500 mr-2" />;
    case "training":
      return <Info size={18} className="text-yellow-500 mr-2" />;
    case "needs attention":
      return <AlertCircle size={18} className="text-red-500 mr-2" />;
    default:
      return <Info size={18} className="text-gray-500 mr-2" />;
  }
};

const AgentStatusCard = ({ agents, onRefresh }: AgentStatusCardProps) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setIsRefreshing(false);
    }
  };
  
  return (
    <Card className="shadow-sm">
      <CardHeader className="border-b">
        <CardTitle className="text-lg font-medium text-gray-700">
          AI Agents Status
        </CardTitle>
      </CardHeader>
      
      <CardContent className="p-6">
        {agents.length === 0 ? (
          <Alert>
            <AlertDescription>
              No agent status information available
            </AlertDescription>
          </Alert>
        ) : (
          <ul className="space-y-4">
            {agents.map((agent) => (
              <li key={agent.name}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    {getStatusIcon(agent.status)}
                    <span className="text-sm font-medium text-gray-700">{agent.name}</span>
                  </div>
                  <span className={cn(
                    "px-2 py-1 text-xs rounded-full",
                    getStatusColor(agent.status)
                  )}>
                    {agent.status.charAt(0).toUpperCase() + agent.status.slice(1)}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
      
      <CardFooter className="bg-gray-50 px-6 py-4 border-t border-gray-200">
        <Button 
          className="w-full inline-flex justify-center"
          onClick={handleRefresh}
          disabled={isRefreshing}
        >
          {isRefreshing ? (
            <Loader size={18} className="mr-2 animate-spin" />
          ) : (
            <RefreshCw size={18} className="mr-2" />
          )}
          Refresh Agents
        </Button>
      </CardFooter>
    </Card>
  );
};

export default AgentStatusCard;
