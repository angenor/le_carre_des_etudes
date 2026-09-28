import { createError, getQuery, getRouterParam, type H3Event } from 'h3'
import { prisma } from './prisma'
import { formatIvorianPhone } from '#shared/utils/phone'
import { isStudyLevel } from '#shared/utils/study-levels'
import { nameSearchKey, SCHOOL_STATUSES } from '#shared/utils/salm'
import type { Prisma } from '../../app/generated/prisma/client'

// Aides des routes /api/admin/salm/* : identifiants, filtres communs aux listes et aux exports.

export function adminError(statusCode: number, code: string, message = code) {
  return createError({ statusCode, message, data: { code } })
}

/** Paramètre de route entier, sinon `400 INVALID_ID`. */
export function parseIdParam(event: H3Event, name: string): number {
  const raw = getRouterParam(event, name) ?? ''
  const id = Number(raw)
  if (!/^\d+$/.test(raw) || !Number.isSafeInteger(id) || id < 1) throw adminError(400, 'INVALID_ID')
  return id
}

export function parsePagination(event: H3Event) {
  const query = getQuery(event)
  const page = Math.max(1, Math.floor(Number(query.page)) || 1)
  const limit = Math.min(100, Math.max(1, Math.floor(Number(query.limit)) || 20))
  return { page, limit, skip: (page - 1) * limit }
}

function searchParam(event: H3Event): string {
  const raw = getQuery(event).search
  return typeof raw === 'string' ? raw.trim().slice(0, 100) : ''
}

/** Filtre de présence `present:<dayId>` ou `absent:<dayId>` (008, FR-226), sinon `null`. */
export function presenceParam(event: H3Event): { present: boolean; dayId: number } | null {
  const raw = getQuery(event).presence
  const match = typeof raw === 'string' ? /^(present|absent):(\d{1,9})$/.exec(raw) : null
  return match ? { present: match[1] === 'present', dayId: Number(match[2]) } : null
}

/**
 * Filtres de la liste étudiante : recherche (téléphone ou nom sans accents), niveau (FR-062)
 * et présence un jour donné (008, FR-226), ignorée si le jour n'est pas dans `dayIds` (jours de l'édition).
 */
export function studentWhere(event: H3Event, editionId: number, dayIds: number[] = []): Prisma.SalmStudentRegistrationWhereInput {
  const where: Prisma.SalmStudentRegistrationWhereInput = { editionId }
  const search = searchParam(event)
  if (search) {
    const digits = search.replace(/[\s+.\-]/g, '')
    if (/^\d+$/.test(digits)) {
      where.phone = { contains: digits.startsWith('225') && digits.length > 3 ? digits.slice(3) : digits }
    }
    else {
      const key = nameSearchKey(search)
      if (key) where.nameSearch = { contains: key }
    }
  }
  const level = getQuery(event).studyLevel
  if (isStudyLevel(level)) where.studyLevel = level
  const presence = presenceParam(event)
  if (presence && dayIds.includes(presence.dayId)) {
    where.entries = presence.present ? { some: { dayId: presence.dayId } } : { none: { dayId: presence.dayId } }
  }
  return where
}

export function studentOrderBy(event: H3Event): Prisma.SalmStudentRegistrationOrderByWithRelationInput[] {
  const query = getQuery(event)
  const order = query.sortOrder === 'asc' ? 'asc' : 'desc'
  const field = ['createdAt', 'fullName', 'badgeSeq'].includes(String(query.sortBy)) ? String(query.sortBy) : 'createdAt'
  return [{ [field]: order }, { id: order }]
}

/** Filtres de la liste des établissements : statut et recherche (nom ou e-mail) (FR-066). */
export function schoolWhere(event: H3Event, editionId: number): Prisma.SalmSchoolRegistrationWhereInput {
  const where: Prisma.SalmSchoolRegistrationWhereInput = { editionId }
  const status = getQuery(event).status
  if ((SCHOOL_STATUSES as readonly unknown[]).includes(status)) where.status = status as string
  const search = searchParam(event)
  if (search) where.OR = [{ name: { contains: search } }, { email: { contains: search.toLowerCase() } }]
  return where
}

export function schoolOrderBy(event: H3Event): Prisma.SalmSchoolRegistrationOrderByWithRelationInput[] {
  const query = getQuery(event)
  const order = query.sortOrder === 'asc' ? 'asc' : 'desc'
  const field = query.sortBy === 'name' ? 'name' : 'createdAt'
  return [{ [field]: order }, { id: order }]
}

export function exhibitorsOf(value: unknown): { fullName: string; contact: string }[] {
  return Array.isArray(value) ? (value as { fullName: string; contact: string }[]) : []
}

export function programmesOf(value: unknown): string[] {
  return Array.isArray(value) ? (value as string[]) : []
}

/** Fiche complète d'un établissement (admin-api.md), partagée par GET et PATCH. */
export async function getSchoolDetail(id: number) {
  const r = await prisma.salmSchoolRegistration.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      phone: true,
      email: true,
      programmes: true,
      otherProgramme: true,
      exhibitors: true,
      question: true,
      status: true,
      internalNote: true,
      createdAt: true,
      updatedAt: true,
      edition: { select: { year: true } },
      standType: { select: { id: true, name: true, isVisible: true } },
    },
  })
  if (!r) return null
  return {
    id: r.id,
    editionYear: r.edition.year,
    name: r.name,
    phone: formatIvorianPhone(r.phone),
    email: r.email,
    programmes: programmesOf(r.programmes),
    otherProgramme: r.otherProgramme,
    exhibitors: exhibitorsOf(r.exhibitors).map((e) => ({ fullName: e.fullName, contact: formatIvorianPhone(e.contact) })),
    stand: r.standType,
    question: r.question,
    status: r.status,
    internalNote: r.internalNote,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  }
}
