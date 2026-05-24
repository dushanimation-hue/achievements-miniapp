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
    const itFaculty = await db.faculty.create({ data: { id: 'fac_it', name: 'IT', emoji: '💻', color: '#007AFF' } });
    const sportFaculty = await db.faculty.create({ data: { id: 'fac_sport', name: 'Спорт', emoji: '⚽', color: '#34C759' } });
    const artFaculty = await db.faculty.create({ data: { id: 'fac_art', name: 'Творчество', emoji: '🎨', color: '#FF9F0A' } });
    const scienceFaculty = await db.faculty.create({ data: { id: 'fac_science', name: 'Наука', emoji: '🔬', color: '#5856D6' } });
    const volFaculty = await db.faculty.create({ data: { id: 'fac_social', name: 'Общество', emoji: '🤝', color: '#FF2D55' } });

    // Create Admin user
    const admin = await db.user.create({
      data: {
        id: 'u_admin',
        telegramId: 'admin_tg',
        login: 'admin',
        password: 'admin123',
        name: 'Ольга Васильева',
        username: 'olga_v',
        role: 'ADMIN',
        facultyId: scienceFaculty.id,
        totalXp: 0,
        level: 7,
        league: 'gold',
        statusEmoji: '',
        statusPrefix: 'Администратор',
      },
    });

    // Create Student user (main demo)
    const student = await db.user.create({
      data: {
        id: 'u_student',
        telegramId: 'student_tg',
        login: 'student',
        password: 'student123',
        name: 'Иван Иванов',
        username: 'ivan_i',
        role: 'STUDENT',
        facultyId: itFaculty.id,
        totalXp: 85,
        level: 3,
        league: 'bronze',
        statusEmoji: '',
        statusPrefix: 'Олимпиадник',
      },
    });

    // Other students for leaderboard
    const user2 = await db.user.create({
      data: {
        id: 'u2', telegramId: 'user2', name: 'Мария Петрова', username: 'maria_p',
        role: 'STUDENT', facultyId: scienceFaculty.id, totalXp: 420, level: 5,
        league: 'silver', statusEmoji: '', statusPrefix: 'Мастер',
      },
    });
    const user3 = await db.user.create({
      data: {
        id: 'u3', telegramId: 'user3', name: 'Алексей Сидоров', username: 'alex_s',
        role: 'STUDENT', facultyId: sportFaculty.id, totalXp: 180, level: 4,
        league: 'bronze', statusEmoji: '', statusPrefix: 'Ботан',
      },
    });
    const user4 = await db.user.create({
      data: {
        id: 'u4', telegramId: 'user4', name: 'Анна Козлова', username: 'anna_k',
        role: 'STUDENT', facultyId: artFaculty.id, totalXp: 60, level: 2,
        league: 'bronze', statusEmoji: '', statusPrefix: 'Активный',
      },
    });
    const user5 = await db.user.create({
      data: {
        id: 'u5', telegramId: 'user5', name: 'Дмитрий Новиков', username: 'dima_n',
        role: 'STUDENT', facultyId: itFaculty.id, totalXp: 35, level: 2,
        league: 'bronze', statusEmoji: '', statusPrefix: 'Активный',
      },
    });
    const user6 = await db.user.create({
      data: {
        id: 'u6', telegramId: 'user6', name: 'Елена Смирнова', username: 'lena_s',
        role: 'STUDENT', facultyId: volFaculty.id, totalXp: 110, level: 3,
        league: 'bronze', statusEmoji: '', statusPrefix: 'Олимпиадник',
      },
    });
    const user7 = await db.user.create({
      data: {
        id: 'u7', telegramId: 'user7', name: 'Павел Морозов', username: 'pavel_m',
        role: 'STUDENT', facultyId: itFaculty.id, totalXp: 650, level: 6,
        league: 'gold', statusEmoji: '', statusPrefix: 'Элита',
      },
    });
    const user8 = await db.user.create({
      data: {
        id: 'u8', telegramId: 'user8', name: 'Софья Волкова', username: 'sofa_v',
        role: 'STUDENT', facultyId: scienceFaculty.id, totalXp: 310, level: 5,
        league: 'silver', statusEmoji: '', statusPrefix: 'Мастер',
      },
    });

    // Create Badges
    const badge1 = await db.badge.create({ data: { id: 'b1', name: 'Первый шаг', emoji: '🌱', description: 'Загрузить первое достижение', conditionType: 'FIRST_ACHIEVEMENT', conditionValue: 1 } });
    const badge2 = await db.badge.create({ data: { id: 'b2', name: 'Лидер', emoji: '👑', description: '1 место в рейтинге', conditionType: 'RANK_FIRST', conditionValue: 1 } });
    const badge3 = await db.badge.create({ data: { id: 'b3', name: 'Олимпийский резерв', emoji: '🧠', description: '100+ XP в Знании', conditionType: 'XP_THRESHOLD_KNOWLEDGE', conditionValue: 100 } });
    const badge4 = await db.badge.create({ data: { id: 'b4', name: 'Железная воля', emoji: '💪', description: '50+ XP в Воле', conditionType: 'XP_THRESHOLD_WILL', conditionValue: 50 } });
    const badge5 = await db.badge.create({ data: { id: 'b5', name: 'Многорукий', emoji: '🦑', description: 'Достижения в 4+ категориях', conditionType: 'MULTI_CATEGORY', conditionValue: 4 } });
    const badge6 = await db.badge.create({ data: { id: 'b6', name: 'Наставник', emoji: '🤝', description: '20+ XP в Сообществе', conditionType: 'XP_THRESHOLD_COMMUNITY', conditionValue: 20 } });

    // Give badges
    await db.userBadge.createMany({
      data: [
        { id: 'ub1', userId: student.id, badgeId: badge1.id },
        { id: 'ub2', userId: student.id, badgeId: badge5.id },
        { id: 'ub3', userId: student.id, badgeId: badge6.id },
        { id: 'ub4', userId: user2.id, badgeId: badge1.id },
        { id: 'ub5', userId: user2.id, badgeId: badge2.id },
        { id: 'ub6', userId: user2.id, badgeId: badge3.id },
        { id: 'ub7', userId: user3.id, badgeId: badge1.id },
        { id: 'ub8', userId: user3.id, badgeId: badge4.id },
        { id: 'ub9', userId: user4.id, badgeId: badge1.id },
        { id: 'ub10', userId: user7.id, badgeId: badge1.id },
        { id: 'ub11', userId: user7.id, badgeId: badge2.id },
        { id: 'ub12', userId: user7.id, badgeId: badge3.id },
      ],
    });

    // Create Achievements for student (Ivan)
    // With new XP thresholds: Школьный(2), Районный(4), Городской(7), Региональный(12), Всероссийский(20), Международный(25)
    // Placement multipliers: 1st=1.0, 2nd=0.8, 3rd=0.6, participant=0.3
    await db.achievement.createMany({
      data: [
        {
          id: 'a1', userId: student.id, title: 'Олимпиада по математике', description: 'Занял 1 место в школьной олимпиаде',
          category: 'STUDY', direction: 'KNOWLEDGE', achievementType: 'OLYMPIAD', achievementLevel: 'SCHOOL', placement: 1,
          xpRequested: 2, xpAwarded: 2, status: 'APPROVED', achievementDate: '2026-05-15',
          reviewedBy: admin.id, reviewedAt: new Date('2026-05-16'),
        },
        {
          id: 'a2', userId: student.id, title: 'Конкурс чтецов', description: 'Участие в районном конкурсе чтецов',
          category: 'ART', direction: 'SKILLS', achievementType: 'CREATIVE', achievementLevel: 'DISTRICT', placement: 0,
          xpRequested: 1, xpAwarded: 0, status: 'PENDING', achievementDate: '2026-05-10',
        },
        {
          id: 'a3', userId: student.id, title: 'Чтение 5 книг за месяц', description: 'Прочитал 5 книг за апрель',
          category: 'OTHER', direction: 'KNOWLEDGE', achievementType: 'FREE_FORM',
          xpRequested: 8, xpAwarded: 0, status: 'REJECTED', achievementDate: '2026-05-05',
          reviewComment: 'Нужно указать названия книг', reviewedBy: admin.id, reviewedAt: new Date('2026-05-06'),
        },
        {
          id: 'a4', userId: student.id, title: 'Чемпионат по плаванию', description: '2 место в городских соревнованиях',
          category: 'SPORT', direction: 'WILL', achievementType: 'SPORT', achievementLevel: 'CITY', placement: 2,
          xpRequested: 6, xpAwarded: 6, status: 'APPROVED', achievementDate: '2026-05-01',
          reviewedBy: admin.id, reviewedAt: new Date('2026-05-02'),
        },
        {
          id: 'a5', userId: student.id, title: 'Волонтёр в приюте', description: 'Помогал в приюте для животных',
          category: 'COMMUNITY', direction: 'COMMUNITY', achievementType: 'FREE_FORM',
          xpRequested: 10, xpAwarded: 10, status: 'APPROVED', achievementDate: '2026-04-28',
          reviewedBy: admin.id, reviewedAt: new Date('2026-04-29'),
        },
        {
          id: 'a6', userId: student.id, title: 'ВСОШ по информатике', description: 'Участник регионального этапа ВСОШ',
          category: 'STUDY', direction: 'KNOWLEDGE', achievementType: 'OLYMPIAD', achievementLevel: 'REGIONAL', placement: 0,
          xpRequested: 4, xpAwarded: 4, status: 'APPROVED', achievementDate: '2026-04-20',
          reviewedBy: admin.id, reviewedAt: new Date('2026-04-21'),
        },
        {
          id: 'a7', userId: student.id, title: 'Городская олимпиада по физике', description: '3 место в городской олимпиаде',
          category: 'STUDY', direction: 'KNOWLEDGE', achievementType: 'OLYMPIAD', achievementLevel: 'CITY', placement: 3,
          xpRequested: 4, xpAwarded: 4, status: 'APPROVED', achievementDate: '2026-04-15',
          reviewedBy: admin.id, reviewedAt: new Date('2026-04-16'),
        },
        // Achievements for other students
        {
          id: 'a8', userId: user2.id, title: 'Победитель ВСОШ по физике', description: '1 место на Всероссийской олимпиаде',
          category: 'STUDY', direction: 'KNOWLEDGE', achievementType: 'OLYMPIAD', achievementLevel: 'ALL_RUSSIAN', placement: 1,
          xpRequested: 20, xpAwarded: 20, status: 'APPROVED', achievementDate: '2026-04-15',
          reviewedBy: admin.id, reviewedAt: new Date('2026-04-16'),
        },
        {
          id: 'a9', userId: user2.id, title: 'Международная олимпиада', description: '2 место на Международной олимпиаде по химии',
          category: 'STUDY', direction: 'KNOWLEDGE', achievementType: 'OLYMPIAD', achievementLevel: 'INTERNATIONAL', placement: 2,
          xpRequested: 20, xpAwarded: 20, status: 'APPROVED', achievementDate: '2026-03-10',
          reviewedBy: admin.id, reviewedAt: new Date('2026-03-11'),
        },
        {
          id: 'a10', userId: user3.id, title: 'Чемпионат по лёгкой атлетике', description: '1 место в региональных соревнованиях',
          category: 'SPORT', direction: 'WILL', achievementType: 'SPORT', achievementLevel: 'REGIONAL', placement: 1,
          xpRequested: 12, xpAwarded: 12, status: 'APPROVED', achievementDate: '2026-05-10',
          reviewedBy: admin.id, reviewedAt: new Date('2026-05-11'),
        },
        {
          id: 'a11', userId: user4.id, title: 'Фестиваль танца', description: '3 место в городском фестивале',
          category: 'ART', direction: 'SKILLS', achievementType: 'CREATIVE', achievementLevel: 'CITY', placement: 3,
          xpRequested: 4, xpAwarded: 4, status: 'APPROVED', achievementDate: '2026-05-05',
          reviewedBy: admin.id, reviewedAt: new Date('2026-05-06'),
        },
        {
          id: 'a12', userId: user5.id, title: 'Хакатон Code Battle', description: '2 место на хакатоне среди школьников',
          category: 'STUDY', direction: 'SKILLS', achievementType: 'OLYMPIAD', achievementLevel: 'CITY', placement: 2,
          xpRequested: 6, xpAwarded: 6, status: 'APPROVED', achievementDate: '2026-05-12',
          reviewedBy: admin.id, reviewedAt: new Date('2026-05-13'),
        },
        {
          id: 'a13', userId: user6.id, title: 'Благотворительный концерт', description: 'Организовала концерт для сбора средств',
          category: 'COMMUNITY', direction: 'MORALITY', achievementType: 'FREE_FORM',
          xpRequested: 14, xpAwarded: 0, status: 'PENDING', achievementDate: '2026-05-20',
        },
        {
          id: 'a14', userId: user5.id, title: 'Проект "Эко-монитор"', description: 'Разработал прототип мониторинга экологии',
          category: 'OTHER', direction: 'SKILLS', achievementType: 'FREE_FORM',
          xpRequested: 18, xpAwarded: 0, status: 'PENDING', achievementDate: '2026-05-22',
        },
        {
          id: 'a15', userId: user7.id, title: 'ВСОШ по математике', description: '1 место на Всероссийской олимпиаде',
          category: 'STUDY', direction: 'KNOWLEDGE', achievementType: 'OLYMPIAD', achievementLevel: 'ALL_RUSSIAN', placement: 1,
          xpRequested: 20, xpAwarded: 20, status: 'APPROVED', achievementDate: '2026-03-15',
          reviewedBy: admin.id, reviewedAt: new Date('2026-03-16'),
        },
        {
          id: 'a16', userId: user8.id, title: 'Региональная олимпиада по биологии', description: '1 место в региональной олимпиаде',
          category: 'STUDY', direction: 'KNOWLEDGE', achievementType: 'OLYMPIAD', achievementLevel: 'REGIONAL', placement: 1,
          xpRequested: 12, xpAwarded: 12, status: 'APPROVED', achievementDate: '2026-04-20',
          reviewedBy: admin.id, reviewedAt: new Date('2026-04-21'),
        },
      ],
    });

    // Create Challenges
    await db.challenge.createMany({
      data: [
        {
          id: 'ch1', title: 'Майский марафон', description: 'Собери 30 XP за май! Все направления засчитываются.',
          direction: 'ALL', xpTarget: 30, rewardXp: 10, startDate: new Date('2026-05-01'), endDate: new Date('2026-05-31'), isActive: true,
        },
        {
          id: 'ch2', title: 'Всестороннее развитие', description: 'Получи XP минимум в 3 направлениях за месяц',
          direction: 'ALL', xpTarget: 20, rewardXp: 15, startDate: new Date('2026-05-01'), endDate: new Date('2026-05-31'), isActive: true,
        },
      ],
    });

    // Challenge participants
    await db.challengeParticipant.createMany({
      data: [
        { id: 'cp1', userId: student.id, challengeId: 'ch1', xpCollected: 22 },
        { id: 'cp2', userId: student.id, challengeId: 'ch2', xpCollected: 15 },
        { id: 'cp3', userId: user2.id, challengeId: 'ch1', xpCollected: 30, completed: true, completedAt: new Date('2026-05-20') },
        { id: 'cp4', userId: user3.id, challengeId: 'ch1', xpCollected: 12 },
      ],
    });

    return NextResponse.json({ success: true, message: 'Seeded with new levels and auth!' });
  } catch (error) {
    console.error('Seed error:', error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
