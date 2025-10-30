import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { 
          success: false,
          message: 'Email and password are required' 
        },
        { status: 400 }
      );
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        UserProfile: true,
        Patient: {
          take: 1,
        },
      },
    });

    if (!user || !user.password) {
      return NextResponse.json(
        { 
          success: false,
          message: 'Invalid email or password' 
        },
        { status: 401 }
      );
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      return NextResponse.json(
        { 
          success: false,
          message: 'Invalid email or password' 
        },
        { status: 401 }
      );
    }

    // Generate API token
    const apiToken = randomBytes(32).toString('hex');

    // Update user with token and last login
    await prisma.user.update({
      where: { id: user.id },
      data: {
        apiToken,
        lastLogin: new Date(),
      },
    });

    // Prepare response
    return NextResponse.json({
      success: true,
      message: 'Login successful',
      data: {
        userId: user.id,
        email: user.email,
        name: user.name || `${user.UserProfile?.firstName || ''} ${user.UserProfile?.lastName || ''}`.trim(),
        apiToken,
        profile: {
          firstName: user.UserProfile?.firstName || '',
          lastName: user.UserProfile?.lastName || '',
          age: user.UserProfile?.dateOfBirth ?
            Math.floor((Date.now() - new Date(user.UserProfile.dateOfBirth).getTime()) / (365.25 * 24 * 60 * 60 * 1000)) : null,
          height: user.UserProfile?.height || null,
          weight: user.UserProfile?.weight || null,
          gender: user.UserProfile?.gender || '',
        },
        patientId: user.Patient[0]?.id || null,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { 
        success: false,
        message: 'Login failed' 
      },
      { status: 500 }
    );
  }
}