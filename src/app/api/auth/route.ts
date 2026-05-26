import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { login, password } = await request.json();

    if (!login || !password) {
      return NextResponse.json({ error: 'Логин и пароль обязательны' }, { status: 400 });
    }

    const user = await db.user.findFirst({
      where: { login },
    });

    if (!user || user.password !== password) {
      return NextResponse.json({ error: 'Неверный логин или пароль' }, { status: 401 });
    }

    // Login-based users are always considered registered (admin/demo accounts)
    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        login: user.login,
        role: user.role,
        faculty: null,
        registered: true,
        schoolCode: user.schoolCode,
        classYear: user.classYear,
        classLetter: user.classLetter,
        fullName: user.fullName,
      },
    });
  } catch (error) {
    console.error('Auth error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
