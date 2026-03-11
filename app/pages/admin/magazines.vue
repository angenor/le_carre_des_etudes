<script setup lang="ts">
definePageMeta({
  layout: 'admin',
})

interface Magazine {
  id: number
  name: string
  description: string
  version: string
  subtitle: string | null
  pdfPath: string
  coverImage: string | null
  coverImageOg: string | null
  publishedAt: string
  availableAt: string | null
  isFeatured: boolean
  createdAt: string
  updatedAt: string
}

const magazines = ref<Magazine[]>([])
const loading = ref(true)
const showForm = ref(false)
const editingMagazine = ref<Magazine | null>(null)
const saving = ref(false)
const errorMessage = ref('')
const pdfUploadProgress = ref(0)
const coverUploadProgress = ref(0)
const uploadingPdf = ref(false)
const uploadingCover = ref(false)
const MAX_FILE_SIZE = 150 * 1024 * 1024 // 150 Mo

const form = reactive({
  name: '',
  description: '',
  version: '',
  subtitle: '',
  pdfPath: '',
  coverImage: '',
  coverImageOg: '',
  publishedAt: '',
  availableAt: '',
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
  form.subtitle = ''
  form.pdfPath = ''
  form.coverImage = ''
  form.coverImageOg = ''
  form.publishedAt = ''
  form.availableAt = ''
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
  form.subtitle = magazine.subtitle || ''
  form.pdfPath = magazine.pdfPath
  form.coverImage = magazine.coverImage || ''
  form.coverImageOg = magazine.coverImageOg || ''
  form.publishedAt = magazine.publishedAt.slice(0, 10)
  form.availableAt = magazine.availableAt ? magazine.availableAt.slice(0, 16) : ''
  errorMessage.value = ''
  showForm.value = true
}

function cancelForm() {
  showForm.value = false
  resetForm()
}

function uploadFile(
  file: File,
  category: string,
  onProgress: (percent: number) => void,
): Promise<{ path: string; ogPath: string | null }> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    const formData = new FormData()
    formData.append('file', file)
    formData.append('category', category)

    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable) {
        onProgress(Math.round((e.loaded / e.total) * 100))
      }
    })

    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(JSON.parse(xhr.responseText))
      } else {
        reject(new Error(`Erreur HTTP ${xhr.status}`))
      }
    })

    xhr.addEventListener('error', () => reject(new Error('Erreur réseau')))
    xhr.open('POST', '/api/upload')
    xhr.send(formData)
  })
}

async function handlePdfUpload(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  if (file.size > MAX_FILE_SIZE) {
    errorMessage.value = 'Le fichier dépasse la taille maximale autorisée (150 Mo).'
    return
  }
  uploadingPdf.value = true
  pdfUploadProgress.value = 0
  try {
    const result = await uploadFile(file, 'magazines', (p) => {
      pdfUploadProgress.value = p
    })
    form.pdfPath = result.path
  } catch {
    errorMessage.value = 'Erreur lors de l\'envoi du PDF'
  } finally {
    uploadingPdf.value = false
  }
}

