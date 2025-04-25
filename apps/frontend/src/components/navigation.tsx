"use client"

import Link from "next/link"
import { useTheme } from "next-themes"
import { Button } from "./ui/button"
import { Sun, Moon, User, Loader2, Search, X } from "lucide-react"
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator } from "./ui/dropdown-menu"
import { useAuth } from "./auth-context"
import { AnimatedLoader } from "./ui/animated-loader"
import { Input } from "./ui/input"
import { NavigationMenu, NavigationMenuContent, NavigationMenuItem, NavigationMenuLink, NavigationMenuList, NavigationMenuTrigger, navigationMenuTriggerStyle } from "./ui/navigation-menu-navbar"
import React, { useEffect, useState } from "react"
import { cn } from "@/lib/utils"
import { Alert, AlertDescription, AlertTitle } from "./ui/alert"

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
    const { isAuthenticated, user, isLoading } = useAuth()

    if (isLoading) {
        return <Button variant="outline" size="icon">
            <AnimatedLoader type="spinner" size="sm" color="primary" />
        </Button>
    }


    if (user?.role === "Admin") {
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
                    <DropdownMenuItem asChild>
                        <Link href="/admin/panel">
                            Admin Panel
                        </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                        <Link href="/auth/logout">
                            Logout
                        </Link>
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
                    <DropdownMenuItem asChild>
                        <Link href="/auth/logout">
                            Logout
                        </Link>
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

function GlobalAlert() {
    const [banner, setBanner] = useState<BannerData | null>(null)
    const [visible, setVisible] = useState(false)

    useEffect(() => {
        const fetchBanner = async () => {
            const data = {
                id: "1",
                message: "Welcome to our website!",
                title: "Welcome",
                type: "default" as BannerType,
                active: true,
                expiresAt: null
            }

            if (!data) return

            if (data.expiresAt && new Date(data.expiresAt) < new Date()) {
                return
            }

            const dismissedBanners = JSON.parse(localStorage.getItem("dismissedBanners") || "[]")
            if (dismissedBanners.includes(data.id)) {
                return
            }

            setBanner(data)
            setVisible(true)
    
        }

        fetchBanner()
    }, [])
    
    const dismissBanner = () => {
        if (!banner) return
    
        setVisible(false)
    
        // Store dismissed banner ID in localStorage
        const dismissedBanners = JSON.parse(localStorage.getItem("dismissedBanners") || "[]")
        dismissedBanners.push(banner.id)
        localStorage.setItem("dismissedBanners", JSON.stringify(dismissedBanners))
      }
    
      if (!visible || !banner) return null
    
      const variantMap: Record<BannerType, string> = {
        default: "",
        destructive: "destructive",
        info: "border border-blue-200 bg-blue-50 text-blue-900 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-50",
        warning:
          "border border-yellow-200 bg-yellow-50 text-yellow-900 dark:border-yellow-800 dark:bg-yellow-950 dark:text-yellow-50",
      }

      return (
        <Alert
        variant={banner.type === "info" || banner.type === "warning" ? "default" : banner.type}
        className={cn("relative", banner.type === "info" || banner.type === "warning" ? variantMap[banner.type] : "")}
      >
        <AlertTitle>{banner.title}</AlertTitle>
        <AlertDescription>{banner.message}</AlertDescription>
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-2 top-2"
          onClick={dismissBanner}
          aria-label="Dismiss banner"
        >
          <X className="h-4 w-4" />
        </Button>
      </Alert>
      )
    
}


export function NewNavigation() {
    return (
        <div className="flex justify-center py-6">
            <div className="relative w-full mx-6 rounded-lg border border-primary bg-accent/60 backdrop-blur-sm px-6 py-3 shadow-md">
                <div className="flex items-center justify-between h-[55px]">
                    <div className="flex gap-4">
                        <Link href="/" legacyBehavior>
                            <img src="/custom/logo4.0.png" alt="logo" className="h-[30px] w-[30px]" />
                        </Link>
                        <NavigationMenu>
                            <NavigationMenuList >
                                <NavigationMenuItem>
                                    <Link href="/" legacyBehavior passHref>
                                        <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                                            Home
                                        </NavigationMenuLink>
                                    </Link>
                                </NavigationMenuItem>
                                <NavigationMenuItem>
                                    <NavigationMenuTrigger>Titles</NavigationMenuTrigger>
                                    <NavigationMenuContent>
                                        <ul className="grid gap-3 p-4 md:w-[400px] lg:w-[500px] lg:grid-cols-[.75fr_1fr]">
                                            <li className="row-span-3">
                                                <NavigationMenuLink asChild>
                                                    <a
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
                                                    </a>
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
                    <div className="flex-1 flex justify-center px-4">
                        <GlobalAlert />
                    </div>
                    <div className="flex gap-2">
                        <SearchBar />
                        <ThemeSwitcher />
                        <AuthButtons />
                    </div>
                </div>
            </div>
        </div>
    );
}

const ListItem = React.forwardRef<
    React.ElementRef<"a">,
    React.ComponentPropsWithoutRef<"a">
>(({ className, title, children, ...props }, ref) => {
    return (
        <li>
            <NavigationMenuLink asChild>
                <a
                    ref={ref}
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
                </a>
            </NavigationMenuLink>
        </li>
    )
})
ListItem.displayName = "ListItem"