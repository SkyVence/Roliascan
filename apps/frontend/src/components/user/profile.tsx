"use client"
import { authClient, useSession } from "@/lib/auth-client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar"
import { Badge } from "../ui/badge"
import { Calendar } from "lucide-react"
import { Tabs, TabsTrigger, TabsList, TabsContent } from "../ui/tabs"
import { useState, useEffect, useCallback } from "react"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "../ui/form"
import { Input } from "../ui/input"
import { Button } from "../ui/button"


export function UserProfile() {
    const session = useSession()

    return (
        <div className="container mx-auto py-10 px-4 md:px-6">
            <div className="space-y-6">
                <div className="flex flex-col gap-2">
                    <h1 className="text-2xl font-bold">User Profile</h1>
                    <p className="text-muted-foreground">Manage your account information</p>
                </div>

                <ProfileInfo session={session} />

                <ProfileTabs session={session} />
            </div>
        </div>
    )
}

interface ProfileInfoProps {
    session: ReturnType<typeof useSession>
}

function ProfileTabs({ session }: ProfileInfoProps) {
    const [activeTab, setActiveTab] = useState("profile")

    if (!session.data) {
        return <p>Loading profile information...</p>;
    }

    return (
        <Tabs defaultValue="profile" value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
                <TabsTrigger value="profile">Profile</TabsTrigger>
                <TabsTrigger value="activity">Activity</TabsTrigger>
                <TabsTrigger value="security">Security</TabsTrigger>
            </TabsList>
            <TabsContent value="profile" className="mt-6">
                <UserProfileEditForm user={session.data.user} />
            </TabsContent>
            <TabsContent value="activity" className="mt-6">
                <UserActivityFeed />
            </TabsContent>
            <TabsContent value="security" className="mt-6">
                <div className="space-y-6">
                    <ChangePasswordForm />
                    <ActiveSessionsCard />
                    <TwoFactorAuthCard />
                </div>
            </TabsContent>
        </Tabs>
    )
}

function ProfileInfo({ session }: ProfileInfoProps) {
    return (
        <Card>
            <CardContent className="p-6">
                <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
                    <Avatar className="h-24 w-24">
                        <AvatarImage src={session.data?.user.image || ""} alt={session.data?.user.name || "User Avatar"} />
                        <AvatarFallback>{session.data?.user.name?.charAt(0)} {session.data?.user.name?.charAt(1)}</AvatarFallback>
                    </Avatar>

                    <div className="space-y-2">
                        <div className="flex flex-col gap-0.5">
                            <div className="flex items-center gap-2">
                                <h2 className="text-2xl font-bold">{session.data?.user.displayUsername ?? session.data?.user.name}</h2>
                                <Badge className="w-fit">{session.data?.user.role}</Badge>
                            </div>
                            <h3 className="text-sm text-muted-foreground">@{session.data?.user.username}</h3>
                        </div>

                        <p className="text-muted-foreground">
                            // User Description Coming Soon™
                        </p>
                        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                <span>Joined {session.data?.user.createdAt.toLocaleDateString()}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}

const profileFormSchema = z.object({
    username: z.string().min(1),
    name: z.string().min(1),
    email: z.string().email(),
})

const changePasswordFormSchema = z.object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z.string().min(8, "New password must be at least 8 characters long"),
    confirmNewPassword: z.string().min(8, "Confirm new password must be at least 8 characters long"),
}).refine((data) => data.newPassword === data.confirmNewPassword, {
    message: "New passwords don't match",
    path: ["confirmNewPassword"],
});

type ProfileFormValues = z.infer<typeof profileFormSchema>
type ChangePasswordFormValues = z.infer<typeof changePasswordFormSchema>;

interface UserProfileEditFormProps {
    user: NonNullable<ReturnType<typeof useSession>["data"]>["user"]
}

