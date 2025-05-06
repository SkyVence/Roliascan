import { AppHeader } from "@/components/header/app-header";

export default function MainLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>
        <AppHeader />
        {children}
    </>;
}
