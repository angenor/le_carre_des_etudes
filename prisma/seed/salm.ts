import { prisma } from '../../server/utils/prisma'
import { salmEditions, type SeedEdition } from './salm-data'

// Seed idempotent du module SALM (research R8).
// - Éditions : upsert par année. À la mise à jour, seuls les champs de contenu sont réécrits :
//   jamais le statut, les interrupteurs, lastBadgeSeq, personalDataPurgedAt ni purgedStats.
// - Jours : upsert par (édition, date) ; les jours absents des données sont supprimés.
// - Créneaux, temps forts, vidéos, photos : supprimés puis recréés.
// - Types de stand : upsert par (édition, nom), jamais supprimés (clé étrangère Restrict), visibilité conservée.
// - Inscriptions : jamais touchées.

function contentFields(edition: SeedEdition) {
  const c = edition.content
  return {
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
  }
}

async function seedEdition(data: SeedEdition) {
  const content = contentFields(data)
  const edition = await prisma.salmEdition.upsert({
    where: { year: data.year },
    create: {
      year: data.year,
      status: data.initialStatus,
      studentRegistrationOpen: data.initialRegistrationOpen,
      schoolRegistrationOpen: data.initialRegistrationOpen,
      ...content,
    },
    update: content,
    select: { id: true, status: true },
  })

  // Jours et créneaux
  await prisma.salmDay.deleteMany({
    where: { editionId: edition.id, date: { notIn: data.days.map((d) => d.date) } },
  })
  for (const [index, day] of data.days.entries()) {
    const { id: dayId } = await prisma.salmDay.upsert({
      where: { editionId_date: { editionId: edition.id, date: day.date } },
      create: {
        editionId: edition.id,
        date: day.date,
        label: day.label,
        opensAt: day.opensAt,
        closesAt: day.closesAt,
        sortOrder: index,
      },
      update: { label: day.label, opensAt: day.opensAt, closesAt: day.closesAt, sortOrder: index },
      select: { id: true },
    })
    await prisma.salmSlot.deleteMany({ where: { dayId } })
    await prisma.salmSlot.createMany({
      data: day.slots.map((slot, sortOrder) => ({
        dayId,
        startTime: slot.startTime,
        endTime: slot.endTime,
        title: slot.title,
        description: slot.description ?? null,
        kind: slot.kind,
        isHighlighted: slot.isHighlighted ?? false,
        sortOrder,
      })),
    })
  }

  // Médias et temps forts
  await prisma.salmHighlight.deleteMany({ where: { editionId: edition.id } })
  await prisma.salmHighlight.createMany({
    data: data.highlights.map((h, sortOrder) => ({ editionId: edition.id, ...h, sortOrder })),
  })
  await prisma.salmVideo.deleteMany({ where: { editionId: edition.id } })
  await prisma.salmVideo.createMany({
    data: data.videos.map((v, sortOrder) => ({
      editionId: edition.id,
      youtubeUrl: v.youtubeUrl,
      title: v.title ?? null,
      guest: v.guest ?? null,
      institution: v.institution ?? null,
      thumbnailPath: v.thumbnailPath ?? null,
      sortOrder,
    })),
  })
  await prisma.salmPhoto.deleteMany({ where: { editionId: edition.id } })
  await prisma.salmPhoto.createMany({
    data: data.photos.map((p, sortOrder) => ({
      editionId: edition.id,
      imagePath: p.imagePath,
      alt: p.alt,
      caption: p.caption ?? null,
      sortOrder,
    })),
  })

  // Types de stand
  for (const [sortOrder, stand] of data.standTypes.entries()) {
    const fields = { description: stand.description ?? null, priceLabel: stand.priceLabel ?? null, sortOrder }
    await prisma.salmStandType.upsert({
      where: { editionId_name: { editionId: edition.id, name: stand.name } },
      create: { editionId: edition.id, name: stand.name, ...fields },
      update: fields,
    })
  }

  return {
    year: data.year,
    status: edition.status,
    days: data.days.length,
    slots: data.days.reduce((n, d) => n + d.slots.length, 0),
    highlights: data.highlights.length,
    videos: data.videos.length,
    photos: data.photos.length,
    standTypes: data.standTypes.length,
  }
}

export async function seedSalm() {
  const summary = []
  for (const edition of salmEditions) {
    summary.push(await seedEdition(edition))
  }
  return summary
}
