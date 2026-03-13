import { defineEventHandler, getQuery } from 'h3'
import { prisma } from '../../utils/prisma'

const VALID_SORT_FIELDS = ['fullName', 'contact', 'studyLevel', 'createdAt'] as const
type SortField = (typeof VALID_SORT_FIELDS)[number]

export default defineEventHandler(async (event) => {
  const query = getQuery(event)

  const page = Math.max(1, Number(query.page) || 1)
  const limit = Math.min(100, Math.max(1, Number(query.limit) || 20))
  const search = typeof query.search === 'string' ? query.search.trim() : ''
  const sortBy: SortField = VALID_SORT_FIELDS.includes(query.sortBy as SortField)
    ? (query.sortBy as SortField)
    : 'createdAt'
  const sortOrder = query.sortOrder === 'asc' ? 'asc' : 'desc'

  const where = search
    ? {
        OR: [
          { fullName: { contains: search } },
          { contact: { contains: search } },
        ],
      }
    : {}

  const [data, total] = await Promise.all([
    prisma.download.findMany({
      where,
      include: { magazine: { select: { id: true, name: true } } },
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.download.count({ where }),
  ])

  return { data, total, page, limit }
})
