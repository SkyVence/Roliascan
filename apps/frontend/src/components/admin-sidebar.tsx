"use client"
import { LayoutDashboardIcon, BarChartIcon, ShieldCheckIcon, UserIcon, UploadIcon, SettingsIcon, Bug, Settings, ArrowUpCircleIcon, LucideIcon, PlusCircleIcon, MailIcon, MoreVerticalIcon, UserCircleIcon, LogOutIcon, Banknote, Sun, Moon } from "lucide-react";
import { Sidebar, SidebarContent, SidebarGroup, SidebarHeader, SidebarProvider, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarGroupContent, SidebarSeparator, SidebarFooter, SidebarGroupLabel } from "./ui/sidebar";
import { useAuth } from "./auth-context";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger, DropdownMenuGroup } from "./ui/dropdown-menu";
import { useState } from "react";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { useTheme } from "next-themes";
import { Separator } from "./ui/separator";
import { usePathname } from "next/navigation";

const data = {
    navMain: [
        {
            title: "Dashboard",
            url: "/admin/panel",
            icon: LayoutDashboardIcon
        },
        {
            title: "Analytics",
            url: "/admin/analytics",
            icon: BarChartIcon
        },
        {
            title: "Moderation",
            url: "/admin/moderation",
            icon: ShieldCheckIcon
        },
        {
            title: "Users",
            url: "/admin/users",
            icon: UserIcon
        },
        {
            title: "Upload Teams",
            url: "/admin/upload-teams",
            icon: UploadIcon
        },
    ],
    navSecondary: [
        {
            title: "Site Settings",
            url: "/admin/site-settings",
            icon: SettingsIcon
        },
        {
            title: "Bug reports",
            url: "/admin/bug-reports",
            icon: Bug
        },
        {
            title: "Manage Uploads",
            url: "/admin/manage-uploads",
            icon: UploadIcon
        }
    ],
    navRevenue: [
        {
            title: "Revenue",
            url: "/admin/revenue",
            icon: Banknote
        },
        {
            title: "Team Revenue",
            url: "/admin/team-revenue",
            icon: Banknote
        }
    ]
}


export default function AdminSidebar() {
    const pathname = usePathname()
    return (
        <Sidebar side="left" variant="inset" collapsible="offcanvas">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton asChild className="data-[slot=sidebar-menu-button]:!p-1.5">
                            <a href="/">
                                <ArrowUpCircleIcon className="h-5 w-5" />
                                <span className="text-base font-semibold">OpenMediaScan</span>
                                <Separator orientation="vertical"/>
                                <span className="text-muted-foreground text-xs">Admin Panel</span>
                            </a>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>
            <SidebarContent>
                <NavMain items={data.navMain} />
                <NavRevenue items={data.navRevenue} />
                <NavSecondary items={data.navSecondary} className="mt-auto" />
            </SidebarContent>
            <SidebarFooter>
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    )
}

function NavMain({
    items,
}: {
    items: {
        title: string
        url: string
        icon?: LucideIcon
    }[]
}) {
    const pathname = usePathname()
    return (
        <SidebarGroup>
            <SidebarGroupContent className="flex flex-col gap-2">
                <SidebarSeparator />
                <SidebarMenu>
                    {items.map((item) => (
                        <SidebarMenuItem key={item.title}>
                            <SidebarMenuButton tooltip={item.title} asChild isActive={pathname === item.url}>
                                <a href={item.url}>
                                    {item.icon && <item.icon />}
                                    <span>{item.title}</span>
                                </a>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    ))}
                </SidebarMenu>
            </SidebarGroupContent>
        </SidebarGroup>
    )
}

function NavRevenue({
    items,
}: {
    items: {
        title: string
        url: string
        icon: LucideIcon
    }[]
}) {
    const pathname = usePathname()
    return (
        <SidebarGroup className="group-data-[collapsible=icon]:hidden">
            <SidebarGroupLabel>Revenue</SidebarGroupLabel>
            <SidebarGroupContent className="flex flex-col gap-2">
                <SidebarSeparator />
                <SidebarMenu>
                    {items.map((item) => (
                        <SidebarMenuItem key={item.title}>
                            <SidebarMenuButton tooltip={item.title} asChild isActive={pathname === item.url}>
                                <a href={item.url}>
                                    {item.icon && <item.icon />}
                                    <span>{item.title}</span>
                                </a>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    ))}
                </SidebarMenu>
            </SidebarGroupContent>
        </SidebarGroup>
    )
}



function NavSecondary({
    items,
    ...props
}: {
    items: {
        title: string
        url: string
        icon: LucideIcon
    }[]
} & React.ComponentPropsWithoutRef<typeof SidebarGroup>) {
    const pathname = usePathname()
    return (
        <SidebarGroup {...props}>
            <SidebarGroupContent>
                <SidebarMenu>
                    {items.map((item) => (
                        <SidebarMenuItem key={item.title}>
                            <SidebarMenuButton asChild isActive={pathname === item.url}>
                                <a href={item.url}>
                                    <item.icon />
                                    <span>{item.title}</span>
                                </a>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    ))}
                </SidebarMenu>
            </SidebarGroupContent>
        </SidebarGroup>
    )
}

function NavUser() {
    const { user } = useAuth()
    const [isMobile, setIsMobile] = useState(false)
    const { theme, setTheme } = useTheme()
    return (
        <SidebarMenu>
            <SidebarMenuItem>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <SidebarMenuButton size="lg" className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground">
                            <Avatar className="h-8 w-8 rounded-lg grayscale">
                                <AvatarFallback className="rounded-lg">{user?.username.charAt(0)}{user?.username.charAt(1)}</AvatarFallback>
                            </Avatar>
                            <div className="grid flex-1 text-left text-sm leading-tight">
                                <span className="font-medium">{user?.username}</span>
                                <span className="text-xs text-muted-foreground">{user?.email}</span>
                            </div>
                            <MoreVerticalIcon className="ml-auto size-4" />
                        </SidebarMenuButton>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                        className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                        side={isMobile ? "bottom" : "right"}
                        align="end"
                        sideOffset={4}
                    >
                        <DropdownMenuLabel className="p-0 font-normal">
                            <div className="flex item-center gap-2 px-1 py-1.5 text-left text-sm">
                                <Avatar className="h-8 w-8 rounded-lg">
                                    <AvatarFallback className="rounded-lg">{user?.username.charAt(0)}{user?.username.charAt(1)}</AvatarFallback>
                                </Avatar>
                                <div className="grid flex-1 text-left text-sm leading-tight">
                                    <span className="truncate font-medium">{user?.username}</span>
                                    <span className="truncate text-xs text-muted-foreground">{user?.email}</span>
                                </div>
                            </div>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuGroup>
                            <DropdownMenuItem asChild>
                                <a href="/profile">
                                    <UserCircleIcon />
                                    <span>Profile</span>
                                </a>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                                <a href="/profile/settings">
                                    <SettingsIcon />
                                    <span>Settings</span>
                                </a>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
                                <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                                <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                                <span>Toggle theme</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                                <a href="/profile/logout">
                                    <LogOutIcon />
                                    <span>Logout</span>
                                </a>
                            </DropdownMenuItem>
                        </DropdownMenuGroup>
                    </DropdownMenuContent>
                </DropdownMenu>
            </SidebarMenuItem>
        </SidebarMenu>
    )
}