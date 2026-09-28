<script setup lang="ts">
import type { SalmAdminEditionDetail } from '#shared/types/salm'

// Section « Général » de la fiche d'une édition : année, intitulé, organisateur, ville, lieu, slogan (FR-112, FR-114).
const props = defineProps<{ edition: SalmAdminEditionDetail }>()
const emit = defineEmits<{ saved: [message: string] }>()

const fields = [
  { key: 'salonName', label: 'Intitulé du salon', max: 150, required: true },
  { key: 'organizerName', label: 'Organisateur', max: 150, required: true },
  { key: 'city', label: 'Ville', max: 80, required: true },
  { key: 'venue', label: 'Lieu', max: 200, required: false, help: 'Laissé vide, la page affiche « Lieu à confirmer ».' },
  { key: 'tagline', label: 'Slogan', max: 150, required: false },
] as const
type FieldKey = (typeof fields)[number]['key']

function fromEdition(e: SalmAdminEditionDetail) {
  return {
    year: String(e.year),
    salonName: e.salonName,
    organizerName: e.organizerName,
    city: e.city,
    venue: e.venue ?? '',
    tagline: e.tagline ?? '',
  }
}

const form = reactive(fromEdition(props.edition))
const errors = ref<Record<string, string>>({})
const { errorMessage, showError, clear } = useSalmFlash()
const saving = ref(false)

// Nouvelle fiche chargée (autre édition) : formulaire réinitialisé
watch(() => props.edition.id, () => Object.assign(form, fromEdition(props.edition)))

async function save() {
  saving.value = true
  errors.value = {}
  clear()
  const year = Number(form.year.trim())
  const body: Record<string, unknown> = {
    salonName: form.salonName,
    organizerName: form.organizerName,
    city: form.city,
    venue: form.venue,
    tagline: form.tagline,
  }
  if (!props.edition.yearLocked) body.year = form.year.trim() && Number.isInteger(year) ? year : form.year
  try {
    await $fetch(`/api/admin/salm/editions/${props.edition.id}`, { method: 'PATCH', body })
    emit('saved', 'Informations enregistrées.')
  }
  catch (err) {
    // La saisie est conservée (FR-199)
    const { code, errors: fieldErrors } = parseSalmAdminError(err)
    if (code === 'VALIDATION') {
      const max = Object.fromEntries(fields.map((f) => [f.key, f.max])) as Record<string, number>
      errors.value = Object.fromEntries(Object.entries(fieldErrors).map(([f, c]) => [f, salmFieldErrorMessage(f, c, max[f])]))
      showError(salmAdminErrorMessage('VALIDATION'))
    }
    else if (code === 'YEAR_TAKEN' || code === 'YEAR_LOCKED') {
      errors.value = { year: salmAdminErrorFrom(err, { year }) }
    }
    else showError(salmAdminErrorFrom(err))
  }
  finally {
    saving.value = false
  }
}

function describedBy(key: FieldKey | 'year', help?: string) {
  if (errors.value[key]) return `edition-${key}-error`
  return help ? `edition-${key}-help` : undefined
}
</script>

<template>
  <form class="rounded-lg border border-gray-200 bg-white p-6 shadow-sm" novalidate @submit.prevent="save">
    <h2 class="mb-4 text-lg font-semibold text-gray-900">Informations générales</h2>
    <SalmAdminFlash :error="errorMessage" @dismiss="clear" />

    <div class="grid gap-4 sm:grid-cols-2">
      <div>
        <label for="edition-year" class="block text-sm font-medium text-gray-700">Année</label>
        <input
          id="edition-year"
          v-model="form.year"
          type="text"
          inputmode="numeric"
          autocomplete="off"
          :disabled="edition.yearLocked"
          :aria-invalid="errors.year ? 'true' : undefined"
          :aria-describedby="errors.year ? 'edition-year-error' : edition.yearLocked ? 'edition-year-help' : undefined"
          class="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 disabled:bg-gray-100 disabled:text-gray-500"
        >
        <p v-if="errors.year" id="edition-year-error" class="mt-1 text-sm text-red-600">{{ errors.year }}</p>
        <p v-else-if="edition.yearLocked" id="edition-year-help" class="mt-1 text-xs text-gray-500">
          L'année ne peut plus changer : des badges SALM{{ String(edition.year).slice(-2) }} ont déjà été émis.
        </p>
      </div>

      <div v-for="f in fields" :key="f.key" :class="f.key === 'salonName' ? 'sm:col-span-2' : ''">
        <label :for="`edition-${f.key}`" class="block text-sm font-medium text-gray-700">
          {{ f.label }}<span v-if="!f.required" class="font-normal text-gray-500"> (facultatif)</span>
        </label>
        <input
          :id="`edition-${f.key}`"
          v-model="form[f.key]"
          type="text"
          :required="f.required"
          :maxlength="f.max"
          :aria-invalid="errors[f.key] ? 'true' : undefined"
          :aria-describedby="describedBy(f.key, 'help' in f ? f.help : undefined)"
          class="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
        >
        <p v-if="errors[f.key]" :id="`edition-${f.key}-error`" class="mt-1 text-sm text-red-600">{{ errors[f.key] }}</p>
        <p v-else-if="'help' in f" :id="`edition-${f.key}-help`" class="mt-1 text-xs text-gray-500">{{ f.help }}</p>
      </div>
    </div>

    <div class="mt-6">
      <button
        type="submit"
        :disabled="saving"
        class="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {{ saving ? 'Enregistrement…' : 'Enregistrer' }}
      </button>
    </div>
  </form>
</template>
