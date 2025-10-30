import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, handleApiError } from '@/lib/auth-helpers';

// GET /api/health-vitals/analytics - Get aggregated data for charts
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    const searchParams = request.nextUrl.searchParams;
    
    // Time period parameter (7d, 30d, 90d, 1y)
    const period = searchParams.get('period') || '30d';
    const metric = searchParams.get('metric'); // Optional: specific metric to analyze
    
    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    
    switch (period) {
      case '7d':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(startDate.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(startDate.getDate() - 90);
        break;
      case '1y':
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
      default:
        startDate.setDate(startDate.getDate() - 30);
    }
    
    // Get user's patient profile
    const dbUser = await prisma.user.findUnique({
      where: { email: user.email! },
      include: { patients: true },
    });
    
    if (!dbUser || !dbUser.patients[0]) {
      return NextResponse.json({
        data: {
          summary: {},
          trends: [],
          distributions: {},
        },
        message: 'No patient profile found',
      });
    }
    
    const patientId = dbUser.patients[0].id;
    
    // Get all vitals in the date range
    const vitals = await prisma.vitals.findMany({
      where: {
        patientId,
        recordedAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { recordedAt: 'asc' },
    });
    
    if (vitals.length === 0) {
      return NextResponse.json({
        data: {
          summary: {},
          trends: [],
          distributions: {},
        },
        message: 'No vitals data available for the selected period',
      });
    }
    
    // Calculate summary statistics
    const summary = calculateSummaryStats(vitals);
    
    // Generate trend data for charts
    const trends = generateTrendData(vitals, period);
    
    // Calculate distributions
    const distributions = calculateDistributions(vitals);
    
    // Calculate correlations
    const correlations = calculateCorrelations(vitals);
    
    // Health score calculation
    const healthScore = calculateHealthScore(vitals[vitals.length - 1]);
    
    // Activity metrics
    const activityMetrics = calculateActivityMetrics(vitals);
    
    return NextResponse.json({
      data: {
        summary,
        trends,
        distributions,
        correlations,
        healthScore,
        activityMetrics,
        period,
        totalRecords: vitals.length,
        dateRange: {
          start: startDate.toISOString(),
          end: endDate.toISOString(),
        },
      },
    });
  } catch (error) {
    return handleApiError(error as { message?: string; name?: string; code?: string; errors?: unknown[] });
  }
}

// Calculate summary statistics
function calculateSummaryStats(vitals: any[]) {
  const metrics = [
    'bloodPressureSystolic',
    'bloodPressureDiastolic',
    'heartRate',
    'respiratoryRate',
    'temperature',
    'oxygenSaturation',
    'bloodGlucose',
    'cholesterolTotal',
    'bmi',
    'stepsCount',
    'caloriesBurned',
    'sleepHours',
  ];
  
  const summary: any = {};
  
  metrics.forEach((metric) => {
    const values = vitals
      .map((v) => v[metric])
      .filter((v) => v !== null && v !== undefined);
    
    if (values.length > 0) {
      summary[metric] = {
        current: values[values.length - 1],
        average: values.reduce((a, b) => a + b, 0) / values.length,
        min: Math.min(...values),
        max: Math.max(...values),
        count: values.length,
        trend: calculateTrend(values),
      };
    }
  });
  
  return summary;
}

// Generate trend data for charts
function generateTrendData(vitals: any[], period: string) {
  const groupBy = period === '7d' ? 'day' : period === '30d' ? 'day' : 'week';
  
  const trends: any = {
    bloodPressure: [],
    heartRate: [],
    oxygenSaturation: [],
    bloodGlucose: [],
    weight: [],
    activity: [],
  };
  
  vitals.forEach((vital) => {
    const date = vital.recordedAt.toISOString().split('T')[0];
    
    if (vital.bloodPressureSystolic && vital.bloodPressureDiastolic) {
      trends.bloodPressure.push({
        date,
        systolic: vital.bloodPressureSystolic,
        diastolic: vital.bloodPressureDiastolic,
      });
    }
    
    if (vital.heartRate) {
      trends.heartRate.push({
        date,
        value: vital.heartRate,
      });
    }
    
    if (vital.oxygenSaturation) {
      trends.oxygenSaturation.push({
        date,
        value: vital.oxygenSaturation,
      });
    }
    
    if (vital.bloodGlucose) {
      trends.bloodGlucose.push({
        date,
        value: vital.bloodGlucose,
      });
    }
    
    if (vital.stepsCount || vital.caloriesBurned) {
      trends.activity.push({
        date,
        steps: vital.stepsCount || 0,
        calories: vital.caloriesBurned || 0,
      });
    }
  });
  
  return trends;
}

