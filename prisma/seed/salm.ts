import { prisma } from '../../server/utils/prisma'
import { salmEditions, type SeedEdition } from './salm-data'

// Seed du module SALM en création seule (specs/007-salm-admin-contenus, research R12).
// - Une édition du jeu initial n'est créée que si son année est absente, avec tout son contenu
//   (jours, créneaux, temps forts, vidéos, photos, types de stand).
// - Une édition existante n'est jamais réécrite : son contenu se gère dans le back-office.

async function createEdition(data: SeedEdition) {
  const c = data.content
  await prisma.salmEdition.create({
    data: {
      year: data.year,
      status: data.initialStatus,
      studentRegistrationOpen: data.initialRegistrationOpen,
      schoolRegistrationOpen: data.initialRegistrationOpen,
      organizerName: c.organizerName,
      tagline: c.tagline ?? null,
      venue: c.venue ?? null,
      whyTitle: c.whyTitle ?? null,
      whyText: c.whyText ?? null,
      audiences: c.audiences ?? [],
      contacts: c.contacts ?? [],
      posterPath: c.posterPath ?? null,
      posterAlt: c.posterAlt ?? null,
      recapVideoUrl: c.recapVideoUrl ?? null,
      recapPosterPath: c.recapPosterPath ?? null,
      programPdfPath: c.programPdfPath ?? null,
      days: {
        create: data.days.map((day, index) => ({
          date: day.date,
          label: day.label,
          opensAt: day.opensAt,
          closesAt: day.closesAt,
          sortOrder: index,
          slots: {
            create: day.slots.map((slot, sortOrder) => ({
              startTime: slot.startTime,
              endTime: slot.endTime,
              title: slot.title,
              description: slot.description ?? null,
              kind: slot.kind,
              isHighlighted: slot.isHighlighted ?? false,
              sortOrder,
            })),
          },
        })),
      },
      highlights: { create: data.highlights.map((h, sortOrder) => ({ ...h, sortOrder })) },
      videos: {
        create: data.videos.map((v, sortOrder) => ({
          youtubeUrl: v.youtubeUrl,
          title: v.title ?? null,
          guest: v.guest ?? null,
          institution: v.institution ?? null,
          thumbnailPath: v.thumbnailPath ?? null,
          sortOrder,
        })),
      },
      photos: {
        create: data.photos.map((p, sortOrder) => ({
          imagePath: p.imagePath,
          alt: p.alt,
          caption: p.caption ?? null,
          sortOrder,
        })),
      },
      standTypes: {
        create: data.standTypes.map((s, sortOrder) => ({
          name: s.name,
          description: s.description ?? null,
          priceLabel: s.priceLabel ?? null,
          sortOrder,
        })),
      },
    },
  })

  return {
    year: data.year,
    status: data.initialStatus,
    days: data.days.length,
    slots: data.days.reduce((n, d) => n + d.slots.length, 0),
    highlights: data.highlights.length,
    videos: data.videos.length,
    photos: data.photos.length,
    standTypes: data.standTypes.length,
  }
}

/** Crée les éditions absentes et renvoie le résumé des éditions créées. */
export async function seedSalm() {
  const created = []
  for (const edition of salmEditions) {
    const existing = await prisma.salmEdition.findUnique({ where: { year: edition.year }, select: { id: true } })
    if (existing) {
      console.log(`SALM ${edition.year} déjà présent : ignoré (contenu géré dans le back-office)`)
      continue
    }
    created.push(await createEdition(edition))
  }
  return created
}
