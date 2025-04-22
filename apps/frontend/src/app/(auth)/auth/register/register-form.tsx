"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
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


const registerSchema = z.object({
    username: z.string().min(3, {
        message: "Username must be at least 3 characters.",
    }),
    email: z.string().email({
        message: "Please enter a valid email address.",
    }),
    password: z.string().min(8, {
        message: "Password must be at least 8 characters.",
    }),
    confirmPassword: z.string(),
    terms: z.boolean().refine((val) => val === true, {
        message: "You must accept the terms and conditions.",
    }),
})
    .refine((data) => data.password === data.confirmPassword, {
        message: "Passwords do not match.",
        path: ["confirmPassword"],
    })
type RegisterFormData = z.infer<typeof registerSchema>;

export default function RegisterForm({
    className,
    ...props
}: React.ComponentPropsWithoutRef<"div">) {

    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const form = useForm<z.infer<typeof registerSchema>>({
        resolver: zodResolver(registerSchema),
        defaultValues: {
            username: "",
            email: "",
            password: "",
            confirmPassword: "",
            terms: false,
        },
    });

    async function onSubmit(data: RegisterFormData) {
        setIsLoading(true);
        form.clearErrors(); // Clear previous errors

        try {
            // Use axiosInstance.post - baseURL is already configured
            const response = await axiosInstance.post('/auth/register', {
                username: data.username,
                email: data.email,
                password: data.password,
            });

            // Handle success (axios resolves on 2xx status)
            console.log("Registration successful:", response.data);
            toast.success("Account created successfully! Redirecting to login...");
            // Redirect user to login page after successful registration
            setTimeout(() => {
                router.push('/auth/login');
            }, 1500); // 1.5 second delay

        } catch (error) {
            let errorMessage = "An unexpected error occurred during registration. Please try again.";

            if (error instanceof AxiosError && error.response) {
                // Handle errors thrown by axios (non-2xx status codes)
                const backendError = error.response.data as { message?: string; statusCode?: number }; // Type assertion for error data
                const backendMessage = backendError.message || 'An unknown server error occurred';
                console.error("Registration failed:", backendMessage, "Status:", error.response.status);

                if (error.response.status === 400 && backendMessage) {
                    // Specific handling for validation errors (Bad Request)
                    if (backendMessage.toLowerCase().includes('email')) {
                        form.setError("email", { type: "server", message: backendMessage });
                        errorMessage = ""; // Prevent generic alert if specific field error is set
                    } else if (backendMessage.toLowerCase().includes('username')) {
                        form.setError("username", { type: "server", message: backendMessage });
                        errorMessage = ""; // Prevent generic alert if specific field error is set
                    } else {
                        // Other 400 errors
                        errorMessage = `Registration failed: ${backendMessage}`;
                    }
                } else {
                    // Handle other HTTP errors (e.g., 500, 401)
                    errorMessage = `Registration failed: ${backendMessage}`;
                }
            } else {
                // Handle non-axios errors (e.g., network errors, unexpected issues)
                console.error("An unexpected error occurred:", error);
            }

            if (errorMessage) {
                // Replace alert with toast.error
                toast.error(errorMessage);
            }
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <Card className={cn("w-full max-w-sm", className)} {...props}>
            <CardHeader>
                <CardTitle className="text-2xl text-center">Create an account</CardTitle>
                <CardDescription className="text-center">Enter your details below to create an account</CardDescription>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-y-4">
                        <FormField
                            control={form.control}
                            name="username"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Username</FormLabel>
                                    <FormControl>
                                        <Input placeholder="username" {...field} />
                                    </FormControl>
                                    <FormDescription>This is your public display name.</FormDescription>
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
                                        <Input placeholder="example@email.com" {...field} />
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
                                        <Input placeholder="Password" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="confirmPassword"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Confirm Password</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Confirm Password" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="terms"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                    <FormControl>
                                        <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                                    </FormControl>
                                    <div className="space-y-1 leading-none">
                                        <FormLabel>Accept terms and conditions</FormLabel>
                                        <FormDescription>You agree to our <Link href="/terms" className="text-primary hover:underline">Terms of Service</Link> and <Link href="/privacy" className="text-primary hover:underline">Privacy Policy</Link>.</FormDescription>
                                    </div>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <Button type="submit" className="w-full" disabled={isLoading}>
                            {isLoading ? "Creating account..." : "Register"}
                        </Button>
                    </form>
                </Form>
                <div className="text-center text-sm text-muted-foreground mt-4">
                    Already have an account? <Link href="/auth/login" className="text-primary hover:underline">Login</Link>
                </div>
            </CardContent>
        </Card>
    )
}
