import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

// XP base values per achievement level
const LEVEL_XP_BASE: Record<string, number> = {
  SCHOOL: 2,
  DISTRICT: 4,
  CITY: 7,
  REGIONAL: 12,
  ALL_RUSSIAN: 20,
  INTERNATIONAL: 25,
};

// Placement multiplier: 1st=100%, 2nd=80%, 3rd=60%, participant=30%
const PLACEMENT_MULTIPLIER: Record<number, number> = {
  1: 1.0,
  2: 0.8,
  3: 0.6,
  0: 0.3,
};

function calculateXp(level: string, placement: number): number {
  const base = LEVEL_XP_BASE[level] || 2;
  const multiplier = PLACEMENT_MULTIPLIER[placement] ?? 0.3;
  return Math.max(1, Math.round(base * multiplier));
}

export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('userId');
    const status = request.nextUrl.searchParams.get('status');
    const category = request.nextUrl.searchParams.get('category');
    const achievementType = request.nextUrl.searchParams.get('achievementType');

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
    if (achievementType && achievementType !== 'all') {
      where.achievementType = achievementType;
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
    const {
      userId, title, description, category, direction,
      achievementType, achievementLevel, placement,
      xpRequested, achievementDate, comment
    } = body;

    if (!userId || !title || !achievementType) {
      return NextResponse.json({ error: 'userId, title, achievementType required' }, { status: 400 });
    }

    const user = await db.user.findUnique({ where: { id: userId } });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Auto-assign category based on achievement type
    const typeCategoryMap: Record<string, string> = {
      SPORT: 'SPORT',
      CREATIVE: 'ART',
      OLYMPIAD: 'STUDY',
      FREE_FORM: 'OTHER',
    };
    const finalCategory = category || typeCategoryMap[achievementType] || 'OTHER';

    // Auto-assign direction based on category
    const categoryDirectionMap: Record<string, string> = {
      'SPORT': 'WILL',
      'STUDY': 'KNOWLEDGE',
      'ART': 'SKILLS',
      'COMMUNITY': 'COMMUNITY',
    };
    let finalDirection = direction || null;
    if (finalCategory !== 'OTHER' && categoryDirectionMap[finalCategory]) {
      finalDirection = categoryDirectionMap[finalCategory];
    }

    // Calculate XP automatically for non-free-form types
    let finalXpRequested: number;
    if (achievementType === 'FREE_FORM') {
      finalXpRequested = xpRequested || 5;
    } else {
      const level = achievementLevel || 'SCHOOL';
      const place = placement ?? 1;
      finalXpRequested = calculateXp(level, place);
    }

    const achievement = await db.achievement.create({
      data: {
        userId,
        title,
        description: description || null,
        category: finalCategory,
        direction: finalDirection,
        achievementType,
        achievementLevel: achievementLevel || null,
        placement: placement ?? null,
        xpRequested: finalXpRequested,
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
