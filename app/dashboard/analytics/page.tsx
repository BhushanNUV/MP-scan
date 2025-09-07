'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { 
  Calendar,
  Download,
  TrendingUp,
  TrendingDown,
  Activity,
  Heart,
  Thermometer,
  Wind,
  FileDown
} from 'lucide-react';
import { useVitals } from '@/hooks/useVitals';
import { generatePDFReport } from '@/lib/export-utils';
import { toast } from 'sonner';

const COLORS = ['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444'];

export default function AnalyticsPage() {
  const { fetchAnalytics } = useVitals();
  const [analytics, setAnalytics] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [period, setPeriod] = useState('30d');

  useEffect(() => {
    loadAnalytics();
  }, [period]);

  const loadAnalytics = async () => {
    setIsLoading(true);
    try {
      const response = await fetchAnalytics(period);
      setAnalytics(response?.data);
    } catch (error) {
      console.error('Error loading analytics:', error);
      toast.error('Failed to load analytics');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportPDF = () => {
    if (analytics) {
      generatePDFReport(analytics, period);
      toast.success('Report generated! Use print to save as PDF.');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4" />
          <p className="text-muted-foreground">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (!analytics || !analytics.trends) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Data Available</h3>
          <p className="text-muted-foreground">Start recording vitals to see analytics</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Health Analytics</h1>
          <p className="text-muted-foreground mt-1">Track your health trends and insights</p>
        </div>
        <div className="flex gap-3">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Button 
            className="gap-2"
            onClick={handleExportPDF}
          >
            <FileDown className="h-4 w-4" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {analytics.summary?.bloodPressureSystolic && (
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <Heart className="h-8 w-8 text-red-600" />
              {analytics.summary.bloodPressureSystolic.trend === 'increasing' ? (
                <TrendingUp className="h-4 w-4 text-red-600" />
              ) : analytics.summary.bloodPressureSystolic.trend === 'decreasing' ? (
                <TrendingDown className="h-4 w-4 text-green-600" />
              ) : null}
            </div>
            <p className="text-sm text-muted-foreground">Avg Blood Pressure</p>
            <p className="text-2xl font-bold">
              {Math.round(analytics.summary.bloodPressureSystolic.average)}
              {analytics.summary.bloodPressureDiastolic && (
                <span>/{Math.round(analytics.summary.bloodPressureDiastolic.average)}</span>
              )}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Range: {analytics.summary.bloodPressureSystolic.min}-{analytics.summary.bloodPressureSystolic.max}
            </p>
          </Card>
        )}

        {analytics.summary?.heartRate && (
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <Activity className="h-8 w-8 text-blue-600" />
              {analytics.summary.heartRate.trend === 'increasing' ? (
                <TrendingUp className="h-4 w-4 text-orange-600" />
              ) : analytics.summary.heartRate.trend === 'decreasing' ? (
                <TrendingDown className="h-4 w-4 text-green-600" />
              ) : null}
            </div>
            <p className="text-sm text-muted-foreground">Avg Heart Rate</p>
            <p className="text-2xl font-bold">
              {Math.round(analytics.summary.heartRate.average)}
              <span className="text-sm font-normal text-muted-foreground ml-1">bpm</span>
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Range: {analytics.summary.heartRate.min}-{analytics.summary.heartRate.max}
            </p>
          </Card>
        )}

        {analytics.healthScore !== undefined && (
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className={`h-8 w-8 rounded-full ${
                analytics.healthScore >= 80 ? 'bg-green-100' :
                analytics.healthScore >= 60 ? 'bg-yellow-100' : 'bg-red-100'
              }`}>
                <TrendingUp className={`h-8 w-8 p-2 ${
                  analytics.healthScore >= 80 ? 'text-green-600' :
                  analytics.healthScore >= 60 ? 'text-yellow-600' : 'text-red-600'
                }`} />
              </div>
            </div>
            <p className="text-sm text-muted-foreground">Health Score</p>
            <p className="text-2xl font-bold">{analytics.healthScore}%</p>
            <p className="text-xs text-muted-foreground mt-1">
              {analytics.healthScore >= 80 ? 'Excellent' :
               analytics.healthScore >= 60 ? 'Good' :
               analytics.healthScore >= 40 ? 'Fair' : 'Needs Attention'}
            </p>
          </Card>
        )}

        {analytics.activityMetrics && (
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <Activity className="h-8 w-8 text-purple-600" />
            </div>
            <p className="text-sm text-muted-foreground">Daily Steps Avg</p>
            <p className="text-2xl font-bold">
              {analytics.activityMetrics.averageDailySteps?.toLocaleString() || '0'}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Total: {analytics.activityMetrics.totalSteps?.toLocaleString() || '0'}
            </p>
          </Card>
        )}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Blood Pressure Trend */}
        {analytics.trends?.bloodPressure?.length > 0 && (
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Blood Pressure Trend</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={analytics.trends.bloodPressure}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={formatDate}
                  className="text-xs"
                />
                <YAxis className="text-xs" />
                <Tooltip />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="systolic" 
                  stroke="#EF4444" 
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  name="Systolic"
                />
                <Line 
                  type="monotone" 
                  dataKey="diastolic" 
                  stroke="#3B82F6" 
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  name="Diastolic"
                />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        )}

        {/* Heart Rate Trend */}
        {analytics.trends?.heartRate?.length > 0 && (
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Heart Rate Trend</h3>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={analytics.trends.heartRate}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={formatDate}
                  className="text-xs"
                />
                <YAxis className="text-xs" />
                <Tooltip />
                <Area 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#8B5CF6" 
                  fill="#8B5CF6"
                  fillOpacity={0.3}
                  strokeWidth={2}
                  name="Heart Rate (bpm)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </Card>
        )}

        {/* Activity Chart */}
        {analytics.trends?.activity?.length > 0 && (
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Activity Metrics</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analytics.trends.activity}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={formatDate}
                  className="text-xs"
                />
                <YAxis className="text-xs" />
                <Tooltip />
                <Legend />
                <Bar dataKey="steps" fill="#10B981" name="Steps" />
                <Bar dataKey="calories" fill="#F59E0B" name="Calories" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        )}

        {/* Distribution Charts */}
        {analytics.distributions?.bloodPressure && (
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Blood Pressure Distribution</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={[
                    { name: 'Normal', value: analytics.distributions.bloodPressure.normal || 0 },
                    { name: 'Elevated', value: analytics.distributions.bloodPressure.elevated || 0 },
                    { name: 'High Stage 1', value: analytics.distributions.bloodPressure.high1 || 0 },
                    { name: 'High Stage 2', value: analytics.distributions.bloodPressure.high2 || 0 },
                  ]}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  <Cell fill="#10B981" />
                  <Cell fill="#F59E0B" />
                  <Cell fill="#EF4444" />
                  <Cell fill="#991B1B" />
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        )}
      </div>

      {/* Insights */}
      {analytics.correlations && Object.keys(analytics.correlations).length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Health Insights</h3>
          <div className="space-y-3">
            {analytics.correlations.bloodPressureHeartRate !== undefined && (
              <div className="flex items-center justify-between p-3 rounded-lg bg-background/50">
                <span className="text-sm">Blood Pressure & Heart Rate Correlation</span>
                <span className={`text-sm font-medium ${
                  Math.abs(analytics.correlations.bloodPressureHeartRate) > 0.5 
                    ? 'text-orange-600' 
                    : 'text-green-600'
                }`}>
                  {(analytics.correlations.bloodPressureHeartRate * 100).toFixed(0)}%
                </span>
              </div>
            )}
            {analytics.correlations.activitySleep !== undefined && (
              <div className="flex items-center justify-between p-3 rounded-lg bg-background/50">
                <span className="text-sm">Activity & Sleep Quality Correlation</span>
                <span className={`text-sm font-medium ${
                  analytics.correlations.activitySleep > 0.3 
                    ? 'text-green-600' 
                    : 'text-orange-600'
                }`}>
                  {(analytics.correlations.activitySleep * 100).toFixed(0)}%
                </span>
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}