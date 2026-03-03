<script setup lang="ts">
definePageMeta({
  layout: 'admin',
})

const sections = [
  {
    title: 'Magazines',
    description: 'Gérer les numéros du magazine (ajout, modification, suppression)',
    link: '/admin/magazines',
    icon: '📰',
  },
  {
    title: 'Rubriques',
    description: 'Gérer les contenus éditoriaux (Portrait, Parcours Inspirant, En Vedette)',
    link: '/admin/rubriques',
    icon: '✏️',
  },
  {
    title: 'Partenaires',
    description: 'Gérer les partenaires (logos, noms, liens)',
    link: '/admin/partenaires',
    icon: '🤝',
  },
]
</script>

<template>
  <div>
    <h1 class="text-xl font-semibold text-gray-800 mb-6">Tableau de bord</h1>

    <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <NuxtLink
        v-for="section in sections"
        :key="section.link"
        :to="section.link"
        class="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow border border-gray-200"
      >
        <div class="text-3xl mb-3">{{ section.icon }}</div>
        <h3 class="text-lg font-semibold text-gray-900 mb-1">{{ section.title }}</h3>
        <p class="text-sm text-gray-500">{{ section.description }}</p>
      </NuxtLink>
    </div>
  </div>
</template>
