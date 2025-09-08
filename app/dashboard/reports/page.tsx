'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  FileText, 
  Calendar,
  Heart,
  Activity,
  Brain,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  Download,
  Filter,
  Eye,
  Droplets,
  Wind,
  RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';
import { formatDate } from '@/lib/utils/calculations';
import { ECGChart } from '@/components/ecg/ECGChart';

interface Vital {
  id: string;
  recordedAt: string;
  source: string;
  
  // User Info
  name?: string;
  phoneNumber?: string;
  
  // Basic Vitals
  heartRate?: number;
  prq?: number;
  oxygenSaturation?: number;
  bloodPressure?: string;
  bloodPressureSystolic?: number;
  bloodPressureDiastolic?: number;
  breathingRate?: number;
  temperature?: number;
  bloodGlucose?: number;
  
  // Confidence Levels
  heartRateConfLevel?: number;
  prqConfLevel?: number;
  oxygenSaturationConfLevel?: number;
  bloodPressureConfLevel?: number;
  breathingRateConfLevel?: number;
  
  // Stress & Recovery
  stressLevel?: number;
  stressIndex?: number;
  recoveryAbility?: string;
  
  // HRV Metrics
  hrvSdnn?: number;
  pnsIndex?: number;
  pnsZone?: string;
  snsIndex?: number;
  snsZone?: string;
  wellnessIndex?: number;
  wellnessLevel?: string;
  
  // Risk Assessments
  diabeticRisk?: string;
  diabeticRiskProbability?: number;
  heartAttackRisk?: string;
  heartAttackRiskProbability?: number;
  strokeRisk?: string;
  strokeRiskProbability?: number;
  hypertensionRisk?: string;
  hypertensionRiskProbability?: number;
  asthmaRisk?: string;
  alzheimersRisk?: string;
  
  // Blood Metrics
  hemoglobin?: number;
  hemoglobinA1c?: number;
  hba1c?: number;
  
  // Additional
  bmi?: number;
  mspMatch?: number;
  
  patient?: {
    firstName: string;
    lastName: string;
  };
}

