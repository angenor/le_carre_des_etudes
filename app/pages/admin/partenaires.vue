<script setup lang="ts">
definePageMeta({
  layout: 'admin',
})

interface Partner {
  id: number
  name: string
  logoPath: string
  url: string | null
  order: number
  createdAt: string
  updatedAt: string
}

const partners = ref<Partner[]>([])
const loading = ref(true)
const showForm = ref(false)
const editingPartner = ref<Partner | null>(null)
const saving = ref(false)
const errorMessage = ref('')

const form = reactive({
  name: '',
  logoPath: '',
  url: '',
  order: 0,
})

async function fetchPartners() {
  loading.value = true
  try {
    partners.value = await $fetch<Partner[]>('/api/partenaires')
  } catch {
    errorMessage.value = 'Erreur lors du chargement des partenaires'
  } finally {
    loading.value = false
  }
}

function resetForm() {
  form.name = ''
  form.logoPath = ''
  form.url = ''
  form.order = 0
  editingPartner.value = null
  errorMessage.value = ''
}

function openCreateForm() {
  resetForm()
  showForm.value = true
}

function openEditForm(partner: Partner) {
  editingPartner.value = partner
  form.name = partner.name
  form.logoPath = partner.logoPath
  form.url = partner.url || ''
  form.order = partner.order
  errorMessage.value = ''
  showForm.value = true
}

function cancelForm() {
  showForm.value = false
  resetForm()
}

async function uploadLogo(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  try {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('category', 'partenaires')
    const result = await $fetch<{ path: string }>('/api/upload', {
      method: 'POST',
      body: formData,
    })
    form.logoPath = result.path
  } catch {
    errorMessage.value = "Erreur lors de l'envoi du logo"
  }
}

async function savePartner() {
  saving.value = true
  errorMessage.value = ''

  try {
    const payload = {
      name: form.name,
      logoPath: form.logoPath,
      url: form.url || null,
      order: form.order,
    }

    if (editingPartner.value) {
      await $fetch(`/api/partenaires/${editingPartner.value.id}`, {
        method: 'PUT',
        body: payload,
      })
    } else {
      await $fetch('/api/partenaires', {
        method: 'POST',
        body: payload,
      })
    }
    showForm.value = false
    resetForm()
    await fetchPartners()
  } catch (err: unknown) {
    const error = err as { data?: { message?: string } }
    errorMessage.value = error?.data?.message || 'Erreur lors de la sauvegarde'
  } finally {
    saving.value = false
  }
}

async function deletePartner(partner: Partner) {
  if (!confirm(`Supprimer "${partner.name}" ?`)) return

  try {
    await $fetch(`/api/partenaires/${partner.id}`, { method: 'DELETE' })
    await fetchPartners()
  } catch {
    errorMessage.value = 'Erreur lors de la suppression'
  }
}

onMounted(fetchPartners)
</script>

<template>
  <div>
    <!-- Message d'erreur -->
    <div
      v-if="errorMessage"
      class="mb-4 rounded-lg bg-red-50 p-4 text-sm text-red-700"
    >
      {{ errorMessage }}
      <button @click="errorMessage = ''" class="ml-2 font-medium underline">Fermer</button>
    </div>

    <!-- Formulaire de création/édition -->
    <div v-if="showForm" class="mb-8 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <h2 class="text-lg font-semibold text-gray-900 mb-4">
        {{ editingPartner ? 'Modifier le partenaire' : 'Nouveau partenaire' }}
      </h2>

      <form class="space-y-4" @submit.prevent="savePartner">
        <div class="grid gap-4 sm:grid-cols-2">
          <div>
            <label for="name" class="block text-sm font-medium text-gray-700">Nom</label>
            <input
              id="name"
              v-model="form.name"
              type="text"
              required
              class="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              placeholder="Nom du partenaire"
            />
          </div>
          <div>
            <label for="order" class="block text-sm font-medium text-gray-700">Ordre d'affichage</label>
            <input
              id="order"
              v-model.number="form.order"
              type="number"
              min="0"
              class="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>
        </div>

        <div>
          <label for="url" class="block text-sm font-medium text-gray-700">Site web (optionnel)</label>
          <input
            id="url"
            v-model="form.url"
            type="url"
            class="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            placeholder="https://exemple.com"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700">Logo</label>
          <input
            type="file"
            accept="image/*"
            class="mt-1 block w-full text-sm text-gray-500 file:mr-3 file:rounded-lg file:border-0 file:bg-emerald-50 file:px-3 file:py-2 file:text-sm file:font-medium file:text-emerald-700 hover:file:bg-emerald-100"
            @change="uploadLogo"
          />
          <p v-if="form.logoPath" class="mt-1 text-xs text-emerald-600">
            {{ form.logoPath }}
          </p>
        </div>

        <div class="flex gap-3 pt-2">
          <button
            type="submit"
            :disabled="saving || !form.logoPath"
            class="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {{ saving ? 'Enregistrement...' : (editingPartner ? 'Mettre à jour' : 'Créer') }}
          </button>
          <button
            type="button"
            @click="cancelForm"
            class="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Annuler
          </button>
        </div>
      </form>
    </div>

    <!-- En-tête + bouton ajouter -->
    <div v-if="!showForm" class="mb-6 flex items-center justify-between">
      <h2 class="text-xl font-semibold text-gray-800">
        {{ partners.length }} partenaire{{ partners.length > 1 ? 's' : '' }}
      </h2>
      <button
        @click="openCreateForm"
        class="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
      >
        + Ajouter un partenaire
      </button>
    </div>

    <!-- Chargement -->
    <div v-if="loading" class="py-12 text-center text-gray-500">
      Chargement...
    </div>

    <!-- Liste vide -->
    <div v-else-if="!partners.length && !showForm" class="py-12 text-center">
      <p class="text-gray-500">Aucun partenaire pour le moment.</p>
      <button
        @click="openCreateForm"
        class="mt-3 text-sm font-medium text-emerald-600 hover:text-emerald-700"
      >
        Ajouter le premier partenaire
      </button>
    </div>

    <!-- Liste des partenaires -->
    <div v-else-if="!showForm" class="space-y-4">
      <div
        v-for="partner in partners"
        :key="partner.id"
        class="flex items-center justify-between gap-4 rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
      >
        <div class="flex items-center gap-4 min-w-0">
          <div class="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded bg-gray-50">
            <img
              :src="partner.logoPath"
              :alt="`Logo ${partner.name}`"
              class="max-h-full max-w-full object-contain"
            />
          </div>
          <div class="min-w-0">
            <h3 class="font-semibold text-gray-900 truncate">
              {{ partner.name }}
            </h3>
            <p v-if="partner.url" class="text-sm text-gray-500 truncate">
              {{ partner.url }}
            </p>
            <p class="text-xs text-gray-400">
              Ordre : {{ partner.order }}
            </p>
          </div>
        </div>
        <div class="flex shrink-0 gap-2">
          <button
            @click="openEditForm(partner)"
            class="rounded-md px-3 py-1.5 text-sm font-medium text-emerald-600 hover:bg-emerald-50 transition-colors"
          >
            Modifier
          </button>
          <button
            @click="deletePartner(partner)"
            class="rounded-md px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
          >
            Supprimer
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
