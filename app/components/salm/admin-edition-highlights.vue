<script setup lang="ts">
import type { SalmAdminEditionDetail, SalmAdminHighlight } from '#shared/types/salm'

// Section « Temps forts » : cartes photo du programme d'activité (FR-130, FR-131, FR-133, FR-146).
const props = defineProps<{ edition: SalmAdminEditionDetail }>()
const emit = defineEmits<{ saved: [message?: string] }>()

const input = 'mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500'

const items = ref<SalmAdminHighlight[]>([...props.edition.highlights])
watch(() => props.edition.highlights, (list) => { items.value = [...list] })

const { errorMessage, showError, clear } = useSalmFlash()
const order = useSalmOrder({
  items,
  key: (h) => h.id,
  label: (h) => h.title,
  url: () => `/api/admin/salm/editions/${props.edition.id}/highlights/order`,
  onError: (message) => {
    showError(message)
    emit('saved')
  },
})

// ---- Formulaire d'ajout et de modification ----
const editing = ref<SalmAdminHighlight | 'new' | null>(null)
const form = reactive({ title: '', imagePath: null as string | null, imageAlt: '' })
const errors = ref<Record<string, string>>({})
const saving = ref(false)

async function open(target: SalmAdminHighlight | 'new') {
  clear()
  errors.value = {}
  editing.value = target
  Object.assign(form, target === 'new'
    ? { title: '', imagePath: null, imageAlt: '' }
    : { title: target.title, imagePath: target.imagePath, imageAlt: target.imageAlt })
  await nextTick()
  document.getElementById('highlight-title')?.focus()
}

async function save() {
  if (!editing.value) return
  saving.value = true
  errors.value = {}
  clear()
  const isNew = editing.value === 'new'
  try {
    await $fetch(isNew ? `/api/admin/salm/editions/${props.edition.id}/highlights` : `/api/admin/salm/highlights/${(editing.value as SalmAdminHighlight).id}`, {
      method: isNew ? 'POST' : 'PATCH',
      body: { title: form.title, imagePath: form.imagePath, imageAlt: form.imageAlt },
    })
    editing.value = null
    emit('saved', isNew ? `Temps fort « ${form.title.trim()} » ajouté.` : 'Temps fort enregistré.')
  }
  catch (err) {
    const { code, errors: fieldErrors } = parseSalmAdminError(err)
    if (code !== 'VALIDATION') return showError(salmAdminErrorFrom(err))
    const max: Record<string, number> = { title: 100, imageAlt: 200 }
    errors.value = Object.fromEntries(Object.entries(fieldErrors).map(([f, c]) => [f, salmFieldErrorMessage(f, c, max[f])]))
  }
  finally {
    saving.value = false
  }
}

async function remove(h: SalmAdminHighlight) {
  if (!confirm(`Supprimer le temps fort « ${h.title} » ?`)) return
  clear()
  try {
    await $fetch(`/api/admin/salm/highlights/${h.id}`, { method: 'DELETE' })
    emit('saved', `Temps fort « ${h.title} » supprimé.`)
  }
  catch (err) {
    showError(salmAdminErrorFrom(err))
  }
}
</script>

<template>
  <div class="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
    <div class="mb-4 flex flex-wrap items-center justify-between gap-3">
      <div>
        <h2 class="text-lg font-semibold text-gray-900">Temps forts</h2>
        <p class="text-sm text-gray-500">Cartes du programme d'activité, dans l'ordre de la page.</p>
      </div>
      <button
        v-if="!editing"
        type="button"
        class="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
        @click="open('new')"
      >
        + Ajouter un temps fort
      </button>
    </div>

    <SalmAdminFlash :error="errorMessage" @dismiss="clear" />
    <p class="sr-only" aria-live="polite">{{ order.announcement.value }}</p>

    <form v-if="editing" class="mb-6 rounded-lg border border-emerald-200 bg-emerald-50/40 p-4" novalidate @submit.prevent="save">
      <h3 class="mb-3 text-sm font-semibold text-gray-900">{{ editing === 'new' ? 'Nouveau temps fort' : 'Modifier le temps fort' }}</h3>
      <div class="space-y-4">
        <div>
          <label for="highlight-title" class="block text-sm font-medium text-gray-700">Titre</label>
          <input
            id="highlight-title"
            v-model="form.title"
            type="text"
            maxlength="100"
            required
            :aria-invalid="errors.title ? 'true' : undefined"
            :aria-describedby="errors.title ? 'highlight-title-error' : undefined"
            :class="input"
          >
          <p v-if="errors.title" id="highlight-title-error" class="mt-1 text-sm text-red-600">{{ errors.title }}</p>
        </div>
        <SalmAdminImageField
          v-model="form.imagePath"
          v-model:alt="form.imageAlt"
          label="Photo"
          :default-alt="form.title"
          required
          :error="errors.imagePath"
          :alt-error="errors.imageAlt"
        />
      </div>
      <div class="mt-4 flex gap-3">
        <button
          type="submit"
          :disabled="saving"
          class="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {{ saving ? 'Enregistrement…' : editing === 'new' ? 'Ajouter' : 'Enregistrer' }}
        </button>
        <button type="button" class="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50" @click="editing = null">
          Annuler
        </button>
      </div>
    </form>

    <ol v-if="items.length" class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      <li v-for="(h, i) in items" :key="h.id" class="overflow-hidden rounded-lg border border-gray-200">
        <img :src="h.imagePath" alt="" class="aspect-video w-full bg-gray-100 object-cover">
        <div class="space-y-2 p-3">
          <p class="font-semibold text-gray-900">{{ i + 1 }}. {{ h.title }}</p>
          <p class="text-xs text-gray-500">Texte alternatif : {{ h.imageAlt }}</p>
          <div class="flex flex-wrap items-center gap-2">
            <SalmAdminOrderButtons
              :ref="order.bindButtons(h)"
              :index="i"
              :count="items.length"
              :label="h.title"
              @move="order.move(i, $event)"
            />
            <button
              type="button"
              class="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
              @click="open(h)"
            >
              Modifier<span class="sr-only"> « {{ h.title }} »</span>
            </button>
            <button
              type="button"
              class="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50"
              @click="remove(h)"
            >
              Supprimer<span class="sr-only"> « {{ h.title }} »</span>
            </button>
          </div>
        </div>
      </li>
    </ol>
    <p v-else-if="!editing" class="text-sm text-gray-500">Aucun temps fort : la section n'est pas affichée sur la page.</p>
  </div>
</template>
