'use client';

import { Home, Search, User, Compass } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePathname, useRouter } from 'next/navigation';

export function MobileNav() {
    const pathname = usePathname();
    const router = useRouter();

    const isActive = (path: string) => pathname === path;

    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:hidden">
            <div className="flex h-16 items-center justify-around px-2">
                <Button
                    variant="ghost"
                    className={`flex flex-col items-center justify-center gap-1 h-full w-full rounded-none ${isActive('/discover') ? 'text-primary' : 'text-muted-foreground'
                        }`}
                    onClick={() => router.push('/discover')}
                >
                    <Home className="h-5 w-5" />
                    <span className="text-[10px] font-medium">Home</span>
                </Button>

                <Button
                    variant="ghost"
                    className={`flex flex-col items-center justify-center gap-1 h-full w-full rounded-none ${isActive('/search') ? 'text-primary' : 'text-muted-foreground'
                        }`}
                    onClick={() => router.push('/search')}
                >
                    <Search className="h-5 w-5" />
                    <span className="text-[10px] font-medium">Search</span>
                </Button>

                <Button
                    variant="ghost"
                    className={`flex flex-col items-center justify-center gap-1 h-full w-full rounded-none ${isActive('/profile') ? 'text-primary' : 'text-muted-foreground'
                        }`}
                    onClick={() => router.push('/profile')}
                >
                    <User className="h-5 w-5" />
                    <span className="text-[10px] font-medium">Profile</span>
                </Button>
            </div>
        </div>
    );
}
