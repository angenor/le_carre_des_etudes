<script setup lang="ts">
import type { SalmAdminEdition } from '#shared/types/salm'

// En-tête du back-office SALM : édition consultée, onglets, ouverture des inscriptions,
// conservation et suppression des données personnelles (FR-061, FR-065a, FR-065b, FR-069).
const { editions, current, select, refresh } = await useSalmAdminEdition()
const route = useRoute()

const STATUS_LABELS: Record<string, string> = { published: 'publiée', archived: 'archivée', draft: 'brouillon' }

const errorMessage = ref('')
const successMessage = ref('')
let successTimer: ReturnType<typeof setTimeout> | undefined

function showSuccess(message: string) {
  successMessage.value = message
  clearTimeout(successTimer)
  successTimer = setTimeout(() => { successMessage.value = '' }, 3000)
}

function formatDay(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'UTC' })
}

const tabs = computed(() => [
  { label: 'Étudiant·e·s', to: '/admin/salm', active: route.path === '/admin/salm' },
  { label: 'Établissements', to: '/admin/salm/etablissements', active: route.path.startsWith('/admin/salm/etablissements') },
])

// ---- Ouverture / fermeture ----
const switching = ref<string | null>(null)
const switches = computed(() => {
  const e = current.value
  if (!e) return []
  return [
    { key: 'studentRegistrationOpen' as const, label: 'Inscriptions étudiantes', on: e.studentRegistrationOpen && !e.ended },
    { key: 'schoolRegistrationOpen' as const, label: 'Inscriptions établissements', on: e.schoolRegistrationOpen && !e.ended },
  ]
})

async function toggle(key: 'studentRegistrationOpen' | 'schoolRegistrationOpen', value: boolean) {
  const e = current.value
  if (!e || e.ended) return
  switching.value = key
  errorMessage.value = ''
  try {
    await $fetch(`/api/admin/salm/editions/${e.id}/registrations`, { method: 'PATCH', body: { [key]: value } })
    await refresh()
    showSuccess(value ? 'Inscriptions ouvertes.' : 'Inscriptions fermées.')
  }
  catch (err) {
    errorMessage.value = (err as { data?: { message?: string } }).data?.message
      ?? 'Erreur lors de la mise à jour des inscriptions.'
  }
  finally {
    switching.value = null
  }
}

// ---- Suppression des données personnelles ----
const purgeOpen = ref(false)
const purgeYear = ref('')
const purging = ref(false)
const purgeInput = ref<HTMLInputElement>()

async function openPurge() {
  purgeOpen.value = true
  purgeYear.value = ''
  await nextTick()
  purgeInput.value?.focus()
}

async function purge(e: SalmAdminEdition) {
  if (purgeYear.value.trim() !== String(e.year)) return
  purging.value = true
  errorMessage.value = ''
  try {
    await $fetch(`/api/admin/salm/editions/${e.id}/purge`, { method: 'POST', body: { confirmYear: Number(purgeYear.value) } })
    purgeOpen.value = false
    await refresh()
    await refreshNuxtData()
    showSuccess('Données personnelles supprimées.')
  }
  catch (err) {
    const code = (err as { data?: { data?: { code?: string } } }).data?.data?.code
    const messages: Record<string, string> = {
      EDITION_NOT_ARCHIVED: 'L\'édition doit être archivée.',
      EDITION_NOT_ENDED: 'Le salon n\'est pas encore terminé.',
      ALREADY_PURGED: 'Les données de cette édition ont déjà été supprimées.',
      CONFIRMATION_MISMATCH: 'L\'année saisie ne correspond pas.',
    }
    errorMessage.value = (code && messages[code]) || 'Erreur lors de la suppression des données.'
  }
  finally {
    purging.value = false
  }
}

watch(() => current.value?.id, () => { purgeOpen.value = false })

const stats = computed(() => current.value?.purgedStats ?? null)
function entries(record: Record<string, number>) {
  return Object.entries(record).sort((a, b) => a[0].localeCompare(b[0]))
}
</script>

