import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('userId');

    let challenges;
    if (userId) {
      challenges = await db.challenge.findMany({
        where: { isActive: true },
        orderBy: { createdAt: 'desc' },
        include: {
          participants: { where: { userId } },
        },
      });
    } else {
      challenges = await db.challenge.findMany({
        where: { isActive: true },
        orderBy: { createdAt: 'desc' },
      });
    }

    const result = challenges.map((ch: Record<string, unknown>) => {
      const participants = (ch.participants || []) as Record<string, unknown>[];
      return {
        id: ch.id,
        title: ch.title,
        description: ch.description,
        direction: ch.direction,
        xpTarget: ch.xpTarget,
        rewardXp: ch.rewardXp,
        startDate: ch.startDate,
        endDate: ch.endDate,
        isActive: ch.isActive,
        isJoined: participants.length > 0,
        xpCollected: participants[0]?.xpCollected || 0,
        completed: participants[0]?.completed || false,
        completedAt: participants[0]?.completedAt || null,
      };
    });

    return NextResponse.json({ challenges: result });
  } catch (error) {
    console.error('Challenges GET error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, challengeId } = body;

    if (!userId || !challengeId) {
      return NextResponse.json({ error: 'userId and challengeId required' }, { status: 400 });
    }

    const existing = await db.challengeParticipant.findUnique({
      where: { userId_challengeId: { userId, challengeId } },
    });

    if (existing) {
      return NextResponse.json({ error: 'Already joined' }, { status: 400 });
    }

    const participation = await db.challengeParticipant.create({
      data: { userId, challengeId, xpCollected: 0, completed: false },
    });

    return NextResponse.json({ participation }, { status: 201 });
  } catch (error) {
    console.error('Challenges POST error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
