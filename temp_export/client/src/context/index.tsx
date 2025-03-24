import { createContext, useContext, useState, ReactNode } from "react";

interface User {
  id: number;
  username: string;
  fullName: string;
  role: string;
  avatarUrl: string;
}

interface RecruitmentAppContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

// Create a context with default values
const RecruitmentAppContext = createContext<RecruitmentAppContextType>({
  user: null,
  setUser: () => {},
  isAuthenticated: false,
  login: async () => {},
  logout: () => {},
});

// Create a provider component
export function RecruitmentAppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>({
    id: 1,
    username: "jane.smith",
    fullName: "Jane Smith",
    role: "HR Manager",
    avatarUrl: "https://images.unsplash.com/photo-1550525811-e5869dd03032?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
  });

  const isAuthenticated = !!user;

  const login = async (username: string, password: string) => {
    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Login failed");
      }

      const userData: User = await response.json();
      setUser(userData);
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    }
  };

  const logout = () => {
    setUser(null);
  };

  return (
    <RecruitmentAppContext.Provider
      value={{
        user,
        setUser,
        isAuthenticated,
        login,
        logout,
      }}
    >
      {children}
    </RecruitmentAppContext.Provider>
  );
}

// Custom hook to use the context
export function useRecruitmentApp() {
  return useContext(RecruitmentAppContext);
}
