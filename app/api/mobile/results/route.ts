import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    // Get API token from header
    const authHeader = request.headers.get('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { 
          success: false,
          message: 'Authorization token required' 
        },
        { status: 401 }
      );
    }

    const apiToken = authHeader.substring(7);

    // Verify user
    const user = await prisma.user.findUnique({
      where: { apiToken },
    });

    if (!user) {
      return NextResponse.json(
        { 
          success: false,
          message: 'Invalid token' 
        },
        { status: 401 }
      );
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const scanId = searchParams.get('scanId');
    const limit = parseInt(searchParams.get('limit') || '10');

    // If specific scan ID provided
    if (scanId) {
      const vital = await prisma.vitals.findFirst({
        where: {
          id: scanId,
          userId: user.id,
        },
        include: {
          Patient: {
            select: {
              firstName: true,
              lastName: true,
              height: true,
              weight: true,
              gender: true,
            },
          },
        },
      });

      if (!vital) {
        return NextResponse.json(
          { 
            success: false,
            message: 'Scan not found' 
          },
          { status: 404 }
        );
      }

      // Get face scan if available
      let faceScan = null;
      if (vital.faceScanId) {
        faceScan = await prisma.faceScan.findUnique({
          where: { id: vital.faceScanId },
          select: {
            confidence: true,
            imageUrl: true,
            createdAt: true,
          },
        });
      }

      return NextResponse.json({
        success: true,
        data: {
          scanId: vital.id,
          timestamp: vital.recordedAt,
          patient: {
            name: `${vital.Patient.firstName} ${vital.Patient.lastName}`.trim(),
            height: vital.Patient.height,
            weight: vital.Patient.weight,
            gender: vital.Patient.gender,
          },
          vitals: {
            // Basic vitals
            heartRate: vital.heartRate,
            prq: vital.prq,
            oxygenSaturation: vital.oxygenSaturation,
            bloodPressure: vital.bloodPressure || (vital.bloodPressureSystolic && vital.bloodPressureDiastolic ? 
              `${vital.bloodPressureSystolic}/${vital.bloodPressureDiastolic}` : null),
            breathingRate: vital.breathingRate,
            temperature: vital.temperature,
            
            // Confidence levels
            heartRateConfLevel: vital.heartRateConfLevel,
            breathingRateConfLevel: vital.breathingRateConfLevel,
            prqConfLevel: vital.prqConfLevel,
            hrvSdnnConfLevel: vital.hrvSdnnConfLevel,
            
            // Stress & Recovery
            stressLevel: vital.stressLevel,
            recoveryAbility: vital.recoveryAbility,
            stressResponse: vital.stressResponse,
            respiration: vital.respiration,
            
            // HRV Metrics
            hrvSdnn: vital.hrvSdnn,
            pnsIndex: vital.pnsIndex,
            snsIndex: vital.snsIndex,
            sd2: vital.sd2,
            sd1: vital.sd1,
            rmssd: vital.rmssd,
            meanRri: vital.meanRri,
            lfHf: vital.lfHf,
            
            // Risk Assessments
            diabeticRisk: vital.diabeticRisk,
            hypertensionRisk: vital.hypertensionRisk,
            highFastingGlucoseRisk: vital.highFastingGlucoseRisk,
            highTotalCholesterolRisk: vital.highTotalCholesterolRisk,
            lowHemoglobinRisk: vital.lowHemoglobinRisk,
            ascvdRisk: vital.ascvdRisk,
            heartAge: vital.heartAge,
            
            // Blood Metrics
            hemoglobin: vital.hemoglobin,
            hba1c: vital.hba1c,
            bloodGlucose: vital.bloodGlucose,
            
            // Other
            bmi: vital.bmi,
            respiratoryRate: vital.respiratoryRate,
          },
          faceScan,
          notes: vital.notes,
          source: vital.source,
        },
      });
    }

    // Get all scans for user
    const vitals = await prisma.vitals.findMany({
      where: { userId: user.id },
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

    const results = await Promise.all(
      vitals.map(async (vital) => {
        let faceScan = null;
        if (vital.faceScanId) {
          faceScan = await prisma.faceScan.findUnique({
            where: { id: vital.faceScanId },
            select: {
              confidence: true,
              createdAt: true,
            },
          });
        }

        return {
          scanId: vital.id,
          timestamp: vital.recordedAt,
          patientName: `${vital.Patient.firstName} ${vital.Patient.lastName}`.trim(),
          vitals: {
            heartRate: vital.heartRate,
            bloodPressure: vital.bloodPressureSystolic && vital.bloodPressureDiastolic ? 
              `${vital.bloodPressureSystolic}/${vital.bloodPressureDiastolic}` : null,
            oxygenSaturation: vital.oxygenSaturation,
            temperature: vital.temperature,
            bloodGlucose: vital.bloodGlucose,
            bmi: vital.bmi,
          },
          scanConfidence: faceScan?.confidence,
          source: vital.source,
        };
      })
    );

    return NextResponse.json({
      success: true,
      message: `Found ${results.length} scan results`,
      data: results,
    });
  } catch (error) {
    console.error('Get results error:', error);
    return NextResponse.json(
      { 
        success: false,
        message: 'Failed to get scan results' 
      },
      { status: 500 }
    );
  }
}