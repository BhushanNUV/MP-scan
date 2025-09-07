'use client';

import { DashboardLayout } from '@/components/dashboard/dashboard-layout';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';

export default function Layout({ children }: { children: React.ReactNode }) {
  const { status } = useSession();

  if (status === 'loading') {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    redirect('/auth/signin');
  }

  return <DashboardLayout>{children}</DashboardLayout>;
}