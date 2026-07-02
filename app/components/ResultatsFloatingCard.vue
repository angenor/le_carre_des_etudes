<script setup lang="ts">
// -------------------------------------------------------------------------
// Fenêtre flottante « À la une » — renvoie vers la page des résultats.
// Composant éphémère (ADMISSION TEST 2026).
// -------------------------------------------------------------------------
const STORAGE_KEY = 'alaune-admission-test-2026-ferme'

const visible = ref(false)

onMounted(() => {
  // Ne pas réafficher si l'utilisateur a fermé la carte pendant la session.
  if (sessionStorage.getItem(STORAGE_KEY) === '1') return
  // Petite temporisation pour une entrée en douceur.
  setTimeout(() => {
    visible.value = true
  }, 900)
})

function fermer() {
  visible.value = false
  try {
    sessionStorage.setItem(STORAGE_KEY, '1')
  } catch {
    // sessionStorage indisponible : on ignore.
  }
}
</script>

<template>
  <Transition name="alaune">
    <div
      v-if="visible"
      class="fixed bottom-4 right-4 z-[60] w-[min(92vw,20rem)] sm:bottom-6 sm:right-6"
    >
      <div class="relative overflow-hidden rounded-2xl border border-amber-400/30 bg-gray-900/85 shadow-2xl shadow-black/50 backdrop-blur-xl">
        <!-- Halo décoratif -->
        <div class="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-amber-500/20 blur-2xl" />

        <!-- Bouton fermer -->
        <button
          type="button"
          aria-label="Fermer"
          class="absolute right-2 top-2 z-10 flex h-7 w-7 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-white/10 hover:text-white"
          @click="fermer"
        >
          <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke-width="2.2" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
          </svg>
        </button>

        <NuxtLink to="/resultats" class="block p-5 pr-8" @click="fermer">
          <!-- Badge À la une -->
          <span class="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-widest text-amber-400">
            <span class="relative flex h-1.5 w-1.5">
              <span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
              <span class="relative inline-flex h-1.5 w-1.5 rounded-full bg-amber-400" />
            </span>
            À la une
          </span>

          <!-- Contenu -->
          <p class="mt-3 text-base font-bold leading-snug text-white">
            Résultats ADMISSION TEST 2026
          </p>
          <span class="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-amber-400">
            Voir les résultats
            <svg class="h-4 w-4 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
            </svg>
          </span>
        </NuxtLink>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.alaune-enter-active,
.alaune-leave-active {
  transition: opacity 0.4s ease, transform 0.4s cubic-bezier(0.22, 1, 0.36, 1);
}

.alaune-enter-from,
.alaune-leave-to {
  opacity: 0;
  transform: translateY(1.5rem) scale(0.96);
}
</style>
