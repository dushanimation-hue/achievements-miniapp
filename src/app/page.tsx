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
  direction: string | null; achievementType: string | null;
  achievementLevel: string | null; placement: number | null;
  xpRequested: number; xpAwarded: number;
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
  { id: 'bronze', name: 'Бронза', color: 'from-amber-800 to-amber-600', borderColor: 'border-amber-700', textColor: 'text-amber-400' },
  { id: 'silver', name: 'Серебро', color: 'from-gray-400 to-gray-300', borderColor: 'border-gray-500', textColor: 'text-gray-300' },
  { id: 'gold', name: 'Золото', color: 'from-yellow-500 to-amber-400', borderColor: 'border-yellow-500', textColor: 'text-yellow-400' },
  { id: 'platinum', name: 'Платина', color: 'from-cyan-400 to-blue-400', borderColor: 'border-cyan-400', textColor: 'text-cyan-400' },
  { id: 'diamond', name: 'Алмаз', color: 'from-purple-500 to-pink-400', borderColor: 'border-purple-400', textColor: 'text-purple-400' },
]

function getLeagueByRank(totalUsers: number, rank: number): typeof LEAGUES[number] {
  if (totalUsers <= 1) return LEAGUES[0]
  const p = (rank - 1) / (totalUsers - 1)
  if (p >= 0.8) return LEAGUES[4]
  if (p >= 0.6) return LEAGUES[3]
  if (p >= 0.4) return LEAGUES[2]
  if (p >= 0.2) return LEAGUES[1]
  return LEAGUES[0]
}

const ACHIEVEMENT_TYPES: Record<string, { label: string; icon: string }> = {
  SPORT: { label: 'Спортивное', icon: 'sport' },
  CREATIVE: { label: 'Творческое', icon: 'creative' },
  OLYMPIAD: { label: 'РЭШ / ВСОШ', icon: 'olympiad' },
  FREE_FORM: { label: 'Свободная форма', icon: 'freeform' },
}

const ACHIEVEMENT_LEVELS: Record<string, { label: string; baseXp: number }> = {
  SCHOOL: { label: 'Школьный', baseXp: 2 },
  DISTRICT: { label: 'Районный', baseXp: 4 },
  CITY: { label: 'Городской', baseXp: 7 },
  REGIONAL: { label: 'Региональный', baseXp: 12 },
  ALL_RUSSIAN: { label: 'Всероссийский', baseXp: 20 },
  INTERNATIONAL: { label: 'Международный', baseXp: 25 },
}

const PLACEMENTS: Record<number, { label: string; multiplier: number }> = {
  1: { label: '1 место', multiplier: 1.0 },
  2: { label: '2 место', multiplier: 0.8 },
  3: { label: '3 место', multiplier: 0.6 },
  0: { label: 'Участник', multiplier: 0.3 },
}

const DIRECTIONS: Record<string, { label: string }> = {
  KNOWLEDGE: { label: 'Знание' },
  WILL: { label: 'Воля' },
  SKILLS: { label: 'Навыки' },
  COMMUNITY: { label: 'Сообщество' },
  MORALITY: { label: 'Нравственность' },
}

const STATUS_CONFIG: Record<string, { label: string; color: string; dotColor: string }> = {
  APPROVED: { label: 'Одобрено', color: 'text-[#34C759]', dotColor: 'bg-[#34C759]' },
  PENDING: { label: 'На проверке', color: 'text-[#FF9F0A]', dotColor: 'bg-[#FF9F0A]' },
  REJECTED: { label: 'Отклонено', color: 'text-[#FF3B30]', dotColor: 'bg-[#FF3B30]' },
}

type Tab = 'home' | 'achievements' | 'rating' | 'profile'
type AchievementType = 'SPORT' | 'CREATIVE' | 'OLYMPIAD' | 'FREE_FORM' | ''
type AchievementLevel = 'SCHOOL' | 'DISTRICT' | 'CITY' | 'REGIONAL' | 'ALL_RUSSIAN' | 'INTERNATIONAL' | ''

function calculateAutoXp(level: AchievementLevel, placement: number): number {
  if (!level) return 1
  const base = ACHIEVEMENT_LEVELS[level]?.baseXp || 2
  const mult = PLACEMENTS[placement]?.multiplier ?? 0.3
  return Math.max(1, Math.round(base * mult))
}

/* ============================================================
   SVG ICONS — SF Symbols style, NO EMOJI
   ============================================================ */

function IconHome({ active }: { active: boolean }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path d="M3 12L5 10M5 10L12 3L19 10M5 10V20C5 20.5523 5.44772 21 6 21H9M19 10L21 12M19 10V20C19 20.5523 18.5523 21 18 21H15M9 21C9 21 9 15 12 15C15 15 15 21 15 21M9 21H15"
        stroke={active ? '#2AABEE' : 'currentColor'} strokeWidth={active ? 2 : 1.5}
        strokeLinecap="round" strokeLinejoin="round"
        fill={active ? 'rgba(42,171,238,0.12)' : 'none'} />
    </svg>
  )
}

function IconAchievements({ active }: { active: boolean }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="14" r="6" stroke={active ? '#2AABEE' : 'currentColor'} strokeWidth={active ? 2 : 1.5}
        fill={active ? 'rgba(42,171,238,0.12)' : 'none'} />
      <path d="M9.5 3L12 8L14.5 3" stroke={active ? '#2AABEE' : 'currentColor'} strokeWidth={active ? 2 : 1.5}
        strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="12" cy="14" r="2.5" stroke={active ? '#2AABEE' : 'currentColor'} strokeWidth={active ? 1.5 : 1}
        fill={active ? 'rgba(42,171,238,0.25)' : 'none'} />
    </svg>
  )
}

