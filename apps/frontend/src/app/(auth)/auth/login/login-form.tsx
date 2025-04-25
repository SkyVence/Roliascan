"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";;
import { cn } from "@/lib/utils";
import { zodResolver } from '@hookform/resolvers/zod';
import Link from "next/link";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { useRouter } from "next/navigation";
import { useState } from "react";
import axiosInstance from '@/lib/axios';
import { AxiosError } from 'axios';
import { toast } from "sonner";


const loginSchema = z.object({
    email: z.string().email({
        message: "Please enter a valid email address.",
    }),
    password: z.string().min(1, {
        message: "Password is required.",
    }),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginForm({
    className,
    ...props
}: React.ComponentPropsWithoutRef<"div">) {

    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const form = useForm<z.infer<typeof loginSchema>>({
        resolver: zodResolver(loginSchema),
        defaultValues: {
            email: "",
            password: "",
        },
    });

    async function onSubmit(data: LoginFormData) {
        setIsLoading(true);
        form.clearErrors();

        try {
            const response = await axiosInstance.post('/auth/login', {
                email: data.email,
                password: data.password,
            }, { useAuthToken: false });

            console.log("Login successful:", response.data);
            toast.success("Login successful! Redirecting...");

            setTimeout(() => {
                router.push('/');
            }, 1500);

        } catch (error) {
            let errorMessage = "An unexpected error occurred during login. Please try again.";

            if (error instanceof AxiosError && error.response) {
                const backendError = error.response.data as { message?: string; statusCode?: number };
                const backendMessage = backendError.message || 'An unknown server error occurred';
                console.error("Login failed:", backendMessage, "Status:", error.response.status);

                if (error.response.status === 401) {
                    errorMessage = backendMessage || "Invalid email or password.";
                } else if (error.response.status === 400) {
                    errorMessage = `Login failed: ${backendMessage}`;
                } else {
                    errorMessage = `Login failed: ${backendMessage}`;
                }
            } else {
                console.error("An unexpected error occurred:", error);
            }

            toast.error(errorMessage);

        } finally {
            setIsLoading(false);
        }
    }

    return (
        <Card className={cn("w-full max-w-sm", className)} {...props}>
            <CardHeader>
                <CardTitle className="text-2xl text-center">Login</CardTitle>
                <CardDescription className="text-center">Enter your credentials to login</CardDescription>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-y-4">
                        <FormField
                            control={form.control}
                            name="email"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Email</FormLabel>
                                    <FormControl>
                                        <Input type="email" placeholder="example@email.com" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="password"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Password</FormLabel>
                                    <FormControl>
                                        <Input type="password" placeholder="Password" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <Button type="submit" className="w-full" disabled={isLoading}>
                            {isLoading ? "Logging in..." : "Login"}
                        </Button>
                    </form>
                </Form>
                <div className="text-center text-sm text-muted-foreground mt-4">
                    Don&apos;t have an account? <Link href="/auth/register" className="text-primary hover:underline">Register</Link>
                </div>
            </CardContent>
        </Card>
    )
}
