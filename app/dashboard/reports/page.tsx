'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
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
  Heart,
  Activity,
  Brain,
  AlertCircle,
  Printer,
  Download,
  Filter,
  Eye,
  Droplets,
  RefreshCw,
  User,
  Clock,
  Search
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
  notes?: string;
  
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
  stressLevel?: number | string;
  stressIndex?: number;
  stressResponse?: string;
  recoveryAbility?: string;
  respiration?: number;
  
  // HRV Metrics
  hrvSdnn?: number;
  hrvSdnnConfLevel?: number;
  pnsIndex?: number;
  pnsZone?: string;
  snsIndex?: number;
  snsZone?: string;
  sd1?: number;
  sd2?: number;
  rmssd?: number;
  meanRri?: number;
  lfHf?: number;
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
  highFastingGlucoseRisk?: string;
  highTotalCholesterolRisk?: string;
  lowHemoglobinRisk?: string;
  ascvdRisk?: string;
  heartAge?: string;
  asthmaRisk?: string;
  alzheimersRisk?: string;
  
  // Blood Metrics
  hemoglobin?: number;
  hemoglobinA1c?: number;
  hba1c?: number;
  
  // Additional
  bmi?: number;
  mspMatch?: number;
  symptoms?: string;
  
  patient?: {
    firstName: string;
    lastName: string;
  };
}

