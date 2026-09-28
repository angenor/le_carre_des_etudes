<script setup lang="ts">
// Champ d'adresse YouTube : validation à la sortie du champ et au collage, miniature si l'adresse
// est celle d'une vidéo (FR-134, research R7). Le serveur reste l'autorité.
const props = withDefaults(defineProps<{
  modelValue: string
  label: string
  /** Erreur de champ venue du serveur, déjà traduite. */
  error?: string
  required?: boolean
}>(), { error: '', required: false })

const emit = defineEmits<{ 'update:modelValue': [url: string] }>()

const id = useId()
const checked = ref(!!props.modelValue)
const youtubeId = computed(() => parseYoutubeId(props.modelValue))
const localError = computed(() => (checked.value && props.modelValue.trim() && !youtubeId.value ? SALM_YOUTUBE_ERROR : ''))
const message = computed(() => localError.value || props.error)

watch(() => props.modelValue, (value) => {
  if (!value) checked.value = false
})

function check() {
  checked.value = true
}

function onPaste() {
  // La valeur collée est disponible après l'événement
  nextTick(check)
}
</script>

<template>
  <div>
    <label :for="id" class="block text-sm font-medium text-gray-700">
      {{ label }}<span v-if="!required" class="font-normal text-gray-500"> (facultative)</span>
    </label>
    <div class="mt-1 flex flex-wrap items-start gap-3">
      <input
        :id="id"
        :value="modelValue"
        type="url"
        inputmode="url"
        placeholder="https://youtu.be/…"
        :required="required"
        :aria-invalid="message ? 'true' : undefined"
        :aria-describedby="message ? `${id}-error` : undefined"
        class="block min-w-0 flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
        @input="emit('update:modelValue', ($event.target as HTMLInputElement).value)"
        @blur="check"
        @paste="onPaste"
      >
      <img
        v-if="youtubeId"
        :src="`https://i.ytimg.com/vi/${youtubeId}/hqdefault.jpg`"
        alt=""
        class="h-16 w-28 shrink-0 rounded border border-gray-200 bg-gray-100 object-cover"
      >
    </div>
    <p v-if="message" :id="`${id}-error`" class="mt-1 text-sm text-red-600">{{ message }}</p>
  </div>
</template>
