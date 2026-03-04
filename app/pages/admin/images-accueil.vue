<script setup lang="ts">
definePageMeta({
  layout: 'admin',
})

interface HomepageImages {
  hero_desktop: string
  hero_mobile: string
}

const images = ref<HomepageImages>({ hero_desktop: '', hero_mobile: '' })
const loading = ref(true)
const saving = ref<string | null>(null)
const errorMessage = ref('')
const successMessage = ref('')

async function fetchImages() {
  loading.value = true
  try {
    images.value = await $fetch<HomepageImages>('/api/homepage-images')
  } catch {
    errorMessage.value = 'Erreur lors du chargement des images'
  } finally {
    loading.value = false
  }
}

async function uploadImage(event: Event, slug: 'hero_desktop' | 'hero_mobile') {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  // Vérifier la taille du fichier (avertissement au-delà de 500 Ko)
  const fileSizeKo = file.size / 1024
  if (fileSizeKo > 500) {
    const confirmer = confirm(
      `Cette image fait ${Math.round(fileSizeKo)} Ko, ce qui dépasse les 500 Ko recommandés.\n\nCela pourrait affecter l'expérience des utilisateurs avec une connexion lente.\n\nVoulez-vous continuer ?`
    )
    if (!confirmer) {
      input.value = ''
      return
    }
  }

  saving.value = slug
  errorMessage.value = ''
  successMessage.value = ''

  try {
    // 1. Upload du fichier
    const formData = new FormData()
    formData.append('file', file)
    formData.append('category', 'homepage')
    const result = await $fetch<{ path: string }>('/api/upload', {
      method: 'POST',
      body: formData,
    })

    // 2. Mise à jour en base
    await $fetch(`/api/homepage-images/${slug}`, {
      method: 'PUT',
      body: { imagePath: result.path },
    })

    images.value[slug] = result.path
    successMessage.value = 'Image mise à jour avec succès !'
    setTimeout(() => { successMessage.value = '' }, 3000)
  } catch {
    errorMessage.value = "Erreur lors de l'envoi de l'image"
  } finally {
    saving.value = null
    input.value = ''
  }
}

onMounted(fetchImages)
</script>

<template>
  <div>
    <h1 class="text-2xl font-bold text-gray-900 mb-6">Images de la page d'accueil</h1>

    <!-- Avertissement poids des images -->
    <div class="mb-6 rounded-lg border border-amber-200 bg-amber-50 p-4">
      <div class="flex gap-3">
        <svg class="h-6 w-6 shrink-0 text-amber-500" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
        </svg>
        <div>
          <p class="font-semibold text-amber-800">Attention au poids des images</p>
          <p class="mt-1 text-sm text-amber-700">
            Privilégiez des images de <strong>moins de 500 Ko</strong> pour ne pas affecter
            l'expérience des utilisateurs ayant une connexion limitée.
            Pensez à compresser vos images avant de les charger
            (par exemple via <a href="https://tinypng.com" target="_blank" class="underline hover:text-amber-900">tinypng.com</a>).
          </p>
          <ul class="mt-2 text-sm text-amber-700 list-disc list-inside space-y-1">
            <li><strong>Grand format</strong> : dimensions recommandées 1920×1080 px (paysage)</li>
            <li><strong>Petit format</strong> : dimensions recommandées 750×1000 px (portrait)</li>
          </ul>
        </div>
      </div>
    </div>

    <!-- Messages -->
    <div v-if="errorMessage" class="mb-4 rounded-lg bg-red-50 p-4 text-sm text-red-700">
      {{ errorMessage }}
      <button @click="errorMessage = ''" class="ml-2 font-medium underline">Fermer</button>
    </div>
    <div v-if="successMessage" class="mb-4 rounded-lg bg-green-50 p-4 text-sm text-green-700">
      {{ successMessage }}
    </div>

    <!-- Chargement -->
    <div v-if="loading" class="py-12 text-center text-gray-500">Chargement...</div>

    <!-- Cartes des images -->
    <div v-else class="grid gap-6 lg:grid-cols-2">
      <!-- Grand format (desktop) -->
      <div class="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
        <h2 class="text-lg font-semibold text-gray-900 mb-1">Grand format</h2>
        <p class="text-sm text-gray-500">Image affichée sur PC et tablettes (plein écran, paysage)</p>
        <p class="text-xs text-amber-600 font-medium mb-4">Dimensions recommandées : 1920 × 1080 px</p>

        <div class="relative mb-4 overflow-hidden rounded-lg bg-gray-100 aspect-video">
          <img
            v-if="images.hero_desktop"
            :src="images.hero_desktop"
            alt="Aperçu grand format"
            class="h-full w-full object-cover"
          />
          <div v-else class="flex h-full items-center justify-center text-gray-400">
            Aucune image
          </div>
          <div v-if="saving === 'hero_desktop'" class="absolute inset-0 flex items-center justify-center bg-black/40">
            <span class="text-sm font-medium text-white">Envoi en cours...</span>
          </div>
        </div>

        <label class="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 transition-colors">
          <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
          </svg>
          Changer l'image
          <input
            type="file"
            accept="image/*"
            class="hidden"
            :disabled="saving !== null"
            @change="uploadImage($event, 'hero_desktop')"
          />
        </label>
      </div>

      <!-- Petit format (mobile) -->
      <div class="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
        <h2 class="text-lg font-semibold text-gray-900 mb-1">Petit format</h2>
        <p class="text-sm text-gray-500">Image affichée sur téléphones (portrait)</p>
        <p class="text-xs text-amber-600 font-medium mb-4">Dimensions recommandées : 750 × 1000 px</p>

        <div class="relative mb-4 overflow-hidden rounded-lg bg-gray-100 aspect-[3/4] max-h-80 mx-auto">
          <img
            v-if="images.hero_mobile"
            :src="images.hero_mobile"
            alt="Aperçu petit format"
            class="h-full w-full object-cover"
          />
          <div v-else class="flex h-full items-center justify-center text-gray-400">
            Aucune image
          </div>
          <div v-if="saving === 'hero_mobile'" class="absolute inset-0 flex items-center justify-center bg-black/40">
            <span class="text-sm font-medium text-white">Envoi en cours...</span>
          </div>
        </div>

        <label class="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 transition-colors">
          <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
          </svg>
          Changer l'image
          <input
            type="file"
            accept="image/*"
            class="hidden"
            :disabled="saving !== null"
            @change="uploadImage($event, 'hero_mobile')"
          />
        </label>
      </div>
    </div>
  </div>
</template>
