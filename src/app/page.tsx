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
  league: string;
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
interface LeaderboardEntry {
  rank: number; id: string; name: string; username: string | null;
  totalXp: number; level: number; statusEmoji: string; statusPrefix: string;
  faculty: Faculty | null; achievementCount: number; league: string;
}
interface LevelInfo { level: number; name: string; min: number; max: number }
interface AuthUser { id: string; name: string; login: string; role: string; faculty: Faculty | null }

/* ============================================================
   CONSTANTS — Updated thresholds
   ============================================================ */

const LEVELS: LevelInfo[] = [
  { level: 1, name: 'Новичок', min: 0, max: 29 },
  { level: 2, name: 'Активный', min: 30, max: 74 },
  { level: 3, name: 'Олимпиадник', min: 75, max: 149 },
  { level: 4, name: 'Ботан', min: 150, max: 299 },
  { level: 5, name: 'Мастер', min: 300, max: 599 },
  { level: 6, name: 'Элита', min: 600, max: 1499 },
  { level: 7, name: 'Легенда', min: 1500, max: 999999 },
]

const LEAGUES = [
  { id: 'bronze', name: 'Бронза', cssClass: 'league-badge-bronze' },
  { id: 'silver', name: 'Серебро', cssClass: 'league-badge-silver' },
  { id: 'gold', name: 'Золото', cssClass: 'league-badge-gold' },
]

function getLeague(id: string) {
  return LEAGUES.find(l => l.id === id) || LEAGUES[0]
}

const ACHIEVEMENT_TYPES: Record<string, { label: string }> = {
  SPORT: { label: 'Спортивное' },
  CREATIVE: { label: 'Творческое' },
  OLYMPIAD: { label: 'РЭШ / ВСОШ' },
  FREE_FORM: { label: 'Свободная форма' },
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
   SVG ICONS — Professional, NO EMOJI in UI
   ============================================================ */

function IconHome({ active }: { active: boolean }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path d="M3 12L5 10M5 10L12 3L19 10M5 10V20C5 20.5523 5.44772 21 6 21H9M19 10L21 12M19 10V20C19 20.5523 18.5523 21 18 21H15M9 21C9 21 9 15 12 15C15 15 15 21 15 21M9 21H15"
        stroke={active ? '#007AFF' : 'currentColor'} strokeWidth={active ? 2 : 1.5}
        strokeLinecap="round" strokeLinejoin="round"
        fill={active ? 'rgba(0,122,255,0.1)' : 'none'} />
    </svg>
  )
}

function IconAchievements({ active }: { active: boolean }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="14" r="6" stroke={active ? '#007AFF' : 'currentColor'} strokeWidth={active ? 2 : 1.5}
        fill={active ? 'rgba(0,122,255,0.1)' : 'none'} />
      <path d="M9.5 3L12 8L14.5 3" stroke={active ? '#007AFF' : 'currentColor'} strokeWidth={active ? 2 : 1.5}
        strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="12" cy="14" r="2.5" stroke={active ? '#007AFF' : 'currentColor'} strokeWidth={active ? 1.5 : 1}
        fill={active ? 'rgba(0,122,255,0.2)' : 'none'} />
    </svg>
  )
}

function IconTrophy({ active }: { active: boolean }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path d="M12 17C13.5 17 15 16 15 14H9C9 16 10.5 17 12 17ZM12 17V20M8 20H16M7 4H17V10C17 12.7614 14.7614 15 12 15C9.23858 15 7 12.7614 7 10V4ZM5 6C5 5 5.5 4 7 4M19 6C19 5 18.5 4 17 4"
        stroke={active ? '#007AFF' : 'currentColor'} strokeWidth={active ? 2 : 1.5}
        strokeLinecap="round" strokeLinejoin="round"
        fill={active ? 'rgba(0,122,255,0.1)' : 'none'} />
    </svg>
  )
}

function IconUser({ active }: { active: boolean }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="8" r="4" stroke={active ? '#007AFF' : 'currentColor'} strokeWidth={active ? 2 : 1.5}
        fill={active ? 'rgba(0,122,255,0.1)' : 'none'} />
      <path d="M4 20C4 16.6863 7.58172 14 12 14C16.4183 14 20 16.6863 20 20"
        stroke={active ? '#007AFF' : 'currentColor'} strokeWidth={active ? 2 : 1.5}
        strokeLinecap="round" fill={active ? 'rgba(0,122,255,0.06)' : 'none'} />
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
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="5" r="3" stroke="#007AFF" strokeWidth="1.5" />
      <path d="M6 22L9 12H15L18 22" stroke="#007AFF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9 12L7 8M15 12L17 8M12 12V9" stroke="#007AFF" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

function IconCreative() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path d="M12 2L14.09 8.26L21 9.27L16 14.14L17.18 21.02L12 17.77L6.82 21.02L8 14.14L3 9.27L9.91 8.26L12 2Z"
        stroke="#5856D6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="rgba(88,86,214,0.08)" />
    </svg>
  )
}

function IconOlympiad() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <rect x="3" y="3" width="18" height="18" rx="4" stroke="#FF9F0A" strokeWidth="1.5" fill="rgba(255,159,10,0.06)" />
      <path d="M9 8L12 12L15 8" stroke="#FF9F0A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M8 15H16M12 12V17" stroke="#FF9F0A" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

function IconFreeForm() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path d="M11 4H4V18C4 19.1046 4.89543 20 6 20H18C19.1046 20 20 19.1046 20 18V13" stroke="#34C759" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M18.5 2.50001C19.3284 1.67158 20.6716 1.67158 21.5 2.50001C22.3284 3.32844 22.3284 4.67158 21.5 5.50001L12 15L8 16L9 12L18.5 2.50001Z"
        stroke="#34C759" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="rgba(52,199,89,0.06)" />
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

function IconShield() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path d="M12 2L4 6V12C4 16.4183 7.58172 20.5 12 22C16.4183 20.5 20 16.4183 20 12V6L12 2Z"
        stroke="#007AFF" strokeWidth="1.5" strokeLinejoin="round" fill="rgba(0,122,255,0.06)" />
      <path d="M9 12L11 14L15 10" stroke="#007AFF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function IconLogout() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path d="M9 21H5C4.44772 21 4 20.5523 4 20V4C4 3.44772 4.44772 3 5 3H9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M16 17L21 12L16 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M21 12H9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