<template>
  <div class="mb-6">
    <div class="mb-4 flex flex-wrap items-center justify-between gap-4">
      <h1 class="text-xl font-semibold text-gray-800">
        {{ current ? `SALM ${current.year}` : 'SALM' }}
      </h1>
      <div v-if="editions.length" class="flex items-center gap-2">
        <label for="salm-edition" class="text-sm font-medium text-gray-700">Édition</label>
        <select
          id="salm-edition"
          :value="current?.year"
          class="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
          @change="select(Number(($event.target as HTMLSelectElement).value))"
        >
          <option v-for="e in editions" :key="e.id" :value="e.year">
            {{ e.year }} ({{ STATUS_LABELS[e.status] ?? e.status }})
          </option>
        </select>
      </div>
    </div>

    <p v-if="!current" class="rounded-lg border border-gray-200 bg-white p-5 text-sm text-gray-500 shadow-sm">
      Aucune édition du SALM n'existe encore. Lancez le seed (<code>pnpm prisma db seed</code>).
    </p>

    <template v-else>
      <!-- Messages -->
      <div v-if="errorMessage" class="mb-4 rounded-lg bg-red-50 p-4 text-sm text-red-700" role="alert">
        {{ errorMessage }}
        <button class="ml-2 font-medium underline" @click="errorMessage = ''">Fermer</button>
      </div>
      <div v-if="successMessage" class="mb-4 rounded-lg bg-green-50 p-4 text-sm text-green-700" role="status">
        {{ successMessage }}
      </div>

      <div class="grid gap-4 lg:grid-cols-2">
        <!-- Ouverture des inscriptions -->
        <div class="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
          <h2 class="text-sm font-semibold text-gray-800">Ouverture des inscriptions</h2>
          <p v-if="current.ended" class="mt-1 text-sm text-gray-500">Fermées automatiquement (salon terminé)</p>
          <ul class="mt-3 space-y-3">
            <li v-for="s in switches" :key="s.key" class="flex items-center justify-between gap-4">
              <span :id="`salm-switch-${s.key}`" class="text-sm text-gray-700">{{ s.label }}</span>
              <span class="flex items-center gap-3">
                <span class="text-xs font-medium" :class="s.on ? 'text-emerald-700' : 'text-gray-500'">
                  {{ current.ended ? 'Fermées' : s.on ? 'Ouvertes' : 'Fermées' }}
                </span>
                <button
                  type="button"
                  role="switch"
                  :aria-checked="s.on ? 'true' : 'false'"
                  :aria-labelledby="`salm-switch-${s.key}`"
                  :disabled="current.ended || switching !== null"
                  class="relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                  :class="s.on ? 'bg-emerald-600' : 'bg-gray-300'"
                  @click="toggle(s.key, !s.on)"
                >
                  <span class="inline-block size-5 rounded-full bg-white shadow transition-transform" :class="s.on ? 'translate-x-5' : 'translate-x-0.5'" />
                </button>
              </span>
            </li>
          </ul>
        </div>

        <!-- Conservation des données -->
        <div class="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
          <h2 class="text-sm font-semibold text-gray-800">Données personnelles</h2>

          <template v-if="current.retention.purgedAt">
            <p class="mt-1 text-sm text-gray-600">Données personnelles supprimées le {{ formatDay(current.retention.purgedAt) }}.</p>
            <dl v-if="stats" class="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
              <div>
                <dt class="text-gray-500">Étudiant·e·s</dt>
                <dd class="font-semibold text-gray-900">{{ stats.students.total }}</dd>
              </div>
              <div>
                <dt class="text-gray-500">Établissements · exposants</dt>
                <dd class="font-semibold text-gray-900">{{ stats.schools.total }} · {{ stats.schools.exhibitors }}</dd>
              </div>
              <div>
                <dt class="text-gray-500">Par niveau</dt>
                <dd class="text-gray-700"><span v-for="[k, v] in entries(stats.students.byStudyLevel)" :key="k" class="block">{{ k }} : {{ v }}</span></dd>
              </div>
              <div>
                <dt class="text-gray-500">Par stand</dt>
                <dd class="text-gray-700"><span v-for="[k, v] in entries(stats.schools.byStandType)" :key="k" class="block">{{ k }} : {{ v }}</span></dd>
              </div>
              <div>
                <dt class="text-gray-500">Par statut</dt>
                <dd class="text-gray-700"><span v-for="[k, v] in entries(stats.schools.byStatus)" :key="k" class="block">{{ schoolStatusLabel(k) }} : {{ v }}</span></dd>
              </div>
              <div>
                <dt class="text-gray-500">Par jour d'inscription</dt>
                <dd class="max-h-32 overflow-y-auto text-gray-700"><span v-for="[k, v] in entries(stats.students.byRegistrationDay)" :key="k" class="block">{{ formatDay(k) }} : {{ v }}</span></dd>
              </div>
            </dl>
          </template>

          <template v-else>
            <p v-if="current.retention.deadlineIso" class="mt-1 text-sm text-gray-600">
              Données personnelles à supprimer au plus tard le {{ formatDay(current.retention.deadlineIso) }}.
            </p>
            <p v-else class="mt-1 text-sm text-gray-500">Aucune date de fin : conservation non calculable.</p>

            <div v-if="current.retention.exceeded" class="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
              La date limite de conservation est dépassée : supprimez les données personnelles de cette édition.
            </div>

            <template v-if="current.retention.canPurge">
              <button
                v-if="!purgeOpen"
                type="button"
                class="mt-3 rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-700 transition-colors hover:bg-red-50"
                @click="openPurge"
              >
                Supprimer les données personnelles
              </button>
              <form v-else class="mt-3 space-y-3 rounded-lg border border-red-200 bg-red-50 p-4" @submit.prevent="purge(current)">
                <p class="text-sm text-red-800">
                  Toutes les inscriptions étudiantes et établissements de l'édition {{ current.year }}, exposants compris, seront
                  <strong>définitivement supprimées</strong>. Les badges et les QR codes deviendront invalides.
                  Seuls des compteurs anonymes seront conservés.
                </p>
                <div>
                  <label for="salm-purge-year" class="block text-sm font-medium text-gray-700">Saisissez l'année {{ current.year }} pour confirmer</label>
                  <input
                    id="salm-purge-year"
                    ref="purgeInput"
                    v-model="purgeYear"
                    type="text"
                    inputmode="numeric"
                    autocomplete="off"
                    class="mt-1 block w-40 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-red-500 focus:ring-1 focus:ring-red-500 focus:outline-none"
                  >
                </div>
                <div class="flex gap-2">
                  <button
                    type="submit"
                    :disabled="purgeYear.trim() !== String(current.year) || purging"
                    class="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {{ purging ? 'Suppression…' : 'Supprimer définitivement' }}
                  </button>
                  <button type="button" class="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50" @click="purgeOpen = false">
                    Annuler
                  </button>
                </div>
              </form>
            </template>
          </template>
        </div>
      </div>

      <!-- Onglets -->
      <nav aria-label="Inscriptions SALM" class="mt-6 flex gap-1 border-b border-gray-200">
        <NuxtLink
          v-for="tab in tabs"
          :key="tab.to"
          :to="{ path: tab.to, query: { edition: current.year } }"
          :aria-current="tab.active ? 'page' : undefined"
          class="-mb-px border-b-2 px-4 py-2 text-sm font-medium transition-colors"
          :class="tab.active ? 'border-amber-500 text-gray-900' : 'border-transparent text-gray-500 hover:text-gray-800'"
        >
          {{ tab.label }}
          <span class="ml-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
            {{ tab.to === '/admin/salm' ? current.counts.students : current.counts.schools }}
          </span>
        </NuxtLink>
      </nav>
    </template>
  </div>
</template>
