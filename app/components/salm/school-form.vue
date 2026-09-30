<script setup lang="ts">
import '~/assets/css/salm.css'
import { normalizeIvorianPhone } from '#shared/utils/phone'
import {
  formatDateRange,
  programmeLabel,
  SCHOOL_MAX_EXHIBITORS,
  SCHOOL_PROGRAMMES,
  venueLabel,
  type SalmFieldError,
  type SchoolProgramme,
} from '#shared/utils/salm'
import type { SalmPublicEdition, SalmPublicPhoto, SalmSchoolResponse, SalmSchoolSummary } from '#shared/types/salm'

// Inscription d'un établissement exposant en 3 étapes (US3), sans badge (FR-047).
// Visuel : maquette inscription-ecole.dc.html. Textes au vouvoiement.
const props = defineProps<{
  edition: SalmPublicEdition
  photo?: SalmPublicPhoto | null
}>()

// ---- Textes (vouvoiement). L'API ne renvoie que des codes (D6, contracts/ui-routes.md) ----
const GENERIC_ERROR = 'Une erreur est survenue. Veuillez réessayer dans un instant.'
const NAME_LENGTH = 'Le nom doit compter entre 2 et 150 caractères.'
const EXHIBITOR_NAME_LENGTH = 'Le nom doit compter entre 2 et 100 caractères.'
const FIELD_TEXTS: Record<string, Partial<Record<SalmFieldError, string>>> = {
  name: { REQUIRED: 'Le nom de l\'établissement est requis.', TOO_SHORT: NAME_LENGTH, TOO_LONG: NAME_LENGTH },
  phone: {
    REQUIRED: 'Le numéro de téléphone est requis.',
    INVALID_FORMAT: 'Saisissez 10 chiffres commençant par 01, 05, 07, 21, 25 ou 27.',
  },
  email: { REQUIRED: 'L\'adresse e-mail est requise.', INVALID_FORMAT: 'Adresse e-mail invalide.', TOO_LONG: 'Adresse e-mail invalide.' },
  programmes: {
    REQUIRED: 'Sélectionnez au moins un programme.',
    INVALID_CHOICE: 'Sélectionnez au moins un programme.',
    DUPLICATE: 'Sélectionnez au moins un programme.',
  },
  otherProgramme: { TOO_LONG: 'La précision est limitée à 120 caractères.' },
  exhibitors: { REQUIRED: 'Ajoutez au moins un exposant.', TOO_MANY: `${SCHOOL_MAX_EXHIBITORS} exposants au maximum.` },
  exhibitorName: { REQUIRED: 'Le nom de l\'exposant est requis.', TOO_SHORT: EXHIBITOR_NAME_LENGTH, TOO_LONG: EXHIBITOR_NAME_LENGTH },
  exhibitorContact: { REQUIRED: 'Numéro de l\'exposant invalide.', INVALID_FORMAT: 'Numéro de l\'exposant invalide.' },
  standTypeId: { REQUIRED: 'Choisissez un type de stand.', INVALID_CHOICE: 'Choisissez un type de stand.' },
  question: { TOO_LONG: 'Votre question est limitée à 1 000 caractères.' },
}
const GLOBAL_TEXTS: Record<string, string> = {
  REGISTRATION_CLOSED: 'Les inscriptions des établissements sont closes. Contactez l\'équipe SALM.',
  REJECTED: 'Impossible d\'enregistrer votre demande. Rechargez la page et réessayez.',
  RATE_LIMITED: 'Trop de tentatives. Réessayez dans quelques minutes.',
  NO_EDITION: 'Aucune édition du SALM n\'est ouverte pour le moment.',
}

// Mention d'usage (FR-046, D8 à valider avec D5). Repli sans durée : passer RETENTION_NOTICE à false.
const RETENTION_NOTICE = true
const usageNotice = RETENTION_NOTICE
  ? 'Ces informations servent uniquement à confirmer votre participation, à organiser l\'accueil des exposants et à établir des statistiques anonymes. Elles sont supprimées au plus tard 12 mois après l\'événement.'
  : 'Ces informations servent uniquement à confirmer votre participation, à organiser l\'accueil des exposants et à établir des statistiques anonymes.'