function IconCrown() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path d="M2 17L4.5 8L8 12L12 4L16 12L19.5 8L22 17H2Z" fill="rgba(255,215,0,0.15)" stroke="#FFD700" strokeWidth="1.5" strokeLinejoin="round" />
      <circle cx="12" cy="19" r="1.5" fill="#FFD700" />
    </svg>
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

/* ============================================================
   HELPER COMPONENTS
   ============================================================ */

function GlassCard({ children, className = '', elevated = false, pro = false }: { children: React.ReactNode; className?: string; elevated?: boolean; pro?: boolean }) {
  const cls = pro ? 'glass-card-pro' : elevated ? 'glass-card-elevated' : 'glass-card'
  return (
    <div className={`${cls} p-5 ${className}`}>
      {children}
    </div>
  )
}

function XpProgressBar({ current, max, className = '' }: { current: number; max: number; className?: string }) {
  const pct = max > 0 ? Math.min((current / max) * 100, 100) : 0
  return (
    <div className={`w-full bg-white/6 rounded-full h-1.5 overflow-hidden ${className}`}>
      <div
        className="h-full rounded-full transition-all duration-700 ease-out"
        style={{ width: `${pct}%`, background: 'linear-gradient(90deg, #007AFF, #5856D6)' }}
      />
    </div>
  )
}

