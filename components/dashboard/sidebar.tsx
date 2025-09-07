'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Home,
  Activity,
  PlusCircle,
  FileText,
  User,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Heart,
  BarChart3,
  Calendar,
  Bell,
  TrendingUp,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface SidebarProps {
  className?: string;
}

const menuItems = [
  {
    title: 'Dashboard',
    icon: Home,
    href: '/dashboard',
    gradient: 'from-blue-500 to-cyan-500',
  },
  {
    title: 'Health Vitals',
    icon: Activity,
    href: '/dashboard/vitals',
    gradient: 'from-green-500 to-emerald-500',
  },
  {
    title: 'Add New Scan',
    icon: PlusCircle,
    href: '/dashboard/scan',
    gradient: 'from-purple-500 to-pink-500',
  },
  {
    title: 'Reports',
    icon: FileText,
    href: '/dashboard/reports',
    gradient: 'from-orange-500 to-red-500',
  },
  {
    title: 'Analytics',
    icon: BarChart3,
    href: '/dashboard/analytics',
    gradient: 'from-indigo-500 to-purple-500',
  },
  {
    title: 'Appointments',
    icon: Calendar,
    href: '/dashboard/appointments',
    gradient: 'from-teal-500 to-green-500',
  },
];

const bottomMenuItems = [
  {
    title: 'Profile',
    icon: User,
    href: '/dashboard/profile',
    gradient: 'from-gray-500 to-gray-600',
  },
  {
    title: 'Settings',
    icon: Settings,
    href: '/dashboard/settings',
    gradient: 'from-gray-500 to-gray-600',
  },
];

export function Sidebar({ className }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  const { logout } = useAuth();

  return (
    <aside
      className={cn(
        'relative flex h-full flex-col border-r bg-gradient-to-b from-background/95 to-background/60 backdrop-blur-xl transition-all duration-300',
        collapsed ? 'w-[80px]' : 'w-[280px]',
        className
      )}
    >
      {/* Logo Section */}
      <div className="flex h-16 items-center justify-between border-b bg-background/50 px-4">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="relative">
            <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 blur-lg opacity-75" />
            <div className="relative rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 p-2">
              <Heart className="h-6 w-6 text-white" />
            </div>
          </div>
          {!collapsed && (
            <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              HealthVitals
            </span>
          )}
        </Link>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(!collapsed)}
          className="ml-auto hover:bg-background/80"
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Quick Stats (visible when not collapsed) */}
      {!collapsed && (
        <div className="mx-4 mt-4 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 p-4 text-white">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm opacity-90">Health Score</span>
            <TrendingUp className="h-4 w-4" />
          </div>
          <div className="text-2xl font-bold">92%</div>
          <div className="text-xs opacity-75 mt-1">Great condition</div>
        </div>
      )}

      {/* Main Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all hover:bg-accent/50',
                isActive && 'bg-accent/50 text-accent-foreground'
              )}
            >
              {isActive && (
                <div className="absolute inset-0 rounded-lg bg-gradient-to-r opacity-10"
                  style={{
                    backgroundImage: `linear-gradient(to right, var(--tw-gradient-stops))`,
                  }}
                />
              )}
              <div className={cn(
                'relative flex h-9 w-9 items-center justify-center rounded-lg transition-all',
                isActive 
                  ? `bg-gradient-to-r ${item.gradient} text-white shadow-lg shadow-current/25`
                  : 'text-muted-foreground group-hover:text-foreground'
              )}>
                <Icon className="h-5 w-5" />
              </div>
              {!collapsed && (
                <span className={cn(
                  'transition-colors',
                  isActive ? 'text-foreground' : 'text-muted-foreground group-hover:text-foreground'
                )}>
                  {item.title}
                </span>
              )}
              {!collapsed && isActive && (
                <div className="ml-auto h-2 w-2 rounded-full bg-gradient-to-r from-blue-600 to-purple-600" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Notifications Badge */}
      {!collapsed && (
        <div className="mx-4 mb-4 rounded-lg border bg-background/50 p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Notifications</span>
            </div>
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] text-white">
              3
            </span>
          </div>
        </div>
      )}

      {/* Bottom Section */}
      <div className="border-t p-3 space-y-1">
        {bottomMenuItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all hover:bg-accent/50',
                isActive && 'bg-accent/50 text-accent-foreground'
              )}
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors group-hover:text-foreground">
                <Icon className="h-5 w-5" />
              </div>
              {!collapsed && (
                <span className="text-muted-foreground transition-colors group-hover:text-foreground">
                  {item.title}
                </span>
              )}
            </Link>
          );
        })}
        
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 px-3 text-red-600 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-950/20"
          onClick={logout}
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-lg">
            <LogOut className="h-5 w-5" />
          </div>
          {!collapsed && <span>Logout</span>}
        </Button>
      </div>
    </aside>
  );
}