// Clé d'erreur serveur → clé de texte
function textKey(field: string): string {
  if (/^exhibitors\.\d+\.fullName$/.test(field)) return 'exhibitorName'
  if (/^exhibitors\.\d+\.contact$/.test(field)) return 'exhibitorContact'
  return field
}

// ---- État ----
const STEPS = ['Établissement', 'Exposants & stand', 'Confirmation']
const step = ref<1 | 2 | 3>(1)
// Sens du dernier changement d'étape : l'étape affichée glisse depuis la droite (suivante) ou la gauche (précédente)
const stepSlide = ref<'' | 'salm-slide-next' | 'salm-slide-prev'>('')
const form = reactive({
  name: '',
  phone: '',
  email: '',
  programmes: [] as SchoolProgramme[],
  otherProgramme: '',
  exhibitors: [{ fullName: '', contact: '' }],
  standTypeId: null as number | null,
  question: '',
  website: '',
})
const errors = reactive<Record<string, string>>({})
const globalError = ref('')
const submitting = ref(false)
const startedAt = ref<number | null>(null)
const summary = ref<SalmSchoolSummary | null>(null)
const stepTitle = ref<HTMLElement>()
const uid = useId()
const id = (field: string) => `${uid}-${field.replaceAll('.', '-')}`

onMounted(() => {
  startedAt.value = Date.now()
})

