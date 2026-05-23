import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Clear existing data
    await db.challengeParticipant.deleteMany();
    await db.userBadge.deleteMany();
    await db.achievement.deleteMany();
    await db.badge.deleteMany();
    await db.challenge.deleteMany();
    await db.user.deleteMany();
    await db.faculty.deleteMany();

    // Create Faculties
    const itFaculty = await db.faculty.create({ data: { name: 'IT', emoji: '💻', color: '#3B82F6' } });
    const sportFaculty = await db.faculty.create({ data: { name: 'Спорт', emoji: '⚽', color: '#10B981' } });
    const artFaculty = await db.faculty.create({ data: { name: 'Творчество', emoji: '🎨', color: '#F59E0B' } });
    const scienceFaculty = await db.faculty.create({ data: { name: 'Наука', emoji: '🔬', color: '#8B5CF6' } });
    const volFaculty = await db.faculty.create({ data: { name: 'Волонтёрство', emoji: '🤝', color: '#EF4444' } });

    // Create Users
    const admin = await db.user.create({
      data: {
        telegramId: 'admin1',
        name: 'Мария Петрова',
        username: 'maria_admin',
        role: 'ADMIN',
        facultyId: itFaculty.id,
        totalXp: 1250,
        level: 5,
        statusEmoji: '👑',
        statusText: 'Легенда',
      },
    });

    const currentUser = await db.user.create({
      data: {
        telegramId: 'user1',
        name: 'Иван Иванов',
        username: 'ivan_i',
        role: 'STUDENT',
        facultyId: itFaculty.id,
        totalXp: 320,
        level: 3,
        statusEmoji: '🔥',
        statusText: 'Исследователь',
      },
    });

    const user2 = await db.user.create({
      data: {
        telegramId: 'user2',
        name: 'Алексей Сидоров',
        username: 'alex_s',
        role: 'STUDENT',
        facultyId: sportFaculty.id,
        totalXp: 980,
        level: 4,
        statusEmoji: '💪',
        statusText: 'Мастер',
      },
    });

    const user3 = await db.user.create({
      data: {
        telegramId: 'user3',
        name: 'Анна Козлова',
        username: 'anna_k',
        role: 'STUDENT',
        facultyId: artFaculty.id,
        totalXp: 280,
        level: 3,
        statusEmoji: '✨',
        statusText: 'Исследователь',
      },
    });

    const user4 = await db.user.create({
      data: {
        telegramId: 'user4',
        name: 'Дмитрий Новиков',
        username: 'dima_n',
        role: 'STUDENT',
        facultyId: scienceFaculty.id,
        totalXp: 210,
        level: 2,
        statusEmoji: '🔬',
        statusText: 'Ученик',
      },
    });

    // Create Badges
    const badge1 = await db.badge.create({ data: { name: 'Первое место', emoji: '🥇', description: 'Занять 1 место в рейтинге', conditionType: 'RANK_FIRST', conditionValue: 1 } });
    const badge2 = await db.badge.create({ data: { name: 'Серебро', emoji: '🥈', description: 'Занять 2 место в рейтинге', conditionType: 'RANK_SECOND', conditionValue: 2 } });
    const badge3 = await db.badge.create({ data: { name: 'Бронза', emoji: '🥉', description: 'Занять 3 место в рейтинге', conditionType: 'RANK_THIRD', conditionValue: 3 } });
    const badge4 = await db.badge.create({ data: { name: 'Первый шаг', emoji: '🏅', description: 'Получить первое достижение', conditionType: 'FIRST_ACHIEVEMENT', conditionValue: 1 } });
    const badge5 = await db.badge.create({ data: { name: 'Многорукий', emoji: '🤹', description: 'Достижения в 3+ категориях', conditionType: 'DIRECTION_BALANCE', conditionValue: 3 } });
    const badge6 = await db.badge.create({ data: { name: 'Огонь', emoji: '🔥', description: '100+ XP за месяц', conditionType: 'XP_THRESHOLD', conditionValue: 100 } });

    // Give Иван badges: 🥉, 🏅, 🤹
    await db.userBadge.createMany({
      data: [
        { userId: currentUser.id, badgeId: badge3.id },
        { userId: currentUser.id, badgeId: badge4.id },
        { userId: currentUser.id, badgeId: badge5.id },
      ],
    });

    // Create Achievements for Иван
    await db.achievement.createMany({
      data: [
        {
          userId: currentUser.id,
          title: 'Олимпиада по математике',
          description: 'Участие в олимпиаде по математике',
          category: 'Учёба',
          direction: 'Знание',
          xpAwarded: 15,
          status: 'APPROVED',
          achievementDate: '2025-04-15',
          reviewedBy: admin.id,
          reviewedAt: new Date('2025-04-16'),
        },
        {
          userId: currentUser.id,
          title: 'Конкурс рисунков',
          description: 'Участие в конкурсе рисунков',
          category: 'Творчество',
          direction: 'Навыки',
          xpAwarded: 10,
          status: 'PENDING',
          achievementDate: '2025-05-10',
        },
        {
          userId: currentUser.id,
          title: 'Чтение 5 книг за месяц',
          description: 'Прочитал 5 книг за месяц',
          category: 'Учёба',
          direction: 'Знание',
          xpAwarded: 8,
          status: 'REJECTED',
          achievementDate: '2025-03-20',
          reviewedBy: admin.id,
          reviewComment: 'Не хватает подтверждения',
          reviewedAt: new Date('2025-03-22'),
        },
        {
          userId: currentUser.id,
          title: 'Чемпионат по бегу',
          description: 'Участие в чемпионате по бегу',
          category: 'Спорт',
          direction: 'Воля',
          xpAwarded: 20,
          status: 'APPROVED',
          achievementDate: '2025-05-01',
          reviewedBy: admin.id,
          reviewedAt: new Date('2025-05-02'),
        },
        {
          userId: currentUser.id,
          title: 'Волонтёр в приюте',
          description: 'Работал волонтёром в приюте для животных',
          category: 'Общество',
          direction: 'Сообщество',
          xpAwarded: 12,
          status: 'APPROVED',
          achievementDate: '2025-05-05',
          reviewedBy: admin.id,
          reviewedAt: new Date('2025-05-06'),
        },
        {
          userId: currentUser.id,
          title: 'Помощь первоклассникам',
          description: 'Помогал первоклассникам с адаптацией',
          category: 'Общество',
          direction: 'Нравственность',
          xpAwarded: 5,
          status: 'APPROVED',
          achievementDate: '2025-04-28',
          reviewedBy: admin.id,
          reviewedAt: new Date('2025-04-29'),
        },
      ],
    });

    // Create Challenges
    const challenge1 = await db.challenge.create({
      data: {
        title: 'Майский марафон',
        description: 'Наберите 50 XP за май! Выполняйте любые достижения и получайте награду.',
        direction: 'Все',
        xpTarget: 50,
        rewardXp: 20,
        startDate: new Date('2025-05-01'),
        endDate: new Date('2025-05-31'),
        isActive: true,
      },
    });

    const challenge2 = await db.challenge.create({
      data: {
        title: 'Всестороннее развитие',
        description: 'Наберите 30 XP в разных направлениях для всестороннего развития.',
        direction: 'Все',
        xpTarget: 30,
        rewardXp: 15,
        startDate: new Date('2025-05-15'),
        endDate: new Date('2025-06-30'),
        isActive: true,
      },
    });

    const challenge3 = await db.challenge.create({
      data: {
        title: 'Командный дух',
        description: 'Наберите 100 XP в направлении Сообщество вместе с командой!',
        direction: 'Сообщество',
        xpTarget: 100,
        rewardXp: 50,
        startDate: new Date('2025-05-01'),
        endDate: new Date('2025-06-15'),
        isActive: true,
      },
    });

    // Иван participates in all 3 challenges
    await db.challengeParticipant.createMany({
      data: [
        { userId: currentUser.id, challengeId: challenge1.id, xpCollected: 35 },
        { userId: currentUser.id, challengeId: challenge2.id, xpCollected: 28 },
        { userId: currentUser.id, challengeId: challenge3.id, xpCollected: 17 },
      ],
    });

    // Give some achievements to other users for leaderboard richness
    await db.achievement.create({
      data: {
        userId: user2.id,
        title: 'Марафон',
        description: 'Пробежал марафон',
        category: 'Спорт',
        direction: 'Воля',
        xpAwarded: 20,
        status: 'APPROVED',
        achievementDate: '2025-05-10',
        reviewedBy: admin.id,
        reviewedAt: new Date('2025-05-11'),
      },
    });

    await db.achievement.create({
      data: {
        userId: user3.id,
        title: 'Выставка картин',
        description: 'Участвовал в выставке',
        category: 'Творчество',
        direction: 'Навыки',
        xpAwarded: 15,
        status: 'APPROVED',
        achievementDate: '2025-05-08',
        reviewedBy: admin.id,
        reviewedAt: new Date('2025-05-09'),
      },
    });

    return NextResponse.json({ success: true, message: 'Seeded!' });
  } catch (error) {
    console.error('Seed error:', error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