async function handleCoverUpload(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  if (file.size > MAX_FILE_SIZE) {
    errorMessage.value = 'Le fichier dépasse la taille maximale autorisée (150 Mo).'
    return
  }
  uploadingCover.value = true
  coverUploadProgress.value = 0
  try {
    const result = await uploadFile(file, 'magazines', (p) => {
      coverUploadProgress.value = p
    })
    form.coverImage = result.path
    form.coverImageOg = result.ogPath || ''
  } catch {
    errorMessage.value = 'Erreur lors de l\'envoi de la couverture'
  } finally {
    uploadingCover.value = false
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
          subtitle: form.subtitle || null,
          pdfPath: form.pdfPath,
          coverImage: form.coverImage || null,
          coverImageOg: form.coverImageOg || null,
          publishedAt: form.publishedAt,
          availableAt: form.availableAt || null,
        },
      })
    } else {
      await $fetch('/api/magazines', {
        method: 'POST',
        body: {
          name: form.name,
          description: form.description,
          version: form.version,
          subtitle: form.subtitle || null,
          pdfPath: form.pdfPath,
          coverImage: form.coverImage || null,
          coverImageOg: form.coverImageOg || null,
          publishedAt: form.publishedAt,
          availableAt: form.availableAt || null,
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

async function toggleFeatured(magazine: Magazine) {
  try {
    if (magazine.isFeatured) {
      await $fetch(`/api/magazines/${magazine.id}/featured`, { method: 'DELETE' })
    } else {
      await $fetch(`/api/magazines/${magazine.id}/featured`, { method: 'PUT' })
    }
    await fetchMagazines()
  } catch {
    errorMessage.value = 'Erreur lors de la mise à jour du statut à la une'
  } finally {
    openMenuId.value = null
  }
}

const openMenuId = ref<number | null>(null)

function toggleMenu(id: number) {
  openMenuId.value = openMenuId.value === id ? null : id
}

function handleClickOutside() {
  openMenuId.value = null
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})

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
          <label for="subtitle" class="block text-sm font-medium text-gray-700">Sous-titre (optionnel)</label>
          <input
            id="subtitle"
            v-model="form.subtitle"
            type="text"
            class="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            placeholder="Édition inaugurale"
          />
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

        <div class="grid gap-4 sm:grid-cols-2">
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
          <div>
            <label for="availableAt" class="block text-sm font-medium text-gray-700">Date de disponibilité (optionnel)</label>
            <input
              id="availableAt"
              v-model="form.availableAt"
              type="datetime-local"
              class="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>
        </div>

        <div class="grid gap-4 sm:grid-cols-2">
          <div>
            <label class="block text-sm font-medium text-gray-700">Fichier PDF</label>
            <input
              type="file"
              accept=".pdf"
              :disabled="uploadingPdf"
              class="mt-1 block w-full text-sm text-gray-500 file:mr-3 file:rounded-lg file:border-0 file:bg-emerald-50 file:px-3 file:py-2 file:text-sm file:font-medium file:text-emerald-700 hover:file:bg-emerald-100 disabled:opacity-50"
              @change="handlePdfUpload"
            />
            <div v-if="uploadingPdf" class="mt-2">
              <div class="flex items-center justify-between text-xs text-gray-600 mb-1">
                <span>Téléversement du PDF...</span>
                <span>{{ pdfUploadProgress }}%</span>
              </div>
              <div class="h-2 w-full overflow-hidden rounded-full bg-gray-200">
                <div
                  class="h-full rounded-full bg-emerald-500 transition-all duration-300"
                  :style="{ width: pdfUploadProgress + '%' }"
                />
              </div>
            </div>
            <p v-if="form.pdfPath && !uploadingPdf" class="mt-1 text-xs text-emerald-600">
              {{ form.pdfPath }}
            </p>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700">Image de couverture (optionnel)</label>
            <input
              type="file"
              accept="image/*"
              :disabled="uploadingCover"
              class="mt-1 block w-full text-sm text-gray-500 file:mr-3 file:rounded-lg file:border-0 file:bg-emerald-50 file:px-3 file:py-2 file:text-sm file:font-medium file:text-emerald-700 hover:file:bg-emerald-100 disabled:opacity-50"
              @change="handleCoverUpload"
            />
            <div v-if="uploadingCover" class="mt-2">
              <div class="flex items-center justify-between text-xs text-gray-600 mb-1">
                <span>Téléversement de l'image...</span>
                <span>{{ coverUploadProgress }}%</span>
              </div>
              <div class="h-2 w-full overflow-hidden rounded-full bg-gray-200">
                <div
                  class="h-full rounded-full bg-emerald-500 transition-all duration-300"
                  :style="{ width: coverUploadProgress + '%' }"
                />
              </div>
            </div>
            <p v-if="form.coverImage && !uploadingCover" class="mt-1 text-xs text-emerald-600">
              {{ form.coverImage }}
            </p>
          </div>
        </div>

        <div class="flex gap-3 pt-2">
          <button
            type="submit"
            :disabled="saving || !form.pdfPath || uploadingPdf || uploadingCover"
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
            <div class="flex items-center gap-2">
              <h3 class="font-semibold text-gray-900 truncate">
                {{ magazine.name }} — {{ magazine.version }}
              </h3>
              <span
                v-if="magazine.isFeatured"
                class="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700"
              >
                À la une
              </span>
            </div>
            <p class="text-sm text-gray-500 truncate">{{ magazine.description }}</p>
            <p class="text-xs text-gray-400">
              Publié le {{ formatDate(magazine.publishedAt) }}
            </p>
          </div>
        </div>
        <div class="relative shrink-0">
          <button
            @click.stop="toggleMenu(magazine.id)"
            class="rounded-md p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
          >
            <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 6.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5ZM12 12.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5ZM12 18.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5Z" />
            </svg>
          </button>
          <div
            v-if="openMenuId === magazine.id"
            class="absolute right-0 top-full z-10 mt-1 w-48 rounded-lg border border-gray-200 bg-white py-1 shadow-lg"
          >
            <button
              @click.stop="toggleFeatured(magazine)"
              class="flex w-full items-center gap-2 px-4 py-2 text-left text-sm transition-colors"
              :class="magazine.isFeatured ? 'text-amber-600 hover:bg-amber-50' : 'text-gray-700 hover:bg-gray-50'"
            >
              <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" />
              </svg>
              {{ magazine.isFeatured ? 'Retirer de la une' : 'Mettre à la une' }}
            </button>
            <button
              @click.stop="openMenuId = null; openEditForm(magazine)"
              class="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
              </svg>
              Modifier
            </button>
            <div class="my-1 h-px bg-gray-100" />
            <button
              @click.stop="openMenuId = null; deleteMagazine(magazine)"
              class="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 transition-colors"
            >
              <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
              </svg>
              Supprimer
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
