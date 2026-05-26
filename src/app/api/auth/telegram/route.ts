import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { telegramId, firstName, lastName, username, photoUrl, initData } = await request.json();

    if (!telegramId) {
      return NextResponse.json({ error: 'telegramId required' }, { status: 400 });
    }

    // Try to find existing user by telegramId
    let user = await db.user.findUnique({
      where: { telegramId: String(telegramId) },
    });

    if (!user) {
      // Create new student account
      const name = [firstName, lastName].filter(Boolean).join(' ') || `User ${telegramId}`;
      user = await db.user.create({
        data: {
          telegramId: String(telegramId),
          name,
          username: username || null,
          avatarUrl: photoUrl || null,
          role: 'STUDENT',
          statusPrefix: 'Новичок',
        },
      });
    }

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        login: user.login,
        role: user.role,
        faculty: null,
        registered: user.registered,
        schoolCode: user.schoolCode,
        classYear: user.classYear,
        classLetter: user.classLetter,
        fullName: user.fullName,
      },
    });
  } catch (error) {
    console.error('Telegram auth error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