function IconTrophy({ active }: { active: boolean }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path d="M12 17C13.5 17 15 16 15 14H9C9 16 10.5 17 12 17ZM12 17V20M8 20H16M7 4H17V10C17 12.7614 14.7614 15 12 15C9.23858 15 7 12.7614 7 10V4ZM5 6C5 5 5.5 4 7 4M19 6C19 5 18.5 4 17 4"
        stroke={active ? '#2AABEE' : 'currentColor'} strokeWidth={active ? 2 : 1.5}
        strokeLinecap="round" strokeLinejoin="round"
        fill={active ? 'rgba(42,171,238,0.12)' : 'none'} />
    </svg>
  )
}

function IconUser({ active }: { active: boolean }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="8" r="4" stroke={active ? '#2AABEE' : 'currentColor'} strokeWidth={active ? 2 : 1.5}
        fill={active ? 'rgba(42,171,238,0.12)' : 'none'} />
      <path d="M4 20C4 16.6863 7.58172 14 12 14C16.4183 14 20 16.6863 20 20"
        stroke={active ? '#2AABEE' : 'currentColor'} strokeWidth={active ? 2 : 1.5}
        strokeLinecap="round" fill={active ? 'rgba(42,171,238,0.08)' : 'none'} />
    </svg>
  )
}

function IconPlus({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <path d="M10 4V16M4 10H16" stroke="white" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

function IconChevron({ direction = 'right', size = 14 }: { direction?: 'right' | 'down'; size?: number }) {
  const d = direction === 'right' ? 'M5 3L9 7L5 11' : 'M3 5L7 9L11 5'
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" fill="none">
      <path d={d} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function IconClose({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" fill="none">
      <path d="M3 3L11 11M11 3L3 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

function IconSport() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="5" r="3" stroke="#2AABEE" strokeWidth="1.5" />
      <path d="M6 22L9 12H15L18 22" stroke="#2AABEE" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9 12L7 8M15 12L17 8M12 12V9" stroke="#2AABEE" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

function IconCreative() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path d="M12 2L14.09 8.26L21 9.27L16 14.14L17.18 21.02L12 17.77L6.82 21.02L8 14.14L3 9.27L9.91 8.26L12 2Z"
        stroke="#6C5CE7" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="rgba(108,92,231,0.1)" />
    </svg>
  )
}

function IconOlympiad() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <rect x="3" y="3" width="18" height="18" rx="4" stroke="#FF9F0A" strokeWidth="1.5" fill="rgba(255,159,10,0.08)" />
      <path d="M9 8L12 12L15 8" stroke="#FF9F0A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M8 15H16M12 12V17" stroke="#FF9F0A" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

function IconFreeForm() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path d="M11 4H4V18C4 19.1046 4.89543 20 6 20H18C19.1046 20 20 19.1046 20 18V13" stroke="#34C759" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M18.5 2.50001C19.3284 1.67158 20.6716 1.67158 21.5 2.50001C22.3284 3.32844 22.3284 4.67158 21.5 5.50001L12 15L8 16L9 12L18.5 2.50001Z"
        stroke="#34C759" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="rgba(52,199,89,0.08)" />
    </svg>
  )
}

function IconUpload() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path d="M12 15V7M8 10L12 6L16 10" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4 17V19C4 20.1046 4.89543 21 6 21H18C19.1046 21 20 20.1046 20 19V17" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

function IconCheck() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M3 8L7 12L13 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function IconX() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M4 4L12 12M12 4L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
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
        style={{ width: `${pct}%`, background: 'linear-gradient(90deg, #2AABEE, #6C5CE7)' }}
      />
    </div>
  )
}

