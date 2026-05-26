import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

// One-time setup: ensure the admin account "Desmont" exists
export async function POST() {
  try {
    // Check if Desmont already exists
    const existing = await db.user.findFirst({ where: { login: 'Desmont' } });

    if (existing) {
      // Update password just in case
      await db.user.update({
        where: { id: existing.id },
        data: {
          password: 'Desm00nt$',
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
          password: 'Desm00nt$',
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
        password: 'Desm00nt$',
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
