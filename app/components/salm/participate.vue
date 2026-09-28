<script setup lang="ts">
import '~/assets/css/salm.css'
import type { SalmPublicEdition } from '#shared/types/salm'

// « Deux façons de participer » (maquettes desktop et mobile ; FR-051 pour les états fermés).
const props = defineProps<{ edition: SalmPublicEdition }>()

const studentsOpen = computed(() => props.edition.registration.students.open)
const schoolsOpen = computed(() => props.edition.registration.schools.open)

// « Or, Diamant ou Premium », dérivé des types de stand visibles
const standList = computed(() => {
  const names = props.edition.standTypes.map((s) => {
    const short = s.name.replace(/^stand\s+/i, '').toLocaleLowerCase('fr-FR')
    return short.charAt(0).toLocaleUpperCase('fr-FR') + short.slice(1)
  })
  if (names.length <= 1) return names[0] ?? ''
  return `${names.slice(0, -1).join(', ')} ou ${names.at(-1)}`
})
</script>

<template>
  <section id="participer" class="scroll-mt-24 px-5 py-16 md:px-12 md:py-[100px] xl:px-24">
    <div class="flex flex-col gap-7 md:gap-12">
      <div class="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div class="flex flex-col gap-2.5 md:gap-3.5">
          <span v-if="studentsOpen || schoolsOpen" class="font-salm-title text-xs font-bold tracking-[0.16em] text-salm-accent-text md:text-[13px]">INSCRIPTIONS OUVERTES</span>
          <h2 class="font-salm-title text-[32px] leading-[1.08] font-extrabold tracking-[-0.03em] text-[#F5F3EF] md:text-5xl md:leading-[1.05]">Deux façons de participer</h2>
        </div>
        <p class="hidden max-w-[440px] text-[17px] leading-[1.55] text-stone-400 md:block">
          Les étudiant·e·s reçoivent un badge d'entrée nominatif. Les établissements confirment simplement leur présence : aucun badge à télécharger.
        </p>
      </div>

      <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <!-- Étudiant·e -->
        <article class="salm-on-accent relative flex flex-col gap-4 overflow-hidden rounded-3xl bg-salm-accent px-6 py-7 text-white md:min-h-[600px] md:gap-[22px] md:rounded-[28px] md:p-11">
          <span class="self-start rounded-full bg-black/22 px-3 py-1.5 text-xs font-bold tracking-[0.08em] md:px-3.5 md:py-[7px] md:text-[13px]">ÉTUDIANT·E</span>
          <h3 class="font-salm-title text-2xl leading-[1.15] font-extrabold tracking-[-0.02em] md:max-w-[360px] md:text-[32px] md:leading-[1.12]">Réserve ta place, reçois ton badge d'entrée</h3>
          <p class="text-[15px] leading-[1.55] text-white md:hidden">Nom, téléphone, niveau d'étude : c'est tout. Ton badge nominatif avec QR code se télécharge aussitôt.</p>
          <p class="hidden max-w-[360px] text-base leading-[1.55] text-white md:block">Trois informations suffisent. Ton badge nominatif avec QR code se télécharge aussitôt.</p>
          <ol class="hidden max-w-[360px] flex-col gap-3 text-[15px] md:flex">
            <li v-for="(step, i) in ['Ton nom et ton numéro de téléphone', 'Ton niveau d\'étude', 'Ton badge, prêt à présenter à l\'entrée']" :key="i" class="flex items-center gap-3.5">
              <span class="flex size-8 shrink-0 items-center justify-center rounded-full bg-white font-extrabold text-[#9A3A06]">{{ i + 1 }}</span>
              {{ step }}
            </li>
          </ol>
          <NuxtLink
            v-if="studentsOpen"
            to="/salm/inscription-etudiant"
            class="flex h-[52px] items-center justify-center gap-3 rounded-[14px] bg-white px-[26px] font-salm-title text-base font-bold text-[#9A3A06] transition-colors hover:bg-orange-50 md:mt-auto md:h-14 md:self-start"
          >
            Obtenir mon badge
            <svg class="hidden size-[18px] md:block" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
          </NuxtLink>
          <div v-else class="flex flex-col gap-1 rounded-[14px] bg-black/20 px-5 py-3.5 md:mt-auto md:self-start">
            <span class="font-salm-title text-base font-bold">Inscriptions étudiantes closes</span>
            <NuxtLink to="/salm/inscription-etudiant" class="text-sm font-semibold text-white underline underline-offset-2 hover:no-underline">Récupérer mon badge</NuxtLink>
          </div>
          <div class="pointer-events-none absolute top-[92px] -right-6 hidden rotate-[8deg] xl:block">
            <SalmBadgeCard
              variant="light"
              :year="edition.year"
              :salon-name="edition.salonName"
              full-name="Kouassi Aya Marie"
              study-level="Licence (Bac+3)"
            />
          </div>
        </article>

        <!-- Établissement -->
        <article class="flex flex-col gap-4 rounded-3xl border border-salm-border bg-salm-surface-2 px-6 py-7 md:min-h-[600px] md:gap-[22px] md:rounded-[28px] md:p-11">
          <span class="self-start rounded-full bg-[#24242B] px-3 py-1.5 text-xs font-bold tracking-[0.08em] text-salm-accent-text md:px-3.5 md:py-[7px] md:text-[13px]">UNIVERSITÉ · GRANDE ÉCOLE</span>
          <h3 class="font-salm-title text-2xl leading-[1.15] font-extrabold tracking-[-0.02em] text-[#F5F3EF] md:text-[32px] md:leading-[1.12]">Confirmez la présence de votre établissement</h3>
          <p class="text-[15px] leading-[1.55] text-stone-400 md:hidden">
            Pas de badge pour les écoles : l'inscription confirme votre participation, vos exposants et votre stand<template v-if="standList"> ({{ standList }})</template>.
          </p>
          <p class="hidden text-base leading-[1.55] text-stone-400 md:block">
            Pas de badge pour les écoles : l'inscription sert uniquement à confirmer votre participation, vos exposants et votre stand. L'équipe SALM vous recontacte pour finaliser.
          </p>
          <ol class="hidden flex-col gap-3 text-[15px] text-stone-200 md:flex">
            <li class="flex items-center gap-3.5">
              <span class="flex size-8 shrink-0 items-center justify-center rounded-full border-[1.5px] border-salm-accent-text font-extrabold text-salm-accent-text">1</span>
              Votre établissement et vos programmes
            </li>
            <li class="flex items-center gap-3.5">
              <span class="flex size-8 shrink-0 items-center justify-center rounded-full border-[1.5px] border-salm-accent-text font-extrabold text-salm-accent-text">2</span>
              Vos exposants et votre stand<template v-if="standList"> : {{ standList }}</template>
            </li>
            <li class="flex items-center gap-3.5">
              <span class="flex size-8 shrink-0 items-center justify-center rounded-full border-[1.5px] border-salm-accent-text font-extrabold text-salm-accent-text">3</span>
              Présence confirmée, c'est tout
            </li>
          </ol>
          <NuxtLink
            v-if="schoolsOpen"
            to="/salm/inscription-ecole"
            class="flex h-[52px] items-center justify-center gap-3 rounded-[14px] border-[1.5px] border-salm-accent-text px-[26px] font-salm-title text-base font-bold text-salm-accent-text transition-colors hover:bg-salm-accent-text/10 md:mt-auto md:h-14 md:self-start"
          >
            Confirmer notre présence
            <svg class="hidden size-[18px] md:block" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
          </NuxtLink>
          <p v-else class="rounded-[14px] border border-salm-border px-5 py-3.5 font-salm-title text-base font-bold text-stone-300 md:mt-auto md:self-start">
            Inscriptions des établissements closes
          </p>
        </article>
      </div>
    </div>
  </section>
</template>
