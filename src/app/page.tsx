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
  if (percentile >= 0.8) return LEAGUES[4]
  if (percentile >= 0.6) return LEAGUES[3]
  if (percentile >= 0.4) return LEAGUES[2]
  if (percentile >= 0.2) return LEAGUES[1]
  return LEAGUES[0]
}

const CATEGORY_MAP: Record<string, { emoji: string; label: string }> = {
  SPORT: { emoji: '🏃', label: 'Спорт' },
  STUDY: { emoji: '📚', label: 'Учёба' },
  ART: { emoji: '🎨', label: 'Творчество' },
  COMMUNITY: { emoji: '👥', label: 'Общество' },
  OTHER: { emoji: '🌟', label: 'Другое' },
}

const STATUS_CONFIG: Record<string, { emoji: string; label: string; color: string }> = {
  APPROVED: { emoji: '✅', label: 'Одобрено', color: 'text-[#34C759]' },
  PENDING: { emoji: '⏳', label: 'На проверке', color: 'text-[#FF9F0A]' },
  REJECTED: { emoji: '❌', label: 'Отклонено', color: 'text-[#FF3B30]' },
}

type Tab = 'home' | 'add' | 'rating' | 'achievements' | 'profile'

/* ============================================================
   SVG ICONS (SF Symbols style)
   ============================================================ */

