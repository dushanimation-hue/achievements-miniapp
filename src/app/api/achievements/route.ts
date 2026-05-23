import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('userId');
    const status = request.nextUrl.searchParams.get('status');
    const category = request.nextUrl.searchParams.get('category');

    if (!userId) {
      return NextResponse.json({ error: 'userId required' }, { status: 400 });
    }

    const where: Record<string, unknown> = { userId };
    if (status && status !== 'all') {
      where.status = status.toUpperCase();
    }
    if (category && category !== 'all') {
      where.category = category;
    }

    const achievements = await db.achievement.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        reviewer: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json({ achievements });
  } catch (error) {
    console.error('Achievements GET error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, title, description, category, direction, xpRequested, achievementDate, comment } = body;

    if (!userId || !title || !category) {
      return NextResponse.json({ error: 'userId, title, category required' }, { status: 400 });
    }

    const user = await db.user.findUnique({ where: { id: userId } });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const categoryDirectionMap: Record<string, string> = {
      'SPORT': 'WILL',
      'STUDY': 'KNOWLEDGE',
      'ART': 'SKILLS',
      'COMMUNITY': 'COMMUNITY',
    };

    let finalDirection = direction || null;
    if (category !== 'OTHER' && categoryDirectionMap[category]) {
      finalDirection = categoryDirectionMap[category];
    }

    const achievement = await db.achievement.create({
      data: {
        userId,
        title,
        description: description || null,
        category,
        direction: finalDirection,
        xpRequested: xpRequested || 5,
        xpAwarded: 0,
        status: 'PENDING',
        achievementDate: achievementDate || null,
        comment: comment || null,
      },
    });

    return NextResponse.json({ achievement }, { status: 201 });
  } catch (error) {
    console.error('Achievements POST error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
