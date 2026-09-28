<script setup lang="ts">
import '~/assets/css/salm.css'
import { normalizeIvorianPhone } from '#shared/utils/phone'
import { isStudyLevel, STUDY_LEVELS } from '#shared/utils/study-levels'
import {
  formatDateRange,
  STUDENT_NAME_MAX,
  validateStudentName,
  venueLabel,
  type SalmFieldError,
} from '#shared/utils/salm'
import type { SalmBadgePayload, SalmPublicEdition, SalmStudentResponse } from '#shared/types/salm'

// Inscription étudiante et badge (US1). Visuel : maquette inscription-etudiant.dc.html (D1).
// Champs, libellés, exemples et niveaux : repris du formulaire magazine (DownloadModal).
const props = defineProps<{ edition: SalmPublicEdition }>()

type Field = 'fullName' | 'phone' | 'studyLevel'
type Mode = 'form' | 'recover' | 'done'

// ---- Textes (tutoiement). L'API ne renvoie que des codes (D6, contracts/ui-routes.md) ----
const FIELD_TEXTS: Record<Field, Partial<Record<SalmFieldError, string>>> = {
  fullName: {
    REQUIRED: 'Ton nom et tes prénoms sont requis.',
    INVALID_CHARS: 'Utilise seulement des lettres, espaces, traits d\'union, apostrophes et points.',
    TOO_SHORT: `Ton nom doit compter entre 2 et ${STUDENT_NAME_MAX} caractères.`,
    TOO_LONG: `Ton nom doit compter entre 2 et ${STUDENT_NAME_MAX} caractères.`,
  },
  phone: {
    REQUIRED: 'Ton numéro de téléphone est requis.',
    INVALID_FORMAT: 'Commence par 01, 05, 07 ou 27, suivi de 8 chiffres.',
  },
  studyLevel: {
    REQUIRED: 'Choisis ton niveau d\'étude.',
    INVALID_CHOICE: 'Choisis ton niveau d\'étude.',
  },
}
const GENERIC_ERROR = 'Une erreur est survenue. Réessaie dans un instant.'
const GLOBAL_TEXTS: Record<string, string> = {
  REGISTRATION_CLOSED: 'Les inscriptions étudiantes sont closes. Tu peux encore récupérer ton badge.',
  NAME_MISMATCH: 'Ce numéro est déjà inscrit sous un autre nom. Vérifie l\'orthographe ou contacte l\'organisateur.',
  NOT_FOUND: `Aucune inscription ne correspond à ce numéro pour le SALM ${props.edition.year}.`,
  REJECTED: 'Impossible d\'enregistrer ta demande. Recharge la page et réessaie.',
  RATE_LIMITED: 'Trop de tentatives. Réessaie dans quelques minutes.',
  NO_EDITION: 'Aucune édition du SALM n\'est ouverte pour le moment.',
}

// Mention d'usage (FR-024, décision D5 à valider par l'organisateur).
// Si D5 n'est pas validée avant la mise en production, passer RETENTION_NOTICE à false (version de repli).
const RETENTION_NOTICE = true
const usageNotice = RETENTION_NOTICE
  ? 'Tes informations servent uniquement à émettre ton badge, à organiser l\'accueil du salon et à établir des statistiques anonymes. Elles sont supprimées au plus tard 12 mois après l\'événement.'
  : 'Tes informations servent uniquement à émettre ton badge, à organiser l\'accueil du salon et à établir des statistiques anonymes.'

// ---- État ----
const mode = ref<Mode>(props.edition.registration.students.open ? 'form' : 'recover')
const closedNotice = ref(!props.edition.registration.students.open)
const form = reactive({ fullName: '', phone: '', studyLevel: '', website: '' })
const errors = reactive<Partial<Record<Field, string>>>({})
const globalError = ref('')
const submitting = ref(false)
const startedAt = ref<number | null>(null)
const result = ref<{ status: 'created' | 'existing'; badge: SalmBadgePayload } | null>(null)

const fieldRefs: Partial<Record<Field, HTMLInputElement | HTMLSelectElement | null>> = {}
const doneTitle = ref<HTMLElement>()
const uid = useId()
const ids = {
  fullName: `${uid}-name`,
  phone: `${uid}-phone`,
  studyLevel: `${uid}-level`,
}

onMounted(() => {
  startedAt.value = Date.now()
})

