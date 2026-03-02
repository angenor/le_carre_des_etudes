<script setup lang="ts">
definePageMeta({
  layout: false,
})

const { isLoggedIn, logout } = useAdmin()

watchEffect(() => {
  if (!isLoggedIn.value) {
    navigateTo('/admin/login')
  }
})

interface Magazine {
  id: number
  name: string
  description: string
  version: string
  pdfPath: string
  coverImage: string | null
  publishedAt: string
  createdAt: string
  updatedAt: string
}

const magazines = ref<Magazine[]>([])
const loading = ref(true)
const showForm = ref(false)
const editingMagazine = ref<Magazine | null>(null)
const saving = ref(false)
const errorMessage = ref('')

const form = reactive({
  name: '',
  description: '',
  version: '',
  pdfPath: '',
  coverImage: '',
  publishedAt: '',
})

async function fetchMagazines() {
  loading.value = true
  try {
    magazines.value = await $fetch<Magazine[]>('/api/magazines')
  } catch {
    errorMessage.value = 'Erreur lors du chargement des magazines'
  } finally {
    loading.value = false
  }
}

function resetForm() {
  form.name = ''
  form.description = ''
  form.version = ''
  form.pdfPath = ''
  form.coverImage = ''
  form.publishedAt = ''
  editingMagazine.value = null
  errorMessage.value = ''
}

function openCreateForm() {
  resetForm()
  showForm.value = true
}

function openEditForm(magazine: Magazine) {
  editingMagazine.value = magazine
  form.name = magazine.name
  form.description = magazine.description
  form.version = magazine.version
  form.pdfPath = magazine.pdfPath
  form.coverImage = magazine.coverImage || ''
  form.publishedAt = magazine.publishedAt.slice(0, 10)
  errorMessage.value = ''
  showForm.value = true
}

function cancelForm() {
  showForm.value = false
  resetForm()
}

async function uploadFile(file: File, category: string): Promise<string> {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('category', category)
  const result = await $fetch<{ path: string }>('/api/upload', {
    method: 'POST',
    body: formData,
  })
  return result.path
}

async function handlePdfUpload(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  try {
    form.pdfPath = await uploadFile(file, 'magazines')
  } catch {
    errorMessage.value = 'Erreur lors de l\'envoi du PDF'
  }
}

async function handleCoverUpload(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  try {
    form.coverImage = await uploadFile(file, 'magazines')
  } catch {
    errorMessage.value = 'Erreur lors de l\'envoi de la couverture'
  }
}

async function saveMagazine() {
  saving.value = true
  errorMessage.value = ''

  try {
    if (editingMagazine.value) {
      await $fetch(`/api/magazines/${editingMagazine.value.id}`, {
        method: 'PUT',
        body: {
          name: form.name,
          description: form.description,
          version: form.version,
          pdfPath: form.pdfPath,
          coverImage: form.coverImage || null,
          publishedAt: form.publishedAt,
        },
      })
    } else {
      await $fetch('/api/magazines', {
        method: 'POST',
        body: {
          name: form.name,
          description: form.description,
          version: form.version,
          pdfPath: form.pdfPath,
          coverImage: form.coverImage || null,
          publishedAt: form.publishedAt,
        },
      })
    }
    showForm.value = false
    resetForm()
    await fetchMagazines()
  } catch (err: unknown) {
    const error = err as { data?: { message?: string } }
    errorMessage.value = error?.data?.message || 'Erreur lors de la sauvegarde'
  } finally {
    saving.value = false
  }
}

