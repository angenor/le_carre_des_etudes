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

// Refs GSAP
const overlayRef = ref<HTMLElement>()
const panelRef = ref<HTMLElement>()
const iconRef = ref<HTMLElement>()
const fieldsRef = ref<HTMLElement>()

onMounted(() => {
  // Overlay fade in
  if (overlayRef.value) {
    useGsap.fromTo(overlayRef.value,
      { opacity: 0 },
      { opacity: 1, duration: 0.35, ease: 'power2.out' },
    )
  }

  // Panel — drop from top with elastic bounce
  if (panelRef.value) {
    useGsap.fromTo(panelRef.value,
      { y: -80, opacity: 0, scale: 0.85, rotateX: 12 },
      {
        y: 0,
        opacity: 1,
        scale: 1,
        rotateX: 0,
        duration: 0.7,
        ease: 'back.out(1.7)',
        delay: 0.1,
      },
    )
  }

  // Icône de téléchargement — bounce amusant
  if (iconRef.value) {
    useGsap.fromTo(iconRef.value,
      { y: -40, opacity: 0, scale: 0 },
      {
        y: 0,
        opacity: 1,
        scale: 1,
        duration: 0.6,
        ease: 'elastic.out(1.2, 0.5)',
        delay: 0.4,
      },
    )
  }

  // Champs du formulaire — stagger slide-up
  if (fieldsRef.value) {
    useGsap.fromTo(fieldsRef.value.children,
      { y: 20, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: 0.4,
        stagger: 0.07,
        ease: 'power2.out',
        delay: 0.35,
      },
    )
  }
})

function animateClose() {
  const tl = useGsap.timeline({
    onComplete: () => emit('close'),
  })

  if (panelRef.value) {
    tl.to(panelRef.value, {
      y: 60,
      opacity: 0,
      scale: 0.9,
      duration: 0.3,
      ease: 'power3.in',
    }, 0)
  }

  if (overlayRef.value) {
    tl.to(overlayRef.value, {
      opacity: 0,
      duration: 0.25,
      ease: 'power2.in',
    }, 0.1)
  }
}

function validateForm(): boolean {
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

    animateClose()
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
    animateClose()
  }
}
</script>

