import { db } from '@/lib/db'

const FACULTIES = [
  { id: 'fac_it', name: 'IT', emoji: '💻', color: '#3B82F6' },
  { id: 'fac_sport', name: 'Спорт', emoji: '🏃', color: '#EF4444' },
  { id: 'fac_art', name: 'Творчество', emoji: '🎨', color: '#A855F7' },
  { id: 'fac_science', name: 'Наука', emoji: '🔬', color: '#10B981' },
  { id: 'fac_social', name: 'Общество', emoji: '🤝', color: '#F59E0B' },
]

const USERS = [
  { id: 'u1', telegramId: '1001', name: 'Иван Иванов', username: 'ivan_ivanov', role: 'STUDENT', facultyId: 'fac_it', totalXp: 320, level: 3, statusEmoji: '🏃', statusPrefix: 'Олимпиадник' },
  { id: 'u2', telegramId: '1002', name: 'Мария Петрова', username: 'maria_p', role: 'STUDENT', facultyId: 'fac_science', totalXp: 1250, level: 5, statusEmoji: '🧠', statusPrefix: 'Мастер своего дела' },
  { id: 'u3', telegramId: '1003', name: 'Алексей Сидоров', username: 'alex_s', role: 'STUDENT', facultyId: 'fac_sport', totalXp: 980, level: 4, statusEmoji: '💪', statusPrefix: 'Ботан' },
  { id: 'u4', telegramId: '1004', name: 'Анна Козлова', username: 'anna_k', role: 'STUDENT', facultyId: 'fac_art', totalXp: 280, level: 3, statusEmoji: '🎨', statusPrefix: 'Олимпиадник' },
  { id: 'u5', telegramId: '1005', name: 'Дмитрий Новиков', username: 'dima_n', role: 'STUDENT', facultyId: 'fac_it', totalXp: 210, level: 2, statusEmoji: '💻', statusPrefix: 'Активный' },
  { id: 'u6', telegramId: '1006', name: 'Елена Смирнова', username: 'lena_s', role: 'STUDENT', facultyId: 'fac_social', totalXp: 450, level: 3, statusEmoji: '🤝', statusPrefix: 'Олимпиадник' },
  { id: 'u7', telegramId: '1007', name: 'Ольга Васильева', username: 'olga_v', role: 'ADMIN', facultyId: 'fac_science', totalXp: 0, level: 7, statusEmoji: '⭐', statusPrefix: 'Воспитатель' },
  { id: 'u8', telegramId: '1008', name: 'Павел Морозов', username: 'pavel_m', role: 'ADMIN', facultyId: 'fac_it', totalXp: 0, level: 7, statusEmoji: '🛡️', statusPrefix: 'Админ' },
]

