<script setup lang="ts">
import type { SalmAdminEditionDetail, SalmAdminEditionListItem, SalmAdminEditionsResponse } from '#shared/types/salm'

// Liste des éditions du SALM : création, statut, suppression (specs/007, contracts/ui-routes.md, US1).
definePageMeta({ layout: 'admin' })
useSeoMeta({ title: 'Éditions du SALM — Administration' })

const { data } = await useFetch<SalmAdminEditionsResponse>('/api/admin/salm/editions', { key: 'salm-admin-editions' })
const editions = computed(() => data.value?.data ?? [])
const published = computed(() => editions.value.find((e) => e.status === 'published') ?? null)
const years = computed(() => new Set(editions.value.map((e) => e.year)))

const { successMessage, errorMessage, showSuccess, showError, clear } = useSalmFlash()
const actions = useSalmEditionActions()
const busyId = ref<number | null>(null)

function dates(e: SalmAdminEditionListItem) {
  return e.firstDay && e.lastDay ? formatDateRange([e.firstDay, e.lastDay], '–') : '—'
}

async function run(e: SalmAdminEditionListItem, action: () => Promise<string | null>) {
  busyId.value = e.id
  try {
    const message = await action()
    if (message) showSuccess(message)
  }
  catch (err) {
    showError(salmAdminErrorFrom(err, { year: e.year }))
    await actions.refreshList()
  }
  finally {
    busyId.value = null
  }
}

// ---- Création ----
const showForm = ref(false)
const newYear = ref('')
const newOrganizer = ref('')
const creating = ref(false)
const createErrors = ref<Record<string, string>>({})
const yearInput = ref<HTMLInputElement>()

async function openForm() {
  showForm.value = true
  clear()
  createErrors.value = {}
  const latest = editions.value[0]?.year
  newYear.value = String(latest ? latest + 1 : new Date().getFullYear())
  await nextTick()
  yearInput.value?.focus()
}

async function create() {
  creating.value = true
  createErrors.value = {}
  const year = Number(newYear.value.trim())
  try {
    const detail = await $fetch<SalmAdminEditionDetail>('/api/admin/salm/editions', {
      method: 'POST',
      body: { year: newYear.value.trim() && Number.isInteger(year) ? year : newYear.value, organizerName: newOrganizer.value || undefined },
    })
    await actions.refreshList()
    await navigateTo(`/admin/salm/editions/${detail.id}`)
  }
  catch (err) {
    const { code, errors } = parseSalmAdminError(err)
    if (code === 'YEAR_TAKEN') createErrors.value = { year: salmAdminErrorFrom(err, { year }) }
    else if (code === 'VALIDATION') {
      createErrors.value = Object.fromEntries(Object.entries(errors).map(([field, c]) => [field, salmFieldErrorMessage(field, c, 150)]))
    }
    else showError(salmAdminErrorFrom(err))
  }
  finally {
    creating.value = false
  }
}
</script>

