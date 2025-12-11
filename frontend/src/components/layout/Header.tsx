import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { NotificationCenter } from "@/components/engagement/NotificationCenter";
import { useAuth } from "@/contexts/AuthContext";
import {
    Settings,
    HelpCircle,
    Moon,
    MessageSquareWarning,
    LogOut,
    ChevronRight,
    Search
} from "lucide-react";

interface HeaderProps {
    onSearchClick?: () => void;
}

export function Header({ onSearchClick }: HeaderProps) {
    const { user, logout } = useAuth();
    return (
        <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container mx-auto flex h-16 items-center justify-between px-4">
                <div className="flex items-center gap-2">
                    <h1 className="text-2xl font-bold" style={{ fontFamily: 'Playfair Display, serif' }}>
                        Sasagram
                    </h1>
                </div>

                <div className="flex items-center gap-4">
                    {onSearchClick && (
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={onSearchClick}
                        >
                            <Search className="h-5 w-5" />
                        </Button>
                    )}

                    {/* Show to everyone for now to ensure visibility as requested */}
                    <Button
                        className="bg-gradient-to-r from-pink-600 to-purple-600 text-white hover:from-pink-700 hover:to-purple-700 shadow-md border-0 font-semibold transition-all hover:scale-105"
                        onClick={() => window.location.href = '/become-creator'}
                    >
                        ✨ Become a Creator
                    </Button>

                    {user?.role === 'CREATOR' && (
                        <Button
                            variant="ghost"
                            className="hidden sm:flex"
                            onClick={() => window.location.href = '/dashboard'}
                        >
                            Dashboard
                        </Button>
                    )}

                    {user?.role === 'ADMIN' && (
                        <Button
                            variant="ghost"
                            className="hidden sm:flex text-red-500 hover:text-red-600"
                            onClick={() => window.location.href = '/admin'}
                        >
                            Admin
                        </Button>
                    )}

                    <NotificationCenter />

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="relative h-10 w-10 rounded-full p-0 overflow-hidden">
                                <Avatar className="h-full w-full">
                                    <AvatarImage src={user?.avatar || "/avatars/01.png"} alt={user?.name || "User"} />
                                    <AvatarFallback>{user?.name?.[0] || "U"}</AvatarFallback>
                                </Avatar>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-80 p-2" align="end" forceMount>
                            {/* Profile Header */}
                            <DropdownMenuItem
                                className="flex items-center gap-3 p-3 cursor-pointer mb-2 focus:bg-accent rounded-lg"
                                onClick={() => window.location.href = '/profile'}
                            >
                                <Avatar className="h-10 w-10 border">
                                    <AvatarImage src={user?.avatar || "/avatars/01.png"} alt={user?.name || "User"} />
                                    <AvatarFallback>{user?.name?.[0] || "U"}</AvatarFallback>
                                </Avatar>
                                <div className="flex flex-col">
                                    <span className="font-semibold text-base">{user?.name || "Guest User"}</span>
                                    <span className="text-sm text-muted-foreground">See your profile</span>
                                </div>
                            </DropdownMenuItem>

                            <DropdownMenuSeparator />

                            {/* Menu Items */}
                            <div className="space-y-1 mt-2">
                                <DropdownMenuItem className="flex items-center justify-between p-3 cursor-pointer focus:bg-accent rounded-lg group">
                                    <div className="flex items-center gap-3">
                                        <div className="flex items-center justify-center w-9 h-9 rounded-full bg-muted group-hover:bg-background transition-colors">
                                            <Settings className="h-5 w-5" />
                                        </div>
                                        <span className="font-medium">Settings & privacy</span>
                                    </div>
                                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                                </DropdownMenuItem>

                                <DropdownMenuItem className="flex items-center justify-between p-3 cursor-pointer focus:bg-accent rounded-lg group">
                                    <div className="flex items-center gap-3">
                                        <div className="flex items-center justify-center w-9 h-9 rounded-full bg-muted group-hover:bg-background transition-colors">
                                            <HelpCircle className="h-5 w-5" />
                                        </div>
                                        <span className="font-medium">Help & support</span>
                                    </div>
                                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                                </DropdownMenuItem>

                                <DropdownMenuItem className="flex items-center justify-between p-3 cursor-pointer focus:bg-accent rounded-lg group">
                                    <div className="flex items-center gap-3">
                                        <div className="flex items-center justify-center w-9 h-9 rounded-full bg-muted group-hover:bg-background transition-colors">
                                            <Moon className="h-5 w-5" />
                                        </div>
                                        <span className="font-medium">Display & accessibility</span>
                                    </div>
                                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                                </DropdownMenuItem>

                                <DropdownMenuItem className="flex items-center justify-between p-3 cursor-pointer focus:bg-accent rounded-lg group">
                                    <div className="flex items-center gap-3">
                                        <div className="flex items-center justify-center w-9 h-9 rounded-full bg-muted group-hover:bg-background transition-colors">
                                            <MessageSquareWarning className="h-5 w-5" />
                                        </div>
                                        <span className="font-medium">Give feedback</span>
                                    </div>
                                </DropdownMenuItem>

                                <DropdownMenuItem
                                    className="flex items-center justify-between p-3 cursor-pointer focus:bg-accent rounded-lg group mt-1"
                                    onClick={logout}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="flex items-center justify-center w-9 h-9 rounded-full bg-muted group-hover:bg-background transition-colors">
                                            <LogOut className="h-5 w-5 ml-0.5" />
                                        </div>
                                        <span className="font-medium">Log out</span>
                                    </div>
                                </DropdownMenuItem>
                            </div>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
        </header>
    );
}
