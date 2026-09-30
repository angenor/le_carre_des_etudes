<script setup lang="ts">
// Champ image du back-office SALM : aperçu, recadrage (ImageEditor), envoi avec progression, texte alternatif
// (FR-132, FR-133). `decorative` : image purement décorative, sans texte alternatif (image de secours de la vidéo
// récapitulative). `aspectRatio` : proportions proposées à l'ouverture de l'éditeur.
const props = withDefaults(defineProps<{
  modelValue: string | null
  alt?: string | null
  label: string
  defaultAlt?: string
  required?: boolean
  decorative?: boolean
  /** Erreur de champ venue du serveur, déjà traduite. */
  error?: string
  altError?: string
  aspectRatio?: number | null
  ratioLabel?: string
}>(), { alt: null, defaultAlt: '', required: false, decorative: false, error: '', altError: '', aspectRatio: null, ratioLabel: '' })

const emit = defineEmits<{
  'update:modelValue': [path: string | null]
  'update:alt': [alt: string]
}>()

const id = useId()
const input = ref<HTMLInputElement>()
const uploading = ref(false)
const progress = ref(0)
const uploadError = ref('')
/** Fichier en cours de recadrage ; l'éditeur est ouvert tant qu'il est là. */
const pending = shallowRef<File | null>(null)
const editorError = ref('')
const { upload } = useSalmUpload()
const rules = SALM_IMAGE_RULES
const maxBytes = salmMaxBytes('image')

const message = computed(() => uploadError.value || props.error)

function choose() {
  input.value?.click()
}

function onFile(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  target.value = ''
  if (!file) return
  uploadError.value = ''
  // Le type se contrôle avant l'éditeur ; le poids, sur le fichier qui en sort
  if (checkSalmFile(file, 'image') === 'UNSUPPORTED_FORMAT') {
    uploadError.value = salmAdminErrorMessage('UNSUPPORTED_FORMAT', { kind: 'image' })
    return
  }
  editorError.value = ''
  pending.value = file
}

async function onApply({ file }: { file: File }) {
  editorError.value = ''
  uploading.value = true
  progress.value = 0
  try {
    const { path } = await upload(file, 'image', { onProgress: (p) => { progress.value = p } })
    emit('update:modelValue', path)
    if (!props.decorative && !props.alt?.trim()) emit('update:alt', props.defaultAlt)
    pending.value = null
  }
  catch (err) {
    // L'éditeur reste ouvert pour corriger ; l'image précédente est conservée
    editorError.value = salmAdminErrorFrom(err, { kind: 'image' })
  }
  finally {
    uploading.value = false
  }
}

function remove() {
  uploadError.value = ''
  emit('update:modelValue', null)
}
</script>

<template>
  <fieldset class="min-w-0">
    <legend class="block text-sm font-medium text-gray-700">
      {{ label }}<span v-if="required" class="text-red-600" aria-hidden="true"> *</span>
    </legend>
    <p :id="`${id}-rules`" class="mt-0.5 text-xs text-gray-500">{{ rules }}.</p>

    <div class="mt-2 flex flex-wrap items-start gap-4">
      <div class="flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
        <img v-if="modelValue" :src="modelValue" alt="" class="h-full w-full object-cover">
        <span v-else class="px-2 text-center text-xs text-gray-400">Aucune image</span>
      </div>

      <div class="min-w-0 flex-1 space-y-2">
        <div class="flex flex-wrap gap-2">
          <button
            type="button"
            :disabled="uploading"
            :aria-describedby="message ? `${id}-error` : `${id}-rules`"
            :aria-invalid="message ? 'true' : undefined"
            class="rounded-lg bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700 hover:bg-emerald-100 disabled:opacity-50"
            @click="choose"
          >
            {{ modelValue ? 'Remplacer' : 'Choisir une image' }}
          </button>
          <button
            v-if="modelValue && !required"
            type="button"
            :disabled="uploading"
            class="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            @click="remove"
          >
            Retirer
          </button>
          <input
            ref="input"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            class="hidden"
            tabindex="-1"
            aria-hidden="true"
            @change="onFile"
          >
        </div>

        <div v-if="uploading && !pending">
          <label :for="`${id}-progress`" class="mb-1 flex justify-between text-xs text-gray-600">
            <span>Envoi de l'image…</span><span>{{ progress }} %</span>
          </label>
          <progress :id="`${id}-progress`" :value="progress" max="100" class="h-2 w-full accent-emerald-500" />
        </div>

        <p v-if="message" :id="`${id}-error`" class="text-sm text-red-600">{{ message }}</p>

        <template v-if="modelValue">
          <p v-if="decorative" class="text-xs text-gray-500">Image décorative : aucun texte alternatif nécessaire.</p>
          <div v-else>
            <label :for="`${id}-alt`" class="block text-sm font-medium text-gray-700">Texte alternatif <span class="text-red-600" aria-hidden="true">*</span></label>
            <input
              :id="`${id}-alt`"
              :value="alt ?? ''"
              type="text"
              required
              maxlength="200"
              :aria-invalid="altError ? 'true' : undefined"
              :aria-describedby="altError ? `${id}-alt-error` : `${id}-alt-help`"
              class="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              @input="emit('update:alt', ($event.target as HTMLInputElement).value)"
            >
            <p v-if="altError" :id="`${id}-alt-error`" class="mt-1 text-sm text-red-600">{{ altError }}</p>
            <p v-else :id="`${id}-alt-help`" class="mt-1 text-xs text-gray-500">Décrivez l'image pour les personnes qui ne la voient pas.</p>
          </div>
        </template>
      </div>
    </div>

    <ImageEditor
      v-if="pending"
      :file="pending"
      :title="label"
      :aspect-ratio="aspectRatio"
      :ratio-label="ratioLabel"
      :max-bytes="maxBytes"
      :busy="uploading"
      :progress="progress"
      :error="editorError"
      @apply="onApply"
      @cancel="pending = null"
    />
  </fieldset>
</template>
