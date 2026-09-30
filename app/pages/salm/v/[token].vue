<script setup lang="ts">
import '~/assets/css/salm.css'
import { formatDayLong, formatHour, venueLabel } from '#shared/utils/salm'
import type { SalmControlLookup, SalmEditionResponse } from '#shared/types/salm'

// Page ouverte par le QR code d'un badge (specs/008, R12, FR-222) : pour un visiteur, le rendu ne dépend
// que de l'édition publiée, jamais du jeton. La validité n'est montrée qu'à un admin connecté (FR-223).
const route = useRoute()
const { data } = await useFetch<SalmEditionResponse>('/api/salm/edition', { key: 'salm-badge-page-edition' })
const edition = computed(() => data.value?.edition ?? null)

function capitalize(text: string): string {
  return text.charAt(0).toLocaleUpperCase('fr-FR') + text.slice(1)
}

// ---- Encart administrateur, après hydratation uniquement ----

const admin = ref<{ state: 'loading' } | { state: 'done'; lookup: SalmControlLookup } | { state: 'error'; message: string } | null>(null)
const token = computed(() => String(route.params.token ?? ''))

onMounted(async () => {
  if (!(await useAdmin().checkSession())) return
  admin.value = { state: 'loading' }
  try {
    const lookup = await $fetch<SalmControlLookup>('/api/admin/salm/control/lookup', { query: { token: token.value } })
    admin.value = { state: 'done', lookup }
  }
  catch (error) {
    const code = requestErrorCode(error)
    admin.value = { state: 'error', message: code === 'NO_PUBLISHED_EDITION' ? 'Aucune édition SALM publiée.' : 'Vérification impossible : réessayez.' }
  }
})

useHead({ meta: [{ name: 'robots', content: 'noindex, nofollow' }] })
useSeoMeta({ title: 'Badge SALM · Le Carré des Études' })
</script>

<template>
  <div class="salm-scope flex min-h-[80vh] items-center justify-center bg-salm-bg px-5 pt-28 pb-16 font-salm-body text-salm-ink">
    <div class="flex w-full max-w-md flex-col items-center gap-5 rounded-3xl border border-salm-border bg-salm-surface-2 p-8 text-center">
      <template v-if="edition">
        <h1 class="font-salm-title text-2xl font-extrabold tracking-[-0.02em]">Ce QR code est un badge du SALM {{ edition.year }}</h1>
        <p class="text-base leading-relaxed text-salm-ink-soft">Présentez-le à l'entrée.</p>
        <ul v-if="edition.days.length" class="flex flex-col gap-1.5 text-sm text-salm-ink-soft">
          <li v-for="day in edition.days" :key="day.date">
            {{ capitalize(formatDayLong(day.date)) }} · {{ formatHour(day.opensAt) }} – {{ formatHour(day.closesAt) }}
          </li>
        </ul>
        <p class="text-sm text-salm-ink-muted">{{ venueLabel(edition.venue, edition.city) }}</p>
        <NuxtLink to="/salm" class="text-sm font-semibold text-salm-accent-text hover:text-salm-accent-soft">Découvrir le SALM {{ edition.year }}</NuxtLink>
      </template>
      <template v-else>
        <h1 class="font-salm-title text-2xl font-extrabold tracking-[-0.02em]">La prochaine édition du SALM sera bientôt annoncée</h1>
        <NuxtLink to="/salm" class="text-sm font-semibold text-salm-accent-text hover:text-salm-accent-soft">Découvrir le SALM</NuxtLink>
      </template>

      <!-- Administrateur connecté : validité du badge, jamais dans le HTML rendu par le serveur -->
      <section v-if="admin" class="mt-2 w-full rounded-2xl border border-ink/15 bg-salm-overlay p-5 text-left text-salm-ink" aria-live="polite">
        <p class="text-xs font-semibold tracking-wider text-salm-ink-muted uppercase">Administration</p>
        <p v-if="admin.state === 'loading'" class="mt-2 text-sm text-salm-ink-soft">Vérification du badge…</p>
        <p v-else-if="admin.state === 'error'" class="mt-2 text-sm text-salm-ink-soft">{{ admin.message }}</p>
        <template v-else-if="admin.lookup.validity === 'valid' && admin.lookup.person">
          <p class="mt-2 font-semibold text-salm-ok">Badge valide</p>
          <p class="mt-1 text-lg font-bold">{{ admin.lookup.person.fullName }}</p>
          <p class="text-sm text-salm-ink-muted">{{ admin.lookup.person.studyLevel }} · {{ admin.lookup.person.badgeNumber }}</p>
          <NuxtLink
            :to="{ path: '/admin/salm/controle', query: { token } }"
            class="mt-4 inline-flex h-12 items-center justify-center rounded-xl bg-white px-5 font-bold text-stone-950 hover:bg-stone-200"
          >
            Contrôler ce badge
          </NuxtLink>
        </template>
        <p v-else-if="admin.lookup.validity === 'other_edition'" class="mt-2 font-semibold text-salm-error">
          Badge d'une autre édition (SALM {{ admin.lookup.otherEditionYear }})
        </p>
        <p v-else class="mt-2 font-semibold text-salm-error">Badge invalide</p>
      </section>
    </div>
  </div>
</template>
