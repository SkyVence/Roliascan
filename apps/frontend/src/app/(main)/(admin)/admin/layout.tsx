"use client";
import { useBetterAuth } from "@/components/authentication/better-context";
import { AnimatedLoader } from "@/components/ui/animated-loader";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
    const { isAuthenticated, isLoading, user } = useBetterAuth();
    const router = useRouter();

    const authorizedRoles = ["admin", "owner"];

    useEffect(() => {
        if (!isLoading) {
            if (!isAuthenticated) {
                router.push("/auth/login");
            }
            if (!authorizedRoles.includes(user?.role || "")) {
                router.push("/");
            }
        }
    }, [isAuthenticated, isLoading, router, user?.role]);

    if (isLoading) {
        return <div className="flex justify-center items-center h-screen">
            <AnimatedLoader type="spinner" />
            <span className="sr-only">Loading...</span>
            <p className="text-gray-500 dark:text-gray-400">Loading...</p>
        </div>
    }
    return <>{children}</>
}
