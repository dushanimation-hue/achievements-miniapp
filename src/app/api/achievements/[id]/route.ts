import { db } from '@/lib/db';
import { updateChallengeProgress } from '@/lib/challengeUtils';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const achievement = await db.achievement.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, username: true, statusEmoji: true } },
        reviewer: { select: { id: true, name: true, username: true } },
      },
    });

    if (!achievement) {
      return NextResponse.json({ error: 'Achievement not found' }, { status: 404 });
    }

    return NextResponse.json({ achievement });
  } catch (error) {
    console.error('Achievement GET error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status, xpAwarded, direction, reviewComment, reviewedBy } = body;

    const achievement = await db.achievement.findUnique({ where: { id } });
    if (!achievement) {
      return NextResponse.json({ error: 'Achievement not found' }, { status: 404 });
    }

    const updateData: Record<string, unknown> = {
      reviewedAt: new Date(),
    };

    if (status) updateData.status = status;
    if (xpAwarded !== undefined) updateData.xpAwarded = xpAwarded;
    if (direction) updateData.direction = direction;
    if (reviewComment) updateData.reviewComment = reviewComment;
    if (reviewedBy) updateData.reviewedBy = reviewedBy;

    const updated = await db.achievement.update({
      where: { id },
      data: updateData,
    });

    if (status === 'APPROVED' && xpAwarded) {
      await db.user.update({
        where: { id: achievement.userId },
        data: { totalXp: { increment: xpAwarded } },
      });
      // Update challenge progress for this user
      await updateChallengeProgress(achievement.userId, xpAwarded, direction || achievement.direction);
    }

    // If revoking (changing from APPROVED to REJECTED), deduct XP
    if (status === 'REJECTED' && achievement.status === 'APPROVED' && achievement.xpAwarded > 0) {
      await db.user.update({
        where: { id: achievement.userId },
        data: { totalXp: { decrement: achievement.xpAwarded } },
      });
    }

    return NextResponse.json({ achievement: updated });
  } catch (error) {
    console.error('Achievement PATCH error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const achievement = await db.achievement.findUnique({ where: { id } });
    if (!achievement) {
      return NextResponse.json({ error: 'Achievement not found' }, { status: 404 });
    }

    // If achievement was approved, deduct XP from user
    if (achievement.status === 'APPROVED' && achievement.xpAwarded > 0) {
      await db.user.update({
        where: { id: achievement.userId },
        data: { totalXp: { decrement: achievement.xpAwarded } },
      });
    }

    // Delete related records first
    await db.achievementBadge.deleteMany({ where: { achievementId: id } });
    await db.achievement.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Achievement DELETE error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
