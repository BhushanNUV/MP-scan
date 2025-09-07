import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth-utils';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const authError = await requireAdmin();
  if (authError) return authError;

  try {
    const [totalUsers, totalDevices, totalVitals, totalScans] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: 'device' } }),
      prisma.vitals.count(),
      prisma.faceScan.count(),
    ]);

    return NextResponse.json({
      totalUsers,
      totalDevices,
      totalVitals,
      totalScans,
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}