<script setup lang="ts">
useHead({
  title: 'Nos magazines — Le Carré des Études',
})

interface Magazine {
  id: number
  name: string
  description: string
  version: string
  pdfPath: string | null
  coverImage: string | null
  publishedAt: string
}

const { data: magazines, status } = useFetch<Magazine[]>('/api/magazines')

const selectedMagazine = ref<Magazine | null>(null)

function openDownloadModal(magazineId: number) {
  const magazine = magazines.value?.find((m) => m.id === magazineId)
  if (magazine) {
    selectedMagazine.value = magazine
  }
}

function closeDownloadModal() {
  selectedMagazine.value = null
}
</script>

<template>
  <div>
    <section class="bg-emerald-700 py-12 sm:py-16">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h1 class="text-3xl font-bold text-white sm:text-4xl">
          Nos magazines
        </h1>
        <p class="mt-3 max-w-2xl text-base text-emerald-100 sm:text-lg">
          Téléchargez gratuitement les numéros du Carré des Études.
          Remplissez un court formulaire pour accéder au PDF.
        </p>
      </div>
    </section>

    <section class="py-12 sm:py-16">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <!-- Chargement -->
        <div v-if="status === 'pending'" class="text-center py-12">
          <p class="text-gray-500">Chargement des magazines...</p>
        </div>

        <!-- Liste vide -->
        <div v-else-if="!magazines?.length" class="text-center py-12">
          <div class="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
            <svg class="h-8 w-8 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
            </svg>
          </div>
          <h2 class="mt-4 text-lg font-semibold text-gray-900">Aucun magazine disponible</h2>
          <p class="mt-2 text-sm text-gray-500">
            Les prochains numéros du Carré des Études seront bientôt disponibles.
          </p>
        </div>

        <!-- Grille de magazines -->
        <div v-else class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <MagazineCard
            v-for="magazine in magazines"
            :key="magazine.id"
            :id="magazine.id"
            :name="magazine.name"
            :description="magazine.description"
            :version="magazine.version"
            :cover-image="magazine.coverImage"
            :published-at="magazine.publishedAt"
            :pdf-path="magazine.pdfPath"
            @download="openDownloadModal"
          />
        </div>
      </div>
    </section>

    <!-- Modale de téléchargement -->
    <DownloadModal
      v-if="selectedMagazine"
      :magazine-id="selectedMagazine.id"
      :magazine-name="`${selectedMagazine.name} — ${selectedMagazine.version}`"
      @close="closeDownloadModal"
    />
  </div>
</template>
