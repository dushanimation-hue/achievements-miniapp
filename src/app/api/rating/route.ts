import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const direction = request.nextUrl.searchParams.get('direction');
    const facultyId = request.nextUrl.searchParams.get('facultyId');
    const period = request.nextUrl.searchParams.get('period') || 'all';
    const leagueFilter = request.nextUrl.searchParams.get('league');

    const where: Record<string, unknown> = {};
    if (facultyId && facultyId !== 'all') {
      where.facultyId = facultyId;
    }
    if (leagueFilter && leagueFilter !== 'all') {
      where.league = leagueFilter;
    }
    where.role = 'STUDENT';

    // Calculate date filter based on period
    const now = new Date();
    let dateFilter: Date | null = null;
    if (period === 'month') {
      dateFilter = new Date(now.getFullYear(), now.getMonth(), 1);
    } else if (period === 'quarter') {
      const quarterMonth = Math.floor(now.getMonth() / 3) * 3;
      dateFilter = new Date(now.getFullYear(), quarterMonth, 1);
    } else if (period === 'year') {
      dateFilter = new Date(now.getFullYear(), 0, 1);
    }

    const achievementWhere: Record<string, unknown> = { status: 'APPROVED' };
    if (direction && direction !== 'ALL') {
      achievementWhere.direction = direction;
    }
    if (dateFilter) {
      achievementWhere.reviewedAt = { gte: dateFilter };
    }

    const users = await db.user.findMany({
      where,
      include: {
        faculty: true,
        achievements: {
          where: achievementWhere,
        },
      },
      orderBy: { totalXp: 'desc' },
    });

    const leaderboard = users.map((u) => {
      const periodXp = u.achievements.reduce((sum, a) => sum + a.xpAwarded, 0);
      return {
        id: u.id,
        name: u.name,
        username: u.username,
        totalXp: period !== 'all' ? periodXp : u.totalXp,
        level: u.level,
        statusEmoji: u.statusEmoji,
        statusPrefix: u.statusPrefix,
        league: u.league,
        faculty: u.faculty,
        achievementCount: u.achievements.length,
      };
    });

    leaderboard.sort((a, b) => b.totalXp - a.totalXp);
    leaderboard.forEach((entry, idx) => { entry.rank = idx + 1; });

    return NextResponse.json({ leaderboard });
  } catch (error) {
    console.error('Rating error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
