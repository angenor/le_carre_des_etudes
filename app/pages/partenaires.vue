<script setup lang="ts">
interface Partner {
  id: number
  name: string
  logoPath: string
  url: string | null
  order: number
}

const { data: partners, status } = useFetch<Partner[]>('/api/partenaires')

useHead({
  title: 'Partenaires — Le Carré des Études',
})
</script>

<template>
  <div class="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
    <div class="text-center mb-12">
      <h1 class="text-3xl font-bold text-gray-900 sm:text-4xl">Nos partenaires</h1>
      <p class="mt-4 text-lg text-gray-600">
        Les organisations qui soutiennent Le Carré des Études
      </p>
    </div>

    <!-- Chargement -->
    <div v-if="status === 'pending'" class="py-16 text-center text-gray-500">
      Chargement des partenaires...
    </div>

    <!-- État vide -->
    <div v-else-if="!partners?.length" class="py-16 text-center">
      <p class="text-lg text-gray-500">Pas encore de partenaires.</p>
      <p class="mt-2 text-sm text-gray-400">Revenez bientôt pour découvrir nos partenaires.</p>
    </div>

    <!-- Grille de partenaires -->
    <div v-else class="grid gap-6 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
      <PartnerLogo
        v-for="partner in partners"
        :key="partner.id"
        :id="partner.id"
        :name="partner.name"
        :logo-path="partner.logoPath"
        :url="partner.url"
      />
    </div>
  </div>
</template>
