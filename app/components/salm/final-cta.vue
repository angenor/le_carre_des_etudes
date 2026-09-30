<script setup lang="ts">
import '~/assets/css/salm.css'
import { formatDate } from '#shared/utils/salm'
import type { SalmPublicEdition } from '#shared/types/salm'

// Appel final et contacts de l'organisateur.
const props = defineProps<{ edition: SalmPublicEdition }>()

const firstDay = computed(() => props.edition.days[0]?.date ?? null)
const studentsOpen = computed(() => props.edition.registration.students.open)
const schoolsOpen = computed(() => props.edition.registration.schools.open)
const phones = computed(() => props.edition.contacts.filter((c) => c.kind === 'phone'))
const emails = computed(() => props.edition.contacts.filter((c) => c.kind === 'email'))
const addresses = computed(() => props.edition.contacts.filter((c) => c.kind === 'address'))

function tel(value: string) {
  return `tel:${value.replace(/[^\d+]/g, '')}`
}
</script>

<template>
  <section class="salm-on-accent salm-final bg-salm-accent px-5 py-14 text-white md:px-12 md:py-20 xl:px-24">
    <!-- Disques du mode clair « Soleil d'Abidjan » (salm.css) : masqués en sombre -->
    <span class="salm-final-deco salm-final-sun" aria-hidden="true" />
    <span class="salm-final-deco salm-final-orange" aria-hidden="true" />
    <span class="salm-final-deco salm-final-ring" aria-hidden="true" />
    <div class="flex flex-col gap-10 lg:flex-row lg:items-center lg:justify-between lg:gap-16">
      <div class="flex max-w-[640px] flex-col gap-[18px] md:gap-5">
        <h2 class="font-salm-title text-[32px] leading-[1.1] font-extrabold tracking-[-0.03em] md:text-[50px] md:leading-[1.06]" data-motion="rise">
          <template v-if="firstDay">Le {{ formatDate(firstDay) }}, ton avenir a rendez-vous.</template>
          <template v-else>Ton avenir a rendez-vous.</template>
        </h2>
        <p v-if="studentsOpen" class="hidden text-lg text-white md:block">Inscris-toi maintenant pour recevoir ton badge d'entrée.</p>
        <div class="flex flex-col gap-3.5 md:mt-2 md:flex-row">
          <NuxtLink
            v-if="studentsOpen"
            to="/salm/inscription-etudiant"
            data-motion="wiggle"
            class="flex h-[54px] items-center justify-center rounded-[14px] bg-white px-[26px] font-salm-title text-base font-bold text-[#9A3A06] transition-colors hover:bg-orange-50 md:h-14"
          >Obtenir mon badge</NuxtLink>
          <NuxtLink
            v-else
            to="/salm/inscription-etudiant"
            data-motion="wiggle"
            class="flex h-[54px] items-center justify-center rounded-[14px] bg-white px-[26px] font-salm-title text-base font-bold text-[#9A3A06] transition-colors hover:bg-orange-50 md:h-14"
          >Récupérer mon badge</NuxtLink>
          <NuxtLink
            v-if="schoolsOpen"
            to="/salm/inscription-ecole"
            class="hidden h-14 items-center justify-center rounded-[14px] border-[1.5px] border-white px-[26px] font-salm-title text-base font-bold text-white transition-colors hover:bg-white/10 md:flex"
          >Inscrire mon école</NuxtLink>
        </div>
      </div>

      <address v-if="edition.contacts.length" class="flex flex-col gap-1.5 text-sm not-italic md:w-[380px] md:gap-4 md:text-base">
        <span class="hidden text-[13px] font-bold tracking-[0.14em] text-white md:block">CONTACT ORGANISATION</span>
        <span v-if="phones.length" class="flex items-center gap-3">
          <svg class="hidden size-[18px] shrink-0 md:block" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z" /></svg>
          <span>
            <template v-for="(p, i) in phones" :key="p.value"><template v-if="i"> · </template><a :href="tel(p.value)" class="text-white underline-offset-2 hover:underline">{{ p.value }}</a></template>
          </span>
        </span>
        <span v-for="e in emails" :key="e.value" class="flex items-center gap-3">
          <svg class="hidden size-[18px] shrink-0 md:block" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="2" y="4" width="20" height="16" rx="2" /><path d="m22 7-10 6L2 7" /></svg>
          <a :href="`mailto:${e.value}`" class="break-all text-white underline-offset-2 hover:underline">{{ e.value }}</a>
        </span>
        <span v-for="a in addresses" :key="a.value" class="hidden items-center gap-3 md:flex">
          <svg class="size-[18px] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 22s-8-7.5-8-13a8 8 0 0 1 16 0c0 5.5-8 13-8 13z" /><circle cx="12" cy="9" r="3" /></svg>
          {{ a.value }}
        </span>
      </address>
    </div>
  </section>
</template>
