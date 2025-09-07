import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function checkAdminAccess() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return { error: 'Unauthorized', status: 401 };
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  if (user?.role !== 'admin') {
    return { error: 'Forbidden - Admin access required', status: 403 };
  }

  return { success: true, userId: session.user.id };
}

export async function requireAdmin() {
  const access = await checkAdminAccess();
  
  if (access.error) {
    return NextResponse.json(
      { error: access.error },
      { status: access.status }
    );
  }
  
  return null;
}