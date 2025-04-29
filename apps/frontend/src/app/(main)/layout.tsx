"use client"
import { NewNavigation } from "@/components/navigation";
import { usePathname } from "next/navigation";
import AdminSidebar from "@/components/admin-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { SiteHeader } from "@/components/admin-header";
import React from "react";
import { Toaster } from "sonner";

function RootLayoutStructure({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();

    if (pathname.startsWith("/admin")) {
        return (
            <SidebarProvider>
                <AdminSidebar />
                <SidebarInset>
                    <SiteHeader />
                    <main className="flex-1 h-full p-4 md:p-8 pt-6">
                        {children}
                    </main>
                </SidebarInset>
            </SidebarProvider>
        );
    }

    if (pathname.startsWith("/auth")) {
        return <main>{children}</main>;
    }

    return (
        <div className="flex flex-col min-h-screen">
            <NewNavigation />
            <main className="flex-1">{children}</main>
        </div>
    );
}

export default function RootLayout({
    children,
}: Readonly<{ children: React.ReactNode }>) {
    return (
        <RootLayoutStructure>
            {children}
        </RootLayoutStructure>
    );
}
