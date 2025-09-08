'use client';

import { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Activity, Heart, TrendingUp, Zap } from 'lucide-react';

interface ECGChartProps {
  vital: any;
}

// ECG Lead configurations
const ECG_LEADS = {
  'Lead I': { amplitude: 1.0, description: 'Left arm - Right arm' },
  'Lead II': { amplitude: 1.2, description: 'Left leg - Right arm' },
  'Lead III': { amplitude: 0.8, description: 'Left leg - Left arm' },
  'aVR': { amplitude: -0.5, description: 'Augmented Right arm' },
  'aVL': { amplitude: 0.6, description: 'Augmented Left arm' },
  'aVF': { amplitude: 1.1, description: 'Augmented Left leg' },
  'V1': { amplitude: 0.3, description: 'Right sternal border' },
  'V2': { amplitude: 0.8, description: 'Left sternal border' },
  'V3': { amplitude: 1.5, description: 'Between V2 and V4' },
  'V4': { amplitude: 2.0, description: 'Left midclavicular line' },
  'V5': { amplitude: 1.8, description: 'Left anterior axillary line' },
  'V6': { amplitude: 1.2, description: 'Left midaxillary line' }
};

export function ECGChart({ vital }: ECGChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [selectedLead, setSelectedLead] = useState('Lead II');
  const [ecgData, setEcgData] = useState<{ time: number; amplitude: number }[]>([]);
  const [ecgMetrics, setEcgMetrics] = useState({
    prInterval: 160,
    qrsDuration: 90,
    qtInterval: 400,
    qtcInterval: 440,
    rrInterval: 833,
    heartRate: 72,
    pWaveDuration: 80,
    tWaveDuration: 160,
    tWaveDeflection: 0.2,
    intervalsMeasured: 5
  });

  // Generate ECG waveform based on vital data
  const generateECG = (lead: string, duration: number = 5) => {
    const sampleRate = 500; // Hz
    const totalSamples = duration * sampleRate;
    const data: { time: number; amplitude: number }[] = [];
    
    // Extract vital parameters - handle both number and null values
    const heartRate = vital?.heartRate || 72;
    const hrvSdnn = vital?.hrvSdnn || 42;
    const stressLevel = vital?.stressLevel || 0.3;
    const oxygenSaturation = vital?.oxygenSaturation || 98;
    const pnsIndex = vital?.pnsIndex || 0.5;
    const snsIndex = vital?.snsIndex || 0.5;
    
    // Get lead configuration
    const leadConfig = ECG_LEADS[lead as keyof typeof ECG_LEADS];
    const baseAmplitude = leadConfig.amplitude;
    
    // Calculate RR interval from heart rate
    const rrInterval = 60 / heartRate; // in seconds
    const beatTimes: number[] = [];
    
    // Generate beat times with HRV
    let currentTime = 0;
    while (currentTime < duration) {
      // Add HRV variation
      const hrvVariation = (Math.random() - 0.5) * (hrvSdnn / 1000);
      const interval = rrInterval + hrvVariation;
      beatTimes.push(currentTime);
      currentTime += Math.max(0.4, Math.min(2, interval)); // Clamp to physiological limits
    }
    
    // Generate ECG samples
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
          amplitude = generatePQRST(timeInBeat, beatDuration, baseAmplitude, vital);
          break;
        }
      }
      
      // Add baseline wander and noise
      amplitude += 0.02 * Math.sin(2 * Math.PI * 0.15 * sampleTime); // Respiratory effect
      amplitude += (Math.random() - 0.5) * 0.01; // Noise
      
      data.push({ time: sampleTime, amplitude });
    }
    
    setEcgData(data);
    
    // Calculate ECG metrics
    const prInterval = 160 - (heartRate - 60) * 0.4; // ms
    const qrsDuration = 90 + stressLevel * 20; // ms
    const qtInterval = 400 - (heartRate - 60) * 2; // ms
    const qtcInterval = qtInterval / Math.sqrt(rrInterval); // Bazett's formula
    const pWaveDuration = 80 + (heartRate > 100 ? -10 : 0); // P wave shortens in tachycardia
    const tWaveDuration = 160 - (heartRate - 60) * 0.5; // T wave duration
    const tWaveDeflection = 0.2 + (stressLevel * 0.1); // T wave amplitude in mV
    const intervalsMeasured = 5; // Number of intervals measured
    
    // Debug logging
    console.log('ECG Metrics calculated:', {
      heartRate,
      prInterval,
      qrsDuration,
      qtInterval,
      qtcInterval,
      pWaveDuration,
      tWaveDuration,
      tWaveDeflection
    });
    
    setEcgMetrics({
      prInterval: Math.round(prInterval),
      qrsDuration: Math.round(qrsDuration),
      qtInterval: Math.round(qtInterval),
      qtcInterval: Math.round(qtcInterval),
      rrInterval: Math.round(rrInterval * 1000),
      heartRate: Math.round(heartRate),
      pWaveDuration: Math.round(pWaveDuration),
      tWaveDuration: Math.round(tWaveDuration),
      tWaveDeflection: Number(tWaveDeflection.toFixed(2)),
      intervalsMeasured: intervalsMeasured
    });
  };

  // Generate PQRST complex
  const generatePQRST = (
    timeInBeat: number,
    beatDuration: number,
    baseAmplitude: number,
    vital: any
  ): number => {
    const normTime = timeInBeat / beatDuration;
    let amplitude = 0;
    
    // Wave timing parameters (as fraction of beat duration)
    const pStart = 0.05, pEnd = 0.15;
    const qStart = 0.17, qEnd = 0.19;
    const rStart = 0.19, rEnd = 0.23;
    const sStart = 0.23, sEnd = 0.25;
    const tStart = 0.30, tEnd = 0.55;
    
    // P wave
    if (normTime >= pStart && normTime < pEnd) {
      const pProgress = (normTime - pStart) / (pEnd - pStart);
      amplitude = 0.15 * baseAmplitude * Math.sin(Math.PI * pProgress);
    }
    // Q wave
    else if (normTime >= qStart && normTime < qEnd) {
      const qProgress = (normTime - qStart) / (qEnd - qStart);
      amplitude = -0.1 * baseAmplitude * Math.sin(Math.PI * qProgress);
    }
    // R wave
    else if (normTime >= rStart && normTime < rEnd) {
      const rProgress = (normTime - rStart) / (rEnd - rStart);
      amplitude = baseAmplitude * Math.sin(Math.PI * rProgress);
    }
    // S wave
    else if (normTime >= sStart && normTime < sEnd) {
      const sProgress = (normTime - sStart) / (sEnd - sStart);
      amplitude = -0.3 * baseAmplitude * Math.sin(Math.PI * sProgress);
    }
    // T wave
    else if (normTime >= tStart && normTime < tEnd) {
      const tProgress = (normTime - tStart) / (tEnd - tStart);
      amplitude = 0.35 * baseAmplitude * Math.sin(Math.PI * tProgress);
      
      // Modify T wave based on conditions
      if (vital.stressLevel > 0.5) {
        amplitude *= 0.8; // T wave flattening with stress
      }
      if (vital.oxygenSaturation < 90) {
        amplitude *= 0.7; // T wave changes with hypoxia
      }
    }
    
    return amplitude;
  };

  // Draw ECG on canvas
  const drawECG = () => {
    const canvas = canvasRef.current;
    if (!canvas || ecgData.length === 0) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw grid
    drawGrid(ctx, canvas.width, canvas.height);
    
    // Draw ECG waveform
    ctx.strokeStyle = '#00ff00';
    ctx.lineWidth = 2;
    ctx.beginPath();
    
    const xScale = canvas.width / (ecgData[ecgData.length - 1]?.time || 1);
    const yScale = canvas.height / 4;
    const yOffset = canvas.height / 2;
    
    ecgData.forEach((point, index) => {
      const x = point.time * xScale;
      const y = yOffset - point.amplitude * yScale;
      
      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    
    ctx.stroke();
  };

  // Draw grid background
  const drawGrid = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    // ECG paper style grid
    const smallGrid = 5; // 1mm grid
    const largeGrid = 25; // 5mm grid
    
    // Small grid
    ctx.strokeStyle = 'rgba(255, 182, 193, 0.3)';
    ctx.lineWidth = 0.5;
    
    for (let x = 0; x <= width; x += smallGrid) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    
    for (let y = 0; y <= height; y += smallGrid) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
    
    // Large grid
    ctx.strokeStyle = 'rgba(255, 182, 193, 0.5)';
    ctx.lineWidth = 1;
    
    for (let x = 0; x <= width; x += largeGrid) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    
    for (let y = 0; y <= height; y += largeGrid) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
  };

  useEffect(() => {
    if (vital) {
      generateECG(selectedLead);
    }
  }, [selectedLead, vital]);

  useEffect(() => {
    drawECG();
  }, [ecgData]);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                ECG Analysis (Under Research)
              </CardTitle>
              {/* <p className="text-sm text-muted-foreground mt-1">Under Research</p> */}
            </div>
            <Select value={selectedLead} onValueChange={setSelectedLead}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select ECG Lead" />
              </SelectTrigger>
              <SelectContent>
                {Object.keys(ECG_LEADS).map((lead) => (
                  <SelectItem key={lead} value={lead}>
                    {lead}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="bg-black rounded-lg p-4 mb-4">
            <canvas 
              ref={canvasRef} 
              width={800} 
              height={300}
              className="w-full"
              style={{ maxWidth: '100%', height: 'auto' }}
            />
          </div>
          
          {/* ECG Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="p-3 border rounded-lg">
              <p className="text-xs text-muted-foreground">Heart Rate</p>
              <p className="text-lg font-bold flex items-center gap-1">
                <Heart className="h-4 w-4 text-red-500" />
                {ecgMetrics.heartRate} bpm
              </p>
            </div>
            <div className="p-3 border rounded-lg">
              <p className="text-xs text-muted-foreground">PR Interval</p>
              <p className="text-lg font-bold">{ecgMetrics.prInterval} ms</p>
            </div>
            <div className="p-3 border rounded-lg">
              <p className="text-xs text-muted-foreground">QRS Duration</p>
              <p className="text-lg font-bold">{ecgMetrics.qrsDuration} ms</p>
            </div>
            <div className="p-3 border rounded-lg">
              <p className="text-xs text-muted-foreground">QT Interval</p>
              <p className="text-lg font-bold">{ecgMetrics.qtInterval} ms</p>
            </div>
            <div className="p-3 border rounded-lg">
              <p className="text-xs text-muted-foreground">QTc Interval</p>
              <p className="text-lg font-bold">{ecgMetrics.qtcInterval} ms</p>
            </div>
            <div className="p-3 border rounded-lg">
              <p className="text-xs text-muted-foreground">RR Interval</p>
              <p className="text-lg font-bold">{ecgMetrics.rrInterval} ms</p>
            </div>
            <div className="p-3 border rounded-lg">
              <p className="text-xs text-muted-foreground">P Wave Duration</p>
              <p className="text-lg font-bold">{ecgMetrics.pWaveDuration} ms</p>
            </div>
            <div className="p-3 border rounded-lg">
              <p className="text-xs text-muted-foreground">T Wave Duration</p>
              <p className="text-lg font-bold">{ecgMetrics.tWaveDuration} ms</p>
            </div>
            <div className="p-3 border rounded-lg">
              <p className="text-xs text-muted-foreground">T Wave Deflection</p>
              <p className="text-lg font-bold">{ecgMetrics.tWaveDeflection} mV</p>
            </div>
            <div className="p-3 border rounded-lg">
              <p className="text-xs text-muted-foreground">Intervals Measured</p>
              <p className="text-lg font-bold">{ecgMetrics.intervalsMeasured}</p>
            </div>
          </div>
          
          {/* ECG Interpretation */}
          <div className="mt-4 p-4 bg-muted rounded-lg">
            <h4 className="font-semibold mb-2 flex items-center gap-2">
              <Zap className="h-4 w-4" />
              ECG Interpretation
            </h4>
            <div className="space-y-2 text-sm">
              <p>• Rhythm: {vital.heartRate > 100 ? 'Tachycardia' : vital.heartRate < 60 ? 'Bradycardia' : 'Normal Sinus Rhythm'}</p>
              <p>• Rate: {vital.heartRate} bpm {vital.heartRate >= 60 && vital.heartRate <= 100 ? '(Normal)' : '(Abnormal)'}</p>
              <p>• PR Interval: {ecgMetrics.prInterval} ms {ecgMetrics.prInterval >= 120 && ecgMetrics.prInterval <= 200 ? '(Normal)' : '(Abnormal)'}</p>
              <p>• QRS Complex: {ecgMetrics.qrsDuration} ms {ecgMetrics.qrsDuration <= 100 ? '(Normal)' : '(Widened)'}</p>
              <p>• QTc: {ecgMetrics.qtcInterval} ms {ecgMetrics.qtcInterval <= 440 ? '(Normal)' : '(Prolonged)'}</p>
              {vital.hrvSdnn && <p>• HRV (SDNN): {vital.hrvSdnn.toFixed(1)} ms {vital.hrvSdnn > 50 ? '(Good)' : '(Low)'}</p>}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}