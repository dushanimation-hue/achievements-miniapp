'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { toast } from 'sonner'

/* ============================================================
   TYPES
   ============================================================ */

interface UserProfile {
  id: string; name: string; username: string | null; role: string;
  totalXp: number; level: number; levelName: string; xpInLevel: number;
  xpToNextLevel: number; nextLevelXp: number | null; nextLevelName: string | null;
  statusEmoji: string; statusPrefix: string; facultyId: string | null;
  league: string; fullName: string | null; classYear: number | null;
  classLetter: string | null; schoolCode: string | null;
}
interface Achievement {
  id: string; title: string; description: string | null; category: string;
  direction: string | null; achievementType: string | null;
  achievementLevel: string | null; resultType: string | null;
  placement: number | null; resultStatus: string | null;
  xpRequested: number; xpAwarded: number;
  status: string; fileUrl: string | null;
  achievementDate: string | null; comment: string | null;
  reviewComment: string | null; reviewedBy: string | null; reviewedAt: string | null;
  createdAt: string;
  user?: { id: string; name: string; username: string | null; statusEmoji: string }
}
interface LeaderboardEntry {
  rank: number; id: string; name: string; username: string | null;
  totalXp: number; level: number; statusEmoji: string; statusPrefix: string;
  faculty: null; achievementCount: number; league: string;
}
interface LevelInfo { level: number; name: string; min: number; max: number }
interface AuthUser { id: string; name: string; login: string; role: string; faculty: null; registered?: boolean; schoolCode?: string | null; classYear?: number | null; classLetter?: string | null; fullName?: string | null }
interface BadgeItem {
  id: string; name: string; description: string; emoji: string;
  conditionType: string; conditionValue: number;
  earned: boolean; earnedAt: string | null;
}
interface FacultyItem {
  id: string; name: string; emoji: string; color: string; totalXp: number; memberCount: number;
}

/* ============================================================
   CONSTANTS
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
  SCHOOL: { label: 'Школьный', baseXp: 8 },
  DISTRICT: { label: 'Районный', baseXp: 16 },
  CITY: { label: 'Городской', baseXp: 28 },
  REGIONAL: { label: 'Региональный', baseXp: 48 },
  ALL_RUSSIAN: { label: 'Всероссийский', baseXp: 80 },
  INTERNATIONAL: { label: 'Международный', baseXp: 100 },
}

// Levels available for ВСОШ/РЭШ — max is Всероссийский (no Международный)
const OLYMPIAD_LEVELS = ['SCHOOL', 'DISTRICT', 'CITY', 'REGIONAL', 'ALL_RUSSIAN'] as const

const PLACEMENTS: Record<number, { label: string; multiplier: number }> = {
  1: { label: '1 место', multiplier: 1.0 },
  2: { label: '2 место', multiplier: 0.8 },
  3: { label: '3 место', multiplier: 0.6 },
  0: { label: 'Участник', multiplier: 0.3 },
}

const RESULT_STATUSES: Record<string, { label: string; multiplier: number }> = {
  PARTICIPANT: { label: 'Участник', multiplier: 0.3 },
  PRIZEWINNER: { label: 'Призёр', multiplier: 0.6 },
  WINNER: { label: 'Победитель', multiplier: 0.8 },
  ABSOLUTE_WINNER: { label: 'Абсолютный победитель', multiplier: 1.0 },
  LAUREATE_1: { label: 'Лауреат 1 степени', multiplier: 0.9 },
  LAUREATE_2: { label: 'Лауреат 2 степени', multiplier: 0.7 },
  LAUREATE_3: { label: 'Лауреат 3 степени', multiplier: 0.5 },
}

const DIRECTIONS: Record<string, { label: string; color: string }> = {
  ALL: { label: 'Все направления', color: '#FF9F0A' },
  KNOWLEDGE: { label: 'Знание', color: '#007AFF' },
  WILL: { label: 'Воля', color: '#FF9F0A' },
  SKILLS: { label: 'Навыки', color: '#5856D6' },
  COMMUNITY: { label: 'Сообщество', color: '#34C759' },
  MORALITY: { label: 'Нравственность', color: '#AF52DE' },
}

// Only the 5 real directions (no ALL) — used for radar chart & profile display
const DIRECTIONS_PROFILE: { key: string; label: string; color: string }[] = [
  { key: 'KNOWLEDGE', label: 'Знание', color: '#007AFF' },
  { key: 'WILL', label: 'Воля', color: '#FF9F0A' },
  { key: 'SKILLS', label: 'Навыки', color: '#5856D6' },
  { key: 'COMMUNITY', label: 'Сообщество', color: '#34C759' },
  { key: 'MORALITY', label: 'Нравственность', color: '#AF52DE' },
]

const STATUS_CONFIG: Record<string, { label: string; color: string; dotColor: string }> = {
  APPROVED: { label: 'Одобрено', color: 'text-[#34C759]', dotColor: 'bg-[#34C759]' },
  PENDING: { label: 'На проверке', color: 'text-[#FF9F0A]', dotColor: 'bg-[#FF9F0A]' },
  REJECTED: { label: 'Отклонено', color: 'text-[#FF3B30]', dotColor: 'bg-[#FF3B30]' },
}

type Tab = 'home' | 'achievements' | 'milestones' | 'rating' | 'profile'
type AchievementType = 'SPORT' | 'CREATIVE' | 'OLYMPIAD' | 'FREE_FORM' | ''
type AchievementLevel = 'SCHOOL' | 'DISTRICT' | 'CITY' | 'REGIONAL' | 'ALL_RUSSIAN' | 'INTERNATIONAL' | ''
type ResultTypeMode = 'PLACEMENT' | 'STATUS'

function getMultiplier(resultType: string | null, placement: number | null, resultStatus: string | null): number {
  if (resultType === 'STATUS' && resultStatus) {
    return RESULT_STATUSES[resultStatus]?.multiplier ?? 0.3
  }
  return PLACEMENTS[placement ?? 0]?.multiplier ?? 0.3
}

function calculateAutoXp(level: AchievementLevel, resultType: ResultTypeMode, placement: number, resultStatus: string): number {
  if (!level) return 1
  const base = ACHIEVEMENT_LEVELS[level]?.baseXp || 2
  const mult = getMultiplier(resultType, placement, resultStatus)
  return Math.max(1, Math.round(base * mult))
}

function getResultLabel(a: Achievement): string {
  if (a.resultType === 'STATUS' && a.resultStatus) {
    return RESULT_STATUSES[a.resultStatus]?.label || a.resultStatus
  }
  if (a.placement !== null && a.placement !== undefined) {
    return PLACEMENTS[a.placement]?.label || `${a.placement} место`
  }
  return ''
}

/* ============================================================
   SVG ICONS — Professional, NO EMOJI in UI
   ============================================================ */

function IconHome({ active }: { active: boolean }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path d="M3 12L5 10M5 10L12 3L19 10M5 10V20C5 20.5523 5.44772 21 6 21H9M19 10L21 12M19 10V20C19 20.5523 18.5523 21 18 21H15M9 21C9 21 9 15 12 15C15 15 15 21 15 21M9 21H15"
        stroke={active ? '#ffffff' : 'currentColor'} strokeWidth={active ? 2 : 1.5}
        strokeLinecap="round" strokeLinejoin="round"
        fill={active ? 'rgba(255,255,255,0.08)' : 'none'} />
    </svg>
  )
}

function IconAchievements({ active }: { active: boolean }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="14" r="6" stroke={active ? '#ffffff' : 'currentColor'} strokeWidth={active ? 2 : 1.5}
        fill={active ? 'rgba(255,255,255,0.08)' : 'none'} />
      <path d="M9.5 3L12 8L14.5 3" stroke={active ? '#ffffff' : 'currentColor'} strokeWidth={active ? 2 : 1.5}
        strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="12" cy="14" r="2.5" stroke={active ? '#ffffff' : 'currentColor'} strokeWidth={active ? 1.5 : 1}
        fill={active ? 'rgba(255,255,255,0.15)' : 'none'} />
    </svg>
  )
}

function IconMilestones({ active }: { active: boolean }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path d="M4 20H20" stroke={active ? '#ffffff' : 'currentColor'} strokeWidth={active ? 2 : 1.5} strokeLinecap="round" />
      <path d="M7 20V14" stroke={active ? '#ffffff' : 'currentColor'} strokeWidth={active ? 2 : 1.5} strokeLinecap="round" />
      <path d="M12 20V10" stroke={active ? '#ffffff' : 'currentColor'} strokeWidth={active ? 2 : 1.5} strokeLinecap="round" />
      <path d="M17 20V6" stroke={active ? '#ffffff' : 'currentColor'} strokeWidth={active ? 2 : 1.5} strokeLinecap="round" />
      <circle cx="7" cy="13" r="1.5" fill={active ? '#ffffff' : 'currentColor'} />
      <circle cx="12" cy="9" r="1.5" fill={active ? '#ffffff' : 'currentColor'} />
      <circle cx="17" cy="5" r="1.5" fill={active ? '#ffffff' : 'currentColor'} />
    </svg>
  )
}

function IconTrophy({ active }: { active: boolean }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path d="M12 17C13.5 17 15 16 15 14H9C9 16 10.5 17 12 17ZM12 17V20M8 20H16M7 4H17V10C17 12.7614 14.7614 15 12 15C9.23858 15 7 12.7614 7 10V4ZM5 6C5 5 5.5 4 7 4M19 6C19 5 18.5 4 17 4"
        stroke={active ? '#ffffff' : 'currentColor'} strokeWidth={active ? 2 : 1.5}
        strokeLinecap="round" strokeLinejoin="round"
        fill={active ? 'rgba(255,255,255,0.08)' : 'none'} />
    </svg>
  )
}

function IconUser({ active }: { active: boolean }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="8" r="4" stroke={active ? '#ffffff' : 'currentColor'} strokeWidth={active ? 2 : 1.5}
        fill={active ? 'rgba(255,255,255,0.08)' : 'none'} />
      <path d="M4 20C4 16.6863 7.58172 14 12 14C16.4183 14 20 16.6863 20 20"
        stroke={active ? '#ffffff' : 'currentColor'} strokeWidth={active ? 2 : 1.5}
        strokeLinecap="round" fill={active ? 'rgba(255,255,255,0.05)' : 'none'} />
    </svg>
  )
}

function IconPlus({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <path d="M10 4V16M4 10H16" stroke="black" strokeWidth="2" strokeLinecap="round" />
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
      <circle cx="12" cy="5" r="3" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5" />
      <path d="M6 22L9 12H15L18 22" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9 12L7 8M15 12L17 8M12 12V9" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

function IconCreative() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path d="M12 2L14.09 8.26L21 9.27L16 14.14L17.18 21.02L12 17.77L6.82 21.02L8 14.14L3 9.27L9.91 8.26L12 2Z"
        stroke="rgba(255,255,255,0.6)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="rgba(255,255,255,0.04)" />
    </svg>
  )
}

function IconOlympiad() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <rect x="3" y="3" width="18" height="18" rx="4" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5" fill="rgba(255,255,255,0.04)" />
      <path d="M9 8L12 12L15 8" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M8 15H16M12 12V17" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

function IconFreeForm() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path d="M11 4H4V18C4 19.1046 4.89543 20 6 20H18C19.1046 20 20 19.1046 20 18V13" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M18.5 2.50001C19.3284 1.67158 20.6716 1.67158 21.5 2.50001C22.3284 3.32844 22.3284 4.67158 21.5 5.50001L12 15L8 16L9 12L18.5 2.50001Z"
        stroke="rgba(255,255,255,0.6)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="rgba(255,255,255,0.04)" />
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