function StatusDot({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.PENDING
  return (
    <span className={`inline-flex items-center gap-1.5 text-[11px] font-medium ${cfg.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dotColor}`} />
      {cfg.label}
    </span>
  )
}

function IosSheetHandle() {
  return <div className="w-9 h-1 bg-white/15 rounded-full mx-auto mb-5" />
}

function getInitials(name: string): string {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
  return parts[0].substring(0, 2).toUpperCase()
}

const AVATAR_COLORS = [
  'from-[#007AFF] to-[#5856D6]',
  'from-[#5856D6] to-[#AF52DE]',
  'from-[#34C759] to-[#007AFF]',
  'from-[#FF9F0A] to-[#FF3B30]',
  'from-[#AF52DE] to-[#FF3B80]',
  'from-[#007AFF] to-[#34C759]',
]

function getAvatarColor(name: string): string {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}

/* ============================================================
   LOGIN SCREEN
   ============================================================ */

function LoginScreen({ onLogin }: { onLogin: (user: AuthUser) => void }) {
  const [login, setLogin] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async () => {
    if (!login || !password) { setError('Введите логин и пароль'); return }
    setLoading(true); setError('')
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ login, password }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Ошибка входа'); return }
      onLogin(data.user)
    } catch {
      setError('Ошибка сети')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-5 relative overflow-hidden">
      {/* Background orbs for glassmorphism */}
      <div className="bg-orb bg-orb-1" />
      <div className="bg-orb bg-orb-2" />
      <div className="bg-orb bg-orb-3" />

      <div className="glass-login p-8 w-full max-w-sm relative z-10">
        {/* Logo area */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-[#007AFF]/10 border border-[#007AFF]/20 flex items-center justify-center mx-auto mb-4">
            <IconShield />
          </div>
          <h1 className="text-[22px] font-bold text-white tracking-tight">Достижения</h1>
          <p className="text-[14px] text-white/30 mt-1.5">Платформа лицея</p>
        </div>

        {/* Form */}
        <div className="space-y-3.5">
          <div>
            <label className="text-[12px] font-medium text-white/30 mb-1.5 block uppercase tracking-wider">Логин</label>
            <input type="text" value={login} onChange={(e) => setLogin(e.target.value)}
              placeholder="Введите логин"
              className="glass-input w-full px-4 py-3 text-[15px] text-white placeholder-white/20 bg-transparent focus:ring-0 focus:shadow-none" />
          </div>
          <div>
            <label className="text-[12px] font-medium text-white/30 mb-1.5 block uppercase tracking-wider">Пароль</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
              placeholder="Введите пароль"
              onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
              className="glass-input w-full px-4 py-3 text-[15px] text-white placeholder-white/20 bg-transparent focus:ring-0 focus:shadow-none" />
          </div>

          {error && <p className="text-[13px] text-[#FF3B30] text-center">{error}</p>}

          <button onClick={handleLogin} disabled={loading}
            className="ios-button-primary w-full disabled:opacity-50 mt-2">
            {loading ? 'Вход...' : 'Войти'}
          </button>
        </div>

        {/* Demo credentials */}
        <div className="mt-6 pt-5 border-t border-white/6">
          <p className="text-[11px] text-white/20 text-center uppercase tracking-wider mb-3">Демо-доступ</p>
          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => { setLogin('admin'); setPassword('admin123') }}
              className="py-2 px-3 rounded-xl bg-white/4 border border-white/6 text-[12px] text-white/40 hover:bg-white/6 transition-colors text-center">
              <div className="font-semibold text-white/60">admin</div>
              <div>Администратор</div>
            </button>
            <button onClick={() => { setLogin('student'); setPassword('student123') }}
              className="py-2 px-3 rounded-xl bg-white/4 border border-white/6 text-[12px] text-white/40 hover:bg-white/6 transition-colors text-center">
              <div className="font-semibold text-white/60">student</div>
              <div>Ученик</div>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ============================================================
   MAIN APP
   ============================================================ */

export default function Home() {
  const [authUser, setAuthUser] = useState<AuthUser | null>(null)
  const [authChecked, setAuthChecked] = useState(false)
  const [currentTab, setCurrentTab] = useState<Tab>('home')
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [recentAchievements, setRecentAchievements] = useState<Achievement[]>([])
  const [achievementCounts, setAchievementCounts] = useState({ total: 0, APPROVED: 0, PENDING: 0, REJECTED: 0 })
  const [allAchievements, setAllAchievements] = useState<Achievement[]>([])
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
  const [formAchievementFilter, setFormAchievementFilter] = useState('all')

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

  const userId = authUser?.id || ''

  // Auth check on mount
  useEffect(() => {
    const stored = localStorage.getItem('auth_user')
    if (stored) {
      try { setAuthUser(JSON.parse(stored)) } catch {}
    }
    setAuthChecked(true)
  }, [])

  const handleLogin = (user: AuthUser) => {
    setAuthUser(user)
    localStorage.setItem('auth_user', JSON.stringify(user))
  }

  const handleLogout = () => {
    setAuthUser(null)
    setProfile(null)
    localStorage.removeItem('auth_user')
  }

  const fetchProfile = useCallback(async () => {
    if (!userId) return
    try {
      const res = await fetch(`/api/profile?userId=${userId}`)
      if (!res.ok) return
      const data = await res.json()
      setProfile(data.user)
      setRecentAchievements(data.recentAchievements || [])
      setAchievementCounts(data.achievementCounts || { total: 0, APPROVED: 0, PENDING: 0, REJECTED: 0 })
    } catch (e) {
      console.error('Profile fetch error:', e)
    }
  }, [userId])

  const fetchAchievements = useCallback(async () => {
    if (!userId) return
    try {
      const res = await fetch(`/api/achievements?userId=${userId}`)
      if (!res.ok) return
      const data = await res.json()
      setAllAchievements(data.achievements || [])
    } catch (e) {
      console.error('Achievements fetch error:', e)
    }
  }, [userId])

  const fetchLeaderboard = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (ratingFaculty && ratingFaculty !== 'all') params.set('facultyId', ratingFaculty)
      if (ratingPeriod && ratingPeriod !== 'all') params.set('period', ratingPeriod)
      if (selectedLeague && selectedLeague !== 'all') params.set('league', selectedLeague)
      const res = await fetch(`/api/rating?${params.toString()}`)
      if (!res.ok) return
      const data = await res.json()
      setLeaderboard(data.leaderboard || [])
    } catch (e) {
      console.error('Leaderboard fetch error:', e)
    } finally {
      setLoading(false)
    }
  }, [ratingFaculty, ratingPeriod, selectedLeague])

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

  useEffect(() => { if (userId) { fetchProfile(); fetchAchievements() } }, [userId, fetchProfile, fetchAchievements])

  useEffect(() => {
    if (currentTab === 'rating') fetchLeaderboard()
  }, [currentTab, fetchLeaderboard])

  useEffect(() => {
    if (showAdmin) { fetchPending(); fetchAdminStats() }
  }, [showAdmin, fetchPending, fetchAdminStats])

  // Auto-calculate XP
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
      fetchPending(); fetchAdminStats(); fetchProfile(); fetchAchievements()
    } catch {
      toast.error('Ошибка')
    }
  }

  const isAdmin = profile?.role === 'ADMIN'
  const userLeague = getLeague(profile?.league || 'bronze')

  // Filtered achievements
  const filteredAchievements = formAchievementFilter === 'all'
    ? allAchievements
    : allAchievements.filter(a => a.achievementType === formAchievementFilter)

  /* ============================================================
     AUTH GATE
     ============================================================ */
  if (!authChecked) return null
  if (!authUser) return <LoginScreen onLogin={handleLogin} />

  /* ============================================================
     RENDER: HOME
     ============================================================ */
  const renderHome = () => (
    <div className="px-5 pb-6 space-y-5 ios-fade-in">
      <div className="pt-3 flex items-center justify-between">
        <div>
          <h1 className="ios-large-title">{profile?.name || '...'}</h1>
          <p className="text-[14px] text-white/30 mt-0.5 font-medium">
            {profile?.statusPrefix}
          </p>
        </div>
        <button onClick={handleLogout} className="w-9 h-9 rounded-xl bg-white/4 border border-white/6 flex items-center justify-center text-white/30 hover:bg-white/6 transition-colors">
          <IconLogout />
        </button>
      </div>

      {/* Level card — Professional credit-card style */}
      <div className="level-card-pro p-5 relative">
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#007AFF]/12 border border-[#007AFF]/20 flex items-center justify-center">
                <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
                  <path d="M10 2L12.5 7.5L18 8.5L14 12.5L15 18L10 15.5L5 18L6 12.5L2 8.5L7.5 7.5L10 2Z" fill="#007AFF" stroke="#007AFF" strokeWidth="0.5" />
                </svg>
              </div>
              <div>
                <div className="text-[12px] text-white/30 font-medium uppercase tracking-wider">Уровень</div>
                <div className="text-[18px] font-bold text-white">{profile?.level} · {profile?.levelName}</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-[22px] font-bold text-[#007AFF] tabular-nums">{profile?.totalXp}</div>
              <div className="text-[11px] text-white/25 font-medium">XP</div>
            </div>
          </div>
          <XpProgressBar current={profile?.xpInLevel || 0} max={profile?.xpToNextLevel || 1} />
          {profile?.nextLevelName && (
            <p className="text-[11px] text-white/25 mt-2 text-center">
              До «{profile.nextLevelName}» — ещё {Math.max(0, (profile.nextLevelXp || 0) - (profile.totalXp))} XP
            </p>
          )}
        </div>
      </div>

      {/* League + Stats row */}
      <div className="grid grid-cols-3 gap-2">
        <GlassCard className="p-4">
          <div className="ios-section-header text-[9px]">Лига</div>
          <div className={`mt-1.5 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[13px] font-bold ${userLeague.cssClass}`}>
            {userLeague.name}
          </div>
        </GlassCard>
        <GlassCard className="p-4">
          <div className="ios-section-header text-[9px]">Достижения</div>
          <div className="text-[18px] font-bold text-white mt-1.5 tabular-nums">{achievementCounts.APPROVED}</div>
          <div className="text-[10px] text-white/20 mt-0.5">из {achievementCounts.total}</div>
        </GlassCard>
        <GlassCard className="p-4">
          <div className="ios-section-header text-[9px]">На проверке</div>
          <div className="text-[18px] font-bold text-[#FF9F0A] mt-1.5 tabular-nums">{achievementCounts.PENDING}</div>
          <div className="text-[10px] text-white/20 mt-0.5">ожидает</div>
        </GlassCard>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-2">
        <button onClick={() => { setCurrentTab('achievements'); setTimeout(() => setShowAddSheet(true), 100) }}
          className="glass-card flex items-center gap-3 py-3 px-4 active:scale-[0.97] ios-spring">
          <div className="w-9 h-9 rounded-xl bg-[#007AFF]/10 border border-[#007AFF]/15 flex items-center justify-center">
            <IconPlus size={16} />
          </div>
          <span className="text-[13px] text-white/50 font-semibold">Добавить</span>
        </button>
        <button onClick={() => setCurrentTab('rating')}
          className="glass-card flex items-center gap-3 py-3 px-4 active:scale-[0.97] ios-spring">
          <div className="w-9 h-9 rounded-xl bg-[#5856D6]/10 border border-[#5856D6]/15 flex items-center justify-center">
            <IconTrophy active={false} />
          </div>
          <span className="text-[13px] text-white/50 font-semibold">Рейтинг</span>
        </button>
      </div>

      {/* Admin quick access */}
      {isAdmin && (
        <button onClick={() => setShowAdmin(true)}
          className="glass-card w-full flex items-center gap-3 py-3 px-4 active:scale-[0.97] ios-spring">
          <div className="w-9 h-9 rounded-xl bg-[#FF9F0A]/10 border border-[#FF9F0A]/15 flex items-center justify-center">
            <IconShield />
          </div>
          <span className="text-[13px] text-white/50 font-semibold">Модерация</span>
          {pendingAchievements.length > 0 && (
            <span className="ml-auto px-2 py-0.5 rounded-full bg-[#FF9F0A]/15 text-[11px] font-bold text-[#FF9F0A]">{pendingAchievements.length}</span>
          )}
        </button>
      )}

      {/* Recent achievements */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="ios-section-header">Последние достижения</h3>
          <button onClick={() => setCurrentTab('achievements')} className="text-[13px] text-[#007AFF] font-medium">Все</button>
        </div>
        <div className="space-y-1.5">
          {recentAchievements.map((a) => (
            <button key={a.id} onClick={() => setSelectedAchievement(a)}
              className="w-full text-left ios-list-item p-3.5 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-white/4 flex items-center justify-center shrink-0">
                <AchievementTypeIcon type={a.achievementType} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[14px] font-medium text-white truncate">{a.title}</div>
                <StatusDot status={a.status} />
              </div>
              <div className="text-right shrink-0">
                {a.status === 'APPROVED' && a.xpAwarded > 0 && (
                  <span className="text-[13px] font-bold text-[#34C759]">+{a.xpAwarded}</span>
                )}
              </div>
              <div className="text-white/10 shrink-0"><IconChevron /></div>
            </button>
          ))}
          {recentAchievements.length === 0 && (
            <div className="text-center py-8">
              <p className="text-[14px] text-white/15">Пока нет достижений</p>
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
          className="w-9 h-9 rounded-xl bg-[#007AFF] flex items-center justify-center active:scale-95 ios-spring">
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
          <button key={f.key} onClick={() => setFormAchievementFilter(f.key)}
            className={`shrink-0 ios-pill ${formAchievementFilter === f.key ? 'ios-pill-active' : ''}`}>
            {f.label}
          </button>
        ))}
      </div>

      {/* Achievement list */}
      <div className="space-y-1.5 max-h-[60vh] overflow-y-auto">
        {filteredAchievements.map((a) => (
          <button key={a.id} onClick={() => setSelectedAchievement(a)}
            className="w-full text-left ios-list-item p-3.5 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/4 flex items-center justify-center shrink-0">
              <AchievementTypeIcon type={a.achievementType} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[14px] font-medium text-white truncate">{a.title}</div>
              <div className="flex items-center gap-2 mt-0.5">
                <StatusDot status={a.status} />
                {a.achievementLevel && a.achievementType !== 'FREE_FORM' && (
                  <span className="text-[10px] text-white/20">
                    {ACHIEVEMENT_LEVELS[a.achievementLevel]?.label || a.achievementLevel}
                    {a.placement !== null && a.placement !== undefined && a.placement > 0 && ` · ${a.placement} место`}
                  </span>
                )}
              </div>
            </div>
            <div className="text-right shrink-0">
              {a.status === 'APPROVED' && a.xpAwarded > 0 && (
                <span className="text-[13px] font-bold text-[#34C759]">+{a.xpAwarded}</span>
              )}
              {a.status === 'PENDING' && (
                <span className="text-[11px] text-white/15">{a.xpRequested} XP</span>
              )}
            </div>
            <div className="text-white/10 shrink-0"><IconChevron /></div>
          </button>
        ))}
        {filteredAchievements.length === 0 && (
          <div className="text-center py-12">
            <div className="w-14 h-14 rounded-2xl bg-white/4 flex items-center justify-center mx-auto mb-3">
              <IconAchievements active={false} />
            </div>
            <p className="text-[14px] text-white/20 font-medium">Пока нет достижений</p>
            <button onClick={() => setShowAddSheet(true)}
              className="mt-3 text-[13px] text-[#007AFF] font-semibold">Добавить первое</button>
          </div>
        )}
      </div>
    </div>
  )

  /* ============================================================
     RENDER: RATING — With Top-3 Podium
     ============================================================ */
  const renderRating = () => {
    const top3 = leaderboard.slice(0, 3)
    const rest = leaderboard.slice(3)
    const podiumOrder = top3.length >= 3 ? [top3[1], top3[0], top3[2]] : top3.length === 2 ? [top3[1], top3[0]] : top3

    const podiumHeights = ['h-20', 'h-28', 'h-16']
    const podiumColors = [
      'from-[#C0C0C0]/20 to-[#C0C0C0]/5 border-[#C0C0C0]/20',
      'from-[#FFD700]/25 to-[#FFD700]/5 border-[#FFD700]/25',
      'from-[#CD7F32]/20 to-[#CD7F32]/5 border-[#CD7F32]/20',
    ]
    const podiumRanks = [2, 1, 3]

    return (
      <div className="px-5 pb-6 space-y-4 ios-fade-in">
        <div className="pt-3">
          <h1 className="ios-large-title">Рейтинг</h1>
        </div>

        {/* League filter — text only, no emoji */}
        <div className="flex gap-2">
          {[
            { key: null, label: 'Все' },
            { key: 'bronze', label: 'Бронза' },
            { key: 'silver', label: 'Серебро' },
            { key: 'gold', label: 'Золото' },
          ].map((f) => (
            <button key={f.key || 'all'} onClick={() => setSelectedLeague(f.key)}
              className={`shrink-0 ios-pill ${selectedLeague === f.key ? 'ios-pill-active' : ''}`}>
              {f.label}
            </button>
          ))}
        </div>

        {/* Top 3 Podium */}
        {!loading && top3.length > 0 && (
          <div className="flex items-end justify-center gap-2 pt-4 pb-2">
            {podiumOrder.map((entry, idx) => {
              const actualRank = podiumRanks[idx]
              const heightClass = actualRank === 1 ? 'h-28' : actualRank === 2 ? 'h-20' : 'h-16'
              const colorClass = actualRank === 1
                ? 'from-[#FFD700]/25 to-[#FFD700]/5 border-[#FFD700]/25'
                : actualRank === 2
                  ? 'from-[#C0C0C0]/20 to-[#C0C0C0]/5 border-[#C0C0C0]/20'
                  : 'from-[#CD7F32]/20 to-[#CD7F32]/5 border-[#CD7F32]/20'
              const isMe = entry.id === userId
              const entryLeague = getLeague(entry.league)
              const initials = getInitials(entry.name)
              const avatarGrad = getAvatarColor(entry.name)
              return (
                <div key={entry.id} className="flex flex-col items-center" style={{ width: actualRank === 1 ? '120px' : '100px' }}>
                  {/* Avatar + Name */}
                  <div className={`relative mb-2 ${actualRank === 1 ? 'order-1' : 'order-1'}`}>
                    {actualRank === 1 && (
                      <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
                        <IconCrown />
                      </div>
                    )}
                    <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${avatarGrad} flex items-center justify-center text-white font-bold text-[14px] border-2 ${actualRank === 1 ? 'border-[#FFD700]/50 w-14 h-14 text-[16px]' : actualRank === 2 ? 'border-[#C0C0C0]/40' : 'border-[#CD7F32]/40'} ${isMe ? 'ring-2 ring-[#007AFF]/50 ring-offset-2 ring-offset-[#08080f]' : ''}`}>
                      {initials}
                    </div>
                  </div>
                  <div className="text-center mb-1.5">
                    <div className={`text-[12px] font-semibold text-white truncate max-w-[100px] ${isMe ? 'text-[#007AFF]' : ''}`}>
                      {entry.name}
                    </div>
                    <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded ${entryLeague.cssClass}`}>{entryLeague.name}</span>
                  </div>
                  {/* Podium block */}
                  <div className={`w-full bg-gradient-to-t ${colorClass} border rounded-t-xl flex flex-col items-center justify-start pt-2 ${heightClass}`}>
                    <div className={`text-[20px] font-black ${actualRank === 1 ? 'text-[#FFD700]' : actualRank === 2 ? 'text-[#C0C0C0]' : 'text-[#CD7F32]'}`}>
                      {actualRank}
                    </div>
                    <div className="text-[11px] font-bold text-white/60 tabular-nums">{entry.totalXp} XP</div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Rest of leaderboard */}
        <div className="space-y-1.5 max-h-[50vh] overflow-y-auto">
          {loading && <div className="text-center py-8 text-white/20 text-[14px]">Загрузка...</div>}
          {!loading && rest.map((entry) => {
            const entryLeague = getLeague(entry.league)
            const isMe = entry.id === userId
            const initials = getInitials(entry.name)
            const avatarGrad = getAvatarColor(entry.name)
            return (
              <div key={entry.id} className={`glass-card p-3.5 flex items-center gap-3 ${isMe ? 'border-[#007AFF]/20 bg-[#007AFF]/6' : ''}`}>
                <div className="w-8 text-[15px] font-bold text-center tabular-nums text-white/20">
                  {entry.rank}
                </div>
                <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${avatarGrad} flex items-center justify-center text-white font-bold text-[11px] shrink-0 ${isMe ? 'ring-2 ring-[#007AFF]/40' : ''}`}>
                  {initials}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[14px] font-medium text-white truncate">
                    {entry.name}
                    {isMe && <span className="text-[#007AFF] ml-1.5 text-[11px] font-semibold">ВЫ</span>}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${entryLeague.cssClass}`}>{entryLeague.name}</span>
                    <span className="text-[10px] text-white/20">Ур. {entry.level}</span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-[14px] font-bold text-white tabular-nums">{entry.totalXp}</div>
                  <div className="text-[10px] text-white/20">XP</div>
                </div>
              </div>
            )
          })}
          {!loading && leaderboard.length === 0 && (
            <div className="text-center py-12">
              <p className="text-[14px] text-white/15">Нет данных</p>
            </div>
          )}
        </div>
      </div>
    )
  }

  /* ============================================================
     RENDER: PROFILE — Dark mobile app style
     ============================================================ */
  const renderProfile = () => {
    const initials = getInitials(profile?.name || '')
    const avatarGrad = getAvatarColor(profile?.name || '')
    const currentLevel = profile?.level || 1
    const xpInLevel = profile?.xpInLevel || 0
    const xpToNext = profile?.xpToNextLevel || 1
    const levelProgress = xpToNext > 0 ? Math.min((xpInLevel / xpToNext) * 100, 100) : 0

    return (
      <div className="px-5 pb-6 space-y-5 ios-fade-in">
        {/* Profile Header */}
        <div className="pt-3 flex flex-col items-center text-center">
          <div className={`w-20 h-20 rounded-full bg-gradient-to-br ${avatarGrad} flex items-center justify-center text-white font-bold text-[24px] border-2 border-white/10 mb-3`}>
            {initials}
          </div>
          <h1 className="text-[20px] font-bold text-white">{profile?.name}</h1>
          <div className="mt-1.5">
            <span className={`text-[12px] font-bold px-3 py-1 rounded-lg ${userLeague.cssClass}`}>{userLeague.name}</span>
          </div>
        </div>

        {/* Stats row — 3 columns */}
        <div className="grid grid-cols-3 gap-2">
          <GlassCard className="p-4 text-center">
            <div className="text-[22px] font-bold text-[#007AFF] tabular-nums">{profile?.totalXp}</div>
            <div className="text-[10px] text-white/25 mt-0.5 font-medium uppercase tracking-wider">Всего XP</div>
          </GlassCard>
          <GlassCard className="p-4 text-center">
            <div className="text-[22px] font-bold text-white tabular-nums">{achievementCounts.APPROVED}</div>
            <div className="text-[10px] text-white/25 mt-0.5 font-medium uppercase tracking-wider">Достижений</div>
          </GlassCard>
          <GlassCard className="p-4 text-center">
            <div className="text-[22px] font-bold text-white tabular-nums">{profile?.level}</div>
            <div className="text-[10px] text-white/25 mt-0.5 font-medium uppercase tracking-wider">Уровень</div>
          </GlassCard>
        </div>

        {/* Level Progress Card — Blue gradient */}
        <div className="relative overflow-hidden rounded-2xl p-5"
          style={{ background: 'linear-gradient(135deg, rgba(0,122,255,0.25) 0%, rgba(88,86,214,0.15) 100%)', border: '1px solid rgba(0,122,255,0.2)' }}>
          <div className="relative z-10">
            <div className="text-[11px] text-white/40 font-semibold uppercase tracking-wider">
              УРОВЕНЬ {profile?.level} · {profile?.levelName}
            </div>
            <div className="mt-3">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[12px] text-white/50 tabular-nums">{xpInLevel} / {xpInLevel + (xpToNext - xpInLevel)} XP</span>
                <span className="text-[12px] text-[#007AFF] font-bold tabular-nums">{Math.round(levelProgress)}%</span>
              </div>
              <div className="w-full bg-white/10 rounded-full h-2.5 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700 ease-out"
                  style={{ width: `${levelProgress}%`, background: 'linear-gradient(90deg, #007AFF, #5856D6)' }}
                />
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between">
              {profile?.nextLevelName && (
                <span className="text-[11px] text-white/30">
                  До «{profile.nextLevelName}» — ещё {Math.max(0, (profile.nextLevelXp || 0) - (profile.totalXp))} XP
                </span>
              )}
              <button onClick={() => {}} className="text-[12px] text-[#007AFF] font-semibold flex items-center gap-1 ml-auto">
                Подробнее <IconChevron size={10} />
              </button>
            </div>
          </div>
        </div>

        {/* Level Roadmap */}
        <div>
          <h3 className="ios-section-header mb-3">Путь уровней</h3>
          <div className="space-y-1.5">
            {LEVELS.map((l) => {
              const isCurrent = l.level === currentLevel
              const isPassed = l.level < currentLevel
              return (
                <div key={l.level} className={`flex items-center gap-3 p-3 rounded-xl ${
                  isCurrent
                    ? 'bg-[#007AFF]/8 border border-[#007AFF]/15'
                    : isPassed
                      ? 'bg-white/2'
                      : 'bg-white/1'
                }`}>
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-[13px] font-bold ${
                    isCurrent
                      ? 'bg-[#007AFF]/15 text-[#007AFF]'
                      : isPassed
                        ? 'bg-[#34C759]/10 text-[#34C759]'
                        : 'bg-white/4 text-white/15'
                  }`}>
                    {isPassed ? (
                      <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                        <path d="M3 8L7 12L13 4" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    ) : isCurrent ? (
                      <svg width="10" height="14" viewBox="0 0 10 16" fill="none">
                        <path d="M1 2L5 8L1 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    ) : (
                      <svg width="10" height="14" viewBox="0 0 10 16" fill="none">
                        <circle cx="5" cy="8" r="3" stroke="currentColor" strokeWidth="1.5" fill="none" />
                      </svg>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className={`text-[13px] font-medium ${isCurrent ? 'text-white' : 'text-white/30'}`}>{l.name}</div>
                    <div className="text-[10px] text-white/15">{l.min}–{l.max === 999999 ? '...' : l.max} XP</div>
                  </div>
                  {isCurrent && (
                    <span className="text-[10px] text-[#007AFF] font-semibold px-2 py-0.5 rounded-full bg-[#007AFF]/10">Текущий</span>
                  )}
                  {isPassed && (
                    <span className="text-[10px] text-[#34C759] font-semibold px-2 py-0.5 rounded-full bg-[#34C759]/10">Пройден</span>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Logout */}
        <button onClick={handleLogout}
          className="w-full glass-card py-3.5 flex items-center justify-center gap-2 text-[#FF3B30]/70 text-[14px] font-semibold active:scale-[0.97] ios-spring">
          <IconLogout />
          Выйти
        </button>
      </div>
    )
  }

  /* ============================================================
     RENDER: ADD ACHIEVEMENT SHEET
     ============================================================ */
  const renderAddSheet = () => {
    if (!showAddSheet) return null
    return (
      <div className="fixed inset-0 z-50 flex items-end justify-center" onClick={() => { setShowAddSheet(false); resetForm() }}>
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
        <div className="relative w-full max-w-lg ios-sheet ios-sheet-up max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}>
          <div className="p-6">
            <IosSheetHandle />

            <div className="flex items-center justify-between mb-5">
              <h3 className="text-[20px] font-bold text-white">Новое достижение</h3>
              <button onClick={() => { setShowAddSheet(false); resetForm() }}
                className="w-8 h-8 rounded-full bg-white/6 flex items-center justify-center text-white/30">
                <IconClose />
              </button>
            </div>

            {/* Step 1: Choose type */}
            {!formAchievementType && (
              <div className="space-y-2 ios-fade-in">
                <p className="text-[13px] text-white/30 mb-3">Выберите тип</p>
                {Object.entries(ACHIEVEMENT_TYPES).map(([key, val]) => (
                  <button key={key} onClick={() => setFormAchievementType(key as AchievementType)}
                    className="w-full text-left glass-card p-4 flex items-center gap-4 active:scale-[0.98] ios-spring">
                    <div className="w-10 h-10 rounded-xl bg-white/4 flex items-center justify-center shrink-0">
                      {key === 'SPORT' && <IconSport />}
                      {key === 'CREATIVE' && <IconCreative />}
                      {key === 'OLYMPIAD' && <IconOlympiad />}
                      {key === 'FREE_FORM' && <IconFreeForm />}
                    </div>
                    <div className="text-[15px] font-semibold text-white">{val.label}</div>
                    <div className="ml-auto text-white/10"><IconChevron /></div>
                  </button>
                ))}
              </div>
            )}

            {/* Step 2: Form */}
            {formAchievementType && (
              <div className="space-y-4 ios-fade-in">
                <div className="flex items-center gap-3 mb-1">
                  <button onClick={() => { setFormAchievementType(''); setFormLevel(''); setFormPlacement(1) }}
                    className="text-[12px] text-[#007AFF] font-medium">Изменить тип</button>
                  <span className="text-[12px] text-white/20">{ACHIEVEMENT_TYPES[formAchievementType]?.label}</span>
                </div>

                <div>
                  <label className="text-[12px] font-medium text-white/30 mb-1.5 block">Название *</label>
                  <input type="text" value={formTitle} onChange={(e) => setFormTitle(e.target.value)}
                    placeholder={formAchievementType === 'SPORT' ? 'Соревнования по плаванию' : formAchievementType === 'CREATIVE' ? 'Конкурс чтецов' : formAchievementType === 'OLYMPIAD' ? 'ВСОШ по математике' : 'Моё достижение'}
                    className="glass-input w-full px-4 py-3 text-[14px] text-white placeholder-white/15 bg-transparent border-0 focus:ring-0 focus:shadow-none" />
                </div>

                <div>
                  <label className="text-[12px] font-medium text-white/30 mb-1.5 block">Описание</label>
                  <textarea value={formDesc} onChange={(e) => setFormDesc(e.target.value)}
                    placeholder="Расскажите подробнее..." rows={2}
                    className="glass-input w-full px-4 py-3 text-[14px] text-white placeholder-white/15 bg-transparent border-0 focus:ring-0 focus:shadow-none resize-none" />
                </div>

                {formAchievementType !== 'FREE_FORM' && (
                  <>
                    <div>
                      <label className="text-[12px] font-medium text-white/30 mb-2 block">Уровень</label>
                      <div className="grid grid-cols-3 gap-1.5">
                        {Object.entries(ACHIEVEMENT_LEVELS).map(([key, val]) => (
                          <button key={key} onClick={() => setFormLevel(key as AchievementLevel)}
                            className={`py-2 px-2 rounded-xl text-[12px] font-medium transition-all ${
                              formLevel === key
                                ? 'bg-[#007AFF]/12 border border-[#007AFF]/25 text-[#007AFF]'
                                : 'bg-white/3 border border-white/5 text-white/35'
                            }`}>
                            <div>{val.label}</div>
                            <div className="text-[9px] opacity-50 mt-0.5">до {val.baseXp} XP</div>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="text-[12px] font-medium text-white/30 mb-2 block">Место</label>
                      <div className="grid grid-cols-4 gap-1.5">
                        {Object.entries(PLACEMENTS).map(([key, val]) => (
                          <button key={key} onClick={() => setFormPlacement(Number(key))}
                            className={`py-2 px-2 rounded-xl text-[12px] font-medium transition-all ${
                              formPlacement === Number(key)
                                ? 'bg-[#007AFF]/12 border border-[#007AFF]/25 text-[#007AFF]'
                                : 'bg-white/3 border border-white/5 text-white/35'
                            }`}>
                            {val.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {formLevel && (
                      <GlassCard className="p-4">
                        <div className="flex items-center justify-between">
                          <span className="text-[13px] text-white/30">Расчётное XP</span>
                          <span className="text-[18px] font-bold text-[#007AFF]">{formXp} XP</span>
                        </div>
                        <div className="text-[10px] text-white/15 mt-1">
                          {ACHIEVEMENT_LEVELS[formLevel]?.label} · {PLACEMENTS[formPlacement]?.label} · {ACHIEVEMENT_LEVELS[formLevel]?.baseXp} × {PLACEMENTS[formPlacement]?.multiplier}
                        </div>
                      </GlassCard>
                    )}
                  </>
                )}

                {formAchievementType === 'FREE_FORM' && (
                  <div>
                    <label className="text-[12px] font-medium text-white/30 mb-1.5 block">Запрашиваемое XP</label>
                    <input type="number" value={formXp} onChange={(e) => setFormXp(Number(e.target.value))}
                      min={1} max={100}
                      className="glass-input w-full px-4 py-3 text-[14px] text-white bg-transparent border-0 focus:ring-0 focus:shadow-none" />
                    <p className="text-[10px] text-white/15 mt-1">Администратор рассмотрит и подтвердит</p>
                  </div>
                )}

                <div>
                  <label className="text-[12px] font-medium text-white/30 mb-1.5 block">Дата</label>
                  <input type="date" value={formDate} onChange={(e) => setFormDate(e.target.value)}
                    className="glass-input w-full px-4 py-3 text-[14px] text-white bg-transparent border-0 focus:ring-0 focus:shadow-none" />
                </div>

                <div>
                  <label className="text-[12px] font-medium text-white/30 mb-1.5 block">Комментарий</label>
                  <textarea value={formComment} onChange={(e) => setFormComment(e.target.value)}
                    placeholder="Дополнительная информация..." rows={2}
                    className="glass-input w-full px-4 py-3 text-[14px] text-white placeholder-white/15 bg-transparent border-0 focus:ring-0 focus:shadow-none resize-none" />
                </div>

                <button onClick={handleAddAchievement}
                  className="ios-button-primary w-full mt-2">
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
     RENDER: ACHIEVEMENT DETAIL
     ============================================================ */
  const renderDetailModal = () => {
    if (!selectedAchievement) return null
    const a = selectedAchievement
    return (
      <div className="fixed inset-0 z-50 flex items-end justify-center" onClick={() => setSelectedAchievement(null)}>
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
        <div className="relative w-full max-w-lg ios-sheet ios-sheet-up max-h-[80vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}>
          <div className="p-6">
            <IosSheetHandle />
            <div className="flex items-start gap-4 mb-5">
              <div className="w-12 h-12 rounded-xl bg-white/4 flex items-center justify-center shrink-0">
                <AchievementTypeIcon type={a.achievementType} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-[18px] font-bold text-white">{a.title}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <StatusDot status={a.status} />
                  {a.achievementType && <span className="text-[11px] text-white/20">{ACHIEVEMENT_TYPES[a.achievementType]?.label}</span>}
                </div>
              </div>
            </div>

            {a.description && <p className="text-[14px] text-white/40 mb-4">{a.description}</p>}

            <div className="space-y-2.5">
              {a.achievementLevel && a.achievementType !== 'FREE_FORM' && (
                <div className="flex justify-between text-[13px]">
                  <span className="text-white/25">Уровень</span>
                  <span className="text-white/60">{ACHIEVEMENT_LEVELS[a.achievementLevel]?.label}</span>
                </div>
              )}
              {a.placement !== null && a.placement !== undefined && a.achievementType !== 'FREE_FORM' && (
                <div className="flex justify-between text-[13px]">
                  <span className="text-white/25">Место</span>
                  <span className="text-white/60">{PLACEMENTS[a.placement]?.label || `Участник`}</span>
                </div>
              )}
              {a.direction && (
                <div className="flex justify-between text-[13px]">
                  <span className="text-white/25">Направление</span>
                  <span className="text-white/60">{DIRECTIONS[a.direction]?.label || a.direction}</span>
                </div>
              )}
              <div className="flex justify-between text-[13px]">
                <span className="text-white/25">Запрошено XP</span>
                <span className="text-white/60">{a.xpRequested}</span>
              </div>
              {a.status === 'APPROVED' && (
                <div className="flex justify-between text-[13px]">
                  <span className="text-white/25">Начислено XP</span>
                  <span className="text-[#34C759] font-bold">+{a.xpAwarded}</span>
                </div>
              )}
              {a.achievementDate && (
                <div className="flex justify-between text-[13px]">
                  <span className="text-white/25">Дата</span>
                  <span className="text-white/60">{a.achievementDate}</span>
                </div>
              )}
              {a.reviewComment && (
                <div className="mt-3 p-3 rounded-xl bg-white/3 border border-white/5">
                  <p className="text-[11px] text-white/20 mb-1">Комментарий модератора</p>
                  <p className="text-[13px] text-white/50">{a.reviewComment}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  /* ============================================================
     RENDER: ADMIN PANEL
     ============================================================ */
  const renderAdmin = () => {
    if (!isAdmin || !showAdmin) return null
    return (
      <div className="fixed inset-0 z-50 flex items-end justify-center" onClick={() => setShowAdmin(false)}>
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
        <div className="relative w-full max-w-lg ios-sheet ios-sheet-up max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}>
          <div className="p-6">
            <IosSheetHandle />
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-[20px] font-bold text-white">Модерация</h3>
              <button onClick={() => setShowAdmin(false)}
                className="w-8 h-8 rounded-full bg-white/6 flex items-center justify-center text-white/30">
                <IconClose />
              </button>
            </div>

            {pendingAchievements.length === 0 ? (
              <div className="text-center py-10">
                <p className="text-[14px] text-white/15">Нет достижений для проверки</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[70vh] overflow-y-auto">
                {pendingAchievements.map((a) => (
                  <div key={a.id} className="glass-card p-4 space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-xl bg-white/4 flex items-center justify-center shrink-0">
                        <AchievementTypeIcon type={a.achievementType} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[14px] font-medium text-white">{a.title}</div>
                        <div className="text-[12px] text-white/25 mt-0.5">{a.description}</div>
                        <div className="text-[11px] text-white/15 mt-1">
                          {a.user?.name} · Запрос: {a.xpRequested} XP
                          {a.achievementLevel && ` · ${ACHIEVEMENT_LEVELS[a.achievementLevel]?.label}`}
                          {a.placement !== null && a.placement !== undefined && ` · ${PLACEMENTS[a.placement]?.label}`}
                        </div>
                      </div>
                    </div>

                    {/* Direction selector */}
                    <div>
                      <label className="text-[11px] text-white/25 mb-1.5 block">Направление</label>
                      <div className="flex flex-wrap gap-1">
                        {Object.entries(DIRECTIONS).map(([key, val]) => (
                          <button key={key} onClick={() => setAdminDirection(key)}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${
                              adminDirection === key
                                ? 'bg-[#007AFF]/12 border border-[#007AFF]/20 text-[#007AFF]'
                                : 'bg-white/3 border border-white/5 text-white/30'
                            }`}>
                            {val.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* XP override */}
                    <div>
                      <label className="text-[11px] text-white/25 mb-1.5 block">Начислить XP</label>
                      <input type="number" value={adminXp || a.xpRequested}
                        onChange={(e) => setAdminXp(Number(e.target.value))}
                        className="glass-input w-full px-3 py-2 text-[13px] text-white bg-transparent border-0 focus:ring-0 focus:shadow-none" />
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <button onClick={() => handleModerate(a.id, 'approve', adminXp || a.xpRequested, adminDirection || undefined)}
                        className="flex-1 py-2.5 bg-[#34C759]/12 text-[#34C759] text-[13px] font-semibold rounded-xl active:scale-[0.97] transition-transform">
                        Одобрить
                      </button>
                      <button onClick={() => handleModerate(a.id, 'reject', 0, undefined, 'Отклонено модератором')}
                        className="flex-1 py-2.5 bg-[#FF3B30]/12 text-[#FF3B30] text-[13px] font-semibold rounded-xl active:scale-[0.97] transition-transform">
                        Отклонить
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  /* ============================================================
     MAIN RENDER
     ============================================================ */
  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      {/* Background decorative orbs — CRITICAL for glassmorphism visibility */}
      <div className="bg-orb bg-orb-1" />
      <div className="bg-orb bg-orb-2" />
      <div className="bg-orb bg-orb-3" />
      <div className="bg-orb bg-orb-4" />

      {/* Content */}
      <main className="flex-1 relative z-10 pb-20">
        {currentTab === 'home' && renderHome()}
        {currentTab === 'achievements' && renderAchievements()}
        {currentTab === 'rating' && renderRating()}
        {currentTab === 'profile' && renderProfile()}
      </main>

      {/* Bottom navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 glass-nav safe-area-bottom">
        <div className="max-w-lg mx-auto flex items-center justify-around py-2">
          {([
            { tab: 'home' as Tab, label: 'Главная', icon: IconHome },
            { tab: 'achievements' as Tab, label: 'Достижения', icon: IconAchievements },
            { tab: 'rating' as Tab, label: 'Рейтинг', icon: IconTrophy },
            { tab: 'profile' as Tab, label: 'Профиль', icon: IconUser },
          ]).map(({ tab, label, icon: Icon }) => (
            <button key={tab} onClick={() => setCurrentTab(tab)}
              className="flex flex-col items-center gap-0.5 py-1 px-3 min-w-[64px]">
              <Icon active={currentTab === tab} />
              <span className={`text-[10px] font-medium transition-colors ${
                currentTab === tab ? 'text-[#007AFF]' : 'text-white/25'
              }`}>{label}</span>
            </button>
          ))}
        </div>
      </nav>

      {/* Modals */}
      {renderAddSheet()}
      {renderDetailModal()}
      {renderAdmin()}
    </div>
  )
}