const ACHIEVEMENTS = [
  { id: 'a1', userId: 'u1', title: 'Олимпиада по математике', description: 'Занял 1 место в школьной олимпиаде по математике среди 8-х классов', category: 'STUDY', direction: 'KNOWLEDGE', xpRequested: 15, xpAwarded: 15, status: 'APPROVED', achievementDate: '2026-05-15', reviewComment: 'Отличный результат! Поздравляем!', reviewedBy: 'u7', reviewedAt: new Date('2026-05-16') },
  { id: 'a2', userId: 'u1', title: 'Конкурс рисунков', description: 'Рисунок "Весна" на конкурсе творческих работ', category: 'ART', direction: null, xpRequested: 10, xpAwarded: 0, status: 'PENDING', achievementDate: '2026-05-10' },
  { id: 'a3', userId: 'u1', title: 'Чтение 5 книг за месяц', description: 'Прочитал 5 книг за апрель', category: 'OTHER', direction: 'KNOWLEDGE', xpRequested: 8, xpAwarded: 0, status: 'REJECTED', achievementDate: '2026-05-05', reviewComment: 'Нужно указать названия книг', reviewedBy: 'u7', reviewedAt: new Date('2026-05-06') },
  { id: 'a4', userId: 'u2', title: 'Победитель ВСОШ по физике', description: 'Занял 1 место на Всероссийской олимпиаде школьников по физике', category: 'STUDY', direction: 'KNOWLEDGE', xpRequested: 20, xpAwarded: 20, status: 'APPROVED', achievementDate: '2026-04-20', reviewedBy: 'u8', reviewedAt: new Date('2026-04-21') },
  { id: 'a5', userId: 'u3', title: 'Чемпионат по плаванию', description: '2 место в городских соревнованиях по плаванию', category: 'SPORT', direction: 'WILL', xpRequested: 15, xpAwarded: 15, status: 'APPROVED', achievementDate: '2026-04-15', reviewedBy: 'u7', reviewedAt: new Date('2026-04-16') },
  { id: 'a6', userId: 'u4', title: 'Фестиваль танца', description: 'Участие в областном фестивале танца с коллективом', category: 'ART', direction: null, xpRequested: 10, xpAwarded: 10, status: 'APPROVED', achievementDate: '2026-05-01', reviewedBy: 'u7', reviewedAt: new Date('2026-05-02') },
  { id: 'a7', userId: 'u5', title: 'Хакатон Code Battle', description: '3 место на хакатоне Code Battle среди школьников', category: 'STUDY', direction: 'SKILLS', xpRequested: 12, xpAwarded: 12, status: 'APPROVED', achievementDate: '2026-05-12', reviewedBy: 'u8', reviewedAt: new Date('2026-05-13') },
  { id: 'a8', userId: 'u1', title: 'Волонтёр в приюте', description: 'Помогал в приюте для животных 2 выходных', category: 'COMMUNITY', direction: 'COMMUNITY', xpRequested: 10, xpAwarded: 10, status: 'APPROVED', achievementDate: '2026-04-28', reviewedBy: 'u7', reviewedAt: new Date('2026-04-29') },
  { id: 'a9', userId: 'u6', title: 'Куратор первокурсников', description: 'Помогал адаптироваться новичкам в лицее', category: 'COMMUNITY', direction: 'COMMUNITY', xpRequested: 12, xpAwarded: 12, status: 'APPROVED', achievementDate: '2026-05-18', reviewedBy: 'u7', reviewedAt: new Date('2026-05-19') },
  { id: 'a10', userId: 'u2', title: 'Марофон "Читатель"', description: 'Прочитал 10 книг за квартал', category: 'OTHER', direction: 'KNOWLEDGE', xpRequested: 15, xpAwarded: 0, status: 'PENDING', achievementDate: '2026-05-20' },
  { id: 'a11', userId: 'u4', title: 'Школьный спектакль', description: 'Сыграл главную роль в школьном спектакле', category: 'ART', direction: null, xpRequested: 12, xpAwarded: 0, status: 'PENDING', achievementDate: '2026-05-19' },
  { id: 'a12', userId: 'u3', title: 'Организация турнира', description: 'Организовал внутришкольный турнир по шахматам', category: 'COMMUNITY', direction: 'SKILLS', xpRequested: 8, xpAwarded: 0, status: 'PENDING', achievementDate: '2026-05-21' },
  { id: 'a13', userId: 'u5', title: 'Проект "Эко-монитор"', description: 'Разработал прототип мониторинга экологии', category: 'OTHER', direction: 'SKILLS', xpRequested: 18, xpAwarded: 0, status: 'PENDING', achievementDate: '2026-05-22' },
  { id: 'a14', userId: 'u6', title: 'Благотворительный концерт', description: 'Организовала концерт для сбора средств', category: 'COMMUNITY', direction: 'MORALITY', xpRequested: 14, xpAwarded: 0, status: 'PENDING', achievementDate: '2026-05-20' },
]

const BADGES = [
  { id: 'b1', name: 'Первый шаг', description: 'Загрузить первое достижение', emoji: '🌱', conditionType: 'FIRST_ACHIEVEMENT', conditionValue: 1 },
  { id: 'b2', name: 'Всем лицеистам лицеист', description: '1 место в рейтинге', emoji: '👑', conditionType: 'RANK_FIRST', conditionValue: 1 },
  { id: 'b3', name: 'Олимпийский резерв', description: '500+ XP в Знании', emoji: '🧠', conditionType: 'XP_THRESHOLD_KNOWLEDGE', conditionValue: 500 },
  { id: 'b4', name: 'Железная воля', description: '300+ XP в Воле', emoji: '💪', conditionType: 'XP_THRESHOLD_WILL', conditionValue: 300 },
  { id: 'b5', name: 'Многорукий Шива', description: 'Достижения в 4+ категориях', emoji: '🦑', conditionType: 'MULTI_CATEGORY', conditionValue: 4 },
  { id: 'b6', name: 'Наставник', description: '100+ XP в Сообществе', emoji: '🤝', conditionType: 'XP_THRESHOLD_COMMUNITY', conditionValue: 100 },
  { id: 'b7', name: 'Месячный марафонец', description: '50+ XP за месяц', emoji: '🏃', conditionType: 'MONTHLY_XP', conditionValue: 50 },
  { id: 'b8', name: 'Мастер на все руки', description: '200+ XP в 3+ направлениях', emoji: '🛠️', conditionType: 'DIRECTION_BALANCE', conditionValue: 200 },
  { id: 'b9', name: 'Золотое перо', description: '10+ одобренных достижений', emoji: '✒️', conditionType: 'ACHIEVEMENT_COUNT', conditionValue: 10 },
  { id: 'b10', name: 'Легенда лицея', description: 'Достичь 7 уровня', emoji: '🌟', conditionType: 'LEVEL_REACHED', conditionValue: 7 },
]

