"use client"
import { usePathname } from "next/navigation"

export function AdminBreadcrumb() {
    const pathname = usePathname()

    if (pathname.split("/").pop() === "panel") {
        return (
            <h1 className="text-base font-medium">Dashboard</h1>
        )
    }
    
    const currentPage = pathname.split("/").pop() || "";
    const title = currentPage.charAt(0).toUpperCase() + currentPage.slice(1);

    return (
        <h1 className="text-base font-medium">{title}</h1>
    )
}
