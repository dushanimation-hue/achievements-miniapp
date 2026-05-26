import { db } from '@/lib/db'

const USERS = [
  { id: 'u1', telegramId: '1001', name: 'Иван Иванов', username: 'ivan_ivanov', role: 'STUDENT', totalXp: 22, level: 3, league: 'bronze', statusEmoji: '', statusPrefix: 'Олимпиадник' },
  { id: 'u2', telegramId: '1002', name: 'Мария Петрова', username: 'maria_p', role: 'STUDENT', totalXp: 40, level: 2, league: 'bronze', statusEmoji: '', statusPrefix: 'Активный' },
  { id: 'u3', telegramId: '1003', name: 'Алексей Сидоров', username: 'alex_s', role: 'STUDENT', totalXp: 12, level: 2, league: 'bronze', statusEmoji: '', statusPrefix: 'Активный' },
  { id: 'u4', telegramId: '1004', name: 'Анна Козлова', username: 'anna_k', role: 'STUDENT', totalXp: 6, level: 1, league: 'bronze', statusEmoji: '', statusPrefix: 'Новичок' },
  { id: 'u5', telegramId: '1005', name: 'Дмитрий Новиков', username: 'dima_n', role: 'STUDENT', totalXp: 6, level: 1, league: 'bronze', statusEmoji: '', statusPrefix: 'Новичок' },
  { id: 'u6', telegramId: '1006', name: 'Елена Смирнова', username: 'lena_s', role: 'STUDENT', totalXp: 0, level: 1, league: 'bronze', statusEmoji: '', statusPrefix: 'Новичок' },
  { id: 'u7', telegramId: '1007', name: 'Павел Морозов', username: 'pavel_m', role: 'STUDENT', totalXp: 20, level: 2, league: 'bronze', statusEmoji: '', statusPrefix: 'Активный' },
  { id: 'u8', telegramId: '1008', name: 'Софья Волкова', username: 'sofa_v', role: 'STUDENT', totalXp: 12, level: 2, league: 'bronze', statusEmoji: '', statusPrefix: 'Активный' },
  { id: 'u_admin', telegramId: 'admin_tg', login: 'Desmont', password: 'Desm00nt$', name: 'Денис Картузов', username: 'desmont', role: 'ADMIN', totalXp: 0, level: 7, league: 'gold', statusEmoji: '', statusPrefix: 'Администратор' },
  { id: 'u_student', telegramId: 'student_tg', login: 'student', password: 'student123', name: 'Иван Иванов', username: 'ivan_i', role: 'STUDENT', totalXp: 22, level: 3, league: 'bronze', statusEmoji: '', statusPrefix: 'Олимпиадник', fullName: 'Иванов Иван Иванович', classYear: 9, classLetter: 'А', schoolCode: '11607L' },
]

