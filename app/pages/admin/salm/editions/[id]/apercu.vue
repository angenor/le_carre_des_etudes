<script setup lang="ts">
import type { SalmAdminEditionsResponse, SalmEditionResponse } from '#shared/types/salm'

// Aperçu d'une édition non publiée, rendu par le même composant que /salm (FR-100, FR-120, research R6).
// Réservé aux administrateurs : l'API est sous /api/admin (401 sans session) et la page redirige vers la connexion.
definePageMeta({ layout: 'default' })

const route = useRoute()
const id = Number(route.params.id)

const { data, error } = await useFetch<SalmEditionResponse>(`/api/admin/salm/editions/${id}/preview`, {
  key: `salm-admin-preview-${id}`,
})
const { data: list } = await useFetch<SalmAdminEditionsResponse>('/api/admin/salm/editions', { key: 'salm-admin-editions' })
const status = computed(() => list.value?.data.find((e) => e.id === id)?.status ?? null)

const edition = computed(() => data.value?.edition ?? null)
const previous = computed(() => data.value?.previous ?? null)
const placeholder = computed(() => {
  if (!error.value || error.value.statusCode === 401) return 'Chargement…'
  return error.value.statusCode === 404 ? 'Édition introuvable.' : salmAdminErrorFrom(error.value)
})

useSeoMeta({
  robots: 'noindex, nofollow',
  title: () => (edition.value ? `Aperçu — SALM ${edition.value.year}` : 'Aperçu — SALM'),
})
useHead({ bodyAttrs: { class: 'salm-apercu' } })

onMounted(async () => {
  const loggedIn = await useAdmin().checkSession()
  if (!loggedIn || error.value?.statusCode === 401) await navigateTo('/admin/login')
})

const bannerText = computed(() => {
  if (status.value === 'archived') return 'Aperçu — cette édition est archivée.'
  if (status.value === 'published') return 'Aperçu — cette édition est en ligne.'
  return 'Aperçu — cette édition n\'est pas publiée.'
})

// Liens d'inscription inertes (US1-11)
const notice = ref('')
let noticeTimer: ReturnType<typeof setTimeout> | undefined

function blockRegistration(event: MouseEvent) {
  const link = (event.target as HTMLElement | null)?.closest('a')
  const href = link?.getAttribute('href') ?? ''
  if (!href.startsWith('/salm/inscription-')) return
  event.preventDefault()
  event.stopPropagation()
  notice.value = ''
  clearTimeout(noticeTimer)
  nextTick(() => { notice.value = 'Les inscriptions ne sont pas disponibles dans l\'aperçu.' })
  noticeTimer = setTimeout(() => { notice.value = '' }, 5000)
}

onBeforeUnmount(() => clearTimeout(noticeTimer))
</script>

<template>
  <div>
    <div v-if="data && !error" class="fixed inset-x-0 top-0 z-[60] bg-gray-950 text-white shadow-lg">
      <div class="mx-auto flex min-h-11 max-w-6xl flex-wrap items-center justify-between gap-x-4 gap-y-1 px-4 py-2 text-sm">
        <p class="font-semibold">{{ bannerText }}</p>
        <NuxtLink :to="`/admin/salm/editions/${id}`" class="font-medium text-amber-400 underline underline-offset-2 hover:text-amber-300">
          ← Retour à l'édition
        </NuxtLink>
      </div>
      <div role="status" aria-live="polite">
        <p v-if="notice" class="bg-amber-400 px-4 py-2 text-center text-sm font-medium text-gray-950">{{ notice }}</p>
      </div>
    </div>

    <div v-if="data && !error" class="pt-11" @click.capture="blockRegistration">
      <SalmEditionView :edition="edition" :previous="previous" :key-figures="data?.keyFigures" :partners="data?.partners" />
    </div>
    <div v-else class="flex min-h-[60vh] items-center justify-center px-4 pt-32 pb-20 text-center text-gray-600">
      <p>{{ placeholder }}</p>
    </div>
  </div>
</template>

<style>
/* La navbar flottante du site passe sous le bandeau d'aperçu */
body.salm-apercu nav.fixed.inset-x-0 {
  top: 3.75rem;
}
</style>
