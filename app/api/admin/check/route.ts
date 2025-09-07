import { NextResponse } from 'next/server';
import { checkAdminAccess } from '@/lib/auth-utils';

export async function GET() {
  const access = await checkAdminAccess();
  
  if (access.error) {
    return NextResponse.json(
      { error: access.error },
      { status: access.status }
    );
  }
  
  return NextResponse.json({ success: true, role: 'admin' });
}