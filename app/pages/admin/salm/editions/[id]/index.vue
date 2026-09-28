<script setup lang="ts">
import type { SalmAdminEditionDetail, SalmAdminEditionsResponse } from '#shared/types/salm'

// Fiche d'une édition du SALM : en-tête de statut et sections de contenu (specs/007, contracts/ui-routes.md).
definePageMeta({ layout: 'admin' })

const route = useRoute()
const id = Number(route.params.id)

const { data: edition, error, refresh } = await useFetch<SalmAdminEditionDetail>(`/api/admin/salm/editions/${id}`, {
  key: `salm-admin-edition-${id}`,
})
const { data: list } = await useFetch<SalmAdminEditionsResponse>('/api/admin/salm/editions', { key: 'salm-admin-editions' })
const published = computed(() => list.value?.data.find((e) => e.status === 'published') ?? null)
const nextYearTaken = computed(() => !!edition.value && !!list.value?.data.some((e) => e.year === edition.value!.year + 1))

// Message persistant après une duplication (US3-1), fermable
const duplicatedFrom = computed(() => {
  const value = Number(route.query.duplique)
  return Number.isInteger(value) && value > 0 ? value : null
})

function closeDuplicated() {
  navigateTo({ query: { ...route.query, duplique: undefined } }, { replace: true })
}

useSeoMeta({ title: () => (edition.value ? `SALM ${edition.value.year} — Administration` : 'Édition du SALM — Administration') })

const { successMessage, errorMessage, showSuccess, showError, clear } = useSalmFlash()
const actions = useSalmEditionActions()
const busy = ref(false)

// ---- Sections (?section=) ----
const sections = [
  { key: 'general', label: 'Général' },
  { key: 'textes', label: 'Textes et affiche' },
  { key: 'contacts', label: 'Contacts' },
  { key: 'temps-forts', label: 'Temps forts' },
  { key: 'chronogramme', label: 'Chronogramme' },
  { key: 'stands', label: 'Types de stands' },
  { key: 'medias', label: 'Médias produits' },
] as const
type SectionKey = (typeof sections)[number]['key']
const section = computed<SectionKey>(() => {
  const value = route.query.section
  return sections.some((s) => s.key === value) ? (value as SectionKey) : 'general'
})

function sectionLink(key: SectionKey) {
  return { query: { ...route.query, section: key === 'general' ? undefined : key } }
}

/** Une section a écrit : fiche et liste rechargées ; bandeau de succès si un message est fourni. */
async function onSaved(message?: string) {
  await Promise.all([refresh(), refreshNuxtData('salm-admin-editions')])
  if (message) showSuccess(message)
}

// ---- Statut ----
const editionRef = computed(() => edition.value && { ...edition.value, dayCount: edition.value.days.length })

async function run(action: 'publish' | 'archive' | 'duplicate') {
  const e = editionRef.value
  if (!e) return
  busy.value = true
  try {
    if (action === 'duplicate') {
      // Navigation vers la fiche de la copie en cas de succès
      await actions.duplicate(e)
      return
    }
    const message = action === 'publish' ? await actions.publish(e, published.value) : await actions.archive(e)
    if (message) {
      await refresh()
      showSuccess(message)
    }
  }
  catch (err) {
    showError(salmAdminErrorFrom(err, { year: e.year }))
    await refresh()
  }
  finally {
    busy.value = false
  }
}

watch(() => route.query.section, () => clear())
</script>

