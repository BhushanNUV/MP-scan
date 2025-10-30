import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'json';

    const userData = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        UserProfile: true,
        UserSettings: true,
        Patient: {
          include: {
            Vitals: true,
            Appointment: true,
            Prescription: true,
            LabResult: true,
            MedicalDocument: true,
          },
        },
      },
    });

    if (!userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    await prisma.userSettings.update({
      where: { userId: session.user.id },
      data: { lastExportDate: new Date() },
    });

    const { ...exportData } = userData;

    if (format === 'json') {
      return NextResponse.json(exportData, {
        headers: {
          'Content-Disposition': `attachment; filename="user-data-${Date.now()}.json"`,
        },
      });
    } else if (format === 'csv') {
      const csv = convertToCSV(exportData);
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="user-data-${Date.now()}.csv"`,
        },
      });
    }

    return NextResponse.json({ error: 'Unsupported format' }, { status: 400 });
  } catch (error) {
    console.error('Error exporting data:', error);
    return NextResponse.json(
      { error: 'Failed to export data' },
      { status: 500 }
    );
  }
}

function convertToCSV(data: Record<string, unknown>): string {
  const flattenObject = (obj: Record<string, unknown>, prefix = ''): Record<string, unknown> => {
    return Object.keys(obj).reduce((acc: Record<string, unknown>, key) => {
      const pre = prefix.length ? `${prefix}.` : '';
      if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key]) && !(obj[key] instanceof Date)) {
        Object.assign(acc, flattenObject(obj[key] as Record<string, unknown>, pre + key));
      } else {
        acc[pre + key] = obj[key];
      }
      return acc;
    }, {});
  };

  const flattened = flattenObject(data);
  const headers = Object.keys(flattened);
  const values = Object.values(flattened).map(v => 
    typeof v === 'string' ? `"${v.replace(/"/g, '""')}"` : v
  );

  return `${headers.join(',')}\n${values.join(',')}`;
}