import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Clear existing data
    await db.challengeParticipant.deleteMany();
    await db.userBadge.deleteMany();
    await db.achievementBadge.deleteMany();
    await db.achievement.deleteMany();
    await db.badge.deleteMany();
    await db.challenge.deleteMany();
    await db.user.deleteMany();
    await db.faculty.deleteMany();

    // Create Faculties
    const itFaculty = await db.faculty.create({ data: { id: 'fac_it', name: 'IT', emoji: '💻', color: '#3B82F6' } });
    const sportFaculty = await db.faculty.create({ data: { id: 'fac_sport', name: 'Спорт', emoji: '⚽', color: '#10B981' } });
    const artFaculty = await db.faculty.create({ data: { id: 'fac_art', name: 'Творчество', emoji: '🎨', color: '#F59E0B' } });
    const scienceFaculty = await db.faculty.create({ data: { id: 'fac_science', name: 'Наука', emoji: '🔬', color: '#8B5CF6' } });
    const volFaculty = await db.faculty.create({ data: { id: 'fac_social', name: 'Общество', emoji: '🤝', color: '#EF4444' } });

    // Create Users
    const admin = await db.user.create({
      data: {
        id: 'u7',
        telegramId: 'admin1',
        name: 'Ольга Васильева',
        username: 'olga_v',
        role: 'ADMIN',
        facultyId: scienceFaculty.id,
        totalXp: 0,
        level: 7,
        statusEmoji: '⭐',
        statusPrefix: 'Воспитатель',
      },
    });

    const currentUser = await db.user.create({
      data: {
        id: 'u1',
        telegramId: 'user1',
        name: 'Иван Иванов',
        username: 'ivan_i',
        role: 'STUDENT',
        facultyId: itFaculty.id,
        totalXp: 320,
        level: 3,
        statusEmoji: '🔥',
        statusPrefix: 'Олимпиадник',
      },
    });

    const user2 = await db.user.create({
      data: {
        id: 'u2',
        telegramId: 'user2',
        name: 'Мария Петрова',
        username: 'maria_p',
        role: 'STUDENT',
        facultyId: scienceFaculty.id,
        totalXp: 1250,
        level: 5,
        statusEmoji: '🧠',
        statusPrefix: 'Мастер своего дела',
      },
    });

    const user3 = await db.user.create({
      data: {
        id: 'u3',
        telegramId: 'user3',
        name: 'Алексей Сидоров',
        username: 'alex_s',
        role: 'STUDENT',
        facultyId: sportFaculty.id,
        totalXp: 980,
        level: 4,
        statusEmoji: '💪',
        statusPrefix: 'Ботан',
      },
    });

    const user4 = await db.user.create({
      data: {
        id: 'u4',
        telegramId: 'user4',
        name: 'Анна Козлова',
        username: 'anna_k',
        role: 'STUDENT',
        facultyId: artFaculty.id,
        totalXp: 280,
        level: 3,
        statusEmoji: '🎨',
        statusPrefix: 'Олимпиадник',
      },
    });

    const user5 = await db.user.create({
      data: {
        id: 'u5',
        telegramId: 'user5',
        name: 'Дмитрий Новиков',
        username: 'dima_n',
        role: 'STUDENT',
        facultyId: itFaculty.id,
        totalXp: 210,
        level: 2,
        statusEmoji: '💻',
        statusPrefix: 'Активный',
      },
    });

    const user6 = await db.user.create({
      data: {
        id: 'u6',
        telegramId: 'user6',
        name: 'Елена Смирнова',
        username: 'lena_s',
        role: 'STUDENT',
        facultyId: volFaculty.id,
        totalXp: 450,
        level: 3,
        statusEmoji: '🤝',
        statusPrefix: 'Олимпиадник',
      },
    });

    // Create Badges
    const badge1 = await db.badge.create({ data: { id: 'b1', name: 'Первый шаг', emoji: '🌱', description: 'Загрузить первое достижение', conditionType: 'FIRST_ACHIEVEMENT', conditionValue: 1 } });
    const badge2 = await db.badge.create({ data: { id: 'b2', name: 'Лидер', emoji: '👑', description: '1 место в рейтинге', conditionType: 'RANK_FIRST', conditionValue: 1 } });
    const badge3 = await db.badge.create({ data: { id: 'b3', name: 'Олимпийский резерв', emoji: '🧠', description: '500+ XP в Знании', conditionType: 'XP_THRESHOLD_KNOWLEDGE', conditionValue: 500 } });
    const badge4 = await db.badge.create({ data: { id: 'b4', name: 'Железная воля', emoji: '💪', description: '300+ XP в Воле', conditionType: 'XP_THRESHOLD_WILL', conditionValue: 300 } });
    const badge5 = await db.badge.create({ data: { id: 'b5', name: 'Многорукий', emoji: '🦑', description: 'Достижения в 4+ категориях', conditionType: 'MULTI_CATEGORY', conditionValue: 4 } });
    const badge6 = await db.badge.create({ data: { id: 'b6', name: 'Наставник', emoji: '🤝', description: '100+ XP в Сообществе', conditionType: 'XP_THRESHOLD_COMMUNITY', conditionValue: 100 } });

    // Give badges
    await db.userBadge.createMany({
      data: [
        { id: 'ub1', userId: currentUser.id, badgeId: badge1.id },
        { id: 'ub2', userId: currentUser.id, badgeId: badge5.id },
        { id: 'ub3', userId: currentUser.id, badgeId: badge6.id },
        { id: 'ub4', userId: user2.id, badgeId: badge1.id },
        { id: 'ub5', userId: user2.id, badgeId: badge2.id },
        { id: 'ub6', userId: user2.id, badgeId: badge3.id },
        { id: 'ub7', userId: user3.id, badgeId: badge1.id },
        { id: 'ub8', userId: user3.id, badgeId: badge4.id },
        { id: 'ub9', userId: user4.id, badgeId: badge1.id },
      ],
    });

    // Create Achievements
    await db.achievement.createMany({
      data: [
        {
          id: 'a1', userId: currentUser.id, title: 'Олимпиада по математике', description: 'Занял 1 место в школьной олимпиаде',
          category: 'STUDY', direction: 'KNOWLEDGE', achievementType: 'OLYMPIAD', achievementLevel: 'SCHOOL', placement: 1,
          xpRequested: 2, xpAwarded: 2, status: 'APPROVED', achievementDate: '2026-05-15',
          reviewedBy: admin.id, reviewedAt: new Date('2026-05-16'),
        },
        {
          id: 'a2', userId: currentUser.id, title: 'Конкурс чтецов', description: 'Участие в районном конкурсе чтецов',
          category: 'ART', direction: 'SKILLS', achievementType: 'CREATIVE', achievementLevel: 'DISTRICT', placement: 0,
          xpRequested: 1, xpAwarded: 0, status: 'PENDING', achievementDate: '2026-05-10',
        },
        {
          id: 'a3', userId: currentUser.id, title: 'Чтение 5 книг за месяц', description: 'Прочитал 5 книг за апрель',
          category: 'OTHER', direction: 'KNOWLEDGE', achievementType: 'FREE_FORM',
          xpRequested: 8, xpAwarded: 0, status: 'REJECTED', achievementDate: '2026-05-05',
          reviewComment: 'Нужно указать названия книг', reviewedBy: admin.id, reviewedAt: new Date('2026-05-06'),
        },
        {
          id: 'a4', userId: currentUser.id, title: 'Чемпионат по плаванию', description: '2 место в городских соревнованиях',
          category: 'SPORT', direction: 'WILL', achievementType: 'SPORT', achievementLevel: 'CITY', placement: 2,
          xpRequested: 6, xpAwarded: 6, status: 'APPROVED', achievementDate: '2026-05-01',
          reviewedBy: admin.id, reviewedAt: new Date('2026-05-02'),
        },
        {
          id: 'a5', userId: currentUser.id, title: 'Волонтёр в приюте', description: 'Помогал в приюте для животных',
          category: 'COMMUNITY', direction: 'COMMUNITY', achievementType: 'FREE_FORM',
          xpRequested: 10, xpAwarded: 10, status: 'APPROVED', achievementDate: '2026-04-28',
          reviewedBy: admin.id, reviewedAt: new Date('2026-04-29'),
        },
        {
          id: 'a6', userId: currentUser.id, title: 'ВСОШ по информатике', description: 'Участник регионального этапа ВСОШ',
          category: 'STUDY', direction: 'KNOWLEDGE', achievementType: 'OLYMPIAD', achievementLevel: 'REGIONAL', placement: 0,
          xpRequested: 4, xpAwarded: 4, status: 'APPROVED', achievementDate: '2026-04-20',
          reviewedBy: admin.id, reviewedAt: new Date('2026-04-21'),
        },
        {
          id: 'a7', userId: user2.id, title: 'Победитель ВСОШ по физике', description: '1 место на Всероссийской олимпиаде',
          category: 'STUDY', direction: 'KNOWLEDGE', achievementType: 'OLYMPIAD', achievementLevel: 'ALL_RUSSIAN', placement: 1,
          xpRequested: 20, xpAwarded: 20, status: 'APPROVED', achievementDate: '2026-04-15',
          reviewedBy: admin.id, reviewedAt: new Date('2026-04-16'),
        },
        {
          id: 'a8', userId: user3.id, title: 'Чемпионат по лёгкой атлетике', description: '1 место в региональных соревнованиях',
          category: 'SPORT', direction: 'WILL', achievementType: 'SPORT', achievementLevel: 'REGIONAL', placement: 1,
          xpRequested: 12, xpAwarded: 12, status: 'APPROVED', achievementDate: '2026-05-10',
          reviewedBy: admin.id, reviewedAt: new Date('2026-05-11'),
        },
        {
          id: 'a9', userId: user4.id, title: 'Фестиваль танца', description: '3 место в городском фестивале',
          category: 'ART', direction: 'SKILLS', achievementType: 'CREATIVE', achievementLevel: 'CITY', placement: 3,
          xpRequested: 4, xpAwarded: 4, status: 'APPROVED', achievementDate: '2026-05-05',
          reviewedBy: admin.id, reviewedAt: new Date('2026-05-06'),
        },
        {
          id: 'a10', userId: user5.id, title: 'Хакатон Code Battle', description: '2 место на хакатоне среди школьников',
          category: 'STUDY', direction: 'SKILLS', achievementType: 'OLYMPIAD', achievementLevel: 'CITY', placement: 2,
          xpRequested: 6, xpAwarded: 6, status: 'APPROVED', achievementDate: '2026-05-12',
          reviewedBy: admin.id, reviewedAt: new Date('2026-05-13'),
        },
        {
          id: 'a11', userId: user6.id, title: 'Благотворительный концерт', description: 'Организовала концерт для сбора средств',
          category: 'COMMUNITY', direction: 'MORALITY', achievementType: 'FREE_FORM',
          xpRequested: 14, xpAwarded: 0, status: 'PENDING', achievementDate: '2026-05-20',
        },
        {
          id: 'a12', userId: user5.id, title: 'Проект "Эко-монитор"', description: 'Разработал прототип мониторинга экологии',
          category: 'OTHER', direction: 'SKILLS', achievementType: 'FREE_FORM',
          xpRequested: 18, xpAwarded: 0, status: 'PENDING', achievementDate: '2026-05-22',
        },
      ],
    });

    // Create Challenges
    await db.challenge.createMany({
      data: [
        {
          id: 'ch1', title: 'Майский марафон', description: 'Собери 50 XP за май! Все направления засчитываются.',
          direction: 'ALL', xpTarget: 50, rewardXp: 20, startDate: new Date('2026-05-01'), endDate: new Date('2026-05-31'), isActive: true,
        },
        {
          id: 'ch2', title: 'Всестороннее развитие', description: 'Получи XP минимум в 4 направлениях за месяц',
          direction: 'ALL', xpTarget: 40, rewardXp: 30, startDate: new Date('2026-05-01'), endDate: new Date('2026-05-31'), isActive: true,
        },
        {
          id: 'ch3', title: 'Командный дух', description: 'Факультет суммарно набирает 2000 XP',
          direction: 'ALL', xpTarget: 2000, rewardXp: 50, startDate: new Date('2026-05-01'), endDate: new Date('2026-06-01'), isActive: true,
        },
      ],
    });

    // Challenge participants
    await db.challengeParticipant.createMany({
      data: [
        { id: 'cp1', userId: currentUser.id, challengeId: 'ch1', xpCollected: 22 },
        { id: 'cp2', userId: currentUser.id, challengeId: 'ch2', xpCollected: 15 },
        { id: 'cp3', userId: user2.id, challengeId: 'ch1', xpCollected: 50, completed: true, completedAt: new Date('2026-05-20') },
        { id: 'cp4', userId: user3.id, challengeId: 'ch1', xpCollected: 12 },
      ],
    });

    return NextResponse.json({ success: true, message: 'Seeded!' });
  } catch (error) {
    console.error('Seed error:', error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
