"use client";
import Link from "next/link";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { cn } from "@/lib/utils";
import React from "react";
import {
  Book,
  Home,
  LibraryBig,
  LogIn,
  Menu,
  MessageSquare,
  UserPlus,
} from "lucide-react";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "../ui/sheet";
import { Button } from "../ui/button";
const genres = [
  {
    title: "Action",
    href: "/genres/action",
    description:
      "Exciting stories filled with combat, conflict, and adventure.",
  },
  {
    title: "Romance",
    href: "/genres/romance",
    description: "Stories that focus on romantic relationships and love.",
  },
  {
    title: "Fantasy",
    href: "/genres/fantasy",
    description:
      "Magical worlds, mythical creatures, and supernatural elements.",
  },
  {
    title: "Sci-Fi",
    href: "/genres/sci-fi",
    description:
      "Futuristic technology, space exploration, and scientific concepts.",
  },
  {
    title: "Horror",
    href: "/genres/horror",
    description: "Frightening stories designed to scare and unsettle readers.",
  },
  {
    title: "Comedy",
    href: "/genres/comedy",
    description: "Humorous stories meant to entertain and make readers laugh.",
  },
];

const categories = [
  {
    title: "Manga",
    href: "/categories/manga",
    description: "Japanese comics with a distinctive art style.",
  },
  {
    title: "Manhua",
    href: "/categories/manhua",
    description: "Chinese comics with unique storytelling approaches.",
  },
  {
    title: "Manhwa",
    href: "/categories/manhwa",
    description: "Korean comics, often in full color and read top to bottom.",
  },
  {
    title: "Comics",
    href: "/categories/comics",
    description: "Western-style comics from various publishers.",
  },
];

export default function AppHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-2">
          <LibraryBig className="h-6 w-6" />
          <span className="text-lg font-semibold">OpenMediaScan</span>
        </div>
        {/* Mobile Menu */}
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="lg:hidden">
              <Menu className="h-6 w-6" />
              <span className="sr-only">Open menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left">
            <div className="flex flex-col gap-6 py-6">
              <div className="flex items-center gap-2">
                <LibraryBig className="h-6 w-6" />
                <span className="text-lg font-semibold">OpenMediaScan</span>
              </div>
              <nav className="flex flex-col gap-4">
                <SheetClose asChild>
                  <Link href="/" className="flex items-center gap-2">
                    <Home className="h-6 w-6" />
                    <span>Home</span>
                  </Link>
                </SheetClose>
                <SheetClose asChild>
                  <Link href="/categories" className="flex items-center gap-2">
                    <Book className="h-6 w-6" />
                    <span>Categories</span>
                  </Link>
                </SheetClose>
                <SheetClose asChild>
                  <Link href="/genres" className="flex items-center gap-2">
                    <Book className="h-6 w-6" />
                    <span>Genres</span>
                  </Link>
                </SheetClose>
                <SheetClose asChild>
                  <Link href="/socials" className="flex items-center gap-2">
                    <MessageSquare className="h-6 w-6" />
                    <span>Socials</span>
                  </Link>
                </SheetClose>
              </nav>
              <div className="flex flex-col gap-2">
                <Button
                  variant="outline"
                  className="w-full justify-start gap-2"
                >
                  <LogIn className="h-4 w-4" />
                  Login
                </Button>
                <Button className="w-full justify-start gap-2">
                  <UserPlus className="h-4 w-4" />
                  Register
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}

function NavMenu() {
  return (
    <NavigationMenu>
      <NavigationMenuList>
        <NavigationMenuItem>
          <NavigationMenuTrigger>Categories</NavigationMenuTrigger>
          <NavigationMenuContent>
            <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px]">
              {categories.map((category) => (
                <ListItem
                  key={category.title}
                  title={category.title}
                  href={category.href}
                >
                  {category.description}
                </ListItem>
              ))}
            </ul>
          </NavigationMenuContent>
        </NavigationMenuItem>
        <NavigationMenuItem>
          <NavigationMenuTrigger>Genres</NavigationMenuTrigger>
          <NavigationMenuContent>
            <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px]">
              {genres.map((genre) => (
                <ListItem
                  key={genre.title}
                  title={genre.title}
                  href={genre.href}
                >
                  {genre.description}
                </ListItem>
              ))}
            </ul>
          </NavigationMenuContent>
        </NavigationMenuItem>
        <NavigationMenuItem>
          <NavigationMenuTrigger>Socials</NavigationMenuTrigger>
          <NavigationMenuContent>
            <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px]">
              <ListItem title="Discord" href="#DiscordLink">
                Join our community on Discord.
              </ListItem>
              <ListItem title="Twitter" href="#TwitterLink">
                Follow us on Twitter.
              </ListItem>
              <ListItem title="Instagram" href="#InstagramLink">
                Follow us on Instagram.
              </ListItem>
              <ListItem title="TikTok" href="#TikTokLink">
                Follow us on TikTok.
              </ListItem>
            </ul>
          </NavigationMenuContent>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  );
}

const ListItem = React.forwardRef<
  React.ElementRef<typeof Link>,
  Omit<React.ComponentPropsWithoutRef<typeof Link>, "ref">
>(({ className, title, children, ...props }, ref) => {
  return (
    <li>
      <NavigationMenuLink asChild>
        <Link
          className={cn(
            "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-gray-800 hover:text-purple-400 focus:bg-gray-800 focus:text-purple-400",
            className,
          )}
          ref={ref}
          {...props}
        >
          <div className="text-sm font-medium leading-none">{title}</div>
          <p className="line-clamp-2 text-sm leading-snug text-gray-400">
            {children}
          </p>
        </Link>
      </NavigationMenuLink>
    </li>
  );
});
ListItem.displayName = "ListItem";
