'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, Home } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BreadcrumbProps {
  className?: string;
}

export function Breadcrumb({ className }: BreadcrumbProps) {
  const pathname = usePathname();
  
  const segments = pathname.split('/').filter(Boolean);
  
  const breadcrumbs = segments.map((segment, index) => {
    const href = '/' + segments.slice(0, index + 1).join('/');
    const label = segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' ');
    const isLast = index === segments.length - 1;
    
    return { href, label, isLast };
  });

  if (breadcrumbs.length === 0) return null;

  return (
    <nav className={cn('flex items-center gap-2 text-sm', className)}>
      <Link
        href="/dashboard"
        className="flex items-center gap-1 text-muted-foreground transition-colors hover:text-foreground"
      >
        <Home className="h-4 w-4" />
        <span className="hidden sm:inline">Home</span>
      </Link>
      
      {breadcrumbs.map((crumb, index) => (
        <div key={crumb.href} className="flex items-center gap-2">
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
          {crumb.isLast ? (
            <span className="font-medium text-foreground">
              {crumb.label}
            </span>
          ) : (
            <Link
              href={crumb.href}
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              {crumb.label}
            </Link>
          )}
        </div>
      ))}
    </nav>
  );
}