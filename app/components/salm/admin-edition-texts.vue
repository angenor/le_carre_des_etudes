<script setup lang="ts">
import type { SalmAdminEditionDetail } from '#shared/types/salm'

// Section « Textes et affiche » : « Pourquoi le SALM ? », publics cibles, affiche et PDF du programme
// (FR-130, FR-133, FR-141 à FR-143). Un seul PATCH pour toute la section.
const props = defineProps<{ edition: SalmAdminEditionDetail }>()
const emit = defineEmits<{ saved: [message?: string] }>()

const WHY_MAX = 2000
const AUDIENCES_MAX = 6
const pdfRules = SALM_PDF_RULES
const input = 'mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500'

interface AudienceRow { key: number; title: string; text: string }
let nextKey = 0

function fromEdition(e: SalmAdminEditionDetail) {
  return {
    whyTitle: e.whyTitle ?? '',
    whyText: e.whyText ?? '',
    audiences: e.audiences.map((a): AudienceRow => ({ key: nextKey++, title: a.title, text: a.text })),
    posterPath: e.poster?.path ?? null,
    posterAlt: e.poster?.alt ?? '',
    programPdfPath: e.programPdfPath,
  }
}

const form = reactive(fromEdition(props.edition))
watch(() => props.edition, (e) => Object.assign(form, fromEdition(e)))

const errors = ref<Record<string, string>>({})
const { errorMessage, showError, clear } = useSalmFlash()
const saving = ref(false)

// ---- Publics cibles ----
const audiences = computed({ get: () => form.audiences, set: (v) => { form.audiences = v } })
const order = useSalmOrder({ items: audiences, key: (a) => a.key, label: (a) => a.title || 'Public sans titre' })

async function addAudience() {
  form.audiences = [...form.audiences, { key: nextKey++, title: '', text: '' }]
  await nextTick()
  document.getElementById(`audience-${form.audiences.at(-1)!.key}-title`)?.focus()
}

function removeAudience(row: AudienceRow) {
  if (!confirm(`Retirer le public « ${row.title || 'sans titre'} » ?`)) return
  form.audiences = form.audiences.filter((a) => a !== row)
}

// ---- PDF du programme ----
const { upload } = useSalmUpload()
const pdfInput = ref<HTMLInputElement>()
const pdfUploading = ref(false)
const pdfProgress = ref(0)
const pdfError = ref('')

async function onPdf(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  target.value = ''
  if (!file) return
  pdfError.value = ''
  pdfUploading.value = true
  pdfProgress.value = 0
  try {
    form.programPdfPath = (await upload(file, 'pdf', (p) => { pdfProgress.value = p })).path
  }
  catch (err) {
    pdfError.value = salmAdminErrorFrom(err, { kind: 'pdf' })
  }
  finally {
    pdfUploading.value = false
  }
}

function removePdf() {
  if (confirm('Retirer le PDF du programme ? Le bouton « Télécharger le programme (PDF) » disparaîtra de la page après l\'enregistrement.')) {
    form.programPdfPath = null
  }
}

// ---- Enregistrement ----
function fieldError(field: string) {
  return errors.value[field]
}

async function save() {
  saving.value = true
  errors.value = {}
  clear()
  try {
    await $fetch(`/api/admin/salm/editions/${props.edition.id}`, {
      method: 'PATCH',
      body: {
        whyTitle: form.whyTitle,
        whyText: form.whyText,
        audiences: form.audiences.map(({ title, text }) => ({ title, text })),
        posterPath: form.posterPath,
        posterAlt: form.posterAlt,
        programPdfPath: form.programPdfPath,
      },
    })
    emit('saved', 'Textes et affiche enregistrés.')
  }
  catch (err) {
    const { code, errors: fieldErrors } = parseSalmAdminError(err)
    if (code !== 'VALIDATION') return showError(salmAdminErrorFrom(err))
    const max: Record<string, number> = { whyTitle: 200, whyText: WHY_MAX, title: 80, text: 300, posterAlt: 200 }
    errors.value = Object.fromEntries(Object.entries(fieldErrors).map(([f, c]) => {
      const key = f.split('.').at(-1)!
      return [f, salmFieldErrorMessage(f, c, max[f] ?? max[key])]
    }))
    showError(salmAdminErrorMessage('VALIDATION'))
  }
  finally {
    saving.value = false
  }
}
</script>

