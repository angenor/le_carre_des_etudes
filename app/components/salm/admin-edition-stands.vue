<script setup lang="ts">
import type { SalmAdminEditionDetail, SalmAdminStandType } from '#shared/types/salm'

// Section « Types de stands » proposés aux établissements (FR-170 à FR-173).
const props = defineProps<{ edition: SalmAdminEditionDetail }>()
const emit = defineEmits<{ saved: [message?: string] }>()

const input = 'mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500'

const items = ref<SalmAdminStandType[]>([...props.edition.standTypes])
watch(() => props.edition.standTypes, (list) => { items.value = [...list] })

const { errorMessage, showError, clear } = useSalmFlash()
const order = useSalmOrder({
  items,
  key: (s) => s.id,
  label: (s) => s.name,
  url: () => `/api/admin/salm/editions/${props.edition.id}/stand-types/order`,
  onError: (message) => {
    showError(message)
    emit('saved')
  },
})

const noVisibleStand = computed(() => props.edition.registrationOpen.schools && !items.value.some((s) => s.isVisible))

function usedBy(n: number) {
  return `Choisi par ${n} établissement${n > 1 ? 's' : ''}`
}

// ---- Formulaire ----
const editing = ref<SalmAdminStandType | 'new' | null>(null)
const form = reactive({ name: '', description: '', priceLabel: '' })
const errors = ref<Record<string, string>>({})
const saving = ref(false)

async function open(target: SalmAdminStandType | 'new') {
  clear()
  errors.value = {}
  editing.value = target
  Object.assign(form, target === 'new'
    ? { name: '', description: '', priceLabel: '' }
    : { name: target.name, description: target.description ?? '', priceLabel: target.priceLabel ?? '' })
  await nextTick()
  document.getElementById('stand-name')?.focus()
}

async function save() {
  if (!editing.value) return
  saving.value = true
  errors.value = {}
  clear()
  const isNew = editing.value === 'new'
  try {
    await $fetch(isNew ? `/api/admin/salm/editions/${props.edition.id}/stand-types` : `/api/admin/salm/stand-types/${(editing.value as SalmAdminStandType).id}`, {
      method: isNew ? 'POST' : 'PATCH',
      body: { name: form.name, description: form.description, priceLabel: form.priceLabel },
    })
    editing.value = null
    emit('saved', isNew ? `Type de stand « ${form.name.trim()} » ajouté.` : 'Type de stand enregistré.')
  }
  catch (err) {
    const { code, errors: fieldErrors } = parseSalmAdminError(err)
    if (code !== 'VALIDATION') return showError(salmAdminErrorFrom(err))
    const max: Record<string, number> = { name: 60, description: 500, priceLabel: 60 }
    errors.value = Object.fromEntries(Object.entries(fieldErrors).map(([f, c]) => [f, salmFieldErrorMessage(f, c, max[f])]))
  }
  finally {
    saving.value = false
  }
}

async function toggleVisible(s: SalmAdminStandType) {
  clear()
  try {
    await $fetch(`/api/admin/salm/stand-types/${s.id}`, { method: 'PATCH', body: { isVisible: !s.isVisible } })
    emit('saved', s.isVisible ? `« ${s.name} » masqué : il n'est plus proposé aux établissements.` : `« ${s.name} » réaffiché.`)
  }
  catch (err) {
    showError(salmAdminErrorFrom(err))
  }
}

async function remove(s: SalmAdminStandType) {
  if (!confirm(`Supprimer le type de stand « ${s.name} » ?`)) return
  clear()
  try {
    await $fetch(`/api/admin/salm/stand-types/${s.id}`, { method: 'DELETE' })
    emit('saved', `Type de stand « ${s.name} » supprimé.`)
  }
  catch (err) {
    showError(salmAdminErrorFrom(err))
    emit('saved')
  }
}
</script>

