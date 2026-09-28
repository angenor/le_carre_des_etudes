<script setup lang="ts">
import type { SalmAdminEditionDetail, SalmContact } from '#shared/types/salm'

// Section « Contacts » : téléphones, e-mails et adresses de l'appel final et du badge (FR-130, FR-144, FR-145).
const props = defineProps<{ edition: SalmAdminEditionDetail }>()
const emit = defineEmits<{ saved: [message?: string] }>()

const CONTACTS_MAX = 8
const KINDS: { value: SalmContact['kind']; label: string }[] = [
  { value: 'phone', label: 'Téléphone' },
  { value: 'email', label: 'E-mail' },
  { value: 'address', label: 'Adresse' },
]
const PLACEHOLDERS: Record<SalmContact['kind'], string> = {
  phone: '07 68 01 14 09',
  email: 'contact@exemple.ci',
  address: 'Cocody, Abidjan',
}
const input = 'block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500'

interface ContactRow { key: number; kind: SalmContact['kind']; value: string; onBadge: boolean }
let nextKey = 0

function fromEdition(e: SalmAdminEditionDetail): ContactRow[] {
  return e.contacts.map((c) => ({ key: nextKey++, kind: c.kind, value: c.value, onBadge: !!c.onBadge }))
}

const rows = ref<ContactRow[]>(fromEdition(props.edition))
watch(() => props.edition, (e) => { rows.value = fromEdition(e) })

const errors = ref<Record<string, string>>({})
const { errorMessage, showError, clear } = useSalmFlash()
const saving = ref(false)
const order = useSalmOrder({ items: rows, key: (c) => c.key, label: (c) => c.value || 'Contact sans valeur' })

const noBadgeContact = computed(() => !rows.value.some((c) => c.kind === 'phone' && c.onBadge))

function kindLabel(kind: SalmContact['kind']) {
  return KINDS.find((k) => k.value === kind)?.label ?? kind
}

/** Un seul contact imprimé sur le badge (FR-145) : cocher une case décoche les autres. */
function toggleBadge(row: ContactRow, checked: boolean) {
  for (const c of rows.value) c.onBadge = c === row ? checked : false
}

function onKindChange(row: ContactRow) {
  if (row.kind !== 'phone') row.onBadge = false
}

async function add() {
  rows.value = [...rows.value, { key: nextKey++, kind: 'phone', value: '', onBadge: false }]
  await nextTick()
  document.getElementById(`contact-${rows.value.at(-1)!.key}-kind`)?.focus()
}

function remove(row: ContactRow) {
  if (!confirm(`Retirer le contact « ${row.value || kindLabel(row.kind)} » ?`)) return
  rows.value = rows.value.filter((c) => c !== row)
}

function fieldError(index: number, field: 'kind' | 'value' | 'onBadge') {
  return errors.value[`contacts.${index}.${field}`]
}

async function save() {
  saving.value = true
  errors.value = {}
  clear()
  try {
    await $fetch(`/api/admin/salm/editions/${props.edition.id}`, {
      method: 'PATCH',
      body: {
        contacts: rows.value.map((c) => ({ kind: c.kind, value: c.value, ...(c.kind === 'phone' && c.onBadge ? { onBadge: true } : {}) })),
      },
    })
    emit('saved', 'Contacts enregistrés.')
  }
  catch (err) {
    const { code, errors: fieldErrors } = parseSalmAdminError(err)
    if (code !== 'VALIDATION') return showError(salmAdminErrorFrom(err))
    errors.value = Object.fromEntries(Object.entries(fieldErrors).map(([f, c]) => {
      const [, index, field] = f.split('.')
      // Le message dépend du type de contact de la ligne (« Adresse e-mail invalide. », format du téléphone)
      const kind = rows.value[Number(index)]?.kind
      const name = field === 'value' && kind ? { phone: 'phone', email: 'email', address: 'address' }[kind] : f
      return [f, salmFieldErrorMessage(name, c, kind === 'address' ? 200 : 254)]
    }))
    showError(salmAdminErrorMessage('VALIDATION'))
  }
  finally {
    saving.value = false
  }
}
</script>

<template>
  <form class="rounded-lg border border-gray-200 bg-white p-6 shadow-sm" novalidate @submit.prevent="save">
    <h2 class="text-lg font-semibold text-gray-900">Contacts</h2>
    <p class="mt-1 mb-4 text-sm text-gray-500">
      Affichés dans l'appel final de la page, dans cet ordre ({{ CONTACTS_MAX }} au plus). Le téléphone
      « Imprimé sur le badge » figure au verso des badges et sur le formulaire des établissements.
    </p>
    <SalmAdminFlash :error="errorMessage" @dismiss="clear" />
    <p class="sr-only" aria-live="polite">{{ order.announcement.value }}</p>

    <p v-if="noBadgeContact" class="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
      Aucun contact n'est imprimé sur le badge.
    </p>
    <p v-if="errors.contacts" class="mb-3 text-sm text-red-600">{{ errors.contacts }}</p>

    <ol v-if="rows.length" class="space-y-3">
      <li v-for="(c, i) in rows" :key="c.key" class="rounded-lg border border-gray-200 p-3">
        <div class="grid gap-3 sm:grid-cols-[10rem_1fr_auto] sm:items-start">
          <div>
            <label :for="`contact-${c.key}-kind`" class="block text-xs font-medium text-gray-600">Type</label>
            <select :id="`contact-${c.key}-kind`" v-model="c.kind" :class="`mt-1 bg-white ${input}`" @change="onKindChange(c)">
              <option v-for="k in KINDS" :key="k.value" :value="k.value">{{ k.label }}</option>
            </select>
          </div>
          <div>
            <label :for="`contact-${c.key}-value`" class="block text-xs font-medium text-gray-600">Valeur</label>
            <input
              :id="`contact-${c.key}-value`"
              v-model="c.value"
              :type="c.kind === 'email' ? 'email' : c.kind === 'phone' ? 'tel' : 'text'"
              :inputmode="c.kind === 'phone' ? 'tel' : undefined"
              :placeholder="PLACEHOLDERS[c.kind]"
              required
              :aria-invalid="fieldError(i, 'value') ? 'true' : undefined"
              :aria-describedby="fieldError(i, 'value') ? `contact-${c.key}-value-error` : undefined"
              :class="`mt-1 ${input}`"
            >
            <p v-if="fieldError(i, 'value')" :id="`contact-${c.key}-value-error`" class="mt-1 text-sm text-red-600">{{ fieldError(i, 'value') }}</p>
            <label v-if="c.kind === 'phone'" class="mt-2 inline-flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                :checked="c.onBadge"
                class="size-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                @change="toggleBadge(c, ($event.target as HTMLInputElement).checked)"
              >
              Imprimé sur le badge
            </label>
          </div>
          <div class="flex items-center gap-2 sm:pt-5">
            <SalmAdminOrderButtons
              :ref="order.bindButtons(c)"
              :index="i"
              :count="rows.length"
              :label="c.value || kindLabel(c.kind)"
              @move="order.move(i, $event)"
            />
            <button
              type="button"
              class="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50"
              @click="remove(c)"
            >
              Retirer<span class="sr-only"> « {{ c.value || kindLabel(c.kind) }} »</span>
            </button>
          </div>
        </div>
      </li>
    </ol>
    <p v-else class="text-sm text-gray-500">Aucun contact.</p>

    <div class="mt-4 flex flex-wrap gap-3">
      <button
        type="button"
        :disabled="rows.length >= CONTACTS_MAX"
        class="rounded-lg bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700 hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-50"
        @click="add"
      >
        + Ajouter un contact
      </button>
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
