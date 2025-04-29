import { ThemeProvider } from "@/components/theme-provider";
import "./globals.css";
import { BetterAuthProvider } from "@/components/authentication/better-context";
import { Toaster } from "sonner";
export default function Layout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body className="min-h-screen bg-background font-sans antialiased">
            <ThemeProvider
                    attribute="class"
                    defaultTheme="dark"
                    enableSystem
                    disableTransitionOnChange
                >
                    <Toaster/>
                        <BetterAuthProvider>
                            {children}
                        </BetterAuthProvider>
                    </ThemeProvider>
            </body>
        </html>
    );
}
