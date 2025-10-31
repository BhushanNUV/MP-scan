'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
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
  Activity, 
  Heart,
  Droplets,
  Wind,
  Brain,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  FileText,
  Calendar
} from 'lucide-react';
import { toast } from 'sonner';
import { formatDate } from '@/lib/utils/calculations';

interface Vital {
  id: string;
  recordedAt: string;
  source: string;
  
  // Basic Vitals
  heartRate?: number;
  prq?: number;
  oxygenSaturation?: number;
  bloodPressure?: string;
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
  rmssd?: number;
  meanRri?: number;
  sd1?: number;
  sd2?: number;
  lfHf?: number;

  // Cardiovascular Metrics (BriahScan)
  cardiacWorkload?: number;
  pulsePressure?: number;
  meanArterialPressure?: number;

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
  ascvdRisk?: string;
  ASCVDRiskLevel?: string;
  highFastingGlucoseRisk?: string;
  highTotalCholesterolRisk?: string;
  lowHemoglobinRisk?: string;
  heartAge?: string;

  // Blood Metrics
  hemoglobin?: number;
  hemoglobinA1c?: number;
  hba1c?: number;

  // Additional
  bmi?: number;
  mspMatch?: number;
  
  user?: {
    email: string;
    name: string;
  };
  patient?: {
    firstName: string;
    lastName: string;
  };
}

