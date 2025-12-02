import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
    LayoutDashboard,
    PenTool,
    Database,
    CreditCard,
    User,
    Settings,
    LogOut,
    TrendingUp,
    Network,
    Tag,
    Merge,
    Trophy
} from 'lucide-react';

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> { }

export function Sidebar({ className }: SidebarProps) {
    const pathname = usePathname();

    const routes = [
        {
            label: 'Dashboard',
            icon: LayoutDashboard,
            href: '/dashboard',
            active: pathname === '/dashboard',
        },
        {
            label: 'Editor',
            icon: PenTool,
            href: '/editor',
            active: pathname.startsWith('/editor'),
        },
        {
            label: 'Data Sources',
            icon: Database,
            href: '/data-sources',
            active: pathname === '/data-sources',
        },
        {
            label: 'Memory Graph',
            icon: Network,
            href: '/memory-graph',
            active: pathname === '/memory-graph',
        },
        {
            label: 'Tags',
            icon: Tag,
            href: '/tags',
            active: pathname === '/tags',
        },
        {
            label: 'Mergers',
            icon: Merge,
            href: '/mergers',
            active: pathname === '/mergers',
        },
        {
            label: 'Achievements',
            icon: Trophy,
            href: '/achievements',
            active: pathname === '/achievements',
        },
        {
            label: 'Monetization',
            icon: CreditCard,
            href: '/monetization',
            active: pathname === '/monetization',
        },
        {
            label: 'Revenue',
            icon: TrendingUp,
            href: '/revenue',
            active: pathname === '/revenue',
        },
        {
            label: 'Profile',
            icon: User,
            href: '/profile',
            active: pathname === '/profile',
        },
        {
            label: 'Settings',
            icon: Settings,
            href: '/settings',
            active: pathname === '/settings',
        },
    ];

    return (
        <div className={cn("pb-12 w-64 border-r min-h-screen bg-background", className)}>
            <div className="space-y-4 py-4">
                <div className="px-3 py-2">
                    <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">
                        Lifeline
                    </h2>
                    <div className="space-y-1">
                        {routes.map((route) => (
                            <Button
                                key={route.href}
                                variant={route.active ? "secondary" : "ghost"}
                                className="w-full justify-start"
                                asChild
                            >
                                <Link href={route.href}>
                                    <route.icon className="mr-2 h-4 w-4" />
                                    {route.label}
                                </Link>
                            </Button>
                        ))}
                    </div>
                </div>
            </div>
            <div className="absolute bottom-4 px-3 w-full">
                <Button variant="ghost" className="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-50">
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                </Button>
            </div>
        </div>
    );
}
