'use client';

import { useState } from 'react';
import {
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
  ReferenceArea,
  Cell
} from 'recharts';
import { Card } from '@/components/ui/card';
import { Thermometer, Wind, AlertTriangle, CheckCircle } from 'lucide-react';

interface VitalData {
  date: string;
  temperature?: number;
  oxygenSaturation?: number;
  respiratoryRate?: number;
}

interface TemperatureOxygenChartProps {
  data: VitalData[];
  title?: string;
  height?: number;
}

const TEMP_RANGES = {
  hypothermia: { min: 0, max: 35, color: '#3B82F6', label: 'Hypothermia' },
  normal: { min: 36.5, max: 37.5, color: '#10B981', label: 'Normal' },
  fever: { min: 37.5, max: 39, color: '#F59E0B', label: 'Fever' },
  highFever: { min: 39, max: 50, color: '#EF4444', label: 'High Fever' }
};

const O2_RANGES = {
  critical: { min: 0, max: 90, color: '#991B1B', label: 'Critical' },
  low: { min: 90, max: 95, color: '#EF4444', label: 'Low' },
  normal: { min: 95, max: 100, color: '#10B981', label: 'Normal' }
};

export function TemperatureOxygenChart({ 
  data, 
  title = 'Temperature & Oxygen Levels',
  height = 400 
}: TemperatureOxygenChartProps) {
  const [activeMetric, setActiveMetric] = useState<'both' | 'temperature' | 'oxygen'>('both');

  const getTemperatureColor = (temp: number) => {
    if (temp < 36.5) return TEMP_RANGES.hypothermia.color;
    if (temp >= 36.5 && temp <= 37.5) return TEMP_RANGES.normal.color;
    if (temp > 37.5 && temp <= 39) return TEMP_RANGES.fever.color;
    return TEMP_RANGES.highFever.color;
  };

  const getOxygenColor = (o2: number) => {
    if (o2 < 90) return O2_RANGES.critical.color;
    if (o2 >= 90 && o2 < 95) return O2_RANGES.low.color;
    return O2_RANGES.normal.color;
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const temp = payload.find((p: any) => p.dataKey === 'temperature')?.value;
      const o2 = payload.find((p: any) => p.dataKey === 'oxygenSaturation')?.value;
      const resp = payload.find((p: any) => p.dataKey === 'respiratoryRate')?.value;

      return (
        <div className="bg-background/95 backdrop-blur-sm border rounded-lg p-3 shadow-lg">
          <p className="font-medium mb-2">{label}</p>
          <div className="space-y-2">
            {temp && (
              <div className="flex items-center gap-2">
                <Thermometer className="h-4 w-4" style={{ color: getTemperatureColor(temp) }} />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Temperature:</span>
                    <span className="font-medium" style={{ color: getTemperatureColor(temp) }}>
                      {temp}°C
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {temp < 36.5 && 'Below normal'}
                    {temp >= 36.5 && temp <= 37.5 && 'Normal'}
                    {temp > 37.5 && temp <= 39 && 'Fever'}
                    {temp > 39 && 'High fever'}
                  </div>
                </div>
              </div>
            )}
            {o2 && (
              <div className="flex items-center gap-2">
                <Wind className="h-4 w-4" style={{ color: getOxygenColor(o2) }} />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">O2 Saturation:</span>
                    <span className="font-medium" style={{ color: getOxygenColor(o2) }}>
                      {o2}%
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {o2 < 90 && 'Critical - Seek medical attention'}
                    {o2 >= 90 && o2 < 95 && 'Below normal'}
                    {o2 >= 95 && 'Normal'}
                  </div>
                </div>
              </div>
            )}
            {resp && (
              <div className="flex items-center gap-2">
                <Wind className="h-4 w-4 text-blue-600" />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Respiratory Rate:</span>
                    <span className="font-medium">{resp} /min</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  const CustomBar = (props: any) => {
    const { fill, x, y, width, height, payload } = props;
    const o2 = payload.oxygenSaturation;
    const barColor = getOxygenColor(o2);

    return (
      <g>
        <rect
          x={x}
          y={y}
          width={width}
          height={height}
          fill={barColor}
          fillOpacity={0.6}
          rx={4}
        />
        {o2 < 90 && (
          <AlertTriangle
            x={x + width/2 - 8}
            y={y - 20}
            className="h-4 w-4"
            fill="#EF4444"
          />
        )}
      </g>
    );
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">{title}</h3>
        <div className="flex gap-2">
          <button
            onClick={() => setActiveMetric('both')}
            className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
              activeMetric === 'both' 
                ? 'bg-primary text-primary-foreground' 
                : 'bg-muted hover:bg-muted/80'
            }`}
          >
            Both
          </button>
          <button
            onClick={() => setActiveMetric('temperature')}
            className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
              activeMetric === 'temperature' 
                ? 'bg-orange-100 text-orange-700 dark:bg-orange-950/20' 
                : 'bg-muted hover:bg-muted/80'
            }`}
          >
            <Thermometer className="h-4 w-4 inline mr-1" />
            Temp
          </button>
          <button
            onClick={() => setActiveMetric('oxygen')}
            className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
              activeMetric === 'oxygen' 
                ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/20' 
                : 'bg-muted hover:bg-muted/80'
            }`}
          >
            <Wind className="h-4 w-4 inline mr-1" />
            O2
          </button>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={height}>
        <ComposedChart
          data={data}
          margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
        >
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          
          {/* Reference areas for temperature */}
          {(activeMetric === 'both' || activeMetric === 'temperature') && (
            <>
              <ReferenceArea y1={36.5} y2={37.5} fill={TEMP_RANGES.normal.color} fillOpacity={0.1} />
              <ReferenceLine 
                y={37.5} 
                stroke={TEMP_RANGES.fever.color} 
                strokeDasharray="5 5"
                yAxisId="temp"
              />
              <ReferenceLine 
                y={36.5} 
                stroke={TEMP_RANGES.normal.color} 
                strokeDasharray="5 5"
                yAxisId="temp"
              />
            </>
          )}
          
          {/* Reference lines for oxygen */}
          {(activeMetric === 'both' || activeMetric === 'oxygen') && (
            <>
              <ReferenceLine 
                y={95} 
                stroke={O2_RANGES.normal.color} 
                strokeDasharray="5 5"
                yAxisId="o2"
              />
              <ReferenceLine 
                y={90} 
                stroke={O2_RANGES.critical.color} 
                strokeDasharray="5 5"
                yAxisId="o2"
              />
            </>
          )}
          
          <XAxis 
            dataKey="date" 
            angle={-45}
            textAnchor="end"
            height={100}
            tick={{ fontSize: 12 }}
          />
          
          {(activeMetric === 'both' || activeMetric === 'temperature') && (
            <YAxis 
              yAxisId="temp"
              domain={[35, 40]}
              ticks={[35, 36, 37, 38, 39, 40]}
              tick={{ fontSize: 12 }}
              label={{ value: '°C', angle: -90, position: 'insideLeft' }}
            />
          )}
          
          {(activeMetric === 'both' || activeMetric === 'oxygen') && (
            <YAxis 
              yAxisId="o2"
              orientation="right"
              domain={[80, 100]}
              ticks={[80, 85, 90, 95, 100]}
              tick={{ fontSize: 12 }}
              label={{ value: 'SpO2 %', angle: 90, position: 'insideRight' }}
            />
          )}
          
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          
          {(activeMetric === 'both' || activeMetric === 'oxygen') && (
            <Bar
              yAxisId="o2"
              dataKey="oxygenSaturation"
              name="O2 Saturation"
              shape={<CustomBar />}
            />
          )}
          
          {(activeMetric === 'both' || activeMetric === 'temperature') && (
            <Line
              yAxisId="temp"
              type="monotone"
              dataKey="temperature"
              stroke="#F97316"
              strokeWidth={2.5}
              dot={{ r: 4 }}
              activeDot={{ r: 8 }}
              name="Temperature"
            />
          )}
        </ComposedChart>
      </ResponsiveContainer>

      {/* Status indicators */}
      <div className="grid grid-cols-2 gap-4 mt-4">
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">Temperature Ranges</p>
          <div className="space-y-1">
            {Object.entries(TEMP_RANGES).map(([key, range]) => (
              <div key={key} className="flex items-center gap-2 text-xs">
                <div 
                  className="w-3 h-3 rounded"
                  style={{ backgroundColor: range.color }}
                />
                <span>{range.label}</span>
                {key === 'normal' && <CheckCircle className="h-3 w-3 text-green-600" />}
              </div>
            ))}
          </div>
        </div>
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">O2 Saturation Ranges</p>
          <div className="space-y-1">
            {Object.entries(O2_RANGES).map(([key, range]) => (
              <div key={key} className="flex items-center gap-2 text-xs">
                <div 
                  className="w-3 h-3 rounded"
                  style={{ backgroundColor: range.color }}
                />
                <span>{range.label}: {range.min}-{range.max}%</span>
                {key === 'critical' && <AlertTriangle className="h-3 w-3 text-red-600" />}
                {key === 'normal' && <CheckCircle className="h-3 w-3 text-green-600" />}
              </div>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
}