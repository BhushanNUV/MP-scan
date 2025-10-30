import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const profile = await prisma.userProfile.findUnique({
      where: { userId: session.user.id },
      include: {
        User: {
          select: {
            email: true,
            name: true,
            image: true,
          },
        },
      },
    });

    if (!profile) {
      const newProfile = await prisma.userProfile.create({
        data: {
          id: crypto.randomUUID(),
          userId: session.user.id,
          updatedAt: new Date(),
        },
        include: {
          User: {
            select: {
              email: true,
              name: true,
              image: true,
            },
          },
        },
      });
      return NextResponse.json(newProfile);
    }

    return NextResponse.json(profile);
  } catch (error) {
    console.error('Error fetching profile:', error);
    return NextResponse.json(
      { error: 'Failed to fetch profile' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();
    
    const updatedProfile = await prisma.userProfile.upsert({
      where: { userId: session.user.id },
      update: {
        firstName: data.firstName,
        lastName: data.lastName,
        dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
        gender: data.gender,
        phoneNumber: data.phoneNumber,
        address: data.address,
        city: data.city,
        state: data.state,
        country: data.country,
        postalCode: data.postalCode,
        bio: data.bio,
        occupation: data.occupation,
        company: data.company,
        website: data.website,
        socialLinks: data.socialLinks,
        height: data.height ? parseFloat(data.height) : null,
        weight: data.weight ? parseFloat(data.weight) : null,
        bloodType: data.bloodType,
        emergencyContact: data.emergencyContact,
        emergencyPhone: data.emergencyPhone,
      },
      create: {
        id: crypto.randomUUID(),
        userId: session.user.id,
        firstName: data.firstName,
        lastName: data.lastName,
        dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
        gender: data.gender,
        phoneNumber: data.phoneNumber,
        address: data.address,
        city: data.city,
        state: data.state,
        country: data.country,
        postalCode: data.postalCode,
        bio: data.bio,
        occupation: data.occupation,
        updatedAt: new Date(),
        company: data.company,
        website: data.website,
        socialLinks: data.socialLinks,
        height: data.height ? parseFloat(data.height) : null,
        weight: data.weight ? parseFloat(data.weight) : null,
        bloodType: data.bloodType,
        emergencyContact: data.emergencyContact,
        emergencyPhone: data.emergencyPhone,
      },
      include: {
        User: {
          select: {
            email: true,
            name: true,
            image: true,
          },
        },
      },
    });

    return NextResponse.json(updatedProfile);
  } catch (error) {
    console.error('Error updating profile:', error);
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    );
  }
}