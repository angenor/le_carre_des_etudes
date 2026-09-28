<script setup lang="ts">
import { STUDENT_NAME_MAX } from '#shared/utils/salm'
import { STUDY_LEVELS } from '#shared/utils/study-levels'

// « Pas de badge ? » : auto-inscription par le QR code du formulaire public, ou inscription par
// l'équipe avec entrée validée dans la foulée (FR-240 à FR-246).
const props = defineProps<{
  registration: { url: string; qrSvg: string } | null
  /** Aucun jour de salon aujourd'hui : l'inscription par l'équipe n'est pas proposée (US4-8) */
  trial: boolean
  offline: boolean
  submitting?: boolean
  errors: Record<string, string>
  message: string | null
}>()

const emit = defineEmits<{
  submit: [fields: { fullName: string; phone: string; studyLevel: string; informed: boolean }]
  close: []
}>()

const view = ref<'info' | 'form'>('info')
const fullName = ref('')
const phone = ref('')
const studyLevel = ref('')
const informed = ref(false)

const shortUrl = computed(() => props.registration?.url.replace(/^https?:\/\//, '') ?? '')

function errorOf(field: string): string {
  const code = props.errors[field]
  if (!code) return ''
  if (field === 'informed') return 'Cochez la case une fois la personne informée.'
  return salmFieldErrorMessage(field, code, field === 'fullName' ? STUDENT_NAME_MAX : undefined)
}

function submit() {
  emit('submit', { fullName: fullName.value, phone: phone.value, studyLevel: studyLevel.value, informed: informed.value })
}

const fieldClass = 'h-14 w-full rounded-2xl border-2 border-slate-600 bg-slate-950 px-4 text-lg text-white focus:border-amber-400 focus:outline-none'
</script>

<template>
  <section
    class="fixed inset-x-0 bottom-0 z-30 flex max-h-[92dvh] flex-col rounded-t-3xl bg-slate-900 shadow-[0_-12px_40px_rgb(0_0_0/0.5)] ring-1 ring-white/10"
    aria-labelledby="onsite-title"
  >
    <div class="flex items-center justify-between gap-3 px-4 pt-4">
      <h2 id="onsite-title" class="text-xl font-bold">{{ view === 'info' ? 'Pas de badge ?' : 'Inscrire la personne' }}</h2>
      <button
        type="button"
        class="flex size-12 items-center justify-center rounded-xl text-slate-300 hover:bg-slate-800 focus-visible:outline-4 focus-visible:outline-amber-400"
        aria-label="Fermer"
        @click="emit('close')"
      >
        <svg class="size-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path stroke-linecap="round" d="M6 18 18 6M6 6l12 12" /></svg>
      </button>
    </div>

    <div class="overflow-y-auto px-4 pb-[max(env(safe-area-inset-bottom),1rem)]">
      <!-- Auto-inscription : QR code du formulaire public, disponible hors ligne (précharge) -->
      <template v-if="view === 'info'">
        <p class="mt-2 text-base text-slate-300">La personne s'inscrit elle-même en scannant ce QR code :</p>
        <div v-if="registration" class="mx-auto mt-3 w-full max-w-64 rounded-2xl bg-white p-3 [&_svg]:h-auto [&_svg]:w-full" v-html="registration.qrSvg" />
        <p v-if="shortUrl" class="mt-3 text-center text-xl font-bold [overflow-wrap:anywhere]">{{ shortUrl }}</p>
        <NuxtLink
          to="/admin/salm/controle/affiche"
          target="_blank"
          class="mt-2 flex min-h-12 items-center justify-center text-base font-semibold text-amber-300 underline underline-offset-4 focus-visible:outline-4 focus-visible:outline-amber-400"
        >
          Affiche d'inscription
        </NuxtLink>

        <p v-if="offline" class="mt-4 rounded-2xl bg-slate-800 px-4 py-3 text-base text-slate-200">
          Inscription sur place indisponible hors ligne : réessayez au retour du réseau
        </p>
        <button
          v-else-if="!trial"
          type="button"
          class="mt-4 h-14 w-full rounded-2xl bg-white text-lg font-bold text-slate-950 focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-amber-400"
          @click="view = 'form'"
        >
          Inscrire la personne
        </button>
      </template>

      <!-- Inscription par l'équipe (FR-242, FR-243) -->
      <form v-else class="mt-3 flex flex-col gap-4" novalidate @submit.prevent="submit">
        <div>
          <label for="onsite-name" class="mb-1 block text-base font-medium text-slate-300">Nom & prénoms</label>
          <input id="onsite-name" v-model="fullName" type="text" autocomplete="off" :maxlength="STUDENT_NAME_MAX" :class="fieldClass" :aria-invalid="!!errors.fullName" aria-describedby="onsite-name-error">
          <p v-if="errors.fullName" id="onsite-name-error" class="mt-1 text-base text-red-300">{{ errorOf('fullName') }}</p>
        </div>
        <div>
          <label for="onsite-phone" class="mb-1 block text-base font-medium text-slate-300">Numéro de téléphone</label>
          <input id="onsite-phone" v-model="phone" type="tel" inputmode="tel" autocomplete="off" placeholder="07 12 34 56 78" :class="fieldClass" :aria-invalid="!!errors.phone" aria-describedby="onsite-phone-error">
          <p v-if="errors.phone" id="onsite-phone-error" class="mt-1 text-base text-red-300">{{ errorOf('phone') }}</p>
        </div>
        <div>
          <label for="onsite-level" class="mb-1 block text-base font-medium text-slate-300">Niveau d'étude</label>
          <select id="onsite-level" v-model="studyLevel" :class="fieldClass" :aria-invalid="!!errors.studyLevel" aria-describedby="onsite-level-error">
            <option value="" disabled>Choisir un niveau</option>
            <option v-for="level in STUDY_LEVELS" :key="level" :value="level">{{ level }}</option>
          </select>
          <p v-if="errors.studyLevel" id="onsite-level-error" class="mt-1 text-base text-red-300">{{ errorOf('studyLevel') }}</p>
        </div>

        <p class="rounded-2xl bg-slate-800 px-4 py-3 text-sm leading-relaxed text-slate-300">
          Tes informations servent uniquement à émettre ton badge, à organiser l'accueil du salon et à établir des statistiques anonymes. Elles sont supprimées au plus tard 12 mois après l'événement.
        </p>
        <div>
          <label class="flex min-h-12 items-start gap-3 text-base">
            <input v-model="informed" type="checkbox" class="mt-0.5 size-6 shrink-0 accent-amber-400" :aria-invalid="!!errors.informed" aria-describedby="onsite-informed-error">
            La personne a été informée de l'usage de ses données
          </label>
          <p v-if="errors.informed" id="onsite-informed-error" class="mt-1 text-base text-red-300">{{ errorOf('informed') }}</p>
        </div>

        <p v-if="message" class="rounded-2xl bg-slate-800 px-4 py-3 text-base text-slate-100" role="alert">{{ message }}</p>

        <button
          type="submit"
          :disabled="submitting"
          class="h-14 w-full rounded-2xl bg-[#14532D] text-lg font-bold text-white focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-amber-400 disabled:opacity-60"
        >
          {{ submitting ? 'Inscription…' : 'Inscrire et valider l\'entrée' }}
        </button>
      </form>

      <button
        type="button"
        class="mt-4 h-14 w-full rounded-2xl bg-slate-700 text-lg font-bold text-white focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-amber-400"
        @click="view === 'form' ? (view = 'info') : emit('close')"
      >
        {{ view === 'form' ? 'Retour' : 'Retour au scan' }}
      </button>
    </div>
  </section>
</template>
