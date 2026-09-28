<script setup lang="ts">
// Contrôle d'entrée du SALM le jour J, conçu pour un téléphone tenu d'une main (specs/008, US1 à US4).
// Aucune donnée n'est chargée pendant le rendu serveur : voir useSalmControl.
definePageMeta({ layout: 'salm-controle' })
useSeoMeta({ title: 'Contrôle d\'entrée · SALM' })

const { logout } = useAdmin()
const route = useRoute()
const router = useRouter()
const {
  feedback,
  status,
  sessionExpired,
  days,
  todayDayId,
  counters,
  result,
  busy,
  onRead,
  retryLast,
  closeResult,
  cancelResult,
  cancelCard,
  loadSnapshot,
  offline,
  pendingCount,
  readyOffline,
  snapshotAt,
  clockSkewMinutes,
  storageOk,
  endedMessage,
  manual,
  onsite,
  openOnsite,
  closeOnsite,
  registerOnsite,
  registration,
  openManual,
  closeManual,
  searchManual,
  openToken,
  validateManual,
} = useSalmControl()

const menuOpen = ref(false)

function relogin() {
  navigateTo({ path: '/admin/login', query: { redirect: '/admin/salm/controle' } })
}

function onGesture() {
  // Le son ne peut démarrer qu'après un geste (règle de lecture automatique)
  feedback.unlockAudio()
}

// Caméra refusée ou absente : la saisie manuelle s'ouvre (FR-213)
function onCameraUnavailable() {
  if (!manual.open) openManual()
}

// Entrées validées hors ligne pas encore envoyées : avertir avant de quitter la page (FR-238)
function onBeforeUnload(event: BeforeUnloadEvent) {
  if (!readQueue().length) return
  event.preventDefault()
  event.returnValue = ''
}

// Échap : ferme le résultat, puis le panneau ouvert (parcours au clavier)
function onKeydown(event: KeyboardEvent) {
  if (event.key !== 'Escape') return
  if (result.value) closeResult()
  else if (manual.open) closeManual()
  else if (onsite.open) closeOnsite()
  else menuOpen.value = false
}

onBeforeUnmount(() => {
  window.removeEventListener('beforeunload', onBeforeUnload)
  window.removeEventListener('keydown', onKeydown)
})

onMounted(() => {
  window.addEventListener('beforeunload', onBeforeUnload)
  window.addEventListener('keydown', onKeydown)
  feedback.keepAwake()
  // « Contrôler ce badge » depuis /salm/v/:token : fiche sans enregistrement (FR-223)
  const token = route.query.token
  if (typeof token === 'string' && token) {
    openToken(token)
    router.replace({ query: {} })
  }
})
</script>

