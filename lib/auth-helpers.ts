import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';

export async function getAuthUser() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.email) {
    return null;
  }
  
  return session.user;
}

export async function requireAuth() {
  const user = await getAuthUser();
  
  if (!user) {
    throw new Error('Unauthorized');
  }
  
  return user;
}

export function handleApiError(error: any) {
  console.error('API Error:', error);
  
  if (error.message === 'Unauthorized') {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }
  
  if (error.name === 'ZodError') {
    return NextResponse.json(
      { error: 'Validation error', details: error.errors },
      { status: 400 }
    );
  }
  
  if (error.code === 'P2002') {
    return NextResponse.json(
      { error: 'Duplicate entry found' },
      { status: 409 }
    );
  }
  
  return NextResponse.json(
    { error: 'Internal server error' },
    { status: 500 }
  );
}