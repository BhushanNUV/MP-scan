import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';

export async function POST(request: Request) {
  try {
    const { email, password, deviceId } = await request.json();

    if (!email || !password || !deviceId) {
      return NextResponse.json(
        { error: 'Email, password, and device ID are required' },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        profile: true,
        patients: true,
      },
    });

    if (!user || !user.password) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    const apiToken = randomBytes(32).toString('hex');

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        apiToken,
        deviceId,
        lastLogin: new Date(),
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        apiToken: true,
        profile: {
          select: {
            firstName: true,
            lastName: true,
            dateOfBirth: true,
            height: true,
            weight: true,
            bloodType: true,
          },
        },
        patients: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        role: updatedUser.role,
        profile: updatedUser.profile,
        patients: updatedUser.patients,
      },
      apiToken: updatedUser.apiToken,
      message: 'Login successful',
    });
  } catch (error) {
    console.error('Device login error:', error);
    return NextResponse.json(
      { error: 'Failed to authenticate' },
      { status: 500 }
    );
  }
}