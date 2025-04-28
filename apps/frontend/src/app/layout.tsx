"use client"
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/components/auth-context";
import { NewNavigation } from "@/components/navigation";
import { usePathname } from "next/navigation";
import AdminSidebar from "@/components/admin-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { SiteHeader } from "@/components/admin-header";
import { PostHogProvider } from "@/components/PostHogProvider";

function RenderNavbar({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    if (pathname.startsWith("/admin")) {
        return (
            <SidebarProvider>
                <AdminSidebar />
                <SidebarInset>
                    <RenderHeader />
                    <main className="h-full">
                        {children}
                    </main>
                </SidebarInset>
            </SidebarProvider>
        );
    }
    if (pathname.startsWith("/auth")) {
        return (
            <>{children}</>
        )
    }
    return (
        <NewNavigation />
    );
}

function RenderHeader() {
    const pathname = usePathname();
    if (pathname.startsWith("/admin")) {
        return <SiteHeader />;
    }
    return null;
}




export default function RootLayout({
    children,
}: Readonly<{ children: React.ReactNode }>) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body>
                    <ThemeProvider
                        attribute="class"
                        defaultTheme="dark"
                        enableSystem
                        disableTransitionOnChange
                    >
                        <AuthProvider>
                            <RenderNavbar>
                                {children}
                            </RenderNavbar>
                        </AuthProvider>
                    </ThemeProvider>
            </body>
        </html>
    );
}
