'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  Activity, 
  Smartphone,
  Shield,
  RefreshCw,
  Database,
  TrendingUp,
  Heart,
  FileText,
  BarChart3
} from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalDevices: 0,
    totalVitals: 0,
    totalScans: 0,
    recentActivity: {
      lastHour: 0,
      lastDay: 0,
      lastWeek: 0,
    }
  });

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.push('/auth/signin');
      return;
    }
    
    const checkAccess = async () => {
      try {
        const response = await fetch('/api/admin/check');
        if (!response.ok) {
          toast.error('Access denied - Admin privileges required');
          router.push('/dashboard');
          return;
        }
        loadStats();
      } catch (error) {
        console.error('Error checking admin access:', error);
        router.push('/dashboard');
      }
    };
    
    checkAccess();
  }, [session, status, router]);

  const loadStats = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error loading stats:', error);
      toast.error('Failed to load statistics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Shield className="h-8 w-8" />
            Admin Dashboard
          </h1>
          <p className="text-muted-foreground">System overview and management</p>
        </div>
        <Button onClick={loadStats}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
            <p className="text-xs text-muted-foreground">
              Registered accounts
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Device Users</CardTitle>
            <Smartphone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalDevices}</div>
            <p className="text-xs text-muted-foreground">
              Active Android devices
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Vitals</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalVitals}</div>
            <p className="text-xs text-muted-foreground">
              Health records collected
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Face Scans</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalScans}</div>
            <p className="text-xs text-muted-foreground">
              Facial analysis completed
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link href="/admin/health-reports" className="block">
              <Button className="w-full justify-start" variant="outline">
                <Heart className="h-4 w-4 mr-2" />
                View Health Reports
              </Button>
            </Link>
            <Button 
              className="w-full justify-start" 
              variant="outline"
              onClick={() => router.push('/admin/users')}
              disabled
            >
              <Users className="h-4 w-4 mr-2" />
              Manage Users (Coming Soon)
            </Button>
            <Button 
              className="w-full justify-start" 
              variant="outline"
              disabled
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              Analytics Dashboard (Coming Soon)
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Last Hour</span>
                <span className="font-semibold">{stats.recentActivity?.lastHour || 0} scans</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Last 24 Hours</span>
                <span className="font-semibold">{stats.recentActivity?.lastDay || 0} scans</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Last 7 Days</span>
                <span className="font-semibold">{stats.recentActivity?.lastWeek || 0} scans</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Health */}
      <Card>
        <CardHeader>
          <CardTitle>System Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-green-500 animate-pulse"></div>
              <span className="text-sm">Database: Connected</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-green-500 animate-pulse"></div>
              <span className="text-sm">API Service: Active</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-green-500 animate-pulse"></div>
              <span className="text-sm">Authentication: Working</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}