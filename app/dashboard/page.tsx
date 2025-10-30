'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  BarChart3, 
  Users, 
  Calendar, 
  Activity,
  Heart,
  Thermometer,
  Wind,
  TrendingUp,
  Clock,
  FileText,
  Pill,
  ArrowUp,
  ArrowDown,
  AlertCircle,
  CheckCircle,
  PlusCircle
} from 'lucide-react';
import Link from 'next/link';
import { useVitals, useUserProfile } from '@/hooks/useVitals';

export default function DashboardPage() {
  const { data: session } = useSession();
  const { fetchLatestVitals } = useVitals();
  const { profile } = useUserProfile();
  const [latestVitals, setLatestVitals] = useState<any>(null);
  const [analytics, setAnalytics] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (session) {
      loadDashboardData();
    }
  }, [session]);

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      // Check if this is BriahScan admin
      const isBriahScanAdmin = session?.user?.email === 'briahscan@admin.com';

      if (isBriahScanAdmin) {
        // Fetch BriahScan data
        const briahScanResponse = await fetch('/api/briah-scan/analytics')
          .then(res => res.json())
          .catch(err => {
            console.error('BriahScan Analytics API error:', err);
            return { success: false };
          });

        const briahScansData = await fetch('/api/brain-scan?limit=10')
          .then(res => res.json())
          .catch(() => ({ success: false, data: [] }));

        if (briahScanResponse?.success) {
          const briahAnalytics = briahScanResponse.analytics;
          // Transform BriahScan analytics to match dashboard format
          setAnalytics({
            totals: {
              users: 0,
              patients: 0,
              vitals: briahAnalytics.totals.scans,
              faceScans: 0
            },
            vitalsTimeline: {
              today: briahAnalytics.timeline.today,
              thisWeek: briahAnalytics.timeline.thisWeek,
              thisMonth: briahAnalytics.timeline.thisMonth,
              weeklyTrend: briahAnalytics.timeline.weeklyTrend
            },
            averages: briahAnalytics.averages,
            riskAssessment: null,
            sources: briahAnalytics.sources,
            latest: briahAnalytics.latestScan,
            healthScore: briahAnalytics.healthScore,
            userRole: 'admin',
            isBriahScan: true
          });

          setLatestVitals(briahAnalytics.latestScan);
        }
      } else {
        // Original vitals data loading
        const [vitalsResponse, analyticsResponse] = await Promise.all([
          fetchLatestVitals(),
          fetch('/api/analytics')
            .then(res => {
              if (!res.ok) {
                console.error('Analytics API failed with status:', res.status);
                return { success: false };
              }
              return res.json();
            })
            .catch(err => {
              console.error('Analytics API error:', err);
              return { success: false };
            })
        ]);

        setLatestVitals(vitalsResponse?.data);

        if (analyticsResponse?.success) {
          setAnalytics(analyticsResponse.analytics);
        } else {
          // Set default analytics if API fails
          setAnalytics({
            totals: { users: 0, patients: 0, vitals: 0, faceScans: 0 },
            vitalsTimeline: { today: 0, thisWeek: 0, thisMonth: 0, weeklyTrend: '0' },
            averages: {},
            riskAssessment: null,
            sources: { device: 0, manual: 0, import: 0 },
            latest: null,
            healthScore: 0,
            userRole: 'user'
          });
        }
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      // Set default values on error
      setAnalytics({
        totals: { users: 0, patients: 0, vitals: 0, faceScans: 0 },
        vitalsTimeline: { today: 0, thisWeek: 0, thisMonth: 0, weeklyTrend: '0' },
        averages: {},
        riskAssessment: null,
        sources: { device: 0, manual: 0, import: 0 },
        latest: null,
        healthScore: 0,
        userRole: 'user'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const healthScore = analytics?.healthScore || 0;
  const getHealthScoreColor = () => {
    if (healthScore >= 80) return 'text-green-600';
    if (healthScore >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getHealthScoreLabel = () => {
    if (healthScore >= 80) return 'Excellent';
    if (healthScore >= 60) return 'Good';
    if (healthScore >= 40) return 'Fair';
    return 'Needs Attention';
  };

  // Check if BriahScan admin
  const isBriahScanAdmin = session?.user?.email === 'briahscan@admin.com';

  // Different stats for BriahScan admin
  const stats = isBriahScanAdmin ? [
    {
      title: 'Total Scans',
      value: analytics?.totals?.vitals || 0,
      change: `${analytics?.vitalsTimeline?.weeklyTrend || 0}%`,
      icon: Activity,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
    {
      title: 'Scans Today',
      value: analytics?.vitalsTimeline?.today || 0,
      change: analytics?.vitalsTimeline?.today > 0 ? '+' + analytics?.vitalsTimeline?.today : '0',
      icon: Calendar,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      title: 'Avg Heart Rate',
      value: analytics?.averages?.heartRate ? `${Math.round(analytics.averages.heartRate)}` : '--',
      change: analytics?.averages?.heartRate ? 'bpm' : '',
      icon: Heart,
      color: 'text-red-600',
      bgColor: 'bg-red-100',
    },
    {
      title: 'Avg Blood Pressure',
      value: (analytics?.averages?.bloodPressureSystolic && analytics?.averages?.bloodPressureDiastolic)
        ? `${Math.round(analytics.averages.bloodPressureSystolic)}/${Math.round(analytics.averages.bloodPressureDiastolic)}`
        : '--',
      change: 'mmHg',
      icon: Activity,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
  ] : [
    {
      title: analytics?.userRole === 'admin' ? 'Total Users' : 'Total Patients',
      value: analytics?.totals?.patients || 0,
      change: `${analytics?.vitalsTimeline?.weeklyTrend || 0}%`,
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      title: 'Vitals Today',
      value: analytics?.vitalsTimeline?.today || 0,
      change: analytics?.vitalsTimeline?.today > 0 ? '+' + analytics?.vitalsTimeline?.today : '0',
      icon: Calendar,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      title: 'Total Vitals',
      value: analytics?.totals?.vitals || 0,
      change: `+${analytics?.vitalsTimeline?.thisWeek || 0}`,
      icon: Activity,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
    {
      title: 'Face Scans',
      value: analytics?.totals?.faceScans || 0,
      change: analytics?.sources?.device > 0 ? `${analytics?.sources?.device} device` : '0',
      icon: FileText,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
    },
  ];

  const vitalCards = [
    {
      title: 'Blood Pressure',
      value: '120/80',
      unit: 'mmHg',
      icon: Heart,
      status: 'normal',
      lastUpdated: '2 hours ago',
    },
    {
      title: 'Heart Rate',
      value: '72',
      unit: 'bpm',
      icon: Activity,
      status: 'normal',
      lastUpdated: '2 hours ago',
    },
    {
      title: 'Temperature',
      value: '98.6',
      unit: '°F',
      icon: Thermometer,
      status: 'normal',
      lastUpdated: '3 hours ago',
    },
    {
      title: 'Oxygen Saturation',
      value: '98',
      unit: '%',
      icon: Wind,
      status: 'normal',
      lastUpdated: '2 hours ago',
    },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4" />
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section with Health Score */}
      <div className="rounded-2xl bg-gradient-to-r from-blue-600 to-purple-600 p-8 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-white/5 backdrop-blur-3xl" />
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">
              Welcome back, {profile?.name || session?.user?.name || 'User'}!
            </h1>
            <p className="text-blue-100">
              {new Date().toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </p>
          </div>
          <div className="text-center">
            <div className="text-5xl font-bold mb-1">{healthScore}%</div>
            <div className="text-sm text-blue-100">Health Score</div>
            <div className={`text-xs font-medium mt-1 ${getHealthScoreLabel() === 'Excellent' ? 'text-green-300' : 'text-blue-200'}`}>
              {getHealthScoreLabel()}
            </div>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div>
        <h2 className="text-xl font-bold mb-4">Overview</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card key={index} className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                    <Icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                  {stat.change && (
                    <span className={`text-sm font-medium ${
                      stat.change.startsWith('+') || stat.change.includes('device') ? 'text-green-600' : 
                      stat.change.startsWith('-') ? 'text-red-600' : 'text-gray-600'
                    }`}>
                      {stat.change}
                    </span>
                  )}
                </div>
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.title}</p>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Latest Vitals Quick View */}
      {latestVitals?.current ? (
        <div>
          <h2 className="text-xl font-bold mb-4">Your Latest Vitals</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {latestVitals.current.bloodPressureSystolic && (
              <Card className="p-4 bg-gradient-to-br from-red-50 to-pink-50 dark:from-red-950/20 dark:to-pink-950/20 border-0">
                <div className="flex items-center justify-between mb-2">
                  <Heart className="h-6 w-6 text-red-600" />
                  {latestVitals.changes?.bloodPressureSystolic && (
                    <span className={`text-xs font-medium flex items-center gap-1 ${
                      latestVitals.changes.bloodPressureSystolic.trend === 'up' ? 'text-red-600' : 'text-green-600'
                    }`}>
                      {latestVitals.changes.bloodPressureSystolic.trend === 'up' ? 
                        <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                      }
                      {Math.abs(latestVitals.changes.bloodPressureSystolic.value)}
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">Blood Pressure</p>
                <p className="text-xl font-bold">
                  {latestVitals.current.bloodPressureSystolic}/{latestVitals.current.bloodPressureDiastolic}
                  <span className="text-xs text-muted-foreground ml-1">mmHg</span>
                </p>
              </Card>
            )}
            
            {latestVitals.current.heartRate && (
              <Card className="p-4 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20 border-0">
                <div className="flex items-center justify-between mb-2">
                  <Activity className="h-6 w-6 text-blue-600" />
                  {latestVitals.changes?.heartRate && (
                    <span className={`text-xs font-medium flex items-center gap-1 ${
                      latestVitals.changes.heartRate.trend === 'up' ? 'text-orange-600' : 'text-green-600'
                    }`}>
                      {latestVitals.changes.heartRate.trend === 'up' ? 
                        <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                      }
                      {Math.abs(latestVitals.changes.heartRate.value)}
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">Heart Rate</p>
                <p className="text-xl font-bold">
                  {latestVitals.current.heartRate}
                  <span className="text-xs text-muted-foreground ml-1">bpm</span>
                </p>
              </Card>
            )}
            
            {latestVitals.current.temperature && (
              <Card className="p-4 bg-gradient-to-br from-orange-50 to-yellow-50 dark:from-orange-950/20 dark:to-yellow-950/20 border-0">
                <div className="flex items-center justify-between mb-2">
                  <Thermometer className="h-6 w-6 text-orange-600" />
                </div>
                <p className="text-sm text-muted-foreground">Temperature</p>
                <p className="text-xl font-bold">
                  {latestVitals.current.temperature}
                  <span className="text-xs text-muted-foreground ml-1">°C</span>
                </p>
              </Card>
            )}
            
            {latestVitals.current.oxygenSaturation && (
              <Card className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border-0">
                <div className="flex items-center justify-between mb-2">
                  <Wind className="h-6 w-6 text-green-600" />
                </div>
                <p className="text-sm text-muted-foreground">Oxygen Saturation</p>
                <p className="text-xl font-bold">
                  {latestVitals.current.oxygenSaturation}
                  <span className="text-xs text-muted-foreground ml-1">%</span>
                </p>
              </Card>
            )}
          </div>
        </div>
      ) : (
        <Card className="p-8 text-center bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 border-0">
          <AlertCircle className="h-12 w-12 text-blue-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Vitals Recorded Yet</h3>
          <p className="text-muted-foreground mb-4">Start tracking your health by recording your first vital signs</p>
          <Link href="/dashboard/scan">
            <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
              <PlusCircle className="h-4 w-4 mr-2" />
              Record Your First Vitals
            </Button>
          </Link>
        </Card>
      )}

      {/* Recent Activity Timeline */}
      <div>
        <h2 className="text-xl font-bold mb-4">Recent Activity</h2>
        <Card className="p-6">
          <div className="space-y-4">
            {[
              analytics?.vitalsTimeline?.today > 0 && { 
                icon: CheckCircle, 
                color: 'text-green-600', 
                title: 'Vitals Recorded Today', 
                description: `${analytics.vitalsTimeline.today} vital recording${analytics.vitalsTimeline.today > 1 ? 's' : ''}`, 
                time: 'Today' 
              },
              analytics?.latest && { 
                icon: Activity, 
                color: 'text-blue-600', 
                title: 'Latest Vital Update', 
                description: `Patient: ${analytics.latest.patientName}`, 
                time: new Date(analytics.latest.recordedAt).toLocaleString() 
              },
              { 
                icon: TrendingUp, 
                color: 'text-purple-600', 
                title: 'Health Score', 
                description: `Current score: ${healthScore}%`, 
                time: 'Based on latest vitals' 
              },
              analytics?.vitalsTimeline?.thisWeek > 0 && { 
                icon: FileText, 
                color: 'text-orange-600', 
                title: 'Weekly Activity', 
                description: `${analytics.vitalsTimeline.thisWeek} vitals recorded this week`, 
                time: `${analytics.vitalsTimeline.weeklyTrend}% change from last week` 
              },
            ].filter(Boolean).slice(0, 4).map((activity, index) => {
              const Icon = activity.icon;
              return (
                <div key={index} className="flex gap-4">
                  <div className={`p-2 rounded-lg bg-background ${activity.color}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{activity.title}</p>
                    <p className="text-sm text-muted-foreground">{activity.description}</p>
                    <p className="text-xs text-muted-foreground mt-1">{activity.time}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {/* Risk Assessment Summary */}
      {analytics?.riskAssessment && (
        <div>
          <h2 className="text-xl font-bold mb-4">Risk Assessment Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <AlertCircle className="h-5 w-5 text-blue-600" />
                <h3 className="font-semibold">Diabetic Risk Distribution</h3>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Low Risk</span>
                  <div className="flex items-center gap-2">
                    <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-green-500 transition-all"
                        style={{ width: `${(analytics.riskAssessment.diabetic.low / (analytics.riskAssessment.diabetic.low + analytics.riskAssessment.diabetic.medium + analytics.riskAssessment.diabetic.high)) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium">{analytics.riskAssessment.diabetic.low}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Medium Risk</span>
                  <div className="flex items-center gap-2">
                    <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-yellow-500 transition-all"
                        style={{ width: `${(analytics.riskAssessment.diabetic.medium / (analytics.riskAssessment.diabetic.low + analytics.riskAssessment.diabetic.medium + analytics.riskAssessment.diabetic.high)) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium">{analytics.riskAssessment.diabetic.medium}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">High Risk</span>
                  <div className="flex items-center gap-2">
                    <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-red-500 transition-all"
                        style={{ width: `${(analytics.riskAssessment.diabetic.high / (analytics.riskAssessment.diabetic.low + analytics.riskAssessment.diabetic.medium + analytics.riskAssessment.diabetic.high)) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium">{analytics.riskAssessment.diabetic.high}</span>
                  </div>
                </div>
              </div>
            </Card>
            
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Heart className="h-5 w-5 text-red-600" />
                <h3 className="font-semibold">Hypertension Risk Distribution</h3>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Low Risk</span>
                  <div className="flex items-center gap-2">
                    <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-green-500 transition-all"
                        style={{ width: `${(analytics.riskAssessment.hypertension.low / (analytics.riskAssessment.hypertension.low + analytics.riskAssessment.hypertension.medium + analytics.riskAssessment.hypertension.high)) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium">{analytics.riskAssessment.hypertension.low}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Medium Risk</span>
                  <div className="flex items-center gap-2">
                    <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-yellow-500 transition-all"
                        style={{ width: `${(analytics.riskAssessment.hypertension.medium / (analytics.riskAssessment.hypertension.low + analytics.riskAssessment.hypertension.medium + analytics.riskAssessment.hypertension.high)) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium">{analytics.riskAssessment.hypertension.medium}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">High Risk</span>
                  <div className="flex items-center gap-2">
                    <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-red-500 transition-all"
                        style={{ width: `${(analytics.riskAssessment.hypertension.high / (analytics.riskAssessment.hypertension.low + analytics.riskAssessment.hypertension.medium + analytics.riskAssessment.hypertension.high)) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium">{analytics.riskAssessment.hypertension.high}</span>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl font-bold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link href="/dashboard/scan">
            <Button className="w-full h-auto py-6 flex flex-col items-center justify-center gap-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-0 shadow-lg">
              <PlusCircle className="h-6 w-6" />
              <span className="font-medium">Add New Scan</span>
            </Button>
          </Link>
          <Link href="/dashboard/vitals">
            <Button className="w-full h-auto py-6 flex flex-col items-center justify-center gap-3 bg-background/50 backdrop-blur-sm border hover:bg-background/80 hover:shadow-lg transition-all">
              <Activity className="h-6 w-6" />
              <span className="font-medium">View Vitals</span>
            </Button>
          </Link>
          <Link href="/dashboard/analytics">
            <Button className="w-full h-auto py-6 flex flex-col items-center justify-center gap-3 bg-background/50 backdrop-blur-sm border hover:bg-background/80 hover:shadow-lg transition-all">
              <BarChart3 className="h-6 w-6" />
              <span className="font-medium">Analytics</span>
            </Button>
          </Link>
          <Link href="/dashboard/profile">
            <Button className="w-full h-auto py-6 flex flex-col items-center justify-center gap-3 bg-background/50 backdrop-blur-sm border hover:bg-background/80 hover:shadow-lg transition-all">
              <Users className="h-6 w-6" />
              <span className="font-medium">Profile</span>
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}