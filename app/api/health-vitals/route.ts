import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, handleApiError } from '@/lib/auth-helpers';
import { z } from 'zod';

// Schema for creating new vitals
const createVitalsSchema = z.object({
  bloodPressureSystolic: z.number().int().min(60).max(250).optional(),
  bloodPressureDiastolic: z.number().int().min(40).max(150).optional(),
  heartRate: z.number().int().min(30).max(250).optional(),
  respiratoryRate: z.number().int().min(5).max(60).optional(),
  temperature: z.number().min(35).max(42).optional(),
  oxygenSaturation: z.number().int().min(50).max(100).optional(),
  bloodGlucose: z.number().positive().optional(),
  cholesterolTotal: z.number().positive().optional(),
  cholesterolLDL: z.number().positive().optional(),
  cholesterolHDL: z.number().positive().optional(),
  triglycerides: z.number().positive().optional(),
  bmi: z.number().positive().optional(),
  painLevel: z.number().int().min(0).max(10).optional(),
  stepsCount: z.number().int().nonnegative().optional(),
  caloriesBurned: z.number().nonnegative().optional(),
  sleepHours: z.number().min(0).max(24).optional(),
  sleepQuality: z.enum(['Poor', 'Fair', 'Good', 'Excellent']).optional(),
  notes: z.string().optional(),
  symptoms: z.string().optional(),
});

// POST /api/health-vitals - Save new health vital scan
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    
    // Validate input
    const validatedData = createVitalsSchema.parse(body);
    
    // Get user's patient profile
    const dbUser = await prisma.user.findUnique({
      where: { email: user.email! },
      include: { patients: true },
    });
    
    if (!dbUser || !dbUser.patients[0]) {
      return NextResponse.json(
        { error: 'Patient profile not found. Please complete your profile first.' },
        { status: 404 }
      );
    }
    
    const patientId = dbUser.patients[0].id;
    
    // Calculate BMI if height and weight are available
    let calculatedBmi = validatedData.bmi;
    if (!calculatedBmi && dbUser.patients[0].height && dbUser.patients[0].weight) {
      const heightInMeters = dbUser.patients[0].height / 100;
      calculatedBmi = dbUser.patients[0].weight / (heightInMeters * heightInMeters);
    }
    
    // Create new vitals record
    const vitals = await prisma.vitals.create({
      data: {
        patientId,
        recordedBy: user.id,
        ...validatedData,
        bmi: calculatedBmi,
      },
    });
    
    return NextResponse.json({
      message: 'Vitals recorded successfully',
      data: vitals,
    }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}

// GET /api/health-vitals - Get all health vitals with pagination
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    const searchParams = request.nextUrl.searchParams;
    
    // Pagination parameters
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;
    
    // Date range filters
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    
    // Get user's patient profile
    const dbUser = await prisma.user.findUnique({
      where: { email: user.email! },
      include: { patients: true },
    });
    
    if (!dbUser || !dbUser.patients[0]) {
      return NextResponse.json({
        data: [],
        pagination: {
          page,
          limit,
          total: 0,
          totalPages: 0,
        },
      });
    }
    
    const patientId = dbUser.patients[0].id;
    
    // Build where clause
    const where: any = { patientId };
    
    if (startDate || endDate) {
      where.recordedAt = {};
      if (startDate) {
        where.recordedAt.gte = new Date(startDate);
      }
      if (endDate) {
        where.recordedAt.lte = new Date(endDate);
      }
    }
    
    // Get total count
    const total = await prisma.vitals.count({ where });
    
    // Get vitals with pagination
    const vitals = await prisma.vitals.findMany({
      where,
      orderBy: { recordedAt: 'desc' },
      skip,
      take: limit,
    });
    
    return NextResponse.json({
      data: vitals,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}