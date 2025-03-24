import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Menu, Search, Bell, HelpCircle } from "lucide-react";

interface TopNavigationProps {
  onMenuClick: () => void;
}

const TopNavigation = ({ onMenuClick }: TopNavigationProps) => {
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleSearchSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // Handle search logic
    console.log(`Searching for: ${searchQuery}`);
  };

  return (
    <div className="relative z-10 flex-shrink-0 flex h-16 bg-white shadow-sm">
      <Button 
        variant="ghost" 
        size="icon" 
        className="md:hidden px-4 text-gray-500" 
        onClick={onMenuClick}
      >
        <Menu />
      </Button>
      
      <div className="flex-1 px-4 flex justify-between">
        <div className="flex-1 flex items-center">
          <div className="max-w-2xl w-full">
            <form onSubmit={handleSearchSubmit}>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <Search size={18} />
                </div>
                <Input
                  type="search"
                  placeholder="Search"
                  className="pl-10"
                  value={searchQuery}
                  onChange={handleSearchChange}
                />
              </div>
            </form>
          </div>
        </div>
        
        <div className="ml-4 flex items-center md:ml-6">
          <Button 
            variant="ghost" 
            size="icon" 
            className="text-gray-500 hover:text-gray-700 rounded-full"
          >
            <Bell size={20} />
          </Button>
          
          <Button 
            variant="ghost" 
            size="icon" 
            className="ml-3 text-gray-500 hover:text-gray-700 rounded-full"
          >
            <HelpCircle size={20} />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default TopNavigation;
