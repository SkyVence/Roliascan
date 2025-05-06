import { SiteHeader } from "@/components/admin/admin-header";
import SidebarAdmin from "@/components/admin/sidebar-admin";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <SidebarProvider>
            <SidebarAdmin />
            <SidebarInset>
                <SiteHeader />
                <main className="flex-1 h-full p-4 md:p-8 pt-6">
                    {children}
                </main>
            </SidebarInset>
        </SidebarProvider>
    )
}
