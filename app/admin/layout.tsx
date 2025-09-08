'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Home, FileText, Menu, LogOut, Shield } from 'lucide-react';
import { signOut } from 'next-auth/react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const pathname = usePathname();

  const menuItems = [
    {
      title: 'Dashboard',
      icon: Home,
      href: '/admin',
    },
    {
      title: 'Health Reports',
      icon: FileText,
      href: '/admin/health-reports',
    },
  ];

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sidebar */}
      <aside
        className={cn(
          'flex flex-col bg-white dark:bg-gray-800 border-r transition-all duration-300',
          sidebarOpen ? 'w-64' : 'w-20'
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between h-16 px-4 border-b">
          <div className="flex items-center gap-2">
            <Shield className="h-8 w-8 text-primary" />
            {sidebarOpen && (
              <span className="text-xl font-bold">Admin Panel</span>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            <Menu className="h-5 w-5" />
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || 
                           (item.href === '/admin' && pathname === '/admin');
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                )}
              >
                <Icon className="h-5 w-5" />
                {sidebarOpen && <span>{item.title}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="p-4 border-t">
          <Button
            variant="ghost"
            className="w-full justify-start gap-3"
            onClick={() => signOut({ callbackUrl: '/auth/signin' })}
          >
            <LogOut className="h-5 w-5" />
            {sidebarOpen && <span>Logout</span>}
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}