import { ChevronLeft } from "lucide-react";
import { useLocation } from "wouter";
import { Button } from "./button";

interface BackButtonProps {
  to?: string;
  label?: string;
  className?: string;
}

export const BackButton = ({ 
  to, 
  label = "Back", 
  className = "" 
}: BackButtonProps) => {
  const [location, navigate] = useLocation();

  const handleClick = () => {
    if (to) {
      navigate(to);
    } else {
      // If no specific path provided, go back in browser history
      window.history.back();
    }
  };

  return (
    <Button
      variant="ghost"
      onClick={handleClick}
      className={`flex items-center text-gray-600 hover:text-primary px-2 mb-4 ${className}`}
    >
      <ChevronLeft className="h-4 w-4 mr-1" />
      {label}
    </Button>
  );
};