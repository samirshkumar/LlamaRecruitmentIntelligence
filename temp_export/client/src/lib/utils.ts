import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return `${formatDate(d)} at ${formatTime(d)}`;
}

export function getTimeAgo(date: Date | string): string {
  const now = new Date();
  const past = typeof date === 'string' ? new Date(date) : date;
  
  const seconds = Math.floor((now.getTime() - past.getTime()) / 1000);
  
  let interval = Math.floor(seconds / 31536000);
  if (interval >= 1) {
    return interval === 1 ? '1 year ago' : `${interval} years ago`;
  }
  
  interval = Math.floor(seconds / 2592000);
  if (interval >= 1) {
    return interval === 1 ? '1 month ago' : `${interval} months ago`;
  }
  
  interval = Math.floor(seconds / 86400);
  if (interval >= 1) {
    return interval === 1 ? '1 day ago' : `${interval} days ago`;
  }
  
  interval = Math.floor(seconds / 3600);
  if (interval >= 1) {
    return interval === 1 ? '1 hour ago' : `${interval} hours ago`;
  }
  
  interval = Math.floor(seconds / 60);
  if (interval >= 1) {
    return interval === 1 ? '1 minute ago' : `${interval} minutes ago`;
  }
  
  return seconds < 5 ? 'just now' : `${Math.floor(seconds)} seconds ago`;
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}

export function getStatusColor(status: string): string {
  const statusMap: Record<string, string> = {
    active: 'bg-blue-500/10 text-blue-500',
    inactive: 'bg-gray-500/10 text-gray-500',
    new: 'bg-purple-500/10 text-purple-500',
    screening: 'bg-yellow-500/10 text-yellow-500',
    interview: 'bg-blue-500/10 text-blue-500',
    hired: 'bg-green-500/10 text-green-500',
    rejected: 'bg-red-500/10 text-red-500',
    scheduled: 'bg-yellow-500/10 text-yellow-500',
    completed: 'bg-green-500/10 text-green-500',
    cancelled: 'bg-red-500/10 text-red-500',
    sent: 'bg-green-500/10 text-green-500',
    failed: 'bg-red-500/10 text-red-500',
    online: 'bg-green-500/10 text-green-500',
    offline: 'bg-red-500/10 text-red-500',
    training: 'bg-yellow-500/10 text-yellow-500',
    'needs attention': 'bg-red-500/10 text-red-500',
    'in progress': 'bg-blue-500/10 text-blue-500',
    'on hold': 'bg-yellow-500/10 text-yellow-500',
    'final stage': 'bg-green-500/10 text-green-500',
  };
  
  return statusMap[status.toLowerCase()] || 'bg-gray-500/10 text-gray-500';
}

export function getInitials(name: string): string {
  if (!name) return '';
  return name
    .split(' ')
    .map(part => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function generateResumePlaceholder(jobTitle: string): string {
  return `Resume for ${jobTitle} position:\n\nJohn Doe\njohndoe@example.com\n(555) 123-4567\n\nSummary:\nExperienced professional with 5+ years in the industry seeking a ${jobTitle} position to leverage my skills and experience.\n\nExperience:\n- Company XYZ (2019-Present): Senior Developer\n- Company ABC (2016-2019): Developer\n\nSkills:\n- JavaScript, TypeScript, React\n- Team leadership\n- Project management`;
}
