'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'

/* ============================================================
   TYPES
   ============================================================ */

interface Faculty { id: string; name: string; emoji: string; color: string }
interface UserProfile {
  id: string; name: string; username: string | null; role: string;
  totalXp: number; level: number; levelName: string; xpInLevel: number;
  xpToNextLevel: number; nextLevelXp: number | null; nextLevelName: string | null;
  statusEmoji: string; statusPrefix: string; faculty: Faculty | null;
}
interface Achievement {
  id: string; title: string; description: string | null; category: string;
  direction: string | null; xpRequested: number; xpAwarded: number;
  status: string; achievementDate: string | null; comment: string | null;
  reviewComment: string | null; reviewedBy: string | null; reviewedAt: string | null;
  createdAt: string;
  user?: { id: string; name: string; username: string | null; statusEmoji: string; faculty?: Faculty | null }
}
interface BadgeItem {
  id: string; name: string; description: string; emoji: string;
  conditionType: string; conditionValue: number;
  earned: boolean; earnedAt: string | null;
}
interface ChallengeItem {
  id: string; title: string; description: string; direction: string;
  xpTarget: number; rewardXp: number; startDate: string; endDate: string;
  isActive: boolean; isJoined: boolean; xpCollected: number;
  completed: boolean; completedAt: string | null;
}
interface LeaderboardEntry {
  rank: number; id: string; name: string; username: string | null;
  totalXp: number; level: number; statusEmoji: string; statusPrefix: string;
  faculty: Faculty | null; achievementCount: number;
}
interface LevelInfo { level: number; name: string; min: number; max: number }

/* ============================================================
   CONSTANTS
   ============================================================ */

const LEVELS: LevelInfo[] = [
  { level: 1, name: 'Новичок', min: 0, max: 99 },
  { level: 2, name: 'Искатель', min: 100, max: 249 },
  { level: 3, name: 'Исследователь', min: 250, max: 499 },
  { level: 4, name: 'Оправданный', min: 500, max: 999 },
  { level: 5, name: 'Мастер', min: 1000, max: 1999 },
  { level: 6, name: 'Элита', min: 2000, max: 4999 },
  { level: 7, name: 'Легенда', min: 5000, max: 999999 },
]

const CATEGORY_MAP: Record<string, { emoji: string; label: string }> = {
  SPORT: { emoji: '🏃', label: 'Спорт' },
  STUDY: { emoji: '📚', label: 'Учёба' },
  ART: { emoji: '🎨', label: 'Творчество' },
  COMMUNITY: { emoji: '👥', label: 'Общество' },
  OTHER: { emoji: '🌟', label: 'Другое' },
}

const DIRECTION_MAP: Record<string, { emoji: string; label: string }> = {
  KNOWLEDGE: { emoji: '🧠', label: 'Знание' },
  WILL: { emoji: '💪', label: 'Воля' },
  SKILLS: { emoji: '🛠', label: 'Навыки' },
  COMMUNITY: { emoji: '🤝', label: 'Сообщество' },
  MORALITY: { emoji: '⭐', label: 'Нравственность' },
}

const STATUS_CONFIG: Record<string, { emoji: string; label: string; color: string }> = {
  APPROVED: { emoji: '✅', label: 'Одобрено', color: 'text-emerald-600' },
  PENDING: { emoji: '⏳', label: 'На проверке', color: 'text-amber-600' },
  REJECTED: { emoji: '❌', label: 'Отклонено', color: 'text-red-500' },
}

type Tab = 'home' | 'add' | 'rating' | 'activities' | 'profile'

/* ============================================================
   HELPER COMPONENTS
   ============================================================ */

