import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, handleApiError } from '@/lib/auth-helpers';
import { z } from 'zod';

// GET /api/user/profile - Get user profile with patient info
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    
    const userProfile = await prisma.user.findUnique({
      where: { email: user.email! },
      select: {
        id: true,
        email: true,
        name: true,
        image: true,
        createdAt: true,
        patients: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            dateOfBirth: true,
            gender: true,
            phoneNumber: true,
            address: true,
            bloodType: true,
            height: true,
            weight: true,
            emergencyContact: true,
            allergies: true,
            medications: true,
          },
        },
      },
    });
    
    if (!userProfile) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    // Return user with their patient profile (if exists)
    const response = {
      ...userProfile,
      patient: userProfile.patients[0] || null,
      patients: undefined, // Remove the array, return single patient
    };
    
    return NextResponse.json(response);
  } catch (error) {
    return handleApiError(error);
  }
}

// PUT /api/user/profile - Update user profile and patient info
const updateProfileSchema = z.object({
  name: z.string().min(2).optional(),
  firstName: z.string().min(2).optional(),
  lastName: z.string().min(2).optional(),
  dateOfBirth: z.string().optional(),
  gender: z.enum(['Male', 'Female', 'Other']).optional(),
  phoneNumber: z.string().optional(),
  address: z.string().optional(),
  height: z.number().positive().optional(),
  weight: z.number().positive().optional(),
  bloodType: z.enum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']).optional(),
  emergencyContact: z.string().optional(),
  allergies: z.string().optional(),
  medications: z.string().optional(),
});

export async function PUT(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    
    // Validate input
    const validatedData = updateProfileSchema.parse(body);
    
    // Update user info
    const updatedUser = await prisma.user.update({
      where: { email: user.email! },
      data: {
        name: validatedData.name,
      },
    });
    
    // Check if patient profile exists
    let patient = await prisma.patient.findFirst({
      where: { userId: updatedUser.id },
    });
    
    // Create or update patient profile
    if (patient) {
      // Update existing patient
      patient = await prisma.patient.update({
        where: { id: patient.id },
        data: {
          firstName: validatedData.firstName || patient.firstName,
          lastName: validatedData.lastName || patient.lastName,
          dateOfBirth: validatedData.dateOfBirth 
            ? new Date(validatedData.dateOfBirth) 
            : patient.dateOfBirth,
          gender: validatedData.gender || patient.gender,
          phoneNumber: validatedData.phoneNumber,
          address: validatedData.address,
          height: validatedData.height,
          weight: validatedData.weight,
          bloodType: validatedData.bloodType,
          emergencyContact: validatedData.emergencyContact,
          allergies: validatedData.allergies,
          medications: validatedData.medications,
        },
      });
    } else if (
      validatedData.firstName && 
      validatedData.lastName && 
      validatedData.dateOfBirth && 
      validatedData.gender
    ) {
      // Create new patient profile if required fields are provided
      patient = await prisma.patient.create({
        data: {
          userId: updatedUser.id,
          firstName: validatedData.firstName,
          lastName: validatedData.lastName,
          dateOfBirth: new Date(validatedData.dateOfBirth),
          gender: validatedData.gender,
          phoneNumber: validatedData.phoneNumber,
          address: validatedData.address,
          height: validatedData.height,
          weight: validatedData.weight,
          bloodType: validatedData.bloodType,
          emergencyContact: validatedData.emergencyContact,
          allergies: validatedData.allergies,
          medications: validatedData.medications,
        },
      });
    }
    
    return NextResponse.json({
      message: 'Profile updated successfully',
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        patient: patient,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}