<script setup lang="ts">
const currentYear = new Date().getFullYear()
</script>

<template>
  <footer class="bg-gray-900 text-gray-300">
    <div class="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div class="flex flex-col items-center text-center">
        <!-- Nom du magazine -->
        <h2 class="text-2xl font-bold tracking-tight text-white">
          Le Carré des Études
        </h2>

        <!-- Tagline -->
        <p class="mt-3 max-w-md text-sm leading-relaxed text-gray-400">
          Guider, Informer, Inspirer la communauté estudiantine de Côte d'Ivoire
        </p>

        <!-- Séparateur -->
        <div class="mt-8 h-px w-16 bg-gray-700" />

        <!-- Copyright -->
        <p class="mt-8 text-xs text-gray-500">
          &copy; {{ currentYear }} Le Carré des Études. Tous droits réservés.
        </p>
      </div>
    </div>
  </footer>
</template>
