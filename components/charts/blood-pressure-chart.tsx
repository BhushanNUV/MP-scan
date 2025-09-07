'use client';

import { useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
  ReferenceArea,
  Brush,
  Dot
} from 'recharts';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Info, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';

interface BloodPressureData {
  date: string;
  systolic: number;
  diastolic: number;
  pulse?: number;
}

interface BloodPressureChartProps {
  data: BloodPressureData[];
  title?: string;
  showPulse?: boolean;
  height?: number;
}

// Blood pressure categories (American Heart Association)
const BP_RANGES = {
  normal: { systolic: { min: 0, max: 120 }, diastolic: { min: 0, max: 80 }, color: '#10B981', label: 'Normal' },
  elevated: { systolic: { min: 120, max: 130 }, diastolic: { min: 80, max: 80 }, color: '#F59E0B', label: 'Elevated' },
  high1: { systolic: { min: 130, max: 140 }, diastolic: { min: 80, max: 90 }, color: '#FB923C', label: 'High Stage 1' },
  high2: { systolic: { min: 140, max: 180 }, diastolic: { min: 90, max: 120 }, color: '#EF4444', label: 'High Stage 2' },
  crisis: { systolic: { min: 180, max: 250 }, diastolic: { min: 120, max: 200 }, color: '#991B1B', label: 'Crisis' }
};

