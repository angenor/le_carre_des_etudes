<script setup lang="ts">
import type { SalmAdminSchoolDetail } from '#shared/types/salm'

definePageMeta({
  layout: 'admin',
})

// Fiche d'un établissement : suivi (statut, note interne) et suppression (FR-067, FR-067a).
// Aucun badge pour un établissement ou ses exposants (FR-047).
const route = useRoute()
const id = computed(() => String(route.params.id))
const { data: school, error } = await useFetch<SalmAdminSchoolDetail>(() => `/api/admin/salm/schools/${id.value}`)

const listLink = computed(() => ({
  path: '/admin/salm/etablissements',
  query: { edition: school.value?.editionYear ?? route.query.edition },
}))

const form = reactive({ status: '', internalNote: '' })
watch(school, (s) => {
  if (!s) return
  form.status = s.status
  form.internalNote = s.internalNote ?? ''
}, { immediate: true })

const saving = ref(false)
const errorMessage = ref('')
const successMessage = ref('')

async function save() {
  saving.value = true
  errorMessage.value = ''
  successMessage.value = ''
  try {
    school.value = await $fetch<SalmAdminSchoolDetail>(`/api/admin/salm/schools/${id.value}`, {
      method: 'PATCH',
      body: { status: form.status, internalNote: form.internalNote },
    })
    successMessage.value = 'Suivi enregistré avec succès !'
    setTimeout(() => { successMessage.value = '' }, 3000)
  } catch {
    errorMessage.value = 'Erreur lors de l\'enregistrement du suivi'
  } finally {
    saving.value = false
  }
}

// Suppression en 2 clics (pattern newsletter.vue)
const confirmDelete = ref(false)
const deleting = ref(false)

async function requestDelete() {
  if (!confirmDelete.value) {
    confirmDelete.value = true
    setTimeout(() => { confirmDelete.value = false }, 3000)
    return
  }
  deleting.value = true
  try {
    await $fetch(`/api/admin/salm/schools/${id.value}`, { method: 'DELETE' })
    await refreshNuxtData('salm-admin-editions')
    await navigateTo(listLink.value)
  } catch {
    errorMessage.value = 'Erreur lors de la suppression'
  } finally {
    deleting.value = false
    confirmDelete.value = false
  }
}