<template>
  <div>
    <NuxtLink to="/admin/salm/editions" class="text-sm font-medium text-gray-600 hover:text-gray-900">← Toutes les éditions</NuxtLink>

    <div v-if="error || !edition" class="mt-4 rounded-lg border border-gray-200 bg-white p-8 text-center shadow-sm">
      <p class="text-gray-600">{{ error?.statusCode === 404 ? 'Édition introuvable.' : salmAdminErrorFrom(error) }}</p>
    </div>

    <template v-else>
      <div class="mt-3 mb-6 flex flex-wrap items-center justify-between gap-4">
        <div class="flex items-center gap-3">
          <h1 class="text-xl font-semibold text-gray-800">SALM {{ edition.year }}</h1>
          <span class="rounded-full px-2 py-0.5 text-xs font-semibold" :class="salmEditionStatus(edition.status).classes">
            {{ salmEditionStatus(edition.status).label }}
          </span>
        </div>
        <div class="flex flex-wrap gap-2">
          <NuxtLink
            v-if="edition.status === 'published'"
            to="/salm"
            class="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Voir la page
          </NuxtLink>
          <NuxtLink
            v-else
            :to="`/admin/salm/editions/${edition.id}/apercu`"
            class="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Prévisualiser
          </NuxtLink>
          <button
            v-if="edition.canPublish"
            type="button"
            :disabled="busy"
            class="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
            @click="run('publish')"
          >
            Publier
          </button>
          <button
            v-if="edition.status !== 'archived'"
            type="button"
            :disabled="busy"
            class="rounded-lg border border-amber-300 bg-white px-4 py-2 text-sm font-medium text-amber-800 hover:bg-amber-50 disabled:opacity-50"
            @click="run('archive')"
          >
            Archiver
          </button>
          <button
            type="button"
            :disabled="busy || nextYearTaken"
            :aria-describedby="nextYearTaken ? 'duplicate-reason' : undefined"
            class="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            @click="run('duplicate')"
          >
            Dupliquer vers {{ edition.year + 1 }}
          </button>
        </div>
        <p v-if="nextYearTaken" id="duplicate-reason" class="w-full text-right text-xs text-gray-500">
          Une édition {{ edition.year + 1 }} existe déjà.
        </p>
      </div>

      <div v-if="duplicatedFrom" class="mb-4 flex items-start justify-between gap-3 rounded-lg border border-sky-200 bg-sky-50 p-4 text-sm text-sky-900" role="status">
        <p>Édition {{ edition.year }} créée à partir de {{ duplicatedFrom }}. Vérifiez les dates, le lieu et l'affiche.</p>
        <button type="button" class="shrink-0 font-medium underline" @click="closeDuplicated">Fermer</button>
      </div>

      <p v-if="!edition.days.length" class="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
        Ajoutez au moins un jour au chronogramme avant de publier.
      </p>

      <SalmAdminFlash :success="successMessage" :error="errorMessage" @dismiss="clear" />

      <nav aria-label="Sections de l'édition" class="mb-6 flex flex-wrap gap-1 border-b border-gray-200">
        <NuxtLink
          v-for="s in sections"
          :key="s.key"
          :to="sectionLink(s.key)"
          :aria-current="section === s.key ? 'page' : undefined"
          class="-mb-px border-b-2 px-4 py-2 text-sm font-medium transition-colors"
          :class="section === s.key ? 'border-amber-500 text-gray-900' : 'border-transparent text-gray-500 hover:text-gray-800'"
        >
          {{ s.label }}
        </NuxtLink>
      </nav>

      <SalmAdminEditionGeneral v-if="section === 'general'" :edition="edition" @saved="onSaved" />
      <SalmAdminEditionTexts v-else-if="section === 'textes'" :edition="edition" @saved="onSaved" />
      <SalmAdminEditionContacts v-else-if="section === 'contacts'" :edition="edition" @saved="onSaved" />
      <SalmAdminEditionHighlights v-else-if="section === 'temps-forts'" :edition="edition" @saved="onSaved" />
      <SalmAdminEditionChronogram v-else-if="section === 'chronogramme'" :edition="edition" @saved="onSaved" />
      <SalmAdminEditionStands v-else-if="section === 'stands'" :edition="edition" @saved="onSaved" />
      <SalmAdminEditionMedia v-else-if="section === 'medias'" :edition="edition" @saved="onSaved" />
    </template>
  </div>
</template>
