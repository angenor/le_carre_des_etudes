<script setup lang="ts">
const props = defineProps<{
  id: number
  name: string
  description: string
  version: string
  coverImage?: string | null
  publishedAt: string
  availableAt?: string | null
  pdfPath?: string | null
}>()

defineEmits<{
  download: [magazineId: number]
}>()

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

// Countdown pour magazines pas encore disponibles
const now = ref(new Date())
let timer: ReturnType<typeof setInterval> | null = null

onMounted(() => {
  if (props.availableAt) {
    timer = setInterval(() => {
      now.value = new Date()
    }, 1000)
  }
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
})

const isAvailable = computed(() => {
  if (!props.availableAt) return true
  return new Date(props.availableAt).getTime() <= now.value.getTime()
})

const countdown = computed(() => {
  if (!props.availableAt || isAvailable.value) return null

  const diff = new Date(props.availableAt).getTime() - now.value.getTime()
  const jours = Math.floor(diff / (1000 * 60 * 60 * 24))
  const heures = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  const secondes = Math.floor((diff % (1000 * 60)) / 1000)

  return { jours, heures, minutes, secondes }
})
</script>

<template>
  <article class="group">
    <div class="relative">
      <!-- Couverture -->
      <NuxtLink :to="`/magazine/${id}`" class="block">
        <img
          v-if="coverImage"
          :src="coverImage"
          :alt="`Couverture ${name} — ${version}`"
          loading="lazy"
          class="mag-cover w-full h-auto shadow-lg rounded-sm"
        />
        <div
          v-else
          class="mag-cover w-full h-80 shadow-lg rounded-sm flex items-center justify-center bg-linear-to-br from-surface-2 to-surface"
        >
          <div class="text-center">
            <div class="text-4xl font-bold text-accent">{{ version }}</div>
            <div class="mt-2 text-sm text-ink-subtle">{{ name }}</div>
          </div>
        </div>
      </NuxtLink>

      <!-- Panneau d'infos superposé -->
      <div class="mag-card animated-border rounded-l-[20px] rounded-t-[20px] absolute bottom-4 -right-6 w-[55%] h-[55%] sm:bottom-6 sm:-right-10 px-5 pt-4 pb-6 shadow-xl flex flex-col">
        <span class="inline-block text-xs text-ink-subtle">
          {{ formatDate(publishedAt) }}
        </span>

        <NuxtLink :to="`/magazine/${id}`" class="block">
          <h2 class="text-lg font-bold leading-tight mt-1 mb-1.5 text-ink line-clamp-2 hover:text-accent hover:underline transition-colors">
            {{ name }}
          </h2>
        </NuxtLink>

        <span class="inline-block text-accent text-xs">
          {{ version }}
        </span>

        <p class="text-ink-muted mt-4 leading-relaxed text-xs line-clamp-3 flex-1">
          {{ description }}
        </p>

        <!-- Actions -->
        <div class="mt-auto">
          <!-- Countdown si pas encore disponible -->
          <div v-if="countdown" class="mt-3">
            <p class="text-[10px] text-ink-subtle uppercase tracking-wide mb-2">Disponible dans</p>
            <div class="flex gap-1.5">
              <div v-for="bloc in [
                { val: countdown.jours, label: 'j' },
                { val: countdown.heures, label: 'h' },
                { val: countdown.minutes, label: 'm' },
                { val: countdown.secondes, label: 's' },
              ]" :key="bloc.label" class="flex flex-col items-center rounded bg-surface-2/80 px-1.5 py-1 min-w-7">
                <span class="text-sm font-bold text-accent tabular-nums">{{ String(bloc.val).padStart(2, '0') }}</span>
                <span class="text-[9px] text-ink-subtle uppercase">{{ bloc.label }}</span>
              </div>
            </div>
          </div>

          <!-- Actions normales si disponible -->
          <div v-else class="flex justify-end items-center gap-3">
            <!-- Voir détails -->
            <NuxtLink
              :to="`/magazine/${id}`"
              class="text-ink-subtle hover:text-accent transition-colors"
              title="Voir les détails"
            >
              <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 576 512">
                <path d="M288 32c-80.8 0-145.5 36.8-192.6 80.6-46.8 43.5-78.1 95.4-93 131.1-3.3 7.9-3.3 16.7 0 24.6 14.9 35.7 46.2 87.7 93 131.1 47.1 43.7 111.8 80.6 192.6 80.6s145.5-36.8 192.6-80.6c46.8-43.5 78.1-95.4 93-131.1 3.3-7.9 3.3-16.7 0-24.6-14.9-35.7-46.2-87.7-93-131.1-47.1-43.7-111.8-80.6-192.6-80.6zM144 256a144 144 0 1 1 288 0 144 144 0 1 1 -288 0zm144-64c0 35.3-28.7 64-64 64-11.5 0-22.3-3-31.7-8.4-1 10.9-.1 22.1 2.9 33.2 13.7 51.2 66.4 81.6 117.6 67.9s81.6-66.4 67.9-117.6c-12.2-45.7-55.5-74.8-101.1-70.8 5.3 9.3 8.4 20.1 8.4 31.7z" />
              </svg>
            </NuxtLink>

            <!-- Télécharger -->
            <button
              v-if="pdfPath"
              type="button"
              class="flex items-center uppercase text-gold font-semibold text-xs hover:underline cursor-pointer"
              @click="$emit('download', id)"
            >
              <span class="mr-3 block w-8 h-0.5 bg-gold" />
              télécharger
            </button>
            <span v-else class="text-xs text-ink-faint italic">Bientôt</span>
          </div>
        </div>
      </div>
    </div>
  </article>
</template>

<style scoped>
@property --border-angle {
  syntax: "<angle>";
  inherits: true;
  initial-value: 0turn;
}

.animated-border {
  --border-angle: 0turn;
  /* Bord du panneau : #111827 en sombre (valeur d'origine, à 1/255 près du jeton surface) */
  --card-edge: #111827;
  --main-bg: conic-gradient(
    from var(--border-angle),
    var(--card-edge),
    var(--site-page) 5%,
    var(--site-page) 60%,
    var(--card-edge) 95%
  );
  --gradient-border: conic-gradient(
    from var(--border-angle),
    transparent 25%,
    #f59e0b,
    var(--site-copper) 99%,
    transparent
  );

  border: solid 2px transparent;
  background:
    var(--main-bg) padding-box,
    var(--gradient-border) border-box,
    var(--main-bg) border-box;
  background-position: center center;
  animation: bg-spin 3s linear infinite;
}

/* Mode clair : le bord du panneau suit la surface « papier » */
.light .animated-border {
  --card-edge: var(--site-surface);
}

.animated-border:hover {
  animation-play-state: paused;
}

@keyframes bg-spin {
  to {
    --border-angle: 1turn;
  }
}
</style>
