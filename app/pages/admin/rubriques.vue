<script setup lang="ts">
definePageMeta({
  layout: 'admin',
})

interface Magazine {
  id: number
  name: string
  version: string
  slug: string
}

interface ContentItem {
  id: number
  type: string
  title: string
  description: string
  content: string | null
  subtitle: string | null
  eventDate: string | null
  eventLocation: string | null
  imagePath: string
  order: number
  magazineId: number | null
  magazine: { id: number; slug: string; name: string } | null
  createdAt: string
  updatedAt: string
}

const TYPES = [
  { value: 'parcours_inspirant', label: 'Parcours Inspirant' },
  { value: 'en_vedette', label: 'En Vedette' },
  { value: 'agenda_et_opportunites', label: 'Agenda & Opportunités' },
  { value: 'focus', label: 'Focus' },
]

const items = ref<ContentItem[]>([])
const magazines = ref<Magazine[]>([])
const loading = ref(true)
const showForm = ref(false)
const editingItem = ref<ContentItem | null>(null)
const saving = ref(false)
const errorMessage = ref('')
const showAdvanced = ref(false)

const form = reactive({
  type: 'parcours_inspirant',
  title: '',
  description: '',
  content: '',
  subtitle: '',
  eventDate: '',
  eventLocation: '',
  imagePath: '',
  order: 0,
  magazineId: null as number | null,
})

async function fetchItems() {
  loading.value = true
  try {
    const [grouped, mags] = await Promise.all([
      $fetch<Record<string, ContentItem[]>>('/api/rubriques'),
      $fetch<Magazine[]>('/api/magazines'),
    ])
    items.value = Object.values(grouped).flat().sort((a, b) => {
      if (a.type !== b.type) return a.type.localeCompare(b.type)
      return a.order - b.order
    })
    magazines.value = mags
  } catch {
    errorMessage.value = 'Erreur lors du chargement des rubriques'
  } finally {
    loading.value = false
  }
}

function resetForm() {
  form.type = 'parcours_inspirant'
  form.title = ''
  form.description = ''
  form.content = ''
  form.subtitle = ''
  form.eventDate = ''
  form.eventLocation = ''
  form.imagePath = ''
  form.order = 0
  form.magazineId = null
  editingItem.value = null
  errorMessage.value = ''
  showAdvanced.value = false
}

function openCreateForm() {
  resetForm()
  showForm.value = true
}

function openEditForm(item: ContentItem) {
  editingItem.value = item
  form.type = item.type
  form.title = item.title
  form.description = item.description
  form.content = item.content ?? ''
  form.subtitle = item.subtitle ?? ''
  form.eventDate = item.eventDate ? item.eventDate.slice(0, 10) : ''
  form.eventLocation = item.eventLocation ?? ''
  form.imagePath = item.imagePath
  form.order = item.order
  form.magazineId = item.magazineId
  errorMessage.value = ''
  // Afficher les champs avancés si des données existent
  showAdvanced.value = !!(item.title || item.description || item.content || item.subtitle || item.eventDate || item.eventLocation)
  showForm.value = true
}

function cancelForm() {
  showForm.value = false
  resetForm()
}

async function uploadImage(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  try {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('category', 'rubriques')
    const result = await $fetch<{ path: string }>('/api/upload', {
      method: 'POST',
      body: formData,
    })
    form.imagePath = result.path
  } catch {
    errorMessage.value = "Erreur lors de l'envoi de l'image"
  }
}

async function saveItem() {
  saving.value = true
  errorMessage.value = ''

  try {
    const payload: Record<string, unknown> = {
      type: form.type,
      imagePath: form.imagePath,
      order: form.order,
      magazineId: form.magazineId || null,
      title: form.title || '',
      description: form.description || '',
      content: form.content || null,
    }

    if (form.type === 'parcours_inspirant') {
      payload.subtitle = form.subtitle || null
    }
    if (form.type === 'agenda_et_opportunites') {
      payload.eventDate = form.eventDate || null
      payload.eventLocation = form.eventLocation || null
    }

    if (editingItem.value) {
      await $fetch(`/api/rubriques/${editingItem.value.id}`, {
        method: 'PUT',
        body: payload,
      })
    } else {
      await $fetch('/api/rubriques', {
        method: 'POST',
        body: payload,
      })
    }
    showForm.value = false
    resetForm()
    await fetchItems()
  } catch (err: unknown) {
    const error = err as { data?: { message?: string } }
    errorMessage.value = error?.data?.message || 'Erreur lors de la sauvegarde'
  } finally {
    saving.value = false
  }
}

