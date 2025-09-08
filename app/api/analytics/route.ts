import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get the user from database to ensure we have the correct ID
    const user = await prisma.user.findUnique({
      where: { email: session.user.email! }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const isAdmin = user.role === 'admin';
    
    // Get date ranges
    const now = new Date();
    const today = new Date(now.setHours(0, 0, 0, 0));
    const thisWeek = new Date(today);
    thisWeek.setDate(thisWeek.getDate() - 7);
    const thisMonth = new Date(today);
    thisMonth.setDate(thisMonth.getDate() - 30);

    // Base query conditions
    const whereCondition = isAdmin ? {} : { userId: user.id };

    // Get total counts
    const [totalUsers, totalPatients, totalVitals, totalFaceScans] = await Promise.all([
      isAdmin ? prisma.user.count() : Promise.resolve(1),
      prisma.patient.count({ where: isAdmin ? {} : { userId: user.id } }),
      prisma.vitals.count({ where: whereCondition }),
      prisma.faceScan.count({ where: whereCondition })
    ]);

    // Get recent vitals for trend analysis
    const recentVitals = await prisma.vitals.findMany({
      where: {
        ...whereCondition,
        recordedAt: {
          gte: thisMonth
        }
      },
      orderBy: { recordedAt: 'desc' },
      take: 100
    });

    // Calculate average metrics from recent vitals
    const avgMetrics = recentVitals.reduce((acc, vital) => {
      if (vital.heartRate) acc.heartRateSum += Number(vital.heartRate);
      if (vital.oxygenSaturation) acc.oxygenSum += Number(vital.oxygenSaturation);
      if (vital.bloodPressureSystolic) acc.systolicSum += Number(vital.bloodPressureSystolic);
      if (vital.bloodPressureDiastolic) acc.diastolicSum += Number(vital.bloodPressureDiastolic);
      if (vital.hrvSdnn) acc.hrvSum += Number(vital.hrvSdnn);
      if (vital.stressLevel) acc.stressSum += Number(vital.stressLevel);
      
      if (vital.heartRate) acc.heartRateCount++;
      if (vital.oxygenSaturation) acc.oxygenCount++;
      if (vital.bloodPressureSystolic) acc.bpCount++;
      if (vital.hrvSdnn) acc.hrvCount++;
      if (vital.stressLevel) acc.stressCount++;
      
      return acc;
    }, {
      heartRateSum: 0, heartRateCount: 0,
      oxygenSum: 0, oxygenCount: 0,
      systolicSum: 0, diastolicSum: 0, bpCount: 0,
      hrvSum: 0, hrvCount: 0,
      stressSum: 0, stressCount: 0
    });

    // Calculate averages
    const averages = {
      heartRate: avgMetrics.heartRateCount > 0 ? Math.round(avgMetrics.heartRateSum / avgMetrics.heartRateCount) : 0,
      oxygenSaturation: avgMetrics.oxygenCount > 0 ? Math.round(avgMetrics.oxygenSum / avgMetrics.oxygenCount) : 0,
      bloodPressure: avgMetrics.bpCount > 0 ? 
        `${Math.round(avgMetrics.systolicSum / avgMetrics.bpCount)}/${Math.round(avgMetrics.diastolicSum / avgMetrics.bpCount)}` : '0/0',
      hrvSdnn: avgMetrics.hrvCount > 0 ? (avgMetrics.hrvSum / avgMetrics.hrvCount).toFixed(1) : 0,
      stressLevel: avgMetrics.stressCount > 0 ? Math.round((avgMetrics.stressSum / avgMetrics.stressCount) * 100) : 0
    };

    // Get vitals by time period
    const [vitalsToday, vitalsThisWeek, vitalsThisMonth] = await Promise.all([
      prisma.vitals.count({
        where: {
          ...whereCondition,
          recordedAt: { gte: today }
        }
      }),
      prisma.vitals.count({
        where: {
          ...whereCondition,
          recordedAt: { gte: thisWeek }
        }
      }),
      prisma.vitals.count({
        where: {
          ...whereCondition,
          recordedAt: { gte: thisMonth }
        }
      })
    ]);

    // Get risk assessment statistics
    const riskStats = await prisma.vitals.groupBy({
      by: ['diabeticRisk', 'hypertensionRisk'],
      where: whereCondition,
      _count: true
    });

    // Process risk statistics
    const riskSummary = {
      diabetic: { low: 0, medium: 0, high: 0 },
      hypertension: { low: 0, medium: 0, high: 0 }
    };

    riskStats.forEach(stat => {
      if (stat.diabeticRisk) {
        const risk = stat.diabeticRisk.toLowerCase();
        if (risk in riskSummary.diabetic) {
          riskSummary.diabetic[risk as keyof typeof riskSummary.diabetic] += stat._count;
        }
      }
      if (stat.hypertensionRisk) {
        const risk = stat.hypertensionRisk.toLowerCase();
        if (risk in riskSummary.hypertension) {
          riskSummary.hypertension[risk as keyof typeof riskSummary.hypertension] += stat._count;
        }
      }
    });

    // Get device vs manual source statistics
    const sourceStats = await prisma.vitals.groupBy({
      by: ['source'],
      where: whereCondition,
      _count: true
    });

    const sources = {
      device: 0,
      manual: 0,
      import: 0
    };

    sourceStats.forEach(stat => {
      if (stat.source in sources) {
        sources[stat.source as keyof typeof sources] = stat._count;
      }
    });

    // Get latest vitals for quick view
    const latestVitals = await prisma.vitals.findFirst({
      where: whereCondition,
      orderBy: { recordedAt: 'desc' },
      include: {
        patient: {
          select: {
            firstName: true,
            lastName: true
          }
        }
      }
    });

    // Calculate trends (compare this week to last week)
    const lastWeek = new Date(thisWeek);
    lastWeek.setDate(lastWeek.getDate() - 7);

    const [currentWeekVitals, previousWeekVitals] = await Promise.all([
      prisma.vitals.count({
        where: {
          ...whereCondition,
          recordedAt: {
            gte: thisWeek,
            lt: today
          }
        }
      }),
      prisma.vitals.count({
        where: {
          ...whereCondition,
          recordedAt: {
            gte: lastWeek,
            lt: thisWeek
          }
        }
      })
    ]);

    const weeklyTrend = previousWeekVitals > 0 
      ? ((currentWeekVitals - previousWeekVitals) / previousWeekVitals * 100).toFixed(1)
      : '0';

    // Get health score (simplified calculation based on available data)
    let healthScore = 100;
    if (latestVitals) {
      // Deduct points for abnormal values
      if (latestVitals.heartRate && (Number(latestVitals.heartRate) < 60 || Number(latestVitals.heartRate) > 100)) healthScore -= 10;
      if (latestVitals.oxygenSaturation && Number(latestVitals.oxygenSaturation) < 95) healthScore -= 15;
      if (latestVitals.bloodPressureSystolic && Number(latestVitals.bloodPressureSystolic) > 140) healthScore -= 10;
      if (latestVitals.stressLevel && Number(latestVitals.stressLevel) > 0.5) healthScore -= 10;
      if (latestVitals.diabeticRisk === 'high') healthScore -= 10;
      if (latestVitals.hypertensionRisk === 'high') healthScore -= 10;
    }

    return NextResponse.json({
      success: true,
      analytics: {
        // Summary counts
        totals: {
          users: totalUsers,
          patients: totalPatients,
          vitals: totalVitals,
          faceScans: totalFaceScans
        },
        
        // Time-based statistics
        vitalsTimeline: {
          today: vitalsToday,
          thisWeek: vitalsThisWeek,
          thisMonth: vitalsThisMonth,
          weeklyTrend: weeklyTrend
        },
        
        // Average metrics
        averages,
        
        // Risk assessment summary
        riskAssessment: riskSummary,
        
        // Source distribution
        sources,
        
        // Latest vital info
        latest: latestVitals ? {
          recordedAt: latestVitals.recordedAt,
          patientName: latestVitals.patient ? 
            `${latestVitals.patient.firstName} ${latestVitals.patient.lastName}` : 
            'Unknown',
          heartRate: latestVitals.heartRate,
          oxygenSaturation: latestVitals.oxygenSaturation,
          bloodPressure: latestVitals.bloodPressure,
          source: latestVitals.source
        } : null,
        
        // Health score
        healthScore: Math.max(0, healthScore),
        
        // User info
        userRole: user.role || 'user'
      }
    });
  } catch (error) {
    console.error('Analytics API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}