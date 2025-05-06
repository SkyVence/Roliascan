"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";

import MultiStepForm, { MultiStepFormRef } from "@/components/forms/multi-step";
import { Button } from "@/components/ui/button";
import { useEffect, useRef, useState } from "react";
import AuthorInfoForm from "./author-info-form";
import BasicInfoForm from "./basic-info-form";
import GenreInfoForm from "./genre-info-form";
import axios from "axios";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

// Combine schemas from individual forms (assuming they exist and can be imported)
// This is a placeholder and will need to be adjusted based on the actual schemas
const combinedSchema = z.object({
    basicInfo: z.object({
        name: z.string().min(1, "Title name is required"),
        description: z.string().optional(),
        type: z.string().min(1, "Type is required"),
        status: z.string().min(1, "Status is required"),
        links: z.array(z.object({ 
            type: z.string(),
            url: z.string().url("Please enter a valid URL")
        })).optional(),
    }),
    authorInfo: z.object({
        authorOption: z.enum(["existing", "new"]).optional(),
        existingAuthor: z.string().optional(),
        newAuthor: z.object({
            name: z.string().optional(),
            description: z.string().optional(),
            links: z.array(z.object({ type: z.string(), url: z.string().url() })).optional(),
        }).optional(),
    }),
    genreInfo: z.object({
        genreOption: z.enum(["existing", "new"]).optional(),
        existingGenres: z.array(z.string()).optional(),
        newGenre: z.object({
            name: z.string().optional(),
            description: z.string().optional(),
        }).optional(),
    }),
});

type CombinedFormData = z.infer<typeof combinedSchema>;

// Mock data for authors prop in AuthorInfoForm
const mockAuthors = [
    { id: "5f2eac08-21d7-4353-97e1-520e51fd6eff", name: "Eiichiro Oda", description: "Creator of One Piece", socials: [] },
    { id: "kishimoto", name: "Masashi Kishimoto", description: "Creator of Naruto", socials: [] },
];

const TitleForm = () => {
    const multiStepFormRef = useRef<MultiStepFormRef>(null);
    const [authors, setAuthors] = useState<any[]>([]);
    const [genres, setGenres] = useState<any[]>([]);
    const router = useRouter();

        const methods = useForm<CombinedFormData>({
        resolver: zodResolver(combinedSchema),
        defaultValues: {
            basicInfo: {
                name: "",
                description: "",
                type: "manga",
                status: "ongoing",
                links: [],
            },
            authorInfo: {
                authorOption: "existing",
                existingAuthor: "",
                newAuthor: {
                    name: "",
                    description: "",
                    links: [],
                },
            },
            genreInfo: {
                genreOption: "existing",
                existingGenres: [],
                newGenre: {
                    name: "",
                    description: "",
                },
            },
        },
    });

    const onSubmit = async (data: CombinedFormData) => {
        console.log("Form data:", data);
        
        try {
            let authorId = "";
            
            // Handle author creation if needed
            if (data.authorInfo.authorOption === "new" && data.authorInfo.newAuthor) {
                try {
                    const authorData = {
                        name: data.authorInfo.newAuthor.name,
                        description: data.authorInfo.newAuthor.description || "",
                        socials: data.authorInfo.newAuthor.links || []
                    };
                    
                    const authorRes = await api.post("/author", authorData);
                    authorId = authorRes.data.author.id;
                    toast.success("Author created successfully");
                } catch (error) {
                    console.error("Error creating author:", error);
                    toast.error("Failed to create author");
                    return; // Stop form submission if author creation fails
                }
            } else if (data.authorInfo.authorOption === "existing") {
                authorId = data.authorInfo.existingAuthor || "";
            }
            
            // Check if we have a valid author ID
            if (!authorId) {
                toast.error("Author is required");
                return;
            }
            
            // Handle genre creation if needed
            let genreIds: string[] = [];
            
            if (data.genreInfo.genreOption === "existing" && data.genreInfo.existingGenres) {
                genreIds = data.genreInfo.existingGenres;
            }
            
            if (data.genreInfo.genreOption === "new" && data.genreInfo.newGenre?.name) {
                try {
                    const genreData = {
                        name: data.genreInfo.newGenre.name,
                        description: data.genreInfo.newGenre.description || ""
                    };
                    
                    const genreRes = await api.post("/genre", genreData);
                    genreIds = [genreRes.data.genre.id];
                    toast.success("Genre created successfully");
                } catch (error) {
                    console.error("Error creating genre:", error);
                    toast.error("Failed to create genre");
                    return; // Stop form submission if genre creation fails
                }
            }
            
            // Create the title with gathered information
            const titleData = {
                name: data.basicInfo.name,
                description: data.basicInfo.description || "",
                type: data.basicInfo.type,
                status: data.basicInfo.status,
                authorId: authorId,
                genres: genreIds,
                links: data.basicInfo.links ? data.basicInfo.links.map(link => ({
                    name: link.type,
                    url: link.url
                })) : []
            };
            
            const titleRes = await api.post("/title", titleData);
            toast.success("Title created successfully");
            
            // Optionally redirect or reset form
            methods.reset();
            router.push(`/admin/chapters/${titleRes.data.title.id}`);
            
        } catch (error) {
            console.error("Error submitting form:", error);
            toast.error("Failed to create title");
        }
    };



    const getAuthors = async () => {
        try {
            const res = await api.get("/author");
            console.log("Author API response:", res);
            
            // Extract authors array from the specific response structure
            const authorsData = res.data.authors || [];
            
            const authorsPayload = authorsData.map((author: { id: string; name: string }) => ({
                id: author.id,
                name: author.name
            }));
                
            console.log("Processed authors payload:", authorsPayload);
            setAuthors(authorsPayload);
        } catch (err) {
            console.error("Error fetching authors:", err);
            setAuthors([]);
        }
    };

    const getGenres = async () => {
        try {
            const res = await api.get("/genre");
            console.log("Genre API response:", res);

            const genresData = res.data.genres || [];

            const genresPayload = genresData.map((genre: { id: string; name: string }) => ({
                id: genre.id,
                name: genre.name
            }));

            console.log("Processed genres payload:", genresPayload);
            setGenres(genresPayload);
        } catch (err) {
            console.error("Error fetching genres:", err);
            setGenres([]);
        }
    };

    useEffect(() => {
        getAuthors();
        getGenres();
    }, []);

    const steps = [
        {
            name: "Basic Information",
            children: <BasicInfoForm form={methods} />,
        },
        {
            name: "Author Information",
            children: <AuthorInfoForm form={methods} authors={authors} />,
        },
        {
            name: "Genre Information",
            children: <GenreInfoForm form={methods} genres={genres} />,
        },
    ];

    return (
        <div className="p-4">
            <MultiStepForm
                ref={multiStepFormRef}
                schema={combinedSchema}
                methods={methods}
                steps={steps}
                onSubmit={onSubmit}
                controls={[
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => multiStepFormRef.current?.handleBack()}
                    >
                        Back
                    </Button>,
                    <Button
                        type="button"
                        onClick={() => multiStepFormRef.current?.handleNext()}
                    >
                        Next
                    </Button>,
                ]}
            />
        </div>
    );
};

export default TitleForm; 