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

    // Create Faculties (Three Musketeers)
    const facultyAthos = await db.faculty.create({
      data: { id: 'f_athos', name: 'Атос', emoji: '⚔️', color: '#007AFF' },
    });
    const facultyPorthos = await db.faculty.create({
      data: { id: 'f_porthos', name: 'Партос', emoji: '🛡️', color: '#FF9F0A' },
    });
    const facultyAramis = await db.faculty.create({
      data: { id: 'f_aramis', name: 'Арамис', emoji: '✨', color: '#AF52DE' },
    });

    // Create Admin user
    const admin = await db.user.create({
      data: {
        id: 'u_admin',
        telegramId: 'admin_tg',
        login: 'Desmont',
        password: 'Desm00nt$',
        name: 'Денис Картузов',
        username: 'desmont',
        role: 'ADMIN',
        totalXp: 0,
        level: 7,
        league: 'gold',
        statusEmoji: '',
        statusPrefix: 'Администратор',
        facultyId: facultyAthos.id,
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
        totalXp: 125,
        level: 3,
        league: 'bronze',
        statusEmoji: '',
        statusPrefix: 'Олимпиадник',
        facultyId: facultyAthos.id,
      },
    });

    // Other students for leaderboard
    const user2 = await db.user.create({
      data: {
        id: 'u2', telegramId: 'user2', name: 'Мария Петрова', username: 'maria_p',
        role: 'STUDENT', totalXp: 1440, level: 5,
        league: 'silver', statusEmoji: '', statusPrefix: 'Мастер',
        facultyId: facultyPorthos.id,
      },
    });
    const user3 = await db.user.create({
      data: {
        id: 'u3', telegramId: 'user3', name: 'Алексей Сидоров', username: 'alex_s',
        role: 'STUDENT', totalXp: 720, level: 4,
        league: 'bronze', statusEmoji: '', statusPrefix: 'Ботан',
        facultyId: facultyPorthos.id,
      },
    });
    const user4 = await db.user.create({
      data: {
        id: 'u4', telegramId: 'user4', name: 'Анна Козлова', username: 'anna_k',
        role: 'STUDENT', totalXp: 240, level: 2,
        league: 'bronze', statusEmoji: '', statusPrefix: 'Активный',
        facultyId: facultyAramis.id,
      },
    });
    const user5 = await db.user.create({
      data: {
        id: 'u5', telegramId: 'user5', name: 'Дмитрий Новиков', username: 'dima_n',
        role: 'STUDENT', totalXp: 140, level: 2,
        league: 'bronze', statusEmoji: '', statusPrefix: 'Активный',
        facultyId: facultyAramis.id,
      },
    });
    const user6 = await db.user.create({
      data: {
        id: 'u6', telegramId: 'user6', name: 'Елена Смирнова', username: 'lena_s',
        role: 'STUDENT', totalXp: 440, level: 3,
        league: 'bronze', statusEmoji: '', statusPrefix: 'Олимпиадник',
        facultyId: facultyAthos.id,
      },
    });
    const user7 = await db.user.create({
      data: {
        id: 'u7', telegramId: 'user7', name: 'Павел Морозов', username: 'pavel_m',
        role: 'STUDENT', totalXp: 2600, level: 6,
        league: 'gold', statusEmoji: '', statusPrefix: 'Элита',
        facultyId: facultyPorthos.id,
      },
    });
    const user8 = await db.user.create({
      data: {
        id: 'u8', telegramId: 'user8', name: 'Софья Волкова', username: 'sofa_v',
        role: 'STUDENT', totalXp: 1240, level: 5,
        league: 'silver', statusEmoji: '', statusPrefix: 'Мастер',
        facultyId: facultyAramis.id,
      },
    });

    // Create Badges
    const badge1 = await db.badge.create({ data: { id: 'b1', name: 'Первый шаг', emoji: '🌱', description: 'Загрузить первое достижение', conditionType: 'FIRST_ACHIEVEMENT', conditionValue: 1 } });
    const badge2 = await db.badge.create({ data: { id: 'b2', name: 'Лидер', emoji: '👑', description: '1 место в рейтинге', conditionType: 'RANK_FIRST', conditionValue: 1 } });
    const badge3 = await db.badge.create({ data: { id: 'b3', name: 'Олимпийский резерв', emoji: '🧠', description: '100+ XP в Знании', conditionType: 'XP_THRESHOLD_KNOWLEDGE', conditionValue: 100 } });
    const badge4 = await db.badge.create({ data: { id: 'b4', name: 'Железная воля', emoji: '💪', description: '50+ XP в Воле', conditionType: 'XP_THRESHOLD_WILL', conditionValue: 50 } });

    const badge5 = await db.badge.create({ data: { id: 'b5', name: 'Чемпион', emoji: '🏆', description: 'Занять 1 место в соревновании', conditionType: 'FIRST_PLACE', conditionValue: 1 } });
    const badge6 = await db.badge.create({ data: { id: 'b6', name: 'Олимпиадник', emoji: '🧪', description: 'Отправить достижение типа РЭШ/ВСОШ', conditionType: 'TYPE_OLYMPIAD', conditionValue: 1 } });
    const badge7 = await db.badge.create({ data: { id: 'b7', name: 'Творец', emoji: '🎨', description: 'Отправить творческое достижение', conditionType: 'TYPE_CREATIVE', conditionValue: 1 } });
    const badge8 = await db.badge.create({ data: { id: 'b8', name: 'Спортсмен', emoji: '🏃', description: 'Отправить спортивное достижение', conditionType: 'TYPE_SPORT', conditionValue: 1 } });
    const badge9 = await db.badge.create({ data: { id: 'b9', name: 'Многорукий', emoji: '🐙', description: 'Получить XP во всех 5 направлениях', conditionType: 'ALL_DIRECTIONS', conditionValue: 5 } });
    const badge10 = await db.badge.create({ data: { id: 'b10', name: 'На все руки', emoji: '🤹', description: 'Иметь достижения всех 4 типов', conditionType: 'ALL_TYPES', conditionValue: 4 } });
    const badge11 = await db.badge.create({ data: { id: 'b11', name: 'Золотая лига', emoji: '🥇', description: 'Достичь Золотой лиги', conditionType: 'LEAGUE_GOLD', conditionValue: 1 } });
    const badge12 = await db.badge.create({ data: { id: 'b12', name: 'Серебряная лига', emoji: '🥈', description: 'Достичь Серебряной лиги', conditionType: 'LEAGUE_SILVER', conditionValue: 1 } });
    const badge13 = await db.badge.create({ data: { id: 'b13', name: 'Ботан', emoji: '📚', description: 'Достичь 4 уровня', conditionType: 'LEVEL_4', conditionValue: 4 } });
    const badge14 = await db.badge.create({ data: { id: 'b14', name: 'Легенда', emoji: '⚡', description: 'Достичь 7 уровня', conditionType: 'LEVEL_7', conditionValue: 7 } });
    const badge15 = await db.badge.create({ data: { id: 'b15', name: 'Волонтёр', emoji: '🤝', description: 'Отправить достижение в Сообщество', conditionType: 'TYPE_COMMUNITY', conditionValue: 1 } });

    // Give badges
    await db.userBadge.createMany({
      data: [
        { id: 'ub1', userId: student.id, badgeId: badge1.id },
        { id: 'ub2', userId: student.id, badgeId: badge4.id },
        { id: 'ub3', userId: user2.id, badgeId: badge1.id },
        { id: 'ub4', userId: user2.id, badgeId: badge2.id },
        { id: 'ub5', userId: user2.id, badgeId: badge3.id },
        { id: 'ub6', userId: user3.id, badgeId: badge1.id },
        { id: 'ub7', userId: user3.id, badgeId: badge4.id },
        { id: 'ub8', userId: user4.id, badgeId: badge1.id },
        { id: 'ub9', userId: user7.id, badgeId: badge1.id },
        { id: 'ub10', userId: user7.id, badgeId: badge2.id },
        { id: 'ub11', userId: student.id, badgeId: badge5.id },
        { id: 'ub12', userId: student.id, badgeId: badge6.id },
        { id: 'ub13', userId: student.id, badgeId: badge7.id },
      ],
    });

    // Create Achievements
    await db.achievement.createMany({
      data: [
        {
          id: 'a1', userId: student.id, title: 'Олимпиада по математике', description: 'Занял 1 место в школьной олимпиаде',
          category: 'STUDY', direction: 'KNOWLEDGE', achievementType: 'OLYMPIAD', achievementLevel: 'SCHOOL',
          resultType: 'PLACEMENT', placement: 1,
          xpRequested: 8, xpAwarded: 8, status: 'APPROVED', achievementDate: '2026-05-15',
          reviewedBy: admin.id, reviewedAt: new Date('2026-05-16'),
        },
        {
          id: 'a2', userId: student.id, title: 'Конкурс чтецов', description: 'Призёр в районном конкурсе чтецов',
          category: 'ART', direction: 'SKILLS', achievementType: 'CREATIVE', achievementLevel: 'DISTRICT',
          resultType: 'STATUS', resultStatus: 'PRIZEWINNER',
          xpRequested: 10, xpAwarded: 0, status: 'PENDING', achievementDate: '2026-05-10',
        },
        {
          id: 'a3', userId: student.id, title: 'Чтение 5 книг за месяц', description: 'Прочитал 5 книг за апрель',
          category: 'OTHER', direction: 'KNOWLEDGE', achievementType: 'FREE_FORM',
          xpRequested: 32, xpAwarded: 0, status: 'REJECTED', achievementDate: '2026-05-05',
          reviewComment: 'Нужно указать названия книг', reviewedBy: admin.id, reviewedAt: new Date('2026-05-06'),
        },
        {
          id: 'a4', userId: student.id, title: 'Чемпионат по плаванию', description: '2 место в городских соревнованиях',
          category: 'SPORT', direction: 'WILL', achievementType: 'SPORT', achievementLevel: 'CITY',
          resultType: 'PLACEMENT', placement: 2,
          xpRequested: 22, xpAwarded: 22, status: 'APPROVED', achievementDate: '2026-05-01',
          reviewedBy: admin.id, reviewedAt: new Date('2026-05-02'),
        },
        {
          id: 'a5', userId: student.id, title: 'Волонтёр в приюте', description: 'Помогал в приюте для животных',
          category: 'COMMUNITY', direction: 'COMMUNITY', achievementType: 'FREE_FORM',
          xpRequested: 40, xpAwarded: 40, status: 'APPROVED', achievementDate: '2026-04-28',
          reviewedBy: admin.id, reviewedAt: new Date('2026-04-29'),
        },
        {
          id: 'a6', userId: student.id, title: 'ВСОШ по информатике', description: 'Победитель регионального этапа ВСОШ',
          category: 'STUDY', direction: 'KNOWLEDGE', achievementType: 'OLYMPIAD', achievementLevel: 'REGIONAL',
          resultType: 'STATUS', resultStatus: 'WINNER',
          xpRequested: 38, xpAwarded: 38, status: 'APPROVED', achievementDate: '2026-04-20',
          reviewedBy: admin.id, reviewedAt: new Date('2026-04-21'),
        },
        {
          id: 'a7', userId: student.id, title: 'Городская олимпиада по физике', description: '3 место в городской олимпиаде',
          category: 'STUDY', direction: 'KNOWLEDGE', achievementType: 'OLYMPIAD', achievementLevel: 'CITY',
          resultType: 'PLACEMENT', placement: 3,
          xpRequested: 17, xpAwarded: 17, status: 'APPROVED', achievementDate: '2026-04-15',
          reviewedBy: admin.id, reviewedAt: new Date('2026-04-16'),
        },
        // Achievements for other students
        {
          id: 'a8', userId: user2.id, title: 'Победитель ВСОШ по физике', description: '1 место на Всероссийской олимпиаде',
          category: 'STUDY', direction: 'KNOWLEDGE', achievementType: 'OLYMPIAD', achievementLevel: 'ALL_RUSSIAN',
          resultType: 'PLACEMENT', placement: 1,
          xpRequested: 80, xpAwarded: 80, status: 'APPROVED', achievementDate: '2026-04-15',
          reviewedBy: admin.id, reviewedAt: new Date('2026-04-16'),
        },
        {
          id: 'a9', userId: user2.id, title: 'ВСОШ по химии', description: '2 место на Всероссийской олимпиаде по химии',
          category: 'STUDY', direction: 'KNOWLEDGE', achievementType: 'OLYMPIAD', achievementLevel: 'ALL_RUSSIAN',
          resultType: 'PLACEMENT', placement: 2,
          xpRequested: 64, xpAwarded: 64, status: 'APPROVED', achievementDate: '2026-03-10',
          reviewedBy: admin.id, reviewedAt: new Date('2026-03-11'),
        },
        {
          id: 'a10', userId: user3.id, title: 'Чемпионат по лёгкой атлетике', description: '1 место в региональных соревнованиях',
          category: 'SPORT', direction: 'WILL', achievementType: 'SPORT', achievementLevel: 'REGIONAL',
          resultType: 'PLACEMENT', placement: 1,
          xpRequested: 48, xpAwarded: 48, status: 'APPROVED', achievementDate: '2026-05-10',
          reviewedBy: admin.id, reviewedAt: new Date('2026-05-11'),
        },
        {
          id: 'a11', userId: user4.id, title: 'Фестиваль танца', description: 'Лауреат 1 степени в городском фестивале',
          category: 'ART', direction: 'SKILLS', achievementType: 'CREATIVE', achievementLevel: 'CITY',
          resultType: 'STATUS', resultStatus: 'LAUREATE_1',
          xpRequested: 25, xpAwarded: 25, status: 'APPROVED', achievementDate: '2026-05-05',
          reviewedBy: admin.id, reviewedAt: new Date('2026-05-06'),
        },
        {
          id: 'a12', userId: user5.id, title: 'Хакатон Code Battle', description: '2 место на хакатоне среди школьников',
          category: 'STUDY', direction: 'SKILLS', achievementType: 'OLYMPIAD', achievementLevel: 'CITY',
          resultType: 'PLACEMENT', placement: 2,
          xpRequested: 22, xpAwarded: 22, status: 'APPROVED', achievementDate: '2026-05-12',
          reviewedBy: admin.id, reviewedAt: new Date('2026-05-13'),
        },
        {
          id: 'a13', userId: user6.id, title: 'Благотворительный концерт', description: 'Организовала концерт для сбора средств',
          category: 'COMMUNITY', direction: 'MORALITY', achievementType: 'FREE_FORM',
          xpRequested: 56, xpAwarded: 0, status: 'PENDING', achievementDate: '2026-05-20',
        },
        {
          id: 'a14', userId: user5.id, title: 'Проект "Эко-монитор"', description: 'Разработал прототип мониторинга экологии',
          category: 'OTHER', direction: 'SKILLS', achievementType: 'FREE_FORM',
          xpRequested: 72, xpAwarded: 0, status: 'PENDING', achievementDate: '2026-05-22',
        },
        {
          id: 'a15', userId: user7.id, title: 'ВСОШ по математике', description: '1 место на Всероссийской олимпиаде',
          category: 'STUDY', direction: 'KNOWLEDGE', achievementType: 'OLYMPIAD', achievementLevel: 'ALL_RUSSIAN',
          resultType: 'PLACEMENT', placement: 1,
          xpRequested: 80, xpAwarded: 80, status: 'APPROVED', achievementDate: '2026-03-15',
          reviewedBy: admin.id, reviewedAt: new Date('2026-03-16'),
        },
        {
          id: 'a16', userId: user8.id, title: 'Региональная олимпиада по биологии', description: '1 место в региональной олимпиаде',
          category: 'STUDY', direction: 'KNOWLEDGE', achievementType: 'OLYMPIAD', achievementLevel: 'REGIONAL',
          resultType: 'PLACEMENT', placement: 1,
          xpRequested: 48, xpAwarded: 48, status: 'APPROVED', achievementDate: '2026-04-20',
          reviewedBy: admin.id, reviewedAt: new Date('2026-04-21'),
        },
      ],
    });

    // Create Challenges
    await db.challenge.createMany({
      data: [
        {
          id: 'ch1', title: 'Майский марафон', description: 'Собери 120 XP за май! Все направления засчитываются.',
          direction: 'ALL', xpTarget: 120, rewardXp: 40, startDate: new Date('2026-05-01'), endDate: new Date('2026-05-31'), isActive: true,
        },
      ],
    });

    // Challenge participants
    await db.challengeParticipant.createMany({
      data: [
        { id: 'cp1', userId: student.id, challengeId: 'ch1', xpCollected: 88 },
        { id: 'cp3', userId: user2.id, challengeId: 'ch1', xpCollected: 120, completed: true, completedAt: new Date('2026-05-20') },
      ],
    });

    return NextResponse.json({ success: true, message: 'Seeded successfully!' });
  } catch (error) {
    console.error('Seed error:', error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