// Calculate distributions for visualization
function calculateDistributions(vitals: any[]) {
  const distributions: any = {};
  
  // Blood pressure distribution
  const bpValues = vitals
    .filter((v) => v.bloodPressureSystolic)
    .map((v) => v.bloodPressureSystolic);
  
  if (bpValues.length > 0) {
    distributions.bloodPressure = {
      normal: bpValues.filter((v) => v < 120).length,
      elevated: bpValues.filter((v) => v >= 120 && v < 130).length,
      high1: bpValues.filter((v) => v >= 130 && v < 140).length,
      high2: bpValues.filter((v) => v >= 140).length,
    };
  }
  
  // Heart rate zones
  const hrValues = vitals
    .filter((v) => v.heartRate)
    .map((v) => v.heartRate);
  
  if (hrValues.length > 0) {
    distributions.heartRateZones = {
      resting: hrValues.filter((v) => v < 60).length,
      normal: hrValues.filter((v) => v >= 60 && v < 100).length,
      elevated: hrValues.filter((v) => v >= 100 && v < 140).length,
      high: hrValues.filter((v) => v >= 140).length,
    };
  }
  
  // Sleep quality distribution
  const sleepQuality = vitals
    .filter((v) => v.sleepQuality)
    .map((v) => v.sleepQuality);
  
  if (sleepQuality.length > 0) {
    distributions.sleepQuality = {
      poor: sleepQuality.filter((v) => v === 'Poor').length,
      fair: sleepQuality.filter((v) => v === 'Fair').length,
      good: sleepQuality.filter((v) => v === 'Good').length,
      excellent: sleepQuality.filter((v) => v === 'Excellent').length,
    };
  }
  
  return distributions;
}

// Calculate correlations between metrics
function calculateCorrelations(vitals: any[]) {
  const correlations: any = {};
  
  // Correlation between blood pressure and heart rate
  const bpHrData = vitals.filter(
    (v) => v.bloodPressureSystolic && v.heartRate
  );
  
  if (bpHrData.length > 5) {
    correlations.bloodPressureHeartRate = calculatePearsonCorrelation(
      bpHrData.map((v) => v.bloodPressureSystolic),
      bpHrData.map((v) => v.heartRate)
    );
  }
  
  // Correlation between activity and sleep
  const activitySleepData = vitals.filter(
    (v) => v.stepsCount && v.sleepHours
  );
  
  if (activitySleepData.length > 5) {
    correlations.activitySleep = calculatePearsonCorrelation(
      activitySleepData.map((v) => v.stepsCount),
      activitySleepData.map((v) => v.sleepHours)
    );
  }
  
  return correlations;
}

// Calculate Pearson correlation coefficient
function calculatePearsonCorrelation(x: number[], y: number[]): number {
  const n = x.length;
  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = y.reduce((a, b) => a + b, 0);
  const sumXY = x.reduce((total, xi, i) => total + xi * y[i], 0);
  const sumX2 = x.reduce((total, xi) => total + xi * xi, 0);
  const sumY2 = y.reduce((total, yi) => total + yi * yi, 0);
  
  const numerator = n * sumXY - sumX * sumY;
  const denominator = Math.sqrt(
    (n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY)
  );
  
  return denominator === 0 ? 0 : numerator / denominator;
}

// Calculate overall health score
function calculateHealthScore(latestVitals: any): number {
  if (!latestVitals) return 0;
  
  let score = 100;
  
  // Blood pressure scoring
  if (latestVitals.bloodPressureSystolic) {
    if (latestVitals.bloodPressureSystolic > 140) score -= 15;
    else if (latestVitals.bloodPressureSystolic > 130) score -= 10;
    else if (latestVitals.bloodPressureSystolic > 120) score -= 5;
  }
  
  // Heart rate scoring
  if (latestVitals.heartRate) {
    if (latestVitals.heartRate > 100 || latestVitals.heartRate < 60) score -= 10;
  }
  
  // Oxygen saturation scoring
  if (latestVitals.oxygenSaturation) {
    if (latestVitals.oxygenSaturation < 95) score -= 15;
    else if (latestVitals.oxygenSaturation < 98) score -= 5;
  }
  
  // BMI scoring
  if (latestVitals.bmi) {
    if (latestVitals.bmi > 30 || latestVitals.bmi < 18.5) score -= 10;
    else if (latestVitals.bmi > 25) score -= 5;
  }
  
  // Blood glucose scoring
  if (latestVitals.bloodGlucose) {
    if (latestVitals.bloodGlucose > 140) score -= 10;
    else if (latestVitals.bloodGlucose > 100) score -= 5;
  }
  
  return Math.max(0, score);
}

// Calculate activity metrics
function calculateActivityMetrics(vitals: any[]) {
  const activityData = vitals.filter((v) => v.stepsCount || v.caloriesBurned);
  
  if (activityData.length === 0) {
    return {
      totalSteps: 0,
      totalCalories: 0,
      averageDailySteps: 0,
      averageDailyCalories: 0,
      mostActiveDay: null,
    };
  }
  
  const totalSteps = activityData.reduce((sum, v) => sum + (v.stepsCount || 0), 0);
  const totalCalories = activityData.reduce((sum, v) => sum + (v.caloriesBurned || 0), 0);
  
  const daysWithActivity = new Set(
    activityData.map((v) => v.recordedAt.toISOString().split('T')[0])
  ).size;
  
  return {
    totalSteps,
    totalCalories,
    averageDailySteps: Math.round(totalSteps / daysWithActivity),
    averageDailyCalories: Math.round(totalCalories / daysWithActivity),
    daysWithActivity,
  };
}

// Calculate trend direction
function calculateTrend(values: number[]): string {
  if (values.length < 2) return 'stable';
  
  const recentAvg = values.slice(-3).reduce((a, b) => a + b, 0) / Math.min(3, values.length);
  const previousAvg = values.slice(0, 3).reduce((a, b) => a + b, 0) / Math.min(3, values.length);
  
  const change = ((recentAvg - previousAvg) / previousAvg) * 100;
  
  if (change > 5) return 'increasing';
  if (change < -5) return 'decreasing';
  return 'stable';
}