export default function ReportsPage() {
  const [vitals, setVitals] = useState<Vital[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVital, setSelectedVital] = useState<Vital | null>(null);
  const [filterPeriod, setFilterPeriod] = useState('all');

  useEffect(() => {
    loadVitals();
  }, []);

  const loadVitals = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/user/vitals');
      if (response.ok) {
        const data = await response.json();
        console.log('Loaded vitals data:', data.vitals?.length || 0, 'records');
        setVitals(data.vitals || []);
      } else {
        console.error('Failed to load reports:', response.status);
        toast.error('Failed to load reports');
      }
    } catch (error) {
      console.error('Error loading vitals:', error);
      toast.error('Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  const filteredVitals = vitals.filter(vital => {
    // Filter by period
    if (filterPeriod !== 'all') {
      const date = new Date(vital.recordedAt);
      const now = new Date();
      const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
      
      if (filterPeriod === 'week' && diffDays > 7) return false;
      if (filterPeriod === 'month' && diffDays > 30) return false;
      if (filterPeriod === '3months' && diffDays > 90) return false;
    }
    
    return true;
  });

  const getHealthStatus = (vital: Vital) => {
    const risks = [
      vital.diabeticRisk,
      vital.hypertensionRisk,
      vital.heartAttackRisk,
      vital.strokeRisk
    ].filter(Boolean);
    
    const hasHighRisk = risks.some(risk => risk?.toLowerCase().includes('high'));
    const hasMediumRisk = risks.some(risk => risk?.toLowerCase().includes('medium') || risk?.toLowerCase().includes('moderate'));
    
    if (hasHighRisk) return { label: 'Needs Attention', variant: 'destructive' as const };
    if (hasMediumRisk) return { label: 'Monitor', variant: 'secondary' as const };
    return { label: 'Good', variant: 'default' as const };
  };

  const getRiskColor = (risk?: string) => {
    if (!risk) return '';
    const lower = risk.toLowerCase();
    if (lower.includes('high')) return 'text-red-600';
    if (lower.includes('medium') || lower.includes('moderate')) return 'text-yellow-600';
    if (lower.includes('low')) return 'text-green-600';
    return '';
  };

  const getConfidenceIndicator = (level?: number) => {
    if (!level) return null;
    if (level >= 3) return <span className="text-green-600">●</span>;
    if (level >= 2) return <span className="text-yellow-600">●</span>;
    return <span className="text-red-600">●</span>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <FileText className="h-8 w-8" />
            Health Reports
          </h1>
          <p className="text-muted-foreground">Your comprehensive health vitals history</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={loadVitals} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="default" disabled>
            <Download className="h-4 w-4 mr-2" />
            Export PDF
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Reports</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{vitals.length}</div>
            <p className="text-xs text-muted-foreground">Health records</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Latest Reading</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {vitals.length > 0 ? formatDate(vitals[0].recordedAt) : 'N/A'}
            </div>
            <p className="text-xs text-muted-foreground">Most recent</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Avg Heart Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {vitals.length > 0 
                ? Math.round(vitals.reduce((acc, v) => acc + (v.heartRate || 0), 0) / vitals.filter(v => v.heartRate).length)
                : 'N/A'
              } <span className="text-sm font-normal">bpm</span>
            </div>
            <p className="text-xs text-muted-foreground">Average</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Health Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">Good</div>
            <p className="text-xs text-muted-foreground">Overall condition</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filter Reports
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Select value={filterPeriod} onValueChange={setFilterPeriod}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="week">Last 7 Days</SelectItem>
                <SelectItem value="month">Last 30 Days</SelectItem>
                <SelectItem value="3months">Last 3 Months</SelectItem>
              </SelectContent>
            </Select>

          </div>
        </CardContent>
      </Card>

      {/* Reports Table */}
      <Card>
        <CardHeader>
          <CardTitle>Vitals History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>
                    <div className="flex items-center gap-1">
                      <Heart className="h-4 w-4" />
                      HR
                    </div>
                  </TableHead>
                  <TableHead>
                    <div className="flex items-center gap-1">
                      <Droplets className="h-4 w-4" />
                      SpO2
                    </div>
                  </TableHead>
                  <TableHead>BP</TableHead>
                  <TableHead>HRV</TableHead>
                  <TableHead>Wellness</TableHead>
                  <TableHead>Health Risks</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredVitals.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={11} className="text-center py-8">
                      <div className="flex flex-col items-center gap-2">
                        <FileText className="h-8 w-8 text-muted-foreground" />
                        <p className="text-muted-foreground">No reports found</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredVitals.map((vital: any) => {
                    const status = getHealthStatus(vital);
                    return (
                      <TableRow key={vital.id}>
                        <TableCell>
                          {vital.name || '-'}
                        </TableCell>
                        <TableCell>
                          {vital.phoneNumber || '-'}
                        </TableCell>
                        <TableCell>
                          {vital.heartRate ? (
                            <div className="flex items-center gap-1">
                              <span>{vital.heartRate}</span>
                              {getConfidenceIndicator(vital.heartRateConfLevel)}
                            </div>
                          ) : '-'}
                        </TableCell>
                        <TableCell>
                          {vital.oxygenSaturation ? (
                            <div className="flex items-center gap-1">
                              <span>{vital.oxygenSaturation}%</span>
                              {getConfidenceIndicator(vital.oxygenSaturationConfLevel)}
                            </div>
                          ) : '-'}
                        </TableCell>
                        <TableCell>
                          {vital.bloodPressure || 
                           (vital.bloodPressureSystolic && vital.bloodPressureDiastolic 
                            ? `${vital.bloodPressureSystolic}/${vital.bloodPressureDiastolic}` 
                            : '-')}
                        </TableCell>
                        <TableCell>
                          {vital.hrvSdnn !== null && vital.hrvSdnn !== undefined ? `${vital.hrvSdnn.toFixed(1)}ms` : '-'}
                        </TableCell>
                        <TableCell>
                          {vital.wellnessLevel ? (
                            <Badge variant={vital.wellnessLevel === 'Good' ? 'default' : 'secondary'}>
                              {vital.wellnessLevel}
                            </Badge>
                          ) : '-'}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            {vital.diabeticRisk && (
                              <span className={`text-xs ${getRiskColor(vital.diabeticRisk)}`}>
                                D: {vital.diabeticRisk}
                              </span>
                            )}
                            {vital.hypertensionRisk && (
                              <span className={`text-xs ${getRiskColor(vital.hypertensionRisk)}`}>
                                H: {vital.hypertensionRisk}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={status.variant}>
                            {status.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {formatDate(vital.recordedAt)}
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedVital(vital)}
                            className="flex items-center gap-1"
                          >
                            <Eye className="h-4 w-4" />
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Detailed View Modal */}
      {selectedVital && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200"
          onClick={() => setSelectedVital(null)}
        >
          <Card 
            className="max-w-4xl w-full max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <CardHeader className="sticky top-0 bg-background z-10 border-b">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl">Detailed Health Report</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    Recorded on {formatDate(selectedVital.recordedAt)}
                  </p>
                </div>
                <Badge variant={selectedVital.source === 'device' ? 'secondary' : 'outline'} className="text-lg px-3 py-1">
                  {selectedVital.source}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* ECG Analysis */}
              <ECGChart vital={selectedVital} />

              {/* Basic Vitals */}
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Basic Vitals
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {selectedVital.oxygenSaturation !== undefined && (
                    <div className="p-3 border rounded-lg">
                      <p className="text-xs text-muted-foreground">Oxygen Saturation</p>
                      <p className="text-xl font-bold">{selectedVital.oxygenSaturation}%</p>
                      {selectedVital.oxygenSaturationConfLevel && (
                        <p className="text-xs">Confidence: {selectedVital.oxygenSaturationConfLevel}/3</p>
                      )}
                    </div>
                  )}
                  {(selectedVital.bloodPressure || selectedVital.bloodPressureSystolic) && (
                    <div className="p-3 border rounded-lg">
                      <p className="text-xs text-muted-foreground">Blood Pressure</p>
                      <p className="text-xl font-bold">
                        {selectedVital.bloodPressure || 
                         `${selectedVital.bloodPressureSystolic}/${selectedVital.bloodPressureDiastolic}`}
                      </p>
                    </div>
                  )}
                  {selectedVital.breathingRate !== undefined && (
                    <div className="p-3 border rounded-lg">
                      <p className="text-xs text-muted-foreground">Breathing Rate</p>
                      <p className="text-xl font-bold">{selectedVital.breathingRate} rpm</p>
                    </div>
                  )}
                  {selectedVital.temperature !== undefined && (
                    <div className="p-3 border rounded-lg">
                      <p className="text-xs text-muted-foreground">Temperature</p>
                      <p className="text-xl font-bold">{selectedVital.temperature}°C</p>
                    </div>
                  )}
                  {selectedVital.bloodGlucose !== undefined && (
                    <div className="p-3 border rounded-lg">
                      <p className="text-xs text-muted-foreground">Blood Glucose</p>
                      <p className="text-xl font-bold">{selectedVital.bloodGlucose} mg/dL</p>
                    </div>
                  )}
                  {selectedVital.bmi !== undefined && selectedVital.bmi !== null && (
                    <div className="p-3 border rounded-lg">
                      <p className="text-xs text-muted-foreground">BMI</p>
                      <p className="text-xl font-bold">{selectedVital.bmi.toFixed(1)}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Stress & HRV Metrics */}
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Brain className="h-5 w-5" />
                  Stress & HRV Analysis
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {selectedVital.stressLevel !== undefined && (
                    <div className="p-3 border rounded-lg">
                      <p className="text-xs text-muted-foreground">Stress Level</p>
                      <p className="text-xl font-bold">{(selectedVital.stressLevel * 100).toFixed(0)}%</p>
                    </div>
                  )}
                  {selectedVital.hrvSdnn !== undefined && selectedVital.hrvSdnn !== null && (
                    <div className="p-3 border rounded-lg">
                      <p className="text-xs text-muted-foreground">HRV SDNN</p>
                      <p className="text-xl font-bold">{selectedVital.hrvSdnn.toFixed(1)}ms</p>
                    </div>
                  )}
                  {selectedVital.pnsIndex !== undefined && selectedVital.pnsIndex !== null && (
                    <div className="p-3 border rounded-lg">
                      <p className="text-xs text-muted-foreground">PNS Index</p>
                      <p className="text-xl font-bold">{selectedVital.pnsIndex.toFixed(2)}</p>
                      {selectedVital.pnsZone && (
                        <p className="text-xs">{selectedVital.pnsZone}</p>
                      )}
                    </div>
                  )}
                  {selectedVital.snsIndex !== undefined && selectedVital.snsIndex !== null && (
                    <div className="p-3 border rounded-lg">
                      <p className="text-xs text-muted-foreground">SNS Index</p>
                      <p className="text-xl font-bold">{selectedVital.snsIndex.toFixed(2)}</p>
                      {selectedVital.snsZone && (
                        <p className="text-xs">{selectedVital.snsZone}</p>
                      )}
                    </div>
                  )}
                  {selectedVital.wellnessIndex !== undefined && selectedVital.wellnessIndex !== null && (
                    <div className="p-3 border rounded-lg">
                      <p className="text-xs text-muted-foreground">Wellness Index</p>
                      <p className="text-xl font-bold">{selectedVital.wellnessIndex.toFixed(1)}</p>
                      {selectedVital.wellnessLevel && (
                        <p className="text-xs">{selectedVital.wellnessLevel}</p>
                      )}
                    </div>
                  )}
                  {selectedVital.recoveryAbility && (
                    <div className="p-3 border rounded-lg">
                      <p className="text-xs text-muted-foreground">Recovery Ability</p>
                      <p className="text-xl font-bold">{selectedVital.recoveryAbility}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Risk Assessment */}
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <AlertCircle className="h-5 w-5" />
                  Health Risk Assessment
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {selectedVital.diabeticRisk && (
                    <div className="p-3 border rounded-lg flex justify-between items-center">
                      <div>
                        <p className="text-xs text-muted-foreground">Diabetic Risk</p>
                        <p className={`font-semibold ${getRiskColor(selectedVital.diabeticRisk)}`}>
                          {selectedVital.diabeticRisk}
                        </p>
                      </div>
                      {selectedVital.diabeticRiskProbability !== undefined && selectedVital.diabeticRiskProbability !== null && (
                        <p className="text-lg font-bold">
                          {(selectedVital.diabeticRiskProbability * 100).toFixed(0)}%
                        </p>
                      )}
                    </div>
                  )}
                  {selectedVital.hypertensionRisk && (
                    <div className="p-3 border rounded-lg flex justify-between items-center">
                      <div>
                        <p className="text-xs text-muted-foreground">Hypertension Risk</p>
                        <p className={`font-semibold ${getRiskColor(selectedVital.hypertensionRisk)}`}>
                          {selectedVital.hypertensionRisk}
                        </p>
                      </div>
                      {selectedVital.hypertensionRiskProbability !== undefined && selectedVital.hypertensionRiskProbability !== null && (
                        <p className="text-lg font-bold">
                          {(selectedVital.hypertensionRiskProbability * 100).toFixed(0)}%
                        </p>
                      )}
                    </div>
                  )}
                  {selectedVital.heartAttackRisk && (
                    <div className="p-3 border rounded-lg flex justify-between items-center">
                      <div>
                        <p className="text-xs text-muted-foreground">Heart Attack Risk</p>
                        <p className={`font-semibold ${getRiskColor(selectedVital.heartAttackRisk)}`}>
                          {selectedVital.heartAttackRisk}
                        </p>
                      </div>
                      {selectedVital.heartAttackRiskProbability !== undefined && selectedVital.heartAttackRiskProbability !== null && (
                        <p className="text-lg font-bold">
                          {(selectedVital.heartAttackRiskProbability * 100).toFixed(0)}%
                        </p>
                      )}
                    </div>
                  )}
                  {selectedVital.strokeRisk && (
                    <div className="p-3 border rounded-lg flex justify-between items-center">
                      <div>
                        <p className="text-xs text-muted-foreground">Stroke Risk</p>
                        <p className={`font-semibold ${getRiskColor(selectedVital.strokeRisk)}`}>
                          {selectedVital.strokeRisk}
                        </p>
                      </div>
                      {selectedVital.strokeRiskProbability !== undefined && selectedVital.strokeRiskProbability !== null && (
                        <p className="text-lg font-bold">
                          {(selectedVital.strokeRiskProbability * 100).toFixed(0)}%
                        </p>
                      )}
                    </div>
                  )}
                  {selectedVital.asthmaRisk && (
                    <div className="p-3 border rounded-lg">
                      <p className="text-xs text-muted-foreground">Asthma Risk</p>
                      <p className={`font-semibold ${getRiskColor(selectedVital.asthmaRisk)}`}>
                        {selectedVital.asthmaRisk}
                      </p>
                    </div>
                  )}
                  {selectedVital.alzheimersRisk && (
                    <div className="p-3 border rounded-lg">
                      <p className="text-xs text-muted-foreground">Alzheimer\'s Risk</p>
                      <p className={`font-semibold ${getRiskColor(selectedVital.alzheimersRisk)}`}>
                        {selectedVital.alzheimersRisk}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Blood Metrics */}
              {(selectedVital.hemoglobin || selectedVital.hba1c) && (
                <div>
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <Droplets className="h-5 w-5" />
                    Blood Metrics
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {selectedVital.hemoglobin !== undefined && selectedVital.hemoglobin !== null && (
                      <div className="p-3 border rounded-lg">
                        <p className="text-xs text-muted-foreground">Hemoglobin</p>
                        <p className="text-xl font-bold">{selectedVital.hemoglobin.toFixed(1)} g/dL</p>
                      </div>
                    )}
                    {selectedVital.hba1c !== undefined && selectedVital.hba1c !== null && (
                      <div className="p-3 border rounded-lg">
                        <p className="text-xs text-muted-foreground">HbA1c</p>
                        <p className="text-xl font-bold">{selectedVital.hba1c.toFixed(1)}%</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="flex gap-2 pt-4 border-t">
                <Button onClick={() => setSelectedVital(null)} className="w-full" size="lg">
                  Close Report
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}