async function deleteItem(item: ContentItem) {
  if (!confirm(`Supprimer cette rubrique ?`)) return

  try {
    await $fetch(`/api/rubriques/${item.id}`, { method: 'DELETE' })
    await fetchItems()
  } catch {
    errorMessage.value = 'Erreur lors de la suppression'
  }
}

function typeLabel(type: string): string {
  return TYPES.find((t) => t.value === type)?.label ?? type
}

function typeBadgeClass(type: string): string {
  switch (type) {
    case 'parcours_inspirant': return 'bg-amber-100 text-amber-700'
    case 'en_vedette': return 'bg-purple-100 text-purple-700'
    case 'agenda_et_opportunites': return 'bg-orange-100 text-orange-700'
    case 'focus': return 'bg-blue-100 text-blue-700'
    default: return 'bg-gray-100 text-gray-700'
  }
}

onMounted(fetchItems)
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
        {{ editingItem ? 'Modifier la rubrique' : 'Nouvelle rubrique' }}
      </h2>

      <form class="space-y-4" @submit.prevent="saveItem">
        <!-- Champs essentiels -->
        <div class="grid gap-4 sm:grid-cols-2">
          <div>
            <label for="type" class="block text-sm font-medium text-gray-700">Type</label>
            <select
              id="type"
              v-model="form.type"
              required
              class="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <option v-for="t in TYPES" :key="t.value" :value="t.value">
                {{ t.label }}
              </option>
            </select>
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
          <label class="block text-sm font-medium text-gray-700">Image</label>
          <input
            type="file"
            accept="image/*"
            class="mt-1 block w-full text-sm text-gray-500 file:mr-3 file:rounded-lg file:border-0 file:bg-emerald-50 file:px-3 file:py-2 file:text-sm file:font-medium file:text-emerald-700 hover:file:bg-emerald-100"
            @change="uploadImage"
          />
          <p v-if="form.imagePath" class="mt-1 text-xs text-emerald-600">
            {{ form.imagePath }}
          </p>
        </div>

        <!-- Sélection du magazine -->
        <div>
          <label for="magazineId" class="block text-sm font-medium text-gray-700">Magazine associé</label>
          <select
            id="magazineId"
            v-model="form.magazineId"
            class="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
            <option :value="null">— Aucun magazine —</option>
            <option v-for="mag in magazines" :key="mag.id" :value="mag.id">
              {{ mag.name }} — {{ mag.version }}
            </option>
          </select>
        </div>

        <!-- Toggle champs avancés -->
        <div class="border-t border-gray-200 pt-4">
          <button
            type="button"
            class="inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors"
            @click="showAdvanced = !showAdvanced"
          >
            <svg
              class="h-4 w-4 transition-transform"
              :class="showAdvanced ? 'rotate-90' : ''"
              fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"
            >
              <path stroke-linecap="round" stroke-linejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
            </svg>
            {{ showAdvanced ? 'Masquer' : 'Afficher' }} les champs avancés
          </button>
        </div>

        <!-- Champs avancés -->
        <template v-if="showAdvanced">
          <div>
            <label for="title" class="block text-sm font-medium text-gray-700">Titre</label>
            <input
              id="title"
              v-model="form.title"
              type="text"
              class="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              placeholder="Titre de la rubrique (optionnel)"
            />
          </div>

          <div>
            <label for="description" class="block text-sm font-medium text-gray-700">Description (résumé court)</label>
            <textarea
              id="description"
              v-model="form.description"
              rows="3"
              class="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              placeholder="Résumé court de la rubrique... (optionnel)"
            ></textarea>
          </div>

          <!-- Sous-titre (Parcours Inspirant uniquement) -->
          <div v-if="form.type === 'parcours_inspirant'">
            <label for="subtitle" class="block text-sm font-medium text-gray-700">Sous-titre (nom/titre de la personne)</label>
            <input
              id="subtitle"
              v-model="form.subtitle"
              type="text"
              class="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              placeholder="Ex : Par Sucrey Corporates"
            />
          </div>

          <!-- Date et lieu (Agenda & Opportunités uniquement) -->
          <div v-if="form.type === 'agenda_et_opportunites'" class="grid gap-4 sm:grid-cols-2">
            <div>
              <label for="eventDate" class="block text-sm font-medium text-gray-700">Date de l'événement</label>
              <input
                id="eventDate"
                v-model="form.eventDate"
                type="date"
                class="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label for="eventLocation" class="block text-sm font-medium text-gray-700">Lieu</label>
              <input
                id="eventLocation"
                v-model="form.eventLocation"
                type="text"
                class="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                placeholder="Ex : Noom Hotel, Abidjan Plateau"
              />
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700">Contenu riche (corps de l'article)</label>
            <div class="mt-1 rounded-lg border border-gray-300 overflow-hidden">
              <ClientOnly>
                <ToastEditor v-model="form.content" height="350px" />
              </ClientOnly>
            </div>
            <p class="mt-1 text-xs text-gray-400">Optionnel. Utilisez l'éditeur pour formater le contenu avec titres, gras, listes, images...</p>
          </div>
        </template>

        <div class="flex gap-3 pt-2">
          <button
            type="submit"
            :disabled="saving || !form.imagePath"
            class="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {{ saving ? 'Enregistrement...' : (editingItem ? 'Mettre à jour' : 'Créer') }}
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
        {{ items.length }} rubrique{{ items.length > 1 ? 's' : '' }}
      </h2>
      <button
        @click="openCreateForm"
        class="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
      >
        + Ajouter une rubrique
      </button>
    </div>

    <!-- Chargement -->
    <div v-if="loading" class="py-12 text-center text-gray-500">
      Chargement...
    </div>

    <!-- Liste vide -->
    <div v-else-if="!items.length && !showForm" class="py-12 text-center">
      <p class="text-gray-500">Aucune rubrique pour le moment.</p>
      <button
        @click="openCreateForm"
        class="mt-3 text-sm font-medium text-emerald-600 hover:text-emerald-700"
      >
        Ajouter la première rubrique
      </button>
    </div>

    <!-- Liste des rubriques -->
    <div v-else-if="!showForm" class="space-y-4">
      <div
        v-for="item in items"
        :key="item.id"
        class="flex items-center justify-between gap-4 rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
      >
        <div class="flex items-center gap-4 min-w-0">
          <div class="h-16 w-12 shrink-0 overflow-hidden rounded bg-gray-100">
            <img
              :src="item.imagePath"
              alt="Rubrique"
              class="h-full w-full object-cover"
            />
          </div>
          <div class="min-w-0">
            <div class="flex items-center gap-2">
              <span
                class="inline-block rounded-full px-2 py-0.5 text-xs font-medium"
                :class="typeBadgeClass(item.type)"
              >
                {{ typeLabel(item.type) }}
              </span>
              <span class="text-xs text-gray-400">Ordre: {{ item.order }}</span>
            </div>
            <p v-if="item.magazine" class="mt-1 text-xs text-gray-500">
              {{ item.magazine.name }} — {{ item.magazine.slug }}
            </p>
            <p v-if="item.title" class="mt-0.5 text-sm font-medium text-gray-900 truncate">
              {{ item.title }}
            </p>
          </div>
        </div>
        <div class="flex shrink-0 gap-2">
          <button
            @click="openEditForm(item)"
            class="rounded-md px-3 py-1.5 text-sm font-medium text-emerald-600 hover:bg-emerald-50 transition-colors"
          >
            Modifier
          </button>
          <button
            @click="deleteItem(item)"
            class="rounded-md px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
          >
            Supprimer
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
