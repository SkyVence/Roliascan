"use client"

import Link from "next/link"
import { useTheme } from "next-themes"
import { Button } from "./ui/button"
import { Sun, Moon, User, Loader2 } from "lucide-react"
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator } from "./ui/dropdown-menu"
import { useAuth } from "./auth-context"
import { AnimatedLoader } from "./ui/animated-loader"

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

export default function Navigation() {
    return (
        <div className="flex justify-center py-6">
            <div className="relative w-full max-w-4xl rounded-full border border-primary bg-accent px-6 py-3 shadow-md">
                <div className="flex items-center justify-between">
                    <div className="flex gap-4">
                        <p className="cursor-pointer transition-colors hover:text-primary">Home</p>
                        <Link href="/" className="transition-colors hover:text-primary">
                            Latest Updates
                        </Link>
                        <Link href="/" className="transition-colors hover:text-primary">
                            Recommendations
                        </Link>
                        <Link href="/" className="transition-colors hover:text-primary">
                            Bookmarks
                        </Link>
                    </div>
                    <div className="flex gap-2">
                        <ThemeSwitcher />
                        <AuthButtons />
                    </div>
                </div>
            </div>
        </div>
    )
}
