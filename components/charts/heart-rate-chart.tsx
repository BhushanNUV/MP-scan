'use client';

import { useState } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
  ReferenceArea,
  Brush
} from 'recharts';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Heart, TrendingUp, TrendingDown, Activity, Info } from 'lucide-react';

interface HeartRateData {
  date: string;
  heartRate: number;
  minRate?: number;
  maxRate?: number;
  variability?: number;
}

interface HeartRateChartProps {
  data: HeartRateData[];
  title?: string;
  showVariability?: boolean;
  height?: number;
}

const HR_ZONES = {
  resting: { min: 40, max: 60, color: '#3B82F6', label: 'Resting' },
  normal: { min: 60, max: 100, color: '#10B981', label: 'Normal' },
  elevated: { min: 100, max: 120, color: '#F59E0B', label: 'Elevated' },
  high: { min: 120, max: 160, color: '#EF4444', label: 'High' },
  maximum: { min: 160, max: 220, color: '#991B1B', label: 'Maximum' }
};

export function HeartRateChart({ 
  data, 
  title = 'Heart Rate Variability',
  showVariability = true,
  height = 400 
}: HeartRateChartProps) {
  const [selectedZone, setSelectedZone] = useState<string | null>(null);
  
  // Calculate HRV statistics
  const calculateHRV = () => {
    if (!data || data.length === 0) return null;
    
    const rates = data.map(d => d.heartRate).filter(Boolean);
    const mean = rates.reduce((a, b) => a + b, 0) / rates.length;
    const variance = rates.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / rates.length;
    const stdDev = Math.sqrt(variance);
    
    return {
      mean: mean.toFixed(1),
      stdDev: stdDev.toFixed(1),
      min: Math.min(...rates),
      max: Math.max(...rates),
      trend: rates[rates.length - 1] > rates[0] ? 'up' : 'down'
    };
  };

  const hrv = calculateHRV();

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const heartRate = payload.find((p: any) => p.dataKey === 'heartRate')?.value;
      const variability = payload.find((p: any) => p.dataKey === 'variability')?.value;
      
      // Determine HR zone
      let zone = 'Unknown';
      let zoneColor = '#666';
      
      if (heartRate) {
        if (heartRate < 60) {
          zone = 'Resting';
          zoneColor = HR_ZONES.resting.color;
        } else if (heartRate >= 60 && heartRate < 100) {
          zone = 'Normal';
          zoneColor = HR_ZONES.normal.color;
        } else if (heartRate >= 100 && heartRate < 120) {
          zone = 'Elevated';
          zoneColor = HR_ZONES.elevated.color;
        } else if (heartRate >= 120 && heartRate < 160) {
          zone = 'High';
          zoneColor = HR_ZONES.high.color;
        } else {
          zone = 'Maximum';
          zoneColor = HR_ZONES.maximum.color;
        }
      }

      return (
        <div className="bg-background/95 backdrop-blur-sm border rounded-lg p-3 shadow-lg">
          <p className="font-medium mb-2">{label}</p>
          <div className="space-y-1 text-sm">
            <div className="flex items-center justify-between gap-4">
              <span className="text-muted-foreground">Heart Rate:</span>
              <span className="font-medium" style={{ color: zoneColor }}>
                {heartRate} bpm
              </span>
            </div>
            {variability && (
              <div className="flex items-center justify-between gap-4">
                <span className="text-muted-foreground">Variability:</span>
                <span className="font-medium">{variability} ms</span>
              </div>
            )}
            <div className="pt-2 mt-2 border-t">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Zone:</span>
                <span className="font-medium" style={{ color: zoneColor }}>
                  {zone}
                </span>
              </div>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-red-100 dark:bg-red-950/20">
            <Heart className="h-5 w-5 text-red-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">{title}</h3>
            {hrv && (
              <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                <span>Avg: {hrv.mean} bpm</span>
                <span>Range: {hrv.min}-{hrv.max}</span>
                <span className="flex items-center gap-1">
                  Trend:
                  {hrv.trend === 'up' ? (
                    <TrendingUp className="h-3 w-3 text-red-600" />
                  ) : (
                    <TrendingDown className="h-3 w-3 text-green-600" />
                  )}
                </span>
              </div>
            )}
          </div>
        </div>
        <div className="group relative">
          <Info className="h-4 w-4 text-muted-foreground cursor-help" />
          <div className="absolute bottom-full right-0 mb-2 hidden group-hover:block z-10">
            <div className="bg-background/95 backdrop-blur-sm border rounded-lg p-3 shadow-lg w-64">
              <p className="text-xs font-medium mb-2">Heart Rate Zones:</p>
              <div className="space-y-1 text-xs">
                {Object.entries(HR_ZONES).map(([key, zone]) => (
                  <div key={key} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded" style={{ backgroundColor: zone.color }} />
                    <span>{zone.label}: {zone.min}-{zone.max} bpm</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={height}>
        <AreaChart
          data={data}
          margin={{ top: 10, right: 30, left: 0, bottom: 60 }}
        >
          <defs>
            <linearGradient id="colorHeartRate" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#EF4444" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#EF4444" stopOpacity={0.1}/>
            </linearGradient>
            <linearGradient id="colorVariability" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0.1}/>
            </linearGradient>
          </defs>
          
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          
          {/* Reference areas for HR zones */}
          <ReferenceArea y1={40} y2={60} fill={HR_ZONES.resting.color} fillOpacity={0.1} />
          <ReferenceArea y1={60} y2={100} fill={HR_ZONES.normal.color} fillOpacity={0.1} />
          <ReferenceArea y1={100} y2={120} fill={HR_ZONES.elevated.color} fillOpacity={0.1} />
          <ReferenceArea y1={120} y2={160} fill={HR_ZONES.high.color} fillOpacity={0.1} />
          
          {/* Reference lines */}
          <ReferenceLine 
            y={60} 
            stroke={HR_ZONES.resting.color} 
            strokeDasharray="3 3" 
            strokeOpacity={0.5}
          />
          <ReferenceLine 
            y={100} 
            stroke={HR_ZONES.elevated.color} 
            strokeDasharray="3 3"
            strokeOpacity={0.5}
          />
          
          <XAxis 
            dataKey="date" 
            angle={-45}
            textAnchor="end"
            height={100}
            tick={{ fontSize: 12 }}
          />
          <YAxis 
            domain={[40, 180]}
            ticks={[40, 60, 80, 100, 120, 140, 160, 180]}
            tick={{ fontSize: 12 }}
            label={{ value: 'BPM', angle: -90, position: 'insideLeft' }}
          />
          
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          
          <Area
            type="monotone"
            dataKey="heartRate"
            stroke="#EF4444"
            strokeWidth={2}
            fill="url(#colorHeartRate)"
            name="Heart Rate"
            animationDuration={1000}
          />
          
          {showVariability && (
            <Area
              type="monotone"
              dataKey="variability"
              stroke="#8B5CF6"
              strokeWidth={2}
              fill="url(#colorVariability)"
              name="HRV (ms)"
              yAxisId="right"
              animationDuration={1200}
            />
          )}
          
          <Brush
            dataKey="date"
            height={30}
            stroke="#8884d8"
            fill="#f0f0f0"
          />
        </AreaChart>
      </ResponsiveContainer>

      {/* Zone indicators */}
      <div className="flex flex-wrap gap-2 mt-4">
        {Object.entries(HR_ZONES).map(([key, zone]) => (
          <button
            key={key}
            onClick={() => setSelectedZone(selectedZone === key ? null : key)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
              selectedZone === key 
                ? 'ring-2 ring-offset-2' 
                : 'opacity-70 hover:opacity-100'
            }`}
            style={{ 
              backgroundColor: `${zone.color}20`,
              color: zone.color,
              borderColor: zone.color,
              borderWidth: '1px',
              borderStyle: 'solid'
            }}
          >
            {zone.label}: {zone.min}-{zone.max}
          </button>
        ))}
      </div>
    </Card>
  );
}