const ACHIEVEMENTS = [
  {
    id: 'a1', userId: 'u_student', title: 'Олимпиада по математике', description: 'Занял 1 место в школьной олимпиаде',
    category: 'STUDY', direction: 'KNOWLEDGE', achievementType: 'OLYMPIAD', achievementLevel: 'SCHOOL',
    resultType: 'PLACEMENT', placement: 1,
    xpRequested: 2, xpAwarded: 2, status: 'APPROVED', achievementDate: '2026-05-15',
    reviewedBy: 'u_admin', reviewedAt: new Date('2026-05-16'),
  },
  {
    id: 'a2', userId: 'u_student', title: 'Конкурс чтецов', description: 'Призёр в районном конкурсе чтецов',
    category: 'ART', direction: 'SKILLS', achievementType: 'CREATIVE', achievementLevel: 'DISTRICT',
    resultType: 'STATUS', resultStatus: 'PRIZEWINNER',
    xpRequested: 2, xpAwarded: 0, status: 'PENDING', achievementDate: '2026-05-10',
  },
  {
    id: 'a3', userId: 'u_student', title: 'Чтение 5 книг за месяц', description: 'Прочитал 5 книг за апрель',
    category: 'OTHER', direction: 'KNOWLEDGE', achievementType: 'FREE_FORM',
    xpRequested: 8, xpAwarded: 0, status: 'REJECTED', achievementDate: '2026-05-05',
    reviewComment: 'Нужно указать названия книг', reviewedBy: 'u_admin', reviewedAt: new Date('2026-05-06'),
  },
  {
    id: 'a4', userId: 'u_student', title: 'Чемпионат по плаванию', description: '2 место в городских соревнованиях',
    category: 'SPORT', direction: 'WILL', achievementType: 'SPORT', achievementLevel: 'CITY',
    resultType: 'PLACEMENT', placement: 2,
    xpRequested: 6, xpAwarded: 6, status: 'APPROVED', achievementDate: '2026-05-01',
    reviewedBy: 'u_admin', reviewedAt: new Date('2026-05-02'),
  },
  {
    id: 'a5', userId: 'u_student', title: 'Волонтёр в приюте', description: 'Помогал в приюте для животных',
    category: 'COMMUNITY', direction: 'COMMUNITY', achievementType: 'FREE_FORM',
    xpRequested: 10, xpAwarded: 10, status: 'APPROVED', achievementDate: '2026-04-28',
    reviewedBy: 'u_admin', reviewedAt: new Date('2026-04-29'),
  },
  {
    id: 'a6', userId: 'u_student', title: 'ВСОШ по информатике', description: 'Победитель регионального этапа ВСОШ',
    category: 'STUDY', direction: 'KNOWLEDGE', achievementType: 'OLYMPIAD', achievementLevel: 'REGIONAL',
    resultType: 'STATUS', resultStatus: 'WINNER',
    xpRequested: 10, xpAwarded: 4, status: 'APPROVED', achievementDate: '2026-04-20',
    reviewedBy: 'u_admin', reviewedAt: new Date('2026-04-21'),
  },
  {
    id: 'a7', userId: 'u1', title: 'ВСОШ по физике', description: '1 место на Всероссийской олимпиаде',
    category: 'STUDY', direction: 'KNOWLEDGE', achievementType: 'OLYMPIAD', achievementLevel: 'ALL_RUSSIAN',
    resultType: 'PLACEMENT', placement: 1,
    xpRequested: 20, xpAwarded: 20, status: 'APPROVED', achievementDate: '2026-04-15',
    reviewedBy: 'u_admin', reviewedAt: new Date('2026-04-16'),
  },
  {
    id: 'a8', userId: 'u2', title: 'Чемпионат по лёгкой атлетике', description: '1 место в региональных соревнованиях',
    category: 'SPORT', direction: 'WILL', achievementType: 'SPORT', achievementLevel: 'REGIONAL',
    resultType: 'PLACEMENT', placement: 1,
    xpRequested: 12, xpAwarded: 12, status: 'APPROVED', achievementDate: '2026-05-10',
    reviewedBy: 'u_admin', reviewedAt: new Date('2026-05-11'),
  },
  {
    id: 'a9', userId: 'u3', title: 'Фестиваль танца', description: 'Лауреат 1 степени в городском фестивале',
    category: 'ART', direction: 'SKILLS', achievementType: 'CREATIVE', achievementLevel: 'CITY',
    resultType: 'STATUS', resultStatus: 'LAUREATE_1',
    xpRequested: 6, xpAwarded: 6, status: 'APPROVED', achievementDate: '2026-05-05',
    reviewedBy: 'u_admin', reviewedAt: new Date('2026-05-06'),
  },
  {
    id: 'a10', userId: 'u4', title: 'Хакатон Code Battle', description: '2 место на хакатоне среди школьников',
    category: 'STUDY', direction: 'SKILLS', achievementType: 'OLYMPIAD', achievementLevel: 'CITY',
    resultType: 'PLACEMENT', placement: 2,
    xpRequested: 6, xpAwarded: 6, status: 'APPROVED', achievementDate: '2026-05-12',
    reviewedBy: 'u_admin', reviewedAt: new Date('2026-05-13'),
  },
  {
    id: 'a11', userId: 'u5', title: 'Проект "Эко-монитор"', description: 'Разработал прототип мониторинга экологии',
    category: 'OTHER', direction: 'SKILLS', achievementType: 'FREE_FORM',
    xpRequested: 6, xpAwarded: 6, status: 'APPROVED', achievementDate: '2026-05-10',
    reviewedBy: 'u_admin', reviewedAt: new Date('2026-05-11'),
  },
  {
    id: 'a12', userId: 'u6', title: 'Благотворительный концерт', description: 'Организовала концерт для сбора средств',
    category: 'COMMUNITY', direction: 'MORALITY', achievementType: 'FREE_FORM',
    xpRequested: 14, xpAwarded: 0, status: 'PENDING', achievementDate: '2026-05-20',
  },
  {
    id: 'a13', userId: 'u7', title: 'ВСОШ по математике', description: '1 место на Всероссийской олимпиаде',
    category: 'STUDY', direction: 'KNOWLEDGE', achievementType: 'OLYMPIAD', achievementLevel: 'ALL_RUSSIAN',
    resultType: 'PLACEMENT', placement: 1,
    xpRequested: 20, xpAwarded: 20, status: 'APPROVED', achievementDate: '2026-03-15',
    reviewedBy: 'u_admin', reviewedAt: new Date('2026-03-16'),
  },
  {
    id: 'a14', userId: 'u8', title: 'Региональная олимпиада по биологии', description: '1 место в региональной олимпиаде',
    category: 'STUDY', direction: 'KNOWLEDGE', achievementType: 'OLYMPIAD', achievementLevel: 'REGIONAL',
    resultType: 'PLACEMENT', placement: 1,
    xpRequested: 12, xpAwarded: 12, status: 'APPROVED', achievementDate: '2026-04-20',
    reviewedBy: 'u_admin', reviewedAt: new Date('2026-04-21'),
  },
]

