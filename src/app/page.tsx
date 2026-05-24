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
  league?: string;
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
  faculty: Faculty | null; achievementCount: number; league: string;
}
interface LevelInfo { level: number; name: string; min: number; max: number }

/* ============================================================
   CONSTANTS
   ============================================================ */

const LEVELS: LevelInfo[] = [
  { level: 1, name: 'Новичок', min: 0, max: 99 },
  { level: 2, name: 'Активный', min: 100, max: 249 },
  { level: 3, name: 'Олимпиадник', min: 250, max: 499 },
  { level: 4, name: 'Ботан', min: 500, max: 999 },
  { level: 5, name: 'Мастер своего дела', min: 1000, max: 1999 },
  { level: 6, name: 'Элита', min: 2000, max: 4999 },
  { level: 7, name: 'Легенда', min: 5000, max: 999999 },
]

const LEAGUES = [
  { id: 'bronze', name: 'Бронза', emoji: '🥉', color: 'from-amber-800 to-amber-600', borderColor: 'border-amber-700', textColor: 'text-amber-400', bgGlow: 'shadow-amber-900/30' },
  { id: 'silver', name: 'Серебро', emoji: '🥈', color: 'from-gray-400 to-gray-300', borderColor: 'border-gray-500', textColor: 'text-gray-300', bgGlow: 'shadow-gray-500/20' },
  { id: 'gold', name: 'Золото', emoji: '🥇', color: 'from-yellow-500 to-amber-400', borderColor: 'border-yellow-500', textColor: 'text-yellow-400', bgGlow: 'shadow-yellow-500/20' },
  { id: 'platinum', name: 'Платина', emoji: '💎', color: 'from-cyan-400 to-blue-400', borderColor: 'border-cyan-400', textColor: 'text-cyan-400', bgGlow: 'shadow-cyan-500/20' },
  { id: 'diamond', name: 'Алмаз', emoji: '💠', color: 'from-purple-500 to-pink-400', borderColor: 'border-purple-400', textColor: 'text-purple-400', bgGlow: 'shadow-purple-500/20' },
]

function getLeagueByRank(totalUsers: number, rank: number): typeof LEAGUES[number] {
  if (totalUsers <= 1) return LEAGUES[0]
  const percentile = (rank - 1) / (totalUsers - 1)
  if (percentile >= 0.8) return LEAGUES[4] // diamond: top 20%
  if (percentile >= 0.6) return LEAGUES[3] // platinum: 60-80%
  if (percentile >= 0.4) return LEAGUES[2] // gold: 40-60%
  if (percentile >= 0.2) return LEAGUES[1] // silver: 20-40%
  return LEAGUES[0] // bronze: 0-20%
}

const CATEGORY_MAP: Record<string, { emoji: string; label: string }> = {
  SPORT: { emoji: '🏃', label: 'Спорт' },
  STUDY: { emoji: '📚', label: 'Учёба' },
  ART: { emoji: '🎨', label: 'Творчество' },
  COMMUNITY: { emoji: '👥', label: 'Общество' },
  OTHER: { emoji: '🌟', label: 'Другое' },
}

const STATUS_CONFIG: Record<string, { emoji: string; label: string; color: string }> = {
  APPROVED: { emoji: '✅', label: 'Одобрено', color: 'text-emerald-400' },
  PENDING: { emoji: '⏳', label: 'На проверке', color: 'text-amber-400' },
  REJECTED: { emoji: '❌', label: 'Отклонено', color: 'text-red-400' },
}

type Tab = 'home' | 'add' | 'rating' | 'achievements' | 'profile'

/* ============================================================
   GLASS CARD COMPONENT
   ============================================================ */

function GlassCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`glass-card rounded-2xl p-4 ${className}`}>
      {children}
    </div>
  )
}

/* ============================================================
   HELPER COMPONENTS
   ============================================================ */