async function deleteMagazine(magazine: Magazine) {
  if (!confirm(`Supprimer "${magazine.name} — ${magazine.version}" ?`)) return

  try {
    await $fetch(`/api/magazines/${magazine.id}`, { method: 'DELETE' })
    await fetchMagazines()
  } catch {
    errorMessage.value = 'Erreur lors de la suppression'
  }
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

onMounted(fetchMagazines)
</script>

<template>
  <div class="min-h-screen bg-gray-100">
    <header class="bg-white shadow-sm">
      <div class="mx-auto max-w-5xl px-4 py-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <NuxtLink
              to="/admin"
              class="text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              &larr; Tableau de bord
            </NuxtLink>
            <span class="text-gray-300">|</span>
            <h1 class="text-lg font-bold text-gray-900">Magazines</h1>
          </div>
          <button
            @click="logout"
            class="text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            Déconnexion
          </button>
        </div>
      </div>
    </header>

    <main class="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
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
          {{ editingMagazine ? 'Modifier le magazine' : 'Nouveau magazine' }}
        </h2>

        <form class="space-y-4" @submit.prevent="saveMagazine">
          <div class="grid gap-4 sm:grid-cols-2">
            <div>
              <label for="name" class="block text-sm font-medium text-gray-700">Nom</label>
              <input
                id="name"
                v-model="form.name"
                type="text"
                required
                class="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                placeholder="Le Carré des Études"
              />
            </div>
            <div>
              <label for="version" class="block text-sm font-medium text-gray-700">Version</label>
              <input
                id="version"
                v-model="form.version"
                type="text"
                required
                class="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                placeholder="N°1"
              />
            </div>
          </div>

          <div>
            <label for="description" class="block text-sm font-medium text-gray-700">Description</label>
            <textarea
              id="description"
              v-model="form.description"
              required
              rows="3"
              class="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              placeholder="Description du numéro..."
            ></textarea>
          </div>

          <div>
            <label for="publishedAt" class="block text-sm font-medium text-gray-700">Date de publication</label>
            <input
              id="publishedAt"
              v-model="form.publishedAt"
              type="date"
              required
              class="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          <div class="grid gap-4 sm:grid-cols-2">
            <div>
              <label class="block text-sm font-medium text-gray-700">Fichier PDF</label>
              <input
                type="file"
                accept=".pdf"
                class="mt-1 block w-full text-sm text-gray-500 file:mr-3 file:rounded-lg file:border-0 file:bg-emerald-50 file:px-3 file:py-2 file:text-sm file:font-medium file:text-emerald-700 hover:file:bg-emerald-100"
                @change="handlePdfUpload"
              />
              <p v-if="form.pdfPath" class="mt-1 text-xs text-emerald-600">
                {{ form.pdfPath }}
              </p>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700">Image de couverture (optionnel)</label>
              <input
                type="file"
                accept="image/*"
                class="mt-1 block w-full text-sm text-gray-500 file:mr-3 file:rounded-lg file:border-0 file:bg-emerald-50 file:px-3 file:py-2 file:text-sm file:font-medium file:text-emerald-700 hover:file:bg-emerald-100"
                @change="handleCoverUpload"
              />
              <p v-if="form.coverImage" class="mt-1 text-xs text-emerald-600">
                {{ form.coverImage }}
              </p>
            </div>
          </div>

          <div class="flex gap-3 pt-2">
            <button
              type="submit"
              :disabled="saving || !form.pdfPath"
              class="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {{ saving ? 'Enregistrement...' : (editingMagazine ? 'Mettre à jour' : 'Créer') }}
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
          {{ magazines.length }} magazine{{ magazines.length > 1 ? 's' : '' }}
        </h2>
        <button
          @click="openCreateForm"
          class="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
        >
          + Ajouter un magazine
        </button>
      </div>

      <!-- Chargement -->
      <div v-if="loading" class="py-12 text-center text-gray-500">
        Chargement...
      </div>

      <!-- Liste vide -->
      <div v-else-if="!magazines.length && !showForm" class="py-12 text-center">
        <p class="text-gray-500">Aucun magazine pour le moment.</p>
        <button
          @click="openCreateForm"
          class="mt-3 text-sm font-medium text-emerald-600 hover:text-emerald-700"
        >
          Ajouter le premier magazine
        </button>
      </div>

      <!-- Liste des magazines -->
      <div v-else-if="!showForm" class="space-y-4">
        <div
          v-for="magazine in magazines"
          :key="magazine.id"
          class="flex items-center justify-between gap-4 rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
        >
          <div class="flex items-center gap-4 min-w-0">
            <div
              v-if="magazine.coverImage"
              class="h-16 w-12 shrink-0 overflow-hidden rounded bg-gray-100"
            >
              <img
                :src="magazine.coverImage"
                :alt="`Couverture ${magazine.version}`"
                class="h-full w-full object-cover"
              />
            </div>
            <div
              v-else
              class="flex h-16 w-12 shrink-0 items-center justify-center rounded bg-emerald-50 text-xs font-bold text-emerald-600"
            >
              {{ magazine.version }}
            </div>
            <div class="min-w-0">
              <h3 class="font-semibold text-gray-900 truncate">
                {{ magazine.name }} — {{ magazine.version }}
              </h3>
              <p class="text-sm text-gray-500 truncate">{{ magazine.description }}</p>
              <p class="text-xs text-gray-400">
                Publié le {{ formatDate(magazine.publishedAt) }}
              </p>
            </div>
          </div>
          <div class="flex shrink-0 gap-2">
            <button
              @click="openEditForm(magazine)"
              class="rounded-md px-3 py-1.5 text-sm font-medium text-emerald-600 hover:bg-emerald-50 transition-colors"
            >
              Modifier
            </button>
            <button
              @click="deleteMagazine(magazine)"
              class="rounded-md px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
            >
              Supprimer
            </button>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>
