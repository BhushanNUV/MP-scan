'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  Users, 
  Activity, 
  Smartphone,
  Shield,
  RefreshCw,
  Eye,
  Calendar,
  Heart,
  Droplets,
  Wind,
  Thermometer,
  TrendingUp,
  Clock,
  Database
} from 'lucide-react';
import { toast } from 'sonner';
import { formatDate } from '@/lib/utils/calculations';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  lastLogin?: string;
  deviceId?: string;
  apiToken?: string;
  profile?: {
    firstName?: string;
    lastName?: string;
  };
  _count?: {
    patients: number;
    faceScanData: number;
  };
}

interface Vital {
  id: string;
  recordedAt: string;
  source: string;
  bloodPressureSystolic?: number;
  bloodPressureDiastolic?: number;
  heartRate?: number;
  temperature?: number;
  oxygenSaturation?: number;
  bloodGlucose?: number;
  user?: {
    email: string;
    name: string;
  };
  patient?: {
    firstName: string;
    lastName: string;
  };
}

interface FaceScan {
  id: string;
  createdAt: string;
  confidence?: number;
  deviceId?: string;
  user: {
    email: string;
    name: string;
  };
}

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);
  const [vitals, setVitals] = useState<Vital[]>([]);
  const [faceScans, setFaceScans] = useState<FaceScan[]>([]);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalDevices: 0,
    totalVitals: 0,
    totalScans: 0,
  });

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.push('/auth/signin');
      return;
    }
    checkAdminAccess();
  }, [session, status, router]);

  const checkAdminAccess = async () => {
    try {
      const response = await fetch('/api/admin/check');
      if (!response.ok) {
        toast.error('Access denied - Admin privileges required');
        router.push('/dashboard');
        return;
      }
      loadData();
    } catch (error) {
      console.error('Error checking admin access:', error);
      router.push('/dashboard');
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [usersRes, vitalsRes, scansRes, statsRes] = await Promise.all([
        fetch('/api/admin/users'),
        fetch('/api/admin/vitals'),
        fetch('/api/admin/face-scans'),
        fetch('/api/admin/stats'),
      ]);

      if (usersRes.ok) {
        const userData = await usersRes.json();
        setUsers(userData.users || []);
      }

      if (vitalsRes.ok) {
        const vitalsData = await vitalsRes.json();
        setVitals(vitalsData.vitals || []);
      }

      if (scansRes.ok) {
        const scansData = await scansRes.json();
        setFaceScans(scansData.scans || []);
      }

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }
    } catch (error) {
      console.error('Error loading admin data:', error);
      toast.error('Failed to load admin data');
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
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Shield className="h-8 w-8" />
            Admin Panel
          </h1>
          <p className="text-muted-foreground">System overview and management</p>
        </div>
        <Button onClick={loadData}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Device Users</CardTitle>
            <Smartphone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalDevices}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Vitals</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalVitals}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Face Scans</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalScans}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="users" className="space-y-4">
        <TabsList>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="vitals">Recent Vitals</TabsTrigger>
          <TabsTrigger value="face-scans">Face Scans</TabsTrigger>
        </TabsList>

        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>All Users</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Device ID</TableHead>
                    <TableHead>Last Login</TableHead>
                    <TableHead>Patients</TableHead>
                    <TableHead>Face Scans</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.email}</TableCell>
                      <TableCell>
                        {user.profile?.firstName} {user.profile?.lastName}
                      </TableCell>
                      <TableCell>
                        <Badge variant={user.role === 'admin' ? 'destructive' : user.role === 'device' ? 'secondary' : 'default'}>
                          {user.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {user.deviceId ? (
                          <Badge variant="outline">{user.deviceId}</Badge>
                        ) : '-'}
                      </TableCell>
                      <TableCell>
                        {user.lastLogin ? formatDate(user.lastLogin) : 'Never'}
                      </TableCell>
                      <TableCell>{user._count?.patients || 0}</TableCell>
                      <TableCell>{user._count?.faceScanData || 0}</TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => router.push(`/admin/users/${user.id}`)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="vitals">
          <Card>
            <CardHeader>
              <CardTitle>Recent Vitals (From All Users)</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Patient</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>BP</TableHead>
                    <TableHead>Heart Rate</TableHead>
                    <TableHead>Temp</TableHead>
                    <TableHead>SpO2</TableHead>
                    <TableHead>Glucose</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {vitals.map((vital) => (
                    <TableRow key={vital.id}>
                      <TableCell>{formatDate(vital.recordedAt)}</TableCell>
                      <TableCell>{vital.user?.email || '-'}</TableCell>
                      <TableCell>
                        {vital.patient?.firstName} {vital.patient?.lastName}
                      </TableCell>
                      <TableCell>
                        <Badge variant={vital.source === 'device' ? 'secondary' : 'default'}>
                          {vital.source}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {vital.bloodPressureSystolic && vital.bloodPressureDiastolic
                          ? `${vital.bloodPressureSystolic}/${vital.bloodPressureDiastolic}`
                          : '-'}
                      </TableCell>
                      <TableCell>{vital.heartRate || '-'}</TableCell>
                      <TableCell>{vital.temperature ? `${vital.temperature}°C` : '-'}</TableCell>
                      <TableCell>{vital.oxygenSaturation ? `${vital.oxygenSaturation}%` : '-'}</TableCell>
                      <TableCell>{vital.bloodGlucose || '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="face-scans">
          <Card>
            <CardHeader>
              <CardTitle>Face Scan Records</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Device ID</TableHead>
                    <TableHead>Confidence</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {faceScans.map((scan) => (
                    <TableRow key={scan.id}>
                      <TableCell>{formatDate(scan.createdAt)}</TableCell>
                      <TableCell>
                        {scan.user.name || scan.user.email}
                      </TableCell>
                      <TableCell>
                        {scan.deviceId ? (
                          <Badge variant="outline">{scan.deviceId}</Badge>
                        ) : '-'}
                      </TableCell>
                      <TableCell>
                        {scan.confidence ? (
                          <Badge variant={scan.confidence > 0.8 ? 'default' : 'secondary'}>
                            {(scan.confidence * 100).toFixed(1)}%
                          </Badge>
                        ) : '-'}
                      </TableCell>
                      <TableCell>
                        <Button size="sm" variant="ghost">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}