export default function HealthReportsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [vitals, setVitals] = useState<Vital[]>([]);
  const [selectedVital, setSelectedVital] = useState<Vital | null>(null);

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
        loadVitals();
      } catch (error) {
        console.error('Error checking admin access:', error);
        router.push('/dashboard');
      }
    };
    
    checkAccess();
  }, [session, status, router]);

  const loadVitals = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/vitals');
      if (response.ok) {
        const data = await response.json();
        setVitals(data.vitals || []);
      }
    } catch (error) {
      console.error('Error loading vitals:', error);
      toast.error('Failed to load health reports');
    } finally {
      setLoading(false);
    }
  };

  const getRiskBadgeVariant = (risk?: string) => {
    if (!risk) return 'secondary';
    const lowerRisk = risk.toLowerCase();
    if (lowerRisk.includes('low')) return 'default';
    if (lowerRisk.includes('medium') || lowerRisk.includes('moderate')) return 'secondary';
    if (lowerRisk.includes('high')) return 'destructive';
    return 'secondary';
  };

  const getConfidenceColor = (level?: number) => {
    if (!level) return 'text-gray-500';
    if (level >= 3) return 'text-green-600';
    if (level >= 2) return 'text-yellow-600';
    return 'text-red-600';
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
            <FileText className="h-8 w-8" />
            Health Reports
          </h1>
          <p className="text-muted-foreground">Comprehensive vital signs and health metrics</p>
        </div>
        <Button onClick={loadVitals}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Health Vitals Records</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Patient</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>
                    <div className="flex items-center gap-1">
                      <Heart className="h-4 w-4" />
                      HR
                    </div>
                  </TableHead>
                  <TableHead>SpO2</TableHead>
                  <TableHead>BP</TableHead>
                  <TableHead>
                    <div className="flex items-center gap-1">
                      <Brain className="h-4 w-4" />
                      Stress
                    </div>
                  </TableHead>
                  <TableHead>HRV</TableHead>
                  <TableHead>Wellness</TableHead>
                  <TableHead>Risks</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {vitals.map((vital) => (
                  <TableRow key={vital.id}>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDate(vital.recordedAt)}
                      </div>
                    </TableCell>
                    <TableCell>{vital.user?.email || '-'}</TableCell>
                    <TableCell>
                      {vital.patient ? 
                        `${vital.patient.firstName} ${vital.patient.lastName}` : 
                        '-'
                      }
                    </TableCell>
                    <TableCell>
                      <Badge variant={vital.source === 'device' ? 'secondary' : 'default'}>
                        {vital.source}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {vital.heartRate ? (
                        <div>
                          <span className="font-medium">{vital.heartRate}</span>
                          {vital.heartRateConfLevel !== undefined && (
                            <span className={`ml-1 text-xs ${getConfidenceColor(vital.heartRateConfLevel)}`}>
                              ({vital.heartRateConfLevel})
                            </span>
                          )}
                        </div>
                      ) : '-'}
                    </TableCell>
                    <TableCell>
                      {vital.oxygenSaturation ? (
                        <div>
                          <span className="font-medium">{vital.oxygenSaturation}%</span>
                          {vital.oxygenSaturationConfLevel !== undefined && (
                            <span className={`ml-1 text-xs ${getConfidenceColor(vital.oxygenSaturationConfLevel)}`}>
                              ({vital.oxygenSaturationConfLevel})
                            </span>
                          )}
                        </div>
                      ) : '-'}
                    </TableCell>
                    <TableCell>
                      {vital.bloodPressure || '-'}
                    </TableCell>
                    <TableCell>
                      {vital.stressLevel ? (
                        <Badge variant={vital.stressLevel > 0.5 ? 'destructive' : 'default'}>
                          {(vital.stressLevel * 100).toFixed(0)}%
                        </Badge>
                      ) : '-'}
                    </TableCell>
                    <TableCell>
                      {vital.hrvSdnn ? `${vital.hrvSdnn.toFixed(1)}ms` : '-'}
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
                          <Badge variant={getRiskBadgeVariant(vital.diabeticRisk)} className="text-xs">
                            D: {vital.diabeticRisk}
                          </Badge>
                        )}
                        {vital.hypertensionRisk && (
                          <Badge variant={getRiskBadgeVariant(vital.hypertensionRisk)} className="text-xs">
                            H: {vital.hypertensionRisk}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedVital(vital)}
                      >
                        View Details
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Detail Modal */}
      {selectedVital && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>Vital Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Date</p>
                  <p className="font-medium">{formatDate(selectedVital.recordedAt)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">User</p>
                  <p className="font-medium">{selectedVital.user?.email || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Source</p>
                  <Badge>{selectedVital.source}</Badge>
                </div>
              </div>

              {/* Basic Vitals */}
              <div>
                <h3 className="font-semibold mb-2">Basic Vitals</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {selectedVital.heartRate && (
                    <div className="p-2 border rounded">
                      <p className="text-xs text-muted-foreground">Heart Rate</p>
                      <p className="text-lg font-bold">{selectedVital.heartRate} bpm</p>
                    </div>
                  )}
                  {selectedVital.oxygenSaturation && (
                    <div className="p-2 border rounded">
                      <p className="text-xs text-muted-foreground">SpO2</p>
                      <p className="text-lg font-bold">{selectedVital.oxygenSaturation}%</p>
                    </div>
                  )}
                  {selectedVital.bloodPressure && (
                    <div className="p-2 border rounded">
                      <p className="text-xs text-muted-foreground">Blood Pressure</p>
                      <p className="text-lg font-bold">{selectedVital.bloodPressure}</p>
                    </div>
                  )}
                  {selectedVital.breathingRate && (
                    <div className="p-2 border rounded">
                      <p className="text-xs text-muted-foreground">Breathing Rate</p>
                      <p className="text-lg font-bold">{selectedVital.breathingRate}</p>
                    </div>
                  )}
                  {selectedVital.temperature && (
                    <div className="p-2 border rounded">
                      <p className="text-xs text-muted-foreground">Temperature</p>
                      <p className="text-lg font-bold">{selectedVital.temperature}°C</p>
                    </div>
                  )}
                  {selectedVital.bloodGlucose && (
                    <div className="p-2 border rounded">
                      <p className="text-xs text-muted-foreground">Blood Glucose</p>
                      <p className="text-lg font-bold">{selectedVital.bloodGlucose} mg/dL</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Cardiovascular Metrics (BriahScan) */}
              {(selectedVital.cardiacWorkload !== undefined && selectedVital.cardiacWorkload !== null && selectedVital.cardiacWorkload !== 0 ||
                selectedVital.pulsePressure !== undefined && selectedVital.pulsePressure !== null && selectedVital.pulsePressure !== 0 ||
                selectedVital.meanArterialPressure !== undefined && selectedVital.meanArterialPressure !== null && selectedVital.meanArterialPressure !== 0) && (
                <div>
                  <h3 className="font-semibold mb-2">Cardiovascular Metrics</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {selectedVital.cardiacWorkload !== undefined && selectedVital.cardiacWorkload !== null && selectedVital.cardiacWorkload !== 0 && (
                      <div className="p-2 border rounded">
                        <p className="text-xs text-muted-foreground">Cardiac Workload</p>
                        <p className="text-lg font-bold">{selectedVital.cardiacWorkload.toFixed(1)}</p>
                      </div>
                    )}
                    {selectedVital.pulsePressure !== undefined && selectedVital.pulsePressure !== null && selectedVital.pulsePressure !== 0 && (
                      <div className="p-2 border rounded">
                        <p className="text-xs text-muted-foreground">Pulse Pressure</p>
                        <p className="text-lg font-bold">{selectedVital.pulsePressure} mmHg</p>
                      </div>
                    )}
                    {selectedVital.meanArterialPressure !== undefined && selectedVital.meanArterialPressure !== null && selectedVital.meanArterialPressure !== 0 && (
                      <div className="p-2 border rounded">
                        <p className="text-xs text-muted-foreground">Mean Arterial Pressure</p>
                        <p className="text-lg font-bold">{selectedVital.meanArterialPressure.toFixed(1)} mmHg</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Stress & HRV */}
              <div>
                <h3 className="font-semibold mb-2">Stress & HRV Metrics</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {selectedVital.stressLevel !== undefined && selectedVital.stressLevel !== null && selectedVital.stressLevel !== 0 && (
                    <div className="p-2 border rounded">
                      <p className="text-xs text-muted-foreground">Stress Level</p>
                      <p className="text-lg font-bold">
                        {typeof selectedVital.stressLevel === 'number'
                          ? `${(selectedVital.stressLevel * 100).toFixed(0)}%`
                          : selectedVital.stressLevel}
                      </p>
                    </div>
                  )}
                  {selectedVital.stressIndex !== undefined && selectedVital.stressIndex !== null && selectedVital.stressIndex !== 0 && (
                    <div className="p-2 border rounded">
                      <p className="text-xs text-muted-foreground">Stress Index</p>
                      <p className="text-lg font-bold">{selectedVital.stressIndex.toFixed(1)}</p>
                    </div>
                  )}
                  {selectedVital.hrvSdnn && selectedVital.hrvSdnn !== 0 && (
                    <div className="p-2 border rounded">
                      <p className="text-xs text-muted-foreground">HRV SDNN</p>
                      <p className="text-lg font-bold">{selectedVital.hrvSdnn.toFixed(1)}ms</p>
                    </div>
                  )}
                  {selectedVital.wellnessIndex !== undefined && selectedVital.wellnessIndex !== null && selectedVital.wellnessIndex !== 0 && (
                    <div className="p-2 border rounded">
                      <p className="text-xs text-muted-foreground">Wellness Index</p>
                      <p className="text-lg font-bold">{selectedVital.wellnessIndex.toFixed(1)}</p>
                    </div>
                  )}
                  {selectedVital.wellnessLevel && (
                    <div className="p-2 border rounded">
                      <p className="text-xs text-muted-foreground">Wellness Level</p>
                      <p className="text-lg font-bold">{selectedVital.wellnessLevel}</p>
                    </div>
                  )}
                  {selectedVital.pnsIndex !== undefined && selectedVital.pnsIndex !== null && selectedVital.pnsIndex !== 0 && (
                    <div className="p-2 border rounded">
                      <p className="text-xs text-muted-foreground">PNS Index</p>
                      <p className="text-lg font-bold">{selectedVital.pnsIndex.toFixed(2)}</p>
                    </div>
                  )}
                  {selectedVital.snsIndex !== undefined && selectedVital.snsIndex !== null && selectedVital.snsIndex !== 0 && (
                    <div className="p-2 border rounded">
                      <p className="text-xs text-muted-foreground">SNS Index</p>
                      <p className="text-lg font-bold">{selectedVital.snsIndex.toFixed(2)}</p>
                    </div>
                  )}
                  {selectedVital.rmssd !== undefined && selectedVital.rmssd !== null && selectedVital.rmssd !== 0 && (
                    <div className="p-2 border rounded">
                      <p className="text-xs text-muted-foreground">RMSSD</p>
                      <p className="text-lg font-bold">{selectedVital.rmssd.toFixed(1)}ms</p>
                    </div>
                  )}
                  {selectedVital.meanRri !== undefined && selectedVital.meanRri !== null && selectedVital.meanRri !== 0 && (
                    <div className="p-2 border rounded">
                      <p className="text-xs text-muted-foreground">Mean RRI</p>
                      <p className="text-lg font-bold">{selectedVital.meanRri.toFixed(0)}ms</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Blood Metrics */}
              {(selectedVital.hemoglobin || selectedVital.hba1c || selectedVital.hemoglobinA1c) && (
                <div>
                  <h3 className="font-semibold mb-2">Blood Metrics</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {selectedVital.hemoglobin !== undefined && selectedVital.hemoglobin !== null && (
                      <div className="p-2 border rounded">
                        <p className="text-xs text-muted-foreground">Hemoglobin</p>
                        <p className="text-lg font-bold">{selectedVital.hemoglobin.toFixed(1)} g/dL</p>
                      </div>
                    )}
                    {selectedVital.hba1c !== undefined && selectedVital.hba1c !== null && (
                      <div className="p-2 border rounded">
                        <p className="text-xs text-muted-foreground">HbA1c</p>
                        <p className="text-lg font-bold">{selectedVital.hba1c.toFixed(2)}%</p>
                      </div>
                    )}
                    {selectedVital.hemoglobinA1c !== undefined && selectedVital.hemoglobinA1c !== null && (
                      <div className="p-2 border rounded">
                        <p className="text-xs text-muted-foreground">Hemoglobin A1c</p>
                        <p className="text-lg font-bold">{selectedVital.hemoglobinA1c}%</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Risk Assessments */}
              <div>
                <h3 className="font-semibold mb-2">Risk Assessments</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {selectedVital.diabeticRisk && (
                    <div className="p-2 border rounded">
                      <p className="text-xs text-muted-foreground">Diabetic Risk</p>
                      <Badge variant={getRiskBadgeVariant(selectedVital.diabeticRisk)}>
                        {selectedVital.diabeticRisk}
                      </Badge>
                    </div>
                  )}
                  {selectedVital.hypertensionRisk && (
                    <div className="p-2 border rounded">
                      <p className="text-xs text-muted-foreground">Hypertension Risk</p>
                      <Badge variant={getRiskBadgeVariant(selectedVital.hypertensionRisk)}>
                        {selectedVital.hypertensionRisk}
                      </Badge>
                    </div>
                  )}
                  {selectedVital.heartAttackRisk && (
                    <div className="p-2 border rounded">
                      <p className="text-xs text-muted-foreground">Heart Attack Risk</p>
                      <Badge variant={getRiskBadgeVariant(selectedVital.heartAttackRisk)}>
                        {selectedVital.heartAttackRisk}
                      </Badge>
                    </div>
                  )}
                  {selectedVital.strokeRisk && (
                    <div className="p-2 border rounded">
                      <p className="text-xs text-muted-foreground">Stroke Risk</p>
                      <Badge variant={getRiskBadgeVariant(selectedVital.strokeRisk)}>
                        {selectedVital.strokeRisk}
                      </Badge>
                    </div>
                  )}
                  {selectedVital.ASCVDRiskLevel && (
                    <div className="p-2 border rounded">
                      <p className="text-xs text-muted-foreground">ASCVD Risk Level</p>
                      <Badge variant={getRiskBadgeVariant(selectedVital.ASCVDRiskLevel)}>
                        {selectedVital.ASCVDRiskLevel}
                      </Badge>
                    </div>
                  )}
                  {selectedVital.ascvdRisk && (
                    <div className="p-2 border rounded">
                      <p className="text-xs text-muted-foreground">ASCVD Risk</p>
                      <Badge variant={getRiskBadgeVariant(selectedVital.ascvdRisk)}>
                        {selectedVital.ascvdRisk}
                      </Badge>
                    </div>
                  )}
                  {selectedVital.highFastingGlucoseRisk && (
                    <div className="p-2 border rounded">
                      <p className="text-xs text-muted-foreground">High Fasting Glucose</p>
                      <Badge variant={getRiskBadgeVariant(selectedVital.highFastingGlucoseRisk)}>
                        {selectedVital.highFastingGlucoseRisk}
                      </Badge>
                    </div>
                  )}
                  {selectedVital.highTotalCholesterolRisk && (
                    <div className="p-2 border rounded">
                      <p className="text-xs text-muted-foreground">High Cholesterol</p>
                      <Badge variant={getRiskBadgeVariant(selectedVital.highTotalCholesterolRisk)}>
                        {selectedVital.highTotalCholesterolRisk}
                      </Badge>
                    </div>
                  )}
                  {selectedVital.lowHemoglobinRisk && (
                    <div className="p-2 border rounded">
                      <p className="text-xs text-muted-foreground">Low Hemoglobin</p>
                      <Badge variant={getRiskBadgeVariant(selectedVital.lowHemoglobinRisk)}>
                        {selectedVital.lowHemoglobinRisk}
                      </Badge>
                    </div>
                  )}
                  {selectedVital.heartAge && (
                    <div className="p-2 border rounded">
                      <p className="text-xs text-muted-foreground">Heart Age</p>
                      <p className="text-lg font-bold">{selectedVital.heartAge}</p>
                    </div>
                  )}
                  {selectedVital.asthmaRisk && (
                    <div className="p-2 border rounded">
                      <p className="text-xs text-muted-foreground">Asthma Risk</p>
                      <Badge variant={getRiskBadgeVariant(selectedVital.asthmaRisk)}>
                        {selectedVital.asthmaRisk}
                      </Badge>
                    </div>
                  )}
                  {selectedVital.alzheimersRisk && (
                    <div className="p-2 border rounded">
                      <p className="text-xs text-muted-foreground">Alzheimer's Risk</p>
                      <Badge variant={getRiskBadgeVariant(selectedVital.alzheimersRisk)}>
                        {selectedVital.alzheimersRisk}
                      </Badge>
                    </div>
                  )}
                </div>
              </div>

              <Button onClick={() => setSelectedVital(null)} className="w-full">
                Close
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}