const USER_BADGES = [
  { id: 'ub1', userId: 'u1', badgeId: 'b1', earnedAt: new Date('2026-04-01') },
  { id: 'ub2', userId: 'u1', badgeId: 'b5', earnedAt: new Date('2026-05-10') },
  { id: 'ub3', userId: 'u1', badgeId: 'b7', earnedAt: new Date('2026-05-15') },
  { id: 'ub4', userId: 'u2', badgeId: 'b1', earnedAt: new Date('2026-03-01') },
  { id: 'ub5', userId: 'u2', badgeId: 'b2', earnedAt: new Date('2026-05-01') },
  { id: 'ub6', userId: 'u2', badgeId: 'b3', earnedAt: new Date('2026-04-15') },
  { id: 'ub7', userId: 'u2', badgeId: 'b9', earnedAt: new Date('2026-05-10') },
  { id: 'ub8', userId: 'u3', badgeId: 'b1', earnedAt: new Date('2026-02-15') },
  { id: 'ub9', userId: 'u3', badgeId: 'b4', earnedAt: new Date('2026-05-01') },
  { id: 'ub10', userId: 'u4', badgeId: 'b1', earnedAt: new Date('2026-03-20') },
]

const CHALLENGES = [
  { id: 'ch1', title: 'Майский марафон', description: 'Собери 50 XP за май! Все направления засчитываются.', direction: 'ALL', xpTarget: 50, rewardXp: 20, startDate: new Date('2026-05-01'), endDate: new Date('2026-05-31'), isActive: true },
  { id: 'ch2', title: 'Всестороннее развитие', description: 'Получи XP минимум в 4 направлениях за месяц', direction: 'ALL', xpTarget: 40, rewardXp: 30, startDate: new Date('2026-05-01'), endDate: new Date('2026-05-31'), isActive: true },
  { id: 'ch3', title: 'Командный дух', description: 'Факультет суммарно набирает 2000 XP', direction: 'ALL', xpTarget: 2000, rewardXp: 50, startDate: new Date('2026-05-01'), endDate: new Date('2026-06-01'), isActive: true },
  { id: 'ch4', title: 'Знаток', description: 'Набери 30 XP в направлении Знание за май', direction: 'KNOWLEDGE', xpTarget: 30, rewardXp: 15, startDate: new Date('2026-05-01'), endDate: new Date('2026-05-31'), isActive: true },
]

const CHALLENGE_PARTICIPANTS = [
  { id: 'cp1', userId: 'u1', challengeId: 'ch1', xpCollected: 45, completed: false },
  { id: 'cp2', userId: 'u1', challengeId: 'ch2', xpCollected: 25, completed: false },
  { id: 'cp3', userId: 'u2', challengeId: 'ch1', xpCollected: 50, completed: true, completedAt: new Date('2026-05-20') },
  { id: 'cp4', userId: 'u3', challengeId: 'ch1', xpCollected: 30, completed: false },
  { id: 'cp5', userId: 'u4', challengeId: 'ch1', xpCollected: 20, completed: false },
]

async function seed() {
  console.log('Seeding database...')

  // Clear existing data
  await db.challengeParticipant.deleteMany()
  await db.achievementBadge.deleteMany()
  await db.userBadge.deleteMany()
  await db.badge.deleteMany()
  await db.achievement.deleteMany()
  await db.challenge.deleteMany()
  await db.user.deleteMany()
  await db.faculty.deleteMany()

  // Create faculties
  for (const f of FACULTIES) {
    await db.faculty.create({ data: f })
  }

  // Create users
  for (const u of USERS) {
    await db.user.create({ data: u })
  }

  // Create achievements
  for (const a of ACHIEVEMENTS) {
    await db.achievement.create({
      data: {
        id: a.id,
        userId: a.userId,
        title: a.title,
        description: a.description,
        category: a.category,
        direction: a.direction,
        xpRequested: a.xpRequested,
        xpAwarded: a.xpAwarded,
        status: a.status,
        achievementDate: a.achievementDate,
        reviewComment: a.reviewComment || null,
        reviewedBy: a.reviewedBy || null,
        reviewedAt: a.reviewedAt || null,
      }
    })
  }

  // Create badges
  for (const b of BADGES) {
    await db.badge.create({ data: b })
  }

  // Create user badges
  for (const ub of USER_BADGES) {
    await db.userBadge.create({ data: ub })
  }

  // Create challenges
  for (const ch of CHALLENGES) {
    await db.challenge.create({ data: ch })
  }

  // Create challenge participants
  for (const cp of CHALLENGE_PARTICIPANTS) {
    await db.challengeParticipant.create({ data: cp })
  }

  console.log('Seeding complete!')
}

seed()
  .catch(console.error)
  .finally(() => db.$disconnect())