// ---- Données dérivées de l'édition ----
const dates = computed(() => props.edition.days.map((d) => d.date))
const datesAmp = computed(() => formatDateRange(dates.value, '&'))
const venue = computed(() => venueLabel(props.edition.venue, props.edition.city))
const salonShort = computed(() => props.edition.salonName.replace(/\s+de Côte d['’]Ivoire$/i, ''))
const helpContacts = computed(() => {
  const phone = props.edition.contacts.find((c) => c.kind === 'phone' && c.onBadge)
    ?? props.edition.contacts.find((c) => c.kind === 'phone')
  const email = props.edition.contacts.find((c) => c.kind === 'email')
  return [phone?.value, email?.value].filter(Boolean).join(' · ')
})
const hasOther = computed(() => form.programmes.includes('AUTRE'))

function toggleProgramme(code: SchoolProgramme) {
  const i = form.programmes.indexOf(code)
  if (i >= 0) form.programmes.splice(i, 1)
  else form.programmes.push(code)
  delete errors.programmes
}

async function addExhibitor() {
  if (form.exhibitors.length >= SCHOOL_MAX_EXHIBITORS) return
  form.exhibitors.push({ fullName: '', contact: '' })
  await nextTick()
  document.getElementById(id(`exhibitors.${form.exhibitors.length - 1}.fullName`))?.focus()
}

async function removeExhibitor(index: number) {
  if (form.exhibitors.length <= 1) return
  form.exhibitors.splice(index, 1)
  for (const key of Object.keys(errors)) if (key.startsWith('exhibitors.')) delete errors[key]
  await nextTick()
  document.getElementById(id(`exhibitors.${Math.max(0, index - 1)}.fullName`))?.focus()
}

// ---- Validation client (mêmes règles que le serveur) ----
const STEP1_FIELDS = ['name', 'phone', 'email', 'programmes', 'otherProgramme']

function clearErrors(keys?: string[]) {
  for (const key of Object.keys(errors)) {
    if (!keys || keys.includes(key) || (keys.includes('exhibitors') && key.startsWith('exhibitors'))) delete errors[key]
  }
  globalError.value = ''
}

function setError(field: string, code: SalmFieldError) {
  errors[field] = FIELD_TEXTS[textKey(field)]?.[code] ?? GENERIC_ERROR
}

function validateStep1(): boolean {
  clearErrors(STEP1_FIELDS)
  const name = form.name.trim()
  if (!name) setError('name', 'REQUIRED')
  else if (name.length < 2 || name.length > 150) setError('name', name.length < 2 ? 'TOO_SHORT' : 'TOO_LONG')
  if (!form.phone.trim()) setError('phone', 'REQUIRED')
  else if (!normalizeIvorianPhone(form.phone, { landline: true })) setError('phone', 'INVALID_FORMAT')
  const email = form.email.trim()
  if (!email) setError('email', 'REQUIRED')
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) setError('email', 'INVALID_FORMAT')
  if (!form.programmes.length) setError('programmes', 'REQUIRED')
  if (hasOther.value && form.otherProgramme.trim().length > 120) setError('otherProgramme', 'TOO_LONG')
  return !STEP1_FIELDS.some((f) => errors[f])
}

function validateStep2(): boolean {
  clearErrors(['exhibitors', 'standTypeId', 'question'])
  form.exhibitors.forEach((e, i) => {
    const fullName = e.fullName.trim()
    if (!fullName) setError(`exhibitors.${i}.fullName`, 'REQUIRED')
    else if (fullName.length < 2 || fullName.length > 100) setError(`exhibitors.${i}.fullName`, fullName.length < 2 ? 'TOO_SHORT' : 'TOO_LONG')
    if (!normalizeIvorianPhone(e.contact, { landline: true })) setError(`exhibitors.${i}.contact`, e.contact.trim() ? 'INVALID_FORMAT' : 'REQUIRED')
  })
  if (form.standTypeId === null) setError('standTypeId', 'REQUIRED')
  if (form.question.trim().length > 1000) setError('question', 'TOO_LONG')
  return !Object.keys(errors).some((k) => k.startsWith('exhibitors') || k === 'standTypeId' || k === 'question')
}

/** Focus sur le premier champ en erreur, dans l'ordre du document. */
async function focusFirstError() {
  await nextTick()
  const first = document.querySelector<HTMLElement>(`[data-school-form="${uid}"] [aria-invalid="true"]`)
  first?.focus()
}

async function goTo(target: 1 | 2 | 3) {
  if (target !== step.value) stepSlide.value = target > step.value ? 'salm-slide-next' : 'salm-slide-prev'
  step.value = target
  await nextTick()
  stepTitle.value?.focus()
}

async function next() {
  if (!validateStep1()) return focusFirstError()
  await goTo(2)
}

async function back() {
  clearErrors(['exhibitors', 'standTypeId', 'question'])
  await goTo(1)
}

async function submit() {
  if (!validateStep2()) return focusFirstError()
  submitting.value = true
  try {
    const response = await $fetch<SalmSchoolResponse>('/api/salm/schools', {
      method: 'POST',
      body: {
        name: form.name,
        phone: form.phone,
        email: form.email,
        programmes: form.programmes,
        otherProgramme: hasOther.value ? form.otherProgramme : '',
        exhibitors: form.exhibitors,
        standTypeId: form.standTypeId,
        question: form.question,
        website: form.website,
        startedAt: startedAt.value,
      },
    })
    summary.value = response.summary
    await goTo(3)
  }
  catch (error) {
    const data = (error as { data?: { data?: { code?: string; errors?: Record<string, SalmFieldError> } } }).data?.data
    if (data?.code === 'VALIDATION' && data.errors) {
      for (const [field, code] of Object.entries(data.errors)) setError(field, code)
      // Erreur sur l'étape 1 (ex. stand masqué entre-temps : reste à l'étape 2)
      if (Object.keys(data.errors).some((f) => STEP1_FIELDS.includes(f))) await goTo(1)
      await focusFirstError()
    }
    else {
      globalError.value = (data?.code && GLOBAL_TEXTS[data.code]) || GENERIC_ERROR
    }
  }
  finally {
    submitting.value = false
  }
}

const summaryProgrammes = computed(() => {
  if (!summary.value) return ''
  return summary.value.programmes
    .map((p) => (p === 'AUTRE' && summary.value?.otherProgramme ? `Autre (${summary.value.otherProgramme})` : programmeLabel(p)))
    .join(' · ')
})

const inputClass = 'box-border h-[50px] w-full rounded-xl border-[1.5px] bg-white px-4 text-[15px] font-normal text-stone-900 placeholder:text-stone-500 focus:border-salm-accent focus:shadow-[0_0_0_3px_rgba(194,65,12,0.2)] focus:outline-none'
const border = (field: string) => (errors[field] ? 'border-red-600' : 'border-salm-input-border')
</script>

<template>
  <div
    :data-school-form="uid"
    class="flex w-full max-w-[1160px] flex-col overflow-hidden rounded-3xl bg-[#FAF8F5] shadow-[0_0_0_1px_var(--salm-card-edge),0_24px_48px_-28px_var(--salm-card-shadow)] font-salm-body text-stone-900 md:rounded-[28px] lg:flex-row"
  >
    <!-- Colonne d'information -->
    <aside class="flex shrink-0 flex-col gap-5 bg-salm-surface-2 p-6 text-salm-ink md:gap-6 md:p-9 lg:w-[420px]">
      <NuxtLink to="/salm" class="flex items-center gap-2 self-start text-sm font-semibold text-salm-accent-text hover:text-salm-accent-soft">
        <svg class="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 12H5M11 6l-6 6 6 6" /></svg>
        Retour à la page SALM
      </NuxtLink>
      <img
        v-if="photo"
        :src="photo.imagePath"
        :alt="photo.alt"
        class="hidden h-[260px] w-full rounded-[20px] object-cover object-[center_40%] lg:block"
      >
      <p class="font-salm-title text-2xl leading-[1.15] font-extrabold tracking-[-0.02em] md:text-[28px]">Universités et écoles : confirmez votre présence</p>
      <div class="flex items-start gap-3.5 rounded-2xl bg-salm-surface-4 px-5 py-[18px]">
        <svg class="mt-0.5 size-[22px] shrink-0 text-salm-accent-text" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10" /><path d="M12 16v-4M12 8h.01" /></svg>
        <span class="text-[15px] leading-[1.55] text-salm-ink-strong"><strong class="text-ink">Aucun badge pour les établissements.</strong> Ce formulaire confirme simplement votre participation, vos exposants et votre stand.</span>
      </div>
      <div v-if="helpContacts" class="flex flex-col gap-1.5 text-sm text-salm-ink-muted lg:mt-auto">
        <span>Une question ? L'équipe SALM vous répond :</span>
        <span class="break-words text-salm-ink-strong">{{ helpContacts }}</span>
      </div>
    </aside>

    <!-- Contenu -->
    <div class="salm-on-light flex min-w-0 grow flex-col gap-6 p-6 md:gap-[26px] md:px-16 md:py-11">
      <div class="flex flex-col gap-2">
        <h1 class="font-salm-title text-2xl font-extrabold tracking-[-0.02em] text-stone-900 md:text-[28px]">Formulaire exposants — SALM {{ edition.year }}</h1>
        <p class="text-[15px] text-stone-600">{{ salonShort }} · {{ datesAmp }}, {{ edition.city }}</p>
      </div>

      <!-- Indicateur d'étapes -->
      <ol aria-label="Étapes" class="flex items-center gap-2 sm:gap-3">
        <li
          v-for="(name, i) in STEPS"
          :key="name"
          class="flex items-center gap-2 sm:gap-3"
          :class="i < 2 ? 'grow' : ''"
          :aria-current="step === i + 1 ? 'step' : undefined"
        >
          <span
            class="flex size-[34px] shrink-0 items-center justify-center rounded-full border-[1.5px] text-sm font-extrabold"
            :class="i + 1 <= step ? 'border-stone-900 bg-stone-900 text-white' : 'border-salm-input-border bg-white text-stone-600'"
          >
            <template v-if="i + 1 < step"><span aria-hidden="true">✓</span><span class="sr-only">Étape {{ i + 1 }} terminée :</span></template>
            <template v-else>{{ i + 1 }}</template>
          </span>
          <span
            class="text-sm font-semibold"
            :class="[step === i + 1 ? 'text-stone-900' : 'text-stone-600', step === i + 1 ? '' : 'sr-only sm:not-sr-only']"
          >{{ name }}</span>
          <span v-if="i < 2" class="h-0.5 grow rounded-sm" :class="i + 1 < step ? 'bg-stone-900' : 'bg-stone-200'" aria-hidden="true" />
        </li>
      </ol>

      <!-- Étape 1 : établissement et programmes -->
      <form v-if="step === 1" class="relative flex flex-col gap-5" :class="stepSlide" novalidate @submit.prevent="next">
        <h2 ref="stepTitle" tabindex="-1" class="sr-only">Étape 1 sur 3 : établissement</h2>
        <div class="flex flex-col gap-2">
          <label :for="id('name')" class="text-[13px] font-semibold text-stone-700">Nom de l'établissement *</label>
          <input
            :id="id('name')" v-model="form.name" type="text" autocomplete="organization" maxlength="150"
            placeholder="Ex. Université Félix Houphouët-Boigny" :class="[inputClass, border('name')]"
            :aria-invalid="errors.name ? 'true' : undefined" :aria-describedby="errors.name ? `${id('name')}-error` : undefined"
          >
          <p v-if="errors.name" :id="`${id('name')}-error`" class="text-[13px] font-medium text-red-700">{{ errors.name }}</p>
        </div>
        <div class="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-4">
          <div class="flex flex-col gap-2">
            <label :for="id('phone')" class="text-[13px] font-semibold text-stone-700">Numéro de téléphone *</label>
            <input
              :id="id('phone')" v-model="form.phone" type="tel" autocomplete="tel" inputmode="tel"
              placeholder="+225 27 00 00 00 00" :class="[inputClass, border('phone')]"
              :aria-invalid="errors.phone ? 'true' : undefined" :aria-describedby="errors.phone ? `${id('phone')}-error` : undefined"
            >
            <p v-if="errors.phone" :id="`${id('phone')}-error`" class="text-[13px] font-medium text-red-700">{{ errors.phone }}</p>
          </div>
          <div class="flex flex-col gap-2">
            <label :for="id('email')" class="text-[13px] font-semibold text-stone-700">Adresse e-mail *</label>
            <input
              :id="id('email')" v-model="form.email" type="email" autocomplete="email" maxlength="254"
              placeholder="contact@etablissement.ci" :class="[inputClass, border('email')]"
              :aria-invalid="errors.email ? 'true' : undefined" :aria-describedby="errors.email ? `${id('email')}-error` : undefined"
            >
            <p v-if="errors.email" :id="`${id('email')}-error`" class="text-[13px] font-medium text-red-700">{{ errors.email }}</p>
          </div>
        </div>

        <fieldset class="m-0 flex flex-col border-0 p-0" :aria-describedby="errors.programmes ? `${id('programmes')}-error` : undefined">
          <legend class="mb-2.5 p-0 text-[13px] font-semibold text-stone-700">
            Programmes proposés * <span class="font-normal text-stone-600">(plusieurs choix possibles)</span>
          </legend>
          <div class="flex flex-wrap gap-2.5">
            <button
              v-for="code in SCHOOL_PROGRAMMES"
              :key="code"
              type="button"
              :aria-pressed="form.programmes.includes(code) ? 'true' : 'false'"
              :aria-invalid="errors.programmes && code === SCHOOL_PROGRAMMES[0] ? 'true' : undefined"
              class="flex h-11 items-center gap-2 rounded-full border-[1.5px] px-[18px] text-[15px] font-semibold transition-colors"
              :class="form.programmes.includes(code)
                ? 'border-stone-900 bg-stone-900 text-white'
                : [errors.programmes ? 'border-red-600' : 'border-salm-input-border', 'bg-white text-stone-700 hover:border-stone-900']"
              @click="toggleProgramme(code)"
            >
              <span v-if="form.programmes.includes(code)" aria-hidden="true">✓</span>{{ programmeLabel(code) }}
            </button>
          </div>
          <p v-if="errors.programmes" :id="`${id('programmes')}-error`" class="mt-2 text-[13px] font-medium text-red-700">{{ errors.programmes }}</p>
        </fieldset>

        <div v-if="hasOther" class="flex flex-col gap-2">
          <label :for="id('otherProgramme')" class="text-[13px] font-semibold text-stone-700">Précisez <span class="font-normal text-stone-600">(facultatif)</span></label>
          <input
            :id="id('otherProgramme')" v-model="form.otherProgramme" type="text" maxlength="120"
            :class="[inputClass, border('otherProgramme')]"
            :aria-invalid="errors.otherProgramme ? 'true' : undefined"
            :aria-describedby="errors.otherProgramme ? `${id('otherProgramme')}-error` : undefined"
          >
          <p v-if="errors.otherProgramme" :id="`${id('otherProgramme')}-error`" class="text-[13px] font-medium text-red-700">{{ errors.otherProgramme }}</p>
        </div>

        <div class="pointer-events-none absolute top-0 left-0 h-px w-px overflow-hidden opacity-0" aria-hidden="true">
          <label :for="`${uid}-website`">Site web</label>
          <input :id="`${uid}-website`" v-model="form.website" type="text" name="website" tabindex="-1" autocomplete="off">
        </div>

        <div class="flex justify-end pt-2">
          <button
            type="submit"
            class="flex h-[54px] w-full items-center justify-center gap-3 rounded-[14px] bg-stone-900 px-7 font-salm-title text-base font-bold text-white transition-colors hover:bg-stone-700 sm:w-auto"
          >
            Continuer
            <svg class="size-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
          </button>
        </div>
      </form>

      <!-- Étape 2 : exposants et stand -->
      <form v-else-if="step === 2" class="flex flex-col gap-[22px]" :class="stepSlide" novalidate @submit.prevent="submit">
        <h2 ref="stepTitle" tabindex="-1" class="sr-only">Étape 2 sur 3 : exposants et stand</h2>

        <fieldset class="m-0 flex flex-col gap-2.5 border-0 p-0">
          <legend class="mb-2.5 p-0 text-[13px] font-semibold text-stone-700">Exposants présents sur le stand *</legend>
          <div
            v-for="(exhibitor, i) in form.exhibitors"
            :key="i"
            class="grid grid-cols-[28px_minmax(0,1fr)] items-start gap-2.5 sm:grid-cols-[28px_minmax(0,1.3fr)_minmax(0,1fr)_40px]"
          >
            <span class="pt-3.5 text-sm font-bold text-stone-600">{{ i + 1 }}</span>
            <div class="flex flex-col gap-1">
              <input
                :id="id(`exhibitors.${i}.fullName`)" v-model="exhibitor.fullName" type="text" maxlength="100"
                :aria-label="`Nom et prénoms de l'exposant ${i + 1}`" placeholder="Nom et prénoms"
                :class="[inputClass, border(`exhibitors.${i}.fullName`)]"
                :aria-invalid="errors[`exhibitors.${i}.fullName`] ? 'true' : undefined"
                :aria-describedby="errors[`exhibitors.${i}.fullName`] ? `${id(`exhibitors.${i}.fullName`)}-error` : undefined"
              >
              <p v-if="errors[`exhibitors.${i}.fullName`]" :id="`${id(`exhibitors.${i}.fullName`)}-error`" class="text-[13px] font-medium text-red-700">{{ errors[`exhibitors.${i}.fullName`] }}</p>
            </div>
            <div class="col-start-2 flex flex-col gap-1 sm:col-start-auto">
              <input
                :id="id(`exhibitors.${i}.contact`)" v-model="exhibitor.contact" type="tel" inputmode="tel"
                :aria-label="`Contact de l'exposant ${i + 1}`" placeholder="Contact (téléphone)"
                :class="[inputClass, border(`exhibitors.${i}.contact`)]"
                :aria-invalid="errors[`exhibitors.${i}.contact`] ? 'true' : undefined"
                :aria-describedby="errors[`exhibitors.${i}.contact`] ? `${id(`exhibitors.${i}.contact`)}-error` : undefined"
              >
              <p v-if="errors[`exhibitors.${i}.contact`]" :id="`${id(`exhibitors.${i}.contact`)}-error`" class="text-[13px] font-medium text-red-700">{{ errors[`exhibitors.${i}.contact`] }}</p>
            </div>
            <button
              v-if="form.exhibitors.length > 1"
              type="button"
              class="col-start-2 flex h-10 items-center justify-center gap-1.5 justify-self-start rounded-lg px-2 text-sm font-semibold text-stone-600 hover:bg-stone-200/60 hover:text-stone-900 sm:col-start-auto sm:mt-[5px] sm:w-10 sm:justify-self-auto sm:px-0"
              :aria-label="`Retirer l'exposant ${i + 1}`"
              @click="removeExhibitor(i)"
            >
              <svg class="size-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M6 18 18 6M6 6l12 12" /></svg>
              <span class="sm:hidden" aria-hidden="true">Retirer</span>
            </button>
          </div>
          <p v-if="errors.exhibitors" class="text-[13px] font-medium text-red-700">{{ errors.exhibitors }}</p>
          <button
            v-if="form.exhibitors.length < SCHOOL_MAX_EXHIBITORS"
            type="button"
            class="flex h-10 items-center gap-2 self-start rounded-[10px] pr-3.5 pl-[38px] text-sm font-bold text-[#9A3A06] hover:text-[#7C2D12]"
            @click="addExhibitor"
          >
            + Ajouter un exposant
          </button>
        </fieldset>

        <fieldset class="m-0 flex flex-col border-0 p-0" :aria-describedby="errors.standTypeId ? `${id('standTypeId')}-error` : undefined">
          <legend class="mb-2.5 p-0 text-[13px] font-semibold text-stone-700">Stand exposant *</legend>
          <div class="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <label
              v-for="stand in edition.standTypes"
              :key="stand.id"
              class="relative flex cursor-pointer flex-col items-start gap-1.5 rounded-[14px] border-[1.5px] px-[18px] py-4 transition-colors has-[:focus-visible]:shadow-[0_0_0_3px_rgba(194,65,12,0.4)]"
              :class="form.standTypeId === stand.id
                ? 'border-salm-accent bg-[#FDF1E8]'
                : [errors.standTypeId ? 'border-red-600' : 'border-salm-input-border', 'bg-white hover:border-stone-600']"
            >
              <input
                v-model="form.standTypeId"
                type="radio"
                :name="`${uid}-stand`"
                :value="stand.id"
                class="sr-only"
                :aria-invalid="errors.standTypeId ? 'true' : undefined"
                @change="clearErrors(['standTypeId'])"
              >
              <span class="flex items-center justify-between gap-3 self-stretch">
                <span class="font-salm-title text-base font-extrabold text-stone-900">{{ stand.name }}</span>
                <span
                  class="size-[18px] shrink-0 rounded-full"
                  :class="form.standTypeId === stand.id ? 'border-[5px] border-salm-accent' : 'border-[1.5px] border-stone-500'"
                  aria-hidden="true"
                />
              </span>
              <span v-if="stand.description" class="text-[13px] leading-[1.4] text-stone-600">{{ stand.description }}</span>
              <span v-if="stand.priceLabel" class="text-[13px] font-semibold text-stone-700">{{ stand.priceLabel }}</span>
            </label>
          </div>
          <p v-if="errors.standTypeId" :id="`${id('standTypeId')}-error`" class="mt-2 text-[13px] font-medium text-red-700">{{ errors.standTypeId }}</p>
        </fieldset>

        <div class="flex flex-col gap-2">
          <label :for="id('question')" class="text-[13px] font-semibold text-stone-700">Avez-vous une question ?</label>
          <textarea
            :id="id('question')" v-model="form.question" rows="2" maxlength="1000" placeholder="Facultatif"
            :class="[inputClass, border('question'), 'h-[72px] resize-none py-3']"
            :aria-invalid="errors.question ? 'true' : undefined"
            :aria-describedby="errors.question ? `${id('question')}-error` : undefined"
          />
          <p v-if="errors.question" :id="`${id('question')}-error`" class="text-[13px] font-medium text-red-700">{{ errors.question }}</p>
        </div>

        <p class="text-[13px] leading-normal text-stone-500">{{ usageNotice }}</p>
        <p v-if="globalError" role="alert" class="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800">{{ globalError }}</p>

        <div class="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
          <button
            type="button"
            class="h-[54px] rounded-[14px] border-[1.5px] border-salm-input-border px-[22px] text-[15px] font-semibold text-stone-700 transition-colors hover:border-stone-900"
            @click="back"
          >
            ← Retour
          </button>
          <button
            type="submit"
            :disabled="submitting"
            class="flex h-[54px] items-center justify-center gap-3 rounded-[14px] bg-salm-accent px-7 font-salm-title text-base font-bold text-white transition-colors hover:bg-[#9A3412] disabled:cursor-wait disabled:opacity-70"
          >
            {{ submitting ? 'Envoi en cours…' : 'Confirmer notre présence' }}
            <svg v-if="!submitting" class="size-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5" /></svg>
          </button>
        </div>
      </form>

      <!-- Étape 3 : présence confirmée -->
      <div v-else-if="summary" class="flex flex-col gap-5 pt-1.5" :class="stepSlide">
        <span class="salm-intro-stamp flex size-16 items-center justify-center rounded-full bg-green-100 text-green-700" style="--salm-delay: 0.25s" aria-hidden="true">
          <svg class="size-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
        </span>
        <h2 ref="stepTitle" tabindex="-1" class="font-salm-title text-[28px] font-extrabold tracking-[-0.02em] text-stone-900 focus:outline-none md:text-[32px]">Présence confirmée</h2>
        <p class="max-w-[560px] text-base leading-relaxed text-stone-600">
          <strong class="text-stone-900">{{ summary.name }}</strong> figure désormais parmi les établissements exposants du SALM {{ edition.year }}.
          Aucun badge à télécharger : l'équipe SALM vous recontacte pour finaliser votre stand.
        </p>
        <dl class="m-0 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div class="flex flex-col gap-1.5 rounded-[14px] border border-stone-200 bg-white px-[18px] py-4">
            <dt class="text-xs font-bold tracking-[0.08em] text-stone-600">STAND</dt>
            <dd class="m-0 font-salm-title text-[17px] font-extrabold">{{ summary.standName.replace(/^STAND\s+/i, '') }}</dd>
          </div>
          <div class="flex flex-col gap-1.5 rounded-[14px] border border-stone-200 bg-white px-[18px] py-4">
            <dt class="text-xs font-bold tracking-[0.08em] text-stone-600">EXPOSANTS</dt>
            <dd class="m-0 font-salm-title text-[17px] font-extrabold">{{ summary.exhibitorCount }}</dd>
          </div>
          <div class="flex flex-col gap-1.5 rounded-[14px] border border-stone-200 bg-white px-[18px] py-4">
            <dt class="text-xs font-bold tracking-[0.08em] text-stone-600">PROGRAMMES</dt>
            <dd class="m-0 font-salm-title text-[17px] font-extrabold">{{ summaryProgrammes }}</dd>
          </div>
        </dl>
        <p class="text-sm leading-normal text-stone-700">
          Vos exposants n'ont pas besoin de badge : ils seront pointés à l'accueil exposants sur une liste nominative.
        </p>
        <div class="flex flex-col gap-1.5 rounded-[14px] bg-[#F1ECE6] px-[18px] py-4 text-sm text-stone-700">
          <span class="font-bold">{{ datesAmp }}<template v-if="edition.timeline.hoursLabel"> · {{ edition.timeline.hoursLabel }}</template></span>
          <span>{{ venue }}</span>
        </div>
        <div class="flex flex-col gap-3 sm:flex-row">
          <a
            href="/api/salm/agenda.ics"
            download
            class="flex h-[54px] items-center justify-center gap-2.5 rounded-[14px] bg-stone-900 px-6 font-salm-title text-[15px] font-bold text-white transition-colors hover:bg-stone-700"
          >
            <svg class="size-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></svg>
            Ajouter à mon agenda
          </a>
          <NuxtLink
            to="/salm"
            class="flex h-[54px] items-center justify-center rounded-[14px] border-[1.5px] border-salm-input-border px-[22px] text-[15px] font-semibold text-stone-700 transition-colors hover:border-stone-900"
          >
            Retour à la page SALM
          </NuxtLink>
        </div>
      </div>
    </div>
  </div>
</template>