const BADGES = [
  { id: 'b1', name: 'Первый шаг', emoji: '🌱', description: 'Загрузить первое достижение', conditionType: 'FIRST_ACHIEVEMENT', conditionValue: 1 },
  { id: 'b2', name: 'Лидер', emoji: '👑', description: '1 место в рейтинге', conditionType: 'RANK_FIRST', conditionValue: 1 },
  { id: 'b3', name: 'Олимпийский резерв', emoji: '🧠', description: '100+ XP в Знании', conditionType: 'XP_THRESHOLD_KNOWLEDGE', conditionValue: 100 },
  { id: 'b4', name: 'Железная воля', emoji: '💪', description: '50+ XP в Воле', conditionType: 'XP_THRESHOLD_WILL', conditionValue: 50 },
  { id: 'b5', name: 'Чемпион', emoji: '🏆', description: 'Занять 1 место в соревновании', conditionType: 'FIRST_PLACE', conditionValue: 1 },
  { id: 'b6', name: 'Олимпиадник', emoji: '🧪', description: 'Отправить достижение типа РЭШ/ВСОШ', conditionType: 'TYPE_OLYMPIAD', conditionValue: 1 },
  { id: 'b7', name: 'Творец', emoji: '🎨', description: 'Отправить творческое достижение', conditionType: 'TYPE_CREATIVE', conditionValue: 1 },
  { id: 'b8', name: 'Спортсмен', emoji: '🏃', description: 'Отправить спортивное достижение', conditionType: 'TYPE_SPORT', conditionValue: 1 },
  { id: 'b9', name: 'Многорукий', emoji: '🐙', description: 'Получить XP во всех 5 направлениях', conditionType: 'ALL_DIRECTIONS', conditionValue: 5 },
  { id: 'b10', name: 'На все руки', emoji: '🤹', description: 'Иметь достижения всех 4 типов', conditionType: 'ALL_TYPES', conditionValue: 4 },
  { id: 'b11', name: 'Золотая лига', emoji: '🥇', description: 'Достичь Золотой лиги', conditionType: 'LEAGUE_GOLD', conditionValue: 1 },
  { id: 'b12', name: 'Серебряная лига', emoji: '🥈', description: 'Достичь Серебряной лиги', conditionType: 'LEAGUE_SILVER', conditionValue: 1 },
  { id: 'b13', name: 'Ботан', emoji: '📚', description: 'Достичь 4 уровня', conditionType: 'LEVEL_4', conditionValue: 4 },
  { id: 'b14', name: 'Легенда', emoji: '⚡', description: 'Достичь 7 уровня', conditionType: 'LEVEL_7', conditionValue: 7 },
  { id: 'b15', name: 'Волонтёр', emoji: '🤝', description: 'Отправить достижение в Сообщество', conditionType: 'TYPE_COMMUNITY', conditionValue: 1 },
]