function StatusDot({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.PENDING
  return (
    <span className={`inline-flex items-center gap-1.5 text-[12px] font-medium ${cfg.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dotColor}`} />
      {cfg.label}
    </span>
  )
}

function AchievementTypeIcon({ type }: { type: string | null }) {
  switch (type) {
    case 'SPORT': return <IconSport />
    case 'CREATIVE': return <IconCreative />
    case 'OLYMPIAD': return <IconOlympiad />
    case 'FREE_FORM': return <IconFreeForm />
    default: return <IconAchievements active={false} />
  }
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
  const [showAddSheet, setShowAddSheet] = useState(false)
  const [formAchievementType, setFormAchievementType] = useState<AchievementType>('')
  const [formTitle, setFormTitle] = useState('')
  const [formDesc, setFormDesc] = useState('')
  const [formLevel, setFormLevel] = useState<AchievementLevel>('')
  const [formPlacement, setFormPlacement] = useState(1)
  const [formXp, setFormXp] = useState(5)
  const [formDate, setFormDate] = useState('')
  const [formComment, setFormComment] = useState('')

  // Achievement detail modal
  const [selectedAchievement, setSelectedAchievement] = useState<Achievement | null>(null)

  // Admin panel
  const [showAdmin, setShowAdmin] = useState(false)
  const [pendingAchievements, setPendingAchievements] = useState<Achievement[]>([])
  const [adminStats, setAdminStats] = useState<Record<string, unknown> | null>(null)
  const [adminDirection, setAdminDirection] = useState('')
  const [adminXp, setAdminXp] = useState(0)

  // Rating filters
  const [ratingFaculty, setRatingFaculty] = useState('all')
  const [ratingPeriod, setRatingPeriod] = useState('all')
  const [selectedLeague, setSelectedLeague] = useState<string | null>(null)

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

  useEffect(() => { fetchProfile(); fetchAchievements() }, [fetchProfile, fetchAchievements])

  useEffect(() => {
    if (currentTab === 'achievements') { fetchBadges(); fetchChallenges() }
  }, [currentTab, fetchBadges, fetchChallenges])

  useEffect(() => {
    if (currentTab === 'rating') fetchLeaderboard()
  }, [currentTab, fetchLeaderboard])

  useEffect(() => {
    if (showAdmin) { fetchPending(); fetchAdminStats() }
  }, [showAdmin, fetchPending, fetchAdminStats])

  // Auto-calculate XP when level or placement changes
  useEffect(() => {
    if (formAchievementType && formAchievementType !== 'FREE_FORM' && formLevel) {
      setFormXp(calculateAutoXp(formLevel, formPlacement))
    }
  }, [formAchievementType, formLevel, formPlacement])

  const resetForm = () => {
    setFormAchievementType(''); setFormTitle(''); setFormDesc('')
    setFormLevel(''); setFormPlacement(1); setFormXp(5)
    setFormDate(''); setFormComment('')
  }

  const handleAddAchievement = async () => {
    if (!formTitle || !formAchievementType) {
      toast.error('Заполните название и тип достижения')
      return
    }
    if (formAchievementType !== 'FREE_FORM' && !formLevel) {
      toast.error('Выберите уровень достижения')
      return
    }
    try {
      const body: Record<string, unknown> = {
        userId,
        title: formTitle,
        description: formDesc || null,
        achievementType: formAchievementType,
        achievementLevel: formAchievementType !== 'FREE_FORM' ? formLevel : null,
        placement: formAchievementType !== 'FREE_FORM' ? formPlacement : null,
        xpRequested: formXp,
        achievementDate: formDate || null,
        comment: formComment || null,
      }
      const res = await fetch('/api/achievements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) { toast.error('Ошибка при создании'); return }
      toast.success('Достижение отправлено на проверку!')
      resetForm()
      setShowAddSheet(false)
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
          achievementId, action, xpAwarded, direction, reviewComment, adminUserId: userId,
        }),
      })
      if (!res.ok) return
      toast.success(action === 'approve' ? 'Достижение одобрено' : 'Достижение отклонено')
      fetchPending(); fetchAdminStats(); fetchProfile()
    } catch {
      toast.error('Ошибка')
    }
  }

  const switchUser = () => {
    const newId = userId === 'u1' ? 'u7' : 'u1'
    setUserId(newId); setCurrentTab('home'); setShowAdmin(false)
  }

  const isAdmin = profile?.role === 'ADMIN'

  const currentUserLeague = leaderboard.length > 0
    ? getLeagueByRank(leaderboard.length, leaderboard.find(e => e.id === userId)?.rank || leaderboard.length)
    : LEAGUES[0]

  /* ============================================================
     RENDER: HOME
     ============================================================ */
  const renderHome = () => (
    <div className="px-5 pb-6 space-y-5 ios-fade-in">
      <div className="pt-3">
        <h1 className="ios-large-title">Привет, {profile?.name || '...'}</h1>
        <p className="text-[15px] text-white/40 mt-1 font-medium">
          {profile?.statusPrefix} · {profile?.faculty?.name}
        </p>
      </div>

      {/* Level card */}
      <GlassCard elevated className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#2AABEE]/8 to-[#6C5CE7]/8" />
        <div className="relative">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-[#2AABEE]/15 flex items-center justify-center">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M10 2L12.5 7.5L18 8.5L14 12.5L15 18L10 15.5L5 18L6 12.5L2 8.5L7.5 7.5L10 2Z" fill="#2AABEE" stroke="#2AABEE" strokeWidth="0.5" />
                </svg>
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

      {/* League + Stats row */}
      <div className="grid grid-cols-2 gap-2.5">
        <GlassCard className="relative overflow-hidden">
          <div className={`absolute inset-0 bg-gradient-to-br ${currentUserLeague.color} opacity-8`} />
          <div className="relative">
            <div className="ios-section-header text-[10px]">Лига</div>
            <div className={`text-[17px] font-bold ${currentUserLeague.textColor} mt-0.5`}>{currentUserLeague.name}</div>
            <div className="text-[11px] text-white/25 mt-0.5">Переход каждую четверть</div>
          </div>
        </GlassCard>
        <GlassCard>
          <div className="ios-section-header text-[10px]">Достижения</div>
          <div className="text-[17px] font-bold text-white mt-0.5">{achievementCounts.APPROVED}</div>
          <div className="text-[11px] text-white/25 mt-0.5">одобрено из {achievementCounts.total}</div>
        </GlassCard>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-2.5">
        <button onClick={() => { setCurrentTab('achievements'); setShowAddSheet(true) }}
          className="glass-card flex items-center gap-3 py-3.5 px-4 active:scale-[0.97] ios-spring">
          <div className="w-9 h-9 rounded-xl bg-[#2AABEE]/12 flex items-center justify-center">
            <IconPlus size={16} />
          </div>
          <span className="text-[13px] text-white/60 font-semibold">Добавить</span>
        </button>
        <button onClick={() => setCurrentTab('rating')}
          className="glass-card flex items-center gap-3 py-3.5 px-4 active:scale-[0.97] ios-spring">
          <div className="w-9 h-9 rounded-xl bg-[#6C5CE7]/12 flex items-center justify-center">
            <IconTrophy active={false} />
          </div>
          <span className="text-[13px] text-white/60 font-semibold">Рейтинг</span>
        </button>
      </div>

      {/* Recent achievements */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="ios-section-header">Последние достижения</h3>
          <button onClick={() => setCurrentTab('achievements')} className="text-[13px] text-[#2AABEE] font-medium">Все</button>
        </div>
        <div className="space-y-1.5">
          {recentAchievements.map((a) => (
            <button key={a.id} onClick={() => setSelectedAchievement(a)}
              className="w-full text-left ios-list-item p-3.5 flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center shrink-0">
                <AchievementTypeIcon type={a.achievementType} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[15px] font-medium text-white truncate">{a.title}</div>
                <StatusDot status={a.status} />
              </div>
              <div className="text-right shrink-0">
                {a.status === 'APPROVED' && a.xpAwarded > 0 && (
                  <span className="text-[14px] font-bold text-[#34C759]">+{a.xpAwarded}</span>
                )}
              </div>
              <div className="text-white/15 shrink-0"><IconChevron /></div>
            </button>
          ))}
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
     RENDER: ACHIEVEMENTS LIST
     ============================================================ */
  const renderAchievements = () => (
    <div className="px-5 pb-6 space-y-4 ios-fade-in">
      <div className="pt-3 flex items-center justify-between">
        <h1 className="ios-large-title">Достижения</h1>
        <button onClick={() => setShowAddSheet(true)}
          className="w-9 h-9 rounded-xl bg-[#2AABEE] flex items-center justify-center active:scale-95 ios-spring">
          <IconPlus size={18} />
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-1.5 overflow-x-auto scrollbar-hide">
        {[
          { key: 'all', label: 'Все' },
          { key: 'SPORT', label: 'Спорт' },
          { key: 'CREATIVE', label: 'Творчество' },
          { key: 'OLYMPIAD', label: 'РЭШ/ВСОШ' },
          { key: 'FREE_FORM', label: 'Свободные' },
        ].map((f) => (
          <button key={f.key}
            className="shrink-0 ios-pill">{f.label}</button>
        ))}
      </div>

      {/* Achievement list */}
      <div className="space-y-1.5">
        {allAchievements.map((a) => (
          <button key={a.id} onClick={() => setSelectedAchievement(a)}
            className="w-full text-left ios-list-item p-3.5 flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center shrink-0">
              <AchievementTypeIcon type={a.achievementType} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[15px] font-medium text-white truncate">{a.title}</div>
              <div className="flex items-center gap-2 mt-0.5">
                <StatusDot status={a.status} />
                {a.achievementLevel && a.achievementType !== 'FREE_FORM' && (
                  <span className="text-[11px] text-white/20">
                    {ACHIEVEMENT_LEVELS[a.achievementLevel]?.label || a.achievementLevel}
                    {a.placement !== null && a.placement !== undefined && a.placement > 0 && ` · ${a.placement} место`}
                  </span>
                )}
              </div>
            </div>
            <div className="text-right shrink-0">
              {a.status === 'APPROVED' && a.xpAwarded > 0 && (
                <span className="text-[14px] font-bold text-[#34C759]">+{a.xpAwarded}</span>
              )}
              {a.status === 'PENDING' && (
                <span className="text-[12px] text-white/20">{a.xpRequested} XP</span>
              )}
            </div>
            <div className="text-white/15 shrink-0"><IconChevron /></div>
          </button>
        ))}
        {allAchievements.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-3">
              <IconAchievements active={false} />
            </div>
            <p className="text-[15px] text-white/25 font-medium">Пока нет достижений</p>
            <button onClick={() => setShowAddSheet(true)}
              className="mt-3 text-[14px] text-[#2AABEE] font-semibold">Добавить первое</button>
          </div>
        )}
      </div>

      {/* Badges section */}
      {badges.length > 0 && (
        <div>
          <h3 className="ios-section-header mb-3">Бейджи</h3>
          <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-1">
            {badges.filter(b => b.earned).map((b) => (
              <div key={b.id} className="shrink-0 w-16 text-center">
                <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center mx-auto text-[22px]">
                  {b.emoji}
                </div>
                <p className="text-[10px] text-white/35 mt-1 leading-tight font-medium">{b.name}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Challenges */}
      {challenges.filter(c => c.isActive).length > 0 && (
        <div>
          <h3 className="ios-section-header mb-3">Активные челленджи</h3>
          <div className="space-y-2">
            {challenges.filter(c => c.isActive).map((ch) => (
              <GlassCard key={ch.id} className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h4 className="text-[15px] font-semibold text-white">{ch.title}</h4>
                    <p className="text-[12px] text-white/30 mt-0.5">{ch.description}</p>
                  </div>
                  {ch.completed && (
                    <div className="w-6 h-6 rounded-full bg-[#34C759]/15 flex items-center justify-center shrink-0">
                      <IconCheck />
                    </div>
                  )}
                </div>
                <div className="mt-3">
                  <div className="flex items-center justify-between text-[12px] text-white/30 mb-1.5">
                    <span>{ch.xpCollected} / {ch.xpTarget} XP</span>
                    <span className="font-semibold text-[#2AABEE]">+{ch.rewardXp} XP</span>
                  </div>
                  <XpProgressBar current={ch.xpCollected} max={ch.xpTarget} />
                </div>
                {!ch.isJoined && !ch.completed && (
                  <button onClick={() => handleJoinChallenge(ch.id)}
                    className="mt-3 w-full py-2.5 bg-[#2AABEE]/12 text-[#2AABEE] text-[14px] font-semibold rounded-xl active:scale-[0.97] transition-transform">
                    Присоединиться
                  </button>
                )}
              </GlassCard>
            ))}
          </div>
        </div>
      )}
    </div>
  )

  /* ============================================================
     RENDER: ADD ACHIEVEMENT (bottom sheet)
     ============================================================ */
  const renderAddSheet = () => {
    if (!showAddSheet) return null
    return (
      <div className="fixed inset-0 z-50 flex items-end justify-center" onClick={() => { setShowAddSheet(false); resetForm() }}>
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
        <div className="relative w-full max-w-lg ios-sheet ios-sheet-up max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}>
          <div className="p-6">
            <IosSheetHandle />

            {/* Header */}
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-[22px] font-bold text-white">Новое достижение</h3>
              <button onClick={() => { setShowAddSheet(false); resetForm() }}
                className="w-8 h-8 rounded-full bg-white/8 flex items-center justify-center text-white/40">
                <IconClose />
              </button>
            </div>

            {/* Step 1: Choose type */}
            {!formAchievementType && (
              <div className="space-y-2.5 ios-fade-in">
                <p className="text-[14px] text-white/40 mb-3">Выберите тип достижения</p>
                {Object.entries(ACHIEVEMENT_TYPES).map(([key, val]) => (
                  <button key={key} onClick={() => setFormAchievementType(key as AchievementType)}
                    className="w-full text-left glass-card p-4 flex items-center gap-4 active:scale-[0.98] ios-spring">
                    <div className="w-11 h-11 rounded-2xl bg-white/5 flex items-center justify-center shrink-0">
                      {key === 'SPORT' && <IconSport />}
                      {key === 'CREATIVE' && <IconCreative />}
                      {key === 'OLYMPIAD' && <IconOlympiad />}
                      {key === 'FREE_FORM' && <IconFreeForm />}
                    </div>
                    <div>
                      <div className="text-[16px] font-semibold text-white">{val.label}</div>
                    </div>
                    <div className="ml-auto text-white/15"><IconChevron /></div>
                  </button>
                ))}
              </div>
            )}

            {/* Step 2: Form for chosen type */}
            {formAchievementType && (
              <div className="space-y-4 ios-fade-in">
                {/* Type badge + back */}
                <div className="flex items-center gap-3 mb-1">
                  <button onClick={() => { setFormAchievementType(''); setFormLevel(''); setFormPlacement(1) }}
                    className="text-[13px] text-[#2AABEE] font-medium">Изменить тип</button>
                  <span className="text-[13px] text-white/30">
                    {ACHIEVEMENT_TYPES[formAchievementType]?.label}
                  </span>
                </div>

                {/* Title */}
                <div>
                  <label className="text-[13px] font-medium text-white/40 mb-1.5 block">Название *</label>
                  <input type="text" value={formTitle} onChange={(e) => setFormTitle(e.target.value)}
                    placeholder={formAchievementType === 'SPORT' ? 'Соревнования по плаванию' : formAchievementType === 'CREATIVE' ? 'Конкурс чтецов' : formAchievementType === 'OLYMPIAD' ? 'ВСОШ по математике' : 'Моё достижение'}
                    className="glass-input w-full px-4 py-3 text-[15px] text-white placeholder-white/20 bg-transparent border-0 focus:ring-0 focus:shadow-none rounded-xl" />
                </div>

                {/* Description */}
                <div>
                  <label className="text-[13px] font-medium text-white/40 mb-1.5 block">Описание</label>
                  <textarea value={formDesc} onChange={(e) => setFormDesc(e.target.value)}
                    placeholder="Расскажите подробнее..." rows={2}
                    className="glass-input w-full px-4 py-3 text-[15px] text-white placeholder-white/20 bg-transparent border-0 focus:ring-0 focus:shadow-none resize-none rounded-xl" />
                </div>

                {/* Non-free-form: Level + Placement */}
                {formAchievementType !== 'FREE_FORM' && (
                  <>
                    {/* Level selector */}
                    <div>
                      <label className="text-[13px] font-medium text-white/40 mb-2 block">Уровень</label>
                      <div className="grid grid-cols-3 gap-2">
                        {Object.entries(ACHIEVEMENT_LEVELS).map(([key, val]) => (
                          <button key={key} onClick={() => setFormLevel(key as AchievementLevel)}
                            className={`py-2.5 px-3 rounded-xl text-[13px] font-medium transition-all ${
                              formLevel === key
                                ? 'bg-[#2AABEE]/15 border border-[#2AABEE]/30 text-[#2AABEE]'
                                : 'bg-white/5 border border-white/6 text-white/40'
                            }`}>
                            <div>{val.label}</div>
                            <div className="text-[10px] opacity-60 mt-0.5">до {val.baseXp} XP</div>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Placement selector */}
                    <div>
                      <label className="text-[13px] font-medium text-white/40 mb-2 block">Место</label>
                      <div className="grid grid-cols-4 gap-2">
                        {Object.entries(PLACEMENTS).map(([key, val]) => (
                          <button key={key} onClick={() => setFormPlacement(Number(key))}
                            className={`py-2.5 px-2 rounded-xl text-[13px] font-medium transition-all ${
                              formPlacement === Number(key)
                                ? 'bg-[#2AABEE]/15 border border-[#2AABEE]/30 text-[#2AABEE]'
                                : 'bg-white/5 border border-white/6 text-white/40'
                            }`}>
                            {val.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Auto-calculated XP */}
                    {formLevel && (
                      <GlassCard className="p-4">
                        <div className="flex items-center justify-between">
                          <span className="text-[14px] text-white/50">Начисление XP</span>
                          <div className="text-right">
                            <span className="text-[22px] font-bold text-[#2AABEE]">{formXp} XP</span>
                          </div>
                        </div>
                        <p className="text-[11px] text-white/20 mt-2">
                          {ACHIEVEMENT_LEVELS[formLevel]?.label} уровень · {PLACEMENTS[formPlacement]?.label} · {Math.round((PLACEMENTS[formPlacement]?.multiplier ?? 1) * 100)}% от базового
                        </p>
                      </GlassCard>
                    )}
                  </>
                )}

                {/* Free form: custom XP */}
                {formAchievementType === 'FREE_FORM' && (
                  <div>
                    <label className="text-[13px] font-medium text-white/40 mb-1.5 block">Запрашиваемый XP</label>
                    <input type="number" min={1} max={25} value={formXp} onChange={(e) => setFormXp(Number(e.target.value))}
                      className="glass-input w-full px-4 py-3 text-[15px] text-white bg-transparent border-0 focus:ring-0 focus:shadow-none rounded-xl" />
                    <p className="text-[11px] text-white/20 mt-1.5">Администратор рассмотрит и может изменить количество</p>
                  </div>
                )}

                {/* Date */}
                <div>
                  <label className="text-[13px] font-medium text-white/40 mb-1.5 block">Дата</label>
                  <input type="date" value={formDate} onChange={(e) => setFormDate(e.target.value)}
                    className="glass-input w-full px-4 py-3 text-[15px] text-white bg-transparent border-0 focus:ring-0 focus:shadow-none [color-scheme:dark] rounded-xl" />
                </div>

                {/* Photo upload placeholder */}
                <div>
                  <label className="text-[13px] font-medium text-white/40 mb-1.5 block">Подтверждение</label>
                  <GlassCard className="flex flex-col items-center py-5 border border-dashed border-white/8">
                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center mb-2">
                      <IconUpload />
                    </div>
                    <p className="text-[13px] text-white/20">Загрузка фото (скоро)</p>
                  </GlassCard>
                </div>

                {/* Comment */}
                <div>
                  <label className="text-[13px] font-medium text-white/40 mb-1.5 block">Комментарий</label>
                  <textarea value={formComment} onChange={(e) => setFormComment(e.target.value)}
                    placeholder="Дополнительная информация..." rows={2}
                    className="glass-input w-full px-4 py-3 text-[15px] text-white placeholder-white/20 bg-transparent border-0 focus:ring-0 focus:shadow-none resize-none rounded-xl" />
                </div>

                {/* Submit */}
                <button onClick={handleAddAchievement} className="ios-button-primary w-full">
                  Отправить на проверку
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  /* ============================================================
     RENDER: RATING
     ============================================================ */
  const renderRating = () => {
    const filteredLeaderboard = selectedLeague
      ? leaderboard.filter(e => e.league === selectedLeague)
      : leaderboard

    return (
      <div className="px-5 pb-6 space-y-4 ios-fade-in">
        <div className="pt-3">
          <h1 className="ios-large-title">Рейтинг</h1>
        </div>

        {/* League segmented */}
        <div className="ios-segmented flex">
          <button onClick={() => setSelectedLeague(null)}
            className={`flex-1 py-2 text-[12px] font-semibold rounded-[10px] transition-all z-10 ${
              selectedLeague === null ? 'ios-segmented-pill text-white' : 'text-white/35'}`}>
            Все
          </button>
          {LEAGUES.map((league) => (
            <button key={league.id} onClick={() => setSelectedLeague(league.id === selectedLeague ? null : league.id)}
              className={`flex-1 py-2 text-[12px] font-semibold rounded-[10px] transition-all z-10 ${
                selectedLeague === league.id ? 'ios-segmented-pill text-white' : 'text-white/35'}`}>
              {league.name}
            </button>
          ))}
        </div>

        {/* Period + Faculty pills */}
        <div className="flex gap-1.5 overflow-x-auto scrollbar-hide">
          {[
            { key: 'all', label: 'Всё время' },
            { key: 'month', label: 'Месяц' },
            { key: 'quarter', label: 'Квартал' },
            { key: 'year', label: 'Год' },
          ].map((p) => (
            <button key={p.key} onClick={() => setRatingPeriod(p.key)}
              className={`shrink-0 ${ratingPeriod === p.key ? 'ios-pill-active' : 'ios-pill'}`}>
              {p.label}
            </button>
          ))}
        </div>

        {/* Leaderboard */}
        {loading ? (
          <div className="text-center py-12"><p className="text-[15px] text-white/20">Загрузка...</p></div>
        ) : (
          <div className="space-y-1.5">
            {filteredLeaderboard.map((entry) => {
              const league = LEAGUES.find(l => l.id === entry.league) || LEAGUES[0]
              const isTop3 = entry.rank <= 3
              const isMe = entry.id === userId
              return (
                <div key={entry.id}
                  className={`ios-list-item p-3.5 flex items-center gap-3 ${isMe ? `ring-1 ${league.borderColor}` : ''}`}>
                  {/* Rank */}
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                    entry.rank === 1 ? 'bg-[#FFD700]/15' : entry.rank === 2 ? 'bg-gray-400/15' : entry.rank === 3 ? 'bg-amber-600/15' : 'bg-white/5'
                  }`}>
                    <span className={`text-[13px] font-bold ${
                      entry.rank === 1 ? 'text-[#FFD700]' : entry.rank === 2 ? 'text-gray-400' : entry.rank === 3 ? 'text-amber-600' : 'text-white/20'
                    }`}>{entry.rank}</span>
                  </div>

                  {/* Name */}
                  <div className="flex-1 min-w-0">
                    <div className="text-[15px] font-medium text-white truncate">{entry.name}</div>
                    <div className="text-[12px] text-white/25">{entry.faculty?.name} · Ур. {entry.level}</div>
                  </div>

                  {/* League + XP */}
                  <span className={`text-[11px] ${league.textColor} font-medium`}>{league.name}</span>
                  <span className="text-[14px] font-bold text-[#2AABEE]">{entry.totalXp}</span>
                </div>
              )
            })}
          </div>
        )}

        {/* User position */}
        {leaderboard.length > 0 && (
          <div className="glass-card p-3.5 text-center">
            <span className="text-[14px] text-white/40">
              Твоя позиция: <span className="text-[#2AABEE] font-bold">#{leaderboard.find((e) => e.id === userId)?.rank || '—'}</span> · {currentUserLeague.name}
            </span>
          </div>
        )}
      </div>
    )
  }

  /* ============================================================
     RENDER: PROFILE
     ============================================================ */
  const renderProfile = () => (
    <div className="px-5 pb-6 space-y-5 ios-fade-in">
      {/* Profile header */}
      <div className="text-center pt-6">
        <div className="w-[72px] h-[72px] rounded-full bg-gradient-to-br from-[#2AABEE]/20 to-[#6C5CE7]/20 flex items-center justify-center mx-auto border border-white/8 shadow-lg shadow-[#2AABEE]/10">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="8" r="4" stroke="#2AABEE" strokeWidth="1.5" fill="rgba(42,171,238,0.15)" />
            <path d="M4 20C4 16.6863 7.58172 14 12 14C16.4183 14 20 16.6863 20 20" stroke="#2AABEE" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </div>
        <h2 className="text-[22px] font-bold text-white mt-3">{profile?.name}</h2>
        <p className="text-[14px] text-white/30 mt-0.5">@{profile?.username}</p>
        <div className="flex items-center justify-center gap-2 mt-2">
          <span className="text-[12px] bg-[#2AABEE]/12 text-[#2AABEE] px-3 py-1 rounded-full font-semibold">
            Ур. {profile?.level} — {profile?.levelName}
          </span>
          {isAdmin && (
            <span className="text-[12px] bg-[#FF3B30]/10 text-[#FF3B30] px-3 py-1 rounded-full font-semibold">
              Админ
            </span>
          )}
        </div>
        {profile?.faculty && (
          <span className="inline-block text-[12px] bg-white/5 border border-white/6 px-3 py-1 rounded-full mt-2 text-white/35 font-medium">
            {profile.faculty.name}
          </span>
        )}
      </div>

      {/* Level progress */}
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

      {/* Stats grid */}
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

      {/* Level roadmap */}
      <div>
        <h3 className="ios-section-header mb-2 ml-1">Путь уровней</h3>
        <GlassCard className="p-0 overflow-hidden">
          {levelRoadmap.map((lvl, idx) => {
            const isCurrent = lvl.level === profile?.level
            const isPassed = (profile?.level || 0) > lvl.level
            return (
              <div key={lvl.level}
                className={`flex items-center gap-3 px-4 py-3 ${
                  idx < levelRoadmap.length - 1 ? 'border-b border-white/4' : ''
                } ${isCurrent ? 'bg-[#2AABEE]/6' : isPassed ? 'opacity-30' : ''}`}>
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                  isCurrent ? 'bg-[#2AABEE]/20' : isPassed ? 'bg-[#34C759]/15' : 'bg-white/5'
                }`}>
                  {isPassed ? (
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 7L6 10L11 4" stroke="#34C759" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  ) : isCurrent ? (
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="3" fill="#2AABEE" /></svg>
                  ) : (
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="3" stroke="rgba(255,255,255,0.15)" strokeWidth="1" /></svg>
                  )}
                </div>
                <div className="flex-1">
                  <div className="text-[15px] font-medium text-white">Ур. {lvl.level}: {lvl.name}</div>
                  <div className="text-[12px] text-white/20">{lvl.min}–{lvl.max === 999999 ? '∞' : lvl.max} XP</div>
                </div>
                {isCurrent && <span className="text-[12px] font-semibold text-[#2AABEE]">Вы здесь</span>}
              </div>
            )
          })}
        </GlassCard>
      </div>

      {/* My badges */}
      {userBadges.length > 0 && (
        <div>
          <h3 className="ios-section-header mb-2 ml-1">Мои бейджи</h3>
          <GlassCard>
            <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide -mx-1 px-1">
              {userBadges.map((b) => (
                <div key={b.id} className="shrink-0 text-center w-14">
                  <span className="text-[22px]">{b.emoji}</span>
                  <p className="text-[10px] text-white/35 mt-0.5 leading-tight truncate font-medium">{b.name}</p>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>
      )}

      {/* Admin & switch */}
      <div className="pt-2 space-y-2">
        <button onClick={switchUser}
          className="w-full py-2.5 text-[13px] text-white/20 hover:text-white/35 transition-colors font-medium">
          Переключить пользователя ({userId === 'u1' ? 'Иван' : 'Ольга'})
        </button>
        {isAdmin && (
          <button onClick={() => setShowAdmin(!showAdmin)}
            className="w-full py-2.5 bg-[#FF3B30]/8 text-[#FF3B30] text-[15px] font-semibold rounded-2xl hover:bg-[#FF3B30]/12 transition-colors">
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
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
        <div className="relative w-full max-w-lg ios-sheet ios-sheet-up p-6 max-h-[80vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}>
          <IosSheetHandle />

          <div className="flex items-center gap-3 mb-5">
            <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center">
              <AchievementTypeIcon type={a.achievementType} />
            </div>
            <div className="flex-1">
              <h3 className="text-[19px] font-bold text-white">{a.title}</h3>
              <div className="flex items-center gap-2 mt-1">
                <StatusDot status={a.status} />
                {a.achievementType && (
                  <span className="text-[11px] text-white/30">{ACHIEVEMENT_TYPES[a.achievementType]?.label}</span>
                )}
              </div>
            </div>
          </div>

          {a.description && (
            <p className="text-[15px] text-white/45 mb-5 leading-relaxed">{a.description}</p>
          )}

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
            {a.achievementLevel && a.achievementType !== 'FREE_FORM' && (
              <div className="flex justify-between py-3 border-b border-white/4 text-[15px]">
                <span className="text-white/30">Уровень</span>
                <span className="text-white/50">{ACHIEVEMENT_LEVELS[a.achievementLevel]?.label}</span>
              </div>
            )}
            {a.placement !== null && a.placement !== undefined && a.achievementType !== 'FREE_FORM' && (
              <div className="flex justify-between py-3 border-b border-white/4 text-[15px]">
                <span className="text-white/30">Место</span>
                <span className="text-white/50">{a.placement === 0 ? 'Участник' : `${a.placement} место`}</span>
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

          <button onClick={() => setSelectedAchievement(null)}
            className="w-full py-3 bg-white/5 text-white/45 text-[15px] font-semibold rounded-2xl hover:bg-white/8 transition-colors">
            Закрыть
          </button>
        </div>
      </div>
    )
  }

  /* ============================================================
     RENDER: ADMIN PANEL (bottom sheet)
     ============================================================ */
  const renderAdmin = () => (
    <div className="fixed inset-0 z-40 flex items-end justify-center" onClick={() => setShowAdmin(false)}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div className="relative w-full max-w-lg ios-sheet ios-sheet-up p-6 max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}>
        <IosSheetHandle />
        <h3 className="text-[22px] font-bold text-white mb-5">Админ-панель</h3>

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

        <h4 className="ios-section-header mb-2">На проверке ({pendingAchievements.length})</h4>
        <div className="space-y-2">
          {pendingAchievements.map((a) => (
            <div key={a.id} className="glass-card p-4">
              <div className="flex-1 min-w-0 mb-3">
                <div className="text-[15px] font-medium text-white">{a.title}</div>
                <div className="text-[13px] text-white/30 mt-0.5">{a.description}</div>
                <div className="flex items-center gap-2 mt-1.5">
                  {a.achievementType && (
                    <span className="text-[11px] bg-white/5 text-white/40 px-2 py-0.5 rounded-full font-medium">
                      {ACHIEVEMENT_TYPES[a.achievementType]?.label}
                    </span>
                  )}
                  <span className="text-[12px] text-[#FF9F0A] font-semibold">{a.xpRequested} XP</span>
                </div>
                <div className="text-[12px] text-white/20 mt-1">
                  от {a.user?.name || 'Неизвестный'} · {a.achievementDate ? new Date(a.achievementDate).toLocaleDateString('ru-RU') : '—'}
                </div>
              </div>

              {/* Direction selector for admin */}
              <div className="mb-3">
                <label className="text-[11px] text-white/30 mb-1.5 block">Направление (категория)</label>
                <div className="flex gap-1.5 flex-wrap">
                  {Object.entries(DIRECTIONS).map(([key, val]) => (
                    <button key={key}
                      onClick={() => setAdminDirection(key)}
                      className={`text-[11px] py-1 px-2.5 rounded-full font-medium transition-all ${
                        adminDirection === key
                          ? 'bg-[#2AABEE]/15 border border-[#2AABEE]/30 text-[#2AABEE]'
                          : 'bg-white/5 border border-white/6 text-white/35'
                      }`}>
                      {val.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* XP override */}
              <div className="mb-3">
                <label className="text-[11px] text-white/30 mb-1.5 block">Начислить XP</label>
                <input type="number" min={0} max={25} defaultValue={a.xpRequested}
                  onChange={(e) => setAdminXp(Number(e.target.value))}
                  className="glass-input w-full px-3 py-2 text-[14px] text-white bg-transparent border-0 focus:ring-0 focus:shadow-none rounded-xl" />
              </div>

              <div className="flex gap-2">
                <button onClick={() => handleModerate(a.id, 'approve', adminXp || a.xpRequested, adminDirection || undefined)}
                  className="flex-1 py-2.5 bg-[#34C759]/12 text-[#34C759] text-[14px] font-semibold rounded-xl active:scale-[0.97] transition-transform flex items-center justify-center gap-1.5">
                  <IconCheck /> Одобрить
                </button>
                <button onClick={() => handleModerate(a.id, 'reject', undefined, undefined, 'Отклонено')}
                  className="flex-1 py-2.5 bg-[#FF3B30]/12 text-[#FF3B30] text-[14px] font-semibold rounded-xl active:scale-[0.97] transition-transform flex items-center justify-center gap-1.5">
                  <IconX /> Отклонить
                </button>
              </div>
            </div>
          ))}
          {pendingAchievements.length === 0 && (
            <div className="text-center py-6"><p className="text-[14px] text-white/15">Нет достижений на проверке</p></div>
          )}
        </div>

        <button onClick={() => setShowAdmin(false)}
          className="w-full py-3 mt-5 bg-white/5 text-white/40 text-[15px] font-semibold rounded-2xl hover:bg-white/8 transition-colors">
          Закрыть
        </button>
      </div>
    </div>
  )

  /* ============================================================
     RENDER: BOTTOM NAVIGATION (4 tabs)
     ============================================================ */
  const TAB_CONFIG: { key: Tab; label: string }[] = [
    { key: 'home', label: 'Главная' },
    { key: 'achievements', label: 'Достижения' },
    { key: 'rating', label: 'Рейтинг' },
    { key: 'profile', label: 'Профиль' },
  ]

  const renderTabIcon = (key: Tab, active: boolean) => {
    switch (key) {
      case 'home': return <IconHome active={active} />
      case 'achievements': return <IconAchievements active={active} />
      case 'rating': return <IconTrophy active={active} />
      case 'profile': return <IconUser active={active} />
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a1a] flex flex-col">
      <main className="flex-1 overflow-y-auto pb-24">
        {currentTab === 'home' && renderHome()}
        {currentTab === 'achievements' && renderAchievements()}
        {currentTab === 'rating' && renderRating()}
        {currentTab === 'profile' && renderProfile()}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 safe-area-bottom">
        <div className="max-w-lg mx-auto">
          <div className="glass-nav flex items-center justify-around px-2 pt-2 pb-2">
            {TAB_CONFIG.map((tab) => {
              const isActive = currentTab === tab.key
              return (
                <button key={tab.key}
                  onClick={() => { setCurrentTab(tab.key); if (tab.key !== 'profile') setShowAdmin(false) }}
                  className="flex flex-col items-center gap-0.5 py-1 px-3 rounded-xl transition-all">
                  <div className={`${isActive ? 'scale-110' : ''} transition-transform duration-200`}>
                    {renderTabIcon(tab.key, isActive)}
                  </div>
                  <span className={`text-[10px] font-medium transition-colors ${
                    isActive ? 'text-[#2AABEE]' : 'text-white/25'
                  }`}>
                    {tab.label}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      </nav>

      {/* Modals */}
      {showAddSheet && renderAddSheet()}
      {selectedAchievement && renderAchievementDetail()}
      {showAdmin && renderAdmin()}
    </div>
  )
}
