"use client"

import Link from "next/link"
import { useTheme } from "next-themes"
import { Button } from "./ui/button"
import { Sun, Moon, User, Search, Menu } from "lucide-react"
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator } from "./ui/dropdown-menu"
import { useBetterAuth } from "./authentication/better-context"
import { AnimatedLoader } from "./ui/animated-loader"
import { Input } from "./ui/input"
import { NavigationMenu, NavigationMenuContent, NavigationMenuItem, NavigationMenuLink, NavigationMenuList, NavigationMenuTrigger, navigationMenuTriggerStyle } from "./ui/navigation-menu-navbar"
import React from "react"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetTrigger } from "./ui/sheet"
import { VisuallyHidden } from "@radix-ui/react-visually-hidden"

function ThemeSwitcher() {
    const { theme, setTheme } = useTheme()
    return (
        <Button variant="outline" size="icon" onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
            <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Toggle theme</span>
        </Button>
    )
}

function AuthButtons() {
    const { isAuthenticated, user, isLoading, logout } = useBetterAuth()
    const router = useRouter()

    if (isLoading) {
        return <Button variant="outline" size="icon">
            <AnimatedLoader type="spinner" size="sm" color="primary" />
        </Button>
    }

    if (user?.role === "admin") {
        return (
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon">
                        <User className="h-[1.2rem] w-[1.2rem]" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                    <DropdownMenuLabel>{user?.username}</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                        <Link href="/admin/panel">
                            Admin Panel
                        </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                        <Link href="/profile/settings">
                            Settings
                        </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={logout}>
                        Logout
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        )
    }

    if (isAuthenticated) {
        return (
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon">
                        <User className="h-[1.2rem] w-[1.2rem]" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                    <DropdownMenuLabel>{user?.username}</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                        <Link href="/profile/settings">
                            Settings
                        </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={logout}>
                        Logout
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        )
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                    <User className="h-[1.2rem] w-[1.2rem]" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
                <DropdownMenuLabel>Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                    <Link href="/auth/login">
                        Login
                    </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                    <Link href="/auth/register">
                        Register
                    </Link>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}

//Search Bar no logic yet
function SearchBar() {
    return (
        <div className="relative">
            <Search className="absolute left-3 top-1/2 h-[1.2rem] w-[1.2rem] -translate-y-1/2 text-muted-foreground" />
            <Input type="text" placeholder="Search..." className="pl-10" />
        </div>
    )
}

const categories: { title: string; href: string; description: string }[] = [
    {
        title: "Comics",
        href: "/comics",
        description:
            "Read your favorite comics with highest quality.",
    },
    {
        title: "Manhwa",
        href: "/manhwa",
        description:
            "Read your favorite manhwa with highest quality.",
    },
    {
        title: "Manhua",
        href: "/manhua",
        description:
            "Read your favorite manhua with highest quality.",
    },
    {
        title: "Webtoon",
        href: "/webtoon",
        description: "Read your favorite webtoon with highest quality.",
    },
]

const community: { title: string; href: string; description: string }[] = [
    {
        title: "Discord",
        href: "/discord",
        description:
            "Join our Discord server to chat with other users.",
    },
    {
        title: "Twitter",
        href: "/twitter",
        description:
            "Follow us on Twitter to get the latest news and updates.",
    },
    {
        title: "Instagram",
        href: "/instagram",
        description:
            "Follow us on Instagram to get the latest news and updates.",
    },
    {
        title: "Forum",
        href: "/forum",
        description: "Join our forum to discuss your favorite titles.",
    },
]

type BannerType = "default" | "destructive" | "info" | "warning"

interface BannerData {
    id: string
    message: string
    title: string
    type: BannerType
    active: boolean
    expiresAt: string | null
}

export function NewNavigation() {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false)
    return (
        <div className="flex justify-center py-6">
            <div className="relative w-full mx-6 rounded-lg border border-primary bg-accent/60 backdrop-blur-sm px-6 py-3 shadow-md">
                <div className="flex items-center justify-start md:justify-between h-[55px]">
                    <div className="flex gap-4 items-center">
                        <Link href="/" className="hidden md:block">
                            <img src="/custom/logo4.0.png" alt="logo" className="h-[30px] w-[30px]" />
                        </Link>
                        <NavigationMenu className="hidden md:flex">
                            <NavigationMenuList >
                                <NavigationMenuItem>
                                    <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
                                        <Link href="/">
                                            Home
                                        </Link>
                                    </NavigationMenuLink>
                                </NavigationMenuItem>
                                <NavigationMenuItem>
                                    <NavigationMenuTrigger>Titles</NavigationMenuTrigger>
                                    <NavigationMenuContent>
                                        <ul className="grid gap-3 p-4 md:w-[400px] lg:w-[500px] lg:grid-cols-[.75fr_1fr]">
                                            <li className="row-span-3">
                                                <NavigationMenuLink asChild>
                                                    <Link
                                                        className="flex h-full w-full select-none flex-col justify-end rounded-md bg-gradient-to-b from-muted/50 to-muted p-6 no-underline outline-none focus:shadow-md"
                                                        href="/"
                                                    >
                                                        <img src="/custom/logo4.0.png" alt="logo" className="h-[60px] w-[60px]" />
                                                        <div className="mb-2 mt-4 text-lg font-medium">
                                                            Roliascan
                                                        </div>
                                                        <p className="text-sm leading-tight text-muted-foreground">
                                                            Read your favorite manhwa, manhua, comics with highest quality. the girl from a random chatting, huashan sect greatest genius, my crazy boss....
                                                        </p>
                                                    </Link>
                                                </NavigationMenuLink>
                                            </li>
                                            <ListItem href="/latest-updates" title="Latest Updates">
                                                Latest content update from your favorite titles
                                            </ListItem>
                                            <ListItem href="/recommendations" title="Recommendations">
                                                Our recommendations for you
                                            </ListItem>
                                            <ListItem href="/bookmarks" title="Bookmarks">
                                                Your favorite titles
                                            </ListItem>
                                        </ul>
                                    </NavigationMenuContent>
                                </NavigationMenuItem>
                                <NavigationMenuItem>
                                    <NavigationMenuTrigger>Categories</NavigationMenuTrigger>
                                    <NavigationMenuContent>
                                        <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px] ">
                                            {categories.map((category) => (
                                                <ListItem key={category.title} href={category.href} title={category.title}>
                                                    {category.description}
                                                </ListItem>
                                            ))}
                                        </ul>
                                    </NavigationMenuContent>
                                </NavigationMenuItem>
                                <NavigationMenuItem>
                                    <NavigationMenuTrigger>Community</NavigationMenuTrigger>
                                    <NavigationMenuContent>
                                        <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px] ">
                                            {community.map((community) => (
                                                <ListItem key={community.title} href={community.href} title={community.title}>
                                                    {community.description}
                                                </ListItem>
                                            ))}
                                        </ul>
                                    </NavigationMenuContent>
                                </NavigationMenuItem>
                            </NavigationMenuList>
                        </NavigationMenu>
                    </div>
                    <div className="flex gap-2 items-center">
                        <SearchBar />
                        <ThemeSwitcher />
                        <AuthButtons />
                        <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                            <SheetTrigger asChild className="md:hidden">
                                <Button variant="outline" size="icon">
                                    <Menu className="h-[1.2rem] w-[1.2rem]" />
                                    <span className="sr-only">Open menu</span>
                                </Button>
                            </SheetTrigger>
                            <SheetContent side="left">
                                <SheetHeader className="sr-only">
                                    <SheetTitle>Navigation Menu</SheetTitle>
                                    <SheetDescription>Main site navigation links</SheetDescription>
                                </SheetHeader>
                                <nav className="grid gap-6 text-lg font-medium p-4">
                                    <Link
                                        href="/"
                                        className="flex items-center gap-2 text-lg font-semibold mb-4"
                                        onClick={() => setIsMobileMenuOpen(false)}
                                    >
                                        <img src="/custom/logo4.0.png" alt="logo" className="h-[30px] w-[30px]" />
                                        <span className="">Roliascan</span>
                                    </Link>
                                    <Link href="/" className="hover:text-foreground" onClick={() => setIsMobileMenuOpen(false)}>Home</Link>
                                    <Link href="/latest-updates" className="text-muted-foreground hover:text-foreground" onClick={() => setIsMobileMenuOpen(false)}>Latest Updates</Link>
                                    <Link href="/recommendations" className="text-muted-foreground hover:text-foreground" onClick={() => setIsMobileMenuOpen(false)}>Recommendations</Link>
                                    <Link href="/bookmarks" className="text-muted-foreground hover:text-foreground" onClick={() => setIsMobileMenuOpen(false)}>Bookmarks</Link>
                                    <h4 className="font-semibold mt-4">Categories</h4>
                                    {categories.map((category) => (
                                        <Link key={category.title} href={category.href} className="text-muted-foreground hover:text-foreground" onClick={() => setIsMobileMenuOpen(false)}>{category.title}</Link>
                                    ))}
                                    <h4 className="font-semibold mt-4">Community</h4>
                                    {community.map((item) => (
                                        <Link key={item.title} href={item.href} className="text-muted-foreground hover:text-foreground" onClick={() => setIsMobileMenuOpen(false)}>{item.title}</Link>
                                    ))}
                                </nav>
                            </SheetContent>
                        </Sheet>
                    </div>
                </div>
            </div>
        </div>
    );
}

const ListItem = React.forwardRef<
    React.ElementRef<typeof Link>,
    React.ComponentPropsWithoutRef<typeof Link> & { title?: string }
>(({ className, title, children, href, ...props }, ref) => {
    return (
        <li>
            <NavigationMenuLink asChild>
                <Link
                    ref={ref}
                    href={href || "#"}
                    className={cn(
                        "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
                        className
                    )}
                    {...props}
                >
                    <div className="text-sm font-medium leading-none">{title}</div>
                    <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                        {children}
                    </p>
                </Link>
            </NavigationMenuLink>
        </li>
    )
})
ListItem.displayName = "ListItem"