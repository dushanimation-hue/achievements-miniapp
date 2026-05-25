import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
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