export function BloodPressureChart({ 
  data, 
  title = 'Blood Pressure Trend',
  showPulse = false,
  height = 400 
}: BloodPressureChartProps) {
  const [zoomLevel, setZoomLevel] = useState(1);
  const [selectedPoint, setSelectedPoint] = useState<number | null>(null);

  const handleZoomIn = () => setZoomLevel(prev => Math.min(prev * 1.2, 3));
  const handleZoomOut = () => setZoomLevel(prev => Math.max(prev / 1.2, 0.5));
  const handleReset = () => setZoomLevel(1);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const systolic = payload.find((p: any) => p.dataKey === 'systolic')?.value;
      const diastolic = payload.find((p: any) => p.dataKey === 'diastolic')?.value;
      const pulse = payload.find((p: any) => p.dataKey === 'pulse')?.value;
      
      // Determine BP category
      let category = 'Unknown';
      let categoryColor = '#666';
      
      if (systolic && diastolic) {
        if (systolic < 120 && diastolic < 80) {
          category = 'Normal';
          categoryColor = BP_RANGES.normal.color;
        } else if (systolic >= 120 && systolic < 130 && diastolic < 80) {
          category = 'Elevated';
          categoryColor = BP_RANGES.elevated.color;
        } else if (systolic >= 130 && systolic < 140 || diastolic >= 80 && diastolic < 90) {
          category = 'High Stage 1';
          categoryColor = BP_RANGES.high1.color;
        } else if (systolic >= 140 && systolic < 180 || diastolic >= 90 && diastolic < 120) {
          category = 'High Stage 2';
          categoryColor = BP_RANGES.high2.color;
        } else if (systolic >= 180 || diastolic >= 120) {
          category = 'Hypertensive Crisis';
          categoryColor = BP_RANGES.crisis.color;
        }
      }

      return (
        <div className="bg-background/95 backdrop-blur-sm border rounded-lg p-3 shadow-lg">
          <p className="font-medium mb-2">{label}</p>
          <div className="space-y-1 text-sm">
            <div className="flex items-center justify-between gap-4">
              <span className="text-muted-foreground">Systolic:</span>
              <span className="font-medium text-red-600">{systolic} mmHg</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-muted-foreground">Diastolic:</span>
              <span className="font-medium text-blue-600">{diastolic} mmHg</span>
            </div>
            {pulse && (
              <div className="flex items-center justify-between gap-4">
                <span className="text-muted-foreground">Pulse:</span>
                <span className="font-medium text-purple-600">{pulse} bpm</span>
              </div>
            )}
            <div className="pt-2 mt-2 border-t">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Status:</span>
                <span className="font-medium" style={{ color: categoryColor }}>
                  {category}
                </span>
              </div>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  const CustomDot = (props: any) => {
    const { cx, cy, payload, dataKey } = props;
    
    // Highlight abnormal readings
    let fill = dataKey === 'systolic' ? '#EF4444' : '#3B82F6';
    if (dataKey === 'systolic' && payload.systolic >= 140) {
      fill = '#991B1B';
    } else if (dataKey === 'diastolic' && payload.diastolic >= 90) {
      fill = '#7C2D12';
    }

    return (
      <Dot
        cx={cx}
        cy={cy}
        r={selectedPoint === payload.index ? 6 : 4}
        fill={fill}
        strokeWidth={2}
        stroke="#fff"
        onClick={() => setSelectedPoint(payload.index)}
        style={{ cursor: 'pointer' }}
      />
    );
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold">{title}</h3>
          <div className="group relative">
            <Info className="h-4 w-4 text-muted-foreground cursor-help" />
            <div className="absolute bottom-full left-0 mb-2 hidden group-hover:block z-10">
              <div className="bg-background/95 backdrop-blur-sm border rounded-lg p-3 shadow-lg w-64">
                <p className="text-xs font-medium mb-2">Blood Pressure Ranges:</p>
                <div className="space-y-1 text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded" style={{ backgroundColor: BP_RANGES.normal.color }} />
                    <span>Normal: &lt;120/80</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded" style={{ backgroundColor: BP_RANGES.elevated.color }} />
                    <span>Elevated: 120-129/&lt;80</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded" style={{ backgroundColor: BP_RANGES.high1.color }} />
                    <span>Stage 1: 130-139/80-89</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded" style={{ backgroundColor: BP_RANGES.high2.color }} />
                    <span>Stage 2: ≥140/≥90</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={handleZoomIn}
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={handleZoomOut}
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={handleReset}
          >
            <Maximize2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={height}>
        <LineChart
          data={data}
          margin={{ top: 5, right: 30, left: 20, bottom: 60 }}
        >
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          
          {/* Reference areas for BP zones */}
          <ReferenceArea y1={0} y2={120} fill={BP_RANGES.normal.color} fillOpacity={0.1} />
          <ReferenceArea y1={120} y2={130} fill={BP_RANGES.elevated.color} fillOpacity={0.1} />
          <ReferenceArea y1={130} y2={140} fill={BP_RANGES.high1.color} fillOpacity={0.1} />
          <ReferenceArea y1={140} y2={180} fill={BP_RANGES.high2.color} fillOpacity={0.1} />
          
          {/* Reference lines for key thresholds */}
          <ReferenceLine 
            y={120} 
            stroke={BP_RANGES.elevated.color} 
            strokeDasharray="5 5" 
            label={{ value: "Elevated", position: "right", fill: BP_RANGES.elevated.color, fontSize: 12 }}
          />
          <ReferenceLine 
            y={140} 
            stroke={BP_RANGES.high2.color} 
            strokeDasharray="5 5" 
            label={{ value: "High", position: "right", fill: BP_RANGES.high2.color, fontSize: 12 }}
          />
          
          <XAxis 
            dataKey="date" 
            angle={-45}
            textAnchor="end"
            height={100}
            tick={{ fontSize: 12 }}
            scale={`linear`}
            domain={[0, 'dataMax']}
          />
          <YAxis 
            domain={[40, 200]}
            ticks={[60, 80, 100, 120, 140, 160, 180]}
            tick={{ fontSize: 12 }}
            label={{ value: 'mmHg', angle: -90, position: 'insideLeft' }}
          />
          
          <Tooltip content={<CustomTooltip />} />
          <Legend 
            verticalAlign="top" 
            height={36}
            iconType="line"
          />
          
          <Line
            type="monotone"
            dataKey="systolic"
            stroke="#EF4444"
            strokeWidth={2.5}
            dot={<CustomDot />}
            activeDot={{ r: 8 }}
            name="Systolic"
            animationDuration={1000}
          />
          <Line
            type="monotone"
            dataKey="diastolic"
            stroke="#3B82F6"
            strokeWidth={2.5}
            dot={<CustomDot />}
            activeDot={{ r: 8 }}
            name="Diastolic"
            animationDuration={1200}
          />
          
          {showPulse && (
            <Line
              type="monotone"
              dataKey="pulse"
              stroke="#8B5CF6"
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={{ r: 3 }}
              activeDot={{ r: 6 }}
              name="Pulse"
              animationDuration={1400}
            />
          )}
          
          {/* Brush for zooming */}
          <Brush
            dataKey="date"
            height={30}
            stroke="#8884d8"
            fill="#f0f0f0"
            travellerWidth={10}
          />
        </LineChart>
      </ResponsiveContainer>
    </Card>
  );
}