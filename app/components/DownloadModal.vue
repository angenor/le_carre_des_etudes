<script setup lang="ts">
const props = defineProps<{
  magazineId: number
  magazineName: string
}>()

const emit = defineEmits<{
  close: []
}>()

const STUDY_LEVELS = [
  'Terminale / Futur bachelier',
  'BTS / DUT (Bac+2)',
  'Licence (Bac+3)',
  'Master (Bac+5)',
  'Doctorat',
  'Autre',
]

const IVORIAN_PHONE_REGEX = /^(01|05|07|27)\s?\d{2}\s?\d{2}\s?\d{2}\s?\d{2}$/

const form = reactive({
  fullName: '',
  contact: '',
  studyLevel: '',
  age: '' as string | number,
  fieldOfStudy: '',
})

const errors = reactive<Record<string, string>>({})
const submitting = ref(false)
const submitError = ref('')

function validateForm(): boolean {
  // Reset
  Object.keys(errors).forEach((k) => delete errors[k])

  if (!form.fullName.trim()) {
    errors.fullName = 'Le nom complet est requis'
  }

  if (!form.contact) {
    errors.contact = 'Le numéro de téléphone est requis'
  } else if (!IVORIAN_PHONE_REGEX.test(form.contact.trim())) {
    errors.contact = 'Format invalide (ex: 07 12 34 56 78)'
  }

  if (!form.studyLevel) {
    errors.studyLevel = 'Le niveau d\'étude est requis'
  }

  const age = Number(form.age)
  if (!form.age) {
    errors.age = 'L\'âge est requis'
  } else if (isNaN(age) || age < 15 || age > 99) {
    errors.age = 'L\'âge doit être entre 15 et 99'
  }

  if (!form.fieldOfStudy.trim()) {
    errors.fieldOfStudy = 'La filière est requise'
  }

  return Object.keys(errors).length === 0
}

async function handleSubmit() {
  if (!validateForm()) return

  submitting.value = true
  submitError.value = ''

  try {
    const result = await $fetch<{ id: number; pdfUrl: string }>('/api/downloads', {
      method: 'POST',
      body: {
        fullName: form.fullName.trim(),
        contact: form.contact.trim(),
        studyLevel: form.studyLevel,
        age: Number(form.age),
        fieldOfStudy: form.fieldOfStudy.trim(),
        magazineId: props.magazineId,
      },
    })

    // Déclencher le téléchargement du PDF
    const link = document.createElement('a')
    link.href = result.pdfUrl
    link.download = ''
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    emit('close')
  } catch (err: unknown) {
    const error = err as { data?: { data?: { errors?: Record<string, string> }; message?: string } }
    if (error?.data?.data?.errors) {
      Object.assign(errors, error.data.data.errors)
    } else {
      submitError.value = error?.data?.message || 'Une erreur est survenue'
    }
  } finally {
    submitting.value = false
  }
}

function handleOverlayClick(e: MouseEvent) {
  if (e.target === e.currentTarget) {
    emit('close')
  }
}
</script>

<template>
  <Teleport to="body">
    <div
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      @click="handleOverlayClick"
    >
      <div class="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-bold text-gray-900">
            Télécharger {{ magazineName }}
          </h2>
          <button
            type="button"
            class="rounded-md p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
            aria-label="Fermer"
            @click="$emit('close')"
          >
            <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <p class="mt-1 text-sm text-gray-500">
          Remplissez le formulaire pour accéder au téléchargement gratuit.
        </p>

        <form class="mt-4 space-y-4" @submit.prevent="handleSubmit">
          <!-- Nom complet -->
          <div>
            <label for="fullName" class="block text-sm font-medium text-gray-700">
              Nom & prénoms
            </label>
            <input
              id="fullName"
              v-model="form.fullName"
              type="text"
              class="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm transition-colors focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              :class="{ 'border-red-300': errors.fullName }"
              placeholder="Kouassi Aya Marie"
            />
            <p v-if="errors.fullName" class="mt-1 text-xs text-red-500">{{ errors.fullName }}</p>
          </div>

          <!-- Contact -->
          <div>
            <label for="contact" class="block text-sm font-medium text-gray-700">
              Numéro de téléphone
            </label>
            <input
              id="contact"
              v-model="form.contact"
              type="tel"
              class="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm transition-colors focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              :class="{ 'border-red-300': errors.contact }"
              placeholder="07 12 34 56 78"
            />
            <p v-if="errors.contact" class="mt-1 text-xs text-red-500">{{ errors.contact }}</p>
          </div>

          <!-- Niveau d'étude -->
          <div>
            <label for="studyLevel" class="block text-sm font-medium text-gray-700">
              Niveau d'étude
            </label>
            <select
              id="studyLevel"
              v-model="form.studyLevel"
              class="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm transition-colors focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              :class="{ 'border-red-300': errors.studyLevel }"
            >
              <option value="" disabled>Sélectionnez votre niveau</option>
              <option v-for="level in STUDY_LEVELS" :key="level" :value="level">
                {{ level }}
              </option>
            </select>
            <p v-if="errors.studyLevel" class="mt-1 text-xs text-red-500">{{ errors.studyLevel }}</p>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <!-- Âge -->
            <div>
              <label for="age" class="block text-sm font-medium text-gray-700">
                Âge
              </label>
              <input
                id="age"
                v-model="form.age"
                type="number"
                min="15"
                max="99"
                class="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm transition-colors focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                :class="{ 'border-red-300': errors.age }"
                placeholder="22"
              />
              <p v-if="errors.age" class="mt-1 text-xs text-red-500">{{ errors.age }}</p>
            </div>

            <!-- Filière -->
            <div>
              <label for="fieldOfStudy" class="block text-sm font-medium text-gray-700">
                Filière
              </label>
              <input
                id="fieldOfStudy"
                v-model="form.fieldOfStudy"
                type="text"
                class="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm transition-colors focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                :class="{ 'border-red-300': errors.fieldOfStudy }"
                placeholder="Droit"
              />
              <p v-if="errors.fieldOfStudy" class="mt-1 text-xs text-red-500">{{ errors.fieldOfStudy }}</p>
            </div>
          </div>

          <!-- Erreur globale -->
          <p v-if="submitError" class="text-sm text-red-500">{{ submitError }}</p>

          <!-- Bouton soumettre -->
          <button
            type="submit"
            :disabled="submitting"
            class="w-full rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {{ submitting ? 'Envoi en cours...' : 'Télécharger gratuitement' }}
          </button>
        </form>
      </div>
    </div>
  </Teleport>
</template>