function XpProgressBar({ current, max, className = '' }: { current: number; max: number; className?: string }) {
  const pct = max > 0 ? Math.min((current / max) * 100, 100) : 0
  return (
    <div className={`w-full bg-gray-200 rounded-full h-3 overflow-hidden ${className}`}>
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{
          width: `${pct}%`,
          background: 'linear-gradient(90deg, #10B981, #14B8A6)',
        }}
      />
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.PENDING
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium ${cfg.color}`}>
      {cfg.emoji} {cfg.label}
    </span>
  )
}

function CategoryTag({ category }: { category: string }) {
  const cfg = CATEGORY_MAP[category] || CATEGORY_MAP.OTHER
  return (
    <span className="inline-flex items-center gap-1 text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full">
      {cfg.emoji} {cfg.label}
    </span>
  )
}

/* ============================================================
   MAIN APP
   ============================================================ */

export default function Home() {
  const [currentTab, setCurrentTab] = useState<Tab>('home')
  const [userId, setUserId] = useState('u1')
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [recentAchievements, setRecentAchievements] = useState<Achievement[]>([])
  const [achievementCounts, setAchievementCounts] = useState({ total: 0, APPROVED: 0, PENDING: 0, REJECTED: 0 })
  const [xpByDirection, setXpByDirection] = useState<Record<string, number>>({})
  const [userBadges, setUserBadges] = useState<BadgeItem[]>([])
  const [levelRoadmap, setLevelRoadmap] = useState<LevelInfo[]>(LEVELS)
  const [allAchievements, setAllAchievements] = useState<Achievement[]>([])
  const [badges, setBadges] = useState<BadgeItem[]>([])
  const [challenges, setChallenges] = useState<ChallengeItem[]>([])
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(false)

  // Add achievement form state
  const [formTitle, setFormTitle] = useState('')
  const [formDesc, setFormDesc] = useState('')
  const [formCategory, setFormCategory] = useState('')
  const [formDirection, setFormDirection] = useState('')
  const [formXp, setFormXp] = useState(5)
  const [formDate, setFormDate] = useState('')
  const [formComment, setFormComment] = useState('')

  // Sub-tab for activities
  const [activityTab, setActivityTab] = useState<'badges' | 'challenges'>('badges')

  // Rating filters
  const [ratingDirection, setRatingDirection] = useState('ALL')
  const [ratingFaculty, setRatingFaculty] = useState('all')
  const [ratingPeriod, setRatingPeriod] = useState('all')

  // Achievement detail modal
  const [selectedAchievement, setSelectedAchievement] = useState<Achievement | null>(null)

  // Admin panel
  const [showAdmin, setShowAdmin] = useState(false)
  const [pendingAchievements, setPendingAchievements] = useState<Achievement[]>([])
  const [adminStats, setAdminStats] = useState<Record<string, unknown> | null>(null)

  const fetchProfile = useCallback(async () => {
    try {
      const res = await fetch(`/api/profile?userId=${userId}`)
      if (!res.ok) return
      const data = await res.json()
      setProfile(data.user)
      setRecentAchievements(data.recentAchievements || [])
      setAchievementCounts(data.achievementCounts || { total: 0, APPROVED: 0, PENDING: 0, REJECTED: 0 })
      setXpByDirection(data.xpByDirection || {})
      setUserBadges(data.badges || [])
      setLevelRoadmap(data.levelRoadmap || LEVELS)
    } catch (e) {
      console.error('Profile fetch error:', e)
    }
  }, [userId])

  const fetchAchievements = useCallback(async () => {
    try {
      const res = await fetch(`/api/achievements?userId=${userId}`)
      if (!res.ok) return
      const data = await res.json()
      setAllAchievements(data.achievements || [])
    } catch (e) {
      console.error('Achievements fetch error:', e)
    }
  }, [userId])

  const fetchBadges = useCallback(async () => {
    try {
      const res = await fetch(`/api/badges?userId=${userId}`)
      if (!res.ok) return
      const data = await res.json()
      setBadges(data.badges || [])
    } catch (e) {
      console.error('Badges fetch error:', e)
    }
  }, [userId])

  const fetchChallenges = useCallback(async () => {
    try {
      const res = await fetch(`/api/challenges?userId=${userId}`)
      if (!res.ok) return
      const data = await res.json()
      setChallenges(data.challenges || [])
    } catch (e) {
      console.error('Challenges fetch error:', e)
    }
  }, [userId])

  const fetchLeaderboard = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (ratingDirection && ratingDirection !== 'ALL') params.set('direction', ratingDirection)
      if (ratingFaculty && ratingFaculty !== 'all') params.set('facultyId', ratingFaculty)
      if (ratingPeriod && ratingPeriod !== 'all') params.set('period', ratingPeriod)
      const res = await fetch(`/api/rating?${params.toString()}`)
      if (!res.ok) return
      const data = await res.json()
      setLeaderboard(data.leaderboard || [])
    } catch (e) {
      console.error('Leaderboard fetch error:', e)
    } finally {
      setLoading(false)
    }
  }, [ratingDirection, ratingFaculty, ratingPeriod])

  const fetchPending = useCallback(async () => {
    try {
      const res = await fetch(`/api/moderate?status=PENDING`)
      if (!res.ok) return
      const data = await res.json()
      setPendingAchievements(data.achievements || [])
    } catch (e) {
      console.error('Pending fetch error:', e)
    }
  }, [])

  const fetchAdminStats = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/stats`)
      if (!res.ok) return
      const data = await res.json()
      setAdminStats(data)
    } catch (e) {
      console.error('Stats fetch error:', e)
    }
  }, [])

  useEffect(() => {
    fetchProfile()
    fetchAchievements()
  }, [fetchProfile, fetchAchievements])

  useEffect(() => {
    if (currentTab === 'activities') {
      fetchBadges()
      fetchChallenges()
    }
  }, [currentTab, fetchBadges, fetchChallenges])

  useEffect(() => {
    if (currentTab === 'rating') {
      fetchLeaderboard()
    }
  }, [currentTab, fetchLeaderboard])

  useEffect(() => {
    if (showAdmin) {
      fetchPending()
      fetchAdminStats()
    }
  }, [showAdmin, fetchPending, fetchAdminStats])

  const handleAddAchievement = async () => {
    if (!formTitle || !formCategory) {
      toast.error('Заполните название и категорию')
      return
    }
    try {
      const body: Record<string, unknown> = {
        userId,
        title: formTitle,
        description: formDesc || null,
        category: formCategory,
        xpRequested: formXp,
        achievementDate: formDate || null,
        comment: formComment || null,
      }
      if (formCategory === 'OTHER' && formDirection) {
        body.direction = formDirection
      }
      const res = await fetch('/api/achievements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        toast.error('Ошибка при создании')
        return
      }
      toast.success('Достижение отправлено на проверку! 🎉')
      setFormTitle(''); setFormDesc(''); setFormCategory(''); setFormDirection('');
      setFormXp(5); setFormDate(''); setFormComment('')
      setCurrentTab('home')
      fetchProfile()
      fetchAchievements()
    } catch {
      toast.error('Ошибка сети')
    }
  }

  const handleJoinChallenge = async (challengeId: string) => {
    try {
      const res = await fetch('/api/challenges', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, challengeId }),
      })
      if (!res.ok) return
      toast.success('Вы присоединились к челленджу! 💪')
      fetchChallenges()
    } catch {
      toast.error('Ошибка')
    }
  }

  const handleModerate = async (achievementId: string, action: 'approve' | 'reject', xpAwarded?: number, direction?: string, reviewComment?: string) => {
    try {
      const res = await fetch('/api/moderate', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          achievementId,
          action,
          xpAwarded,
          direction,
          reviewComment,
          adminUserId: userId,
        }),
      })
      if (!res.ok) return
      toast.success(action === 'approve' ? 'Достижение одобрено ✅' : 'Достижение отклонено ❌')
      fetchPending()
      fetchAdminStats()
      fetchProfile()
    } catch {
      toast.error('Ошибка')
    }
  }

  const switchUser = () => {
    const newId = userId === 'u1' ? 'u7' : 'u1'
    setUserId(newId)
    setCurrentTab('home')
    setShowAdmin(false)
  }

  const isAdmin = profile?.role === 'ADMIN'

  /* ============================================================
     RENDER: SCREEN 1 — HOME
     ============================================================ */
  const renderHome = () => (
    <div className="px-4 pb-4 space-y-4">
      {/* Header */}
      <div className="pt-2">
        <h1 className="text-2xl font-bold text-gray-900">
          👋 Привет, {profile?.name || '...'}!
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">
          {profile?.statusEmoji} {profile?.statusPrefix} · {profile?.faculty?.emoji} {profile?.faculty?.name}
        </p>
      </div>

      {/* Level progress card */}
      <div className="bg-white rounded-2xl p-4 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🎯</span>
            <div>
              <div className="font-bold text-gray-900">Уровень {profile?.level}</div>
              <div className="text-xs text-gray-500">{profile?.levelName}</div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-lg font-bold text-emerald-600">{profile?.totalXp} XP</div>
            <div className="text-xs text-gray-400">из {profile?.nextLevelXp || '∞'}</div>
          </div>
        </div>
        <XpProgressBar current={profile?.xpInLevel || 0} max={profile?.xpToNextLevel || 1} />
        {profile?.nextLevelName && (
          <p className="text-xs text-gray-400 mt-1 text-center">
            До «{profile.nextLevelName}» — ещё {(profile.nextLevelXp || 0) - (profile.totalXp)} XP
          </p>
        )}
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-3 gap-2">
        <button
          onClick={() => setCurrentTab('add')}
          className="flex flex-col items-center gap-1 p-3 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow"
        >
          <span className="text-xl">➕</span>
          <span className="text-xs text-gray-600 font-medium">Добавить</span>
        </button>
        <button
          onClick={() => setCurrentTab('profile')}
          className="flex flex-col items-center gap-1 p-3 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow"
        >
          <span className="text-xl">📊</span>
          <span className="text-xs text-gray-600 font-medium">Статистика</span>
        </button>
        <button
          onClick={() => setCurrentTab('rating')}
          className="flex flex-col items-center gap-1 p-3 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow"
        >
          <span className="text-xl">👥</span>
          <span className="text-xs text-gray-600 font-medium">Рейтинг</span>
        </button>
      </div>

      {/* XP by direction */}
      <div className="bg-white rounded-2xl p-4 shadow-sm">
        <h3 className="font-semibold text-gray-900 mb-3">XP по направлениям</h3>
        <div className="space-y-2">
          {Object.entries(DIRECTION_MAP).map(([key, val]) => {
            const xp = xpByDirection[val.label] || 0
            return (
              <div key={key} className="flex items-center gap-2">
                <span className="text-base">{val.emoji}</span>
                <span className="text-xs text-gray-600 w-24">{val.label}</span>
                <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${Math.min((xp / (profile?.totalXp || 1)) * 100, 100)}%`,
                      background: 'linear-gradient(90deg, #10B981, #14B8A6)',
                    }}
                  />
                </div>
                <span className="text-xs font-medium text-gray-700 w-8 text-right">{xp}</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Recent achievements */}
      <div>
        <h3 className="font-semibold text-gray-900 mb-2">Последние достижения</h3>
        <div className="space-y-2">
          {recentAchievements.map((a) => (
            <button
              key={a.id}
              onClick={() => setSelectedAchievement(a)}
              className="w-full text-left bg-white rounded-xl p-3 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-900 truncate">{a.title}</span>
                    <CategoryTag category={a.category} />
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <StatusBadge status={a.status} />
                    {a.status === 'APPROVED' && a.xpAwarded > 0 && (
                      <span className="text-xs font-medium text-emerald-600">+{a.xpAwarded} XP</span>
                    )}
                  </div>
                </div>
                {a.status === 'REJECTED' && a.reviewComment && (
                  <span className="text-xs text-red-400 truncate ml-2 max-w-[120px]">{a.reviewComment}</span>
                )}
              </div>
            </button>
          ))}
          {recentAchievements.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-4">Пока нет достижений</p>
          )}
        </div>
      </div>
    </div>
  )

  /* ============================================================
     RENDER: SCREEN 2 — ADD ACHIEVEMENT
     ============================================================ */
  const renderAddAchievement = () => (
    <div className="px-4 pb-4 space-y-4">
      <h2 className="text-xl font-bold text-gray-900 pt-2">📤 Добавить достижение</h2>

      <div className="bg-white rounded-2xl p-4 shadow-sm space-y-4">
        {/* Title */}
        <div>
          <label className="text-sm font-medium text-gray-700 mb-1 block">Название *</label>
          <input
            type="text"
            value={formTitle}
            onChange={(e) => setFormTitle(e.target.value)}
            placeholder="Олимпиада по математике"
            className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          />
        </div>

        {/* Description */}
        <div>
          <label className="text-sm font-medium text-gray-700 mb-1 block">Описание</label>
          <textarea
            value={formDesc}
            onChange={(e) => setFormDesc(e.target.value)}
            placeholder="Расскажите подробнее..."
            rows={3}
            className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
          />
        </div>

        {/* Category */}
        <div>
          <label className="text-sm font-medium text-gray-700 mb-2 block">Категория</label>
          <div className="grid grid-cols-5 gap-2">
            {Object.entries(CATEGORY_MAP).map(([key, val]) => (
              <button
                key={key}
                onClick={() => { setFormCategory(key); if (key !== 'OTHER') setFormDirection('') }}
                className={`flex flex-col items-center gap-1 p-2 rounded-xl text-xs transition-all ${
                  formCategory === key
                    ? 'bg-emerald-100 border-2 border-emerald-500 text-emerald-700'
                    : 'bg-gray-50 border-2 border-transparent text-gray-600 hover:bg-gray-100'
                }`}
              >
                <span className="text-lg">{val.emoji}</span>
                <span className="font-medium leading-tight text-center">{val.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Direction (if OTHER) */}
        {formCategory === 'OTHER' && (
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">Направление</label>
            <div className="grid grid-cols-5 gap-2">
              {Object.entries(DIRECTION_MAP).map(([key, val]) => (
                <button
                  key={key}
                  onClick={() => setFormDirection(key)}
                  className={`flex flex-col items-center gap-1 p-2 rounded-xl text-xs transition-all ${
                    formDirection === key
                      ? 'bg-amber-100 border-2 border-amber-500 text-amber-700'
                      : 'bg-gray-50 border-2 border-transparent text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <span className="text-lg">{val.emoji}</span>
                  <span className="font-medium leading-tight text-center">{val.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* XP Slider */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-sm font-medium text-gray-700">Запрашиваемый XP</label>
            <span className="text-lg font-bold text-emerald-600">{formXp} XP</span>
          </div>
          <input
            type="range"
            min={1}
            max={20}
            value={formXp}
            onChange={(e) => setFormXp(Number(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
          />
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>1-4: ежедневные</span>
            <span>5-9: мероприятия</span>
            <span>10-19: крупные</span>
            <span>20: ВСОШ</span>
          </div>
        </div>

        {/* File upload placeholder */}
        <div>
          <label className="text-sm font-medium text-gray-700 mb-1 block">Подтверждение</label>
          <div className="border-2 border-dashed border-gray-200 rounded-xl p-4 text-center">
            <span className="text-2xl">📎</span>
            <p className="text-xs text-gray-400 mt-1">Загрузка фото (скоро)</p>
          </div>
        </div>

        {/* Date */}
        <div>
          <label className="text-sm font-medium text-gray-700 mb-1 block">Дата</label>
          <input
            type="date"
            value={formDate}
            onChange={(e) => setFormDate(e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        {/* Comment */}
        <div>
          <label className="text-sm font-medium text-gray-700 mb-1 block">Комментарий</label>
          <textarea
            value={formComment}
            onChange={(e) => setFormComment(e.target.value)}
            placeholder="Дополнительная информация..."
            rows={2}
            className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
          />
        </div>

        {/* Submit */}
        <button
          onClick={handleAddAchievement}
          className="w-full py-3 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-700 transition-colors text-sm"
        >
          Отправить на проверку 🚀
        </button>
      </div>
    </div>
  )

  /* ============================================================
     RENDER: SCREEN 3 — RATING
     ============================================================ */
  const renderRating = () => (
    <div className="px-4 pb-4 space-y-4">
      <h2 className="text-xl font-bold text-gray-900 pt-2">🏆 Рейтинг</h2>

      {/* Period filter */}
      <div className="flex gap-1.5">
        {[
          { key: 'all', label: 'Всё время' },
          { key: 'month', label: 'Месяц' },
          { key: 'quarter', label: 'Квартал' },
          { key: 'year', label: 'Год' },
        ].map((p) => (
          <button
            key={p.key}
            onClick={() => setRatingPeriod(p.key)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              ratingPeriod === p.key ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-600'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Direction filter */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1">
        <button
          onClick={() => setRatingDirection('ALL')}
          className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
            ratingDirection === 'ALL' ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-600'
          }`}
        >
          Все
        </button>
        {Object.entries(DIRECTION_MAP).map(([key, val]) => (
          <button
            key={key}
            onClick={() => setRatingDirection(key)}
            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              ratingDirection === key ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-600'
            }`}
          >
            {val.emoji} {val.label}
          </button>
        ))}
      </div>

      {/* Faculty filter */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1">
        <button
          onClick={() => setRatingFaculty('all')}
          className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
            ratingFaculty === 'all' ? 'bg-amber-500 text-white' : 'bg-gray-100 text-gray-600'
          }`}
        >
          Все факультеты
        </button>
        {['fac_it', 'fac_sport', 'fac_art', 'fac_science', 'fac_social'].map((fid) => {
          const facNames: Record<string, { emoji: string; name: string }> = {
            fac_it: { emoji: '💻', name: 'IT' },
            fac_sport: { emoji: '🏃', name: 'Спорт' },
            fac_art: { emoji: '🎨', name: 'Творчество' },
            fac_science: { emoji: '🔬', name: 'Наука' },
            fac_social: { emoji: '🤝', name: 'Общество' },
          }
          const f = facNames[fid]
          return (
            <button
              key={fid}
              onClick={() => setRatingFaculty(fid)}
              className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                ratingFaculty === fid ? 'bg-amber-500 text-white' : 'bg-gray-100 text-gray-600'
              }`}
            >
              {f.emoji} {f.name}
            </button>
          )
        })}
      </div>

      {/* Leaderboard */}
      {loading ? (
        <div className="text-center py-8 text-gray-400">Загрузка...</div>
      ) : (
        <div className="space-y-2">
          {leaderboard.slice(0, 3).map((entry) => {
            const medals = ['🥇', '🥈', '🥉']
            return (
              <div
                key={entry.id}
                className={`bg-white rounded-2xl p-4 shadow-sm ${
                  entry.id === userId ? 'ring-2 ring-emerald-500' : ''
                } ${entry.rank === 1 ? 'bg-gradient-to-r from-amber-50 to-white' : ''}`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{medals[entry.rank - 1]}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm">{entry.statusEmoji}</span>
                      <span className="font-bold text-gray-900 truncate">{entry.name}</span>
                    </div>
                    <div className="text-xs text-gray-500">
                      {entry.faculty?.emoji} {entry.faculty?.name} · Ур. {entry.level}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-emerald-600">{entry.totalXp} XP</div>
                    <div className="text-xs text-gray-400">{entry.statusPrefix}</div>
                  </div>
                </div>
              </div>
            )
          })}
          {leaderboard.slice(3).map((entry) => (
            <div
              key={entry.id}
              className={`bg-white rounded-xl p-3 shadow-sm flex items-center gap-3 ${
                entry.id === userId ? 'ring-2 ring-emerald-500' : ''
              }`}
            >
              <span className="text-sm font-bold text-gray-400 w-6 text-center">{entry.rank}</span>
              <span className="text-sm">{entry.statusEmoji}</span>
              <span className="flex-1 text-sm font-medium text-gray-900 truncate">{entry.name}</span>
              <span className="text-xs text-gray-400">{entry.faculty?.emoji}</span>
              <span className="text-sm font-bold text-emerald-600">{entry.totalXp} XP</span>
            </div>
          ))}
        </div>
      )}

      {/* User position */}
      {leaderboard.length > 0 && (
        <div className="text-center">
          <span className="text-sm text-gray-500">
            📍 Твоя позиция: #{leaderboard.find((e) => e.id === userId)?.rank || '—'}
          </span>
        </div>
      )}
    </div>
  )

  /* ============================================================
     RENDER: SCREEN 4 — ACTIVITIES
     ============================================================ */
  const renderActivities = () => (
    <div className="px-4 pb-4 space-y-4">
      <h2 className="text-xl font-bold text-gray-900 pt-2">⚡ Активности</h2>

      {/* Sub-tabs */}
      <div className="flex bg-gray-100 rounded-xl p-1">
        <button
          onClick={() => setActivityTab('badges')}
          className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
            activityTab === 'badges' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'
          }`}
        >
          🏅 Ачивки
        </button>
        <button
          onClick={() => setActivityTab('challenges')}
          className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
            activityTab === 'challenges' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'
          }`}
        >
          ⚡ Челленджи
        </button>
      </div>

      {activityTab === 'badges' && (
        <div className="grid grid-cols-2 gap-3">
          {badges.map((b) => (
            <div
              key={b.id}
              className={`rounded-2xl p-4 shadow-sm text-center transition-all ${
                b.earned
                  ? 'bg-white hover:shadow-md'
                  : 'bg-gray-100 opacity-60'
              }`}
            >
              <span className={`text-3xl ${b.earned ? '' : 'grayscale'}`}>{b.emoji}</span>
              <h4 className="text-sm font-semibold text-gray-900 mt-2">{b.name}</h4>
              <p className="text-xs text-gray-500 mt-0.5 leading-tight">{b.description}</p>
              {b.earned && b.earnedAt && (
                <p className="text-xs text-emerald-600 mt-1">
                  ✅ {new Date(b.earnedAt).toLocaleDateString('ru-RU')}
                </p>
              )}
              {!b.earned && (
                <p className="text-xs text-gray-400 mt-1">🔒 Не получен</p>
              )}
            </div>
          ))}
        </div>
      )}

      {activityTab === 'challenges' && (
        <div className="space-y-3">
          {challenges.map((ch) => (
            <div key={ch.id} className="bg-white rounded-2xl p-4 shadow-sm">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900">{ch.title}</h4>
                  <p className="text-xs text-gray-500 mt-0.5">{ch.description}</p>
                </div>
                {ch.completed && <span className="text-xl">✅</span>}
              </div>
              <div className="mt-3">
                <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                  <span>{ch.xpCollected} / {ch.xpTarget} XP</span>
                  <span className="font-medium text-emerald-600">+{ch.rewardXp} XP награда</span>
                </div>
                <XpProgressBar current={ch.xpCollected} max={ch.xpTarget} />
              </div>
              {!ch.isJoined && !ch.completed && (
                <button
                  onClick={() => handleJoinChallenge(ch.id)}
                  className="mt-3 w-full py-2 bg-emerald-600 text-white text-sm font-medium rounded-xl hover:bg-emerald-700 transition-colors"
                >
                  Присоединиться 💪
                </button>
              )}
              {ch.isJoined && !ch.completed && (
                <div className="mt-2 text-xs text-amber-600 font-medium text-center">
                  🏃 В процессе — ещё {ch.xpTarget - ch.xpCollected} XP
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )

  /* ============================================================
     RENDER: SCREEN 5 — PROFILE
     ============================================================ */
  const renderProfile = () => (
    <div className="px-4 pb-4 space-y-4">
      {/* Avatar + Name */}
      <div className="text-center pt-4">
        <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mx-auto text-4xl">
          {profile?.statusEmoji || '👤'}
        </div>
        <h2 className="text-xl font-bold text-gray-900 mt-2">{profile?.name}</h2>
        <p className="text-sm text-gray-500">@{profile?.username}</p>
        <div className="flex items-center justify-center gap-2 mt-1">
          <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-medium">
            {profile?.statusPrefix}
          </span>
          {isAdmin && (
            <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-medium">
              Админ
            </span>
          )}
        </div>
        {profile?.faculty && (
          <span className="inline-flex items-center gap-1 text-xs bg-gray-100 px-3 py-1 rounded-full mt-2">
            {profile.faculty.emoji} {profile.faculty.name}
          </span>
        )}
      </div>

      {/* Level card */}
      <div className="bg-white rounded-2xl p-4 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <div>
            <span className="text-lg font-bold text-gray-900">Уровень {profile?.level}</span>
            <span className="text-sm text-gray-500 ml-2">{profile?.levelName}</span>
          </div>
          <span className="text-xl font-bold text-emerald-600">{profile?.totalXp} XP</span>
        </div>
        <XpProgressBar current={profile?.xpInLevel || 0} max={profile?.xpToNextLevel || 1} />
      </div>

      {/* Statistics */}
      <div className="bg-white rounded-2xl p-4 shadow-sm">
        <h3 className="font-semibold text-gray-900 mb-3">📊 Статистика</h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gray-50 rounded-xl p-3 text-center">
            <div className="text-2xl font-bold text-gray-900">{achievementCounts.total}</div>
            <div className="text-xs text-gray-500">Всего</div>
          </div>
          <div className="bg-emerald-50 rounded-xl p-3 text-center">
            <div className="text-2xl font-bold text-emerald-600">{achievementCounts.APPROVED}</div>
            <div className="text-xs text-gray-500">Одобрено</div>
          </div>
          <div className="bg-amber-50 rounded-xl p-3 text-center">
            <div className="text-2xl font-bold text-amber-600">{achievementCounts.PENDING}</div>
            <div className="text-xs text-gray-500">На проверке</div>
          </div>
          <div className="bg-red-50 rounded-xl p-3 text-center">
            <div className="text-2xl font-bold text-red-500">{achievementCounts.REJECTED}</div>
            <div className="text-xs text-gray-500">Отклонено</div>
          </div>
        </div>
      </div>

      {/* Level roadmap */}
      <div className="bg-white rounded-2xl p-4 shadow-sm">
        <h3 className="font-semibold text-gray-900 mb-3">🗺️ Путь уровней</h3>
        <div className="space-y-2">
          {levelRoadmap.map((lvl) => {
            const isCurrent = lvl.level === profile?.level
            const isPassed = (profile?.level || 0) > lvl.level
            return (
              <div
                key={lvl.level}
                className={`flex items-center gap-3 p-2 rounded-xl ${
                  isCurrent ? 'bg-emerald-50 ring-2 ring-emerald-500' : isPassed ? 'opacity-50' : ''
                }`}
              >
                <span className="text-lg">{isPassed ? '✅' : isCurrent ? '🎯' : '🔒'}</span>
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900">
                    Ур. {lvl.level}: {lvl.name}
                  </div>
                  <div className="text-xs text-gray-500">{lvl.min}–{lvl.max === 999999 ? '∞' : lvl.max} XP</div>
                </div>
                {isCurrent && (
                  <span className="text-xs font-medium text-emerald-600">Вы здесь</span>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* XP Dynamics (mock) */}
      <div className="bg-white rounded-2xl p-4 shadow-sm">
        <h3 className="font-semibold text-gray-900 mb-3">📈 XP по месяцам</h3>
        <div className="flex items-end gap-2 h-24">
          {[
            { m: 'Янв', xp: 0 },
            { m: 'Фев', xp: 0 },
            { m: 'Мар', xp: 8 },
            { m: 'Апр', xp: 20 },
            { m: 'Май', xp: profile?.totalXp || 0 },
          ].map((item, idx) => {
            const maxVal = Math.max(...[0, 0, 8, 20, profile?.totalXp || 0])
            const height = maxVal > 0 ? (item.xp / maxVal) * 100 : 0
            return (
              <div key={idx} className="flex-1 flex flex-col items-center gap-1">
                <div
                  className="w-full rounded-t-lg"
                  style={{
                    height: `${Math.max(height, 4)}%`,
                    background: 'linear-gradient(180deg, #10B981, #14B8A6)',
                    minHeight: '4px',
                  }}
                />
                <span className="text-xs text-gray-400">{item.m}</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* My badges */}
      <div className="bg-white rounded-2xl p-4 shadow-sm">
        <h3 className="font-semibold text-gray-900 mb-3">🏅 Мои бейджи</h3>
        {userBadges.length > 0 ? (
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1">
            {userBadges.map((b) => (
              <div key={b.id} className="shrink-0 text-center w-16">
                <span className="text-2xl">{b.emoji}</span>
                <p className="text-xs text-gray-600 mt-0.5 leading-tight truncate">{b.name}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-400 text-center py-2">Пока нет бейджей</p>
        )}
      </div>

      {/* Admin panel button */}
      {isAdmin && (
        <button
          onClick={() => setShowAdmin(true)}
          className="w-full py-3 bg-red-600 text-white font-semibold rounded-xl hover:bg-red-700 transition-colors text-sm"
        >
          🛡️ Панель администратора
        </button>
      )}

      {/* Switch user */}
      <button
        onClick={switchUser}
        className="w-full py-3 bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200 transition-colors text-sm"
      >
        🔄 Переключить на {userId === 'u1' ? 'Админа (Ольга)' : 'Ученика (Иван)'}
      </button>
    </div>
  )

  /* ============================================================
     RENDER: ACHIEVEMENT DETAIL MODAL
     ============================================================ */
  const renderAchievementDetail = () => {
    if (!selectedAchievement) return null
    const a = selectedAchievement
    const catInfo = CATEGORY_MAP[a.category] || CATEGORY_MAP.OTHER
    const dirInfo = a.direction ? DIRECTION_MAP[a.direction] : null
    const statusCfg = STATUS_CONFIG[a.status] || STATUS_CONFIG.PENDING

    return (
      <div className="fixed inset-0 z-50 bg-black/40 flex items-end justify-center" onClick={() => setSelectedAchievement(null)}>
        <div
          className="bg-white rounded-t-3xl w-full max-w-[430px] max-h-[85vh] overflow-y-auto p-5 space-y-4"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-gray-900 flex-1 pr-4">{a.title}</h3>
            <button onClick={() => setSelectedAchievement(null)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
          </div>

          {/* Photo placeholder */}
          <div className="bg-gray-100 rounded-2xl h-40 flex items-center justify-center">
            <span className="text-5xl">{catInfo.emoji}</span>
          </div>

          {a.description && (
            <p className="text-sm text-gray-600">{a.description}</p>
          )}

          {a.comment && (
            <div className="bg-blue-50 p-3 rounded-xl text-sm text-blue-700">
              📝 Комментарий: {a.comment}
            </div>
          )}

          {/* Info card */}
          <div className="bg-gray-50 rounded-xl p-3 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Категория</span>
              <span>{catInfo.emoji} {catInfo.label}</span>
            </div>
            {dirInfo && (
              <div className="flex justify-between">
                <span className="text-gray-500">Направление</span>
                <span>{dirInfo.emoji} {dirInfo.label}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-gray-500">XP запрошен</span>
              <span className="font-medium">{a.xpRequested}</span>
            </div>
            {a.status === 'APPROVED' && (
              <div className="flex justify-between">
                <span className="text-gray-500">XP начислен</span>
                <span className="font-medium text-emerald-600">{a.xpAwarded}</span>
              </div>
            )}
            {a.achievementDate && (
              <div className="flex justify-between">
                <span className="text-gray-500">Дата</span>
                <span>{new Date(a.achievementDate).toLocaleDateString('ru-RU')}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-gray-500">Статус</span>
              <span className={statusCfg.color}>{statusCfg.emoji} {statusCfg.label}</span>
            </div>
            {a.reviewedBy && (
              <div className="flex justify-between">
                <span className="text-gray-500">Проверил(а)</span>
                <span>{a.reviewedBy}</span>
              </div>
            )}
            {a.reviewedAt && (
              <div className="flex justify-between">
                <span className="text-gray-500">Дата проверки</span>
                <span>{new Date(a.reviewedAt).toLocaleDateString('ru-RU')}</span>
              </div>
            )}
          </div>

          {a.reviewComment && (
            <div className={`p-3 rounded-xl text-sm ${
              a.status === 'REJECTED' ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'
            }`}>
              💬 {a.reviewComment}
            </div>
          )}

          <button
            onClick={() => setSelectedAchievement(null)}
            className="w-full py-2.5 bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200 transition-colors text-sm"
          >
            Закрыть
          </button>
        </div>
      </div>
    )
  }

  /* ============================================================
     RENDER: ADMIN PANEL
     ============================================================ */
  const renderAdminPanel = () => {
    if (!showAdmin) return null
    const stats = adminStats as {
      users?: { total: number; students: number; admins: number };
      achievements?: { total: number; approved: number; pending: number; rejected: number };
      badges?: { total: number; awarded: number };
      challenges?: { active: number; participants: number };
    } | null

    return (
      <div className="fixed inset-0 z-50 bg-black/40 flex items-end justify-center" onClick={() => setShowAdmin(false)}>
        <div
          className="bg-white rounded-t-3xl w-full max-w-[430px] max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="sticky top-0 bg-white p-4 border-b flex items-center justify-between rounded-t-3xl">
            <h3 className="text-lg font-bold text-gray-900">🛡️ Панель администратора</h3>
            <button onClick={() => setShowAdmin(false)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
          </div>

          <div className="p-4 space-y-4">
            {/* Stats overview */}
            {stats && (
              <>
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-blue-50 rounded-xl p-3 text-center">
                    <div className="text-xl font-bold text-blue-600">{stats.users?.total || 0}</div>
                    <div className="text-xs text-gray-500">Пользователей</div>
                  </div>
                  <div className="bg-amber-50 rounded-xl p-3 text-center">
                    <div className="text-xl font-bold text-amber-600">{stats.achievements?.pending || 0}</div>
                    <div className="text-xs text-gray-500">На проверке</div>
                  </div>
                  <div className="bg-emerald-50 rounded-xl p-3 text-center">
                    <div className="text-xl font-bold text-emerald-600">{stats.achievements?.approved || 0}</div>
                    <div className="text-xs text-gray-500">Одобрено</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-gray-50 rounded-xl p-3 text-center">
                    <div className="text-xl font-bold text-gray-700">{stats.achievements?.total || 0}</div>
                    <div className="text-xs text-gray-500">Всего достижений</div>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-3 text-center">
                    <div className="text-xl font-bold text-gray-700">{stats.challenges?.active || 0}</div>
                    <div className="text-xs text-gray-500">Активных челленджей</div>
                  </div>
                </div>
              </>
            )}

            {/* Pending achievements */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">⏳ Ожидают проверки ({pendingAchievements.length})</h4>
              {pendingAchievements.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">Нет ожидающих достижений</p>
              ) : (
                <div className="space-y-3">
                  {pendingAchievements.map((a) => {
                    const catInfo = CATEGORY_MAP[a.category] || CATEGORY_MAP.OTHER
                    return (
                      <AdminAchievementCard
                        key={a.id}
                        achievement={a}
                        catInfo={catInfo}
                        onApprove={(xp, dir, comment) => handleModerate(a.id, 'approve', xp, dir, comment)}
                        onReject={(comment) => handleModerate(a.id, 'reject', undefined, undefined, comment)}
                      />
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  /* ============================================================
     RENDER: BOTTOM NAV
     ============================================================ */
  const tabs: { id: Tab; emoji: string; label: string }[] = [
    { id: 'home', emoji: '🏠', label: 'Главная' },
    { id: 'add', emoji: '📤', label: 'Добавить' },
    { id: 'rating', emoji: '🏆', label: 'Рейтинг' },
    { id: 'activities', emoji: '⚡', label: 'Активности' },
    { id: 'profile', emoji: '👤', label: 'Профиль' },
  ]

  return (
    <div className="min-h-screen flex flex-col bg-[#F9FAFB] max-w-[430px] mx-auto relative">
      {/* Main content */}
      <main className="flex-1 overflow-y-auto pb-20">
        {currentTab === 'home' && renderHome()}
        {currentTab === 'add' && renderAddAchievement()}
        {currentTab === 'rating' && renderRating()}
        {currentTab === 'activities' && renderActivities()}
        {currentTab === 'profile' && renderProfile()}
      </main>

      {/* Bottom navigation */}
      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] bg-white border-t border-gray-200 z-40 safe-area-bottom">
        <div className="flex">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setCurrentTab(tab.id)}
              className={`flex-1 flex flex-col items-center py-2 pt-2.5 transition-colors ${
                currentTab === tab.id
                  ? 'text-emerald-600'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <span className="text-lg">{tab.emoji}</span>
              <span className="text-[10px] font-medium mt-0.5">{tab.label}</span>
            </button>
          ))}
        </div>
      </nav>

      {/* Modals */}
      {renderAchievementDetail()}
      {renderAdminPanel()}
    </div>
  )
}

/* ============================================================
   ADMIN ACHIEVEMENT CARD (with approve/reject actions)
   ============================================================ */

function AdminAchievementCard({
  achievement,
  catInfo,
  onApprove,
  onReject,
}: {
  achievement: Achievement
  catInfo: { emoji: string; label: string }
  onApprove: (xp: number, direction: string, comment: string) => void
  onReject: (comment: string) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const [xpAward, setXpAward] = useState(achievement.xpRequested)
  const [direction, setDirection] = useState(achievement.direction || '')
  const [comment, setComment] = useState('')
  const [rejectComment, setRejectComment] = useState('')
  const [showReject, setShowReject] = useState(false)

  return (
    <div className="bg-gray-50 rounded-2xl p-3 space-y-2">
      <button onClick={() => setExpanded(!expanded)} className="w-full text-left">
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-900 truncate">{achievement.title}</span>
              <span className="text-xs bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded-full">
                {catInfo.emoji} {catInfo.label}
              </span>
            </div>
            <div className="text-xs text-gray-500 mt-0.5">
              {achievement.user?.statusEmoji} {achievement.user?.name} · {achievement.xpRequested} XP
            </div>
          </div>
          <span className="text-gray-400">{expanded ? '▲' : '▼'}</span>
        </div>
      </button>

      {expanded && (
        <div className="space-y-3 pt-2 border-t border-gray-200">
          {achievement.description && (
            <p className="text-xs text-gray-600">{achievement.description}</p>
          )}

          {/* Approve section */}
          <div className="bg-white rounded-xl p-3 space-y-2">
            <h5 className="text-xs font-semibold text-emerald-700">✅ Одобрить</h5>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">XP:</span>
              <input
                type="number"
                min={1}
                max={20}
                value={xpAward}
                onChange={(e) => setXpAward(Number(e.target.value))}
                className="w-16 px-2 py-1 border border-gray-200 rounded-lg text-sm"
              />
            </div>
            {achievement.category === 'OTHER' && (
              <div>
                <span className="text-xs text-gray-500">Направление:</span>
                <div className="flex gap-1 mt-1 flex-wrap">
                  {Object.entries(DIRECTION_MAP).map(([key, val]) => (
                    <button
                      key={key}
                      onClick={() => setDirection(key)}
                      className={`px-2 py-1 rounded-lg text-xs ${
                        direction === key ? 'bg-emerald-100 text-emerald-700 border border-emerald-500' : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {val.emoji} {val.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <input
              type="text"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Комментарий (необязательно)"
              className="w-full px-2 py-1 border border-gray-200 rounded-lg text-xs"
            />
            <button
              onClick={() => onApprove(xpAward, direction, comment)}
              className="w-full py-1.5 bg-emerald-600 text-white text-xs font-medium rounded-lg hover:bg-emerald-700"
            >
              Одобрить
            </button>
          </div>

          {/* Reject section */}
          <div className="bg-white rounded-xl p-3 space-y-2">
            <button
              onClick={() => setShowReject(!showReject)}
              className="text-xs font-semibold text-red-600"
            >
              ❌ Отклонить
            </button>
            {showReject && (
              <>
                <input
                  type="text"
                  value={rejectComment}
                  onChange={(e) => setRejectComment(e.target.value)}
                  placeholder="Причина отклонения"
                  className="w-full px-2 py-1 border border-gray-200 rounded-lg text-xs"
                />
                <button
                  onClick={() => onReject(rejectComment || 'Отклонено модератором')}
                  className="w-full py-1.5 bg-red-500 text-white text-xs font-medium rounded-lg hover:bg-red-600"
                >
                  Отклонить
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
