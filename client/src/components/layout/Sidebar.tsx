import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { useRecruitmentApp } from "@/context";

// Icons
import {
  LayoutDashboard,
  FileText,
  Star,
  Mail,
  Calendar,
  MessageSquare,
  Video,
  ThumbsUp,
  Smile,
  LogOut,
  Menu
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { getInitials } from "@/lib/utils";

interface SidebarItemProps {
  href: string;
  icon: React.ReactNode;
  label: string;
  active?: boolean;
}

const SidebarItem = ({ href, icon, label, active }: SidebarItemProps) => {
  return (
    <Link href={href}>
      <div
        className={cn(
          "flex items-center py-3 px-4 rounded-md font-medium cursor-pointer",
          active
            ? "bg-primary-light/10 text-primary-dark border-l-4 border-primary"
            : "text-gray-600 hover:bg-gray-100"
        )}
      >
        <span className="mr-3">{icon}</span>
        {label}
      </div>
    </Link>
  );
};

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar = ({ isOpen, onClose }: SidebarProps) => {
  const [location] = useLocation();
  const { user, logout } = useRecruitmentApp();

  const navigationItems = [
    { href: "/", icon: <LayoutDashboard size={20} />, label: "Dashboard" },
    { href: "/jd-generator", icon: <FileText size={20} />, label: "JD Generator" },
    { href: "/resume-ranker", icon: <Star size={20} />, label: "Resume Ranker" },
    { href: "/email-automation", icon: <Mail size={20} />, label: "Email Automation" },
    { href: "/interview-scheduler", icon: <Calendar size={20} />, label: "Interview Scheduler" },
    { href: "/interview-agent", icon: <MessageSquare size={20} />, label: "Interview Agent" },
    { href: "/video-interview", icon: <Video size={20} />, label: "Video Interview" },
    { href: "/hire-recommendation", icon: <ThumbsUp size={20} />, label: "Hire Recommendation" },
    { href: "/sentiment-analyzer", icon: <Smile size={20} />, label: "Sentiment Analyzer" }
  ];

  return (
    <>
      {/* Mobile sidebar backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 md:hidden z-40"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <div
        className={cn(
          "fixed md:sticky top-0 h-screen bg-white shadow-md z-50 transition-transform duration-300 md:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full",
          "flex flex-col w-64 flex-shrink-0"
        )}
      >
        {/* Logo */}
        <div className="flex items-center justify-center h-16 px-4 bg-primary">
          <div className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-6 h-6 text-white mr-2 fill-current">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
            </svg>
            <h1 className="text-white font-bold text-lg">Llama Recruit</h1>
          </div>
        </div>
        
        {/* Navigation */}
        <div className="flex flex-col flex-grow pt-5 pb-4 overflow-y-auto">
          <nav className="flex-1 px-2 space-y-1">
            {navigationItems.map((item) => (
              <SidebarItem
                key={item.href}
                href={item.href}
                icon={item.icon}
                label={item.label}
                active={location === item.href}
              />
            ))}
          </nav>
        </div>
        
        {/* User profile */}
        {user && (
          <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
            <div className="flex items-center">
              <div>
                <Avatar>
                  <AvatarImage src={user.avatarUrl} alt={user.fullName} />
                  <AvatarFallback>{getInitials(user.fullName)}</AvatarFallback>
                </Avatar>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-700">{user.fullName}</p>
                <p className="text-xs font-medium text-gray-500">{user.role}</p>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                className="ml-auto text-gray-500 hover:text-gray-700"
                onClick={logout}
                title="Logout"
              >
                <LogOut size={18} />
              </Button>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default Sidebar;
