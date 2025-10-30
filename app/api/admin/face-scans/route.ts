import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth-utils';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const authError = await requireAdmin();
  if (authError) return authError;

  try {
    const scans = await prisma.faceScan.findMany({
      select: {
        id: true,
        createdAt: true,
        confidence: true,
        deviceId: true,
        User: {
          select: {
            email: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return NextResponse.json({ scans });
  } catch (error) {
    console.error('Error fetching face scans:', error);
    return NextResponse.json(
      { error: 'Failed to fetch face scans' },
      { status: 500 }
    );
  }
}