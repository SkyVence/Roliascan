"use client"
import axiosInstance from "@/lib/axios";
import { AuthContextType, UserContextType } from "@/types/context";
import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AxiosError } from 'axios';
import { toast } from "sonner";
import { UseFormReturn } from "react-hook-form";

export const BetterAuthContext = createContext<AuthContextType | undefined>(undefined);

export const BetterAuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<UserContextType | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const router = useRouter();

    const fetchUser = useCallback(async () => {
        setIsLoading(true);

        try {
            const response = await axiosInstance.get("/auth/me");
            const result: UserContextType = response.data;
            setUser(result || null);
        } catch (error) {
            setUser(null);
        } finally {
            if (isLoading) {
                setIsLoading(false);
            }
        }
    }, [isLoading]);

    useEffect(() => {
        fetchUser();
    }, []);

    useEffect(() => {
        const refreshInterval = 10 * 60 * 1000;
        const intervalId = setInterval(() => {
            fetchUser();
        }, refreshInterval);

        return () => {
            clearInterval(intervalId);
        };
    }, [fetchUser]);

    const isAuthenticated = !!user && !isLoading;

    const logout = useCallback(async () => {
        setIsLoading(true);
        try {
            await axiosInstance.post("/auth/logout");
            setUser(null);
            toast.success("Logged out successfully");
        } catch (error) {
            console.error("Error logging out:", error);
        } finally {
            setIsLoading(false);
        }

    }, []);

    const handleAuthAction = useCallback(async <T extends Record<string, any>>(
        endpoint: string,
        payload: T,
        form: UseFormReturn<any>,
        successMessage: string,
        successRedirect: string = '/'
    ) => {
        setIsSubmitting(true);
        form.clearErrors();

        try {
            const response = await axiosInstance.post(endpoint, payload);
            const result: UserContextType = response.data;

            if (result?.userId) {
                 setUser(result);
            } else {
                await fetchUser();
            }

            toast.success(successMessage);

            setTimeout(() => {
                router.push(successRedirect);
            }, 2000);

        } catch (error) {
            let errorMessage = "An unexpected error occurred. Please try again.";

            if (error instanceof AxiosError && error.response) {
                const backendError = error.response.data as { message?: string; statusCode?: number };
                const backendMessage = backendError.message || 'An unknown server error occurred';
                console.error(`Auth action failed (${endpoint}):`, backendMessage, "Status:", error.response.status);

                if (error.response.status === 401 && endpoint === '/auth/login') {
                    errorMessage = backendMessage || "Invalid identifier or password.";
                    form.setError("identifier", { type: "server", message: "" });
                    form.setError("password", { type: "server", message: "" });
                    form.setError("identifier", { type: "server", message: "Invalid credentials" });
                    form.setError("password", { type: "server", message: "Invalid credentials" });

                } else if (error.response.status === 400 && backendMessage) {
                     if (endpoint === '/auth/register') {
                        if (backendMessage.toLowerCase().includes('email')) {
                            form.setError("email", { type: "server", message: backendMessage });
                            errorMessage = "";
                        } else if (backendMessage.toLowerCase().includes('username')) {
                            form.setError("username", { type: "server", message: backendMessage });
                            errorMessage = "";
                        } else {
                            errorMessage = `Action failed: ${backendMessage}`;
                        }
                    } else {
                         errorMessage = `Action failed: ${backendMessage}`;
                    }
                } else {
                    errorMessage = `Action failed: ${backendMessage}`;
                }
            } else {
                console.error(`An unexpected error occurred (${endpoint}):`, error);
            }

            if (errorMessage) {
                 toast.error(errorMessage);
            }
        } finally {
            setIsSubmitting(false);
        }
    }, [fetchUser, router]);

    return (
        <BetterAuthContext.Provider value={{ user, isLoading, isSubmitting, isAuthenticated, refetchUser: fetchUser, logout, handleAuthAction }}>
            {children}
        </BetterAuthContext.Provider>
    )
}

export const useBetterAuth = () => {
    const context = useContext(BetterAuthContext);
    if (context === undefined) {
        throw new Error("useBetterAuth must be used within a BetterAuthProvider");
    }
    return context;
}