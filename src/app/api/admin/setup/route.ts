import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';

// Secure admin setup: creates/updates admin with bcrypt-hashed password
// Protected by a setup secret to prevent unauthorized access
export async function POST(request: NextRequest) {
  try {
    // Verify setup secret from environment or request header
    const setupSecret = request.headers.get('x-setup-secret') || request.nextUrl.searchParams.get('secret');
    const expectedSecret = process.env.ADMIN_SETUP_SECRET || 'setup-achievements-2026';

    if (setupSecret !== expectedSecret) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const hashedPassword = await bcrypt.hash('Desm00nt$', 10);

    // Check if Desmont already exists
    const existing = await db.user.findFirst({ where: { login: 'Desmont' } });

    if (existing) {
      await db.user.update({
        where: { id: existing.id },
        data: {
          password: hashedPassword,
          name: 'Денис Картузов',
          role: 'ADMIN',
        },
      });
      return NextResponse.json({ message: 'Admin updated', id: existing.id });
    }

    // Check if old admin exists and convert it
    const oldAdmin = await db.user.findFirst({ where: { login: 'admin' } });
    if (oldAdmin) {
      await db.user.update({
        where: { id: oldAdmin.id },
        data: {
          login: 'Desmont',
          password: hashedPassword,
          name: 'Денис Картузов',
          role: 'ADMIN',
        },
      });
      return NextResponse.json({ message: 'Admin converted from old', id: oldAdmin.id });
    }

    // Create new admin
    const newAdmin = await db.user.create({
      data: {
        telegramId: 'admin_desmont',
        login: 'Desmont',
        password: hashedPassword,
        name: 'Денис Картузов',
        username: 'desmont',
        role: 'ADMIN',
        totalXp: 0,
        level: 7,
        league: 'gold',
        statusPrefix: 'Администратор',
      },
    });

    return NextResponse.json({ message: 'Admin created', id: newAdmin.id });
  } catch (error) {
    console.error('Admin setup error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
