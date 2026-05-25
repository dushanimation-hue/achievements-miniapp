import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  try {
    const faculties = await db.faculty.findMany({
      include: {
        members: {
          select: { totalXp: true },
        },
      },
      orderBy: { name: 'asc' },
    })

    const result = faculties.map((f) => ({
      id: f.id,
      name: f.name,
      emoji: f.emoji,
      color: f.color,
      totalXp: f.members.reduce((sum, m) => sum + m.totalXp, 0),
      memberCount: f.members.length,
    }))

    // Sort by totalXp descending
    result.sort((a, b) => b.totalXp - a.totalXp)

    return NextResponse.json({ faculties: result })
  } catch (error) {
    console.error('Faculty fetch error:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, facultyId } = body as { userId: string; facultyId: string }

    if (!userId || !facultyId) {
      return NextResponse.json({ error: 'userId and facultyId required' }, { status: 400 })
    }

    // Verify faculty exists
    const faculty = await db.faculty.findUnique({ where: { id: facultyId } })
    if (!faculty) {
      return NextResponse.json({ error: 'Faculty not found' }, { status: 404 })
    }

    // Update user's facultyId
    await db.user.update({
      where: { id: userId },
      data: { facultyId },
    })

    return NextResponse.json({
      success: true,
      faculty: { id: faculty.id, name: faculty.name },
    })
  } catch (error) {
    console.error('Faculty join error:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
