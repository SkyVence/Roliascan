"use client"
import { useState, useRef, useEffect, ChangeEvent, FormEvent } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
  } from "@/components/ui/select"

export function CreateContentForm() {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [author, setAuthor] = useState('');
    const [contentType, setContentType] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

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

    return (
        <div className="*:data-[slot=card]:shadow-xs @xl/main:grid-cols-3 @5xl/main:grid-cols-4 grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card lg:px-6 mt-6">
            {/* Form Card - Added col-span */}
            <Card className="@container/card @xl/main:col-span-2">
                <CardHeader className="relative">
                    <CardDescription>Fill the form below to create a new content</CardDescription>
                    <CardTitle className="@[250px]/card:text-3xl text-2xl font-semibold tabular-nums">Create Content</CardTitle>
                </CardHeader>
                <CardContent className="items-center justify-center">
                    <form> {/* TODO: Add form submission logic */}
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
                            {/* Row for Author and Type */}
                            <div className="flex flex-row gap-4">
                                {/* Author Column */}
                                <div className="flex flex-col gap-2 flex-grow">
                                    <Label htmlFor="author">Author</Label>
                                    <Input
                                        id="author"
                                        type="text"
                                        placeholder="Author"
                                        value={author}
                                        onChange={(e) => setAuthor(e.target.value)}
                                    />
                                </div>
                                {/* Type Column */}
                                <div className="flex flex-col gap-2">
                                    <Label htmlFor="contentType">Content Type</Label>
                                    <Select onValueChange={setContentType} value={contentType}>
                                        <SelectTrigger id="contentType" className="w-[180px]">
                                            <SelectValue placeholder="Select type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="manga">Manga</SelectItem>
                                            <SelectItem value="manhua">Manhua</SelectItem>
                                            <SelectItem value="manhwa">Manhwa</SelectItem>
                                            <SelectItem value="webtoon">Webtoon</SelectItem>
                                            <SelectItem value="comics">Comics</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="flex flex-col gap-2">
                                <Label htmlFor="coverArt">Cover Art</Label>
                                <Input
                                    type="file"
                                    ref={fileInputRef}
                                    className="hidden"
                                    accept="image/*" // Optional: restrict to image files
                                    id="coverArt-input" // Different id for input
                                />
                                <Button
                                    id="coverArt"
                                    variant="outline"
                                    className='cursor-pointer'
                                    type="button" // Prevent form submission
                                    onClick={() => fileInputRef.current?.click()} // Trigger hidden input
                                >
                                    Upload File
                                </Button>
                            </div>
                            <Button type="submit" className='cursor-pointer'>Create Content</Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}