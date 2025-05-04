import type { Metadata } from "next";
import "./globals.css";
import AppHeader from "@/components/header/app-header";
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
    <html lang="en">
      <body>
        <AppHeader />
        {children}
      </body>
    </html>
  );
}
