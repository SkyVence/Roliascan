"use client"
import { useParams } from "next/navigation"
import { any, z } from "zod";
import InvalidParams from "@/components/invalid/params";
import { api } from "@/lib/api";
import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { CompactCard, CompactCardContent } from "@/components/ui/compact-card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft, Calendar, FileText, Link2, User } from "lucide-react";
import { Edit } from "lucide-react";
import { Trash } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns"
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
const apiResObject = z.object({
    title: z.object({
        id: z.string().uuid(),
        name: z.string(),
        description: z.string().optional(),
        imageUrl: z.string().url().optional(),
        createdAt: z.date(),
        updatedAt: z.date(),
        status: z.enum(["ongoing", "completed", "hiatus", "cancelled"]),
        type: z.enum(["manga", "manhwa", "manhua", "comics", "other"]),
        author: z.object({
            id: z.string().uuid(),
            name: z.string(),
            description: z.string().optional(),
            createdAt: z.date(),
            updatedAt: z.date(),
        }),
        links: z.array(z.object({
            id: z.string().uuid(),
            titleId: z.string().uuid(),
            url: z.string().url(),
            createdAt: z.date(),
            updatedAt: z.date(),
        })),
        genres: z.array(z.object({
            titleId: z.string().uuid(),
            genreId: z.string().uuid(),
            genre: z.object({
                id: z.string().uuid(),
                name: z.string(),
                description: z.string().optional(),
                createdAt: z.date(),
                updatedAt: z.date(),
            })
        })),
        chapters: z.array(z.any())
    })
})

