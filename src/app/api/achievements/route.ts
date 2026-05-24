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

// Placement multiplier
const PLACEMENT_MULTIPLIER: Record<number, number> = {
  1: 1.0,
  2: 0.8,
  3: 0.6,
  0: 0.3,
};

// Result status multiplier
const RESULT_STATUS_MULTIPLIER: Record<string, number> = {
  PARTICIPANT: 0.3,
  PRIZEWINNER: 0.6,
  WINNER: 0.8,
  ABSOLUTE_WINNER: 1.0,
  LAUREATE_1: 0.9,
  LAUREATE_2: 0.7,
  LAUREATE_3: 0.5,
};

function calculateXp(level: string, resultType: string, placement: number, resultStatus: string): number {
  const base = LEVEL_XP_BASE[level] || 2;
  if (resultType === 'STATUS' && resultStatus) {
    const multiplier = RESULT_STATUS_MULTIPLIER[resultStatus] ?? 0.3;
    return Math.max(1, Math.round(base * multiplier));
  }
  const multiplier = PLACEMENT_MULTIPLIER[placement] ?? 0.3;
  return Math.max(1, Math.round(base * multiplier));
}

export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('userId');
    const status = request.nextUrl.searchParams.get('status');
    const category = request.nextUrl.searchParams.get('category');
    const achievementType = request.nextUrl.searchParams.get('achievementType');
    const role = request.nextUrl.searchParams.get('role');

    if (!userId) {
      return NextResponse.json({ error: 'userId required' }, { status: 400 });
    }

    // Admin can see all achievements; students see only their own
    const where: Record<string, unknown> = role === 'ADMIN' ? {} : { userId };
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
        user: { select: { id: true, name: true, username: true, statusEmoji: true } },
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
      achievementType, achievementLevel, resultType, placement, resultStatus,
      xpRequested, achievementDate, comment, fileUrl,
      autoApprove, reviewedBy
    } = body;

    if (!userId || !title || !achievementType) {
      return NextResponse.json({ error: 'Обязательные поля: userId, title, achievementType' }, { status: 400 });
    }

    const user = await db.user.findUnique({ where: { id: userId } });
    if (!user) {
      return NextResponse.json({ error: 'Пользователь не найден' }, { status: 404 });
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
    const finalResultType = resultType || 'PLACEMENT';
    if (achievementType === 'FREE_FORM') {
      finalXpRequested = xpRequested || 5;
    } else {
      const level = achievementLevel || 'SCHOOL';
      const place = placement ?? 1;
      const status = resultStatus || '';
      finalXpRequested = calculateXp(level, finalResultType, place, status);
    }

    // Admin can auto-approve achievements for students
    const isAutoApprove = autoApprove === true;
    const finalStatus = isAutoApprove ? 'APPROVED' : 'PENDING';
    const finalXpAwarded = isAutoApprove ? finalXpRequested : 0;

    const achievement = await db.achievement.create({
      data: {
        userId,
        title,
        description: description || null,
        category: finalCategory,
        direction: finalDirection,
        achievementType,
        achievementLevel: achievementLevel || null,
        resultType: achievementType !== 'FREE_FORM' ? finalResultType : null,
        placement: achievementType !== 'FREE_FORM' ? (placement ?? null) : null,
        resultStatus: achievementType !== 'FREE_FORM' && finalResultType === 'STATUS' ? (resultStatus || null) : null,
        xpRequested: finalXpRequested,
        xpAwarded: finalXpAwarded,
        status: finalStatus,
        fileUrl: fileUrl || null,
        achievementDate: achievementDate || null,
        comment: comment || null,
        reviewedBy: isAutoApprove ? (reviewedBy || null) : null,
        reviewedAt: isAutoApprove ? new Date() : null,
      },
    });

    // If auto-approved, update user's totalXp
    if (isAutoApprove && finalXpAwarded > 0) {
      await db.user.update({
        where: { id: userId },
        data: { totalXp: { increment: finalXpAwarded } },
      });
    }

    return NextResponse.json({ achievement }, { status: 201 });
  } catch (error) {
    console.error('Achievements POST error:', error);
    const message = error instanceof Error ? error.message : 'Внутренняя ошибка сервера при создании достижения';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
