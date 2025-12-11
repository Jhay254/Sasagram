import { cn } from '@/lib/utils';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

interface AppLayoutProps {
    children: React.ReactNode;
    className?: string;
}

export function AppLayout({ children, className }: AppLayoutProps) {
    return (
        <div className="flex min-h-screen">
            <Sidebar className="hidden md:block" />
            <div className="flex-1 flex flex-col">
                <Header />
                <main className={cn("flex-1 overflow-y-auto", className ?? "p-6")}>
                    {children}
                </main>
            </div>
        </div>
    );
}
