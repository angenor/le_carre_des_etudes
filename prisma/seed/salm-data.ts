// Contenus des éditions SALM, repris de documentations/brouillons/ et de la maquette
// (documentations/SALM/maquette/page-desktop.dc.html). Jusqu'à la feature B (administration
// des contenus), modifier ce fichier puis relancer `pnpm prisma db seed` (ou `./deploy.sh seed`).

export interface SeedSlot {
  startTime: string
  endTime: string
  title: string
  description?: string
  kind: 'ceremonie' | 'panel' | 'presentation' | 'stands' | 'pause' | 'exposition'
  isHighlighted?: boolean
}

export interface SeedDay {
  date: string
  label: string
  opensAt: string
  closesAt: string
  slots: SeedSlot[]
}

export interface SeedEdition {
  year: number
  /** Statut à la création uniquement : jamais écrasé par un nouveau seed. */
  initialStatus: 'draft' | 'published' | 'archived'
  /** Interrupteurs à la création uniquement : jamais écrasés par un nouveau seed. */
  initialRegistrationOpen: boolean
  content: {
    organizerName: string
    tagline?: string | null
    venue?: string | null
    whyTitle?: string | null
    whyText?: string | null
    audiences?: { title: string; text: string }[]
    contacts?: { kind: 'phone' | 'email' | 'address'; value: string; onBadge?: boolean }[]
    posterPath?: string | null
    posterAlt?: string | null
    recapVideoUrl?: string | null
    recapPosterPath?: string | null
    programPdfPath?: string | null
  }
  days: SeedDay[]
  highlights: { title: string; imagePath: string; imageAlt: string }[]
  videos: { youtubeUrl: string; title?: string; guest?: string; institution?: string; thumbnailPath?: string }[]
  photos: { imagePath: string; alt: string; caption?: string }[]
  standTypes: { name: string; description?: string | null; priceLabel?: string | null }[]
}

const ORGANIZER = 'Sucrey Corporates Consulting'

