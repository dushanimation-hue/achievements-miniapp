import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const totalUsers = await db.user.count();
    const studentCount = await db.user.count({ where: { role: 'STUDENT' } });
    const adminCount = await db.user.count({ where: { role: 'ADMIN' } });

    const totalAchievements = await db.achievement.count();
    const approvedCount = await db.achievement.count({ where: { status: 'APPROVED' } });
    const pendingCount = await db.achievement.count({ where: { status: 'PENDING' } });
    const rejectedCount = await db.achievement.count({ where: { status: 'REJECTED' } });

    const totalBadges = await db.badge.count();
    const totalUserBadges = await db.userBadge.count();
    const activeChallenges = await db.challenge.count({ where: { isActive: true } });
    const totalParticipants = await db.challengeParticipant.count();

    const faculties = await db.faculty.findMany({
      include: {
        _count: { select: { users: true } },
      },
    });

    return NextResponse.json({
      users: { total: totalUsers, students: studentCount, admins: adminCount },
      achievements: {
        total: totalAchievements,
        approved: approvedCount,
        pending: pendingCount,
        rejected: rejectedCount,
      },
      badges: { total: totalBadges, awarded: totalUserBadges },
      challenges: { active: activeChallenges, participants: totalParticipants },
      faculties: faculties.map((f) => ({
        id: f.id,
        name: f.name,
        emoji: f.emoji,
        userCount: f._count.users,
      })),
    });
  } catch (error) {
    console.error('Stats error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
