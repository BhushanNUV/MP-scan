import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth-utils';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const authError = await requireAdmin();
  if (authError) return authError;

  try {
    // Direct fetch from vitals table without any relations
    const vitals = await prisma.vitals.findMany({
      orderBy: { recordedAt: 'desc' },
      take: 200, // Get more records
    });

    // Format dates for JSON serialization
    const formattedVitals = vitals.map(vital => ({
      ...vital,
      recordedAt: vital.recordedAt.toISOString(),
      // Add placeholder user/patient info since we're not using relations
      user: {
        email: vital.userId || 'Unknown User',
        name: `User ${vital.userId || 'N/A'}`,
      },
      patient: {
        firstName: 'Patient',
        lastName: vital.patientId || 'N/A',
      },
    }));

    console.log(`Fetched ${formattedVitals.length} vitals records directly`);
    return NextResponse.json({ vitals: formattedVitals });
  } catch (error) {
    console.error('Error fetching vitals:', error);
    return NextResponse.json(
      { error: 'Failed to fetch vitals' },
      { status: 500 }
    );
  }
}