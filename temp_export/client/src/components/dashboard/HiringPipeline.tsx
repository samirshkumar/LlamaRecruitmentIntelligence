import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getStatusColor } from "@/lib/utils";

interface JobPosition {
  id: number;
  title: string;
  department: string;
  applications: number;
  screening: number;
  interview: number;
  decision: number;
  status: string;
}

interface HiringPipelineProps {
  positions: JobPosition[];
}

const HiringPipeline = ({ positions }: HiringPipelineProps) => {
  const [selectedDepartment, setSelectedDepartment] = useState<string>("all");
  
  const filteredPositions = selectedDepartment === "all"
    ? positions
    : positions.filter(pos => pos.department.toLowerCase() === selectedDepartment.toLowerCase());
  
  const departments = ["All", ...Array.from(new Set(positions.map(pos => pos.department)))];
  
  return (
    <Card className="shadow-sm overflow-hidden">
      <CardHeader className="border-b flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
        <CardTitle className="text-lg font-medium text-gray-700">
          Active Hiring Pipeline
        </CardTitle>
        
        <Select 
          value={selectedDepartment} 
          onValueChange={setSelectedDepartment}
        >
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="All Positions" />
          </SelectTrigger>
          <SelectContent>
            {departments.map((dept) => (
              <SelectItem 
                key={dept.toLowerCase()} 
                value={dept.toLowerCase()}
              >
                {dept}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardHeader>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead>
            <tr>
              <th scope="col" className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Position
              </th>
              <th scope="col" className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Department
              </th>
              <th scope="col" className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Applications
              </th>
              <th scope="col" className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Screening
              </th>
              <th scope="col" className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Interview
              </th>
              <th scope="col" className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Decision
              </th>
              <th scope="col" className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredPositions.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                  No positions found
                </td>
              </tr>
            ) : (
              filteredPositions.map((position) => (
                <tr key={position.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-700">
                    {position.title}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {position.department}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex items-center">
                      <span className="flex-shrink-0 w-10 h-2 bg-primary rounded-full"></span>
                      <span className="ml-3">{position.applications}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex items-center">
                      <span className={`flex-shrink-0 w-10 h-2 ${position.screening > 0 ? 'bg-primary-light' : 'bg-gray-200'} rounded-full`}></span>
                      <span className="ml-3">{position.screening}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex items-center">
                      <span className={`flex-shrink-0 w-10 h-2 ${position.interview > 0 ? 'bg-primary-light' : 'bg-gray-200'} rounded-full`}></span>
                      <span className="ml-3">{position.interview}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex items-center">
                      <span className={`flex-shrink-0 w-10 h-2 ${position.decision > 0 ? 'bg-primary-light' : 'bg-gray-200'} rounded-full`}></span>
                      <span className="ml-3">{position.decision}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(position.status)}`}>
                      {position.status}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      
      <CardFooter className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-between items-center">
        <span className="text-sm text-gray-500">
          Showing {filteredPositions.length} of {positions.length} positions
        </span>
        <div className="flex space-x-2">
          <button className="px-3 py-1 border border-gray-200 rounded-md text-sm text-gray-500 hover:bg-gray-200 focus:outline-none">
            Previous
          </button>
          <button className="px-3 py-1 border border-gray-200 rounded-md text-sm text-gray-500 hover:bg-gray-200 focus:outline-none">
            Next
          </button>
        </div>
      </CardFooter>
    </Card>
  );
};

export default HiringPipeline;
