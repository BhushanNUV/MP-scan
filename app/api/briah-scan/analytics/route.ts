import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    // Get all BriahScan records
    const allScans = await prisma.briahScan.findMany({
      orderBy: { recordedAt: 'desc' },
    });

    const totalScans = allScans.length;

    // Calculate date ranges
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    // Count scans by time period
    const scansToday = allScans.filter(s => new Date(s.recordedAt) >= todayStart).length;
    const scansThisWeek = allScans.filter(s => new Date(s.recordedAt) >= weekStart).length;
    const scansThisMonth = allScans.filter(s => new Date(s.recordedAt) >= monthStart).length;

    // Calculate averages for key vitals
    const scansWithData = allScans.filter(s =>
      s.heartRate || s.bloodPressureSystolic || s.oxygenSaturation || s.temperature
    );

    const calculateAverage = (field: keyof typeof allScans[0]) => {
      const values = allScans
        .map(s => s[field])
        .filter((v): v is number => typeof v === 'number');
      return values.length > 0
        ? Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10) / 10
        : null;
    };

    const averages = {
      heartRate: calculateAverage('heartRate'),
      bloodPressureSystolic: calculateAverage('bloodPressureSystolic'),
      bloodPressureDiastolic: calculateAverage('bloodPressureDiastolic'),
      oxygenSaturation: calculateAverage('oxygenSaturation'),
      temperature: calculateAverage('temperature'),
      bloodGlucose: calculateAverage('bloodGlucose'),
      stressLevel: calculateAverage('stressLevel'),
      bmi: calculateAverage('bmi'),
    };

    // Count by source
    const sourceCount = allScans.reduce((acc, scan) => {
      const source = scan.source || 'unknown';
      acc[source] = (acc[source] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Risk assessment distribution
    const riskDistribution = {
      diabetic: {} as Record<string, number>,
      hypertension: {} as Record<string, number>,
    };

    allScans.forEach(scan => {
      if (scan.diabeticRisk) {
        riskDistribution.diabetic[scan.diabeticRisk] =
          (riskDistribution.diabetic[scan.diabeticRisk] || 0) + 1;
      }
      if (scan.hypertensionRisk) {
        riskDistribution.hypertension[scan.hypertensionRisk] =
          (riskDistribution.hypertension[scan.hypertensionRisk] || 0) + 1;
      }
    });

    // Latest scan
    const latestScan = allScans[0] || null;

    // Calculate health score (simple average based on available vitals)
    let healthScore = 75; // Default
    if (latestScan) {
      let scoreSum = 0;
      let scoreCount = 0;

      if (latestScan.heartRate) {
        const hrScore = latestScan.heartRate >= 60 && latestScan.heartRate <= 100 ? 100 : 70;
        scoreSum += hrScore;
        scoreCount++;
      }
      if (latestScan.bloodPressureSystolic) {
        const bpScore = latestScan.bloodPressureSystolic >= 90 && latestScan.bloodPressureSystolic <= 120 ? 100 : 70;
        scoreSum += bpScore;
        scoreCount++;
      }
      if (latestScan.oxygenSaturation) {
        const o2Score = latestScan.oxygenSaturation >= 95 ? 100 : 70;
        scoreSum += o2Score;
        scoreCount++;
      }

      if (scoreCount > 0) {
        healthScore = Math.round(scoreSum / scoreCount);
      }
    }

    // Weekly trend
    const lastWeekStart = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
    const lastWeekScans = allScans.filter(s => {
      const date = new Date(s.recordedAt);
      return date >= lastWeekStart && date < weekStart;
    }).length;

    const weeklyTrend = lastWeekScans > 0
      ? ((scansThisWeek - lastWeekScans) / lastWeekScans * 100).toFixed(1)
      : '0';

    const analytics = {
      totals: {
        scans: totalScans,
        scansWithVitals: scansWithData.length,
      },
      timeline: {
        today: scansToday,
        thisWeek: scansThisWeek,
        thisMonth: scansThisMonth,
        weeklyTrend,
      },
      averages,
      sources: sourceCount,
      riskDistribution,
      latestScan,
      healthScore,
    };

    return NextResponse.json({
      success: true,
      analytics,
    });

  } catch (error) {
    console.error('Error fetching BriahScan analytics:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch analytics',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