export const salmEditions: SeedEdition[] = [
  {
    year: 2026,
    initialStatus: 'archived',
    initialRegistrationOpen: false,
    content: {
      organizerName: ORGANIZER,
      recapPosterPath: '/images/salm/2026/panel.jpg',
      // TODO URL fournies par l'organisateur : vidéo récapitulative du SALM 2026
      recapVideoUrl: null,
    },
    days: [],
    highlights: [],
    // TODO URL fournies par l'organisateur : les 9 vidéos du « canapé du SALM 2026 »
    // Exemple : { youtubeUrl: 'https://youtu.be/XXXXXXXXXXX', title: '…', guest: '…', institution: '…' }
    videos: [],
    photos: [
      { imagePath: '/images/salm/2026/stands.jpg', alt: 'Stands du SALM 2026' },
      { imagePath: '/images/salm/2026/panel.jpg', alt: 'Salle pleine pendant un panel' },
      { imagePath: '/images/salm/2026/conference.jpg', alt: 'Intervenant en conférence' },
      { imagePath: '/images/salm/2026/lancement.jpg', alt: "Discours d'ouverture" },
      { imagePath: '/images/salm/2026/reseautage.jpg', alt: 'Étudiante au SALM 2026' },
    ],
    standTypes: [],
  },
  {
    year: 2027,
    initialStatus: 'published',
    initialRegistrationOpen: true,
    content: {
      organizerName: ORGANIZER,
      tagline: "L'avenir se choisit maintenant !",
      venue: null,
      whyTitle: 'Le premier salon ivoirien dédié aux Licences, Masters et professionnels',
      whyText:
        "Le Salon des Licences et Masters de Côte d'Ivoire s'adresse à celles et ceux qui souhaitent s'orienter vers une formation continue ou se reconvertir vers une autre filière. Son objectif : rapprocher les universités des étudiants, pour leur présenter les dernières innovations en matière de formation, d'opportunités d'études et de débouchés.",
      audiences: [
        { title: 'Licencié·e·s', text: 'Trouver le Master qui prolonge votre parcours' },
        { title: 'Professionnel·le·s', text: 'Reprendre une formation continue' },
        { title: 'En reconversion', text: 'Changer de filière en connaissance de cause' },
      ],
      contacts: [
        { kind: 'phone', value: '+225 27 35 966 789' },
        { kind: 'phone', value: '+225 07 68 011 409', onBadge: true },
        // Adresse reprise des documents 2027 (incohérence signalée dans la spec)
        { kind: 'email', value: 'salm2026@sucreycorporates.com' },
        { kind: 'address', value: 'Abidjan Cocody, Riviera Palmeraie' },
      ],
      posterPath: '/images/salm/2027/affiche.jpg',
      posterAlt: 'Affiche du SALM 2027 : une diplômée en toge',
      programPdfPath: null,
    },
    days: [
      {
        date: '2027-03-12',
        label: 'Jour 1',
        opensAt: '09:30',
        closesAt: '16:00',
        slots: [
          {
            startTime: '09:30', endTime: '10:00', kind: 'ceremonie',
            title: "Cérémonie d'ouverture",
            description: 'Ouverture par le Commissaire Général · Allocution des officiels',
          },
          {
            startTime: '10:00', endTime: '11:00', kind: 'panel',
            title: 'PANEL 1',
            description: "« Former pour l'emploi : quelles compétences pour répondre aux métiers de demain ? »",
          },
          {
            startTime: '11:00', endTime: '11:10', kind: 'presentation',
            title: 'Présentation du magazine Le Carré des Études',
            isHighlighted: true,
          },
          { startTime: '11:10', endTime: '13:00', kind: 'stands', title: 'Ouverture des stands' },
          { startTime: '13:00', endTime: '14:00', kind: 'pause', title: 'Pause' },
          {
            startTime: '14:00', endTime: '14:30', kind: 'panel',
            title: 'PANEL 2',
            description: "« L'IA transforme les métiers : comment repenser les formations et préparer les talents de demain ? »",
          },
          // Chevauchement avec le Panel 2, tel que dans le chronogramme source (spec, incohérence 1)
          { startTime: '14:00', endTime: '16:00', kind: 'exposition', title: 'Exposition' },
        ],
      },
      {
        date: '2027-03-13',
        label: 'Jour 2',
        opensAt: '09:30',
        closesAt: '16:30',
        slots: [
          {
            startTime: '09:30', endTime: '10:00', kind: 'presentation',
            title: "Présentation des universités exposantes et procédure d'admission",
          },
          // Trou de 10h00 à 10h10, tel que dans le chronogramme source (spec, incohérence 2)
          { startTime: '10:10', endTime: '13:00', kind: 'exposition', title: 'Exposition' },
          { startTime: '13:00', endTime: '14:00', kind: 'pause', title: 'Pause' },
          { startTime: '14:00', endTime: '16:00', kind: 'exposition', title: 'Exposition' },
          { startTime: '16:00', endTime: '16:30', kind: 'ceremonie', title: 'Cérémonie de clôture' },
        ],
      },
    ],
    highlights: [
      { title: 'LANCEMENT OFFICIEL', imagePath: '/images/salm/2027/lancement.jpg', imageAlt: 'Lancement officiel du SALM 2026' },
      { title: 'CONFÉRENCE', imagePath: '/images/salm/2027/conference.jpg', imageAlt: 'Conférence au SALM 2026' },
      { title: 'VISITE DE STANDS', imagePath: '/images/salm/2027/stands.jpg', imageAlt: 'Visite des stands au SALM 2026' },
      { title: 'PANEL', imagePath: '/images/salm/2027/panel.jpg', imageAlt: 'Panel devant les étudiants' },
      { title: 'RÉSEAUTAGE & PARTENARIAT', imagePath: '/images/salm/2027/reseautage.jpg', imageAlt: 'Étudiante au SALM' },
    ],
    videos: [],
    photos: [],
    // Description et tarif à compléter par l'organisateur
    standTypes: [
      { name: 'STAND OR' },
      { name: 'STAND DIAMANT' },
      { name: 'STAND PREMIUM' },
    ],
  },
]
