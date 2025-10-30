import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const data = await request.json();

    // Extract all the fields for BrainScan
    const {
      // Basic Info
      recordedBy,
      source = 'manual',
      faceScanId,
      name,
      phoneNumber,

      // Basic Vitals
      heartRate,
      prq,
      oxygenSaturation,
      bloodPressure,
      bloodPressureSystolic,
      bloodPressureDiastolic,
      breathingRate,
      respiratoryRate,
      temperature,

      // Confidence Levels
      heartRateConfLevel,
      breathingRateConfLevel,
      prqConfLevel,
      hrvSdnnConfLevel,

      // Stress & Recovery Metrics
      stressLevel,
      recoveryAbility,
      stressResponse,
      respiration,

      // HRV Metrics
      hrvSdnn,
      pnsIndex,
      snsIndex,
      sd2,
      sd1,
      rmssd,
      meanRri,
      lfHf,

      // Risk Assessments
      diabeticRisk,
      hypertensionRisk,
      highFastingGlucoseRisk,
      highTotalCholesterolRisk,
      lowHemoglobinRisk,
      ascvdRisk,
      heartAge,

      // Blood Metrics
      hemoglobin,
      hba1c,
      bloodGlucose,

      // Additional Measurements
      cholesterolTotal,
      cholesterolLDL,
      cholesterolHDL,
      triglycerides,
      bmi,
      painLevel,

      // Activity & Sleep
      stepsCount,
      caloriesBurned,
      sleepHours,
      sleepQuality,

      // Notes
      notes,
      symptoms,

      // Optional timestamp (if not provided, will use default)
      recordedAt,
    } = data;

    // Create the briah scan record
    const briahScanRecord = await prisma.briahScan.create({
      data: {
        // Basic Info
        recordedBy,
        source,
        faceScanId,
        name,
        phoneNumber,
        recordedAt: recordedAt ? new Date(recordedAt) : undefined,

        // Basic Vitals
        heartRate,
        prq,
        oxygenSaturation,
        bloodPressure,
        bloodPressureSystolic,
        bloodPressureDiastolic,
        breathingRate,
        respiratoryRate,
        temperature,

        // Confidence Levels
        heartRateConfLevel,
        breathingRateConfLevel,
        prqConfLevel,
        hrvSdnnConfLevel,

        // Stress & Recovery Metrics
        stressLevel,
        recoveryAbility,
        stressResponse,
        respiration,

        // HRV Metrics
        hrvSdnn,
        pnsIndex,
        snsIndex,
        sd2,
        sd1,
        rmssd,
        meanRri,
        lfHf,

        // Risk Assessments
        diabeticRisk,
        hypertensionRisk,
        highFastingGlucoseRisk,
        highTotalCholesterolRisk,
        lowHemoglobinRisk,
        ascvdRisk,
        heartAge,

        // Blood Metrics
        hemoglobin,
        hba1c,
        bloodGlucose,

        // Additional Measurements
        cholesterolTotal,
        cholesterolLDL,
        cholesterolHDL,
        triglycerides,
        bmi,
        painLevel,

        // Activity & Sleep
        stepsCount,
        caloriesBurned,
        sleepHours,
        sleepQuality,

        // Notes
        notes,
        symptoms,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Briah scan data recorded successfully',
      data: briahScanRecord,
    }, { status: 201 });

  } catch (error) {
    console.error('Error recording briah scan:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to record briah scan data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const id = searchParams.get('id');
    const name = searchParams.get('name');
    const phoneNumber = searchParams.get('phoneNumber');

    // If ID is provided, get specific record
    if (id) {
      const briahScan = await prisma.briahScan.findUnique({
        where: { id },
      });

      if (!briahScan) {
        return NextResponse.json(
          { success: false, error: 'Briah scan record not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        data: briahScan,
      });
    }

    // Build where clause for filtering
    const whereClause: any = {};
    if (name) {
      whereClause.name = { contains: name };
    }
    if (phoneNumber) {
      whereClause.phoneNumber = phoneNumber;
    }

    // Get all records with optional filtering
    const briahScans = await prisma.briahScan.findMany({
      where: Object.keys(whereClause).length > 0 ? whereClause : undefined,
      orderBy: { recordedAt: 'desc' },
      take: limit,
    });

    return NextResponse.json({
      success: true,
      count: briahScans.length,
      data: briahScans,
    });

  } catch (error) {
    console.error('Error fetching briah scans:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch briah scan data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
