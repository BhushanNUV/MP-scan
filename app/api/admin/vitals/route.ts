import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth-utils';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const authError = await requireAdmin();
  if (authError) return authError;

  try {
    const vitals = await prisma.vitals.findMany({
      select: {
        id: true,
        recordedAt: true,
        source: true,
        bloodPressureSystolic: true,
        bloodPressureDiastolic: true,
        heartRate: true,
        temperature: true,
        oxygenSaturation: true,
        bloodGlucose: true,
        userId: true,
        patient: {
          select: {
            firstName: true,
            lastName: true,
            user: {
              select: {
                email: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: { recordedAt: 'desc' },
      take: 50,
    });

    const formattedVitals = vitals.map(vital => ({
      ...vital,
      user: vital.patient?.user,
      patient: {
        firstName: vital.patient?.firstName,
        lastName: vital.patient?.lastName,
      },
    }));

    return NextResponse.json({ vitals: formattedVitals });
  } catch (error) {
    console.error('Error fetching vitals:', error);
    return NextResponse.json(
      { error: 'Failed to fetch vitals' },
      { status: 500 }
    );
  }
}