"use client"

import { createContext, useContext, useState, useEffect, useCallback } from "react"
import { AuthApiResponse, User } from "@/types/auth"
import axiosInstance from "@/lib/axios";

interface AuthContextType {
    user: User | null;
    isLoading: boolean; // To know when the initial fetch is happening
    isAuthenticated: boolean; // Derived state for convenience
    refetchUser: () => Promise<void>; // Function to manually refetch if needed
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null)
    const [isLoading, setIsLoading] = useState(true)

    const fetchUser = useCallback(async () => {
        setIsLoading(true)
        try {
            const response = await axiosInstance.get("/auth/me")
            const result: AuthApiResponse = response.data

            if (result.success) {
                setUser(result.data?.user || null)
            } else {
                setUser(null)
            }
        } catch (error) {
            console.error("Error fetching user:", error)
            setUser(null)
        } finally {
            setIsLoading(false)
        }
    }, [])

    useEffect(() => {
        console.log("AuthProvider mounted, fetching user...");
        fetchUser();
    }, [])

    const isAuthenticated = !!user && !isLoading;

    return (
        <AuthContext.Provider value={{ user, isLoading, isAuthenticated, refetchUser: fetchUser }}>
            {children}
        </AuthContext.Provider>
    )

}
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
      throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
  };