function UserProfileEditForm({ user }: UserProfileEditFormProps) {
    const [isSubmitting, setIsSubmitting] = useState(false)

    const getFormValues = useCallback(() => ({
        username: user.displayUsername ?? "",
        name: user.name ?? "",
        email: user.email ?? "",
    }), [user.displayUsername, user.name, user.email])

    const form = useForm<ProfileFormValues>({
        resolver: zodResolver(profileFormSchema),
        defaultValues: getFormValues(),
        mode: "onChange",
    })

    useEffect(() => {
        form.reset(getFormValues());
    }, [form.reset, getFormValues])

    const onSubmit = async (data: ProfileFormValues) => {
        setIsSubmitting(true)
        let profileUpdated = false
        let emailChanged = false

        try {
            const userUpdatePayload: { username?: string; name?: string } = {}
            if (data.username !== (user.displayUsername ?? "")) {
                userUpdatePayload.username = data.username
            }
            if (data.name !== (user.name ?? "")) {
                userUpdatePayload.name = data.name
            }

            if (Object.keys(userUpdatePayload).length > 0) {
                await authClient.updateUser(userUpdatePayload)
                profileUpdated = true
            }

            if (data.email !== (user.email ?? "")) {
                await authClient.changeEmail({
                    newEmail: data.email,
                })
                emailChanged = true
            }

            if (profileUpdated || emailChanged) {
                toast.success("Profile updated successfully")
            } else {
                toast.info("No changes to update")
            }
        } catch (error) {
            console.error(error)
            toast.error("Failed to update profile")
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>Update your profile information and personal details.</CardDescription>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FormField
                                control={form.control}
                                name="username"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Display Name</FormLabel>
                                        <FormControl>
                                            <Input {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="email"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Email</FormLabel>
                                        <FormControl>
                                            <Input {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Full Name</FormLabel>
                                        <FormControl>
                                            <Input {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                        <div className="flex justify-end">
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting ? "Updating..." : "Update Profile"}
                            </Button>
                        </div>
                    </form>
                </Form>
            </CardContent>
        </Card>
    )
}

function ChangePasswordForm() {
    const [isSubmitting, setIsSubmitting] = useState(false);

    const form = useForm<ChangePasswordFormValues>({
        resolver: zodResolver(changePasswordFormSchema),
        defaultValues: {
            currentPassword: "",
            newPassword: "",
            confirmNewPassword: "",
        },
        mode: "onChange",
    });

    const onSubmit = async (data: ChangePasswordFormValues) => {
        setIsSubmitting(true);
        try {
            // Assuming authClient has a changePassword method
            await authClient.changePassword({
                currentPassword: data.currentPassword,
                newPassword: data.newPassword,
            });
            toast.success("Password changed successfully");
            form.reset();
        } catch (error: any) {
            console.error(error);
            const errorMessage = error.response?.data?.message || "Failed to change password";
            toast.error(errorMessage);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Change Password</CardTitle>
                <CardDescription>Update your account's password.</CardDescription>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <FormField
                            control={form.control}
                            name="currentPassword"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Current Password</FormLabel>
                                    <FormControl>
                                        <Input type="password" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="newPassword"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>New Password</FormLabel>
                                    <FormControl>
                                        <Input type="password" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="confirmNewPassword"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Confirm New Password</FormLabel>
                                    <FormControl>
                                        <Input type="password" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <div className="flex justify-end">
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting ? "Updating..." : "Change Password"}
                            </Button>
                        </div>
                    </form>
                </Form>
            </CardContent>
        </Card>
    );
}

function ActiveSessionsCard() {
    // Mock data for active sessions
    const mockSessions = [
        {
            id: "1",
            device: "Desktop - Chrome on Windows",
            location: "New York, USA",
            lastActive: "2 hours ago",
            isCurrent: true,
        },
        {
            id: "2",
            device: "Mobile - Safari on iOS",
            location: "London, UK",
            lastActive: "1 day ago",
            isCurrent: false,
        },
    ];

    return (
        <Card>
            <CardHeader>
                <CardTitle>Active Sessions</CardTitle>
                <CardDescription>Manage and view your active login sessions.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {mockSessions.map((session) => (
                    <div key={session.id} className="flex items-center justify-between p-3 rounded-md border">
                        <div>
                            <p className="font-medium">{session.device} {session.isCurrent && <Badge variant="outline" className="ml-2">Current</Badge>}</p>
                            <p className="text-sm text-muted-foreground">{session.location} - Last active: {session.lastActive}</p>
                        </div>
                        {!session.isCurrent && <Button variant="outline" size="sm">Revoke</Button>}
                    </div>
                ))}
            </CardContent>
        </Card>
    );
}

function TwoFactorAuthCard() {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Two-Factor Authentication (2FA)</CardTitle>
                <CardDescription>Enhance your account security by enabling 2FA.</CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-between">
                <div>
                    <p className="font-medium">Status: <Badge variant="destructive">Disabled</Badge></p>
                    <p className="text-sm text-muted-foreground">
                        Two-factor authentication is currently disabled for your account.
                    </p>
                </div>
                <Button>Enable 2FA</Button>
            </CardContent>
        </Card>
    );
}

// Mock data for user activity
const mockUserActivity = [
    {
        id: "1",
        title: "Solo Leveling",
        type: "Manhwa",
        progress: "Chapter 179",
        timestamp: "Read 30 minutes ago",
        imageUrl: "/placeholder-manga.jpg", // Replace with actual or better placeholder
    },
    {
        id: "2",
        title: "One Piece",
        type: "Manga",
        progress: "Chapter 1098",
        timestamp: "Read 5 hours ago",
        imageUrl: "/placeholder-manga.jpg",
    },
    {
        id: "3",
        title: "The Beginning After The End",
        type: "Manhwa",
        progress: "Volume 10, Chapter 450",
        timestamp: "Read yesterday",
        imageUrl: "/placeholder-manga.jpg",
    },
    {
        id: "4",
        title: "Berserk",
        type: "Manga",
        progress: "Volume 41",
        timestamp: "Read 2 days ago",
        imageUrl: "/placeholder-manga.jpg",
    },
    {
        id: "5",
        title: "Tower of God",
        type: "Manhwa",
        progress: "Season 3, Episode 180",
        timestamp: "Read 3 days ago",
        imageUrl: "/placeholder-manga.jpg",
    },
];

function UserActivityFeed() {
    return (
        <div className="space-y-6">
            <h2 className="text-lg font-medium">Recent Reading Activity</h2>
            {mockUserActivity.length > 0 ? (
                <div className="space-y-4">
                    {mockUserActivity.map((activity) => (
                        <Card key={activity.id}>
                            <CardContent className="p-4 flex items-start gap-4">
                                <Avatar className="h-16 w-16 rounded-md">
                                    <AvatarImage src={activity.imageUrl} alt={activity.title} />
                                    <AvatarFallback>{activity.title.substring(0, 2)}</AvatarFallback>
                                </Avatar>
                                <div className="flex-grow">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h3 className="font-semibold">{activity.title}</h3>
                                            <p className="text-sm text-muted-foreground">{activity.type} - {activity.progress}</p>
                                        </div>
                                        <Badge variant="outline" className="text-xs">{activity.timestamp}</Badge>
                                    </div>
                                    {/* Future: Could add a link to the series or chapter here */}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : (
                <p>No recent activity.</p>
            )}
        </div>
    );
}