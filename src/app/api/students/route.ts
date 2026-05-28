import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Verify admin access
    const adminId = request.headers.get('x-admin-id');
    if (!adminId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const admin = await db.user.findFirst({ where: { id: adminId, role: 'ADMIN' } });
    if (!admin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const students = await db.user.findMany({
      where: { role: 'STUDENT' },
      select: {
        id: true,
        name: true,
        username: true,
        totalXp: true,
        level: true,
        league: true,
        statusEmoji: true,
      },
      orderBy: { name: 'asc' },
    });
    return NextResponse.json({ students });
  } catch (error) {
    console.error('Students GET error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
