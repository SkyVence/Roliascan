"use client"
import { Card, CardHeader, CardDescription, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { FormEvent } from "react";
import { useState } from "react";
import axiosInstance from "@/lib/axios";
import { toast } from "sonner";
import { useBetterAuth } from "@/components/authentication/better-context";

export default function AuthorsForm() {
    const { user, isAuthenticated } = useBetterAuth();
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        
        if (!isAuthenticated) {
            toast.error("You must be logged in to create authors");
            return;
        }

        const requestBody = { name, description };
        
        try {
            const response = await axiosInstance.post('/authors', requestBody);
            toast.success(`Author created successfully with ID: ${response.data.authorId}`);
        } catch (error: any) {
            toast.error(`Error: ${error.response?.data?.message || 'An error occurred while submitting the form'}`);
        }
    }

    return (
        <div className="*:data-[slot=card]:shadow-xs @xl/main:grid-cols-3 @5xl/main:grid-cols-4 grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card lg:px-6 mt-6">
        {/* Form Card - Added col-span */}
        <Card className="@container/card @xl/main:col-span-2">
            <CardHeader className="relative">
                <CardDescription>Fill the form below to create a new Author</CardDescription>
                <CardTitle className="@[250px]/card:text-3xl text-2xl font-semibold tabular-nums">Create a new Author</CardTitle>
            </CardHeader>
            <CardContent className="items-center justify-center">
                <form onSubmit={handleSubmit}>
                    <div className="flex flex-col gap-4">
                        {/* Row for Title and Slug Preview */}
                        <div className="flex flex-row gap-4 items-end">
                             {/* Title Column */}
                            <div className="flex flex-col gap-2 flex-grow">
                                <Label htmlFor="name">Name</Label>
                                <Input
                                    id="name"
                                    type="text"
                                    placeholder="Name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                />
                            </div>
                        </div>
                        <div className="flex flex-col gap-2">
                            <Label htmlFor="description">Description</Label>
                            <Textarea
                                id="description"
                                placeholder="Type your description here."
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                
                             />
                        </div>
                        
                        <Button type="submit" className='cursor-pointer'>Create Author</Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    </div>
    )
}