import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

// Valid school codes — add more here as needed
const VALID_SCHOOL_CODES: Record<string, { name: string }> = {
  '11607L': { name: 'Лицей 7' },
};

export async function POST(request: NextRequest) {
  try {
    const { userId, schoolCode, fullName, classYear, classLetter } = await request.json();

    if (!userId || !schoolCode || !fullName || !classYear) {
      return NextResponse.json({ error: 'Все поля обязательны' }, { status: 400 });
    }

    // Verify school code
    const school = VALID_SCHOOL_CODES[schoolCode.toUpperCase()];
    if (!school) {
      return NextResponse.json({ error: 'Неверный код школы' }, { status: 400 });
    }

    // Check user exists
    const user = await db.user.findUnique({ where: { id: userId } });
    if (!user) {
      return NextResponse.json({ error: 'Пользователь не найден' }, { status: 404 });
    }

    // Update user with registration data
    const updated = await db.user.update({
      where: { id: userId },
      data: {
        fullName: fullName.trim(),
        schoolCode: schoolCode.toUpperCase(),
        classYear: parseInt(String(classYear)),
        classLetter: (classLetter || '').trim().toUpperCase(),
        registered: true,
        name: fullName.trim(),
        statusPrefix: `${classYear}${(classLetter || '').trim().toUpperCase()} класс`,
      },
    });

    return NextResponse.json({
      user: {
        id: updated.id,
        name: updated.name,
        login: updated.login,
        role: updated.role,
        faculty: null,
        registered: updated.registered,
        schoolCode: updated.schoolCode,
        classYear: updated.classYear,
        classLetter: updated.classLetter,
        fullName: updated.fullName,
      },
    });
  } catch (error) {
    console.error('Register error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

// Verify school code without registering
export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code');
  if (!code) {
    return NextResponse.json({ valid: false });
  }

  const school = VALID_SCHOOL_CODES[code.toUpperCase()];
  if (school) {
    return NextResponse.json({ valid: true, schoolName: school.name });
  }
  return NextResponse.json({ valid: false });
}
