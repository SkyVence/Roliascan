"use client";
import { useBetterAuth } from "@/components/authentication/better-context";
import { AnimatedLoader } from "@/components/ui/animated-loader";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
    const { isAuthenticated, isLoading } = useBetterAuth();
    const router = useRouter();

    useEffect(() => {
        if (!isLoading) {
            if (isAuthenticated) {
                const redirectTimer = setTimeout(() => {
                    router.push("/");
                }, 50);
                
                return () => clearTimeout(redirectTimer);
            }
        }
    }, [isAuthenticated, isLoading, router]);

    if (isLoading) {
        return <div className="flex justify-center items-center h-screen gap-2">
            <AnimatedLoader type="spinner" />
            <span className="sr-only">Loading...</span>
            <p className="text-gray-500 dark:text-gray-400">Loading...</p>
        </div>
    }
    return <>{children}</>
}
