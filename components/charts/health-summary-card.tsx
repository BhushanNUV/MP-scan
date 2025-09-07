'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  TrendingDown,
  Minus,
  Heart,
  Activity,
  Thermometer,
  Wind,
  Droplets,
  Brain,
  AlertCircle,
  ChevronRight
} from 'lucide-react';

interface VitalReading {
  type: string;
  value: number;
  unit: string;
  timestamp: Date;
  status: 'normal' | 'warning' | 'critical';
  trend?: 'up' | 'down' | 'stable';
}

interface HealthSummaryCardProps {
  vitals: {
    bloodPressure?: { systolic: number; diastolic: number; timestamp: Date };
    heartRate?: { value: number; timestamp: Date };
    temperature?: { value: number; timestamp: Date };
    oxygenSaturation?: { value: number; timestamp: Date };
    respiratoryRate?: { value: number; timestamp: Date };
    bloodGlucose?: { value: number; timestamp: Date };
  };
  previousVitals?: {
    bloodPressure?: { systolic: number; diastolic: number };
    heartRate?: { value: number };
    temperature?: { value: number };
    oxygenSaturation?: { value: number };
  };
  onViewDetails?: () => void;
}

export function HealthSummaryCard({ 
  vitals, 
  previousVitals,
  onViewDetails 
}: HealthSummaryCardProps) {
  const [overallStatus, setOverallStatus] = useState<'excellent' | 'good' | 'fair' | 'attention'>('good');
  const [alerts, setAlerts] = useState<VitalReading[]>([]);
  const [improvements, setImprovements] = useState<VitalReading[]>([]);
  const [declines, setDeclines] = useState<VitalReading[]>([]);

  const assessVitalStatus = (type: string, value: number, previousValue?: number): VitalReading => {
    let status: 'normal' | 'warning' | 'critical' = 'normal';
    let trend: 'up' | 'down' | 'stable' = 'stable';
    let unit = '';

    switch (type) {
      case 'bloodPressureSystolic':
        unit = 'mmHg';
        if (value < 90) status = 'critical';
        else if (value < 120) status = 'normal';
        else if (value < 130) status = 'warning';
        else if (value < 140) status = 'warning';
        else status = 'critical';
        break;

      case 'bloodPressureDiastolic':
        unit = 'mmHg';
        if (value < 60) status = 'warning';
        else if (value < 80) status = 'normal';
        else if (value < 90) status = 'warning';
        else status = 'critical';
        break;

      case 'heartRate':
        unit = 'bpm';
        if (value < 50) status = 'warning';
        else if (value < 60) status = 'normal';
        else if (value < 100) status = 'normal';
        else if (value < 120) status = 'warning';
        else status = 'critical';
        break;

      case 'temperature':
        unit = '°C';
        if (value < 35) status = 'critical';
        else if (value < 36.5) status = 'warning';
        else if (value <= 37.5) status = 'normal';
        else if (value <= 38.5) status = 'warning';
        else status = 'critical';
        break;

      case 'oxygenSaturation':
        unit = '%';
        if (value < 90) status = 'critical';
        else if (value < 95) status = 'warning';
        else status = 'normal';
        break;

      case 'respiratoryRate':
        unit = '/min';
        if (value < 12) status = 'warning';
        else if (value <= 20) status = 'normal';
        else if (value <= 25) status = 'warning';
        else status = 'critical';
        break;

      case 'bloodGlucose':
        unit = 'mg/dL';
        if (value < 70) status = 'warning';
        else if (value <= 140) status = 'normal';
        else if (value <= 200) status = 'warning';
        else status = 'critical';
        break;
    }

    // Calculate trend
    if (previousValue !== undefined) {
      const changePercent = ((value - previousValue) / previousValue) * 100;
      if (Math.abs(changePercent) < 5) {
        trend = 'stable';
      } else {
        trend = changePercent > 0 ? 'up' : 'down';
      }
    }

    return {
      type,
      value,
      unit,
      timestamp: new Date(),
      status,
      trend
    };
  };

  useEffect(() => {
    const readings: VitalReading[] = [];
    const alertsList: VitalReading[] = [];
    const improvementsList: VitalReading[] = [];
    const declinesList: VitalReading[] = [];

    // Assess blood pressure
    if (vitals.bloodPressure) {
      const systolic = assessVitalStatus(
        'bloodPressureSystolic',
        vitals.bloodPressure.systolic,
        previousVitals?.bloodPressure?.systolic
      );
      const diastolic = assessVitalStatus(
        'bloodPressureDiastolic',
        vitals.bloodPressure.diastolic,
        previousVitals?.bloodPressure?.diastolic
      );
      
      readings.push(systolic, diastolic);
      
      if (systolic.status !== 'normal') alertsList.push(systolic);
      if (diastolic.status !== 'normal') alertsList.push(diastolic);
      
      // Check for improvements or declines
      if (previousVitals?.bloodPressure) {
        if (systolic.status === 'normal' && systolic.trend === 'down' && vitals.bloodPressure.systolic < 130) {
          improvementsList.push(systolic);
        }
        if (systolic.trend === 'up' && vitals.bloodPressure.systolic > 130) {
          declinesList.push(systolic);
        }
      }
    }

    // Assess heart rate
    if (vitals.heartRate) {
      const hr = assessVitalStatus(
        'heartRate',
        vitals.heartRate.value,
        previousVitals?.heartRate?.value
      );
      readings.push(hr);
      if (hr.status !== 'normal') alertsList.push(hr);
      
      if (previousVitals?.heartRate && hr.trend !== 'stable') {
        if (hr.status === 'normal' && Math.abs(vitals.heartRate.value - 70) < Math.abs(previousVitals.heartRate.value - 70)) {
          improvementsList.push(hr);
        } else if (hr.status !== 'normal') {
          declinesList.push(hr);
        }
      }
    }

    // Assess temperature
    if (vitals.temperature) {
      const temp = assessVitalStatus(
        'temperature',
        vitals.temperature.value,
        previousVitals?.temperature?.value
      );
      readings.push(temp);
      if (temp.status !== 'normal') alertsList.push(temp);
      
      if (previousVitals?.temperature && temp.trend !== 'stable') {
        if (temp.status === 'normal' && Math.abs(vitals.temperature.value - 37) < Math.abs(previousVitals.temperature.value - 37)) {
          improvementsList.push(temp);
        } else if (temp.status !== 'normal') {
          declinesList.push(temp);
        }
      }
    }

    // Assess oxygen saturation
    if (vitals.oxygenSaturation) {
      const o2 = assessVitalStatus(
        'oxygenSaturation',
        vitals.oxygenSaturation.value,
        previousVitals?.oxygenSaturation?.value
      );
      readings.push(o2);
      if (o2.status !== 'normal') alertsList.push(o2);
      
      if (previousVitals?.oxygenSaturation && o2.trend === 'up' && o2.status === 'normal') {
        improvementsList.push(o2);
      } else if (o2.trend === 'down' && o2.status !== 'normal') {
        declinesList.push(o2);
      }
    }

    // Calculate overall status
    const criticalCount = readings.filter(r => r.status === 'critical').length;
    const warningCount = readings.filter(r => r.status === 'warning').length;
    const normalCount = readings.filter(r => r.status === 'normal').length;

    if (criticalCount > 0) {
      setOverallStatus('attention');
    } else if (warningCount > 2) {
      setOverallStatus('fair');
    } else if (warningCount > 0) {
      setOverallStatus('good');
    } else if (normalCount === readings.length) {
      setOverallStatus('excellent');
    }

    setAlerts(alertsList);
    setImprovements(improvementsList);
    setDeclines(declinesList);
  }, [vitals, previousVitals]);

  const getStatusColor = () => {
    switch (overallStatus) {
      case 'excellent': return 'bg-green-100 text-green-800 dark:bg-green-950/20 dark:text-green-400';
      case 'good': return 'bg-blue-100 text-blue-800 dark:bg-blue-950/20 dark:text-blue-400';
      case 'fair': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950/20 dark:text-yellow-400';
      case 'attention': return 'bg-red-100 text-red-800 dark:bg-red-950/20 dark:text-red-400';
    }
  };

  const getStatusIcon = () => {
    switch (overallStatus) {
      case 'excellent': return <CheckCircle className="h-6 w-6" />;
      case 'good': return <CheckCircle className="h-6 w-6" />;
      case 'fair': return <AlertCircle className="h-6 w-6" />;
      case 'attention': return <AlertTriangle className="h-6 w-6" />;
    }
  };

  const getVitalIcon = (type: string) => {
    switch (type) {
      case 'bloodPressureSystolic':
      case 'bloodPressureDiastolic':
        return <Heart className="h-4 w-4" />;
      case 'heartRate':
        return <Activity className="h-4 w-4" />;
      case 'temperature':
        return <Thermometer className="h-4 w-4" />;
      case 'oxygenSaturation':
        return <Wind className="h-4 w-4" />;
      case 'respiratoryRate':
        return <Brain className="h-4 w-4" />;
      case 'bloodGlucose':
        return <Droplets className="h-4 w-4" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  const getTrendIcon = (trend?: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-3 w-3" />;
      case 'down': return <TrendingDown className="h-3 w-3" />;
      case 'stable': return <Minus className="h-3 w-3" />;
      default: return null;
    }
  };

  const formatVitalName = (type: string) => {
    switch (type) {
      case 'bloodPressureSystolic': return 'Systolic BP';
      case 'bloodPressureDiastolic': return 'Diastolic BP';
      case 'heartRate': return 'Heart Rate';
      case 'temperature': return 'Temperature';
      case 'oxygenSaturation': return 'O2 Saturation';
      case 'respiratoryRate': return 'Respiratory Rate';
      case 'bloodGlucose': return 'Blood Glucose';
      default: return type;
    }
  };

  return (
    <Card className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className={`p-3 rounded-lg ${getStatusColor()}`}>
            {getStatusIcon()}
          </div>
          <div>
            <h3 className="text-lg font-semibold">Health Summary</h3>
            <p className="text-sm text-muted-foreground">
              Overall Status: <span className="font-medium capitalize">{overallStatus}</span>
            </p>
          </div>
        </div>
        {onViewDetails && (
          <Button variant="ghost" size="sm" onClick={onViewDetails}>
            View Details
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        )}
      </div>

      {/* Alerts Section */}
      {alerts.length > 0 && (
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-4 w-4 text-orange-600" />
            <span className="text-sm font-medium">Alerts</span>
            <Badge variant="destructive" className="text-xs">
              {alerts.length}
            </Badge>
          </div>
          <div className="space-y-2">
            {alerts.map((alert, index) => (
              <div
                key={index}
                className={`flex items-center justify-between p-2 rounded-lg ${
                  alert.status === 'critical' 
                    ? 'bg-red-50 dark:bg-red-950/20' 
                    : 'bg-yellow-50 dark:bg-yellow-950/20'
                }`}
              >
                <div className="flex items-center gap-2">
                  {getVitalIcon(alert.type)}
                  <span className="text-sm font-medium">
                    {formatVitalName(alert.type)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-bold ${
                    alert.status === 'critical' ? 'text-red-600' : 'text-yellow-600'
                  }`}>
                    {alert.value}{alert.unit}
                  </span>
                  {getTrendIcon(alert.trend)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Improvements Section */}
      {improvements.length > 0 && (
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="h-4 w-4 text-green-600" />
            <span className="text-sm font-medium">Improvements</span>
            <Badge className="bg-green-100 text-green-800 text-xs">
              {improvements.length}
            </Badge>
          </div>
          <div className="space-y-2">
            {improvements.map((improvement, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-2 rounded-lg bg-green-50 dark:bg-green-950/20"
              >
                <div className="flex items-center gap-2">
                  {getVitalIcon(improvement.type)}
                  <span className="text-sm font-medium">
                    {formatVitalName(improvement.type)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-green-600">
                    {improvement.value}{improvement.unit}
                  </span>
                  <TrendingUp className="h-3 w-3 text-green-600" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Declines Section */}
      {declines.length > 0 && (
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingDown className="h-4 w-4 text-red-600" />
            <span className="text-sm font-medium">Needs Attention</span>
            <Badge variant="destructive" className="text-xs">
              {declines.length}
            </Badge>
          </div>
          <div className="space-y-2">
            {declines.map((decline, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-2 rounded-lg bg-red-50 dark:bg-red-950/20"
              >
                <div className="flex items-center gap-2">
                  {getVitalIcon(decline.type)}
                  <span className="text-sm font-medium">
                    {formatVitalName(decline.type)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-red-600">
                    {decline.value}{decline.unit}
                  </span>
                  <TrendingDown className="h-3 w-3 text-red-600" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t">
        <div className="text-center">
          <p className="text-2xl font-bold">{alerts.length}</p>
          <p className="text-xs text-muted-foreground">Active Alerts</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-green-600">
            {improvements.length > 0 ? `+${improvements.length}` : '0'}
          </p>
          <p className="text-xs text-muted-foreground">Improvements</p>
        </div>
      </div>
    </Card>
  );
}