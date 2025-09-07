import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, handleApiError } from '@/lib/auth-helpers';

// GET /api/health-vitals/latest - Get latest vital signs
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    
    // Get user's patient profile
    const dbUser = await prisma.user.findUnique({
      where: { email: user.email! },
      include: { patients: true },
    });
    
    if (!dbUser || !dbUser.patients[0]) {
      return NextResponse.json({
        data: null,
        message: 'No patient profile found',
      });
    }
    
    const patientId = dbUser.patients[0].id;
    
    // Get the latest vitals record
    const latestVitals = await prisma.vitals.findFirst({
      where: { patientId },
      orderBy: { recordedAt: 'desc' },
    });
    
    if (!latestVitals) {
      return NextResponse.json({
        data: null,
        message: 'No vitals recorded yet',
      });
    }
    
    // Get previous vitals for comparison
    const previousVitals = await prisma.vitals.findFirst({
      where: {
        patientId,
        recordedAt: {
          lt: latestVitals.recordedAt,
        },
      },
      orderBy: { recordedAt: 'desc' },
    });
    
    // Calculate changes if previous vitals exist
    const changes: any = {};
    if (previousVitals) {
      const fields = [
        'bloodPressureSystolic',
        'bloodPressureDiastolic',
        'heartRate',
        'respiratoryRate',
        'temperature',
        'oxygenSaturation',
        'bloodGlucose',
        'cholesterolTotal',
        'bmi',
        'painLevel',
      ];
      
      fields.forEach((field) => {
        const current = (latestVitals as any)[field];
        const previous = (previousVitals as any)[field];
        
        if (current !== null && previous !== null) {
          changes[field] = {
            value: current - previous,
            percentage: ((current - previous) / previous) * 100,
            trend: current > previous ? 'up' : current < previous ? 'down' : 'stable',
          };
        }
      });
    }
    
    // Determine health status based on vitals
    const healthStatus = determineHealthStatus(latestVitals);
    
    return NextResponse.json({
      data: {
        current: latestVitals,
        previous: previousVitals,
        changes,
        healthStatus,
        patient: {
          id: dbUser.patients[0].id,
          name: `${dbUser.patients[0].firstName} ${dbUser.patients[0].lastName}`,
          age: calculateAge(dbUser.patients[0].dateOfBirth),
          bloodType: dbUser.patients[0].bloodType,
        },
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

// Helper function to determine health status
function determineHealthStatus(vitals: any) {
  const warnings = [];
  const critical = [];
  
  // Blood Pressure checks
  if (vitals.bloodPressureSystolic) {
    if (vitals.bloodPressureSystolic > 140) {
      warnings.push('High blood pressure');
    }
    if (vitals.bloodPressureSystolic > 180) {
      critical.push('Critical blood pressure');
    }
    if (vitals.bloodPressureSystolic < 90) {
      warnings.push('Low blood pressure');
    }
  }
  
  // Heart Rate checks
  if (vitals.heartRate) {
    if (vitals.heartRate > 100) {
      warnings.push('Elevated heart rate');
    }
    if (vitals.heartRate < 60) {
      warnings.push('Low heart rate');
    }
  }
  
  // Oxygen Saturation checks
  if (vitals.oxygenSaturation) {
    if (vitals.oxygenSaturation < 95) {
      warnings.push('Low oxygen saturation');
    }
    if (vitals.oxygenSaturation < 90) {
      critical.push('Critical oxygen levels');
    }
  }
  
  // Temperature checks
  if (vitals.temperature) {
    if (vitals.temperature > 37.5) {
      warnings.push('Elevated temperature');
    }
    if (vitals.temperature > 39) {
      critical.push('High fever');
    }
  }
  
  // Blood Glucose checks
  if (vitals.bloodGlucose) {
    if (vitals.bloodGlucose > 140) {
      warnings.push('High blood glucose');
    }
    if (vitals.bloodGlucose > 200) {
      critical.push('Very high blood glucose');
    }
    if (vitals.bloodGlucose < 70) {
      warnings.push('Low blood glucose');
    }
  }
  
  return {
    status: critical.length > 0 ? 'critical' : warnings.length > 0 ? 'warning' : 'normal',
    warnings,
    critical,
    summary: critical.length > 0 
      ? 'Immediate medical attention recommended'
      : warnings.length > 0 
      ? 'Some values need attention'
      : 'All vitals within normal range',
  };
}

// Helper function to calculate age
function calculateAge(dateOfBirth: Date): number {
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
}