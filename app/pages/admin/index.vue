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
  <div class="min-h-screen bg-gray-100">
    <header class="bg-white shadow-sm">
      <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 rounded bg-emerald-600 text-white flex items-center justify-center text-sm font-bold">
            CE
          </div>
          <h1 class="text-lg font-bold text-gray-900">Administration</h1>
        </div>
        <button
          @click="logout"
          class="text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          Déconnexion
        </button>
      </div>
    </header>

    <main class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h2 class="text-xl font-semibold text-gray-800 mb-6">Tableau de bord</h2>

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
    </main>
  </div>
</template>
