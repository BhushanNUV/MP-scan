import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

async function authenticateDevice(request: Request) {
  const authHeader = request.headers.get('Authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const apiToken = authHeader.substring(7);

  const user = await prisma.user.findUnique({
    where: { apiToken },
    include: {
      UserProfile: true,
      Patient: true,
    },
  });

  return user;
}

export async function POST(request: Request) {
  try {
    const user = await authenticateDevice(request);

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const data = await request.json();
    const { 
      patientId,
      vitals,
      faceScan,
      deviceId 
    } = data;

    let faceScanRecord = null;
    if (faceScan) {
      faceScanRecord = await prisma.faceScan.create({
        data: {
          id: crypto.randomUUID(),
          userId: user.id,
          scanData: faceScan.data || {},
          imageUrl: faceScan.imageUrl,
          confidence: faceScan.confidence,
          deviceId: deviceId || user.deviceId,
        },
      });
    }

    const targetPatientId = patientId || user.Patient[0]?.id;

    if (!targetPatientId) {
      const newPatient = await prisma.patient.create({
        data: {
          id: crypto.randomUUID(),
          userId: user.id,
          firstName: user.UserProfile?.firstName || user.name?.split(' ')[0] || 'User',
          lastName: user.UserProfile?.lastName || user.name?.split(' ')[1] || '',
          dateOfBirth: user.UserProfile?.dateOfBirth || new Date(),
          gender: 'Not specified',
          height: user.UserProfile?.height,
          weight: user.UserProfile?.weight,
          bloodType: user.UserProfile?.bloodType,
          updatedAt: new Date(),
        },
      });

      const vitalRecord = await prisma.vitals.create({
        data: {
          patientId: newPatient.id,
          userId: user.id,
          recordedBy: deviceId || user.deviceId,
          source: 'device',
          faceScanId: faceScanRecord?.id,
          ...vitals,
        },
      });

      return NextResponse.json({
        success: true,
        data: {
          vital: vitalRecord,
          faceScan: faceScanRecord,
          patient: newPatient,
        },
      });
    }

    const vitalRecord = await prisma.vitals.create({
      data: {
        patientId: targetPatientId,
        userId: user.id,
        recordedBy: deviceId || user.deviceId,
        source: 'device',
        faceScanId: faceScanRecord?.id,
        ...vitals,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        vital: vitalRecord,
        faceScan: faceScanRecord,
      },
    });
  } catch (error) {
    console.error('Error recording vitals:', error);
    return NextResponse.json(
      { error: 'Failed to record vitals' },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const user = await authenticateDevice(request);

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const patientId = searchParams.get('patientId');

    const whereClause = patientId 
      ? { patientId, userId: user.id }
      : { userId: user.id };

    const vitals = await prisma.vitals.findMany({
      where: whereClause,
      orderBy: { recordedAt: 'desc' },
      take: limit,
      include: {
        Patient: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: vitals,
    });
  } catch (error) {
    console.error('Error fetching vitals:', error);
    return NextResponse.json(
      { error: 'Failed to fetch vitals' },
      { status: 500 }
    );
  }
}