function XpProgressBar({ current, max, className = '' }: { current: number; max: number; className?: string }) {
  const pct = max > 0 ? Math.min((current / max) * 100, 100) : 0
  return (
    <div className={`w-full bg-white/10 rounded-full h-3 overflow-hidden ${className}`}>
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{
          width: `${pct}%`,
          background: 'linear-gradient(90deg, #10B981, #06B6D4)',
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
    <span className="inline-flex items-center gap-1 text-xs bg-white/10 text-white/70 px-2 py-0.5 rounded-full">
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
  const [formXp, setFormXp] = useState(5)
  const [formDate, setFormDate] = useState('')
  const [formComment, setFormComment] = useState('')

  // Sub-tab for achievements
  const [achievementTab, setAchievementTab] = useState<'list' | 'badges' | 'challenges'>('list')

  // Rating filters
  const [ratingFaculty, setRatingFaculty] = useState('all')
  const [ratingPeriod, setRatingPeriod] = useState('all')
  const [selectedLeague, setSelectedLeague] = useState<string | null>(null)

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
      if (ratingFaculty && ratingFaculty !== 'all') params.set('facultyId', ratingFaculty)
      if (ratingPeriod && ratingPeriod !== 'all') params.set('period', ratingPeriod)
      const res = await fetch(`/api/rating?${params.toString()}`)
      if (!res.ok) return
      const data = await res.json()
      // Assign leagues to leaderboard entries
      const lb = (data.leaderboard || []).map((entry: LeaderboardEntry, idx: number) => {
        const league = getLeagueByRank((data.leaderboard || []).length, idx + 1)
        return { ...entry, league: league.id }
      })
      setLeaderboard(lb)
    } catch (e) {
      console.error('Leaderboard fetch error:', e)
    } finally {
      setLoading(false)
    }
  }, [ratingFaculty, ratingPeriod])

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
    if (currentTab === 'achievements') {
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
      const res = await fetch('/api/achievements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        toast.error('Ошибка при создании')
        return
      }
      toast.success('Достижение отправлено на проверку!')
      setFormTitle(''); setFormDesc(''); setFormCategory('');
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
      toast.success('Вы присоединились к челленджу!')
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
      toast.success(action === 'approve' ? 'Достижение одобрено' : 'Достижение отклонено')
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

  // Calculate current user league
  const currentUserLeague = leaderboard.length > 0
    ? getLeagueByRank(leaderboard.length, leaderboard.find(e => e.id === userId)?.rank || leaderboard.length)
    : LEAGUES[0]

  /* ============================================================
     RENDER: SCREEN 1 — HOME
     ============================================================ */
  const renderHome = () => (
    <div className="px-4 pb-4 space-y-4">
      {/* Header */}
      <div className="pt-2">
        <h1 className="text-2xl font-bold text-white">
          Привет, {profile?.name || '...'}!
        </h1>
        <p className="text-sm text-white/50 mt-0.5">
          {profile?.statusEmoji} {profile?.statusPrefix} · {profile?.faculty?.emoji} {profile?.faculty?.name}
        </p>
      </div>

      {/* Level progress card */}
      <GlassCard className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-cyan-500/10" />
        <div className="relative">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🎯</span>
              <div>
                <div className="font-bold text-white">Уровень {profile?.level}</div>
                <div className="text-xs text-white/50">{profile?.levelName}</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold text-emerald-400">{profile?.totalXp} XP</div>
              <div className="text-xs text-white/40">из {profile?.nextLevelXp || '∞'}</div>
            </div>
          </div>
          <XpProgressBar current={profile?.xpInLevel || 0} max={profile?.xpToNextLevel || 1} />
          {profile?.nextLevelName && (
            <p className="text-xs text-white/40 mt-1 text-center">
              До «{profile.nextLevelName}» — ещё {(profile.nextLevelXp || 0) - (profile.totalXp)} XP
            </p>
          )}
        </div>
      </GlassCard>

      {/* League card */}
      <GlassCard className="relative overflow-hidden">
        <div className={`absolute inset-0 bg-gradient-to-br ${currentUserLeague.color} opacity-10`} />
        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{currentUserLeague.emoji}</span>
            <div>
              <div className="text-xs text-white/40 uppercase tracking-wider">Лига</div>
              <div className={`font-bold ${currentUserLeague.textColor}`}>{currentUserLeague.name}</div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-white/40">Переход в следующую</div>
            <div className="text-xs text-white/60">каждую четверть</div>
          </div>
        </div>
      </GlassCard>

      {/* Quick actions */}
      <div className="grid grid-cols-3 gap-2">
        <button
          onClick={() => setCurrentTab('add')}
          className="glass-card flex flex-col items-center gap-1 p-3 rounded-xl active:scale-95 transition-transform"
        >
          <span className="text-xl">➕</span>
          <span className="text-xs text-white/60 font-medium">Добавить</span>
        </button>
        <button
          onClick={() => setCurrentTab('profile')}
          className="glass-card flex flex-col items-center gap-1 p-3 rounded-xl active:scale-95 transition-transform"
        >
          <span className="text-xl">📊</span>
          <span className="text-xs text-white/60 font-medium">Статистика</span>
        </button>
        <button
          onClick={() => setCurrentTab('rating')}
          className="glass-card flex flex-col items-center gap-1 p-3 rounded-xl active:scale-95 transition-transform"
        >
          <span className="text-xl">🏆</span>
          <span className="text-xs text-white/60 font-medium">Рейтинг</span>
        </button>
      </div>

      {/* Recent achievements */}
      <div>
        <h3 className="font-semibold text-white mb-2">Последние достижения</h3>
        <div className="space-y-2">
          {recentAchievements.map((a) => (
            <button
              key={a.id}
              onClick={() => setSelectedAchievement(a)}
              className="w-full text-left glass-card rounded-xl p-3 active:scale-[0.98] transition-transform"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-white truncate">{a.title}</span>
                    <CategoryTag category={a.category} />
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <StatusBadge status={a.status} />
                    {a.status === 'APPROVED' && a.xpAwarded > 0 && (
                      <span className="text-xs font-medium text-emerald-400">+{a.xpAwarded} XP</span>
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
            <p className="text-sm text-white/30 text-center py-4">Пока нет достижений</p>
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
      <h2 className="text-xl font-bold text-white pt-2">Добавить достижение</h2>

      <GlassCard className="space-y-4">
        {/* Title */}
        <div>
          <label className="text-sm font-medium text-white/70 mb-1 block">Название *</label>
          <input
            type="text"
            value={formTitle}
            onChange={(e) => setFormTitle(e.target.value)}
            placeholder="Олимпиада по математике"
            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-transparent"
          />
        </div>

        {/* Description */}
        <div>
          <label className="text-sm font-medium text-white/70 mb-1 block">Описание</label>
          <textarea
            value={formDesc}
            onChange={(e) => setFormDesc(e.target.value)}
            placeholder="Расскажите подробнее..."
            rows={3}
            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-transparent resize-none"
          />
        </div>

        {/* Category */}
        <div>
          <label className="text-sm font-medium text-white/70 mb-2 block">Категория</label>
          <div className="grid grid-cols-5 gap-2">
            {Object.entries(CATEGORY_MAP).map(([key, val]) => (
              <button
                key={key}
                onClick={() => setFormCategory(key)}
                className={`flex flex-col items-center gap-1 p-2 rounded-xl text-xs transition-all ${
                  formCategory === key
                    ? 'bg-emerald-500/20 border-2 border-emerald-500 text-emerald-400'
                    : 'bg-white/5 border-2 border-transparent text-white/60 hover:bg-white/10'
                }`}
              >
                <span className="text-lg">{val.emoji}</span>
                <span className="font-medium leading-tight text-center">{val.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* XP Slider */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-sm font-medium text-white/70">Запрашиваемый XP</label>
            <span className="text-lg font-bold text-emerald-400">{formXp} XP</span>
          </div>
          <input
            type="range"
            min={1}
            max={20}
            value={formXp}
            onChange={(e) => setFormXp(Number(e.target.value))}
            className="w-full h-2 rounded-lg appearance-none cursor-pointer accent-emerald-500"
          />
          <div className="flex justify-between text-xs text-white/30 mt-1">
            <span>1-4: ежедневные</span>
            <span>5-9: мероприятия</span>
            <span>10-19: крупные</span>
            <span>20: ВСОШ</span>
          </div>
        </div>

        {/* File upload placeholder */}
        <div>
          <label className="text-sm font-medium text-white/70 mb-1 block">Подтверждение</label>
          <div className="border-2 border-dashed border-white/10 rounded-xl p-4 text-center">
            <span className="text-2xl">📎</span>
            <p className="text-xs text-white/30 mt-1">Загрузка фото (скоро)</p>
          </div>
        </div>

        {/* Date */}
        <div>
          <label className="text-sm font-medium text-white/70 mb-1 block">Дата</label>
          <input
            type="date"
            value={formDate}
            onChange={(e) => setFormDate(e.target.value)}
            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 [color-scheme:dark]"
          />
        </div>

        {/* Comment */}
        <div>
          <label className="text-sm font-medium text-white/70 mb-1 block">Комментарий</label>
          <textarea
            value={formComment}
            onChange={(e) => setFormComment(e.target.value)}
            placeholder="Дополнительная информация..."
            rows={2}
            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 resize-none"
          />
        </div>

        {/* Submit */}
        <button
          onClick={handleAddAchievement}
          className="w-full py-3 bg-gradient-to-r from-emerald-600 to-cyan-600 text-white font-semibold rounded-xl hover:from-emerald-500 hover:to-cyan-500 transition-all text-sm active:scale-[0.98]"
        >
          Отправить на проверку
        </button>
      </GlassCard>
    </div>
  )

  /* ============================================================
     RENDER: SCREEN 3 — RATING (with leagues)
     ============================================================ */
  const renderRating = () => {
    const filteredLeaderboard = selectedLeague
      ? leaderboard.filter(e => e.league === selectedLeague)
      : leaderboard

    return (
      <div className="px-4 pb-4 space-y-4">
        <h2 className="text-xl font-bold text-white pt-2">Рейтинг</h2>

        {/* League selector */}
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
          <button
            onClick={() => setSelectedLeague(null)}
            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              selectedLeague === null ? 'bg-white/20 text-white' : 'bg-white/5 text-white/50'
            }`}
          >
            Все
          </button>
          {LEAGUES.map((league) => (
            <button
              key={league.id}
              onClick={() => setSelectedLeague(league.id === selectedLeague ? null : league.id)}
              className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                selectedLeague === league.id ? `${league.textColor} bg-white/15` : 'bg-white/5 text-white/50'
              }`}
            >
              {league.emoji} {league.name}
            </button>
          ))}
        </div>

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
                ratingPeriod === p.key ? 'bg-white/20 text-white' : 'bg-white/5 text-white/50'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Faculty filter */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1">
          <button
            onClick={() => setRatingFaculty('all')}
            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              ratingFaculty === 'all' ? 'bg-cyan-500/20 text-cyan-400' : 'bg-white/5 text-white/50'
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
                  ratingFaculty === fid ? 'bg-cyan-500/20 text-cyan-400' : 'bg-white/5 text-white/50'
                }`}
              >
                {f.emoji} {f.name}
              </button>
            )
          })}
        </div>

        {/* Leaderboard */}
        {loading ? (
          <div className="text-center py-8 text-white/30">Загрузка...</div>
        ) : (
          <div className="space-y-2">
            {filteredLeaderboard.slice(0, 3).map((entry) => {
              const medals = ['🥇', '🥈', '🥉']
              const league = LEAGUES.find(l => l.id === entry.league) || LEAGUES[0]
              return (
                <GlassCard
                  key={entry.id}
                  className={`relative overflow-hidden ${
                    entry.id === userId ? `ring-1 ${league.borderColor}` : ''
                  }`}
                >
                  <div className={`absolute inset-0 bg-gradient-to-r ${league.color} opacity-5`} />
                  <div className="relative flex items-center gap-3">
                    <span className="text-3xl">{medals[entry.rank - 1]}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm">{entry.statusEmoji}</span>
                        <span className="font-bold text-white truncate">{entry.name}</span>
                      </div>
                      <div className="text-xs text-white/40">
                        {entry.faculty?.emoji} {entry.faculty?.name} · Ур. {entry.level}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-emerald-400">{entry.totalXp} XP</div>
                      <div className={`text-xs ${league.textColor}`}>{league.emoji} {league.name}</div>
                    </div>
                  </div>
                </GlassCard>
              )
            })}
            {filteredLeaderboard.slice(3).map((entry) => {
              const league = LEAGUES.find(l => l.id === entry.league) || LEAGUES[0]
              return (
                <div
                  key={entry.id}
                  className={`glass-card rounded-xl p-3 flex items-center gap-3 ${
                    entry.id === userId ? `ring-1 ${league.borderColor}` : ''
                  }`}
                >
                  <span className="text-sm font-bold text-white/30 w-6 text-center">{entry.rank}</span>
                  <span className="text-sm">{entry.statusEmoji}</span>
                  <span className="flex-1 text-sm font-medium text-white truncate">{entry.name}</span>
                  <span className={`text-xs ${league.textColor}`}>{league.emoji}</span>
                  <span className="text-sm font-bold text-emerald-400">{entry.totalXp} XP</span>
                </div>
              )
            })}
          </div>
        )}

        {/* User position */}
        {leaderboard.length > 0 && (
          <div className="text-center">
            <span className="text-sm text-white/40">
              Твоя позиция: #{leaderboard.find((e) => e.id === userId)?.rank || '—'} · {currentUserLeague.emoji} {currentUserLeague.name}
            </span>
          </div>
        )}
      </div>
    )
  }

  /* ============================================================
     RENDER: SCREEN 4 — ACHIEVEMENTS (Ачивки)
     ============================================================ */
  const renderAchievements = () => (
    <div className="px-4 pb-4 space-y-4">
      <h2 className="text-xl font-bold text-white pt-2">Ачивки</h2>

      {/* Sub-tabs */}
      <div className="flex bg-white/5 rounded-xl p-1">
        <button
          onClick={() => setAchievementTab('list')}
          className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
            achievementTab === 'list' ? 'bg-white/10 text-white' : 'text-white/40'
          }`}
        >
          📋 Достижения
        </button>
        <button
          onClick={() => setAchievementTab('badges')}
          className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
            achievementTab === 'badges' ? 'bg-white/10 text-white' : 'text-white/40'
          }`}
        >
          🏅 Бейджи
        </button>
        <button
          onClick={() => setAchievementTab('challenges')}
          className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
            achievementTab === 'challenges' ? 'bg-white/10 text-white' : 'text-white/40'
          }`}
        >
          ⚡ Челленджи
        </button>
      </div>

      {achievementTab === 'list' && (
        <div className="space-y-2">
          {allAchievements.map((a) => (
            <button
              key={a.id}
              onClick={() => setSelectedAchievement(a)}
              className="w-full text-left glass-card rounded-xl p-3 active:scale-[0.98] transition-transform"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-white truncate">{a.title}</span>
                    <CategoryTag category={a.category} />
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <StatusBadge status={a.status} />
                    {a.status === 'APPROVED' && a.xpAwarded > 0 && (
                      <span className="text-xs font-medium text-emerald-400">+{a.xpAwarded} XP</span>
                    )}
                    {a.status === 'PENDING' && (
                      <span className="text-xs font-medium text-white/30">запрос: {a.xpRequested} XP</span>
                    )}
                  </div>
                  {a.achievementDate && (
                    <div className="text-xs text-white/20 mt-1">
                      {new Date(a.achievementDate).toLocaleDateString('ru-RU')}
                    </div>
                  )}
                </div>
              </div>
            </button>
          ))}
          {allAchievements.length === 0 && (
            <p className="text-sm text-white/30 text-center py-4">Пока нет достижений</p>
          )}
        </div>
      )}

      {achievementTab === 'badges' && (
        <div className="grid grid-cols-2 gap-3">
          {badges.map((b) => (
            <GlassCard
              key={b.id}
              className={`text-center transition-all ${!b.earned ? 'opacity-40' : ''}`}
            >
              <span className={`text-3xl ${b.earned ? '' : 'grayscale'}`}>{b.emoji}</span>
              <h4 className="text-sm font-semibold text-white mt-2">{b.name}</h4>
              <p className="text-xs text-white/40 mt-0.5 leading-tight">{b.description}</p>
              {b.earned && b.earnedAt && (
                <p className="text-xs text-emerald-400 mt-1">
                  {new Date(b.earnedAt).toLocaleDateString('ru-RU')}
                </p>
              )}
              {!b.earned && (
                <p className="text-xs text-white/20 mt-1">Не получен</p>
              )}
            </GlassCard>
          ))}
        </div>
      )}

      {achievementTab === 'challenges' && (
        <div className="space-y-3">
          {challenges.map((ch) => (
            <GlassCard key={ch.id}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-semibold text-white">{ch.title}</h4>
                  <p className="text-xs text-white/40 mt-0.5">{ch.description}</p>
                </div>
                {ch.completed && <span className="text-xl">✅</span>}
              </div>
              <div className="mt-3">
                <div className="flex items-center justify-between text-xs text-white/40 mb-1">
                  <span>{ch.xpCollected} / {ch.xpTarget} XP</span>
                  <span className="font-medium text-emerald-400">+{ch.rewardXp} XP награда</span>
                </div>
                <XpProgressBar current={ch.xpCollected} max={ch.xpTarget} />
              </div>
              {!ch.isJoined && !ch.completed && (
                <button
                  onClick={() => handleJoinChallenge(ch.id)}
                  className="mt-3 w-full py-2 bg-gradient-to-r from-emerald-600 to-cyan-600 text-white text-sm font-medium rounded-xl hover:from-emerald-500 hover:to-cyan-500 transition-all active:scale-[0.98]"
                >
                  Присоединиться
                </button>
              )}
              {ch.isJoined && !ch.completed && (
                <div className="mt-2 text-xs text-amber-400 font-medium text-center">
                  В процессе — ещё {ch.xpTarget - ch.xpCollected} XP
                </div>
              )}
            </GlassCard>
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
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 backdrop-blur-sm flex items-center justify-center mx-auto text-4xl border border-white/10">
          {profile?.statusEmoji || '👤'}
        </div>
        <h2 className="text-xl font-bold text-white mt-2">{profile?.name}</h2>
        <p className="text-sm text-white/40">@{profile?.username}</p>
        <div className="flex items-center justify-center gap-2 mt-1">
          <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full font-medium">
            Ур. {profile?.level} — {profile?.levelName}
          </span>
          {isAdmin && (
            <span className="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full font-medium">
              Админ
            </span>
          )}
        </div>
        {profile?.faculty && (
          <span className="inline-flex items-center gap-1 text-xs bg-white/5 border border-white/10 px-3 py-1 rounded-full mt-2 text-white/60">
            {profile.faculty.emoji} {profile.faculty.name}
          </span>
        )}
      </div>

      {/* Level card */}
      <GlassCard>
        <div className="flex items-center justify-between mb-2">
          <div>
            <span className="text-lg font-bold text-white">Уровень {profile?.level}</span>
            <span className="text-sm text-white/50 ml-2">{profile?.levelName}</span>
          </div>
          <span className="text-xl font-bold text-emerald-400">{profile?.totalXp} XP</span>
        </div>
        <XpProgressBar current={profile?.xpInLevel || 0} max={profile?.xpToNextLevel || 1} />
      </GlassCard>

      {/* Statistics */}
      <GlassCard>
        <h3 className="font-semibold text-white mb-3">Статистика</h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white/5 rounded-xl p-3 text-center">
            <div className="text-2xl font-bold text-white">{achievementCounts.total}</div>
            <div className="text-xs text-white/40">Всего</div>
          </div>
          <div className="bg-emerald-500/10 rounded-xl p-3 text-center">
            <div className="text-2xl font-bold text-emerald-400">{achievementCounts.APPROVED}</div>
            <div className="text-xs text-white/40">Одобрено</div>
          </div>
          <div className="bg-amber-500/10 rounded-xl p-3 text-center">
            <div className="text-2xl font-bold text-amber-400">{achievementCounts.PENDING}</div>
            <div className="text-xs text-white/40">На проверке</div>
          </div>
          <div className="bg-red-500/10 rounded-xl p-3 text-center">
            <div className="text-2xl font-bold text-red-400">{achievementCounts.REJECTED}</div>
            <div className="text-xs text-white/40">Отклонено</div>
          </div>
        </div>
      </GlassCard>

      {/* Level roadmap */}
      <GlassCard>
        <h3 className="font-semibold text-white mb-3">Путь уровней</h3>
        <div className="space-y-2">
          {levelRoadmap.map((lvl) => {
            const isCurrent = lvl.level === profile?.level
            const isPassed = (profile?.level || 0) > lvl.level
            return (
              <div
                key={lvl.level}
                className={`flex items-center gap-3 p-2 rounded-xl transition-colors ${
                  isCurrent ? 'bg-emerald-500/15 ring-1 ring-emerald-500/50' : isPassed ? 'opacity-40' : ''
                }`}
              >
                <span className="text-lg">{isPassed ? '✅' : isCurrent ? '🎯' : '🔒'}</span>
                <div className="flex-1">
                  <div className="text-sm font-medium text-white">
                    Ур. {lvl.level}: {lvl.name}
                  </div>
                  <div className="text-xs text-white/30">{lvl.min}–{lvl.max === 999999 ? '∞' : lvl.max} XP</div>
                </div>
                {isCurrent && (
                  <span className="text-xs font-medium text-emerald-400">Вы здесь</span>
                )}
              </div>
            )
          })}
        </div>
      </GlassCard>

      {/* XP Dynamics */}
      <GlassCard>
        <h3 className="font-semibold text-white mb-3">XP по месяцам</h3>
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
                    background: 'linear-gradient(180deg, #10B981, #06B6D4)',
                    minHeight: '4px',
                  }}
                />
                <span className="text-xs text-white/30">{item.m}</span>
              </div>
            )
          })}
        </div>
      </GlassCard>

      {/* My badges */}
      <GlassCard>
        <h3 className="font-semibold text-white mb-3">Мои бейджи</h3>
        {userBadges.length > 0 ? (
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1">
            {userBadges.map((b) => (
              <div key={b.id} className="shrink-0 text-center w-16">
                <span className="text-2xl">{b.emoji}</span>
                <p className="text-xs text-white/50 mt-0.5 leading-tight truncate">{b.name}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-white/30 text-center py-2">Пока нет бейджей</p>
        )}
      </GlassCard>

      {/* Admin switch */}
      <div className="pt-2 space-y-2">
        <button
          onClick={switchUser}
          className="w-full py-2 text-xs text-white/30 hover:text-white/50 transition-colors"
        >
          Переключить пользователя ({userId === 'u1' ? 'Иван' : 'Ольга'})
        </button>
        {isAdmin && (
          <button
            onClick={() => setShowAdmin(!showAdmin)}
            className="w-full py-2 bg-red-500/10 text-red-400 text-sm font-medium rounded-xl hover:bg-red-500/20 transition-colors"
          >
            {showAdmin ? 'Закрыть админ-панель' : 'Открыть админ-панель'}
          </button>
        )}
      </div>
    </div>
  )

  /* ============================================================
     RENDER: ACHIEVEMENT DETAIL MODAL
     ============================================================ */
  const renderAchievementDetail = () => {
    if (!selectedAchievement) return null
    const a = selectedAchievement
    return (
      <div className="fixed inset-0 z-50 flex items-end justify-center" onClick={() => setSelectedAchievement(null)}>
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
        <div
          className="relative w-full max-w-lg glass-card rounded-t-3xl p-6 max-h-[80vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-4" />
          <div className="flex items-start gap-3 mb-4">
            <div className="flex-1">
              <h3 className="text-lg font-bold text-white">{a.title}</h3>
              <div className="flex items-center gap-2 mt-1">
                <StatusBadge status={a.status} />
                <CategoryTag category={a.category} />
              </div>
            </div>
          </div>
          {a.description && (
            <p className="text-sm text-white/60 mb-3">{a.description}</p>
          )}
          <div className="space-y-2 mb-4">
            {a.status === 'APPROVED' && (
              <div className="flex justify-between text-sm">
                <span className="text-white/40">Начислено XP</span>
                <span className="text-emerald-400 font-bold">+{a.xpAwarded} XP</span>
              </div>
            )}
            {a.status === 'PENDING' && (
              <div className="flex justify-between text-sm">
                <span className="text-white/40">Запрошено XP</span>
                <span className="text-amber-400 font-bold">{a.xpRequested} XP</span>
              </div>
            )}
            {a.achievementDate && (
              <div className="flex justify-between text-sm">
                <span className="text-white/40">Дата</span>
                <span className="text-white/60">{new Date(a.achievementDate).toLocaleDateString('ru-RU')}</span>
              </div>
            )}
            {a.comment && (
              <div className="flex justify-between text-sm">
                <span className="text-white/40">Комментарий</span>
                <span className="text-white/60 text-right max-w-[200px]">{a.comment}</span>
              </div>
            )}
            {a.reviewComment && (
              <div className="flex justify-between text-sm">
                <span className="text-white/40">Отзыв</span>
                <span className="text-white/60 text-right max-w-[200px]">{a.reviewComment}</span>
              </div>
            )}
          </div>
          <button
            onClick={() => setSelectedAchievement(null)}
            className="w-full py-2 bg-white/5 text-white/60 text-sm font-medium rounded-xl hover:bg-white/10 transition-colors"
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
  const renderAdmin = () => (
    <div className="fixed inset-0 z-40 flex items-end justify-center" onClick={() => setShowAdmin(false)}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-lg glass-card rounded-t-3xl p-6 max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-4" />
        <h3 className="text-lg font-bold text-white mb-4">Админ-панель</h3>

        {/* Stats */}
        {adminStats && (
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-white/5 rounded-xl p-3 text-center">
              <div className="text-2xl font-bold text-white">{String(adminStats.totalUsers || 0)}</div>
              <div className="text-xs text-white/40">Пользователей</div>
            </div>
            <div className="bg-white/5 rounded-xl p-3 text-center">
              <div className="text-2xl font-bold text-emerald-400">{String(adminStats.totalAchievements || 0)}</div>
              <div className="text-xs text-white/40">Достижений</div>
            </div>
          </div>
        )}

        {/* Pending achievements */}
        <h4 className="text-sm font-semibold text-white mb-2">На проверке ({pendingAchievements.length})</h4>
        <div className="space-y-2">
          {pendingAchievements.map((a) => (
            <div key={a.id} className="bg-white/5 rounded-xl p-3">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-white">{a.title}</div>
                  <div className="text-xs text-white/40 mt-0.5">{a.description}</div>
                  <div className="flex items-center gap-2 mt-1">
                    <CategoryTag category={a.category} />
                    <span className="text-xs text-amber-400">{a.xpRequested} XP</span>
                  </div>
                  <div className="text-xs text-white/30 mt-1">
                    от {a.user?.name || 'Неизвестный'} · {a.achievementDate ? new Date(a.achievementDate).toLocaleDateString('ru-RU') : '—'}
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleModerate(a.id, 'approve', a.xpRequested)}
                  className="flex-1 py-2 bg-emerald-500/20 text-emerald-400 text-xs font-medium rounded-lg hover:bg-emerald-500/30 transition-colors"
                >
                  Одобрить (+{a.xpRequested} XP)
                </button>
                <button
                  onClick={() => handleModerate(a.id, 'reject', undefined, undefined, 'Отклонено')}
                  className="flex-1 py-2 bg-red-500/20 text-red-400 text-xs font-medium rounded-lg hover:bg-red-500/30 transition-colors"
                >
                  Отклонить
                </button>
              </div>
            </div>
          ))}
          {pendingAchievements.length === 0 && (
            <p className="text-sm text-white/30 text-center py-4">Нет достижений на проверке</p>
          )}
        </div>

        <button
          onClick={() => setShowAdmin(false)}
          className="w-full py-2 mt-4 bg-white/5 text-white/60 text-sm font-medium rounded-xl hover:bg-white/10 transition-colors"
        >
          Закрыть
        </button>
      </div>
    </div>
  )

  /* ============================================================
     RENDER: BOTTOM NAVIGATION
     ============================================================ */
  const TAB_CONFIG: { key: Tab; emoji: string; label: string }[] = [
    { key: 'home', emoji: '🏠', label: 'Главная' },
    { key: 'add', emoji: '➕', label: 'Добавить' },
    { key: 'rating', emoji: '🏆', label: 'Рейтинг' },
    { key: 'achievements', emoji: '🏅', label: 'Ачивки' },
    { key: 'profile', emoji: '👤', label: 'Профиль' },
  ]

  return (
    <div className="min-h-screen bg-[#0a0a1a] flex flex-col">
      {/* Main content */}
      <main className="flex-1 overflow-y-auto pb-20">
        {currentTab === 'home' && renderHome()}
        {currentTab === 'add' && renderAddAchievement()}
        {currentTab === 'rating' && renderRating()}
        {currentTab === 'achievements' && renderAchievements()}
        {currentTab === 'profile' && renderProfile()}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 safe-area-bottom">
        <div className="max-w-lg mx-auto">
          <div className="glass-nav flex items-center justify-around px-2 py-1">
            {TAB_CONFIG.map((tab) => (
              <button
                key={tab.key}
                onClick={() => { setCurrentTab(tab.key); if (tab.key !== 'profile') setShowAdmin(false) }}
                className={`flex flex-col items-center gap-0.5 py-2 px-3 rounded-xl transition-all ${
                  currentTab === tab.key
                    ? 'text-emerald-400 scale-105'
                    : 'text-white/30 hover:text-white/50'
                }`}
              >
                <span className="text-lg">{tab.emoji}</span>
                <span className="text-[10px] font-medium">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Modals */}
      {selectedAchievement && renderAchievementDetail()}
      {showAdmin && renderAdmin()}
    </div>
  )
}
