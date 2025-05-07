import Link from "next/link";
import { Button } from "../ui/button";

interface InvalidParamsProps {  
    name: string;
    type: string;
    id: string;
}

export default function InvalidParams({ name, type, id }: InvalidParamsProps) {
    return (
        <div className="flex flex-col items-center justify-center h-screen">
            <h1 className="text-2xl font-bold">Invalid {name} ID</h1>
            <p className="text-sm text-gray-500">To access this page, you must have a valid {type}.</p>
            <Button className="mt-4" variant="outline" asChild>
                <Link href={`/chapter?partial=true&id=${id}`}>Search for partial match.</Link>
            </Button>
        </div>
    )
}