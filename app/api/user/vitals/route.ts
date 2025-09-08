import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, handleApiError } from '@/lib/auth-helpers';

// GET /api/user/vitals - Get ALL vitals from table (no filtering)
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    
    // Direct fetch ALL records from vitals table - no relations, no filtering
    const vitals = await prisma.vitals.findMany({
      // No where clause - fetch ALL vitals
      orderBy: {
        recordedAt: 'desc',
      },
      take: 500, // Get up to 500 records
    });
    
    // Format the response
    const formattedVitals = vitals.map(vital => ({
      ...vital,
      recordedAt: vital.recordedAt.toISOString(),
      // Add placeholder patient info
      patient: {
        firstName: 'Patient',
        lastName: vital.patientId || 'N/A',
      },
    }));
    
    console.log(`Fetched ${formattedVitals.length} total vitals records from database`);
    
    return NextResponse.json({ vitals: formattedVitals });
  } catch (error) {
    return handleApiError(error);
  }
}