// ---- Données dérivées de l'édition ----
const dates = computed(() => props.edition.days.map((d) => d.date))
const datesAnd = computed(() => formatDateRange(dates.value))
const datesAmp = computed(() => formatDateRange(dates.value, '&'))
const venue = computed(() => venueLabel(props.edition.venue, props.edition.city))
const salonShort = computed(() => props.edition.salonName.replace(/\s+de Côte d['’]Ivoire$/i, ''))
const nameLength = computed(() => [...form.fullName].length)
const previewName = computed(() => form.fullName.trim() || 'Kouassi Aya Marie')
const previewLevel = computed(() => form.studyLevel || 'Licence (Bac+3)')

// ---- Validation client (mêmes règles que le serveur, shared/) ----
function clearErrors() {
  for (const key of Object.keys(errors) as Field[]) delete errors[key]
  globalError.value = ''
}

function validate(withLevel: boolean): boolean {
  clearErrors()
  const name = validateStudentName(form.fullName)
  if ('error' in name) errors.fullName = FIELD_TEXTS.fullName[name.error]
  if (!form.phone.trim()) errors.phone = FIELD_TEXTS.phone.REQUIRED
  else if (!normalizeIvorianPhone(form.phone)) errors.phone = FIELD_TEXTS.phone.INVALID_FORMAT
  if (withLevel && !isStudyLevel(form.studyLevel)) errors.studyLevel = FIELD_TEXTS.studyLevel.REQUIRED
  return Object.keys(errors).length === 0
}

async function focusFirstError() {
  await nextTick()
  const first = (['fullName', 'phone', 'studyLevel'] as Field[]).find((f) => errors[f])
  if (first) fieldRefs[first]?.focus()
}

function describedBy(field: Field, hint = false) {
  if (errors[field]) return `${ids[field]}-error`
  return hint ? `${ids[field]}-hint` : undefined
}

// ---- Envoi ----
async function submit() {
  const recover = mode.value === 'recover'
  if (!validate(!recover)) {
    await focusFirstError()
    return
  }
  submitting.value = true
  try {
    const body = {
      fullName: form.fullName,
      phone: form.phone,
      ...(recover ? {} : { studyLevel: form.studyLevel }),
      website: form.website,
      startedAt: startedAt.value,
    }
    const response = await $fetch<SalmStudentResponse>(recover ? '/api/salm/students/recover' : '/api/salm/students', {
      method: 'POST',
      body,
    })
    result.value = response
    mode.value = 'done'
    await nextTick()
    doneTitle.value?.focus()
  }
  catch (error) {
    const data = (error as { data?: { data?: { code?: string; errors?: Record<string, SalmFieldError> } } }).data?.data
    if (data?.code === 'VALIDATION' && data.errors) {
      for (const [field, code] of Object.entries(data.errors)) {
        if (field in FIELD_TEXTS) errors[field as Field] = FIELD_TEXTS[field as Field][code] ?? GENERIC_ERROR
      }
      await focusFirstError()
    }
    else {
      if (data?.code === 'REGISTRATION_CLOSED') {
        mode.value = 'recover'
        closedNotice.value = true
      }
      globalError.value = (data?.code && GLOBAL_TEXTS[data.code]) || GENERIC_ERROR
    }
  }
  finally {
    submitting.value = false
  }
}

async function restart() {
  form.fullName = ''
  form.phone = ''
  form.studyLevel = ''
  clearErrors()
  result.value = null
  mode.value = props.edition.registration.students.open ? 'form' : 'recover'
  await nextTick()
  fieldRefs.fullName?.focus()
}

const inputClass = 'box-border h-[52px] w-full rounded-xl border-[1.5px] bg-white px-4 text-base font-normal text-stone-900 placeholder:text-stone-500 focus:border-salm-accent focus:shadow-[0_0_0_3px_rgba(194,65,12,0.2)] focus:outline-none'
</script>

<template>
  <div class="flex w-full max-w-[1160px] flex-col overflow-hidden rounded-3xl bg-[#FAF8F5] font-salm-body text-stone-900 md:rounded-[28px] lg:flex-row">
    <!-- Colonne orange -->
    <aside class="salm-on-accent flex shrink-0 flex-col gap-5 bg-salm-accent p-6 text-white md:gap-6 md:p-9 lg:w-[420px]">
      <NuxtLink to="/salm" class="flex items-center gap-2 self-start text-sm font-semibold text-white hover:underline">
        <svg class="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 12H5M11 6l-6 6 6 6" /></svg>
        Retour à la page SALM
      </NuxtLink>
      <div v-if="edition.poster" class="relative hidden h-[330px] overflow-hidden rounded-[20px] bg-[#F7F4EF] lg:block">
        <img :src="edition.poster.path" alt="" class="size-full object-cover object-[center_20%]">
        <span class="absolute bottom-4 left-4 rounded-lg bg-white px-2.5 py-1.5 font-salm-title text-[15px] font-extrabold text-[#C4500A]">
          SALM <span class="rounded bg-[#C4500A] px-1.5 py-0.5 text-white">{{ edition.year }}</span>
        </span>
      </div>
      <p class="font-salm-title text-2xl leading-[1.12] font-extrabold tracking-[-0.02em] md:text-[30px]">
        <template v-if="mode === 'recover'">Ton badge reste disponible.</template>
        <template v-else>Trois champs, et ton badge est prêt.</template>
      </p>
      <ul class="flex flex-col gap-3 text-[15px]">
        <li v-for="item in ['Nominatif, avec QR code', 'Téléchargeable immédiatement', `Valable les ${datesAnd}`]" :key="item" class="flex items-center gap-3">
          <svg class="size-[18px] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5" /></svg>
          {{ item }}
        </li>
      </ul>
    </aside>

    <!-- Contenu -->
    <div class="salm-on-light flex min-w-0 grow flex-col gap-7 p-6 md:gap-8 md:px-16 md:py-12">
      <div class="flex flex-col gap-2">
        <h1 class="font-salm-title text-2xl font-extrabold tracking-[-0.02em] text-stone-900 md:text-[28px]">Inscription étudiant·e — SALM {{ edition.year }}</h1>
        <p class="text-[15px] text-stone-600">{{ salonShort }} · {{ datesAmp }}, {{ edition.city }}</p>
      </div>

      <!-- Formulaire (ouvert) ou récupération (fermé) -->
      <div v-if="mode !== 'done'" class="flex flex-col gap-8 md:flex-row md:items-start md:gap-12">
        <form class="relative flex min-w-0 grow flex-col gap-[22px]" novalidate @submit.prevent="submit">
          <p v-if="mode === 'recover' && closedNotice" class="rounded-[14px] bg-[#F1ECE6] px-[18px] py-4 text-sm leading-normal text-stone-700">
            Les inscriptions étudiantes sont closes. Tu peux encore récupérer ton badge avec ton nom et ton numéro de téléphone.
          </p>

          <div class="flex flex-col gap-2">
            <label :for="ids.fullName" class="text-sm font-semibold text-stone-700">Nom &amp; prénoms</label>
            <input
              :id="ids.fullName"
              :ref="(el) => { fieldRefs.fullName = el as HTMLInputElement }"
              v-model="form.fullName"
              type="text"
              autocomplete="name"
              :maxlength="STUDENT_NAME_MAX"
              placeholder="Kouassi Aya Marie"
              :class="[inputClass, errors.fullName ? 'border-red-600' : 'border-salm-input-border']"
              :aria-invalid="errors.fullName ? 'true' : undefined"
              :aria-describedby="describedBy('fullName')"
            >
            <p v-if="nameLength >= 50" class="text-right text-[13px] text-stone-500" aria-live="polite">{{ nameLength }}/{{ STUDENT_NAME_MAX }}</p>
            <p v-if="errors.fullName" :id="`${ids.fullName}-error`" class="text-[13px] font-medium text-red-700">{{ errors.fullName }}</p>
          </div>

          <div class="flex flex-col gap-2">
            <label :for="ids.phone" class="text-sm font-semibold text-stone-700">Numéro de téléphone</label>
            <input
              :id="ids.phone"
              :ref="(el) => { fieldRefs.phone = el as HTMLInputElement }"
              v-model="form.phone"
              type="tel"
              autocomplete="tel"
              inputmode="tel"
              placeholder="07 12 34 56 78"
              :class="[inputClass, errors.phone ? 'border-red-600' : 'border-salm-input-border']"
              :aria-invalid="errors.phone ? 'true' : undefined"
              :aria-describedby="describedBy('phone', true)"
            >
            <p v-if="errors.phone" :id="`${ids.phone}-error`" class="text-[13px] font-medium text-red-700">{{ errors.phone }}</p>
            <p v-else :id="`${ids.phone}-hint`" class="text-[13px] text-stone-500">Commence par 01, 05, 07 ou 27, suivi de 8 chiffres.</p>
          </div>

          <div v-if="mode === 'form'" class="flex flex-col gap-2">
            <label :for="ids.studyLevel" class="text-sm font-semibold text-stone-700">Niveau d'étude</label>
            <div class="relative">
              <select
                :id="ids.studyLevel"
                :ref="(el) => { fieldRefs.studyLevel = el as HTMLSelectElement }"
                v-model="form.studyLevel"
                :class="[inputClass, 'appearance-none pr-10', errors.studyLevel ? 'border-red-600' : 'border-salm-input-border', form.studyLevel ? '' : 'text-stone-500']"
                :aria-invalid="errors.studyLevel ? 'true' : undefined"
                :aria-describedby="describedBy('studyLevel')"
              >
                <option value="" disabled>Sélectionnez votre niveau</option>
                <option v-for="level in STUDY_LEVELS" :key="level" :value="level" class="text-stone-900">{{ level }}</option>
              </select>
              <svg class="pointer-events-none absolute top-1/2 right-4 size-4 -translate-y-1/2 text-stone-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="m6 9 6 6 6-6" /></svg>
            </div>
            <p v-if="errors.studyLevel" :id="`${ids.studyLevel}-error`" class="text-[13px] font-medium text-red-700">{{ errors.studyLevel }}</p>
          </div>

          <!-- Champ piège : invisible pour les humains (FR-080) -->
          <div class="pointer-events-none absolute top-0 left-0 h-px w-px overflow-hidden opacity-0" aria-hidden="true">
            <label :for="`${uid}-website`">Site web</label>
            <input :id="`${uid}-website`" v-model="form.website" type="text" name="website" tabindex="-1" autocomplete="off">
          </div>

          <p v-if="globalError" role="alert" class="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800">{{ globalError }}</p>

          <button
            type="submit"
            :disabled="submitting"
            class="mt-2.5 flex h-14 items-center justify-center gap-3 rounded-[14px] bg-salm-accent font-salm-title text-base font-bold text-white transition-colors hover:bg-[#9A3412] disabled:cursor-wait disabled:opacity-70"
          >
            <svg v-if="submitting" class="size-5 animate-spin motion-reduce:animate-none" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" class="opacity-25" /><path fill="currentColor" d="M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4z" class="opacity-75" /></svg>
            <svg v-else class="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="5" y="2" width="14" height="20" rx="2" /><path d="M9 6h6" /><circle cx="12" cy="13" r="3" /></svg>
            {{ submitting ? 'Envoi en cours…' : mode === 'recover' ? 'Récupérer mon badge' : 'Obtenir mon badge' }}
          </button>
          <p class="text-[13px] leading-normal text-stone-500">{{ usageNotice }}</p>
        </form>

        <figure v-if="mode === 'form'" class="m-0 flex shrink-0 flex-col items-center gap-3 self-center md:self-start">
          <SalmBadgeCard
            :year="edition.year"
            :salon-name="edition.salonName"
            :full-name="previewName"
            :study-level="previewLevel"
          />
          <figcaption class="text-[13px] text-stone-500">Aperçu de ton badge</figcaption>
        </figure>
      </div>

      <!-- Félicitations / déjà inscrit·e -->
      <div v-else-if="result" class="flex flex-col items-center gap-8 md:flex-row md:items-start md:gap-12">
        <figure class="m-0">
          <SalmBadgeCard
            size="md"
            :year="edition.year"
            :salon-name="edition.salonName"
            :full-name="result.badge.fullName"
            :study-level="result.badge.studyLevel"
            :number="result.badge.number"
            :qr-svg="result.badge.qrSvg"
          />
          <figcaption class="sr-only">Ton badge n° {{ result.badge.number }}, au nom de {{ result.badge.fullName }}</figcaption>
        </figure>
        <div class="flex w-full min-w-0 grow flex-col gap-[18px] md:pt-2">
          <span class="flex size-14 items-center justify-center rounded-full bg-green-100 text-green-700" aria-hidden="true">
            <svg class="size-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
          </span>
          <h2 ref="doneTitle" tabindex="-1" class="font-salm-title text-2xl font-extrabold tracking-[-0.02em] text-stone-900 focus:outline-none md:text-[30px]">
            {{ result.status === 'created' ? 'Félicitations, ton badge est prêt !' : 'Tu es déjà inscrit·e' }}
          </h2>
          <p class="text-base leading-relaxed text-stone-600">
            <template v-if="result.status === 'existing'">Voici ton badge d'origine, n° {{ result.badge.number }}. </template>
            Télécharge-le et présente-le à l'entrée, imprimé ou sur ton téléphone.
          </p>
          <a
            :href="result.badge.downloadUrl"
            download
            class="mt-1.5 flex h-14 items-center justify-center gap-3 rounded-[14px] bg-salm-accent px-6 font-salm-title text-base font-bold text-white transition-colors hover:bg-[#9A3412]"
          >
            <svg class="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" /></svg>
            Télécharger mon badge (PDF)
          </a>
          <p class="text-sm font-medium text-stone-700">Imprime à 100 % (sans ajustement à la page) ou présente-le sur ton téléphone.</p>
          <div class="flex flex-col gap-1.5 rounded-[14px] bg-[#F1ECE6] px-[18px] py-4 text-sm text-stone-700">
            <span class="font-bold">{{ datesAmp }}<template v-if="edition.timeline.hoursLabel"> · {{ edition.timeline.hoursLabel }}</template></span>
            <span>{{ venue }}</span>
          </div>
          <p class="text-[13px] leading-normal text-stone-500">Badge perdu ? Il se retélécharge en saisissant à nouveau ton nom et ton numéro de téléphone.</p>
          <button type="button" class="self-start text-sm font-semibold text-[#9A3A06] hover:text-[#7C2D12]" @click="restart">
            Inscrire une autre personne
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
