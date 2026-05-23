import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('userId');

    const badges = await db.badge.findMany({
      orderBy: { conditionValue: 'asc' },
    });

    let earnedBadgeIds: Set<string> = new Set();
    let earnedMap: Record<string, Date> = {};

    if (userId) {
      const userBadges = await db.userBadge.findMany({
        where: { userId },
      });
      userBadges.forEach((ub) => {
        earnedBadgeIds.add(ub.badgeId);
        earnedMap[ub.badgeId] = ub.earnedAt;
      });
    }

    const result = badges.map((b) => ({
      id: b.id,
      name: b.name,
      description: b.description,
      emoji: b.emoji,
      conditionType: b.conditionType,
      conditionValue: b.conditionValue,
      earned: earnedBadgeIds.has(b.id),
      earnedAt: earnedMap[b.id] || null,
    }));

    return NextResponse.json({ badges: result });
  } catch (error) {
    console.error('Badges error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
