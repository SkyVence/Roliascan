import type { Metadata } from "next";
import "./globals.css";
import AppProvider from "@/components/app-provider";
import { Toaster } from "sonner";
export const metadata: Metadata = {
    title: "OpenMediaScan",
    description: "Read your favorite manga, manhwa, manhua, and more.",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body>
                <AppProvider>
                    <Toaster />
                    {children}
                </AppProvider>
            </body>
        </html>
    );
}