<template>
  <div class="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
    <div class="mb-4 flex flex-wrap items-center justify-between gap-3">
      <div>
        <h2 class="text-lg font-semibold text-gray-900">Types de stands</h2>
        <p class="text-sm text-gray-500">Proposés à l'étape 2 du formulaire des établissements, dans cet ordre.</p>
      </div>
      <button
        v-if="!editing"
        type="button"
        class="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
        @click="open('new')"
      >
        + Ajouter un type de stand
      </button>
    </div>

    <SalmAdminFlash :error="errorMessage" @dismiss="clear" />
    <p class="sr-only" aria-live="polite">{{ order.announcement.value }}</p>

    <p v-if="noVisibleStand" class="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
      Aucun type de stand visible : les établissements ne peuvent pas s'inscrire.
    </p>

    <form v-if="editing" class="mb-6 rounded-lg border border-emerald-200 bg-emerald-50/40 p-4" novalidate @submit.prevent="save">
      <h3 class="mb-3 text-sm font-semibold text-gray-900">{{ editing === 'new' ? 'Nouveau type de stand' : 'Modifier le type de stand' }}</h3>
      <div class="grid gap-4 sm:grid-cols-2">
        <div>
          <label for="stand-name" class="block text-sm font-medium text-gray-700">Nom</label>
          <input id="stand-name" v-model="form.name" type="text" maxlength="60" required :aria-invalid="errors.name ? 'true' : undefined" :aria-describedby="errors.name ? 'stand-name-error' : undefined" :class="input">
          <p v-if="errors.name" id="stand-name-error" class="mt-1 text-sm text-red-600">{{ errors.name }}</p>
        </div>
        <div>
          <label for="stand-price" class="block text-sm font-medium text-gray-700">Tarif <span class="font-normal text-gray-500">(facultatif)</span></label>
          <input id="stand-price" v-model="form.priceLabel" type="text" maxlength="60" placeholder="300 000 FCFA" :aria-invalid="errors.priceLabel ? 'true' : undefined" :aria-describedby="errors.priceLabel ? 'stand-price-error' : undefined" :class="input">
          <p v-if="errors.priceLabel" id="stand-price-error" class="mt-1 text-sm text-red-600">{{ errors.priceLabel }}</p>
        </div>
        <div class="sm:col-span-2">
          <label for="stand-description" class="block text-sm font-medium text-gray-700">Description <span class="font-normal text-gray-500">(facultative)</span></label>
          <textarea id="stand-description" v-model="form.description" rows="2" maxlength="500" :aria-invalid="errors.description ? 'true' : undefined" :aria-describedby="errors.description ? 'stand-description-error' : undefined" :class="input" />
          <p v-if="errors.description" id="stand-description-error" class="mt-1 text-sm text-red-600">{{ errors.description }}</p>
        </div>
      </div>
      <div class="mt-4 flex gap-3">
        <button type="submit" :disabled="saving" class="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50">
          {{ saving ? 'Enregistrement…' : editing === 'new' ? 'Ajouter' : 'Enregistrer' }}
        </button>
        <button type="button" class="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50" @click="editing = null">Annuler</button>
      </div>
    </form>

    <ol v-if="items.length" class="divide-y divide-gray-100 rounded-lg border border-gray-100">
      <li v-for="(s, i) in items" :key="s.id" class="flex flex-wrap items-start justify-between gap-3 p-4" :class="s.isVisible ? '' : 'bg-gray-50'">
        <div class="min-w-0 flex-1">
          <p class="font-semibold text-gray-900">
            {{ s.name }}
            <span
              class="ml-2 rounded-full px-2 py-0.5 text-xs font-semibold"
              :class="s.isVisible ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-200 text-gray-700'"
            >
              {{ s.isVisible ? 'Visible' : 'Masqué' }}
            </span>
          </p>
          <p v-if="s.priceLabel" class="text-sm text-gray-700">{{ s.priceLabel }}</p>
          <p v-if="s.description" class="text-sm text-gray-500">{{ s.description }}</p>
          <p class="mt-1 text-xs text-gray-500">{{ usedBy(s.schoolCount) }}</p>
        </div>
        <div class="flex flex-wrap items-center gap-2">
          <SalmAdminOrderButtons
            :ref="order.bindButtons(s)"
            :index="i"
            :count="items.length"
            :label="s.name"
            @move="order.move(i, $event)"
          />
          <button type="button" class="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50" @click="open(s)">
            Modifier<span class="sr-only"> « {{ s.name }} »</span>
          </button>
          <button type="button" class="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50" @click="toggleVisible(s)">
            {{ s.isVisible ? 'Masquer' : 'Réafficher' }}<span class="sr-only"> « {{ s.name }} »</span>
          </button>
          <button
            type="button"
            :disabled="s.schoolCount > 0"
            :aria-describedby="s.schoolCount > 0 ? `stand-${s.id}-locked` : undefined"
            class="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
            @click="remove(s)"
          >
            Supprimer<span class="sr-only"> « {{ s.name }} »</span>
          </button>
          <p v-if="s.schoolCount > 0" :id="`stand-${s.id}-locked`" class="w-full text-xs text-gray-500">
            {{ usedBy(s.schoolCount) }} : vous pouvez seulement le masquer.
          </p>
        </div>
      </li>
    </ol>
    <p v-else-if="!editing" class="text-sm text-gray-500">Aucun type de stand : les établissements ne peuvent pas s'inscrire.</p>
  </div>
</template>