<template>
  <div class="flex h-dvh flex-col overflow-hidden" @pointerdown.capture="onGesture">
    <div :inert="!!result" class="flex min-h-0 flex-1 flex-col">
      <SalmControlCounters
        :days="days"
        :counters="counters"
        :today-day-id="todayDayId"
        :offline="offline"
        :pending-count="pendingCount"
        :ready-offline="readyOffline"
        :snapshot-at="snapshotAt"
      >
        <template #actions>
          <button
            type="button"
            class="flex size-12 items-center justify-center rounded-xl bg-slate-800 text-slate-100 focus-visible:outline-4 focus-visible:outline-amber-400"
            :aria-pressed="feedback.sound.value ? 'true' : 'false'"
            :aria-label="feedback.sound.value ? 'Son activé' : 'Son désactivé'"
            @click="feedback.setSound(!feedback.sound.value)"
          >
            <svg class="size-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
              <path v-if="!feedback.sound.value" stroke-linecap="round" d="M3 3l18 18" />
            </svg>
          </button>
          <div class="relative">
            <button
              type="button"
              class="flex size-12 items-center justify-center rounded-xl bg-slate-800 text-slate-100 focus-visible:outline-4 focus-visible:outline-amber-400"
              :aria-expanded="menuOpen ? 'true' : 'false'"
              aria-controls="controle-menu"
              aria-label="Menu"
              @click="menuOpen = !menuOpen"
            >
              <svg class="size-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
                <path stroke-linecap="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              </svg>
            </button>
            <div
              v-if="menuOpen"
              id="controle-menu"
              class="absolute top-14 right-0 z-30 w-64 overflow-hidden rounded-2xl bg-slate-800 shadow-2xl ring-1 ring-white/10"
            >
              <NuxtLink to="/admin/salm" class="flex h-14 items-center px-4 text-base font-medium hover:bg-slate-700 focus-visible:bg-slate-700 focus-visible:outline-none">
                Retour à l'administration
              </NuxtLink>
              <button type="button" class="flex h-14 w-full items-center px-4 text-left text-base font-medium text-red-300 hover:bg-slate-700 focus-visible:bg-slate-700 focus-visible:outline-none" @click="logout">
                Se déconnecter
              </button>
            </div>
          </div>
        </template>

        <p v-if="endedMessage" class="mt-3 rounded-xl bg-slate-700 px-3 py-2 text-sm font-semibold" role="status">{{ endedMessage }}</p>
        <p v-if="clockSkewMinutes" class="mt-3 rounded-xl bg-amber-400 px-3 py-2 text-sm font-semibold text-stone-950" role="note">
          L'heure de ce téléphone diffère de {{ clockSkewMinutes }} min de celle du serveur. Réglez l'heure automatique.
        </p>
        <p v-if="!storageOk" class="mt-3 rounded-xl bg-slate-700 px-3 py-2 text-sm">
          Mode hors ligne indisponible sur ce navigateur (navigation privée ?)
        </p>
        <p v-if="sessionExpired" class="mt-3 flex items-center justify-between gap-3 rounded-xl bg-slate-700 px-3 py-2 text-sm">
          Session expirée
          <button type="button" class="h-10 rounded-lg bg-white px-3 font-bold text-slate-950" @click="relogin">Se reconnecter</button>
        </p>
      </SalmControlCounters>

      <main class="relative min-h-0 flex-1" :inert="manual.open || onsite.open">
        <div v-if="status === 'no-edition'" class="flex h-full items-center justify-center px-6 text-center">
          <p class="text-xl font-semibold text-slate-200">Aucune édition SALM publiée : rien à contrôler</p>
        </div>
        <div v-else-if="status === 'loading'" class="flex h-full items-center justify-center text-lg text-slate-400">
          Chargement…
        </div>
        <template v-else>
          <p v-if="status === 'error'" class="absolute inset-x-3 top-3 z-10 flex items-center justify-between gap-3 rounded-xl bg-slate-800/95 px-3 py-2 text-sm">
            Liste des badges non chargée
            <button type="button" class="h-10 rounded-lg bg-white px-3 font-bold text-slate-950" @click="loadSnapshot">Réessayer</button>
          </p>
          <SalmControlScanner :paused="manual.open || onsite.open" @read="onRead" @unavailable="onCameraUnavailable" />
        </template>
      </main>

      <nav :inert="manual.open || onsite.open" class="grid grid-cols-2 gap-3 bg-slate-900 px-4 pt-3 pb-[max(env(safe-area-inset-bottom),0.75rem)]" aria-label="Autres contrôles">
        <button
          type="button"
          :disabled="status === 'no-edition'"
          class="h-14 rounded-2xl bg-slate-100 text-lg font-bold text-slate-950 focus-visible:outline-4 focus-visible:outline-amber-400 disabled:opacity-40"
          @click="openManual()"
        >
          Saisie manuelle
        </button>
        <button
          type="button"
          :disabled="status !== 'ready'"
          class="h-14 rounded-2xl bg-slate-700 text-lg font-bold text-white focus-visible:outline-4 focus-visible:outline-amber-400 disabled:opacity-40"
          @click="openOnsite"
        >
          Pas de badge ?
        </button>
      </nav>

      <SalmControlManual
        v-if="manual.open"
        :card="manual.card"
        :message="manual.message"
        :searching="manual.searching"
        :busy="busy"
        @search="searchManual"
        @validate="validateManual"
        @cancel="cancelCard"
        @close="closeManual"
      />
      <SalmControlOnsite
        v-if="onsite.open"
        :registration="registration"
        :trial="todayDayId === null"
        :offline="offline"
        :submitting="onsite.submitting"
        :errors="onsite.errors"
        :message="onsite.message"
        @submit="registerOnsite"
        @close="closeOnsite"
      />
    </div>

    <SalmControlResult
      :result="result"
      :busy="busy"
      @cancel="cancelResult"
      @retry="retryLast"
      @relogin="relogin"
      @close="closeResult"
    />
  </div>
</template>
