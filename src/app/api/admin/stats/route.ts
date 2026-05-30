import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

// Admin stats — protected: only accessible by authenticated admin users
// The client must send the admin user ID in x-admin-id header
export async function GET(request: NextRequest) {
  try {
    // Basic protection: verify admin ID header is present
    const adminId = request.headers.get('x-admin-id');
    if (!adminId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const admin = await db.user.findFirst({
      where: { id: adminId, role: 'ADMIN' },
    });

    if (!admin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

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
    });
  } catch (error) {
    console.error('Stats error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
