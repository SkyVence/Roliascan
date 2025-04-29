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
import { useBetterAuth } from "@/components/authentication/better-context";


const loginSchema = z.object({
    identifier: z.union([
        z.string().email({ message: "Please enter a valid email address." }),
        z.string().min(3, { message: "Username must be at least 3 characters long." })
    ], {
        errorMap: (issue, ctx) => {
            if (issue.code === z.ZodIssueCode.invalid_union) {
                return { message: "Please enter a valid email or username (min 3 characters)." };
            }
            return { message: ctx.defaultError };
        }
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

    const { handleAuthAction, isSubmitting } = useBetterAuth()

    const form = useForm<z.infer<typeof loginSchema>>({
        resolver: zodResolver(loginSchema),
        defaultValues: {
            identifier: "",
            password: "",
        },
    });

    async function onSubmit(data: LoginFormData) {
        const isEmail = data.identifier.includes('@') && data.identifier.includes('.');
        const payload = {
            password: data.password,
            ...(isEmail ? { email: data.identifier } : { username: data.identifier })
        };

        await handleAuthAction(
            '/auth/login',
            payload,
            form,
            "Login successful! Redirecting...",
            '/'
        );
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
                            name="identifier"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Email or Username</FormLabel>
                                    <FormControl>
                                        <Input type="text" placeholder="example@email.com or username" {...field} />
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
                        <Button type="submit" className="w-full" disabled={isSubmitting}>
                            {isSubmitting ? "Logging in..." : "Login"}
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