export default function ReportsPage() {
  const { data: session } = useSession();
  const [vitals, setVitals] = useState<Vital[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVital, setSelectedVital] = useState<Vital | null>(null);
  const [filterPeriod, setFilterPeriod] = useState('all');

  // Check if BriahScan admin
  const isBriahScanAdmin = session?.user?.email === 'briahscan@admin.com';

  useEffect(() => {
    if (session) {
      loadVitals();
    }
  }, [session]);

  const loadVitals = async () => {
    setLoading(true);
    try {
      // Check if this is BriahScan admin using session
      const isBriahScanAdmin = session?.user?.email === 'briahscan@admin.com';

      console.log('Session email:', session?.user?.email);
      console.log('Is BriahScan Admin:', isBriahScanAdmin);

      let response;
      if (isBriahScanAdmin) {
        // Fetch BriahScan data
        console.log('Fetching BriahScan data...');
        response = await fetch('/api/brain-scan?limit=100');
      } else {
        // Fetch regular vitals data
        console.log('Fetching regular vitals data...');
        response = await fetch('/api/user/vitals');
      }

      if (response.ok) {
        const data = await response.json();
        if (isBriahScanAdmin) {
          console.log('Loaded BriahScan data:', data.data?.length || 0, 'records');
          setVitals(data.data || []);
        } else {
          console.log('Loaded vitals data:', data.vitals?.length || 0, 'records');
          setVitals(data.vitals || []);
        }
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

  const handlePrint = (vital: Vital) => {
    // Create a new window for printing
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Please allow pop-ups to print the report');
      return;
    }

    // Calculate ECG metrics for display only if heartRate exists
    const hasHeartRate = vital.heartRate && vital.heartRate > 0;
    const heartRate = vital.heartRate || 72;
    const hrvSdnn = vital.hrvSdnn || 42;
    const stressLevelNum = typeof vital.stressLevel === 'number' 
      ? vital.stressLevel 
      : vital.stressLevel === 'HIGH' ? 0.8 
      : vital.stressLevel === 'MILD' ? 0.4 
      : 0.3;
    const oxygenSaturation = vital.oxygenSaturation || 98;
    const pnsIndex = vital.pnsIndex || 0.5;
    const snsIndex = vital.snsIndex || 0.5;
    const rrInterval = 60 / heartRate;
    const prInterval = 160 - (heartRate - 60) * 0.4;
    const qrsDuration = 90 + stressLevelNum * 20;
    const qtInterval = 400 - (heartRate - 60) * 2;
    const qtcInterval = qtInterval / Math.sqrt(rrInterval);
    const pWaveDuration = 80 + (heartRate > 100 ? -10 : 0);
    const tWaveDuration = 160 - (heartRate - 60) * 0.5;
    const tWaveDeflection = 0.2 + (stressLevelNum * 0.1);

    // Generate ECG waveform data for SVG with lead-specific variations
    const generateECGPath = (leadName: string = 'Lead II') => {
      // Lead-specific amplitude multipliers
      const leadConfigs: Record<string, { amplitude: number; invert: boolean }> = {
        'Lead I': { amplitude: 1.0, invert: false },
        'Lead II': { amplitude: 1.2, invert: false },
        'Lead III': { amplitude: 0.8, invert: false },
        'aVR': { amplitude: 0.5, invert: true },
        'aVL': { amplitude: 0.6, invert: false },
        'aVF': { amplitude: 1.1, invert: false },
        'V1': { amplitude: 0.3, invert: false },
        'V2': { amplitude: 0.8, invert: false },
        'V3': { amplitude: 1.5, invert: false },
        'V4': { amplitude: 2.0, invert: false },
        'V5': { amplitude: 1.8, invert: false },
        'V6': { amplitude: 1.2, invert: false }
      };
      
      const leadConfig = leadConfigs[leadName] || { amplitude: 1.0, invert: false };
      
    const generateECGPathBase = () => {
      const duration = 3; // 3 seconds of ECG
      const sampleRate = 250; // samples per second
      const totalSamples = duration * sampleRate;
      const beatTimes: number[] = [];
      
      // Generate beat times with HRV
      let currentTime = 0;
      while (currentTime < duration) {
        const hrvVariation = (Math.random() - 0.5) * (hrvSdnn / 1000);
        const interval = rrInterval + hrvVariation;
        beatTimes.push(currentTime);
        currentTime += Math.max(0.4, Math.min(2, interval));
      }
      
      // Generate PQRST complex
      const generatePQRST = (timeInBeat: number, beatDuration: number) => {
        const normTime = timeInBeat / beatDuration;
        let amplitude = 0;
        
        // Wave timing parameters
        const pStart = 0.05, pEnd = 0.15;
        const qStart = 0.17, qEnd = 0.19;
        const rStart = 0.19, rEnd = 0.23;
        const sStart = 0.23, sEnd = 0.25;
        const tStart = 0.30, tEnd = 0.55;
        
        // P wave
        if (normTime >= pStart && normTime < pEnd) {
          const pProgress = (normTime - pStart) / (pEnd - pStart);
          amplitude = 0.15 * Math.sin(Math.PI * pProgress);
        }
        // Q wave
        else if (normTime >= qStart && normTime < qEnd) {
          const qProgress = (normTime - qStart) / (qEnd - qStart);
          amplitude = -0.1 * Math.sin(Math.PI * qProgress);
        }
        // R wave
        else if (normTime >= rStart && normTime < rEnd) {
          const rProgress = (normTime - rStart) / (rEnd - rStart);
          amplitude = 1.0 * Math.sin(Math.PI * rProgress);
        }
        // S wave
        else if (normTime >= sStart && normTime < sEnd) {
          const sProgress = (normTime - sStart) / (sEnd - sStart);
          amplitude = -0.3 * Math.sin(Math.PI * sProgress);
        }
        // T wave
        else if (normTime >= tStart && normTime < tEnd) {
          const tProgress = (normTime - tStart) / (tEnd - tStart);
          amplitude = 0.35 * Math.sin(Math.PI * tProgress);
          
          // Modify T wave based on conditions
          if (stressLevelNum > 0.5) amplitude *= 0.8;
          if (oxygenSaturation < 90) amplitude *= 0.7;
        }
        
        return amplitude;
      };
      
      // Generate path points
      const points: string[] = [];
      for (let i = 0; i < totalSamples; i++) {
        const sampleTime = i / sampleRate;
        let amplitude = 0;
        
        // Find current beat
        for (let j = 0; j < beatTimes.length; j++) {
          const beatTime = beatTimes[j];
          const nextBeatTime = beatTimes[j + 1] || beatTime + rrInterval;
          
          if (sampleTime >= beatTime && sampleTime < nextBeatTime) {
            const timeInBeat = sampleTime - beatTime;
            const beatDuration = nextBeatTime - beatTime;
            amplitude = generatePQRST(timeInBeat, beatDuration);
            break;
          }
        }
        
        // Add baseline wander and noise
        amplitude += 0.02 * Math.sin(2 * Math.PI * 0.15 * sampleTime);
        amplitude += (Math.random() - 0.5) * 0.01;
        
        // Scale for SVG (x: 0-800, y: centered at 150)
        const x = (i / totalSamples) * 800;
        const y = 150 - amplitude * 100;
        
        if (i === 0) {
          points.push(`M ${x} ${y}`);
        } else {
          points.push(`L ${x} ${y}`);
        }
      }
      
      return points.join(' ');
    };
    
    // Generate the base path and apply lead-specific transformations
    const basePath = generateECGPathBase();
    
    // Apply lead-specific amplitude and inversion
    if (leadConfig.invert) {
      // For inverted leads like aVR, flip the waveform
      return basePath.replace(/(\d+\.?\d*)/g, (match, p1, offset, string) => {
        // Only transform y-coordinates (every second number after M or L)
        const prevChar = string[offset - 2];
        if (prevChar === ' ' || prevChar === 'L' || prevChar === 'M') {
          return p1; // This is an x-coordinate, don't transform
        } else {
          // This is a y-coordinate, invert it
          const y = parseFloat(p1);
          const inverted = 150 + (150 - y) * leadConfig.amplitude;
          return inverted.toFixed(2);
        }
      });
    } else {
      // Apply amplitude scaling
      return basePath.replace(/(\d+\.?\d*)/g, (match, p1, offset, string) => {
        const prevChar = string[offset - 2];
        if (prevChar === ' ' || prevChar === 'L' || prevChar === 'M') {
          return p1; // x-coordinate
        } else {
          // y-coordinate with amplitude scaling
          const y = parseFloat(p1);
          const scaled = 150 + (y - 150) * leadConfig.amplitude;
          return scaled.toFixed(2);
        }
      });
    }
    };

    // Generate the print content
    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Health Report - ${vital.name || 'Patient'}</title>
          <style>
            /* A4 Paper Size Settings */
            @page {
              size: A4;
              margin: 15mm 10mm 15mm 10mm;
            }
            
            @media print {
              * {
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
                color-adjust: exact !important;
              }
              
              body { 
                margin: 0;
                padding: 0;
                width: 100%;
                height: 100%;
              }
              
              .no-print { display: none !important; }
              
              /* Page break controls */
              .page-break { page-break-after: always; }
              .avoid-break { page-break-inside: avoid; }
              
              /* Ensure ECG sections don't break */
              .ecg-section { 
                page-break-inside: avoid;
                break-inside: avoid;
              }
              
              .section {
                page-break-inside: avoid;
                break-inside: avoid;
              }
              
              /* Adjust font sizes for print */
              .header h1 { font-size: 24px !important; }
              .section h2 { font-size: 18px !important; }
              .metric-value { font-size: 16px !important; }
              .metric-label { font-size: 10px !important; }
              
              /* Ensure grids fit properly */
              .metrics-grid {
                grid-template-columns: repeat(3, 1fr) !important;
              }
              
              /* ECG grid adjustments for A4 */
              .ecg-leads-grid {
                page-break-inside: avoid;
              }
            }
            
            /* Screen and Print Styles */
            body {
              font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              margin: 0;
              padding: 0;
              background: white;
            }
            
            /* A4 Container */
            .report-container {
              width: 210mm;
              min-height: 297mm;
              margin: 0 auto;
              padding: 15mm 10mm;
              background: white;
              box-sizing: border-box;
            }
            
            @media screen {
              .report-container {
                box-shadow: 0 0 10px rgba(0,0,0,0.1);
                margin: 20px auto;
              }
            }
            .header {
              text-align: center;
              border-bottom: 3px solid #2563eb;
              padding-bottom: 20px;
              margin-bottom: 30px;
            }
            .header h1 {
              margin: 0 0 10px 0;
              color: #1e40af;
              font-size: 28px;
            }
            .patient-info {
              background: linear-gradient(to right, #eff6ff, #f0f9ff);
              padding: 20px;
              border-radius: 8px;
              margin-bottom: 25px;
              border-left: 4px solid #2563eb;
            }
            .patient-info h3 {
              margin-top: 0;
              color: #1e40af;
            }
            .section {
              margin-bottom: 30px;
              page-break-inside: avoid;
            }
            .section h2 {
              color: #1e40af;
              border-bottom: 2px solid #e5e7eb;
              padding-bottom: 8px;
              margin-bottom: 20px;
              font-size: 20px;
            }
            .metrics-grid {
              display: grid;
              grid-template-columns: repeat(3, 1fr);
              gap: 12px;
              margin-bottom: 20px;
            }
            
            @media screen and (max-width: 768px) {
              .metrics-grid {
                grid-template-columns: repeat(2, 1fr);
              }
            }
            
            @media screen and (max-width: 480px) {
              .metrics-grid {
                grid-template-columns: 1fr;
              }
            }
            .metric {
              padding: 15px;
              background: #f9fafb;
              border-left: 4px solid #3b82f6;
              border-radius: 4px;
            }
            .metric-label {
              font-size: 11px;
              color: #6b7280;
              margin-bottom: 5px;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            .metric-value {
              font-size: 20px;
              font-weight: bold;
              color: #1f2937;
            }
            .metric-unit {
              font-size: 14px;
              color: #6b7280;
              font-weight: normal;
            }
            .ecg-section {
              background: #f3f4f6;
              padding: 15px;
              border-radius: 8px;
              margin-bottom: 20px;
              page-break-inside: avoid;
            }
            
            .ecg-leads-container {
              width: 100%;
              max-width: 190mm;
              margin: 0 auto;
            }
            
            .ecg-lead-row {
              display: grid;
              grid-template-columns: repeat(3, 1fr);
              gap: 8px;
              margin-bottom: 8px;
            }
            
            .ecg-lead-item {
              background: #1a1a1a;
              border-radius: 4px;
              padding: 8px;
              box-sizing: border-box;
            }
            
            .ecg-lead-item svg {
              width: 100%;
              height: auto;
              display: block;
            }
            
            @media print {
              .ecg-lead-row {
                grid-template-columns: repeat(3, 1fr) !important;
                gap: 5px !important;
              }
              
              .ecg-lead-item {
                padding: 5px !important;
              }
              
              /* Ensure V1-V6 leads print in 2 rows of 3 */
              .ecg-precordial-leads {
                display: grid !important;
                grid-template-columns: repeat(3, 1fr) !important;
                gap: 5px !important;
              }
            }
            
            .ecg-title {
              color: #1e40af;
              font-size: 18px;
              margin-bottom: 15px;
              font-weight: 600;
            }
            
            .ecg-note {
              color: #6b7280;
              font-size: 11px;
              font-style: italic;
            }
            
            .ecg-rhythm-strip {
              width: 100%;
              margin-top: 10px;
              background: #1a1a1a;
              border-radius: 4px;
              padding: 8px;
            }
            
            .ecg-rhythm-strip svg {
              width: 100%;
              height: auto;
            }
            .risk-assessment {
              padding: 12px 16px;
              margin: 10px 0;
              border-radius: 6px;
              display: flex;
              justify-content: space-between;
              align-items: center;
            }
            .risk-low { 
              background: #d1fae5; 
              color: #065f46;
              border-left: 4px solid #10b981;
            }
            .risk-medium { 
              background: #fed7aa; 
              color: #9a3412;
              border-left: 4px solid #f97316;
            }
            .risk-high { 
              background: #fee2e2; 
              color: #991b1b;
              border-left: 4px solid #ef4444;
            }
            .blood-metrics {
              background: #fef3c7;
              padding: 15px;
              border-radius: 6px;
              border-left: 4px solid #fbbf24;
            }
            .footer {
              margin-top: 40px;
              padding-top: 20px;
              border-top: 2px solid #e5e7eb;
              text-align: center;
              font-size: 11px;
              color: #6b7280;
            }
            .two-column {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 20px;
            }
            .wellness-badge {
              display: inline-block;
              padding: 4px 12px;
              border-radius: 12px;
              font-size: 12px;
              font-weight: 600;
              background: #e0e7ff;
              color: #3730a3;
              margin-left: 8px;
            }
          </style>
        </head>
        <body>
          <div class="report-container">
          <div class="header">
            <h1>Comprehensive Health Report</h1>
            <p style="margin: 5px 0;">Generated on ${new Date().toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}</p>
          </div>

          <div class="patient-info">
            <h3>Patient Information</h3>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
              <div><strong>Name:</strong> ${vital.name || 'Not provided'}</div>
              <div><strong>Phone:</strong> ${vital.phoneNumber || 'Not provided'}</div>
              <div><strong>Recording Date:</strong> ${new Date(vital.recordedAt).toLocaleString()}</div>
              <div><strong>Data Source:</strong> ${vital.source || 'Manual'}</div>
            </div>
          </div>

          ${hasHeartRate ? `
          <!-- ECG Analysis Section -->
          <div class="section">
            <h2>ECG Analysis (Under Research)</h2>
            <div class="ecg-section">
              <div class="ecg-note">ECG waveform analysis based on vital parameters</div>
              
              <!-- 12-Lead ECG Display -->
              <div class="ecg-leads-container" style="background: #fff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 15px; margin: 15px 0;">
                <h3 class="ecg-title" style="margin: 0 0 10px 0;">12-Lead ECG Recording</h3>
                
                <!-- Standard Limb Leads (I, II, III) -->
                <div class="ecg-lead-row">
                  ${['Lead I', 'Lead II', 'Lead III'].map(lead => `
                    <div style="background: #1a1a1a; border-radius: 4px; padding: 10px;">
                      <svg width="100%" height="100" viewBox="0 0 250 100" style="display: block;">
                        <defs>
                          <pattern id="smallGrid${lead.replace(' ', '')}" width="5" height="5" patternUnits="userSpaceOnUse">
                            <path d="M 5 0 L 0 0 0 5" fill="none" stroke="rgba(255, 182, 193, 0.15)" stroke-width="0.3"/>
                          </pattern>
                          <pattern id="grid${lead.replace(' ', '')}" width="25" height="25" patternUnits="userSpaceOnUse">
                            <rect width="25" height="25" fill="url(#smallGrid${lead.replace(' ', '')})" />
                            <path d="M 25 0 L 0 0 0 25" fill="none" stroke="rgba(255, 182, 193, 0.3)" stroke-width="0.5"/>
                          </pattern>
                        </defs>
                        <rect width="250" height="100" fill="url(#grid${lead.replace(' ', '')})" />
                        <path d="${generateECGPath(lead)}" fill="none" stroke="#00ff00" stroke-width="1.5" transform="scale(0.3125, 0.333)"/>
                        <text x="5" y="12" fill="#00ff00" font-size="10" font-family="monospace">${lead}</text>
                      </svg>
                    </div>
                  `).join('')}
                </div>
                
                <!-- Augmented Limb Leads (aVR, aVL, aVF) -->
                <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 10px;">
                  ${['aVR', 'aVL', 'aVF'].map(lead => `
                    <div style="background: #1a1a1a; border-radius: 4px; padding: 10px;">
                      <svg width="100%" height="100" viewBox="0 0 250 100" style="display: block;">
                        <defs>
                          <pattern id="smallGrid${lead}" width="5" height="5" patternUnits="userSpaceOnUse">
                            <path d="M 5 0 L 0 0 0 5" fill="none" stroke="rgba(255, 182, 193, 0.15)" stroke-width="0.3"/>
                          </pattern>
                          <pattern id="grid${lead}" width="25" height="25" patternUnits="userSpaceOnUse">
                            <rect width="25" height="25" fill="url(#smallGrid${lead})" />
                            <path d="M 25 0 L 0 0 0 25" fill="none" stroke="rgba(255, 182, 193, 0.3)" stroke-width="0.5"/>
                          </pattern>
                        </defs>
                        <rect width="250" height="100" fill="url(#grid${lead})" />
                        <path d="${generateECGPath(lead)}" fill="none" stroke="#00ff00" stroke-width="1.5" transform="scale(0.3125, 0.333)"/>
                        <text x="5" y="12" fill="#00ff00" font-size="10" font-family="monospace">${lead}</text>
                      </svg>
                    </div>
                  `).join('')}
                </div>
                
                <!-- Precordial Leads (V1-V6) -->
                <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px;">
                  ${['V1', 'V2', 'V3', 'V4', 'V5', 'V6'].map(lead => `
                    <div style="background: #1a1a1a; border-radius: 4px; padding: 10px;">
                      <svg width="100%" height="100" viewBox="0 0 250 100" style="display: block;">
                        <defs>
                          <pattern id="smallGrid${lead}" width="5" height="5" patternUnits="userSpaceOnUse">
                            <path d="M 5 0 L 0 0 0 5" fill="none" stroke="rgba(255, 182, 193, 0.15)" stroke-width="0.3"/>
                          </pattern>
                          <pattern id="grid${lead}" width="25" height="25" patternUnits="userSpaceOnUse">
                            <rect width="25" height="25" fill="url(#smallGrid${lead})" />
                            <path d="M 25 0 L 0 0 0 25" fill="none" stroke="rgba(255, 182, 193, 0.3)" stroke-width="0.5"/>
                          </pattern>
                        </defs>
                        <rect width="250" height="100" fill="url(#grid${lead})" />
                        <path d="${generateECGPath(lead)}" fill="none" stroke="#00ff00" stroke-width="1.5" transform="scale(0.3125, 0.333)"/>
                        <text x="5" y="12" fill="#00ff00" font-size="10" font-family="monospace">${lead}</text>
                      </svg>
                    </div>
                  `).join('')}
                </div>
                
                <!-- Rhythm Strip (Lead II - Extended) -->
                <div style="margin-top: 15px;">
                  <h4 style="margin: 10px 0 5px 0; color: #374151; font-size: 14px;">Rhythm Strip (Lead II)</h4>
                  <div style="background: #1a1a1a; border-radius: 4px; padding: 10px;">
                    <svg width="100%" height="120" viewBox="0 0 800 120" style="display: block;">
                      <defs>
                        <pattern id="smallGridRhythm" width="5" height="5" patternUnits="userSpaceOnUse">
                          <path d="M 5 0 L 0 0 0 5" fill="none" stroke="rgba(255, 182, 193, 0.15)" stroke-width="0.3"/>
                        </pattern>
                        <pattern id="gridRhythm" width="25" height="25" patternUnits="userSpaceOnUse">
                          <rect width="25" height="25" fill="url(#smallGridRhythm)" />
                          <path d="M 25 0 L 0 0 0 25" fill="none" stroke="rgba(255, 182, 193, 0.3)" stroke-width="0.5"/>
                        </pattern>
                      </defs>
                      <rect width="800" height="120" fill="url(#gridRhythm)" />
                      <path d="${generateECGPath('Lead II')}" fill="none" stroke="#00ff00" stroke-width="2" transform="scale(1, 0.4) translate(0, 75)"/>
                      <text x="10" y="15" fill="#00ff00" font-size="11" font-family="monospace">Lead II - Rhythm</text>
                      <text x="10" y="110" fill="#00ff00" font-size="9" font-family="monospace">25mm/s 10mm/mV</text>
                    </svg>
                  </div>
                </div>
                
                <!-- ECG Speed and Gain Settings -->
                <div style="margin-top: 10px; padding: 10px; background: #f9fafb; border-radius: 4px; font-size: 12px; color: #6b7280;">
                  <strong>Recording Settings:</strong> Paper Speed: 25 mm/s | Gain: 10 mm/mV | Filter: 0.05-150 Hz
                </div>
              </div>
              
              <div class="metrics-grid" style="margin-top: 15px;">
                <div class="metric">
                  <div class="metric-label">Heart Rate</div>
                  <div class="metric-value">${heartRate} <span class="metric-unit">bpm</span></div>
                </div>
                <div class="metric">
                  <div class="metric-label">PR Interval</div>
                  <div class="metric-value">${Math.round(prInterval)} <span class="metric-unit">ms</span></div>
                </div>
                <div class="metric">
                  <div class="metric-label">QRS Duration</div>
                  <div class="metric-value">${Math.round(qrsDuration)} <span class="metric-unit">ms</span></div>
                </div>
                <div class="metric">
                  <div class="metric-label">QT Interval</div>
                  <div class="metric-value">${Math.round(qtInterval)} <span class="metric-unit">ms</span></div>
                </div>
                <div class="metric">
                  <div class="metric-label">QTc Interval</div>
                  <div class="metric-value">${Math.round(qtcInterval)} <span class="metric-unit">ms</span></div>
                </div>
                <div class="metric">
                  <div class="metric-label">RR Interval</div>
                  <div class="metric-value">${Math.round(rrInterval * 1000)} <span class="metric-unit">ms</span></div>
                </div>
                <div class="metric">
                  <div class="metric-label">P Wave Duration</div>
                  <div class="metric-value">${Math.round(pWaveDuration)} <span class="metric-unit">ms</span></div>
                </div>
                <div class="metric">
                  <div class="metric-label">T Wave Duration</div>
                  <div class="metric-value">${Math.round(tWaveDuration)} <span class="metric-unit">ms</span></div>
                </div>
                <div class="metric">
                  <div class="metric-label">T Wave Deflection</div>
                  <div class="metric-value">${tWaveDeflection.toFixed(2)} <span class="metric-unit">mV</span></div>
                </div>
              </div>
              <div style="margin-top: 20px; padding: 15px; background: white; border-radius: 6px;">
                <h4 style="margin-top: 0; color: #374151;">ECG Interpretation</h4>
                <ul style="margin: 10px 0; padding-left: 20px; color: #4b5563;">
                  <li>Rhythm: ${heartRate > 100 ? 'Tachycardia' : heartRate < 60 ? 'Bradycardia' : 'Normal Sinus Rhythm'}</li>
                  <li>Rate: ${heartRate} bpm ${heartRate >= 60 && heartRate <= 100 ? '(Normal)' : '(Abnormal)'}</li>
                  <li>PR Interval: ${Math.round(prInterval)} ms ${prInterval >= 120 && prInterval <= 200 ? '(Normal)' : '(Abnormal)'}</li>
                  <li>QRS Complex: ${Math.round(qrsDuration)} ms ${qrsDuration <= 100 ? '(Normal)' : '(Widened)'}</li>
                  <li>QTc: ${Math.round(qtcInterval)} ms ${qtcInterval <= 440 ? '(Normal)' : '(Prolonged)'}</li>
                  ${vital.hrvSdnn ? `<li>HRV (SDNN): ${vital.hrvSdnn.toFixed(1)} ms ${vital.hrvSdnn > 50 ? '(Good)' : '(Low)'}</li>` : ''}
                </ul>
              </div>
            </div>
          </div>
          ` : ''}

          <!-- Basic Vitals Section -->
          ${(vital.oxygenSaturation !== undefined || vital.bloodPressureSystolic || vital.breathingRate !== undefined || vital.temperature !== undefined || vital.bloodGlucose !== undefined || (vital.bmi !== undefined && vital.bmi !== null)) ? `
          <div class="section">
            <h2>Basic Vital Signs</h2>
            <div class="metrics-grid">
              ${[
                vital.oxygenSaturation !== undefined ? `
                  <div class="metric">
                    <div class="metric-label">Oxygen Saturation</div>
                    <div class="metric-value">${vital.oxygenSaturation}<span class="metric-unit">%</span></div>
                    ${vital.oxygenSaturationConfLevel ? `<div style="font-size: 11px; color: #6b7280;">Confidence: ${vital.oxygenSaturationConfLevel}/3</div>` : ''}
                  </div>
                ` : '',
                vital.bloodPressureSystolic ? `
                  <div class="metric">
                    <div class="metric-label">Blood Pressure</div>
                    <div class="metric-value">${vital.bloodPressureSystolic}/${vital.bloodPressureDiastolic} <span class="metric-unit">mmHg</span></div>
                  </div>
                ` : '',
                vital.breathingRate !== undefined ? `
                  <div class="metric">
                    <div class="metric-label">Breathing Rate</div>
                    <div class="metric-value">${vital.breathingRate} <span class="metric-unit">rpm</span></div>
                  </div>
                ` : '',
                vital.temperature !== undefined ? `
                  <div class="metric">
                    <div class="metric-label">Temperature</div>
                    <div class="metric-value">${vital.temperature}<span class="metric-unit">°C</span></div>
                  </div>
                ` : '',
                vital.bloodGlucose !== undefined ? `
                  <div class="metric">
                    <div class="metric-label">Blood Glucose</div>
                    <div class="metric-value">${vital.bloodGlucose} <span class="metric-unit">mg/dL</span></div>
                  </div>
                ` : '',
                vital.bmi !== undefined && vital.bmi !== null ? `
                  <div class="metric">
                    <div class="metric-label">BMI</div>
                    <div class="metric-value">${vital.bmi.toFixed(1)}</div>
                  </div>
                ` : ''
              ].filter(Boolean).join('')}
            </div>
          </div>
          ` : ''}

          <!-- Cardiovascular Metrics -->
          ${(vital.cardiacWorkload !== undefined || vital.pulsePressure !== undefined || vital.meanArterialPressure !== undefined) ? `
          <div class="section">
            <h2>Cardiovascular Metrics</h2>
            <div class="metrics-grid">
              ${[
                vital.cardiacWorkload !== undefined && vital.cardiacWorkload !== null ? `
                  <div class="metric">
                    <div class="metric-label">Cardiac Workload</div>
                    <div class="metric-value">${vital.cardiacWorkload.toFixed(2)}</div>
                  </div>
                ` : '',
                vital.pulsePressure !== undefined && vital.pulsePressure !== null ? `
                  <div class="metric">
                    <div class="metric-label">Pulse Pressure</div>
                    <div class="metric-value">${vital.pulsePressure.toFixed(1)} <span class="metric-unit">mmHg</span></div>
                  </div>
                ` : '',
                vital.meanArterialPressure !== undefined && vital.meanArterialPressure !== null ? `
                  <div class="metric">
                    <div class="metric-label">Mean Arterial Pressure</div>
                    <div class="metric-value">${vital.meanArterialPressure.toFixed(1)} <span class="metric-unit">mmHg</span></div>
                  </div>
                ` : ''
              ].filter(Boolean).join('')}
            </div>
          </div>
          ` : ''}

          <!-- Stress & HRV Analysis -->
          ${(vital.hrvSdnn || vital.stressLevel !== undefined || vital.pnsIndex || vital.snsIndex || vital.wellnessIndex || vital.wellnessLevel || vital.mspMatch || vital.meanRri || vital.rmssd || vital.sd1 || vital.sd2 || vital.lfHf) ? `
            <div class="section">
              <h2>Stress & HRV Analysis</h2>
              <div class="metrics-grid">
                ${[
                  vital.stressLevel !== undefined && vital.stressLevel !== null ? `
                    <div class="metric">
                      <div class="metric-label">Stress Level</div>
                      <div class="metric-value">${
                        typeof vital.stressLevel === 'number'
                          ? (vital.stressLevel * 100).toFixed(0) + '%'
                          : vital.stressLevel
                      }</div>
                    </div>
                  ` : '',
                  vital.hrvSdnn !== undefined && vital.hrvSdnn !== null ? `
                    <div class="metric">
                      <div class="metric-label">HRV SDNN</div>
                      <div class="metric-value">${vital.hrvSdnn.toFixed(1)} <span class="metric-unit">ms</span></div>
                    </div>
                  ` : '',
                  vital.rmssd !== undefined && vital.rmssd !== null ? `
                    <div class="metric">
                      <div class="metric-label">RMSSD</div>
                      <div class="metric-value">${vital.rmssd.toFixed(1)} <span class="metric-unit">ms</span></div>
                    </div>
                  ` : '',
                  vital.meanRri !== undefined && vital.meanRri !== null ? `
                    <div class="metric">
                      <div class="metric-label">Mean RRI</div>
                      <div class="metric-value">${vital.meanRri.toFixed(1)} <span class="metric-unit">ms</span></div>
                    </div>
                  ` : '',
                  vital.sd1 !== undefined && vital.sd1 !== null ? `
                    <div class="metric">
                      <div class="metric-label">SD1</div>
                      <div class="metric-value">${vital.sd1.toFixed(2)}</div>
                    </div>
                  ` : '',
                  vital.sd2 !== undefined && vital.sd2 !== null ? `
                    <div class="metric">
                      <div class="metric-label">SD2</div>
                      <div class="metric-value">${vital.sd2.toFixed(2)}</div>
                    </div>
                  ` : '',
                  vital.lfHf !== undefined && vital.lfHf !== null ? `
                    <div class="metric">
                      <div class="metric-label">LF/HF Ratio</div>
                      <div class="metric-value">${vital.lfHf.toFixed(2)}</div>
                    </div>
                  ` : '',
                  vital.pnsIndex !== undefined && vital.pnsIndex !== null ? `
                    <div class="metric">
                      <div class="metric-label">PNS Index</div>
                      <div class="metric-value">${vital.pnsIndex.toFixed(2)} ${vital.pnsZone ? `<span class="wellness-badge">${vital.pnsZone}</span>` : ''}</div>
                    </div>
                  ` : '',
                  vital.snsIndex !== undefined && vital.snsIndex !== null ? `
                    <div class="metric">
                      <div class="metric-label">SNS Index</div>
                      <div class="metric-value">${vital.snsIndex.toFixed(2)} ${vital.snsZone ? `<span class="wellness-badge">${vital.snsZone}</span>` : ''}</div>
                    </div>
                  ` : '',
                  vital.wellnessIndex !== undefined && vital.wellnessIndex !== null ? `
                    <div class="metric">
                      <div class="metric-label">Wellness Index</div>
                      <div class="metric-value">${vital.wellnessIndex.toFixed(1)}</div>
                    </div>
                  ` : '',
                  vital.wellnessLevel ? `
                    <div class="metric">
                      <div class="metric-label">Wellness Level</div>
                      <div class="metric-value"><span class="wellness-badge">${vital.wellnessLevel}</span></div>
                    </div>
                  ` : '',
                  vital.mspMatch !== undefined && vital.mspMatch !== null ? `
                    <div class="metric">
                      <div class="metric-label">MSP Match</div>
                      <div class="metric-value">${(vital.mspMatch * 100).toFixed(0)}<span class="metric-unit">%</span></div>
                    </div>
                  ` : ''
                ].filter(Boolean).join('')}
              </div>
            </div>
          ` : ''}

          <!-- Blood Metrics -->
          ${(vital.hemoglobin || vital.hemoglobinA1c || vital.hba1c) ? `
            <div class="section">
              <h2>Blood Metrics</h2>
              <div class="blood-metrics">
                <div class="metrics-grid">
                  ${vital.hemoglobin !== undefined ? `
                    <div class="metric" style="background: white;">
                      <div class="metric-label">Hemoglobin</div>
                      <div class="metric-value">${vital.hemoglobin} <span class="metric-unit">g/dL</span></div>
                    </div>
                  ` : ''}
                  ${vital.hemoglobinA1c !== undefined ? `
                    <div class="metric" style="background: white;">
                      <div class="metric-label">Hemoglobin A1c</div>
                      <div class="metric-value">${vital.hemoglobinA1c}<span class="metric-unit">%</span></div>
                    </div>
                  ` : ''}
                  ${vital.hba1c !== undefined ? `
                    <div class="metric" style="background: white;">
                      <div class="metric-label">HbA1c</div>
                      <div class="metric-value">${vital.hba1c}<span class="metric-unit">%</span></div>
                    </div>
                  ` : ''}
                </div>
              </div>
            </div>
          ` : ''}

          <!-- Risk Assessment -->
          ${(vital.diabeticRisk || vital.hypertensionRisk || vital.heartAttackRisk || vital.strokeRisk || vital.asthmaRisk || vital.alzheimersRisk || vital.ASCVDRiskLevel || vital.ascvdRisk || vital.highFastingGlucoseRisk || vital.highTotalCholesterolRisk || vital.lowHemoglobinRisk || vital.heartAge) ? `
            <div class="section">
              <h2>Health Risk Assessment</h2>
              ${[
                vital.diabeticRisk ? `
                  <div class="risk-assessment risk-${vital.diabeticRisk.toLowerCase()}">
                    <strong>Diabetic Risk</strong>
                    <span>${vital.diabeticRisk.toUpperCase()}${vital.diabeticRiskProbability ? ` (${(vital.diabeticRiskProbability * 100).toFixed(1)}%)` : ''}</span>
                  </div>
                ` : '',
                vital.hypertensionRisk ? `
                  <div class="risk-assessment risk-${vital.hypertensionRisk.toLowerCase()}">
                    <strong>Hypertension Risk</strong>
                    <span>${vital.hypertensionRisk.toUpperCase()}${vital.hypertensionRiskProbability ? ` (${(vital.hypertensionRiskProbability * 100).toFixed(1)}%)` : ''}</span>
                  </div>
                ` : '',
                vital.ASCVDRiskLevel ? `
                  <div class="risk-assessment risk-${vital.ASCVDRiskLevel.toLowerCase()}">
                    <strong>ASCVD Risk Level</strong>
                    <span>${vital.ASCVDRiskLevel.toUpperCase()}</span>
                  </div>
                ` : '',
                vital.ascvdRisk ? `
                  <div class="risk-assessment risk-${vital.ascvdRisk.toLowerCase()}">
                    <strong>ASCVD Risk</strong>
                    <span>${vital.ascvdRisk.toUpperCase()}</span>
                  </div>
                ` : '',
                vital.highFastingGlucoseRisk ? `
                  <div class="risk-assessment risk-${vital.highFastingGlucoseRisk.toLowerCase()}">
                    <strong>High Fasting Glucose Risk</strong>
                    <span>${vital.highFastingGlucoseRisk.toUpperCase()}</span>
                  </div>
                ` : '',
                vital.highTotalCholesterolRisk ? `
                  <div class="risk-assessment risk-${vital.highTotalCholesterolRisk.toLowerCase()}">
                    <strong>High Cholesterol Risk</strong>
                    <span>${vital.highTotalCholesterolRisk.toUpperCase()}</span>
                  </div>
                ` : '',
                vital.lowHemoglobinRisk ? `
                  <div class="risk-assessment risk-${vital.lowHemoglobinRisk.toLowerCase()}">
                    <strong>Low Hemoglobin Risk</strong>
                    <span>${vital.lowHemoglobinRisk.toUpperCase()}</span>
                  </div>
                ` : '',
                vital.heartAge ? `
                  <div class="risk-assessment" style="background: #f3f4f6;">
                    <strong>Heart Age</strong>
                    <span>${vital.heartAge} years</span>
                  </div>
                ` : '',
                vital.heartAttackRisk ? `
                  <div class="risk-assessment risk-${vital.heartAttackRisk.toLowerCase()}">
                    <strong>Heart Attack Risk</strong>
                    <span>${vital.heartAttackRisk.toUpperCase()}${vital.heartAttackRiskProbability ? ` (${(vital.heartAttackRiskProbability * 100).toFixed(1)}%)` : ''}</span>
                  </div>
                ` : '',
                vital.strokeRisk ? `
                  <div class="risk-assessment risk-${vital.strokeRisk.toLowerCase()}">
                    <strong>Stroke Risk</strong>
                    <span>${vital.strokeRisk.toUpperCase()}${vital.strokeRiskProbability ? ` (${(vital.strokeRiskProbability * 100).toFixed(1)}%)` : ''}</span>
                  </div>
                ` : '',
                vital.asthmaRisk ? `
                  <div class="risk-assessment risk-${vital.asthmaRisk.toLowerCase()}">
                    <strong>Asthma Risk</strong>
                    <span>${vital.asthmaRisk.toUpperCase()}</span>
                  </div>
                ` : '',
                vital.alzheimersRisk ? `
                  <div class="risk-assessment risk-${vital.alzheimersRisk.toLowerCase()}">
                    <strong>Alzheimer's Risk</strong>
                    <span>${vital.alzheimersRisk.toUpperCase()}</span>
                  </div>
                ` : ''
              ].filter(Boolean).join('')}
            </div>
          ` : ''}

          <!-- Additional Information -->
          ${vital.symptoms ? `
            <div class="section">
              <h2>Symptoms</h2>
              <p style="padding: 15px; background: #fef3c7; border-radius: 6px; border-left: 4px solid #fbbf24;">
                ${vital.symptoms}
              </p>
            </div>
          ` : ''}

          <div class="footer">
            <p><strong>Important Notice:</strong> This report is generated for informational purposes only and should not be used as a substitute for professional medical advice.</p>
            <p>Please consult with a qualified healthcare professional for proper medical diagnosis and treatment.</p>
            <p style="margin-top: 15px;">© ${new Date().getFullYear()} Health Monitoring System | Generated with Advanced AI Analysis</p>
          </div>
          </div>
        </body>
      </html>
    `;

    // Write the content and print
    printWindow.document.write(printContent);
    printWindow.document.close();
    
    // Wait for content to load then print
    printWindow.onload = () => {
      printWindow.print();
    };
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
                  {!isBriahScanAdmin && <TableHead>Name</TableHead>}
                  {!isBriahScanAdmin && <TableHead>Phone</TableHead>}
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
                    <TableCell colSpan={isBriahScanAdmin ? 9 : 11} className="text-center py-8">
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
                        {!isBriahScanAdmin && (
                          <TableCell>
                            {vital.name || '-'}
                          </TableCell>
                        )}
                        {!isBriahScanAdmin && (
                          <TableCell>
                            {vital.phoneNumber || '-'}
                          </TableCell>
                        )}
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
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setSelectedVital(vital)}
                              className="flex items-center gap-1"
                            >
                              <Eye className="h-4 w-4" />
                              View
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handlePrint(vital)}
                              className="flex items-center gap-1"
                            >
                              <Printer className="h-4 w-4" />
                              Print
                            </Button>
                          </div>
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
                <div className="flex items-center gap-3">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handlePrint(selectedVital)}
                    className="flex items-center gap-2"
                  >
                    <Printer className="h-4 w-4" />
                    Print Report
                  </Button>
                  <Badge variant={selectedVital.source === 'device' ? 'secondary' : 'outline'} className="text-lg px-3 py-1">
                    {selectedVital.source}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* ECG Analysis */}
              <ECGChart vital={selectedVital} />

              {/* Patient Information */}
              {(selectedVital.name || selectedVital.phoneNumber || selectedVital.notes) && (
                <div>
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Patient Information
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {selectedVital.name && (
                      <div className="p-3 border rounded-lg">
                        <p className="text-xs text-muted-foreground">Name</p>
                        <p className="text-lg font-semibold">{selectedVital.name}</p>
                      </div>
                    )}
                    {selectedVital.phoneNumber && (
                      <div className="p-3 border rounded-lg">
                        <p className="text-xs text-muted-foreground">Phone Number</p>
                        <p className="text-lg font-semibold">{selectedVital.phoneNumber}</p>
                      </div>
                    )}
                    {selectedVital.notes && (
                      <div className="p-3 border rounded-lg">
                        <p className="text-xs text-muted-foreground">Notes/DOB</p>
                        <p className="text-lg font-semibold">{selectedVital.notes}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Basic Vitals with Confidence Levels */}
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Basic Vitals
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {selectedVital.heartRate !== undefined && selectedVital.heartRate !== null && (
                    <div className="p-3 border rounded-lg">
                      <p className="text-xs text-muted-foreground">Heart Rate</p>
                      <p className="text-xl font-bold">{selectedVital.heartRate} bpm</p>
                      {selectedVital.heartRateConfLevel !== undefined && selectedVital.heartRateConfLevel !== null && (
                        <p className="text-xs text-green-600">Confidence: {selectedVital.heartRateConfLevel}/3</p>
                      )}
                    </div>
                  )}
                  {selectedVital.oxygenSaturation !== undefined && selectedVital.oxygenSaturation !== null && (
                    <div className="p-3 border rounded-lg">
                      <p className="text-xs text-muted-foreground">Oxygen Saturation</p>
                      <p className="text-xl font-bold">{selectedVital.oxygenSaturation}%</p>
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
                  {selectedVital.breathingRate !== undefined && selectedVital.breathingRate !== null && (
                    <div className="p-3 border rounded-lg">
                      <p className="text-xs text-muted-foreground">Breathing Rate</p>
                      <p className="text-xl font-bold">{selectedVital.breathingRate} rpm</p>
                      {selectedVital.breathingRateConfLevel !== undefined && selectedVital.breathingRateConfLevel !== null && (
                        <p className="text-xs text-green-600">Confidence: {selectedVital.breathingRateConfLevel}/3</p>
                      )}
                    </div>
                  )}
                  {selectedVital.respiration !== undefined && selectedVital.respiration !== null && (
                    <div className="p-3 border rounded-lg">
                      <p className="text-xs text-muted-foreground">Respiration</p>
                      <p className="text-xl font-bold">{selectedVital.respiration}</p>
                    </div>
                  )}
                  {selectedVital.prq !== undefined && selectedVital.prq !== null && (
                    <div className="p-3 border rounded-lg">
                      <p className="text-xs text-muted-foreground">PRQ (Pulse Rate Quality)</p>
                      <p className="text-xl font-bold">{selectedVital.prq}</p>
                      {selectedVital.prqConfLevel !== undefined && selectedVital.prqConfLevel !== null && (
                        <p className="text-xs text-green-600">Confidence: {selectedVital.prqConfLevel}/3</p>
                      )}
                    </div>
                  )}
                  {selectedVital.temperature !== undefined && selectedVital.temperature !== null && (
                    <div className="p-3 border rounded-lg">
                      <p className="text-xs text-muted-foreground">Temperature</p>
                      <p className="text-xl font-bold">{selectedVital.temperature}°C</p>
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
                  {selectedVital.stressLevel !== undefined && selectedVital.stressLevel !== null && (
                    <div className="p-3 border rounded-lg">
                      <p className="text-xs text-muted-foreground">Stress Level</p>
                      <p className="text-xl font-bold">
                        {typeof selectedVital.stressLevel === 'number' 
                          ? `${(selectedVital.stressLevel * 100).toFixed(0)}%` 
                          : selectedVital.stressLevel}
                      </p>
                    </div>
                  )}
                  {selectedVital.stressResponse && (
                    <div className="p-3 border rounded-lg">
                      <p className="text-xs text-muted-foreground">Stress Response</p>
                      <p className="text-xl font-bold">{selectedVital.stressResponse}</p>
                    </div>
                  )}
                  {selectedVital.recoveryAbility && (
                    <div className="p-3 border rounded-lg">
                      <p className="text-xs text-muted-foreground">Recovery Ability</p>
                      <p className="text-xl font-bold">{selectedVital.recoveryAbility}</p>
                    </div>
                  )}
                  {selectedVital.hrvSdnn !== undefined && selectedVital.hrvSdnn !== null && (
                    <div className="p-3 border rounded-lg">
                      <p className="text-xs text-muted-foreground">HRV SDNN</p>
                      <p className="text-xl font-bold">{selectedVital.hrvSdnn.toFixed(1)}ms</p>
                      {selectedVital.hrvSdnnConfLevel !== undefined && selectedVital.hrvSdnnConfLevel !== null && (
                        <p className="text-xs text-green-600">Confidence: {selectedVital.hrvSdnnConfLevel}/3</p>
                      )}
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
                  {selectedVital.rmssd !== undefined && selectedVital.rmssd !== null && (
                    <div className="p-3 border rounded-lg">
                      <p className="text-xs text-muted-foreground">RMSSD</p>
                      <p className="text-xl font-bold">{selectedVital.rmssd.toFixed(1)}ms</p>
                    </div>
                  )}
                  {selectedVital.sd1 !== undefined && selectedVital.sd1 !== null && (
                    <div className="p-3 border rounded-lg">
                      <p className="text-xs text-muted-foreground">SD1</p>
                      <p className="text-xl font-bold">{selectedVital.sd1.toFixed(1)}ms</p>
                    </div>
                  )}
                  {selectedVital.sd2 !== undefined && selectedVital.sd2 !== null && (
                    <div className="p-3 border rounded-lg">
                      <p className="text-xs text-muted-foreground">SD2</p>
                      <p className="text-xl font-bold">{selectedVital.sd2.toFixed(1)}ms</p>
                    </div>
                  )}
                  {selectedVital.meanRri !== undefined && selectedVital.meanRri !== null && (
                    <div className="p-3 border rounded-lg">
                      <p className="text-xs text-muted-foreground">Mean RRI</p>
                      <p className="text-xl font-bold">{selectedVital.meanRri.toFixed(0)}ms</p>
                    </div>
                  )}
                  {selectedVital.lfHf !== undefined && selectedVital.lfHf !== null && (
                    <div className="p-3 border rounded-lg">
                      <p className="text-xs text-muted-foreground">LF/HF Ratio</p>
                      <p className="text-xl font-bold">{selectedVital.lfHf.toFixed(3)}</p>
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
                  {selectedVital.highFastingGlucoseRisk && (
                    <div className="p-3 border rounded-lg flex justify-between items-center">
                      <div>
                        <p className="text-xs text-muted-foreground">High Fasting Glucose Risk</p>
                        <p className={`font-semibold ${
                          selectedVital.highFastingGlucoseRisk === '3' || selectedVital.highFastingGlucoseRisk === 'HIGH' 
                            ? 'text-red-600' 
                            : selectedVital.highFastingGlucoseRisk === '2' || selectedVital.highFastingGlucoseRisk === 'MEDIUM' 
                              ? 'text-yellow-600' 
                              : 'text-green-600'
                        }`}>
                          {selectedVital.highFastingGlucoseRisk === '3' ? 'HIGH' : 
                           selectedVital.highFastingGlucoseRisk === '2' ? 'MEDIUM' :
                           selectedVital.highFastingGlucoseRisk === '1' ? 'LOW' :
                           selectedVital.highFastingGlucoseRisk}
                        </p>
                      </div>
                    </div>
                  )}
                  {selectedVital.highTotalCholesterolRisk && (
                    <div className="p-3 border rounded-lg flex justify-between items-center">
                      <div>
                        <p className="text-xs text-muted-foreground">High Total Cholesterol Risk</p>
                        <p className={`font-semibold ${
                          selectedVital.highTotalCholesterolRisk === '3' || selectedVital.highTotalCholesterolRisk === 'HIGH' 
                            ? 'text-red-600' 
                            : selectedVital.highTotalCholesterolRisk === '2' || selectedVital.highTotalCholesterolRisk === 'MEDIUM' 
                              ? 'text-yellow-600' 
                              : 'text-green-600'
                        }`}>
                          {selectedVital.highTotalCholesterolRisk === '3' ? 'HIGH' : 
                           selectedVital.highTotalCholesterolRisk === '2' ? 'MEDIUM' :
                           selectedVital.highTotalCholesterolRisk === '1' ? 'LOW' :
                           selectedVital.highTotalCholesterolRisk}
                        </p>
                      </div>
                    </div>
                  )}
                  {selectedVital.lowHemoglobinRisk && (
                    <div className="p-3 border rounded-lg flex justify-between items-center">
                      <div>
                        <p className="text-xs text-muted-foreground">Low Hemoglobin Risk</p>
                        <p className={`font-semibold ${
                          selectedVital.lowHemoglobinRisk === '3' || selectedVital.lowHemoglobinRisk === 'HIGH' 
                            ? 'text-red-600' 
                            : selectedVital.lowHemoglobinRisk === '2' || selectedVital.lowHemoglobinRisk === 'MEDIUM' 
                              ? 'text-yellow-600' 
                              : 'text-green-600'
                        }`}>
                          {selectedVital.lowHemoglobinRisk === '3' ? 'HIGH' : 
                           selectedVital.lowHemoglobinRisk === '2' ? 'MEDIUM' :
                           selectedVital.lowHemoglobinRisk === '1' ? 'LOW' :
                           selectedVital.lowHemoglobinRisk}
                        </p>
                      </div>
                    </div>
                  )}
                  {selectedVital.ascvdRisk && (
                    <div className="p-3 border rounded-lg">
                      <p className="text-xs text-muted-foreground">ASCVD Risk</p>
                      <p className={`font-semibold ${getRiskColor(selectedVital.ascvdRisk)}`}>
                        {selectedVital.ascvdRisk}
                      </p>
                    </div>
                  )}
                  {selectedVital.heartAge && (
                    <div className="p-3 border rounded-lg">
                      <p className="text-xs text-muted-foreground">Heart Age</p>
                      <p className="font-semibold text-lg">
                        {selectedVital.heartAge}
                      </p>
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
                      <p className="text-xs text-muted-foreground">Alzheimer's Risk</p>
                      <p className={`font-semibold ${getRiskColor(selectedVital.alzheimersRisk)}`}>
                        {selectedVital.alzheimersRisk}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Blood Metrics */}
              {(selectedVital.hemoglobin || selectedVital.hba1c || selectedVital.bloodGlucose) && (
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
                        <p className="text-xl font-bold">{selectedVital.hba1c.toFixed(2)}%</p>
                      </div>
                    )}
                    {selectedVital.bloodGlucose !== undefined && selectedVital.bloodGlucose !== null && (
                      <div className="p-3 border rounded-lg">
                        <p className="text-xs text-muted-foreground">Blood Glucose</p>
                        <p className="text-xl font-bold">{selectedVital.bloodGlucose} mg/dL</p>
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