function IconHome({ active }: { active: boolean }) {
  return active ? (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path d="M3 12L5 10M5 10L12 3L19 10M5 10V20C5 20.5523 5.44772 21 6 21H9M19 10L21 12M19 10V20C19 20.5523 18.5523 21 18 21H15M9 21C9 21 9 15 12 15C15 15 15 21 15 21M9 21H15" stroke="#2AABEE" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="rgba(42,171,238,0.15)"/>
    </svg>
  ) : (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path d="M3 12L5 10M5 10L12 3L19 10M5 10V20C5 20.5523 5.44772 21 6 21H9M19 10L21 12M19 10V20C19 20.5523 18.5523 21 18 21H15M9 21C9 21 9 15 12 15C15 15 15 21 15 21M9 21H15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

function IconTrophy({ active }: { active: boolean }) {
  return active ? (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path d="M12 17C13.5 17 15 16 15 14H9C9 16 10.5 17 12 17ZM12 17V20M8 20H16M7 4H17V10C17 12.7614 14.7614 15 12 15C9.23858 15 7 12.7614 7 10V4ZM5 6C5 5 5.5 4 7 4M19 6C19 5 18.5 4 17 4" stroke="#2AABEE" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="rgba(42,171,238,0.15)"/>
    </svg>
  ) : (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path d="M12 17C13.5 17 15 16 15 14H9C9 16 10.5 17 12 17ZM12 17V20M8 20H16M7 4H17V10C17 12.7614 14.7614 15 12 15C9.23858 15 7 12.7614 7 10V4ZM5 6C5 5 5.5 4 7 4M19 6C19 5 18.5 4 17 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

function IconMedal({ active }: { active: boolean }) {
  return active ? (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="14" r="6" stroke="#2AABEE" strokeWidth="2" fill="rgba(42,171,238,0.15)"/>
      <path d="M9.5 3L12 8L14.5 3" stroke="#2AABEE" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="12" cy="14" r="2.5" stroke="#2AABEE" strokeWidth="1.5" fill="rgba(42,171,238,0.3)"/>
    </svg>
  ) : (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="14" r="6" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M9.5 3L12 8L14.5 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="12" cy="14" r="2.5" stroke="currentColor" strokeWidth="1"/>
    </svg>
  )
}

function IconPlus() {
  return (
    <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
      <circle cx="13" cy="13" r="11" fill="#2AABEE" stroke="rgba(42,171,238,0.3)" strokeWidth="1"/>
      <path d="M13 8V18M8 13H18" stroke="white" strokeWidth="2.2" strokeLinecap="round"/>
    </svg>
  )
}

function IconUser({ active }: { active: boolean }) {
  return active ? (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="8" r="4" stroke="#2AABEE" strokeWidth="2" fill="rgba(42,171,238,0.15)"/>
      <path d="M4 20C4 16.6863 7.58172 14 12 14C16.4183 14 20 16.6863 20 20" stroke="#2AABEE" strokeWidth="2" strokeLinecap="round" fill="rgba(42,171,238,0.1)"/>
    </svg>
  ) : (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M4 20C4 16.6863 7.58172 14 12 14C16.4183 14 20 16.6863 20 20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  )
}

/* ============================================================
   GLASS CARD COMPONENT
   ============================================================ */

function GlassCard({ children, className = '', elevated = false }: { children: React.ReactNode; className?: string; elevated?: boolean }) {
  return (
    <div className={`${elevated ? 'glass-card-elevated' : 'glass-card'} p-5 ${className}`}>
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
    <div className={`w-full bg-white/8 rounded-full h-2 overflow-hidden ${className}`}>
      <div
        className="h-full rounded-full transition-all duration-700 ease-out"
        style={{
          width: `${pct}%`,
          background: 'linear-gradient(90deg, #2AABEE, #6C5CE7)',
        }}
      />
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.PENDING
  return (
    <span className={`inline-flex items-center gap-1 text-[12px] font-medium ${cfg.color}`}>
      {cfg.emoji} {cfg.label}
    </span>
  )
}

function CategoryTag({ category }: { category: string }) {
  const cfg = CATEGORY_MAP[category] || CATEGORY_MAP.OTHER
  return (
    <span className="inline-flex items-center gap-1 text-[11px] bg-white/6 text-white/50 px-2 py-0.5 rounded-full font-medium">
      {cfg.emoji} {cfg.label}
    </span>
  )
}

function IosSheetHandle() {
  return <div className="w-9 h-1 bg-white/15 rounded-full mx-auto mb-5" />
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

  const currentUserLeague = leaderboard.length > 0
    ? getLeagueByRank(leaderboard.length, leaderboard.find(e => e.id === userId)?.rank || leaderboard.length)
    : LEAGUES[0]

  /* ============================================================
     RENDER: SCREEN 1 — HOME (iOS style)
     ============================================================ */
  const renderHome = () => (
    <div className="px-5 pb-6 space-y-5 ios-fade-in">
      {/* Large title greeting */}
      <div className="pt-3">
        <h1 className="ios-large-title">
          Привет, {profile?.name || '...'}
        </h1>
        <p className="text-[15px] text-white/40 mt-1 font-medium">
          {profile?.statusEmoji} {profile?.statusPrefix} · {profile?.faculty?.emoji} {profile?.faculty?.name}
        </p>
      </div>

      {/* Level progress card — hero */}
      <GlassCard elevated className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#2AABEE]/8 to-[#6C5CE7]/8" />
        <div className="relative">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#2AABEE]/15 flex items-center justify-center">
                <span className="text-lg">🎯</span>
              </div>
              <div>
                <div className="text-[17px] font-bold text-white">Уровень {profile?.level}</div>
                <div className="text-[13px] text-white/40">{profile?.levelName}</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-[20px] font-bold text-[#2AABEE]">{profile?.totalXp} XP</div>
              <div className="text-[12px] text-white/30">из {profile?.nextLevelXp || '∞'}</div>
            </div>
          </div>
          <XpProgressBar current={profile?.xpInLevel || 0} max={profile?.xpToNextLevel || 1} />
          {profile?.nextLevelName && (
            <p className="text-[12px] text-white/30 mt-2 text-center">
              До «{profile.nextLevelName}» — ещё {(profile.nextLevelXp || 0) - (profile.totalXp)} XP
            </p>
          )}
        </div>
      </GlassCard>

      {/* League badge pill */}
      <GlassCard className="relative overflow-hidden">
        <div className={`absolute inset-0 bg-gradient-to-br ${currentUserLeague.color} opacity-8`} />
        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-[28px]">{currentUserLeague.emoji}</span>
            <div>
              <div className="ios-section-header text-[11px]">Лига</div>
              <div className={`text-[17px] font-bold ${currentUserLeague.textColor}`}>{currentUserLeague.name}</div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-[12px] text-white/30">Переход в следующую</div>
            <div className="text-[12px] text-white/50 font-medium">каждую четверть</div>
          </div>
        </div>
      </GlassCard>

      {/* Quick actions — 3 compact glass buttons */}
      <div className="grid grid-cols-3 gap-2.5">
        <button
          onClick={() => setCurrentTab('add')}
          className="glass-card flex flex-col items-center gap-1.5 py-3.5 px-2 active:scale-95 ios-spring"
        >
          <span className="text-[20px]">➕</span>
          <span className="text-[11px] text-white/45 font-semibold">Добавить</span>
        </button>
        <button
          onClick={() => setCurrentTab('profile')}
          className="glass-card flex flex-col items-center gap-1.5 py-3.5 px-2 active:scale-95 ios-spring"
        >
          <span className="text-[20px]">📊</span>
          <span className="text-[11px] text-white/45 font-semibold">Статистика</span>
        </button>
        <button
          onClick={() => setCurrentTab('rating')}
          className="glass-card flex flex-col items-center gap-1.5 py-3.5 px-2 active:scale-95 ios-spring"
        >
          <span className="text-[20px]">🏆</span>
          <span className="text-[11px] text-white/45 font-semibold">Рейтинг</span>
        </button>
      </div>

      {/* Recent achievements — iOS list style */}
      <div>
        <h3 className="ios-section-header mb-3">Последние достижения</h3>
        <div className="space-y-1.5">
          {recentAchievements.map((a) => {
            const catCfg = CATEGORY_MAP[a.category] || CATEGORY_MAP.OTHER
            return (
              <button
                key={a.id}
                onClick={() => setSelectedAchievement(a)}
                className="w-full text-left ios-list-item p-3.5 flex items-center gap-3"
              >
                {/* Avatar circle with category emoji */}
                <div className="w-10 h-10 rounded-full bg-white/6 flex items-center justify-center shrink-0 text-[18px]">
                  {catCfg.emoji}
                </div>
                {/* Title + status */}
                <div className="flex-1 min-w-0">
                  <div className="text-[15px] font-medium text-white truncate">{a.title}</div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <StatusBadge status={a.status} />
                  </div>
                </div>
                {/* XP on right */}
                <div className="text-right shrink-0">
                  {a.status === 'APPROVED' && a.xpAwarded > 0 && (
                    <span className="text-[14px] font-bold text-[#34C759]">+{a.xpAwarded}</span>
                  )}
                  {a.status === 'REJECTED' && a.reviewComment && (
                    <span className="text-[11px] text-[#FF3B30]/70 truncate max-w-[80px] block">{a.reviewComment}</span>
                  )}
                </div>
                {/* Chevron */}
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="shrink-0 opacity-20">
                  <path d="M5 3L9 7L5 11" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            )
          })}
          {recentAchievements.length === 0 && (
            <div className="text-center py-8">
              <p className="text-[15px] text-white/20">Пока нет достижений</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )

  /* ============================================================
     RENDER: SCREEN 2 — ADD ACHIEVEMENT (iOS Settings style)
     ============================================================ */
  const renderAddAchievement = () => (
    <div className="px-5 pb-6 space-y-5 ios-fade-in">
      {/* Large title */}
      <div className="pt-3">
        <h1 className="ios-large-title">Добавить</h1>
        <p className="text-[15px] text-white/40 mt-1">Новое достижение</p>
      </div>

      {/* Section: Main info */}
      <div>
        <h3 className="ios-section-header mb-2 ml-1">Основная информация</h3>
        <GlassCard className="space-y-0 p-0 overflow-hidden">
          {/* Title input */}
          <div className="p-4 border-b border-white/6">
            <label className="text-[13px] font-medium text-white/40 mb-1.5 block">Название *</label>
            <input
              type="text"
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
              placeholder="Олимпиада по математике"
              className="glass-input w-full px-4 py-3 text-[15px] text-white placeholder-white/20 bg-transparent border-0 focus:ring-0 focus:shadow-none rounded-xl"
            />
          </div>
          {/* Description */}
          <div className="p-4 border-b border-white/6">
            <label className="text-[13px] font-medium text-white/40 mb-1.5 block">Описание</label>
            <textarea
              value={formDesc}
              onChange={(e) => setFormDesc(e.target.value)}
              placeholder="Расскажите подробнее..."
              rows={3}
              className="glass-input w-full px-4 py-3 text-[15px] text-white placeholder-white/20 bg-transparent border-0 focus:ring-0 focus:shadow-none resize-none rounded-xl"
            />
          </div>
          {/* Date */}
          <div className="p-4">
            <label className="text-[13px] font-medium text-white/40 mb-1.5 block">Дата</label>
            <input
              type="date"
              value={formDate}
              onChange={(e) => setFormDate(e.target.value)}
              className="glass-input w-full px-4 py-3 text-[15px] text-white bg-transparent border-0 focus:ring-0 focus:shadow-none [color-scheme:dark] rounded-xl"
            />
          </div>
        </GlassCard>
      </div>

      {/* Section: Category — horizontal scroll pills */}
      <div>
        <h3 className="ios-section-header mb-2 ml-1">Категория</h3>
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide -mx-1 px-1">
          {Object.entries(CATEGORY_MAP).map(([key, val]) => (
            <button
              key={key}
              onClick={() => setFormCategory(key)}
              className={`shrink-0 flex items-center gap-1.5 px-4 py-2.5 rounded-full text-[13px] font-medium transition-all ${
                formCategory === key
                  ? 'ios-pill-active'
                  : 'ios-pill'
              }`}
            >
              <span className="text-[15px]">{val.emoji}</span>
              {val.label}
            </button>
          ))}
        </div>
      </div>

      {/* Section: XP */}
      <div>
        <h3 className="ios-section-header mb-2 ml-1">Запрашиваемый XP</h3>
        <GlassCard>
          <div className="flex items-center justify-between mb-3">
            <span className="text-[15px] text-white/50">Количество</span>
            <span className="text-[22px] font-bold text-[#2AABEE]">{formXp} XP</span>
          </div>
          <input
            type="range"
            min={1}
            max={20}
            value={formXp}
            onChange={(e) => setFormXp(Number(e.target.value))}
            className="w-full"
          />
          <div className="flex justify-between text-[11px] text-white/20 mt-2">
            <span>1–4: ежедневные</span>
            <span>5–9: мероприятия</span>
            <span>10–19: крупные</span>
            <span>20: ВСОШ</span>
          </div>
        </GlassCard>
      </div>

      {/* Section: Upload */}
      <div>
        <h3 className="ios-section-header mb-2 ml-1">Подтверждение</h3>
        <GlassCard className="flex flex-col items-center py-6 border-dashed border-white/8">
          <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-2">
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
              <path d="M11 14V7M7 10L11 6L15 10" stroke="rgba(255,255,255,0.25)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M4 15V17C4 17.5523 4.44772 18 5 18H17C17.5523 18 18 17.5523 18 17V15" stroke="rgba(255,255,255,0.25)" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>
          <p className="text-[13px] text-white/20">Загрузка фото (скоро)</p>
        </GlassCard>
      </div>

      {/* Section: Comment */}
      <div>
        <h3 className="ios-section-header mb-2 ml-1">Комментарий</h3>
        <GlassCard>
          <textarea
            value={formComment}
            onChange={(e) => setFormComment(e.target.value)}
            placeholder="Дополнительная информация..."
            rows={2}
            className="glass-input w-full px-4 py-3 text-[15px] text-white placeholder-white/20 bg-transparent border-0 focus:ring-0 focus:shadow-none resize-none rounded-xl"
          />
        </GlassCard>
      </div>

      {/* Submit button */}
      <button
        onClick={handleAddAchievement}
        className="ios-button-primary w-full"
      >
        Отправить на проверку
      </button>
    </div>
  )

  /* ============================================================
     RENDER: SCREEN 3 — RATING (iOS style)
     ============================================================ */
  const renderRating = () => {
    const filteredLeaderboard = selectedLeague
      ? leaderboard.filter(e => e.league === selectedLeague)
      : leaderboard

    return (
      <div className="px-5 pb-6 space-y-4 ios-fade-in">
        {/* Large title */}
        <div className="pt-3">
          <h1 className="ios-large-title">Рейтинг</h1>
        </div>

        {/* iOS segmented control for league */}
        <div className="ios-segmented flex">
          <button
            onClick={() => setSelectedLeague(null)}
            className={`flex-1 py-2 text-[13px] font-semibold rounded-[10px] transition-all z-10 ${
              selectedLeague === null ? 'ios-segmented-pill text-white' : 'text-white/35'
            }`}
          >
            Все
          </button>
          {LEAGUES.map((league) => (
            <button
              key={league.id}
              onClick={() => setSelectedLeague(league.id === selectedLeague ? null : league.id)}
              className={`flex-1 py-2 text-[13px] font-semibold rounded-[10px] transition-all z-10 ${
                selectedLeague === league.id ? 'ios-segmented-pill text-white' : 'text-white/35'
              }`}
            >
              {league.emoji} {league.name}
            </button>
          ))}
        </div>

        {/* Period filter pills */}
        <div className="flex gap-1.5 overflow-x-auto scrollbar-hide">
          {[
            { key: 'all', label: 'Всё время' },
            { key: 'month', label: 'Месяц' },
            { key: 'quarter', label: 'Квартал' },
            { key: 'year', label: 'Год' },
          ].map((p) => (
            <button
              key={p.key}
              onClick={() => setRatingPeriod(p.key)}
              className={`shrink-0 ${ratingPeriod === p.key ? 'ios-pill-active' : 'ios-pill'}`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Faculty filter pills */}
        <div className="flex gap-1.5 overflow-x-auto scrollbar-hide">
          <button
            onClick={() => setRatingFaculty('all')}
            className={`shrink-0 ${ratingFaculty === 'all' ? 'ios-pill-active' : 'ios-pill'}`}
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
                className={`shrink-0 ${ratingFaculty === fid ? 'ios-pill-active' : 'ios-pill'}`}
              >
                {f.emoji} {f.name}
              </button>
            )
          })}
        </div>

        {/* Leaderboard */}
        {loading ? (
          <div className="text-center py-12">
            <p className="text-[15px] text-white/20">Загрузка...</p>
          </div>
        ) : (
          <div className="space-y-2">
            {/* Top 3 — special podium cards */}
            {filteredLeaderboard.slice(0, 3).map((entry) => {
              const medals = ['🥇', '🥈', '🥉']
              const league = LEAGUES.find(l => l.id === entry.league) || LEAGUES[0]
              return (
                <GlassCard
                  key={entry.id}
                  elevated={entry.rank === 1}
                  className={`relative overflow-hidden ${
                    entry.id === userId ? `ring-1 ${league.borderColor}` : ''
                  }`}
                >
                  <div className={`absolute inset-0 bg-gradient-to-r ${league.color} opacity-4`} />
                  <div className="relative flex items-center gap-3">
                    <span className="text-[28px]">{medals[entry.rank - 1]}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[14px]">{entry.statusEmoji}</span>
                        <span className="text-[15px] font-bold text-white truncate">{entry.name}</span>
                      </div>
                      <div className="text-[12px] text-white/30">
                        {entry.faculty?.emoji} {entry.faculty?.name} · Ур. {entry.level}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-[16px] font-bold text-[#2AABEE]">{entry.totalXp} XP</div>
                      <div className={`text-[11px] ${league.textColor}`}>{league.emoji} {league.name}</div>
                    </div>
                  </div>
                </GlassCard>
              )
            })}
            {/* Remaining entries — clean list items */}
            {filteredLeaderboard.slice(3).map((entry) => {
              const league = LEAGUES.find(l => l.id === entry.league) || LEAGUES[0]
              return (
                <div
                  key={entry.id}
                  className={`ios-list-item p-3 flex items-center gap-3 ${
                    entry.id === userId ? `ring-1 ${league.borderColor}` : ''
                  }`}
                >
                  <span className="text-[13px] font-bold text-white/20 w-6 text-center">{entry.rank}</span>
                  <span className="text-[14px]">{entry.statusEmoji}</span>
                  <span className="flex-1 text-[15px] font-medium text-white truncate">{entry.name}</span>
                  <span className={`text-[11px] ${league.textColor}`}>{league.emoji}</span>
                  <span className="text-[14px] font-bold text-[#2AABEE]">{entry.totalXp} XP</span>
                </div>
              )
            })}
          </div>
        )}

        {/* User position — sticky footer */}
        {leaderboard.length > 0 && (
          <div className="glass-card p-3.5 text-center">
            <span className="text-[14px] text-white/40">
              Твоя позиция: <span className="text-[#2AABEE] font-bold">#{leaderboard.find((e) => e.id === userId)?.rank || '—'}</span> · {currentUserLeague.emoji} {currentUserLeague.name}
            </span>
          </div>
        )}
      </div>
    )
  }

  /* ============================================================
     RENDER: SCREEN 4 — ACHIEVEMENTS (iOS style)
     ============================================================ */
  const renderAchievements = () => (
    <div className="px-5 pb-6 space-y-4 ios-fade-in">
      {/* Large title */}
      <div className="pt-3">
        <h1 className="ios-large-title">Ачивки</h1>
      </div>

      {/* iOS segmented control */}
      <div className="ios-segmented flex">
        <button
          onClick={() => setAchievementTab('list')}
          className={`flex-1 py-2 text-[13px] font-semibold rounded-[10px] transition-all z-10 ${
            achievementTab === 'list' ? 'ios-segmented-pill text-white' : 'text-white/35'
          }`}
        >
          Достижения
        </button>
        <button
          onClick={() => setAchievementTab('badges')}
          className={`flex-1 py-2 text-[13px] font-semibold rounded-[10px] transition-all z-10 ${
            achievementTab === 'badges' ? 'ios-segmented-pill text-white' : 'text-white/35'
          }`}
        >
          Бейджи
        </button>
        <button
          onClick={() => setAchievementTab('challenges')}
          className={`flex-1 py-2 text-[13px] font-semibold rounded-[10px] transition-all z-10 ${
            achievementTab === 'challenges' ? 'ios-segmented-pill text-white' : 'text-white/35'
          }`}
        >
          Челленджи
        </button>
      </div>

      {achievementTab === 'list' && (
        <div className="space-y-1.5">
          {allAchievements.map((a) => {
            const catCfg = CATEGORY_MAP[a.category] || CATEGORY_MAP.OTHER
            return (
              <button
                key={a.id}
                onClick={() => setSelectedAchievement(a)}
                className="w-full text-left ios-list-item p-3.5 flex items-center gap-3"
              >
                <div className="w-10 h-10 rounded-full bg-white/6 flex items-center justify-center shrink-0 text-[18px]">
                  {catCfg.emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[15px] font-medium text-white truncate">{a.title}</div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <StatusBadge status={a.status} />
                    {a.status === 'PENDING' && (
                      <span className="text-[11px] text-white/20">запрос: {a.xpRequested} XP</span>
                    )}
                  </div>
                  {a.achievementDate && (
                    <div className="text-[11px] text-white/15 mt-0.5">
                      {new Date(a.achievementDate).toLocaleDateString('ru-RU')}
                    </div>
                  )}
                </div>
                <div className="text-right shrink-0">
                  {a.status === 'APPROVED' && a.xpAwarded > 0 && (
                    <span className="text-[14px] font-bold text-[#34C759]">+{a.xpAwarded}</span>
                  )}
                </div>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="shrink-0 opacity-20">
                  <path d="M5 3L9 7L5 11" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            )
          })}
          {allAchievements.length === 0 && (
            <div className="text-center py-8">
              <p className="text-[15px] text-white/20">Пока нет достижений</p>
            </div>
          )}
        </div>
      )}

      {achievementTab === 'badges' && (
        <div className="grid grid-cols-3 gap-2.5">
          {badges.map((b) => (
            <GlassCard
              key={b.id}
              className={`text-center transition-all ${!b.earned ? 'opacity-30' : ''}`}
            >
              <span className={`text-[32px] ${b.earned ? '' : 'grayscale'}`}>{b.emoji}</span>
              <h4 className="text-[13px] font-semibold text-white mt-2">{b.name}</h4>
              <p className="text-[11px] text-white/30 mt-0.5 leading-tight">{b.description}</p>
              {b.earned && b.earnedAt && (
                <p className="text-[11px] text-[#34C759] mt-1.5">
                  {new Date(b.earnedAt).toLocaleDateString('ru-RU')}
                </p>
              )}
              {!b.earned && (
                <p className="text-[11px] text-white/15 mt-1.5">Не получен</p>
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
                  <h4 className="text-[15px] font-semibold text-white">{ch.title}</h4>
                  <p className="text-[13px] text-white/30 mt-0.5">{ch.description}</p>
                </div>
                {ch.completed && <span className="text-[20px]">✅</span>}
              </div>
              <div className="mt-3">
                <div className="flex items-center justify-between text-[12px] text-white/30 mb-1.5">
                  <span>{ch.xpCollected} / {ch.xpTarget} XP</span>
                  <span className="font-semibold text-[#2AABEE]">+{ch.rewardXp} XP награда</span>
                </div>
                <XpProgressBar current={ch.xpCollected} max={ch.xpTarget} />
              </div>
              {!ch.isJoined && !ch.completed && (
                <button
                  onClick={() => handleJoinChallenge(ch.id)}
                  className="mt-3 w-full py-2.5 bg-[#2AABEE] text-white text-[15px] font-semibold rounded-xl transition-all active:scale-[0.97]"
                >
                  Присоединиться
                </button>
              )}
              {ch.isJoined && !ch.completed && (
                <div className="mt-2 text-[13px] text-[#FF9F0A] font-medium text-center">
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
     RENDER: SCREEN 5 — PROFILE (iOS / Telegram style)
     ============================================================ */
  const renderProfile = () => (
    <div className="px-5 pb-6 space-y-5 ios-fade-in">
      {/* Telegram-style profile header */}
      <div className="text-center pt-6">
        <div className="w-[72px] h-[72px] rounded-full bg-gradient-to-br from-[#2AABEE]/20 to-[#6C5CE7]/20 flex items-center justify-center mx-auto text-[36px] border border-white/8 shadow-lg shadow-[#2AABEE]/10">
          {profile?.statusEmoji || '👤'}
        </div>
        <h2 className="text-[22px] font-bold text-white mt-3">{profile?.name}</h2>
        <p className="text-[14px] text-white/30 mt-0.5">@{profile?.username}</p>
        <div className="flex items-center justify-center gap-2 mt-2">
          <span className="text-[12px] bg-[#2AABEE]/15 text-[#2AABEE] px-3 py-1 rounded-full font-semibold">
            Ур. {profile?.level} — {profile?.levelName}
          </span>
          {isAdmin && (
            <span className="text-[12px] bg-[#FF3B30]/12 text-[#FF3B30] px-3 py-1 rounded-full font-semibold">
              Админ
            </span>
          )}
        </div>
        {profile?.faculty && (
          <span className="inline-flex items-center gap-1 text-[12px] bg-white/5 border border-white/6 px-3 py-1 rounded-full mt-2 text-white/40 font-medium">
            {profile.faculty.emoji} {profile.faculty.name}
          </span>
        )}
      </div>

      {/* Level progress card */}
      <GlassCard>
        <div className="flex items-center justify-between mb-2.5">
          <div>
            <span className="text-[17px] font-bold text-white">Уровень {profile?.level}</span>
            <span className="text-[14px] text-white/35 ml-2">{profile?.levelName}</span>
          </div>
          <span className="text-[20px] font-bold text-[#2AABEE]">{profile?.totalXp} XP</span>
        </div>
        <XpProgressBar current={profile?.xpInLevel || 0} max={profile?.xpToNextLevel || 1} />
      </GlassCard>

      {/* Stats — 2x2 grid with glass cards */}
      <div>
        <h3 className="ios-section-header mb-2 ml-1">Статистика</h3>
        <div className="grid grid-cols-2 gap-2.5">
          <GlassCard className="text-center py-3.5">
            <div className="text-[24px] font-bold text-white">{achievementCounts.total}</div>
            <div className="text-[12px] text-white/30 mt-0.5">Всего</div>
          </GlassCard>
          <GlassCard className="text-center py-3.5">
            <div className="text-[24px] font-bold text-[#34C759]">{achievementCounts.APPROVED}</div>
            <div className="text-[12px] text-white/30 mt-0.5">Одобрено</div>
          </GlassCard>
          <GlassCard className="text-center py-3.5">
            <div className="text-[24px] font-bold text-[#FF9F0A]">{achievementCounts.PENDING}</div>
            <div className="text-[12px] text-white/30 mt-0.5">На проверке</div>
          </GlassCard>
          <GlassCard className="text-center py-3.5">
            <div className="text-[24px] font-bold text-[#FF3B30]">{achievementCounts.REJECTED}</div>
            <div className="text-[12px] text-white/30 mt-0.5">Отклонено</div>
          </GlassCard>
        </div>
      </div>

      {/* Level roadmap — vertical timeline */}
      <div>
        <h3 className="ios-section-header mb-2 ml-1">Путь уровней</h3>
        <GlassCard className="p-0 overflow-hidden">
          {levelRoadmap.map((lvl, idx) => {
            const isCurrent = lvl.level === profile?.level
            const isPassed = (profile?.level || 0) > lvl.level
            return (
              <div
                key={lvl.level}
                className={`flex items-center gap-3 px-4 py-3 ${
                  idx < levelRoadmap.length - 1 ? 'border-b border-white/4' : ''
                } ${isCurrent ? 'bg-[#2AABEE]/8' : isPassed ? 'opacity-30' : ''}`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                  isCurrent ? 'bg-[#2AABEE]/20' : isPassed ? 'bg-[#34C759]/15' : 'bg-white/5'
                }`}>
                  <span className="text-[14px]">{isPassed ? '✅' : isCurrent ? '🎯' : '🔒'}</span>
                </div>
                <div className="flex-1">
                  <div className="text-[15px] font-medium text-white">
                    Ур. {lvl.level}: {lvl.name}
                  </div>
                  <div className="text-[12px] text-white/20">{lvl.min}–{lvl.max === 999999 ? '∞' : lvl.max} XP</div>
                </div>
                {isCurrent && (
                  <span className="text-[12px] font-semibold text-[#2AABEE]">Вы здесь</span>
                )}
              </div>
            )
          })}
        </GlassCard>
      </div>

      {/* XP Dynamics mini chart */}
      <div>
        <h3 className="ios-section-header mb-2 ml-1">XP по месяцам</h3>
        <GlassCard>
          <div className="flex items-end gap-3 h-20">
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
                <div key={idx} className="flex-1 flex flex-col items-center gap-1.5">
                  <div
                    className="w-full rounded-lg transition-all duration-500"
                    style={{
                      height: `${Math.max(height, 5)}%`,
                      background: 'linear-gradient(180deg, #2AABEE, #6C5CE7)',
                      minHeight: '4px',
                    }}
                  />
                  <span className="text-[10px] text-white/20 font-medium">{item.m}</span>
                </div>
              )
            })}
          </div>
        </GlassCard>
      </div>

      {/* My badges — horizontal scroll */}
      <div>
        <h3 className="ios-section-header mb-2 ml-1">Мои бейджи</h3>
        <GlassCard>
          {userBadges.length > 0 ? (
            <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide -mx-1 px-1">
              {userBadges.map((b) => (
                <div key={b.id} className="shrink-0 text-center w-14">
                  <span className="text-[24px]">{b.emoji}</span>
                  <p className="text-[11px] text-white/35 mt-0.5 leading-tight truncate font-medium">{b.name}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[14px] text-white/15 text-center py-2">Пока нет бейджей</p>
          )}
        </GlassCard>
      </div>

      {/* Admin switch & user switch */}
      <div className="pt-2 space-y-2">
        <button
          onClick={switchUser}
          className="w-full py-2.5 text-[13px] text-white/20 hover:text-white/35 transition-colors font-medium"
        >
          Переключить пользователя ({userId === 'u1' ? 'Иван' : 'Ольга'})
        </button>
        {isAdmin && (
          <button
            onClick={() => setShowAdmin(!showAdmin)}
            className="w-full py-2.5 bg-[#FF3B30]/8 text-[#FF3B30] text-[15px] font-semibold rounded-2xl hover:bg-[#FF3B30]/12 transition-colors"
          >
            {showAdmin ? 'Закрыть админ-панель' : 'Открыть админ-панель'}
          </button>
        )}
      </div>
    </div>
  )

  /* ============================================================
     RENDER: ACHIEVEMENT DETAIL MODAL (iOS bottom sheet)
     ============================================================ */
  const renderAchievementDetail = () => {
    if (!selectedAchievement) return null
    const a = selectedAchievement
    const catCfg = CATEGORY_MAP[a.category] || CATEGORY_MAP.OTHER
    return (
      <div className="fixed inset-0 z-50 flex items-end justify-center" onClick={() => setSelectedAchievement(null)}>
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
        <div
          className="relative w-full max-w-lg ios-sheet ios-sheet-up p-6 max-h-[80vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <IosSheetHandle />

          {/* Close button top-right */}
          <button
            onClick={() => setSelectedAchievement(null)}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/8 flex items-center justify-center"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M2 2L10 10M10 2L2 10" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>

          {/* Header */}
          <div className="flex items-center gap-3 mb-5">
            <div className="w-12 h-12 rounded-full bg-white/6 flex items-center justify-center text-[24px]">
              {catCfg.emoji}
            </div>
            <div className="flex-1">
              <h3 className="text-[19px] font-bold text-white">{a.title}</h3>
              <div className="flex items-center gap-2 mt-1">
                <StatusBadge status={a.status} />
                <CategoryTag category={a.category} />
              </div>
            </div>
          </div>

          {a.description && (
            <p className="text-[15px] text-white/45 mb-5 leading-relaxed">{a.description}</p>
          )}

          {/* Detail rows */}
          <div className="space-y-0 mb-5">
            {a.status === 'APPROVED' && (
              <div className="flex justify-between py-3 border-b border-white/4 text-[15px]">
                <span className="text-white/30">Начислено XP</span>
                <span className="text-[#34C759] font-bold">+{a.xpAwarded} XP</span>
              </div>
            )}
            {a.status === 'PENDING' && (
              <div className="flex justify-between py-3 border-b border-white/4 text-[15px]">
                <span className="text-white/30">Запрошено XP</span>
                <span className="text-[#FF9F0A] font-bold">{a.xpRequested} XP</span>
              </div>
            )}
            {a.achievementDate && (
              <div className="flex justify-between py-3 border-b border-white/4 text-[15px]">
                <span className="text-white/30">Дата</span>
                <span className="text-white/50">{new Date(a.achievementDate).toLocaleDateString('ru-RU')}</span>
              </div>
            )}
            {a.comment && (
              <div className="flex justify-between py-3 border-b border-white/4 text-[15px]">
                <span className="text-white/30">Комментарий</span>
                <span className="text-white/50 text-right max-w-[200px]">{a.comment}</span>
              </div>
            )}
            {a.reviewComment && (
              <div className="flex justify-between py-3 text-[15px]">
                <span className="text-white/30">Отзыв</span>
                <span className="text-white/50 text-right max-w-[200px]">{a.reviewComment}</span>
              </div>
            )}
          </div>

          <button
            onClick={() => setSelectedAchievement(null)}
            className="w-full py-3 bg-white/5 text-white/45 text-[15px] font-semibold rounded-2xl hover:bg-white/8 transition-colors"
          >
            Закрыть
          </button>
        </div>
      </div>
    )
  }

  /* ============================================================
     RENDER: ADMIN PANEL (iOS bottom sheet)
     ============================================================ */
  const renderAdmin = () => (
    <div className="fixed inset-0 z-40 flex items-end justify-center" onClick={() => setShowAdmin(false)}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-lg ios-sheet ios-sheet-up p-6 max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <IosSheetHandle />
        <h3 className="text-[22px] font-bold text-white mb-5">Админ-панель</h3>

        {/* Stats */}
        {adminStats && (
          <div className="grid grid-cols-2 gap-2.5 mb-5">
            <GlassCard className="text-center py-3.5">
              <div className="text-[24px] font-bold text-white">{String(adminStats.totalUsers || 0)}</div>
              <div className="text-[12px] text-white/30 mt-0.5">Пользователей</div>
            </GlassCard>
            <GlassCard className="text-center py-3.5">
              <div className="text-[24px] font-bold text-[#34C759]">{String(adminStats.totalAchievements || 0)}</div>
              <div className="text-[12px] text-white/30 mt-0.5">Достижений</div>
            </GlassCard>
          </div>
        )}

        {/* Pending achievements */}
        <h4 className="ios-section-header mb-2">На проверке ({pendingAchievements.length})</h4>
        <div className="space-y-2">
          {pendingAchievements.map((a) => (
            <div key={a.id} className="glass-card p-4">
              <div className="flex-1 min-w-0 mb-3">
                <div className="text-[15px] font-medium text-white">{a.title}</div>
                <div className="text-[13px] text-white/30 mt-0.5">{a.description}</div>
                <div className="flex items-center gap-2 mt-1.5">
                  <CategoryTag category={a.category} />
                  <span className="text-[12px] text-[#FF9F0A] font-semibold">{a.xpRequested} XP</span>
                </div>
                <div className="text-[12px] text-white/20 mt-1">
                  от {a.user?.name || 'Неизвестный'} · {a.achievementDate ? new Date(a.achievementDate).toLocaleDateString('ru-RU') : '—'}
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleModerate(a.id, 'approve', a.xpRequested)}
                  className="flex-1 py-2.5 bg-[#34C759]/12 text-[#34C759] text-[14px] font-semibold rounded-xl hover:bg-[#34C759]/20 transition-colors"
                >
                  Одобрить
                </button>
                <button
                  onClick={() => handleModerate(a.id, 'reject', undefined, undefined, 'Отклонено')}
                  className="flex-1 py-2.5 bg-[#FF3B30]/12 text-[#FF3B30] text-[14px] font-semibold rounded-xl hover:bg-[#FF3B30]/20 transition-colors"
                >
                  Отклонить
                </button>
              </div>
            </div>
          ))}
          {pendingAchievements.length === 0 && (
            <div className="text-center py-6">
              <p className="text-[14px] text-white/15">Нет достижений на проверке</p>
            </div>
          )}
        </div>

        <button
          onClick={() => setShowAdmin(false)}
          className="w-full py-3 mt-5 bg-white/5 text-white/40 text-[15px] font-semibold rounded-2xl hover:bg-white/8 transition-colors"
        >
          Закрыть
        </button>
      </div>
    </div>
  )

  /* ============================================================
     RENDER: BOTTOM NAVIGATION (Telegram iOS style)
     ============================================================ */
  const TAB_CONFIG: { key: Tab; label: string }[] = [
    { key: 'home', label: 'Главная' },
    { key: 'achievements', label: 'Ачивки' },
    { key: 'add', label: '' },
    { key: 'rating', label: 'Рейтинг' },
    { key: 'profile', label: 'Профиль' },
  ]

  const renderTabIcon = (key: Tab, active: boolean) => {
    switch (key) {
      case 'home': return <IconHome active={active} />
      case 'achievements': return <IconMedal active={active} />
      case 'add': return <IconPlus />
      case 'rating': return <IconTrophy active={active} />
      case 'profile': return <IconUser active={active} />
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a1a] flex flex-col">
      {/* Main content */}
      <main className="flex-1 overflow-y-auto pb-24">
        {currentTab === 'home' && renderHome()}
        {currentTab === 'add' && renderAddAchievement()}
        {currentTab === 'rating' && renderRating()}
        {currentTab === 'achievements' && renderAchievements()}
        {currentTab === 'profile' && renderProfile()}
      </main>

      {/* Bottom Navigation — Telegram iOS style frosted glass */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 safe-area-bottom">
        <div className="max-w-lg mx-auto">
          <div className="glass-nav flex items-end justify-around px-1 pt-1.5 pb-2">
            {TAB_CONFIG.map((tab) => {
              const isActive = currentTab === tab.key
              const isAddButton = tab.key === 'add'
              return (
                <button
                  key={tab.key}
                  onClick={() => { setCurrentTab(tab.key); if (tab.key !== 'profile') setShowAdmin(false) }}
                  className={`flex flex-col items-center gap-0.5 py-1 px-2 rounded-xl transition-all ${
                    isAddButton ? '-mt-3' : ''
                  }`}
                >
                  <div className={`${isAddButton ? '' : isActive ? 'scale-110' : ''} transition-transform duration-200`}>
                    {renderTabIcon(tab.key, isActive)}
                  </div>
                  {!isAddButton && (
                    <span className={`text-[10px] font-medium transition-colors ${
                      isActive ? 'text-[#2AABEE]' : 'text-white/25'
                    }`}>
                      {tab.label}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      </nav>

      {/* Modals */}
      {selectedAchievement && renderAchievementDetail()}
      {showAdmin && renderAdmin()}
    </div>
  )
}