function formatDateTime(date: string) {
  return new Date(date).toLocaleString('fr-FR', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

const programmes = computed(() => (school.value?.programmes ?? [])
  .map((p) => (p === 'AUTRE' && school.value?.otherProgramme ? `Autre (${school.value.otherProgramme})` : programmeLabel(p)))
  .join(' · '))
</script>

<template>
  <div>
    <SalmAdminHeader />

    <NuxtLink :to="listLink" class="mb-4 inline-flex items-center gap-1 text-sm font-medium text-gray-600 hover:text-gray-900">
      ← Retour à la liste des établissements
    </NuxtLink>

    <p v-if="error || !school" class="rounded-lg bg-red-50 p-4 text-sm text-red-700">Inscription introuvable.</p>

    <template v-else>
      <div v-if="errorMessage" class="mb-4 rounded-lg bg-red-50 p-4 text-sm text-red-700" role="alert">
        {{ errorMessage }}
        <button @click="errorMessage = ''" class="ml-2 font-medium underline">Fermer</button>
      </div>
      <div v-if="successMessage" class="mb-4 rounded-lg bg-green-50 p-4 text-sm text-green-700" role="status">
        {{ successMessage }}
      </div>

      <div class="grid gap-6 lg:grid-cols-3">
        <!-- Données saisies -->
        <div class="rounded-lg border border-gray-200 bg-white p-6 shadow-sm lg:col-span-2">
          <h2 class="text-lg font-semibold text-gray-900">{{ school.name }}</h2>
          <p class="mt-1 text-xs text-gray-500">
            Inscrit le {{ formatDateTime(school.createdAt) }} · modifié le {{ formatDateTime(school.updatedAt) }}
          </p>

          <dl class="mt-5 grid gap-4 sm:grid-cols-2">
            <div>
              <dt class="text-xs font-medium uppercase tracking-wider text-gray-500">Téléphone</dt>
              <dd class="mt-1 text-sm text-gray-900">{{ school.phone }}</dd>
            </div>
            <div>
              <dt class="text-xs font-medium uppercase tracking-wider text-gray-500">E-mail</dt>
              <dd class="mt-1 text-sm text-gray-900"><a :href="`mailto:${school.email}`" class="hover:underline">{{ school.email }}</a></dd>
            </div>
            <div>
              <dt class="text-xs font-medium uppercase tracking-wider text-gray-500">Programmes</dt>
              <dd class="mt-1 text-sm text-gray-900">{{ programmes }}</dd>
            </div>
            <div>
              <dt class="text-xs font-medium uppercase tracking-wider text-gray-500">Stand</dt>
              <dd class="mt-1 text-sm text-gray-900">
                {{ school.stand.name }}
                <span v-if="!school.stand.isVisible" class="ml-1 rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-600">masqué</span>
              </dd>
            </div>
            <div class="sm:col-span-2">
              <dt class="text-xs font-medium uppercase tracking-wider text-gray-500">Question</dt>
              <dd class="mt-1 whitespace-pre-line text-sm text-gray-900">{{ school.question || '—' }}</dd>
            </div>
          </dl>

          <h3 class="mt-6 text-sm font-semibold text-gray-800">Exposants ({{ school.exhibitors.length }})</h3>
          <div class="mt-2 overflow-x-auto rounded-lg border border-gray-200">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Nom & prénoms</th>
                  <th class="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Contact</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-200">
                <tr v-for="(e, i) in school.exhibitors" :key="i">
                  <td class="px-4 py-2 text-sm text-gray-900">{{ e.fullName }}</td>
                  <td class="whitespace-nowrap px-4 py-2 text-sm text-gray-600">{{ e.contact }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Suivi -->
        <div class="space-y-6">
          <form class="rounded-lg border border-gray-200 bg-white p-6 shadow-sm" @submit.prevent="save">
            <h2 class="text-sm font-semibold text-gray-800">Suivi</h2>
            <label for="school-status" class="mt-4 block text-sm font-medium text-gray-700">Statut</label>
            <select
              id="school-status"
              v-model="form.status"
              class="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <option v-for="s in SCHOOL_STATUSES" :key="s" :value="s">{{ schoolStatusLabel(s) }}</option>
            </select>
            <label for="school-note" class="mt-4 block text-sm font-medium text-gray-700">Note interne</label>
            <textarea
              id="school-note"
              v-model="form.internalNote"
              rows="5"
              maxlength="2000"
              class="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
            <p class="mt-1 text-right text-xs text-gray-400">{{ form.internalNote.length }}/2000</p>
            <button
              type="submit"
              :disabled="saving"
              class="mt-3 inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-emerald-700 disabled:opacity-50"
            >
              {{ saving ? 'Enregistrement…' : 'Enregistrer' }}
            </button>
          </form>

          <div class="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <h2 class="text-sm font-semibold text-gray-800">Supprimer l'inscription</h2>
            <p class="mt-1 text-sm text-gray-600">Suppression définitive de l'établissement et de ses exposants.</p>
            <button
              type="button"
              :disabled="deleting"
              class="mt-3 rounded-md px-3 py-1.5 text-sm font-medium transition-colors disabled:opacity-50"
              :class="confirmDelete ? 'bg-red-600 text-white hover:bg-red-700' : 'border border-red-200 text-red-600 hover:bg-red-50'"
              @click="requestDelete"
            >
              {{ deleting ? '...' : confirmDelete ? 'Confirmer la suppression' : 'Supprimer l\'inscription' }}
            </button>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
