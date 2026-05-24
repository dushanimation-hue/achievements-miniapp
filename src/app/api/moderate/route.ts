import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const status = request.nextUrl.searchParams.get('status') || 'PENDING';

    const achievements = await db.achievement.findMany({
      where: { status: status.toUpperCase() },
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, name: true, username: true, faculty: true, statusEmoji: true } },
      },
    });

    return NextResponse.json({ achievements });
  } catch (error) {
    console.error('Moderate GET error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { achievementId, action, xpAwarded, direction, reviewComment, adminUserId } = body;

    if (!achievementId || !action || !adminUserId) {
      return NextResponse.json({ error: 'achievementId, action, adminUserId required' }, { status: 400 });
    }

    const achievement = await db.achievement.findUnique({ where: { id: achievementId } });
    if (!achievement) {
      return NextResponse.json({ error: 'Achievement not found' }, { status: 404 });
    }

    if (action === 'approve') {
      const awardedXp = xpAwarded ?? achievement.xpRequested;

      const updated = await db.achievement.update({
        where: { id: achievementId },
        data: {
          status: 'APPROVED',
          xpAwarded: awardedXp,
          direction: direction || achievement.direction,
          reviewComment: reviewComment || null,
          reviewedBy: adminUserId,
          reviewedAt: new Date(),
        },
      });

      await db.user.update({
        where: { id: achievement.userId },
        data: { totalXp: { increment: awardedXp } },
      });

      return NextResponse.json({ achievement: updated });
    } else if (action === 'reject') {
      const updated = await db.achievement.update({
        where: { id: achievementId },
        data: {
          status: 'REJECTED',
          reviewComment: reviewComment || 'Отклонено модератором',
          reviewedBy: adminUserId,
          reviewedAt: new Date(),
        },
      });

      return NextResponse.json({ achievement: updated });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Moderate PATCH error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