function IconShield({ size = 24 }: { size?: number } = {}) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M12 2L4 6V12C4 16.4183 7.58172 20.5 12 22C16.4183 20.5 20 16.4183 20 12V6L12 2Z"
        stroke="rgba(255,255,255,0.6)" strokeWidth="1.5" strokeLinejoin="round" fill="rgba(255,255,255,0.04)" />
      <path d="M9 12L11 14L15 10" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
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

function IconCrown({ size = 24 }: { size?: number } = {}) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M2 17L4.5 8L8 12L12 4L16 12L19.5 8L22 17H2Z" fill="rgba(255,215,0,0.15)" stroke="#FFD700" strokeWidth="1.5" strokeLinejoin="round" />
      <circle cx="12" cy="19" r="1.5" fill="#FFD700" />
    </svg>
  )
}

function IconCamera() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path d="M23 19C23 19.5304 22.7893 20.0391 22.4142 20.4142C22.0391 20.7893 21.5304 21 21 21H3C2.46957 21 1.96086 20.7893 1.58579 20.4142C1.21071 20.0391 1 19.5304 1 19V8C1 7.46957 1.21071 6.96086 1.58579 6.58579C1.96086 6.21071 2.46957 6 3 6H7L9 3H15L17 6H21C21.5304 6 22.0391 6.21071 22.4142 6.58579C22.7893 6.96086 23 7.46957 23 8V19Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="12" cy="13" r="4" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  )
}

function IconSword() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path d="M6.5 6.5L17.5 17.5M6.5 6.5L3 3M6.5 6.5L4 8L3 3L8 4L6.5 6.5ZM17.5 17.5L20 16L21 21L16 20L17.5 17.5ZM17.5 17.5L21 21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M10 10L14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

function IconShieldCross() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path d="M12 2L4 6V12C4 16.4183 7.58172 20.5 12 22C16.4183 20.5 20 16.4183 20 12V6L12 2Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" fill="rgba(255,255,255,0.03)" />
      <path d="M12 7V17M8 12H16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

function IconStar() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path d="M12 2L14.09 8.26L21 9.27L16 14.14L17.18 21.02L12 17.77L6.82 21.02L8 14.14L3 9.27L9.91 8.26L12 2Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="rgba(255,255,255,0.03)" />
    </svg>
  )
}

function FacultyIcon({ facultyId }: { facultyId: string }) {
  switch (facultyId) {
    case 'f_athos': return <IconSword />
    case 'f_porthos': return <IconShieldCross />
    case 'f_aramis': return <IconStar />
    default: return <IconShield />
  }
}

function IconImage() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <rect x="3" y="3" width="18" height="18" rx="3" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="8.5" cy="8.5" r="1.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M6 16L9 13L12 16L16 11L21 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
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
   RADAR CHART — 5-direction "wind rose" for profile
   ============================================================ */

function RadarChart({ values }: { values: { key: string; label: string; color: string; xp: number }[] }) {
  const size = 280
  const cx = size / 2
  const cy = size / 2
  const maxR = 80
  const n = values.length

  // Adaptive scale: max value rounded up to nearest nice number
  const maxVal = Math.max(...values.map(v => v.xp), 1)
  const niceMax = Math.ceil(maxVal / 5) * 5 || 5

  // Pentagon vertices (start from top, go clockwise)
  const angleStep = (2 * Math.PI) / n
  const startAngle = -Math.PI / 2 // top
  const getPoint = (i: number, r: number) => ({
    x: cx + r * Math.cos(startAngle + i * angleStep),
    y: cy + r * Math.sin(startAngle + i * angleStep),
  })

  // Grid rings (3 levels)
  const rings = [0.25, 0.5, 1.0]

  // Data polygon
  const dataPoints = values.map((v, i) => {
    const r = maxR * Math.min(v.xp / niceMax, 1)
    return getPoint(i, r)
  })
  const dataPath = dataPoints.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ') + ' Z'

  // Text anchor calculation per vertex
  const getAnchor = (i: number): 'middle' | 'start' | 'end' => {
    if (i === 0) return 'middle'      // top
    if (i === 1) return 'start'       // top-right
    if (i === 2) return 'start'       // bottom-right
    if (i === 3) return 'end'         // bottom-left
    return 'end'                       // top-left (i === 4)
  }

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="mx-auto" style={{ overflow: 'visible' }}>
      {/* Grid rings */}
      {rings.map((scale, ri) => {
        const pts = values.map((_, i) => getPoint(i, maxR * scale))
        const path = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ') + ' Z'
        return <path key={ri} d={path} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={1} />
      })}

      {/* Axis lines */}
      {values.map((_, i) => {
        const p = getPoint(i, maxR)
        return <line key={i} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke="rgba(255,255,255,0.06)" strokeWidth={1} />
      })}

      {/* Data polygon fill */}
      <path d={dataPath} fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.3)" strokeWidth={1.5} />

      {/* Data points with color */}
      {dataPoints.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={4} fill={values[i].color} stroke="rgba(0,0,0,0.3)" strokeWidth={1} />
      ))}

      {/* Labels */}
      {values.map((v, i) => {
        const labelR = maxR + 28
        const p = getPoint(i, labelR)
        const anchor = getAnchor(i)
        // Fine-tune vertical position
        const yLabelOffset = i === 0 ? -6 : i === 1 ? -2 : i === 2 ? 4 : i === 3 ? 4 : -2
        const yXpOffset = yLabelOffset + 13
        return (
          <g key={i}>
            <text x={p.x} y={p.y + yLabelOffset} textAnchor={anchor} fill="rgba(255,255,255,0.5)" fontSize={10} fontWeight={500}>
              {v.label}
            </text>
            <text x={p.x} y={p.y + yXpOffset} textAnchor={anchor} fill={v.color} fontSize={11} fontWeight={700}>
              {v.xp} XP
            </text>
          </g>
        )
      })}
    </svg>
  )
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