export default function TitlePage() {
    const [titleInfo, setTitleInfo] = useState<z.infer<typeof apiResObject>>();
    const [loading, setLoading] = useState(false);
    const params = useParams<{ uuid: string }>();

    const validateParams = z.string().uuid().safeParse(params.uuid);

    if (!validateParams.success) {
        return <InvalidParams name="Title" type="UUID" id={params.uuid} />;
    }

    const getChapterInfo = async () => {
        const res = await api.get<z.infer<typeof apiResObject>>(`/title?titleId=${params.uuid}`);
        return res.data;
    }

    useEffect(() => {
        setLoading(true);
        getChapterInfo().then((data) => {
            setTitleInfo(data);
            setLoading(false);
        });
    }, []);

    if (loading) {
        return (
            <div className="container mx-auto py-6 space-y-6">
                <div className="flex justify-between items-center">
                    <div className="flex flex-col gap-2">
                        <Skeleton className="h-8 w-[300px]" />
                        <Skeleton className="h-4 w-[200px]" />
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" asChild>
                            <Link href="/admin/titles">
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Back
                            </Link>
                        </Button>
                        <Button variant="outline" size="sm" asChild>
                            <Link href={`/admin/titles/${params.uuid}/edit`}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                            </Link>
                        </Button>
                        <Button variant="destructive" size="sm">
                            <Trash className="mr-2 h-4 w-4" />
                            Delete
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-2 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                            <CompactCard className="md:col-span-1">
                                <CompactCardContent className="p-0">
                                    <Skeleton className="w-full aspect-[2/3] rounded-xl" />
                                </CompactCardContent>
                            </CompactCard>

                            <Card className="md:col-span-3">
                                <CardHeader>
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <Skeleton className="h-8 w-[250px] mb-2" />
                                            <div className="flex gap-2">
                                                <Skeleton className="h-6 w-[80px]" />
                                                <Skeleton className="h-6 w-[80px]" />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Skeleton className="h-4 w-[150px]" />
                                            <Skeleton className="h-4 w-[150px]" />
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <Skeleton className="h-20 w-full" />
                                </CardContent>
                            </Card>
                        </div>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between">
                                <div>
                                    <CardTitle className="text-xl">Chapters</CardTitle>
                                    <CardDescription>
                                        <Skeleton className="h-4 w-[200px] mt-2" />
                                    </CardDescription>
                                </div>
                                <Button size="sm" asChild>
                                    <Link href={`/admin/titles/${params.uuid}/chapters/create`}>Add Chapter</Link>
                                </Button>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    {[1, 2, 3].map((i) => (
                                        <Skeleton key={i} className="h-12 w-full" />
                                    ))}
                                </div>
                            </CardContent>
                            <CardFooter>
                                <Button variant="outline" size="sm" className="w-full" asChild>
                                    <Link href={`/admin/titles/${params.uuid}/chapters`}>View All Chapters</Link>
                                </Button>
                            </CardFooter>
                        </Card>
                    </div>

                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-xl">Author</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-start gap-3">
                                    <User className="h-10 w-10 rounded-full bg-muted p-2" />
                                    <div className="space-y-2">
                                        <Skeleton className="h-4 w-[150px]" />
                                        <Skeleton className="h-4 w-[200px]" />
                                    </div>
                                </div>
                            </CardContent>
                            <CardFooter>
                                <Button variant="outline" size="sm" className="w-full">
                                    <Skeleton className="h-4 w-[100px]" />
                                </Button>
                            </CardFooter>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-xl">Genres</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex flex-wrap gap-2">
                                    {[1, 2, 3, 4].map((i) => (
                                        <Skeleton key={i} className="h-6 w-[80px]" />
                                    ))}
                                </div>
                            </CardContent>
                            <CardFooter>
                                <Button variant="outline" size="sm" className="w-full" asChild>
                                    <Link href={`/admin/titles/${params.uuid}/edit-genres`}>Edit Genres</Link>
                                </Button>
                            </CardFooter>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-xl">External Links</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    {[1, 2].map((i) => (
                                        <Skeleton key={i} className="h-12 w-full" />
                                    ))}
                                </div>
                            </CardContent>
                            <CardFooter>
                                <Button variant="outline" size="sm" className="w-full" asChild>
                                    <Link href={`/admin/titles/${params.uuid}/add-link`}>Add Link</Link>
                                </Button>
                            </CardFooter>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-xl">Metadata</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    <div className="flex justify-between">
                                        <span className="text-sm text-muted-foreground">ID:</span>
                                        <Skeleton className="h-4 w-[200px]" />
                                    </div>
                                    <Separator />
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-muted-foreground">Created:</span>
                                        <Skeleton className="h-4 w-[100px]" />
                                    </div>
                                    <Separator />
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-muted-foreground">Updated:</span>
                                        <Skeleton className="h-4 w-[100px]" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto py-6 space-y-6">
            <div className="flex justify-between items-center">
                <div className="flex flex-col gap-2">
                    <h1 className="text-2xl font-bold">Title Information : {titleInfo?.title.name}</h1>
                    <h2 className="text-sm text-muted-foreground">{titleInfo?.title.id}</h2>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" asChild>
                        <Link href="/admin/titles">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back
                        </Link>
                    </Button>
                    <Button variant="outline" size="sm" asChild>
                        <Link href={`/admin/titles/${params.uuid}/edit`}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                        </Link>
                    </Button>
                    <Button variant="destructive" size="sm">
                        <Trash className="mr-2 h-4 w-4" />
                        Delete
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <CompactCard className="md:col-span-1">
                            <CompactCardContent className="p-0">
                                <div className="relative w-full aspect-[2/3]">
                                    {titleInfo?.title.imageUrl ? (
                                        <img
                                            src={titleInfo.title.imageUrl}
                                            alt={titleInfo.title.name}
                                            className="object-cover w-full h-full rounded-xl"
                                        />
                                    ) : (
                                        <div className="w-full h-full bg-muted rounded-xl flex items-center justify-center">
                                            <FileText className="h-12 w-12 text-muted-foreground" />
                                        </div>
                                    )}
                                </div>
                            </CompactCardContent>
                        </CompactCard>

                        <Card className="md:col-span-3">
                            <CardHeader>
                                <div className="flex justify-between items-start">
                                    <div>
                                        <CardTitle className="text-2xl">{titleInfo?.title.name}</CardTitle>
                                        <CardDescription>
                                            <div className="flex gap-2 mt-2">
                                                <Badge>
                                                    {titleInfo?.title?.status ? titleInfo.title.status.charAt(0).toUpperCase() + titleInfo.title.status.slice(1) : "Unknown"}
                                                </Badge>
                                                <Badge>
                                                    {titleInfo?.title?.type ? titleInfo.title.type.charAt(0).toUpperCase() + titleInfo.title.type.slice(1) : "Unknown"}
                                                </Badge>
                                            </div>
                                        </CardDescription>
                                    </div>
                                    <div className="text-sm text-muted-foreground">
                                        <div>Created: {titleInfo?.title?.createdAt ? new Date(titleInfo.title.createdAt).toLocaleString() : 'N/A'}</div>
                                        <div>Updated: {titleInfo?.title?.updatedAt ? new Date(titleInfo.title.updatedAt).toLocaleString() : 'N/A'}</div>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <p className="text-muted-foreground">{titleInfo?.title?.description || "No description available."}</p>
                            </CardContent>
                        </Card>
                    </div>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle className="text-xl">Chapters</CardTitle>
                                <CardDescription>
                                    Manage chapters for {titleInfo?.title?.name}
                                </CardDescription>
                            </div>
                            <Button size="sm" asChild>
                                <Link href={`/admin/titles/${params.uuid}/chapters/create`}>Add Chapter</Link>
                            </Button>
                        </CardHeader>
                        <CardContent>
                            {titleInfo?.title.chapters && titleInfo.title.chapters.length > 0 ? (
                                <div className="space-y-2">
                                    {titleInfo.title.chapters.map((chapter: any) => (
                                        <div key={chapter.id} className="flex items-center justify-between p-3 bg-muted rounded-md">
                                            <div className="flex items-center gap-2">
                                                <FileText className="h-4 w-4 text-muted-foreground" />
                                                <span>
                                                    Chapter {chapter.number}: {chapter.title}
                                                </span>
                                            </div>
                                            <div className="flex gap-2">
                                                <Button variant="ghost" size="icon" asChild>
                                                    <Link href={`/admin/titles/${params.uuid}/chapters/${chapter.id}`}>
                                                        <Edit className="h-4 w-4" />
                                                    </Link>
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-muted-foreground">No chapters available.</p>
                            )}
                        </CardContent>
                        <CardFooter>
                            <Button variant="outline" size="sm" className="w-full" asChild>
                                <Link href={`/admin/titles/${params.uuid}/chapters`}>View All Chapters</Link>
                            </Button>
                        </CardFooter>
                    </Card>
                </div>

                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-xl">Author</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-start gap-3">
                                <User className="h-10 w-10 rounded-full bg-muted p-2" />
                                <div>
                                    <h3 className="font-medium">{titleInfo?.title.author.name}</h3>
                                    <p className="text-sm text-muted-foreground">{titleInfo?.title.author.description || "No author description available."}</p>
                                    {/* TODO: Add author links */}
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Button variant="outline" size="sm" asChild>
                                <Link href={`/admin/authors/${titleInfo?.title.author.id}`}>View Author</Link>
                            </Button>
                        </CardFooter>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-xl">Genres</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-wrap gap-2">
                                {titleInfo?.title.genres.map((genreItem) => (
                                    <Badge key={genreItem.genre.id}>
                                        {genreItem.genre.name}
                                    </Badge>
                                ))}
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Button variant="outline" size="sm" className="w-full" asChild>
                                <Link href={`/admin/titles/${params.uuid}/edit-genres`}>Edit Genres</Link>
                            </Button>
                        </CardFooter>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-xl">External Links</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {titleInfo?.title.links && titleInfo.title.links.length > 0 ? (
                                <div className="space-y-2">
                                    {titleInfo.title.links.map((link: any) => (
                                        <div key={link.id} className="flex items-center justify-between p-3 bg-muted rounded-md">
                                            <div className="flex items-center gap-2">
                                                <Link2 className="h-4 w-4 text-muted-foreground" />
                                                <span>{link.title}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-muted-foreground">No external links available.</p>
                            )}
                        </CardContent>
                        <CardFooter>
                            <Button variant="outline" size="sm" className="w-full" asChild>
                                <Link href={`/admin/titles/${params.uuid}/add-link`}>Add Link</Link>
                            </Button>
                        </CardFooter>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-xl">Metadata</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                <div className="flex justify-between">
                                    <span className="text-sm text-muted-foreground">ID:</span>
                                    <span className="text-sm font-mono">{titleInfo?.title.id}</span>
                                </div>
                                <Separator />
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-muted-foreground">Created:</span>
                                    <span className="text-sm flex items-center gap-1">
                                        <Calendar className="h-3 w-3" />
                                        {titleInfo?.title.createdAt && format(new Date(titleInfo.title.createdAt), "PP")}
                                    </span>
                                </div>
                                <Separator />
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-muted-foreground">Updated:</span>
                                    <span className="text-sm flex items-center gap-1">
                                        <Calendar className="h-3 w-3" />
                                        {titleInfo?.title.updatedAt && format(new Date(titleInfo.title.updatedAt), "PP")}
                                    </span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )


}