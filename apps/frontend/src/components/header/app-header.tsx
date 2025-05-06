"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { BookOpen, Cog, LogOut, Menu, Moon, Search, Sun, User, UserPlus } from "lucide-react"
import { useState } from "react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useTheme } from "next-themes"
import { authClient, signOut, useSession } from "@/lib/auth-client"
import { useRouter } from "next/navigation"

export function AppHeader() {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

    return (
        <header className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-sm">
            <div className="container mx-auto px-4">
                <div className="grid grid-cols-12 h-16 items-center gap-4">
                    {/* Logo Section - 2 columns on md+ screens */}
                    <div className="col-span-6 md:col-span-2 flex items-center gap-2">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="md:hidden"
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        >
                            <Menu className="h-5 w-5" />
                            <span className="sr-only">Toggle menu</span>
                        </Button>
                        <Link href="/" className="flex items-center gap-2 font-bold text-xl">
                            <BookOpen className="h-6 w-6 text-primary" />
                            <span>OpenMediaScan</span>
                        </Link>
                    </div>

                    {/* Nav Links - 6 columns, centered, hidden on mobile */}
                    <div className="hidden md:flex md:col-span-6 items-center justify-center space-x-6">
                        <Link href="/browse" className="text-sm font-medium hover:text-primary transition-colors">
                            Browse
                        </Link>
                        <Link href="/latest" className="text-sm font-medium hover:text-primary transition-colors">
                            Latest
                        </Link>
                        <Link href="/popular" className="text-sm font-medium hover:text-primary transition-colors">
                            Popular
                        </Link>
                        <Link href="/genres" className="text-sm font-medium hover:text-primary transition-colors">
                            Genres
                        </Link>
                    </div>

                    {/* Search and Account - 4 columns, right-aligned */}
                    <div className="col-span-6 md:col-span-4 flex items-center justify-end gap-4">
                        <form className="relative hidden md:block flex-grow max-w-[300px]">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                type="search"
                                placeholder="Search manga..."
                                className="w-full bg-muted border-border pl-8 text-sm"
                            />
                        </form>
                        <AccountButton />
                    </div>
                </div>
            </div>

            {/* Mobile menu */}
            {isMobileMenuOpen && (
                <div className="md:hidden border-t border-border bg-background">
                    <nav className="flex flex-col p-4 space-y-3">
                        <Link
                            href="/browse"
                            className="text-sm font-medium hover:text-primary transition-colors p-2"
                            onClick={() => setIsMobileMenuOpen(false)}
                        >
                            Browse
                        </Link>
                        <Link
                            href="/latest"
                            className="text-sm font-medium hover:text-primary transition-colors p-2"
                            onClick={() => setIsMobileMenuOpen(false)}
                        >
                            Latest
                        </Link>
                        <Link
                            href="/popular"
                            className="text-sm font-medium hover:text-primary transition-colors p-2"
                            onClick={() => setIsMobileMenuOpen(false)}
                        >
                            Popular
                        </Link>
                        <Link
                            href="/genres"
                            className="text-sm font-medium hover:text-primary transition-colors p-2"
                            onClick={() => setIsMobileMenuOpen(false)}
                        >
                            Genres
                        </Link>
                        <form className="relative mt-2">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                type="search"
                                placeholder="Search manga..."
                                className="w-full bg-muted border-border pl-8 text-sm"
                            />
                        </form>
                    </nav>
                </div>
            )}
        </header>
    )
}

function AccountBtnContent() {
    const session = useSession()
    const router = useRouter()

    const admin = session.data?.user.role === "admin"

    if (session.data) {
        return (
            <>
                <DropdownMenuLabel>
                    <div className="flex items-center justify-center gap-2 w-full">
                        <User className="h-4 w-4 flex-shrink-0" />
                        <span className="text-sm truncate">{session.data?.user.name}</span>
                    </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                    <Link href="/user/profile">
                        <User className="h-4 w-4" />
                        <span>Profile</span>
                    </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                    <Link href="/settings">
                        <Cog className="h-4 w-4" />
                        <span>Settings</span>
                    </Link>
                </DropdownMenuItem>
                <ThemeToggle />
                <DropdownMenuItem onClick={() => {
                    signOut().then(() => {
                        router.refresh();
                    });
                }}>
                    <LogOut className="h-4 w-4" />
                    <span>Logout</span>
                </DropdownMenuItem>
                {admin && (
                    <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                            <Link href="/admin/dashboard">
                                <User className="h-4 w-4" />
                                <span>Admin Dashboard</span>
                            </Link>
                        </DropdownMenuItem>
                    </>
                )}
            </>
        )
    }

    return (
        <>
            <DropdownMenuLabel>
                <div className="flex items-center justify-center gap-2 w-half">
                    <span className="text-sm truncate">Account</span>
                </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
                <Link href="/auth/sign-up">
                    <UserPlus className="h-4 w-4" />
                    <span>Register</span>
                </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
                <Link href="/auth/sign-in">
                    <User className="h-4 w-4" />
                    <span>Login</span>
                </Link>
            </DropdownMenuItem>
            <ThemeToggle />
        </>
    )
}

function AccountButton() {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground ml-auto">
                    <User className="h-5 w-5 hidden md:block" />
                    <span className="sr-only">Account</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
                <AccountBtnContent />
            </DropdownMenuContent>
        </DropdownMenu>
    )
}

function ThemeToggle() {
    const { theme, setTheme } = useTheme()

    return (
        <DropdownMenuItem onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
            {theme === "dark" ? (
                <Sun className="h-5 w-5" />
            ) : (
                <Moon className="h-5 w-5" />
            )}
            <span>{theme === "dark" ? "Light" : "Dark"}</span>
        </DropdownMenuItem>
    )
}