'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Search,
  Bell,
  Moon,
  Sun,
  User,
  Settings,
  LogOut,
  ChevronDown,
  Menu,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

interface HeaderProps {
  onMenuClick?: () => void;
  className?: string;
}

export function Header({ onMenuClick, className }: HeaderProps) {
  const { data: session } = useSession();
  const { logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const [searchFocused, setSearchFocused] = useState(false);

  return (
    <header className={cn(
      'sticky top-0 z-40 flex h-16 items-center gap-4 border-b bg-background/60 backdrop-blur-xl px-6',
      className
    )}>
      {/* Mobile Menu Button */}
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden"
        onClick={onMenuClick}
      >
        <Menu className="h-5 w-5" />
      </Button>

      {/* Search Bar */}
      <div className="flex-1 max-w-xl">
        <div className={cn(
          'relative transition-all duration-300',
          searchFocused && 'scale-105'
        )}>
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search vitals, reports, patients..."
            className={cn(
              'h-10 w-full rounded-full border bg-background/50 pl-10 pr-4 text-sm outline-none transition-all',
              'hover:bg-background/80 focus:bg-background focus:ring-2 focus:ring-primary/20',
              'placeholder:text-muted-foreground'
            )}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
          />
        </div>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-2">
        {/* Theme Toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="relative overflow-hidden rounded-full hover:bg-accent/50"
        >
          <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>

        {/* Notifications */}
        <Button variant="ghost" size="icon" className="relative rounded-full hover:bg-accent/50">
          <Bell className="h-5 w-5" />
          <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] text-white">
            3
          </span>
        </Button>

        {/* User Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="relative flex items-center gap-2 rounded-full pl-2 pr-3 hover:bg-accent/50"
            >
              <div className="relative">
                <div className="h-8 w-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 p-[2px]">
                  <div className="flex h-full w-full items-center justify-center rounded-full bg-background">
                    <User className="h-4 w-4" />
                  </div>
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-background bg-green-500" />
              </div>
              <div className="hidden md:block text-left">
                <p className="text-sm font-medium">
                  {session?.user?.name || 'User'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {session?.user?.email || 'user@example.com'}
                </p>
              </div>
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 backdrop-blur-xl bg-background/95">
            <DropdownMenuLabel>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 p-[2px]">
                  <div className="flex h-full w-full items-center justify-center rounded-full bg-background">
                    <User className="h-5 w-5" />
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium">
                    {session?.user?.name || 'User'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {session?.user?.email || 'user@example.com'}
                  </p>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="cursor-pointer">
              <User className="mr-2 h-4 w-4" />
              <span>Profile</span>
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer">
              <Settings className="mr-2 h-4 w-4" />
              <span>Settings</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="cursor-pointer text-red-600 focus:text-red-600"
              onClick={logout}
            >
              <LogOut className="mr-2 h-4 w-4" />
              <span>Logout</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}