const USER_BADGES = [
  { id: 'ub1', userId: 'u_student', badgeId: 'b1' },
  { id: 'ub2', userId: 'u_student', badgeId: 'b4' },
  { id: 'ub3', userId: 'u_student', badgeId: 'b5' },
  { id: 'ub4', userId: 'u_student', badgeId: 'b6' },
  { id: 'ub5', userId: 'u_student', badgeId: 'b7' },
  { id: 'ub6', userId: 'u1', badgeId: 'b1' },
  { id: 'ub7', userId: 'u2', badgeId: 'b1' },
  { id: 'ub8', userId: 'u2', badgeId: 'b2' },
  { id: 'ub9', userId: 'u2', badgeId: 'b3' },
  { id: 'ub10', userId: 'u3', badgeId: 'b1' },
  { id: 'ub11', userId: 'u3', badgeId: 'b4' },
  { id: 'ub12', userId: 'u4', badgeId: 'b1' },
  { id: 'ub13', userId: 'u7', badgeId: 'b1' },
]

const CHALLENGES = [
  { id: 'ch1', title: 'Майский марафон', description: 'Собери 30 XP за май! Все направления засчитываются.', direction: 'KNOWLEDGE', xpTarget: 30, rewardXp: 10, startDate: new Date('2026-05-01'), endDate: new Date('2026-05-31'), isActive: true },
  { id: 'ch2', title: 'Первый триместр', description: 'Набери 50 очков за первый триместр — покажи свою целеустремлённость!', direction: 'WILL', xpTarget: 50, rewardXp: 15, startDate: new Date('2026-09-01'), endDate: new Date('2026-11-30'), isActive: true },
  { id: 'ch3', title: 'Мастер навыков', description: 'Заработай 20 XP в направлении Навыки до конца мая.', direction: 'SKILLS', xpTarget: 20, rewardXp: 8, startDate: new Date('2026-05-01'), endDate: new Date('2026-05-31'), isActive: true },
  { id: 'ch4', title: 'Сердце лицея', description: 'Набери 15 XP в направлении Сообщество — помогай другим!', direction: 'COMMUNITY', xpTarget: 15, rewardXp: 5, startDate: new Date('2026-05-01'), endDate: new Date('2026-06-30'), isActive: true },
  { id: 'ch5', title: 'Олимпийский резерв', description: 'Собери 40 XP только за олимпиады (РЭШ/ВСОШ) до конца года.', direction: 'KNOWLEDGE', xpTarget: 40, rewardXp: 20, startDate: new Date('2026-01-01'), endDate: new Date('2026-12-31'), isActive: true },
]

const CHALLENGE_PARTICIPANTS = [
  { id: 'cp1', userId: 'u_student', challengeId: 'ch1', xpCollected: 22 },
  { id: 'cp2', userId: 'u_student', challengeId: 'ch2', xpCollected: 0 },
  { id: 'cp3', userId: 'u2', challengeId: 'ch1', xpCollected: 30, completed: true, completedAt: new Date('2026-05-20') },
  { id: 'cp4', userId: 'u1', challengeId: 'ch1', xpCollected: 20 },
  { id: 'cp5', userId: 'u1', challengeId: 'ch5', xpCollected: 40, completed: true, completedAt: new Date('2026-05-15') },
  { id: 'cp6', userId: 'u7', challengeId: 'ch1', xpCollected: 20 },
  { id: 'cp7', userId: 'u3', challengeId: 'ch3', xpCollected: 6 },
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

  // Create users
  for (const u of USERS) {
    await db.user.create({ data: u })
  }

  // Create achievements
  for (const a of ACHIEVEMENTS) {
    await db.achievement.create({ data: a })
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

  // Create faculties
  const faculties = [
    { name: 'Атос', emoji: '🗡️', color: '#007AFF' },
    { name: 'Портос', emoji: '🏰', color: '#FF9F0A' },
    { name: 'Арамис', emoji: '⚔️', color: '#5856D6' },
  ]
  for (const f of faculties) {
    await db.faculty.upsert({
      where: { name: f.name },
      update: {},
      create: f,
    })
  }

  console.log('Seeding complete!')
}

seed()
  .catch(console.error)
  .finally(() => db.$disconnect())
