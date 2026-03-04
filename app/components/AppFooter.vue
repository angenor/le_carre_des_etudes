<script setup lang="ts">
const currentYear = new Date().getFullYear()
</script>

<template>
  <footer class="bg-gray-900 text-gray-300">
    <div class="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div class="grid gap-10 md:grid-cols-3">
        <!-- Colonne 1 : Magazine -->
        <div>
          <h2 class="text-xl font-bold tracking-tight text-white">
            Le Carré des Études
          </h2>
          <p class="mt-3 text-sm leading-relaxed text-gray-400">
            « Le Carré des Études » est un magazine ivoirien pensé pour les étudiants, avec pour mission principale de guider, informer et inspirer la jeunesse estudiantine de Côte d'Ivoire.
          </p>
        </div>

        <!-- Colonne 2 : Contact -->
        <div>
          <h3 class="text-sm font-semibold uppercase tracking-wider text-white">
            Contact
          </h3>
          <ul class="mt-3 space-y-2 text-sm text-gray-400">
            <li class="flex items-start gap-2">
              <svg class="mt-0.5 size-4 shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" /><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" /></svg>
              Abidjan Riviera FAYA, 03 BP 2517 ABIDJAN 03
            </li>
            <li class="flex items-start gap-2">
              <svg class="mt-0.5 size-4 shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z" /></svg>
              <span>
                (+225) 07 68 01 14 09<br>
                01 02 09 63 71<br>
                27 22 40 98 18
              </span>
            </li>
            <li class="flex items-start gap-2">
              <svg class="mt-0.5 size-4 shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" /></svg>
              <a href="mailto:contact@sucreycorporates.com" class="transition hover:text-white">contact@sucreycorporates.com</a>
            </li>
            <li class="flex items-start gap-2">
              <svg class="mt-0.5 size-4 shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>
              08:00 – 17:00
            </li>
          </ul>
        </div>

        <!-- Colonne 3 : Liens rapides -->
        <div>
          <h3 class="text-sm font-semibold uppercase tracking-wider text-white">
            Liens rapides
          </h3>
          <ul class="mt-3 space-y-2 text-sm text-gray-400">
            <li><NuxtLink to="/" class="transition hover:text-white">Accueil</NuxtLink></li>
            <li><NuxtLink to="/rubriques" class="transition hover:text-white">Rubriques</NuxtLink></li>
            <li><NuxtLink to="/a-propos" class="transition hover:text-white">À propos</NuxtLink></li>
            <li><NuxtLink to="/contact" class="transition hover:text-white">Contact</NuxtLink></li>
          </ul>
        </div>
      </div>

      <!-- Séparateur + Copyright -->
      <div class="mt-10 border-t border-gray-800 pt-6 text-center text-xs text-gray-500">
        &copy; {{ currentYear }} Le Carré des Études. Tous droits réservés.
      </div>
    </div>
  </footer>
</template>
