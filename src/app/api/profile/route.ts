import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

const LEVELS = [
  { level: 1, name: 'Новичок', min: 0, max: 99 },
  { level: 2, name: 'Активный', min: 100, max: 249 },
  { level: 3, name: 'Олимпиадник', min: 250, max: 499 },
  { level: 4, name: 'Ботан', min: 500, max: 999 },
  { level: 5, name: 'Мастер своего дела', min: 1000, max: 1999 },
  { level: 6, name: 'Элита', min: 2000, max: 4999 },
  { level: 7, name: 'Легенда', min: 5000, max: 999999 },
];

function getLevelInfo(xp: number) {
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (xp >= LEVELS[i].min) return LEVELS[i];
  }
  return LEVELS[0];
}

export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('userId');
    if (!userId) {
      return NextResponse.json({ error: 'userId required' }, { status: 400 });
    }

    const user = await db.user.findUnique({
      where: { id: userId },
      include: {
        faculty: true,
        achievements: {
          orderBy: { createdAt: 'desc' },
          include: {
            reviewer: { select: { id: true, name: true } },
          },
        },
        userBadges: { include: { badge: true } },
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Use stored level from DB (admins may have manually set levels)
    const storedLevel = user.level;
    const levelInfo = LEVELS.find((l) => l.level === storedLevel) || getLevelInfo(user.totalXp);
    const xpBasedLevel = getLevelInfo(user.totalXp);
    // If XP-based level is higher than stored, use XP-based (level up from earning XP)
    const effectiveLevel = xpBasedLevel.level > storedLevel ? xpBasedLevel : levelInfo;
    const nextLevel = LEVELS.find((l) => l.level === effectiveLevel.level + 1);

    const achievementCounts = {
      total: user.achievements.length,
      APPROVED: user.achievements.filter((a) => a.status === 'APPROVED').length,
      PENDING: user.achievements.filter((a) => a.status === 'PENDING').length,
      REJECTED: user.achievements.filter((a) => a.status === 'REJECTED').length,
    };

    const directionMap: Record<string, string> = {
      KNOWLEDGE: 'Знание',
      WILL: 'Воля',
      SKILLS: 'Навыки',
      COMMUNITY: 'Сообщество',
      MORALITY: 'Нравственность',
    };

    const xpByDirection: Record<string, number> = {};
    Object.values(directionMap).forEach((d) => { xpByDirection[d] = 0; });

    user.achievements
      .filter((a) => a.status === 'APPROVED' && a.direction)
      .forEach((a) => {
        const dirName = directionMap[a.direction] || a.direction;
        if (dirName in xpByDirection) {
          xpByDirection[dirName] += a.xpAwarded;
        }
      });

    const recentAchievements = user.achievements.slice(0, 5).map((a) => ({
      id: a.id,
      title: a.title,
      description: a.description,
      category: a.category,
      direction: a.direction,
      xpRequested: a.xpRequested,
      xpAwarded: a.xpAwarded,
      status: a.status,
      achievementDate: a.achievementDate,
      comment: a.comment,
      reviewComment: a.reviewComment,
      reviewedBy: a.reviewer?.name || null,
      reviewedAt: a.reviewedAt,
      createdAt: a.createdAt,
    }));

    return NextResponse.json({
      user: {
        id: user.id,
        telegramId: user.telegramId,
        name: user.name,
        username: user.username,
        avatarUrl: user.avatarUrl,
        role: user.role,
        totalXp: user.totalXp,
        level: effectiveLevel.level,
        levelName: effectiveLevel.name,
        xpInLevel: user.totalXp - effectiveLevel.min,
        xpToNextLevel: nextLevel ? nextLevel.min - effectiveLevel.min : effectiveLevel.max - effectiveLevel.min,
        nextLevelXp: nextLevel ? nextLevel.min : null,
        nextLevelName: nextLevel ? nextLevel.name : null,
        statusEmoji: user.statusEmoji,
        statusPrefix: user.statusPrefix,
        faculty: user.faculty,
      },
      achievementCounts,
      xpByDirection,
      recentAchievements,
      badges: user.userBadges.map((ub) => ({
        id: ub.badge.id,
        name: ub.badge.name,
        description: ub.badge.description,
        emoji: ub.badge.emoji,
        earnedAt: ub.earnedAt,
      })),
      levelRoadmap: LEVELS,
    });
  } catch (error) {
    console.error('Profile error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