<template>
  <form class="space-y-6" novalidate @submit.prevent="save">
    <SalmAdminFlash :error="errorMessage" @dismiss="clear" />

    <!-- Pourquoi le SALM ? -->
    <fieldset class="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <legend class="px-1 text-lg font-semibold text-gray-900">« Pourquoi le SALM ? »</legend>
      <div class="space-y-4">
        <div>
          <label for="why-title" class="block text-sm font-medium text-gray-700">Titre <span class="font-normal text-gray-500">(facultatif)</span></label>
          <input
            id="why-title"
            v-model="form.whyTitle"
            type="text"
            maxlength="200"
            :aria-invalid="fieldError('whyTitle') ? 'true' : undefined"
            :aria-describedby="fieldError('whyTitle') ? 'why-title-error' : undefined"
            :class="input"
          >
          <p v-if="fieldError('whyTitle')" id="why-title-error" class="mt-1 text-sm text-red-600">{{ fieldError('whyTitle') }}</p>
        </div>
        <div>
          <label for="why-text" class="block text-sm font-medium text-gray-700">Paragraphe <span class="font-normal text-gray-500">(texte brut, {{ WHY_MAX }} caractères au plus)</span></label>
          <textarea
            id="why-text"
            v-model="form.whyText"
            rows="6"
            :maxlength="WHY_MAX"
            :aria-invalid="fieldError('whyText') ? 'true' : undefined"
            :aria-describedby="fieldError('whyText') ? 'why-text-error' : form.whyText.length > 1800 ? 'why-text-count' : undefined"
            :class="input"
          />
          <p v-if="fieldError('whyText')" id="why-text-error" class="mt-1 text-sm text-red-600">{{ fieldError('whyText') }}</p>
          <p v-else-if="form.whyText.length > 1800" id="why-text-count" class="mt-1 text-xs text-amber-700" aria-live="polite">
            {{ form.whyText.length }} / {{ WHY_MAX }} caractères
          </p>
        </div>
      </div>
    </fieldset>

    <!-- Publics cibles -->
    <fieldset class="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <legend class="px-1 text-lg font-semibold text-gray-900">Publics cibles</legend>
      <p class="mb-4 text-sm text-gray-500">{{ AUDIENCES_MAX }} cartes au plus, dans l'ordre de la page.</p>
      <p class="sr-only" aria-live="polite">{{ order.announcement.value }}</p>
      <p v-if="fieldError('audiences')" class="mb-3 text-sm text-red-600">{{ fieldError('audiences') }}</p>

      <ol v-if="form.audiences.length" class="space-y-4">
        <li v-for="(a, i) in form.audiences" :key="a.key" class="rounded-lg border border-gray-200 p-4">
          <div class="mb-3 flex items-center justify-between gap-2">
            <span class="text-sm font-medium text-gray-500">Carte {{ i + 1 }}</span>
            <span class="flex items-center gap-2">
              <SalmAdminOrderButtons
                :ref="order.bindButtons(a)"
                :index="i"
                :count="form.audiences.length"
                :label="a.title || 'Public sans titre'"
                @move="order.move(i, $event)"
              />
              <button
                type="button"
                class="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50"
                @click="removeAudience(a)"
              >
                Retirer<span class="sr-only"> « {{ a.title || 'sans titre' }} »</span>
              </button>
            </span>
          </div>
          <div class="grid gap-3">
            <div>
              <label :for="`audience-${a.key}-title`" class="block text-sm font-medium text-gray-700">Titre</label>
              <input
                :id="`audience-${a.key}-title`"
                v-model="a.title"
                type="text"
                maxlength="80"
                required
                :aria-invalid="fieldError(`audiences.${i}.title`) ? 'true' : undefined"
                :aria-describedby="fieldError(`audiences.${i}.title`) ? `audience-${a.key}-title-error` : undefined"
                :class="input"
              >
              <p v-if="fieldError(`audiences.${i}.title`)" :id="`audience-${a.key}-title-error`" class="mt-1 text-sm text-red-600">{{ fieldError(`audiences.${i}.title`) }}</p>
            </div>
            <div>
              <label :for="`audience-${a.key}-text`" class="block text-sm font-medium text-gray-700">Texte</label>
              <textarea
                :id="`audience-${a.key}-text`"
                v-model="a.text"
                rows="2"
                maxlength="300"
                required
                :aria-invalid="fieldError(`audiences.${i}.text`) ? 'true' : undefined"
                :aria-describedby="fieldError(`audiences.${i}.text`) ? `audience-${a.key}-text-error` : undefined"
                :class="input"
              />
              <p v-if="fieldError(`audiences.${i}.text`)" :id="`audience-${a.key}-text-error`" class="mt-1 text-sm text-red-600">{{ fieldError(`audiences.${i}.text`) }}</p>
            </div>
          </div>
        </li>
      </ol>
      <p v-else class="text-sm text-gray-500">Aucun public cible.</p>

      <button
        type="button"
        :disabled="form.audiences.length >= AUDIENCES_MAX"
        class="mt-4 rounded-lg bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700 hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-50"
        @click="addAudience"
      >
        + Ajouter un public
      </button>
    </fieldset>

    <!-- Affiche et programme -->
    <div class="grid gap-6 lg:grid-cols-2">
      <div class="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <SalmAdminImageField
          v-model="form.posterPath"
          v-model:alt="form.posterAlt"
          label="Affiche"
          :default-alt="`Affiche du SALM ${edition.year}`"
          :error="fieldError('posterPath')"
          :alt-error="fieldError('posterAlt')"
        />
      </div>

      <fieldset class="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <legend class="px-1 text-sm font-medium text-gray-700">PDF du programme</legend>
        <p id="program-pdf-rules" class="text-xs text-gray-500">{{ pdfRules }}.</p>
        <p v-if="form.programPdfPath" class="mt-3 text-sm text-gray-700">
          <a :href="form.programPdfPath" target="_blank" rel="noopener" class="font-medium text-emerald-700 underline underline-offset-2">Ouvrir le PDF</a>
          <span class="ml-2 break-all text-xs text-gray-500">{{ form.programPdfPath.split('/').pop() }}</span>
        </p>
        <p v-else class="mt-3 text-sm text-gray-500">Aucun PDF : le bouton « Télécharger le programme (PDF) » n'est pas affiché.</p>
        <div class="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            :disabled="pdfUploading"
            aria-describedby="program-pdf-rules"
            class="rounded-lg bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700 hover:bg-emerald-100 disabled:opacity-50"
            @click="pdfInput?.click()"
          >
            {{ form.programPdfPath ? 'Remplacer le PDF' : 'Joindre le PDF' }}
          </button>
          <button
            v-if="form.programPdfPath"
            type="button"
            class="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            @click="removePdf"
          >
            Retirer
          </button>
          <input ref="pdfInput" type="file" accept="application/pdf" class="hidden" tabindex="-1" aria-hidden="true" @change="onPdf">
        </div>
        <div v-if="pdfUploading" class="mt-3">
          <label for="program-pdf-progress" class="mb-1 flex justify-between text-xs text-gray-600">
            <span>Envoi du PDF…</span><span>{{ pdfProgress }} %</span>
          </label>
          <progress id="program-pdf-progress" :value="pdfProgress" max="100" class="h-2 w-full accent-emerald-500" />
        </div>
        <p v-if="pdfError || fieldError('programPdfPath')" class="mt-2 text-sm text-red-600" role="alert">{{ pdfError || fieldError('programPdfPath') }}</p>
      </fieldset>
    </div>

    <div>
      <button
        type="submit"
        :disabled="saving || pdfUploading"
        class="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {{ saving ? 'Enregistrement…' : 'Enregistrer' }}
      </button>
    </div>
  </form>
</template>
