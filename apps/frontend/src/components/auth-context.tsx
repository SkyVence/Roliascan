"use client"

import { createContext, useContext, useState, useEffect, useCallback } from "react"
import { AuthApiResponse } from "@/types/auth"
import axiosInstance from "@/lib/axios";

interface AuthContextType {
    user: AuthApiResponse | null;
    isLoading: boolean; // To know when the initial fetch is happening
    isAuthenticated: boolean; // Derived state for convenience
    refetchUser: () => Promise<void>; // Function to manually refetch if needed
}



const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<AuthApiResponse | null>(null)
    const [isLoading, setIsLoading] = useState(true)

    const fetchUser = useCallback(async () => {
        // No need to set loading true for background refresh
        // setIsLoading(true)
        try {
            const response = await axiosInstance.get("/auth/me")
            const result: AuthApiResponse = response.data
            setUser(result || null) // Update user state directly
        } catch (error) {
            // Optionally handle background fetch errors differently, e.g., keep old user state
            setUser(null) // Avoid setting user to null on background refresh failure unless intended
        } finally {
            // Only set initial loading to false once
            if (isLoading) {
                setIsLoading(false)
            }
        }
    }, [isLoading]) // Add isLoading to dependency array

    // Initial fetch on mount
    useEffect(() => {
        fetchUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []) // Keep initial fetch dependencies empty

    // Set up interval for periodic refresh
    useEffect(() => {
        const refreshInterval = 10 * 60 * 1000; // 10 minutes
        console.log(`Setting up user refresh interval (${refreshInterval}ms)`);
        const intervalId = setInterval(() => {
            fetchUser();
        }, refreshInterval);

        // Cleanup function to clear the interval when the component unmounts
        return () => {
            clearInterval(intervalId);
        };
    }, [fetchUser]); // Re-run effect if fetchUser function identity changes (due to useCallback dependencies)

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