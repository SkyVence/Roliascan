"use client"
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { FormEvent, useRef, useState } from "react";
import axiosInstance from "@/lib/axios";
import { toast } from "sonner";
import { useBetterAuth } from "@/components/authentication/better-context";

export function CreateChapterForm() {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [status, setStatus] = useState<'ongoing' | 'completed' | 'cancelled' | 'hiatus'>('ongoing');
    const [type, setType] = useState<'manga' | 'manhwa' | 'manhua' | 'comic' | 'other'>('manga');
    const [year, setYear] = useState(new Date().getFullYear());
    const [chapterCount, setChapterCount] = useState(0);
    const [volumeCount, setVolumeCount] = useState(0);
    const [authorId, setAuthorId] = useState('');
    const [teamId, setTeamId] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { user } = useBetterAuth();

    // Simple slugify function for preview
    const slugify = (text: string): string => {
        return text
            .toString()
            .toLowerCase()
            .trim()
            .replace(/\s+/g, '-') // Replace spaces with -
            .replace(/[^\w\-]+/g, '') // Remove all non-word chars
            .replace(/\-\-+/g, '-'); // Replace multiple - with single -
    };

    const slugPreview = slugify(title);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        
        // Prepare the request body
        const requestBody: any = {
            title,
            slug: slugPreview,
            description,
            status,
            type,
            year,
            chapterCount,
            volumeCount,
            authorId,
            uploaderId: user?.userId, // This should be replaced with the actual user ID
        };

        // Only add teamId if a team is selected
        if (teamId !== '') {
            requestBody.teamId = teamId;
        }

        try {
            const response = await axiosInstance.post('/title', requestBody);
            
            toast.success(`Title created successfully with ID: ${response.data.titleId}`);
            // Reset form or redirect
        } catch (error: any) {
            toast.error(`Error: ${error.response?.data?.message || 'An error occurred while submitting the form'}`);
        }
    };
    
    return (
        <div className="*:data-[slot=card]:shadow-xs @xl/main:grid-cols-3 @5xl/main:grid-cols-4 grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card lg:px-6 mt-6">
        {/* Form Card - Added col-span */}
        <Card className="@container/card @xl/main:col-span-2">
            <CardHeader className="relative">
                <CardDescription>Fill the form below to create a new title</CardDescription>
                <CardTitle className="@[250px]/card:text-3xl text-2xl font-semibold tabular-nums">Create a new title</CardTitle>
            </CardHeader>
            <CardContent className="items-center justify-center">
                <form onSubmit={handleSubmit}>
                    <div className="flex flex-col gap-4">
                        {/* Row for Title and Slug Preview */}
                        <div className="flex flex-row gap-4 items-end">
                             {/* Title Column */}
                            <div className="flex flex-col gap-2 flex-grow">
                                <Label htmlFor="title">Title</Label>
                                <Input
                                    id="title"
                                    type="text"
                                    placeholder="Title"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    required
                                />
                            </div>
                             {/* Slug Preview Column - Added flex-grow */}
                            <div className="flex flex-col gap-2 flex-grow">
                                <Label htmlFor="slugPreview">Slug Preview</Label>
                                <span id="slugPreview" className="text-sm text-muted-foreground h-10 flex items-center px-3 border border-input rounded-md bg-muted">
                                    /{slugPreview || '...'}
                                </span>
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
                        
                        {/* Status and Type */}
                        <div className="flex flex-row gap-4">
                            <div className="flex flex-col gap-2 flex-grow">
                                <Label htmlFor="status">Status</Label>
                                <Select onValueChange={(value) => setStatus(value as any)} value={status}>
                                    <SelectTrigger id="status" className="w-full">
                                        <SelectValue placeholder="Select status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="ongoing">Ongoing</SelectItem>
                                        <SelectItem value="completed">Completed</SelectItem>
                                        <SelectItem value="cancelled">Cancelled</SelectItem>
                                        <SelectItem value="hiatus">Hiatus</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex flex-col gap-2 flex-grow">
                                <Label htmlFor="type">Type</Label>
                                <Select onValueChange={(value) => setType(value as any)} value={type}>
                                    <SelectTrigger id="type" className="w-full">
                                        <SelectValue placeholder="Select type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="manga">Manga</SelectItem>
                                        <SelectItem value="manhwa">Manhwa</SelectItem>
                                        <SelectItem value="manhua">Manhua</SelectItem>
                                        <SelectItem value="comic">Comic</SelectItem>
                                        <SelectItem value="other">Other</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        
                        {/* Year, Chapters, Volumes */}
                        <div className="flex flex-row gap-4">
                            <div className="flex flex-col gap-2 flex-grow">
                                <Label htmlFor="year">Year</Label>
                                <Input
                                    id="year"
                                    type="number"
                                    placeholder="Year"
                                    value={year}
                                    onChange={(e) => setYear(parseInt(e.target.value))}
                                    required
                                />
                            </div>
                            <div className="flex flex-col gap-2 flex-grow">
                                <Label htmlFor="chapterCount">Chapter Count</Label>
                                <Input
                                    id="chapterCount"
                                    type="number"
                                    placeholder="Chapter Count"
                                    value={chapterCount}
                                    onChange={(e) => setChapterCount(parseInt(e.target.value))}
                                    required
                                />
                            </div>
                            <div className="flex flex-col gap-2 flex-grow">
                                <Label htmlFor="volumeCount">Volume Count</Label>
                                <Input
                                    id="volumeCount"
                                    type="number"
                                    placeholder="Volume Count"
                                    value={volumeCount}
                                    onChange={(e) => setVolumeCount(parseInt(e.target.value))}
                                    required
                                />
                            </div>
                        </div>
                        
                        {/* Author and Team */}
                        <div className="flex flex-row gap-4">
                            <div className="flex flex-col gap-2 flex-grow">
                                <Label htmlFor="authorId">Author</Label>
                                <Select onValueChange={setAuthorId} value={authorId}>
                                    <SelectTrigger id="authorId" className="w-full">
                                        <SelectValue placeholder="Select author" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {/* Author dropdown with no values as requested */}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex flex-col gap-2 flex-grow">
                                <Label htmlFor="teamId">Team (Optional)</Label>
                                <Select onValueChange={setTeamId} value={teamId}>
                                    <SelectTrigger id="teamId" className="w-full">
                                        <SelectValue placeholder="Select team" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {/* Team dropdown with no values as requested */}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        
                        <Button type="submit" className='cursor-pointer'>Create Title</Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    </div>
    )
}