<template>
  <Teleport to="body">
    <div
      ref="overlayRef"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      @click="handleOverlayClick"
    >
      <div
        ref="panelRef"
        class="relative w-full max-w-md overflow-hidden rounded-2xl border border-white/10 bg-gray-900 shadow-2xl shadow-amber-500/10"
        style="perspective: 800px"
      >
        <!-- Glow décoratif en haut -->
        <div class="absolute -top-24 left-1/2 h-48 w-48 -translate-x-1/2 rounded-full bg-amber-500/20 blur-3xl" />

        <div class="relative p-6">
          <!-- Header -->
          <div class="flex items-start justify-between">
            <div class="flex items-center gap-3">
              <!-- Icône animée -->
              <div
                ref="iconRef"
                class="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-500/15 ring-1 ring-amber-500/30"
              >
                <svg class="h-5 w-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
                </svg>
              </div>
              <div>
                <h2 class="text-base font-bold text-white">
                  Télécharger
                </h2>
                <p class="text-sm text-amber-400/80">
                  {{ magazineName }}
                </p>
              </div>
            </div>
            <button
              type="button"
              class="rounded-lg p-1.5 text-gray-500 transition-colors hover:bg-white/5 hover:text-gray-300"
              aria-label="Fermer"
              @click="animateClose"
            >
              <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <p class="mt-3 text-sm leading-relaxed text-gray-400">
            Remplissez le formulaire pour accéder au téléchargement gratuit.
          </p>

          <!-- Séparateur -->
          <div class="mt-4 h-px bg-linear-to-r from-transparent via-amber-500/25 to-transparent" />

          <!-- Formulaire -->
          <form ref="fieldsRef" class="mt-5 space-y-4" @submit.prevent="handleSubmit">
            <!-- Nom complet -->
            <div>
              <label for="dl-fullName" class="mb-1.5 block text-sm font-medium text-gray-300">
                Nom & prénoms
              </label>
              <input
                id="dl-fullName"
                v-model="form.fullName"
                type="text"
                class="block w-full rounded-lg border bg-gray-800/60 px-3.5 py-2.5 text-sm text-white shadow-sm transition-all placeholder:text-gray-500 focus:outline-none focus:ring-2"
                :class="errors.fullName
                  ? 'border-red-500/50 focus:ring-red-500/30'
                  : 'border-white/10 focus:border-amber-500/50 focus:ring-amber-500/20'"
                placeholder="Kouassi Aya Marie"
              />
              <p v-if="errors.fullName" class="mt-1 text-xs text-red-400">{{ errors.fullName }}</p>
            </div>

            <!-- Contact -->
            <div>
              <label for="dl-contact" class="mb-1.5 block text-sm font-medium text-gray-300">
                Numéro de téléphone
              </label>
              <input
                id="dl-contact"
                v-model="form.contact"
                type="tel"
                class="block w-full rounded-lg border bg-gray-800/60 px-3.5 py-2.5 text-sm text-white shadow-sm transition-all placeholder:text-gray-500 focus:outline-none focus:ring-2"
                :class="errors.contact
                  ? 'border-red-500/50 focus:ring-red-500/30'
                  : 'border-white/10 focus:border-amber-500/50 focus:ring-amber-500/20'"
                placeholder="07 12 34 56 78"
              />
              <p v-if="errors.contact" class="mt-1 text-xs text-red-400">{{ errors.contact }}</p>
            </div>

            <!-- Niveau d'étude -->
            <div>
              <label for="dl-studyLevel" class="mb-1.5 block text-sm font-medium text-gray-300">
                Niveau d'étude
              </label>
              <select
                id="dl-studyLevel"
                v-model="form.studyLevel"
                class="block w-full rounded-lg border bg-gray-800/60 px-3.5 py-2.5 text-sm text-white shadow-sm transition-all focus:outline-none focus:ring-2"
                :class="errors.studyLevel
                  ? 'border-red-500/50 focus:ring-red-500/30'
                  : 'border-white/10 focus:border-amber-500/50 focus:ring-amber-500/20'"
              >
                <option value="" disabled class="text-gray-500">Sélectionnez votre niveau</option>
                <option v-for="level in STUDY_LEVELS" :key="level" :value="level" class="bg-gray-800 text-white">
                  {{ level }}
                </option>
              </select>
              <p v-if="errors.studyLevel" class="mt-1 text-xs text-red-400">{{ errors.studyLevel }}</p>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <!-- Âge -->
              <div>
                <label for="dl-age" class="mb-1.5 block text-sm font-medium text-gray-300">
                  Âge
                </label>
                <input
                  id="dl-age"
                  v-model="form.age"
                  type="number"
                  min="15"
                  max="99"
                  class="block w-full rounded-lg border bg-gray-800/60 px-3.5 py-2.5 text-sm text-white shadow-sm transition-all placeholder:text-gray-500 focus:outline-none focus:ring-2"
                  :class="errors.age
                    ? 'border-red-500/50 focus:ring-red-500/30'
                    : 'border-white/10 focus:border-amber-500/50 focus:ring-amber-500/20'"
                  placeholder="22"
                />
                <p v-if="errors.age" class="mt-1 text-xs text-red-400">{{ errors.age }}</p>
              </div>

              <!-- Filière -->
              <div>
                <label for="dl-fieldOfStudy" class="mb-1.5 block text-sm font-medium text-gray-300">
                  Filière
                </label>
                <input
                  id="dl-fieldOfStudy"
                  v-model="form.fieldOfStudy"
                  type="text"
                  class="block w-full rounded-lg border bg-gray-800/60 px-3.5 py-2.5 text-sm text-white shadow-sm transition-all placeholder:text-gray-500 focus:outline-none focus:ring-2"
                  :class="errors.fieldOfStudy
                    ? 'border-red-500/50 focus:ring-red-500/30'
                    : 'border-white/10 focus:border-amber-500/50 focus:ring-amber-500/20'"
                  placeholder="Droit"
                />
                <p v-if="errors.fieldOfStudy" class="mt-1 text-xs text-red-400">{{ errors.fieldOfStudy }}</p>
              </div>
            </div>

            <!-- Erreur globale -->
            <p v-if="submitError" class="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-400">
              {{ submitError }}
            </p>

            <!-- Bouton soumettre -->
            <button
              type="submit"
              :disabled="submitting"
              class="group relative w-full overflow-hidden rounded-xl bg-amber-500 px-4 py-3 text-sm font-bold tracking-wide text-gray-900 uppercase shadow-lg shadow-amber-500/20 transition-all hover:bg-amber-400 hover:shadow-amber-400/30 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <span class="relative flex items-center justify-center gap-2">
                <svg v-if="!submitting" class="h-4.5 w-4.5 transition-transform group-hover:translate-y-0.5" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
                </svg>
                <svg v-else class="h-4.5 w-4.5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                {{ submitting ? 'Envoi en cours...' : 'Télécharger gratuitement' }}
              </span>
            </button>
          </form>
        </div>
      </div>
    </div>
  </Teleport>
</template>