<template>
  <div>
    <div class="mb-6 flex flex-wrap items-center justify-between gap-4">
      <h1 class="text-xl font-semibold text-gray-800">Éditions du SALM</h1>
      <button
        v-if="!showForm"
        type="button"
        class="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
        @click="openForm"
      >
        + Nouvelle édition
      </button>
    </div>

    <SalmAdminFlash :success="successMessage" :error="errorMessage" @dismiss="clear" />

    <!-- Création -->
    <form
      v-if="showForm"
      class="mb-6 rounded-lg border border-gray-200 bg-white p-6 shadow-sm"
      novalidate
      @submit.prevent="create"
    >
      <h2 class="mb-4 text-lg font-semibold text-gray-900">Nouvelle édition</h2>
      <div class="grid gap-4 sm:grid-cols-2">
        <div>
          <label for="new-edition-year" class="block text-sm font-medium text-gray-700">Année</label>
          <input
            id="new-edition-year"
            ref="yearInput"
            v-model="newYear"
            type="text"
            inputmode="numeric"
            autocomplete="off"
            required
            :aria-invalid="createErrors.year ? 'true' : undefined"
            :aria-describedby="createErrors.year ? 'new-edition-year-error' : undefined"
            class="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
          <p v-if="createErrors.year" id="new-edition-year-error" class="mt-1 text-sm text-red-600">{{ createErrors.year }}</p>
        </div>
        <div v-if="!editions.length">
          <label for="new-edition-organizer" class="block text-sm font-medium text-gray-700">Organisateur</label>
          <input
            id="new-edition-organizer"
            v-model="newOrganizer"
            type="text"
            required
            maxlength="150"
            :aria-invalid="createErrors.organizerName ? 'true' : undefined"
            :aria-describedby="createErrors.organizerName ? 'new-edition-organizer-error' : undefined"
            class="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
          <p v-if="createErrors.organizerName" id="new-edition-organizer-error" class="mt-1 text-sm text-red-600">{{ createErrors.organizerName }}</p>
        </div>
      </div>
      <p v-if="editions.length" class="mt-3 text-sm text-gray-500">
        L'intitulé, l'organisateur et la ville sont repris du SALM {{ editions[0]!.year }}. L'édition est créée en brouillon, inscriptions fermées.
      </p>
      <div class="mt-4 flex gap-3">
        <button
          type="submit"
          :disabled="creating"
          class="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {{ creating ? 'Création…' : 'Créer l\'édition' }}
        </button>
        <button
          type="button"
          class="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          @click="showForm = false"
        >
          Annuler
        </button>
      </div>
    </form>

    <!-- Liste -->
    <div v-if="!editions.length" class="rounded-lg border border-gray-200 bg-white p-8 text-center shadow-sm">
      <p class="text-gray-500">Aucune édition. Créez la première.</p>
    </div>

    <div v-else class="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
      <table class="min-w-full divide-y divide-gray-200 text-sm">
        <caption class="sr-only">Éditions du SALM, de la plus récente à la plus ancienne</caption>
        <thead class="bg-gray-50 text-left text-xs font-semibold tracking-wide text-gray-600 uppercase">
          <tr>
            <th scope="col" class="px-4 py-3">Année</th>
            <th scope="col" class="px-4 py-3">Statut</th>
            <th scope="col" class="px-4 py-3">Dates</th>
            <th scope="col" class="px-4 py-3">Lieu</th>
            <th scope="col" class="px-4 py-3">Inscriptions</th>
            <th scope="col" class="px-4 py-3"><span class="sr-only">Actions</span></th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-100">
          <tr v-for="e in editions" :key="e.id" class="align-top">
            <th scope="row" class="px-4 py-3 text-left font-semibold text-gray-900">
              <NuxtLink :to="`/admin/salm/editions/${e.id}`" class="hover:text-emerald-700 hover:underline">{{ e.year }}</NuxtLink>
            </th>
            <td class="px-4 py-3">
              <span class="rounded-full px-2 py-0.5 text-xs font-semibold" :class="salmEditionStatus(e.status).classes">
                {{ salmEditionStatus(e.status).label }}
              </span>
            </td>
            <td class="px-4 py-3 whitespace-nowrap text-gray-700">{{ dates(e) }}</td>
            <td class="px-4 py-3 text-gray-700">{{ venueLabel(e.venue, e.city) }}</td>
            <td class="px-4 py-3 text-gray-700">
              {{ e.counts.students.toLocaleString('fr-FR') }} étudiant·e·s · {{ e.counts.schools.toLocaleString('fr-FR') }} établissement{{ e.counts.schools > 1 ? 's' : '' }}
            </td>
            <td class="px-4 py-3">
              <div class="flex flex-wrap justify-end gap-2">
                <NuxtLink
                  :to="`/admin/salm/editions/${e.id}`"
                  class="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
                >
                  Gérer<span class="sr-only"> le SALM {{ e.year }}</span>
                </NuxtLink>
                <NuxtLink
                  v-if="e.status === 'published'"
                  to="/salm"
                  class="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                >
                  Voir la page<span class="sr-only"> du SALM {{ e.year }}</span>
                </NuxtLink>
                <NuxtLink
                  v-else
                  :to="`/admin/salm/editions/${e.id}/apercu`"
                  class="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                >
                  Prévisualiser<span class="sr-only"> le SALM {{ e.year }}</span>
                </NuxtLink>
                <button
                  v-if="e.canPublish"
                  type="button"
                  :disabled="busyId !== null"
                  class="rounded-lg border border-emerald-200 px-3 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-50 disabled:opacity-50"
                  @click="run(e, () => actions.publish(e, published))"
                >
                  Publier<span class="sr-only"> le SALM {{ e.year }}</span>
                </button>
                <button
                  v-if="e.status !== 'archived'"
                  type="button"
                  :disabled="busyId !== null"
                  class="rounded-lg border border-amber-200 px-3 py-1.5 text-xs font-medium text-amber-800 hover:bg-amber-50 disabled:opacity-50"
                  @click="run(e, () => actions.archive(e))"
                >
                  Archiver<span class="sr-only"> le SALM {{ e.year }}</span>
                </button>
                <button
                  type="button"
                  :disabled="busyId !== null || years.has(e.year + 1)"
                  :aria-describedby="years.has(e.year + 1) ? `duplicate-${e.id}-reason` : undefined"
                  class="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                  @click="run(e, () => actions.duplicate(e))"
                >
                  Dupliquer vers {{ e.year + 1 }}
                </button>
                <button
                  v-if="e.canDelete"
                  type="button"
                  :disabled="busyId !== null"
                  class="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
                  @click="run(e, () => actions.remove(e))"
                >
                  Supprimer<span class="sr-only"> le SALM {{ e.year }}</span>
                </button>
              </div>
              <p v-if="years.has(e.year + 1)" :id="`duplicate-${e.id}-reason`" class="mt-1 text-right text-xs text-gray-500">
                Une édition {{ e.year + 1 }} existe déjà.
              </p>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