function XpProgressBar({ current, max, className = '', gradient = 'linear-gradient(90deg, rgba(255,255,255,0.6), rgba(255,255,255,0.3))' }: { current: number; max: number; className?: string; gradient?: string }) {
  const pct = max > 0 ? Math.min((current / max) * 100, 100) : 0
  return (
    <div className={`w-full bg-white/6 rounded-full h-1.5 overflow-hidden ${className}`}>
      <div
        className="h-full rounded-full transition-all duration-700 ease-out"
        style={{ width: `${pct}%`, background: gradient }}
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
  'from-white/20 to-white/5',
  'from-white/15 to-white/8',
  'from-white/10 to-white/5',
  'from-white/18 to-white/6',
  'from-white/12 to-white/7',
  'from-white/8 to-white/4',
]

function getAvatarColor(name: string): string {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}

/* ============================================================
   LOGIN SCREEN — Only shown in browser mode (no Telegram)
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
      <div className="bg-orb bg-orb-1" />
      <div className="bg-orb bg-orb-2" />
      <div className="bg-orb bg-orb-3" />

      <div className="glass-login p-8 w-full max-w-sm relative z-10">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mx-auto mb-4">
            <IconShield size={44} />
          </div>
          <h1 className="text-[22px] font-bold text-white tracking-tight">Достижения</h1>
          <p className="text-[14px] text-white/30 mt-1.5">Платформа лицея</p>
        </div>

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

        <div className="mt-6 pt-5 border-t border-white/6">
          <p className="text-[11px] text-white/20 text-center uppercase tracking-wider mb-3">Демо-доступ</p>
          <div className="flex justify-center gap-2">
            <button onClick={() => { setLogin('Desmont'); setPassword('Desm00nt$') }}
              className="py-2 px-4 rounded-xl bg-white/4 border border-white/6 text-[12px] text-white/40 hover:bg-white/6 transition-colors text-center">
              <div className="font-semibold text-white/60">Desmont</div>
              <div>Админ</div>
            </button>
            <button onClick={() => { setLogin('student'); setPassword('student123') }}
              className="py-2 px-4 rounded-xl bg-white/4 border border-white/6 text-[12px] text-white/40 hover:bg-white/6 transition-colors text-center">
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
   REGISTRATION SCREEN — Shown when Telegram user has no school info
   Step 1: Enter 6-char school code (11607L)
   Step 2: Enter ФИО + class (year + letter)
   ============================================================ */

function RegistrationScreen({ userId, onComplete }: { userId: string; onComplete: (user: AuthUser) => void }) {
  const [step, setStep] = useState<'code' | 'profile'>('code')
  const [code, setCode] = useState(['', '', '', '', '', ''])
  const [codeError, setCodeError] = useState('')
  const [verifying, setVerifying] = useState(false)
  const codeRefs = useRef<(HTMLInputElement | null)[]>([])
  const [fullName, setFullName] = useState('')
  const [classYear, setClassYear] = useState('')
  const [classLetter, setClassLetter] = useState('')
  const [profileError, setProfileError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [schoolName, setSchoolName] = useState('')

  // Handle code input — one char per square
  const handleCodeChange = (index: number, value: string) => {
    if (value.length > 1) return
    const newCode = [...code]
    newCode[index] = value.toUpperCase()
    setCode(newCode)
    setCodeError('')

    // Auto-advance to next input
    if (value && index < 5) {
      codeRefs.current[index + 1]?.focus()
    }

    // Auto-submit when all 6 chars are filled
    if (value && index === 5) {
      const fullCode = newCode.join('')
      verifyCode(fullCode)
    }
  }

  const handleCodeKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      codeRefs.current[index - 1]?.focus()
    }
  }

  const handleCodePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6)
    const newCode = [...code]
    for (let i = 0; i < pasted.length; i++) {
      newCode[i] = pasted[i]
    }
    setCode(newCode)
    if (pasted.length === 6) {
      verifyCode(pasted.join(''))
    } else if (pasted.length > 0) {
      codeRefs.current[Math.min(pasted.length, 5)]?.focus()
    }
  }

  const verifyCode = async (fullCode: string) => {
    if (fullCode.length !== 6) return
    setVerifying(true)
    setCodeError('')
    try {
      const res = await fetch(`/api/auth/register?code=${fullCode}`)
      const data = await res.json()
      if (data.valid) {
        setSchoolName(data.schoolName)
        setStep('profile')
      } else {
        setCodeError('Неверный код школы')
        setCode(['', '', '', '', '', ''])
        codeRefs.current[0]?.focus()
      }
    } catch {
      setCodeError('Ошибка проверки')
    } finally {
      setVerifying(false)
    }
  }

  const handleSubmit = async () => {
    if (!fullName.trim()) { setProfileError('Введите ФИО'); return }
    if (!classYear) { setProfileError('Выберите класс'); return }
    setProfileError('')
    setSubmitting(true)
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          schoolCode: code.join(''),
          fullName: fullName.trim(),
          classYear: parseInt(classYear),
          classLetter: classLetter.trim(),
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setProfileError(data.error || 'Ошибка регистрации')
        return
      }
      // Update auth user and clear registration flag
      const updatedUser = data.user as AuthUser
      localStorage.setItem('auth_user', JSON.stringify(updatedUser))
      onComplete(updatedUser)
    } catch {
      setProfileError('Ошибка сети')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-5 relative overflow-hidden">
      <div className="bg-orb bg-orb-1" />
      <div className="bg-orb bg-orb-2" />
      <div className="bg-orb bg-orb-3" />

      <div className="glass-login p-8 w-full max-w-sm relative z-10">
        {step === 'code' ? (
          <>
            <div className="text-center mb-8">
              <h1 className="text-[22px] font-bold text-white tracking-tight">Регистрация</h1>
              <p className="text-[14px] text-white/30 mt-1.5">Введите код вашей школы</p>
            </div>

            {/* 6 square code inputs */}
            <div className="flex justify-center gap-2.5 mb-5">
              {code.map((char, i) => (
                <input
                  key={i}
                  ref={el => { codeRefs.current[i] = el }}
                  type="text"
                  inputMode="text"
                  maxLength={1}
                  value={char}
                  onChange={(e) => handleCodeChange(i, e.target.value)}
                  onKeyDown={(e) => handleCodeKeyDown(i, e)}
                  onPaste={i === 0 ? handleCodePaste : undefined}
                  className={`w-11 h-13 text-center text-[18px] font-bold rounded-xl border transition-all duration-200 outline-none
                    ${char
                      ? 'bg-white/8 border-white/20 text-white'
                      : 'bg-white/3 border-white/8 text-white'
                    }
                    ${codeError ? 'border-[#FF3B30]/50' : ''}
                    focus:border-white/30 focus:bg-white/6
                  `}
                  style={{ caretColor: 'transparent' }}
                />
              ))}
            </div>

            {/* Empty square dot indicators */}
            <div className="flex justify-center gap-2.5 mb-4 -mt-3">
              {code.map((char, i) => (
                <div key={i} className="w-11 flex justify-center">
                  {!char && <div className="w-1.5 h-1.5 rounded-full bg-white/10" />}
                </div>
              ))}
            </div>

            {codeError && (
              <p className="text-[13px] text-[#FF3B30] text-center mb-3">{codeError}</p>
            )}

            {verifying && (
              <div className="flex justify-center mb-3">
                <div className="w-5 h-5 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
              </div>
            )}

            <button
              onClick={() => verifyCode(code.join(''))}
              disabled={code.some(c => !c) || verifying}
              className="ios-button-primary w-full disabled:opacity-30"
            >
              Проверить код
            </button>
          </>
        ) : (
          <>
            <div className="text-center mb-6">
              <h1 className="text-[22px] font-bold text-white tracking-tight">Профиль</h1>
              <p className="text-[14px] text-white/30 mt-1.5">{schoolName}</p>
            </div>

            <div className="space-y-3.5">
              <div>
                <label className="text-[12px] font-medium text-white/30 mb-1.5 block uppercase tracking-wider">ФИО</label>
                <input type="text" value={fullName} onChange={(e) => { setFullName(e.target.value); setProfileError('') }}
                  placeholder="Иванов Иван Иванович"
                  className="glass-input w-full px-4 py-3 text-[15px] text-white placeholder-white/20 bg-transparent focus:ring-0 focus:shadow-none" />
              </div>
              <div className="flex gap-2.5">
                <div className="flex-1">
                  <label className="text-[12px] font-medium text-white/30 mb-1.5 block uppercase tracking-wider">Класс</label>
                  <select value={classYear} onChange={(e) => { setClassYear(e.target.value); setProfileError('') }}
                    className="glass-input w-full px-4 py-3 text-[15px] text-white bg-transparent focus:ring-0 focus:shadow-none appearance-none cursor-pointer"
                    style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath d='M3 4.5L6 7.5L9 4.5' stroke='rgba(255,255,255,0.3)' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round' fill='none'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center' }}>
                    <option value="" disabled className="bg-[#1a1a1a] text-white/30">Выберите</option>
                    {[1,2,3,4,5,6,7,8,9,10,11].map(n => (
                      <option key={n} value={String(n)} className="bg-[#1a1a1a] text-white">{n}</option>
                    ))}
                  </select>
                </div>
                <div className="flex-1">
                  <label className="text-[12px] font-medium text-white/30 mb-1.5 block uppercase tracking-wider">Буква</label>
                  <select value={classLetter} onChange={(e) => { setClassLetter(e.target.value); setProfileError('') }}
                    className="glass-input w-full px-4 py-3 text-[15px] text-white bg-transparent focus:ring-0 focus:shadow-none appearance-none cursor-pointer"
                    style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath d='M3 4.5L6 7.5L9 4.5' stroke='rgba(255,255,255,0.3)' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round' fill='none'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center' }}>
                    <option value="" disabled className="bg-[#1a1a1a] text-white/30">Буква</option>
                    {['А','Б','В','Г','Д','Е','Ж','З','И','К','Л','М'].map(l => (
                      <option key={l} value={l} className="bg-[#1a1a1a] text-white">{l}</option>
                    ))}
                  </select>
                </div>
              </div>

              {profileError && <p className="text-[13px] text-[#FF3B30] text-center">{profileError}</p>}

              <button onClick={handleSubmit} disabled={submitting}
                className="ios-button-primary w-full disabled:opacity-50 mt-2">
                {submitting ? 'Сохранение...' : 'Завершить регистрацию'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

/* ============================================================
   MAIN APP
   ============================================================ */

export default function Page() {
  const [mounted, setMounted] = useState(false)
  const [authUser, setAuthUser] = useState<AuthUser | null>(null)
  const [authChecked, setAuthChecked] = useState(false)
  const [isTelegram, setIsTelegram] = useState(false)
  const [currentTab, setCurrentTab] = useState<Tab>('home')
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [recentAchievements, setRecentAchievements] = useState<Achievement[]>([])
  const [achievementCounts, setAchievementCounts] = useState({ total: 0, APPROVED: 0, PENDING: 0, REJECTED: 0 })
  const [allAchievements, setAllAchievements] = useState<Achievement[]>([])
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [badges, setBadges] = useState<BadgeItem[]>([])
  const [loading, setLoading] = useState(false)

  // Add achievement form state
  const [showAddSheet, setShowAddSheet] = useState(false)
  const [formAchievementType, setFormAchievementType] = useState<AchievementType>('')
  const [formTitle, setFormTitle] = useState('')
  const [formDesc, setFormDesc] = useState('')
  const [formLevel, setFormLevel] = useState<AchievementLevel>('')
  const [formResultType, setFormResultType] = useState<ResultTypeMode>('PLACEMENT')
  const [formPlacement, setFormPlacement] = useState(1)
  const [formResultStatus, setFormResultStatus] = useState('PARTICIPANT')
  const [formXp, setFormXp] = useState(5)
  const [formDate, setFormDate] = useState('')
  const [formComment, setFormComment] = useState('')
  const [formFileUrl, setFormFileUrl] = useState<string | null>(null)
  const [formFilePreview, setFormFilePreview] = useState<string | null>(null)
  const [uploadingFile, setUploadingFile] = useState(false)
  const [formAchievementFilter, setFormAchievementFilter] = useState('all')
  const [formLevelFilter, setFormLevelFilter] = useState('all')

  // Achievement detail modal
  const [selectedAchievement, setSelectedAchievement] = useState<Achievement | null>(null)

  // Admin panel
  const [showAdmin, setShowAdmin] = useState(false)
  const [pendingAchievements, setPendingAchievements] = useState<Achievement[]>([])

  // Registration flow
  const [needsRegistration, setNeedsRegistration] = useState(false)
  const [adminStats, setAdminStats] = useState<Record<string, unknown> | null>(null)
  const [adminDirections, setAdminDirections] = useState<Record<string, boolean>>({})
  const [adminXp, setAdminXp] = useState(0)
  const [adminRejectReasons, setAdminRejectReasons] = useState<Record<string, string>>({})

  // Admin: student selector
  const [students, setStudents] = useState<{ id: string; name: string; username: string | null }[]>([])
  const [studentSearch, setStudentSearch] = useState('')
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null)
  const [showStudentDropdown, setShowStudentDropdown] = useState(false)
  // Admin: direction selection in add form
  const [formDirections, setFormDirections] = useState<Record<string, boolean>>({})

  // Challenges (seasonal achievements)
  const [challenges, setChallenges] = useState<{
    id: string; title: string; description: string; direction: string;
    xpTarget: number; rewardXp: number; startDate: string; endDate: string;
    isActive: boolean; isJoined: boolean; xpCollected: number; completed: boolean; completedAt: string | null;
  }[]>([])

  // Rating filters
  const [selectedLeague, setSelectedLeague] = useState<string | null>(null)

  // Faculty state
  const [faculties, setFaculties] = useState<FacultyItem[]>([])
  const [userFacultyId, setUserFacultyId] = useState<string | null>(null)
  const [showFacultyPicker, setShowFacultyPicker] = useState(false)

  // File input ref
  const fileInputRef = useRef<HTMLInputElement>(null)

  // IMPORTANT: These must be declared BEFORE any useCallback that references them
  const userId = authUser?.id || ''
  const isAdmin = authUser?.role === 'ADMIN' || profile?.role === 'ADMIN'
  const userLeague = getLeague(profile?.league || 'bronze')

  // Auth check on mount — Telegram auto-login or localStorage
  useEffect(() => {
    const tryTelegramAuth = async (): Promise<boolean> => {
      const tgWindow = window as unknown as {
        Telegram?: {
          WebApp?: {
            initDataUnsafe?: { user?: { id: number; first_name: string; last_name?: string; username?: string; photo_url?: string } }
            initData?: string
            ready?: () => void
            expand?: () => void
          }
        }
      }
      const tg = tgWindow.Telegram
      const tgWebApp = tg?.WebApp

      if (!tgWebApp) {
        console.log('[TG] Telegram WebApp SDK not found on window')
        return false
      }

      // Signal Telegram that the app is ready
      try { tgWebApp.ready?.() } catch {}
      try { tgWebApp.expand?.() } catch {}

      const tgUser = tgWebApp.initDataUnsafe?.user
      const hasInitData = tgWebApp.initData && tgWebApp.initData.length > 0

      console.log('[TG] initData present:', hasInitData, 'user:', tgUser ? { id: tgUser.id, name: tgUser.first_name } : null)

      if (!tgUser && !hasInitData) {
        console.log('[TG] No Telegram user data available')
        return false
      }

      setIsTelegram(true)
      try {
        const res = await fetch('/api/auth/telegram', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            telegramId: String(tgUser?.id || 'tg_' + Date.now()),
            firstName: tgUser?.first_name || 'Telegram',
            lastName: tgUser?.last_name || '',
            username: tgUser?.username || '',
            photoUrl: tgUser?.photo_url || '',
            initData: tgWebApp.initData || '',
          }),
        })
        const data = await res.json()
        if (res.ok && data.user) {
          console.log('[TG] Auth successful:', data.user.name, 'registered:', data.user.registered)
          setAuthUser(data.user)
          localStorage.setItem('auth_user', JSON.stringify(data.user))
          // Check if user needs registration (no school info yet)
          if (!data.user.registered) {
            setNeedsRegistration(true)
          }
          return true
        } else {
          console.error('[TG] Auth failed:', data.error)
        }
      } catch (e) {
        console.error('[TG] Auth error:', e)
      }
      return false
    }

    const init = async () => {
      // Wait for Telegram WebApp script to load (multiple attempts)
      let tgAuthed = false
      for (let i = 0; i < 5; i++) {
        await new Promise(r => setTimeout(r, 200))
        tgAuthed = await tryTelegramAuth()
        if (tgAuthed) break
        // If window.Telegram doesn't exist at all after first try, stop retrying
        if (!(window as any).Telegram) break
      }

      if (tgAuthed) {
        setAuthChecked(true)
        return
      }

      // Fallback: check localStorage
      const stored = localStorage.getItem('auth_user')
      if (stored) {
        try {
          const parsed = JSON.parse(stored)
          setAuthUser(parsed)
          // Check if this stored user needs registration
          if (!parsed.registered) {
            setNeedsRegistration(true)
          }
        } catch { /* ignore */ }
      }
      setAuthChecked(true)
    }
    init()
  }, [])

  const handleLogin = (user: AuthUser) => {
    setAuthUser(user)
    localStorage.setItem('auth_user', JSON.stringify(user))
  }

  const handleRegistrationComplete = (user: AuthUser) => {
    setAuthUser(user)
    setNeedsRegistration(false)
  }

  const handleLogout = () => {
    setAuthUser(null)
    setProfile(null)
    setUserFacultyId(null)
    setNeedsRegistration(false)
    localStorage.removeItem('auth_user')
  }

  const fetchProfile = useCallback(async () => {
    if (!userId) return
    try {
      const res = await fetch(`/api/profile?userId=${userId}`)
      if (!res.ok) return
      const data = await res.json()
      setProfile(data.user)
      setUserFacultyId(data.user?.facultyId || null)
      setRecentAchievements(data.recentAchievements || [])
      setAchievementCounts(data.achievementCounts || { total: 0, APPROVED: 0, PENDING: 0, REJECTED: 0 })
    } catch (e) {
      console.error('Profile fetch error:', e)
    }
  }, [userId])

  const fetchAchievements = useCallback(async () => {
    if (!userId) return
    try {
      const roleParam = isAdmin ? '&role=ADMIN' : ''
      const res = await fetch(`/api/achievements?userId=${userId}${roleParam}`)
      if (!res.ok) return
      const data = await res.json()
      setAllAchievements(data.achievements || [])
    } catch (e) {
      console.error('Achievements fetch error:', e)
    }
  }, [userId, isAdmin])

  const fetchBadges = useCallback(async () => {
    if (!userId) return
    try {
      const res = await fetch(`/api/badges?userId=${userId}`)
      if (!res.ok) return
      const data = await res.json()
      setBadges(data.badges || [])
    } catch (e) {
      console.error('Badges fetch error:', e)
    }
  }, [userId])

  const fetchLeaderboard = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
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
  }, [selectedLeague])

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

  const fetchChallenges = useCallback(async () => {
    if (!userId) return
    try {
      const res = await fetch(`/api/challenges?userId=${userId}`)
      if (!res.ok) return
      const data = await res.json()
      setChallenges(data.challenges || [])
    } catch (e) {
      console.error('Challenges fetch error:', e)
    }
  }, [userId])

  const fetchStudents = useCallback(async () => {
    try {
      const res = await fetch('/api/students')
      if (!res.ok) return
      const data = await res.json()
      setStudents(data.students || [])
    } catch (e) {
      console.error('Students fetch error:', e)
    }
  }, [])

  const fetchFaculties = useCallback(async () => {
    try {
      const res = await fetch('/api/faculty')
      if (!res.ok) return
      const data = await res.json()
      setFaculties(data.faculties || [])
    } catch (e) {
      console.error('Faculties fetch error:', e)
    }
  }, [])

  useEffect(() => { if (userId) { fetchProfile(); fetchAchievements(); fetchBadges(); fetchChallenges(); fetchFaculties() } }, [userId, fetchProfile, fetchAchievements, fetchBadges, fetchChallenges, fetchFaculties])

  useEffect(() => {
    if (currentTab === 'rating') fetchLeaderboard()
  }, [currentTab, fetchLeaderboard])

  useEffect(() => {
    if (showAdmin) { fetchPending(); fetchAdminStats() }
  }, [showAdmin, fetchPending, fetchAdminStats])

  // Auto-calculate XP
  useEffect(() => {
    if (formAchievementType && formLevel) {
      setFormXp(calculateAutoXp(formLevel, formResultType, formPlacement, formResultStatus))
    }
  }, [formAchievementType, formLevel, formResultType, formPlacement, formResultStatus])

  const resetForm = () => {
    setFormAchievementType(''); setFormTitle(''); setFormDesc('')
    setFormLevel(''); setFormResultType('PLACEMENT'); setFormPlacement(1)
    setFormResultStatus('PARTICIPANT'); setFormXp(5)
    setFormDate(''); setFormComment('')
    setFormFileUrl(null); setFormFilePreview(null)
    setSelectedStudentId(null); setStudentSearch('')
    setFormDirections({}); setShowStudentDropdown(false)
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Файл слишком большой (макс. 10 МБ)')
      return
    }
    setUploadingFile(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch('/api/upload', { method: 'POST', body: formData })
      if (!res.ok) { toast.error('Ошибка загрузки файла'); return }
      const data = await res.json()
      setFormFileUrl(data.url)
      setFormFilePreview(data.url)
      toast.success('Файл загружен')
    } catch {
      toast.error('Ошибка загрузки')
    } finally {
      setUploadingFile(false)
    }
  }

  const handleJoinFaculty = async (facultyId: string) => {
    if (!userId) return
    try {
      const res = await fetch('/api/faculty', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, facultyId }),
      })
      if (!res.ok) { toast.error('Ошибка вступления в факультет'); return }
      const data = await res.json()
      setUserFacultyId(facultyId)
      setShowFacultyPicker(false)
      toast.success(`Вы вступили в факультет ${data.faculty?.name || ''}!`)
      fetchFaculties()
    } catch {
      toast.error('Ошибка сети')
    }
  }

  const handleJoinChallenge = async (challengeId: string) => {
    if (!userId) return
    try {
      const res = await fetch('/api/challenges', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, challengeId }),
      })
      const data = await res.json()
      if (!res.ok) {
        if (data.error === 'Already joined') {
          toast.error('Вы уже участвуете в этом челлендже')
        } else {
          toast.error('Ошибка при вступлении в челлендж')
        }
        return
      }
      toast.success('Вы вступили в челлендж! Зарабатывайте XP для его выполнения.')
      fetchChallenges()
    } catch {
      toast.error('Ошибка сети')
    }
  }

  const handleAddAchievement = async () => {
    if (!formTitle || !formAchievementType) {
      toast.error('Заполните название и тип достижения')
      return
    }
    if (!formLevel) {
      toast.error('Выберите уровень достижения')
      return
    }
    // Admin must select a student
    if (isAdmin && !selectedStudentId) {
      toast.error('Выберите ученика')
      return
    }
    if (!userId) {
      toast.error('Ошибка авторизации. Перевойдите в аккаунт.')
      return
    }
    const targetUserId = isAdmin && selectedStudentId ? selectedStudentId : userId
    const isAdminAdding = isAdmin && selectedStudentId && selectedStudentId !== userId
    const selectedDirs = Object.entries(formDirections).filter(([, v]) => v).map(([k]) => k).join(',') || null
    try {
      const body: Record<string, unknown> = {
        userId: targetUserId,
        title: formTitle.trim(),
        description: formDesc?.trim() || null,
        achievementType: formAchievementType,
        achievementLevel: formLevel || null,
        resultType: formResultType || null,
        placement: formResultType === 'PLACEMENT' ? formPlacement : null,
        resultStatus: formResultType === 'STATUS' ? formResultStatus : null,
        xpRequested: formXp,
        achievementDate: formDate || null,
        comment: formComment?.trim() || null,
        fileUrl: formFileUrl || null,
        direction: selectedDirs,
      }
      // Admin adding for student: auto-approve
      if (isAdminAdding) {
        body.autoApprove = true
        body.reviewedBy = userId
      }
      const res = await fetch('/api/achievements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) {
        console.error('Achievement creation error:', data)
        toast.error(data.error || 'Ошибка при создании достижения')
        return
      }
      toast.success(isAdminAdding ? 'Достижение добавлено и одобрено!' : 'Достижение отправлено на проверку!')
      resetForm()
      setShowAddSheet(false)
      fetchProfile()
      fetchAchievements()
      fetchChallenges()
    } catch (e) {
      console.error('Achievement creation network error:', e)
      toast.error('Ошибка сети. Попробуйте ещё раз.')
    }
  }

  const handleModerate = async (achievementId: string, action: 'approve' | 'reject', xpAwarded?: number, directions?: string, reviewComment?: string) => {
    if (action === 'reject' && (!reviewComment || !reviewComment.trim())) {
      toast.error('Укажите причину отклонения')
      return
    }
    try {
      const res = await fetch('/api/moderate', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          achievementId, action, xpAwarded, directions, reviewComment: action === 'reject' ? reviewComment : undefined, adminUserId: userId,
        }),
      })
      if (!res.ok) return
      toast.success(action === 'approve' ? 'Достижение одобрено' : 'Достижение отклонено')
      setAdminRejectReasons(prev => { const next = { ...prev }; delete next[achievementId]; return next })
      fetchPending(); fetchAdminStats(); fetchProfile(); fetchAchievements(); fetchChallenges()
    } catch {
      toast.error('Ошибка')
    }
  }

  const handleRevokeAchievement = async (achievementId: string) => {
    try {
      const res = await fetch(`/api/achievements/${achievementId}`, { method: 'DELETE' })
      if (!res.ok) { toast.error('Ошибка при отзыве достижения'); return }
      toast.success('Достижение отозвано')
      fetchAchievements(); fetchProfile()
    } catch {
      toast.error('Ошибка сети')
    }
  }

  useEffect(() => {
    if (isAdmin && showAddSheet) fetchStudents()
  }, [isAdmin, showAddSheet, fetchStudents])

  // Filtered achievements — by type AND level
  const filteredAchievements = allAchievements.filter(a => {
    if (formAchievementFilter !== 'all' && a.achievementType !== formAchievementFilter) return false
    if (formLevelFilter !== 'all' && a.achievementLevel !== formLevelFilter) return false
    return true
  })

  // Direction XP computed from approved achievements
  const directionXp: Record<string, number> = {}
  Object.keys(DIRECTIONS).forEach(d => { directionXp[d] = 0 })
  allAchievements.filter(a => a.status === 'APPROVED' && a.direction).forEach(a => {
    const dirs = a.direction!.split(',')
    dirs.forEach(d => {
      const trimmed = d.trim()
      if (directionXp[trimmed] !== undefined) {
        directionXp[trimmed] += a.xpAwarded
      }
    })
  })

  // Mounted guard — must be after all hooks
  useEffect(() => { setMounted(true) }, [])

  /* ============================================================
     AUTH GATE
     ============================================================ */
  if (!mounted) return null
  if (!authChecked) return null
  if (!authUser && !isTelegram) return <LoginScreen onLogin={handleLogin} />
  if (needsRegistration && authUser) return <RegistrationScreen userId={authUser.id} onComplete={handleRegistrationComplete} />

  /* ============================================================
     RENDER: HOME
     ============================================================ */
  const renderHome = () => {
    // Find user's current faculty from the faculties list
    const userFaculty = faculties.find(f => f.id === userFacultyId)

    return (
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

      {/* Level card with league inside */}
      <div className="level-card-pro p-5 relative">
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/8 border border-white/10 flex items-center justify-center">
                <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
                  <path d="M10 2L12.5 7.5L18 8.5L14 12.5L15 18L10 15.5L5 18L6 12.5L2 8.5L7.5 7.5L10 2Z" fill="white" stroke="white" strokeWidth="0.5" />
                </svg>
              </div>
              <div>
                <div className="text-[12px] text-white/30 font-medium uppercase tracking-wider">Уровень</div>
                <div className="text-[18px] font-bold text-white">{profile?.level} · {profile?.levelName}</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-[22px] font-bold text-white tabular-nums">{profile?.totalXp}</div>
              <div className="text-[11px] text-white/25 font-medium">XP</div>
            </div>
          </div>
          {/* League inside level card — glassmorphism, no color */}
          <div className="flex items-center gap-2 mb-4 ml-[52px]">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[12px] font-semibold bg-white/5 border border-white/8 text-white/40">
              <IconCrown size={12} />
              <span className={`${userLeague.cssClass} text-[12px]`}>{userLeague.name}</span>
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

      {/* Stats — achievements + pending in one unified block */}
      <div className="glass-card p-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/7 flex items-center justify-center">
            <IconAchievements active={false} />
          </div>
          <div>
            <div className="text-[13px] font-bold text-white tabular-nums">{achievementCounts.APPROVED} <span className="text-white/20 font-normal">из {achievementCounts.total}</span></div>
            <div className="text-[11px] text-white/25">достижений одобрено{achievementCounts.PENDING > 0 ? ` · ${achievementCounts.PENDING} на проверке` : ''}</div>
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-2">
        <button onClick={() => { setCurrentTab('milestones'); setTimeout(() => setShowAddSheet(true), 100) }}
          className="glass-card flex items-center gap-3 py-3 px-4 active:scale-[0.97] ios-spring">
          <div className="w-9 h-9 rounded-xl bg-white/6 border border-white/8 flex items-center justify-center">
            <IconPlus size={16} />
          </div>
          <span className="text-[13px] text-white/50 font-semibold">Добавить</span>
        </button>
        <button onClick={() => setCurrentTab('rating')}
          className="glass-card flex items-center gap-3 py-3 px-4 active:scale-[0.97] ios-spring">
          <div className="w-9 h-9 rounded-xl bg-white/6 border border-white/8 flex items-center justify-center">
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
          <button onClick={() => setCurrentTab('milestones')} className="text-[13px] text-white font-medium">Все</button>
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

      {/* Faculty block */}
      <div className="glass-card p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-7 h-7 rounded-lg bg-white/5 border border-white/7 flex items-center justify-center text-white/50">
            <IconShield />
          </div>
          <h3 className="text-[15px] font-bold text-white">Факультет</h3>
        </div>

        {/* User's current faculty */}
        {userFaculty ? (
          <div className="flex items-center gap-3 mb-4 p-3 rounded-xl bg-white/4 border border-white/7">
            <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/8 flex items-center justify-center" style={{ color: userFaculty.color }}>
              <FacultyIcon facultyId={userFaculty.id} />
            </div>
            <div>
              <div className="text-[14px] font-bold text-white">{userFaculty.name}</div>
              <div className="text-[12px] text-white/30">{userFaculty.totalXp} XP за год</div>
            </div>
          </div>
        ) : (
          <div className="mb-4">
            <p className="text-[12px] text-white/25 mb-3">Выберите свой факультет:</p>
            <div className="flex gap-2">
              {faculties.map((f) => (
                <button
                  key={f.id}
                  onClick={() => handleJoinFaculty(f.id)}
                  className="flex-1 flex flex-col items-center gap-2 py-3 px-2 rounded-xl bg-white/4 border border-white/7 active:scale-95 ios-spring transition-all"
                >
                  <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/8 flex items-center justify-center" style={{ color: f.color }}>
                    <FacultyIcon facultyId={f.id} />
                  </div>
                  <span className="text-[11px] font-semibold text-white/50">{f.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Faculty rating */}
        {faculties.length > 0 && (
          <div>
            <div className="text-[11px] text-white/20 font-medium uppercase tracking-wider mb-2.5">Рейтинг</div>
            <div className="space-y-1.5">
              {faculties.map((f, idx) => {
                const isCurrentUser = f.id === userFacultyId
                return (
                  <div
                    key={f.id}
                    className={`flex items-center gap-3 p-2.5 rounded-xl ${isCurrentUser ? 'bg-white/5 border border-white/8' : 'bg-white/[0.02]'}`}
                  >
                    <span className="text-[12px] font-bold text-white/15 w-4 text-center tabular-nums">{idx + 1}</span>
                    <div className="w-7 h-7 rounded-lg bg-white/5 border border-white/6 flex items-center justify-center" style={{ color: f.color }}>
                      <FacultyIcon facultyId={f.id} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className={`text-[13px] font-semibold ${isCurrentUser ? 'text-white' : 'text-white/50'}`}>{f.name}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[13px] font-bold tabular-nums text-white/40">{f.totalXp}</span>
                      <span className="text-[10px] text-white/15 ml-0.5">XP</span>
                    </div>
                    <span className="text-[10px] text-white/15 tabular-nums">{f.memberCount}ч</span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Change faculty button */}
        {userFaculty && (
          <button
            onClick={() => setShowFacultyPicker(!showFacultyPicker)}
            className="mt-3 text-[12px] text-white/20 hover:text-white/35 transition-colors"
          >
            Сменить факультет
          </button>
        )}
        {showFacultyPicker && userFaculty && (
          <div className="mt-3 flex gap-2">
            {faculties.map((f) => (
              <button
                key={f.id}
                onClick={() => handleJoinFaculty(f.id)}
                disabled={f.id === userFacultyId}
                className="flex-1 flex flex-col items-center gap-1.5 py-2.5 px-2 rounded-xl bg-white/4 border border-white/7 active:scale-95 ios-spring transition-all disabled:opacity-30 disabled:active:scale-100"
              >
                <div className="w-7 h-7 rounded-lg bg-white/5 border border-white/8 flex items-center justify-center" style={{ color: f.color }}>
                  <FacultyIcon facultyId={f.id} />
                </div>
                <span className="text-[10px] font-semibold text-white/50">{f.name}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
    )
  }

  /* ============================================================
     RENDER: ACHIEVEMENTS TAB (now labeled "Ачивки" — Badge Cards)
     ============================================================ */
  const renderAchievements = () => {
    const earnedCount = badges.filter(b => b.earned).length

    // Define badge card colors for visual variety
    const badgeColors = [
      { bg: 'bg-white/6', border: 'border-white/8', glow: 'shadow-white/5' },
      { bg: 'bg-white/6', border: 'border-white/8', glow: 'shadow-white/5' },
      { bg: 'bg-white/6', border: 'border-white/8', glow: 'shadow-white/5' },
      { bg: 'bg-white/6', border: 'border-white/8', glow: 'shadow-white/5' },
      { bg: 'bg-white/6', border: 'border-white/8', glow: 'shadow-white/5' },
      { bg: 'bg-white/6', border: 'border-white/8', glow: 'shadow-white/5' },
    ]

    return (
      <div className="px-5 pb-6 space-y-5 ios-fade-in">
        <div className="pt-3">
          <h1 className="ios-large-title">Ачивки</h1>
          <p className="text-[14px] text-white/30 mt-1">
            Получены {earnedCount} из {badges.length}
          </p>
        </div>

        {/* Progress bar */}
        {badges.length > 0 && (
          <div className="glass-card p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[12px] text-white/30 font-medium uppercase tracking-wider">Прогресс</span>
              <span className="text-[13px] font-bold text-white">{earnedCount}/{badges.length}</span>
            </div>
            <XpProgressBar
              current={earnedCount}
              max={badges.length}
              gradient="linear-gradient(90deg, rgba(255,255,255,0.5), rgba(255,255,255,0.2))"
            />
          </div>
        )}

        {/* Badge cards grid */}
        <div className="grid grid-cols-2 gap-3">
          {badges.map((badge, idx) => {
            const color = badgeColors[idx % badgeColors.length]
            return (
              <div key={badge.id} className={`glass-card p-4 relative overflow-hidden transition-all duration-300 ${badge.earned ? `shadow-lg ${color.glow}` : 'opacity-40 grayscale'}`}>
                {badge.earned && (
                  <div className="absolute top-2 right-2 text-[#34C759]">
                    <IconCheck />
                  </div>
                )}
                <div className="flex flex-col items-center text-center">
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-[32px] mb-3 ${badge.earned ? `${color.bg} ${color.border} border shadow-lg` : 'bg-white/4 border border-white/6'}`}>
                    {badge.emoji}
                  </div>
                  <div className={`text-[13px] font-semibold leading-tight ${badge.earned ? 'text-white' : 'text-white/30'}`}>
                    {badge.name}
                  </div>
                  <div className="text-[10px] text-white/25 mt-1.5 leading-tight min-h-[24px]">
                    {badge.description}
                  </div>
                  {badge.earned && badge.earnedAt && (
                    <div className="mt-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#34C759]/10 border border-[#34C759]/15">
                      <span className="w-1 h-1 rounded-full bg-[#34C759]" />
                      <span className="text-[9px] text-[#34C759] font-medium">
                        {new Date(badge.earnedAt).toLocaleDateString('ru-RU')}
                      </span>
                    </div>
                  )}
                  {!badge.earned && (
                    <div className="mt-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/4 border border-white/6">
                      <span className="w-1 h-1 rounded-full bg-white/20" />
                      <span className="text-[9px] text-white/20 font-medium">Не получена</span>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {badges.length === 0 && challenges.length === 0 && (
          <div className="text-center py-12">
            <div className="w-14 h-14 rounded-2xl bg-white/4 flex items-center justify-center mx-auto mb-3">
              <IconMilestones active={false} />
            </div>
            <p className="text-[14px] text-white/20 font-medium">Ачивки скоро появятся</p>
          </div>
        )}

        {/* Seasonal Challenges */}
        {challenges.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-1 h-5 rounded-full bg-gradient-to-b from-white/20 to-white/5" />
              <h3 className="text-[15px] font-bold text-white">Сезонные челленджи</h3>
              <span className="px-2 py-0.5 rounded-full bg-white/8 text-[10px] font-bold text-white uppercase tracking-wider">Live</span>
            </div>
            <div className="space-y-2.5">
              {challenges.map((ch) => {
                const dirInfo = DIRECTIONS[ch.direction]
                const progress = ch.xpTarget > 0 ? Math.min((ch.xpCollected / ch.xpTarget) * 100, 100) : 0
                return (
                  <div key={ch.id} className={`glass-card p-4 relative overflow-hidden ${ch.completed ? 'ring-1 ring-[#34C759]/30' : ''}`}>
                    {/* Decorative gradient stripe */}
                    <div className="absolute left-0 top-0 bottom-0 w-1 rounded-full" style={{ background: dirInfo?.color || '#FF9F0A' }} />

                    <div className="pl-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-[14px] font-semibold text-white">{ch.title}</span>
                            {ch.completed && (
                              <span className="px-1.5 py-0.5 rounded-md bg-[#34C759]/15 text-[9px] font-bold text-[#34C759] uppercase">Готово</span>
                            )}
                          </div>
                          <p className="text-[12px] text-white/35 mt-1 leading-relaxed">{ch.description}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="text-[16px] font-bold text-white">+{ch.rewardXp}</div>
                          <div className="text-[9px] text-white/20 uppercase tracking-wider">XP</div>
                        </div>
                      </div>

                      {/* Direction tag */}
                      {dirInfo && (
                        <div className="mt-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium" style={{ background: `${dirInfo.color}15`, color: dirInfo.color }}>
                          <span className="w-1.5 h-1.5 rounded-full" style={{ background: dirInfo.color }} />
                          {dirInfo.label}
                        </div>
                      )}

                      {/* Not joined — show join button */}
                      {!ch.isJoined && !ch.completed && (
                        <button
                          onClick={() => handleJoinChallenge(ch.id)}
                          className="mt-3 w-full py-2.5 rounded-xl bg-white/8 border border-white/12 text-[13px] font-semibold text-white active:scale-[0.97] ios-spring transition-all hover:bg-white/12"
                        >
                          Участвовать
                        </button>
                      )}

                      {/* Joined but not completed — show progress */}
                      {ch.isJoined && !ch.completed && (
                        <div className="mt-3">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[11px] text-white/30">{ch.xpCollected} / {ch.xpTarget} XP</span>
                            <span className="text-[11px] text-white font-semibold">{Math.round(progress)}%</span>
                          </div>
                          <XpProgressBar
                            current={ch.xpCollected}
                            max={ch.xpTarget}
                            gradient={`linear-gradient(90deg, ${dirInfo?.color || '#FF9F0A'}, #FF3B30)`}
                          />
                        </div>
                      )}

                      {/* Completed — show success */}
                      {ch.completed && (
                        <div className="mt-3 flex items-center gap-2 px-3 py-2 rounded-xl bg-[#34C759]/8 border border-[#34C759]/15">
                          <span className="text-[14px]">🎉</span>
                          <div>
                            <div className="text-[12px] font-semibold text-[#34C759]">Челлендж выполнен!</div>
                            <div className="text-[10px] text-white/25">+{ch.rewardXp} XP начислено</div>
                          </div>
                        </div>
                      )}

                      {/* Deadline */}
                      {ch.endDate && !ch.completed && (
                        <div className="mt-2 text-[10px] text-white/20">
                          До {new Date(ch.endDate).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    )
  }

  /* ============================================================
     RENDER: MILESTONES TAB (now labeled "Достижения" — Achievement List)
     ============================================================ */
  const renderMilestones = () => (
    <div className="px-5 pb-6 space-y-4 ios-fade-in">
      <div className="pt-3 flex items-center justify-between">
        <h1 className="ios-large-title">Достижения</h1>
        <button onClick={() => setShowAddSheet(true)}
          className="w-9 h-9 rounded-xl bg-white flex items-center justify-center active:scale-95 ios-spring">
          <IconPlus size={18} />
        </button>
      </div>

      {/* Admin badge */}
      {isAdmin && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#FF9F0A]/8 border border-[#FF9F0A]/15">
          <IconShield />
          <span className="text-[12px] text-[#FF9F0A] font-medium">Вы видите достижения всех учеников</span>
          <span className="ml-auto text-[11px] text-white/25 tabular-nums">{allAchievements.length} записей</span>
        </div>
      )}

      {/* Filters */}
      <div className="space-y-2 overflow-hidden">
        {/* Type filter */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 -mb-1" style={{ WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none' }}>
          {[
            { key: 'all', label: 'Все' },
            { key: 'SPORT', label: 'Спорт' },
            { key: 'CREATIVE', label: 'Творчество' },
            { key: 'OLYMPIAD', label: 'РЭШ/ВСОШ' },
            { key: 'FREE_FORM', label: 'Свободные' },
          ].map((f) => (
            <button key={f.key} onClick={() => { setFormAchievementFilter(f.key); setFormLevelFilter('all') }}
              className={`shrink-0 ios-pill ${formAchievementFilter === f.key ? 'ios-pill-active' : ''}`}>
              {f.label}
            </button>
          ))}
        </div>

        {/* Level filter */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 -mb-1" style={{ WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none' }}>
          {[
            { key: 'all', label: 'Все ур.' },
            ...Object.entries(ACHIEVEMENT_LEVELS).map(([key, val]) => ({ key, label: val.label })),
          ].map((f) => (
            <button key={f.key} onClick={() => setFormLevelFilter(f.key)}
              className={`shrink-0 ios-pill text-[11px] py-1 px-2.5 ${formLevelFilter === f.key ? 'ios-pill-active' : ''}`}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Achievement list */}
      <div className="space-y-1.5 max-h-[60vh] overflow-y-auto">
        {filteredAchievements.map((a) => (
          <div key={a.id} className="w-full text-left ios-list-item p-3.5 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/4 flex items-center justify-center shrink-0">
              <AchievementTypeIcon type={a.achievementType} />
            </div>
            <button className="flex-1 min-w-0" onClick={() => setSelectedAchievement(a)}>
              <div className="text-[14px] font-medium text-white truncate">{a.title}</div>
              <div className="flex items-center gap-2 mt-0.5">
                {/* Admin sees student name */}
                {isAdmin && a.user && (
                  <span className="text-[11px] text-white font-medium">{a.user.name}</span>
                )}
                <StatusDot status={a.status} />
                {a.achievementLevel && (
                  <span className="text-[10px] text-white/20">
                    {ACHIEVEMENT_LEVELS[a.achievementLevel]?.label || a.achievementLevel}
                    {getResultLabel(a) && ` · ${getResultLabel(a)}`}
                  </span>
                )}
              </div>
            </button>
            <div className="text-right shrink-0">
              {a.status === 'APPROVED' && a.xpAwarded > 0 && (
                <span className="text-[13px] font-bold text-[#34C759]">+{a.xpAwarded}</span>
              )}
              {a.status === 'PENDING' && (
                <span className="text-[11px] text-white/15">{a.xpRequested} XP</span>
              )}
            </div>
            {/* Admin: revoke button */}
            {isAdmin && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  if (confirm('Отозвать это достижение? XP будет списан.')) {
                    handleRevokeAchievement(a.id)
                  }
                }}
                className="shrink-0 w-7 h-7 rounded-lg bg-[#FF3B30]/10 border border-[#FF3B30]/15 flex items-center justify-center text-[#FF3B30]/60 hover:text-[#FF3B30] hover:bg-[#FF3B30]/15 transition-colors"
                title="Отозвать"
              >
                <IconClose size={10} />
              </button>
            )}
            {!isAdmin && <div className="text-white/10 shrink-0"><IconChevron /></div>}
          </div>
        ))}
        {filteredAchievements.length === 0 && (
          <div className="text-center py-12">
            <div className="w-14 h-14 rounded-2xl bg-white/4 flex items-center justify-center mx-auto mb-3">
              <IconAchievements active={false} />
            </div>
            <p className="text-[14px] text-white/20 font-medium">Пока нет достижений</p>
            <button onClick={() => setShowAddSheet(true)}
              className="mt-3 text-[13px] text-white font-semibold">Добавить первую</button>
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
    const podiumRanks = top3.length >= 3 ? [2, 1, 3] : top3.length === 2 ? [2, 1] : top3.map((_, i) => i + 1)

    return (
      <div className="px-5 pb-6 space-y-4 ios-fade-in">
        <div className="pt-3">
          <h1 className="ios-large-title">Рейтинг</h1>
        </div>

        {/* League filter */}
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
                  <div className="relative mb-2">
                    {actualRank === 1 && (
                      <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
                        <IconCrown />
                      </div>
                    )}
                    <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${avatarGrad} flex items-center justify-center text-white font-bold text-[14px] border-2 ${actualRank === 1 ? 'border-[#FFD700]/50 w-14 h-14 text-[16px]' : actualRank === 2 ? 'border-[#C0C0C0]/40' : 'border-[#CD7F32]/40'} ${isMe ? 'ring-2 ring-white/30 ring-offset-2 ring-offset-black' : ''}`}>
                      {initials}
                    </div>
                  </div>
                  <div className="text-center mb-1.5">
                    <div className={`text-[12px] font-semibold text-white truncate max-w-[100px] ${isMe ? 'text-white' : ''}`}>
                      {entry.name}
                    </div>
                    <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded ${entryLeague.cssClass}`}>{entryLeague.name}</span>
                  </div>
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
        {!loading && rest.length > 0 && (
          <div className="space-y-1.5">
            {rest.map((entry) => {
              const isMe = entry.id === userId
              const entryLeague = getLeague(entry.league)
              const initials = getInitials(entry.name)
              const avatarGrad = getAvatarColor(entry.name)
              return (
                <div key={entry.id}
                  className={`ios-list-item p-3 flex items-center gap-3 ${isMe ? 'ring-1 ring-white/15' : ''}`}>
                  <span className="text-[13px] font-bold text-white/25 w-6 text-center tabular-nums">{entry.rank}</span>
                  <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${avatarGrad} flex items-center justify-center text-white font-bold text-[12px] shrink-0`}>
                    {initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className={`text-[14px] font-medium truncate ${isMe ? 'text-white' : 'text-white'}`}>{entry.name}</div>
                    <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded ${entryLeague.cssClass}`}>{entryLeague.name}</span>
                  </div>
                  <div className="text-[14px] font-bold text-white/50 tabular-nums">{entry.totalXp}</div>
                </div>
              )
            })}
          </div>
        )}

        {loading && (
          <div className="text-center py-12">
            <div className="w-8 h-8 border-2 border-white/10 border-t-white rounded-full animate-spin mx-auto" />
          </div>
        )}

        {!loading && leaderboard.length === 0 && (
          <div className="text-center py-12">
            <p className="text-[14px] text-white/20">Рейтинг пуст</p>
          </div>
        )}
      </div>
    )
  }

  /* ============================================================
     RENDER: PROFILE
     ============================================================ */
  const renderProfile = () => {
    // School name lookup
    const SCHOOL_NAMES: Record<string, string> = { '11607L': 'Лицей 7' }
    const schoolName = profile?.schoolCode ? (SCHOOL_NAMES[profile.schoolCode] || profile.schoolCode) : null

    // Radar chart data
    const radarValues = DIRECTIONS_PROFILE.map(d => ({
      key: d.key,
      label: d.label,
      color: d.color,
      xp: directionXp[d.key] || 0,
    }))

    return (
    <div className="px-5 pb-6 space-y-5 ios-fade-in">
      <div className="pt-3">
        <h1 className="ios-large-title">Профиль</h1>
      </div>

      {/* Avatar + Name */}
      <div className="flex flex-col items-center">
        <div className={`w-20 h-20 rounded-full bg-gradient-to-br ${getAvatarColor(profile?.name || '')} flex items-center justify-center text-white font-bold text-[28px] mb-3`}>
          {getInitials(profile?.name || '')}
        </div>
        <h2 className="text-[20px] font-bold text-white">{profile?.name}</h2>
        {profile?.username && <p className="text-[14px] text-white/30">@{profile.username}</p>}
        <div className="flex items-center gap-2 mt-2">
          <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg ${userLeague.cssClass}`}>{userLeague.name}</span>
          <span className="text-[12px] text-white/30">Ур. {profile?.level} · {profile?.levelName}</span>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-3 gap-2">
        <GlassCard className="p-4 text-center">
          <div className="text-[20px] font-bold text-white tabular-nums">{profile?.totalXp}</div>
          <div className="text-[10px] text-white/25 mt-0.5">XP</div>
        </GlassCard>
        <GlassCard className="p-4 text-center">
          <div className="text-[20px] font-bold text-white tabular-nums">{achievementCounts.APPROVED}</div>
          <div className="text-[10px] text-white/25 mt-0.5">Одобрено</div>
        </GlassCard>
        <GlassCard className="p-4 text-center">
          <div className="text-[20px] font-bold text-white tabular-nums">{achievementCounts.total}</div>
          <div className="text-[10px] text-white/25 mt-0.5">Всего</div>
        </GlassCard>
      </div>

      {/* О себе — personal info block (always visible) */}
      <div>
        <h3 className="ios-section-header mb-3">О себе</h3>
        <GlassCard className="space-y-3">
          {profile?.fullName ? (
            <div className="flex items-center gap-3">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="8" r="4" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" />
                <path d="M4 20C4 16.6863 7.58172 14 12 14C16.4183 14 20 16.6863 20 20" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              <span className="text-[13px] text-white/70">{profile.fullName}</span>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="8" r="4" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" />
                <path d="M4 20C4 16.6863 7.58172 14 12 14C16.4183 14 20 16.6863 20 20" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              <span className="text-[13px] text-white/20">ФИО не указано</span>
            </div>
          )}
          {profile?.classYear ? (
            <div className="flex items-center gap-3">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <rect x="3" y="5" width="18" height="14" rx="2" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" />
                <path d="M3 10H21" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" />
              </svg>
              <span className="text-[13px] text-white/70">{profile.classYear}{profile.classLetter || ''} класс</span>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <rect x="3" y="5" width="18" height="14" rx="2" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" />
                <path d="M3 10H21" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" />
              </svg>
              <span className="text-[13px] text-white/20">Класс не указан</span>
            </div>
          )}
          {schoolName ? (
            <div className="flex items-center gap-3">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M3 21H21M5 21V7L12 3L19 7V21M9 21V15H15V21" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span className="text-[13px] text-white/70">{schoolName}</span>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M3 21H21M5 21V7L12 3L19 7V21M9 21V15H15V21" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span className="text-[13px] text-white/20">Школа не указана</span>
            </div>
          )}
        </GlassCard>
      </div>

      {/* Radar chart — direction XP */}
      <div>
        <h3 className="ios-section-header mb-3">Направления</h3>
        <GlassCard className="flex justify-center py-4">
          <RadarChart values={radarValues} />
        </GlassCard>
      </div>

      {/* Logout */}
      <button onClick={handleLogout}
        className="w-full glass-card flex items-center justify-center gap-2 py-3 px-4 active:scale-[0.97] ios-spring text-[#FF3B30]">
        <IconLogout />
        <span className="text-[14px] font-semibold">Выйти</span>
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
      <div className="fixed inset-0 z-50 flex items-end justify-center" onClick={() => setShowAddSheet(false)}>
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
        <div className="relative w-full max-w-lg ios-sheet ios-sheet-up safe-area-bottom max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}>
          <div className="p-5">
            <IosSheetHandle />

            <h2 className="text-[18px] font-bold text-white mb-5">Новое достижение</h2>

            <div className="space-y-4">
              {/* Admin: Student selector */}
              {isAdmin && (
                <div className="relative">
                  <label className="text-[12px] font-medium text-white/30 mb-1.5 block uppercase tracking-wider">Ученик</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={selectedStudentId ? students.find(s => s.id === selectedStudentId)?.name || studentSearch : studentSearch}
                      onChange={(e) => {
                        setStudentSearch(e.target.value)
                        setSelectedStudentId(null)
                        setShowStudentDropdown(true)
                      }}
                      onFocus={() => setShowStudentDropdown(true)}
                      onBlur={() => setTimeout(() => setShowStudentDropdown(false), 200)}
                      placeholder="Поиск ученика..."
                      className="glass-input w-full px-4 py-3 text-[15px] text-white placeholder-white/20 bg-transparent focus:ring-0 focus:shadow-none"
                    />
                    {selectedStudentId && (
                      <button
                        onClick={() => { setSelectedStudentId(null); setStudentSearch(''); setShowStudentDropdown(true) }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60"
                      >
                        <IconClose size={14} />
                      </button>
                    )}
                  </div>
                  {showStudentDropdown && !selectedStudentId && (
                    <div className="absolute z-50 left-0 right-0 mt-1 max-h-48 overflow-y-auto glass-card p-1 space-y-0.5">
                      {students
                        .filter(s => !studentSearch || s.name.toLowerCase().includes(studentSearch.toLowerCase()) || (s.username && s.username.toLowerCase().includes(studentSearch.toLowerCase())))
                        .slice(0, 20)
                        .map(s => (
                          <button
                            key={s.id}
                            onClick={() => {
                              setSelectedStudentId(s.id)
                              setStudentSearch(s.name)
                              setShowStudentDropdown(false)
                            }}
                            className="w-full text-left px-3 py-2.5 rounded-lg text-[14px] text-white/70 hover:bg-white/6 transition-colors flex items-center gap-2"
                          >
                            <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${getAvatarColor(s.name)} flex items-center justify-center text-[10px] font-bold text-white shrink-0`}>
                              {getInitials(s.name)}
                            </div>
                            <span>{s.name}</span>
                          </button>
                        ))
                      }
                      {students.filter(s => !studentSearch || s.name.toLowerCase().includes(studentSearch.toLowerCase())).length === 0 && (
                        <div className="px-3 py-3 text-[13px] text-white/25 text-center">Ученики не найдены</div>
                      )}
                    </div>
                  )}
                  {selectedStudentId && (
                    <div className="mt-2 flex items-center gap-2 px-3 py-2 rounded-lg bg-white/8 border border-white/12">
                      <div className={`w-6 h-6 rounded-md bg-gradient-to-br ${getAvatarColor(students.find(s => s.id === selectedStudentId)?.name || '')} flex items-center justify-center text-[9px] font-bold text-white`}>
                        {getInitials(students.find(s => s.id === selectedStudentId)?.name || '')}
                      </div>
                      <span className="text-[13px] text-white font-medium">{students.find(s => s.id === selectedStudentId)?.name}</span>
                      <span className="text-[11px] text-white/25 ml-auto">выбран</span>
                    </div>
                  )}
                </div>
              )}

              {/* Admin: Direction selection */}
              {isAdmin && (
                <div>
                  <label className="text-[12px] font-medium text-white/30 mb-1.5 block uppercase tracking-wider">Направления</label>
                  <div className="flex gap-1.5 flex-wrap">
                    {Object.entries(DIRECTIONS).map(([key, dir]) => (
                      <button key={key}
                        onClick={() => setFormDirections(prev => ({ ...prev, [key]: !prev[key] }))}
                        className={`ios-pill flex items-center gap-1.5 ${formDirections[key] ? 'ios-pill-active' : ''}`}>
                        <span className="w-2 h-2 rounded-full" style={{ background: dir.color }} />
                        {dir.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Title */}
              <div>
                <label className="text-[12px] font-medium text-white/30 mb-1.5 block uppercase tracking-wider">Название</label>
                <input type="text" value={formTitle} onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="Название достижения"
                  className="glass-input w-full px-4 py-3 text-[15px] text-white placeholder-white/20 bg-transparent focus:ring-0 focus:shadow-none" />
              </div>

              {/* Description */}
              <div>
                <label className="text-[12px] font-medium text-white/30 mb-1.5 block uppercase tracking-wider">Описание</label>
                <textarea value={formDesc} onChange={(e) => setFormDesc(e.target.value)}
                  placeholder="Опишите достижение"
                  rows={2}
                  className="glass-input w-full px-4 py-3 text-[15px] text-white placeholder-white/20 bg-transparent focus:ring-0 focus:shadow-none resize-none" />
              </div>

              {/* Achievement type */}
              <div>
                <label className="text-[12px] font-medium text-white/30 mb-1.5 block uppercase tracking-wider">Тип</label>
                <div className="flex gap-1.5 flex-wrap">
                  {Object.entries(ACHIEVEMENT_TYPES).map(([key, val]) => (
                    <button key={key} onClick={() => setFormAchievementType(key as AchievementType)}
                      className={`ios-pill ${formAchievementType === key ? 'ios-pill-active' : ''}`}>
                      {val.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Level + Result */}
              {formAchievementType && (
                <>
                  {/* Level */}
                  <div>
                    <label className="text-[12px] font-medium text-white/30 mb-1.5 block uppercase tracking-wider">Уровень</label>
                    <div className="flex gap-1.5 flex-wrap">
                      {Object.entries(ACHIEVEMENT_LEVELS)
                        .filter(([key]) => formAchievementType !== 'OLYMPIAD' || OLYMPIAD_LEVELS.includes(key as typeof OLYMPIAD_LEVELS[number]))
                        .map(([key, val]) => (
                        <button key={key} onClick={() => setFormLevel(key as AchievementLevel)}
                          className={`ios-pill ${formLevel === key ? 'ios-pill-active' : ''}`}>
                          {val.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Result type toggle */}
                  <div>
                    <label className="text-[12px] font-medium text-white/30 mb-1.5 block uppercase tracking-wider">Результат</label>
                    <div className="ios-segmented flex p-0.5 mb-3">
                      <button onClick={() => setFormResultType('PLACEMENT')}
                        className={`flex-1 py-2 text-[13px] font-semibold rounded-[10px] transition-all ${formResultType === 'PLACEMENT' ? 'ios-segmented-pill text-white' : 'text-white/30'}`}>
                        По месту
                      </button>
                      <button onClick={() => setFormResultType('STATUS')}
                        className={`flex-1 py-2 text-[13px] font-semibold rounded-[10px] transition-all ${formResultType === 'STATUS' ? 'ios-segmented-pill text-white' : 'text-white/30'}`}>
                        По статусу
                      </button>
                    </div>

                    {formResultType === 'PLACEMENT' ? (
                      <div className="flex gap-1.5 flex-wrap">
                        {Object.entries(PLACEMENTS).map(([key, val]) => (
                          <button key={key} onClick={() => setFormPlacement(Number(key))}
                            className={`ios-pill ${formPlacement === Number(key) ? 'ios-pill-active' : ''}`}>
                            {val.label}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="flex gap-1.5 flex-wrap">
                        {Object.entries(RESULT_STATUSES).map(([key, val]) => (
                          <button key={key} onClick={() => setFormResultStatus(key)}
                            className={`ios-pill ${formResultStatus === key ? 'ios-pill-active' : ''}`}>
                            {val.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* XP */}
              <div>
                <label className="text-[12px] font-medium text-white/30 mb-1.5 block uppercase tracking-wider">XP</label>
                <input type="number" value={formXp} onChange={(e) => setFormXp(Math.max(1, Number(e.target.value)))}
                  className="glass-input w-full px-4 py-3 text-[15px] text-white bg-transparent focus:ring-0 focus:shadow-none"
                  min={1} />
              </div>

              {/* Date */}
              <div>
                <label className="text-[12px] font-medium text-white/30 mb-1.5 block uppercase tracking-wider">Дата</label>
                <input type="date" value={formDate} onChange={(e) => setFormDate(e.target.value)}
                  className="glass-input w-full px-4 py-3 text-[15px] text-white bg-transparent focus:ring-0 focus:shadow-none" />
              </div>

              {/* Photo upload */}
              <div>
                <label className="text-[12px] font-medium text-white/30 mb-1.5 block uppercase tracking-wider">Фото диплома</label>
                <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="image/*" className="hidden" />
                {!formFilePreview ? (
                  <button onClick={() => fileInputRef.current?.click()} disabled={uploadingFile}
                    className="glass-card w-full flex items-center justify-center gap-2 py-4 text-white/30 hover:bg-white/6 transition-colors disabled:opacity-50">
                    <IconCamera />
                    <span className="text-[13px] font-medium">{uploadingFile ? 'Загрузка...' : 'Загрузить фото'}</span>
                  </button>
                ) : (
                  <div className="relative glass-card p-2">
                    <img src={formFilePreview} alt="Диплом" className="w-full max-h-40 object-contain rounded-lg" />
                    <button onClick={() => { setFormFileUrl(null); setFormFilePreview(null) }}
                      className="absolute top-3 right-3 w-7 h-7 rounded-full bg-black/60 flex items-center justify-center text-white/60 hover:text-white transition-colors">
                      <IconClose size={12} />
                    </button>
                  </div>
                )}
              </div>

              {/* Comment */}
              <div>
                <label className="text-[12px] font-medium text-white/30 mb-1.5 block uppercase tracking-wider">Комментарий</label>
                <textarea value={formComment} onChange={(e) => setFormComment(e.target.value)}
                  placeholder="Дополнительная информация"
                  rows={2}
                  className="glass-input w-full px-4 py-3 text-[15px] text-white placeholder-white/20 bg-transparent focus:ring-0 focus:shadow-none resize-none" />
              </div>

              {/* Submit */}
              <button onClick={handleAddAchievement} className="ios-button-primary w-full">
                {isAdmin && selectedStudentId && selectedStudentId !== userId ? 'Добавить и одобрить' : 'Отправить на проверку'}
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  /* ============================================================
     RENDER: ACHIEVEMENT DETAIL MODAL
     ============================================================ */
  const renderDetailModal = () => {
    if (!selectedAchievement) return null
    const a = selectedAchievement
    return (
      <div className="fixed inset-0 z-50 flex items-end justify-center" onClick={() => setSelectedAchievement(null)}>
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
        <div className="relative w-full max-w-lg ios-sheet ios-sheet-up safe-area-bottom max-h-[85vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}>
          <div className="p-5">
            <IosSheetHandle />

            <div className="flex items-start gap-3 mb-4">
              <div className="w-11 h-11 rounded-xl bg-white/4 flex items-center justify-center shrink-0">
                <AchievementTypeIcon type={a.achievementType} />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-[18px] font-bold text-white">{a.title}</h2>
                <div className="flex items-center gap-2 mt-1">
                  <StatusDot status={a.status} />
                  {a.achievementLevel && (
                    <span className="text-[11px] text-white/25">
                      {ACHIEVEMENT_LEVELS[a.achievementLevel]?.label}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Photo */}
            {a.fileUrl && (
              <div className="mb-4 glass-card p-2">
                <img src={a.fileUrl} alt="Диплом" className="w-full max-h-48 object-contain rounded-lg" />
              </div>
            )}

            {/* Details */}
            <div className="space-y-2.5">
              {a.description && (
                <div>
                  <div className="ios-section-header text-[9px] mb-1">Описание</div>
                  <p className="text-[14px] text-white/60">{a.description}</p>
                </div>
              )}
              {a.achievementType && (
                <div className="flex justify-between">
                  <span className="text-[12px] text-white/25">Тип</span>
                  <span className="text-[12px] text-white/60">{ACHIEVEMENT_TYPES[a.achievementType]?.label}</span>
                </div>
              )}
              {a.achievementLevel && (
                <div className="flex justify-between">
                  <span className="text-[12px] text-white/25">Уровень</span>
                  <span className="text-[12px] text-white/60">{ACHIEVEMENT_LEVELS[a.achievementLevel]?.label}</span>
                </div>
              )}
              {getResultLabel(a) && (
                <div className="flex justify-between">
                  <span className="text-[12px] text-white/25">Результат</span>
                  <span className="text-[12px] text-white/60">{getResultLabel(a)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-[12px] text-white/25">XP запрошено</span>
                <span className="text-[12px] text-white/60">{a.xpRequested}</span>
              </div>
              {a.status === 'APPROVED' && (
                <div className="flex justify-between">
                  <span className="text-[12px] text-white/25">XP начислено</span>
                  <span className="text-[12px] text-[#34C759] font-semibold">+{a.xpAwarded}</span>
                </div>
              )}
              {a.achievementDate && (
                <div className="flex justify-between">
                  <span className="text-[12px] text-white/25">Дата</span>
                  <span className="text-[12px] text-white/60">{new Date(a.achievementDate).toLocaleDateString('ru-RU')}</span>
                </div>
              )}
              {a.direction && (
                <div className="flex justify-between">
                  <span className="text-[12px] text-white/25">Направление</span>
                  <span className="text-[12px] text-white/60">{a.direction.split(',').map(d => DIRECTIONS[d.trim()]?.label || d.trim()).join(', ')}</span>
                </div>
              )}
              {a.comment && (
                <div>
                  <div className="ios-section-header text-[9px] mb-1">Комментарий</div>
                  <p className="text-[13px] text-white/50">{a.comment}</p>
                </div>
              )}
              {a.reviewComment && (
                <div>
                  <div className="ios-section-header text-[9px] mb-1">Комментарий модератора</div>
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
    if (!showAdmin) return null
    return (
      <div className="fixed inset-0 z-50 flex items-end justify-center" onClick={() => setShowAdmin(false)}>
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
        <div className="relative w-full max-w-lg ios-sheet ios-sheet-up safe-area-bottom max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}>
          <div className="p-5">
            <IosSheetHandle />

            <div className="flex items-center justify-between mb-5">
              <h2 className="text-[18px] font-bold text-white">Модерация</h2>
              {pendingAchievements.length > 0 && (
                <span className="px-2.5 py-1 rounded-full bg-[#FF9F0A]/15 text-[12px] font-bold text-[#FF9F0A]">{pendingAchievements.length}</span>
              )}
            </div>

            {pendingAchievements.length === 0 ? (
              <div className="text-center py-12">
                <IconShield />
                <p className="text-[14px] text-white/20 mt-3">Нет достижений на проверке</p>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingAchievements.map((a) => {
                  const currentRejectReason = adminRejectReasons[a.id] || ''
                  return (
                    <div key={a.id} className="glass-card p-4 space-y-3">
                      {/* Header */}
                      <div className="flex items-start gap-3">
                        <div className="w-9 h-9 rounded-xl bg-white/4 flex items-center justify-center shrink-0">
                          <AchievementTypeIcon type={a.achievementType} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-[14px] font-semibold text-white">{a.title}</div>
                          <div className="text-[12px] text-white/30">
                            {a.user?.name || 'Неизвестный'}
                            {a.achievementLevel && ` · ${ACHIEVEMENT_LEVELS[a.achievementLevel]?.label}`}
                            {getResultLabel(a) && ` · ${getResultLabel(a)}`}
                          </div>
                          <div className="text-[12px] text-white/20">XP запрошено: {a.xpRequested}</div>
                        </div>
                      </div>

                      {/* Photo */}
                      {a.fileUrl && (
                        <div className="glass-card p-1.5">
                          <img src={a.fileUrl} alt="Диплом" className="w-full max-h-32 object-contain rounded-lg" />
                        </div>
                      )}

                      {/* Description */}
                      {a.description && (
                        <p className="text-[13px] text-white/40">{a.description}</p>
                      )}
                      {a.comment && (
                        <p className="text-[13px] text-white/30 italic">«{a.comment}»</p>
                      )}

                      {/* XP to award */}
                      <div>
                        <label className="text-[11px] font-medium text-white/25 mb-1 block uppercase tracking-wider">XP начислить</label>
                        <input type="number" value={adminXp || a.xpRequested}
                          onChange={(e) => setAdminXp(Number(e.target.value))}
                          className="glass-input w-full px-3 py-2 text-[14px] text-white bg-transparent focus:ring-0 focus:shadow-none"
                          min={0} />
                      </div>

                      {/* Directions — multiple selection */}
                      <div>
                        <label className="text-[11px] font-medium text-white/25 mb-1.5 block uppercase tracking-wider">Направления</label>
                        <div className="flex gap-1.5 flex-wrap">
                          {Object.entries(DIRECTIONS).map(([key, dir]) => (
                            <button key={key}
                              onClick={() => setAdminDirections(prev => ({ ...prev, [key]: !prev[key] }))}
                              className={`ios-pill flex items-center gap-1.5 ${adminDirections[key] ? 'ios-pill-active' : ''}`}>
                              <span className="w-2 h-2 rounded-full" style={{ background: dir.color }} />
                              {dir.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Rejection reason */}
                      <div>
                        <label className="text-[11px] font-medium text-white/25 mb-1 block uppercase tracking-wider">Причина отклонения (обязательно)</label>
                        <input type="text" value={currentRejectReason}
                          onChange={(e) => setAdminRejectReasons(prev => ({ ...prev, [a.id]: e.target.value }))}
                          placeholder="Укажите причину отклонения"
                          className="glass-input w-full px-3 py-2 text-[14px] text-white placeholder-white/15 bg-transparent focus:ring-0 focus:shadow-none" />
                      </div>

                      {/* Action buttons */}
                      <div className="flex gap-2">
                        <button onClick={() => {
                          const selectedDirs = Object.entries(adminDirections).filter(([, v]) => v).map(([k]) => k).join(',')
                          handleModerate(a.id, 'approve', adminXp || a.xpRequested, selectedDirs || undefined)
                        }}
                          className="flex-1 py-2.5 rounded-xl bg-[#34C759]/15 text-[#34C759] text-[13px] font-semibold flex items-center justify-center gap-1.5 active:scale-95 ios-spring">
                          <IconCheck /> Одобрить
                        </button>
                        <button onClick={() => {
                          if (!currentRejectReason.trim()) {
                            toast.error('Укажите причину отклонения')
                            return
                          }
                          const selectedDirs = Object.entries(adminDirections).filter(([, v]) => v).map(([k]) => k).join(',')
                          handleModerate(a.id, 'reject', undefined, selectedDirs || undefined, currentRejectReason)
                        }}
                          className="flex-1 py-2.5 rounded-xl bg-[#FF3B30]/15 text-[#FF3B30] text-[13px] font-semibold flex items-center justify-center gap-1.5 active:scale-95 ios-spring">
                          <IconClose size={12} /> Отклонить
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  /* ============================================================
     RENDER: MAIN
     ============================================================ */
  return (
    <div className="min-h-screen relative overflow-hidden bg-black">
      <div className="bg-orb bg-orb-1" />
      <div className="bg-orb bg-orb-2" />
      <div className="bg-orb bg-orb-3" />

      <div className={`relative z-10 max-w-lg mx-auto pb-24 ${isTelegram ? 'pt-safe-top' : ''}`}>
        {currentTab === 'home' && renderHome()}
        {currentTab === 'achievements' && renderAchievements()}
        {currentTab === 'milestones' && renderMilestones()}
        {currentTab === 'rating' && renderRating()}
        {currentTab === 'profile' && renderProfile()}
      </div>

      {/* 5-tab bottom navigation */}
      <div className="fixed bottom-0 left-0 right-0 z-40 glass-nav safe-area-bottom">
        <div className="max-w-lg mx-auto flex">
          {([
            { key: 'home' as Tab, label: 'Главная', Icon: IconHome },
            { key: 'achievements' as Tab, label: 'Ачивки', Icon: IconMilestones },
            { key: 'milestones' as Tab, label: 'Достижения', Icon: IconAchievements },
            { key: 'rating' as Tab, label: 'Рейтинг', Icon: IconTrophy },
            { key: 'profile' as Tab, label: 'Профиль', Icon: IconUser },
          ]).map(({ key, label, Icon }) => (
            <button key={key} onClick={() => setCurrentTab(key)}
              className={`flex-1 flex flex-col items-center gap-0.5 py-2.5 transition-colors ${currentTab === key ? 'text-white' : 'text-white/25'}`}>
              <Icon active={currentTab === key} />
              <span className="text-[9px] font-medium">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {renderAddSheet()}
      {renderDetailModal()}
      {renderAdmin()}
    </div>
  )
}
