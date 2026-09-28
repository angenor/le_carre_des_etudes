<script setup lang="ts">
import type { SalmAdminDay, SalmAdminEditionDetail, SalmAdminSlot } from '#shared/types/salm'
import type { SlotKind } from '#shared/utils/salm'

// Section « Chronogramme » : jours du salon et créneaux, chevauchements signalés sans blocage
// (FR-150 à FR-155, research R8 et R13).
const props = defineProps<{ edition: SalmAdminEditionDetail }>()
const emit = defineEmits<{ saved: [message?: string] }>()

const input = 'mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500'
const kinds = SLOT_KINDS.map((k) => ({ value: k, label: SLOT_KIND_LABELS[k] }))

function kindLabel(kind: string) {
  return SLOT_KIND_LABELS[kind as SlotKind] ?? kind
}

function clone(days: SalmAdminDay[]) {
  return days.map((d) => ({ ...d, slots: [...d.slots] }))
}

const days = ref<SalmAdminDay[]>(clone(props.edition.days))
const { errorMessage, showError, clear } = useSalmFlash()
const announcement = ref('')

// ---- Ordre des créneaux, une liste par jour ----
type DayOrder = ReturnType<typeof useSalmOrder<SalmAdminSlot>>
const orders = new Map<number, DayOrder>()

function orderFor(day: SalmAdminDay): DayOrder {
  let order = orders.get(day.id)
  if (!order) {
    order = useSalmOrder<SalmAdminSlot>({
      items: computed({ get: () => day.slots, set: (slots) => { day.slots = slots } }),
      key: (s) => s.id,
      label: (s) => s.title,
      url: () => `/api/admin/salm/days/${day.id}/slots/order`,
      onError: (message) => {
        showError(message)
        emit('saved')
      },
    })
    orders.set(day.id, order)
  }
  return order
}

watch(() => props.edition.days, (list) => {
  orders.clear()
  days.value = clone(list)
})

// Annonces des déplacements et tris (zone aria-live commune)
watchEffect(() => {
  for (const day of days.value) {
    const message = orderFor(day).announcement.value
    if (message) announcement.value = message
  }
})

function sortByHour(day: SalmAdminDay) {
  const sorted = day.slots
    .map((slot, index) => ({ slot, index }))
    .sort((a, b) => a.slot.startTime.localeCompare(b.slot.startTime)
      || a.slot.endTime.localeCompare(b.slot.endTime)
      || a.index - b.index)
    .map((e) => e.slot)
  orderFor(day).reorder(sorted, `Créneaux du ${day.label} triés par heure.`)
}

// ---- Chevauchements (FR-153) ----
function overlapsOf(day: SalmAdminDay) {
  return findSlotOverlaps(day.slots)
}

function overlapCount(day: SalmAdminDay) {
  let total = 0
  for (const ids of overlapsOf(day).values()) total += ids.length
  return total / 2
}

function overlapText(day: SalmAdminDay, slot: SalmAdminSlot) {
  const ids = overlapsOf(day).get(slot.id)
  if (!ids?.length) return ''
  return day.slots
    .filter((s) => ids.includes(s.id))
    .map((s) => `${s.title}, ${formatHour(s.startTime)} – ${formatHour(s.endTime)}`)
    .join(' ; ')
}

// ---- Avertissement FR-155 : badges déjà émis ----
const badgeWarning = computed(() => {
  const n = props.edition.counts.students
  return n > 0 ? `${n.toLocaleString('fr-FR')} badge${n > 1 ? 's ont' : ' a'} déjà été émis : ceux déjà téléchargés portent les anciennes dates.` : ''
})

// ---- Formulaire de jour ----
const dayForm = reactive({ open: false, id: null as number | null, date: '', label: '', opensAt: '09:30', closesAt: '16:00' })
const dayErrors = ref<Record<string, string>>({})
const savingDay = ref(false)

async function openDay(day?: SalmAdminDay) {
  clear()
  closeSlot()
  dayErrors.value = {}
  Object.assign(dayForm, day
    ? { open: true, id: day.id, date: day.date, label: day.label, opensAt: day.opensAt, closesAt: day.closesAt }
    : { open: true, id: null, date: '', label: '', opensAt: '09:30', closesAt: '16:00' })
  await nextTick()
  document.getElementById('day-date')?.focus()
}

async function saveDay() {
  savingDay.value = true
  dayErrors.value = {}
  clear()
  const isNew = dayForm.id === null
  try {
    await $fetch(isNew ? `/api/admin/salm/editions/${props.edition.id}/days` : `/api/admin/salm/days/${dayForm.id}`, {
      method: isNew ? 'POST' : 'PATCH',
      body: { date: dayForm.date, label: dayForm.label || (isNew ? undefined : ''), opensAt: dayForm.opensAt, closesAt: dayForm.closesAt },
    })
    dayForm.open = false
    emit('saved', isNew ? `Jour du ${formatDayLong(dayForm.date)} ajouté.` : 'Jour enregistré.')
  }
  catch (err) {
    const { code, errors } = parseSalmAdminError(err)
    if (code !== 'VALIDATION') return showError(salmAdminErrorFrom(err))
    dayErrors.value = Object.fromEntries(Object.entries(errors).map(([f, c]) => [f, salmFieldErrorMessage(f, c, 40)]))
  }
  finally {
    savingDay.value = false
  }
}

async function removeDay(day: SalmAdminDay) {
  const n = day.slots.length
  let message = `Supprimer le ${day.label} et ses ${n} créneau${n > 1 ? 'x' : ''} ?`
  if (badgeWarning.value) message += `\n\n${badgeWarning.value}`
  if (!confirm(message)) return
  clear()
  try {
    await $fetch(`/api/admin/salm/days/${day.id}`, { method: 'DELETE' })
    emit('saved', `${day.label} supprimé.`)
  }
  catch (err) {
    showError(salmAdminErrorFrom(err))
  }
}

// ---- Formulaire de créneau ----
const slotForm = reactive({
  dayId: null as number | null,
  id: null as number | null,
  startTime: '',
  endTime: '',
  title: '',
  kind: 'panel' as string,
  description: '',
  isHighlighted: false,
})
const slotErrors = ref<Record<string, string>>({})
const savingSlot = ref(false)

function closeSlot() {
  slotForm.dayId = null
}

async function openSlot(day: SalmAdminDay, slot?: SalmAdminSlot) {
  clear()
  dayForm.open = false
  slotErrors.value = {}
  Object.assign(slotForm, slot
    ? { dayId: day.id, id: slot.id, startTime: slot.startTime, endTime: slot.endTime, title: slot.title, kind: slot.kind, description: slot.description ?? '', isHighlighted: slot.isHighlighted }
    : { dayId: day.id, id: null, startTime: '', endTime: '', title: '', kind: 'panel', description: '', isHighlighted: false })
  await nextTick()
  document.getElementById('slot-start')?.focus()
}

async function saveSlot() {
  savingSlot.value = true
  slotErrors.value = {}
  clear()
  const isNew = slotForm.id === null
  try {
    await $fetch(isNew ? `/api/admin/salm/days/${slotForm.dayId}/slots` : `/api/admin/salm/slots/${slotForm.id}`, {
      method: isNew ? 'POST' : 'PATCH',
      body: {
        startTime: slotForm.startTime,
        endTime: slotForm.endTime,
        title: slotForm.title,
        kind: slotForm.kind,
        description: slotForm.description,
        isHighlighted: slotForm.isHighlighted,
      },
    })
    const title = slotForm.title.trim()
    closeSlot()
    emit('saved', isNew ? `Créneau « ${title} » ajouté.` : `Créneau « ${title} » enregistré.`)
  }
  catch (err) {
    const { code, errors } = parseSalmAdminError(err)
    if (code !== 'VALIDATION') return showError(salmAdminErrorFrom(err))
    const max: Record<string, number> = { title: 150, description: 1000 }
    slotErrors.value = Object.fromEntries(Object.entries(errors).map(([f, c]) => [f, salmFieldErrorMessage(f, c, max[f])]))
  }
  finally {
    savingSlot.value = false
  }
}

async function removeSlot(slot: SalmAdminSlot) {
  if (!confirm(`Supprimer le créneau « ${slot.title} » ?`)) return
  clear()
  try {
    await $fetch(`/api/admin/salm/slots/${slot.id}`, { method: 'DELETE' })
    emit('saved', `Créneau « ${slot.title} » supprimé.`)
  }
  catch (err) {
    showError(salmAdminErrorFrom(err))
  }
}

function describedBy(errors: Record<string, string>, field: string, id: string) {
  return errors[field] ? `${id}-error` : undefined
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h2 class="text-lg font-semibold text-gray-900">Chronogramme</h2>
        <p class="text-sm text-gray-500">Jours triés par date ; les créneaux s'affichent dans l'ordre choisi.</p>
      </div>
      <button
        v-if="!dayForm.open"
        type="button"
        class="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
        @click="openDay()"
      >
        + Ajouter un jour
      </button>
    </div>

    <SalmAdminFlash :error="errorMessage" @dismiss="clear" />
    <p class="sr-only" aria-live="polite">{{ announcement }}</p>

    <!-- Formulaire de jour -->
    <form v-if="dayForm.open" class="rounded-lg border border-emerald-200 bg-white p-4 shadow-sm" novalidate @submit.prevent="saveDay">
      <h3 class="mb-3 text-sm font-semibold text-gray-900">{{ dayForm.id ? 'Modifier le jour' : 'Nouveau jour' }}</h3>
      <p v-if="dayForm.id && badgeWarning" class="mb-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">{{ badgeWarning }}</p>
      <div class="grid gap-4 sm:grid-cols-4">
        <div>
          <label for="day-date" class="block text-sm font-medium text-gray-700">Date</label>
          <input id="day-date" v-model="dayForm.date" type="date" required :aria-invalid="dayErrors.date ? 'true' : undefined" :aria-describedby="describedBy(dayErrors, 'date', 'day-date')" :class="input">
          <p v-if="dayErrors.date" id="day-date-error" class="mt-1 text-sm text-red-600">{{ dayErrors.date }}</p>
        </div>
        <div>
          <label for="day-label" class="block text-sm font-medium text-gray-700">Libellé</label>
          <input id="day-label" v-model="dayForm.label" type="text" maxlength="40" :placeholder="dayForm.id ? '' : 'Jour N (automatique)'" :aria-invalid="dayErrors.label ? 'true' : undefined" :aria-describedby="describedBy(dayErrors, 'label', 'day-label')" :class="input">
          <p v-if="dayErrors.label" id="day-label-error" class="mt-1 text-sm text-red-600">{{ dayErrors.label }}</p>
        </div>
        <div>
          <label for="day-opens" class="block text-sm font-medium text-gray-700">Ouverture</label>
          <input id="day-opens" v-model="dayForm.opensAt" type="time" required :aria-invalid="dayErrors.opensAt ? 'true' : undefined" :aria-describedby="describedBy(dayErrors, 'opensAt', 'day-opens')" :class="input">
          <p v-if="dayErrors.opensAt" id="day-opens-error" class="mt-1 text-sm text-red-600">{{ dayErrors.opensAt }}</p>
        </div>
        <div>
          <label for="day-closes" class="block text-sm font-medium text-gray-700">Fermeture</label>
          <input id="day-closes" v-model="dayForm.closesAt" type="time" required :aria-invalid="dayErrors.closesAt ? 'true' : undefined" :aria-describedby="describedBy(dayErrors, 'closesAt', 'day-closes')" :class="input">
          <p v-if="dayErrors.closesAt" id="day-closes-error" class="mt-1 text-sm text-red-600">{{ dayErrors.closesAt }}</p>
        </div>
      </div>
      <div class="mt-4 flex gap-3">
        <button type="submit" :disabled="savingDay" class="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50">
          {{ savingDay ? 'Enregistrement…' : dayForm.id ? 'Enregistrer' : 'Ajouter le jour' }}
        </button>
        <button type="button" class="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50" @click="dayForm.open = false">Annuler</button>
      </div>
    </form>

    <p v-if="!days.length && !dayForm.open" class="rounded-lg border border-gray-200 bg-white p-6 text-sm text-gray-500 shadow-sm">
      Aucun jour. Ajoutez au moins un jour avant de publier l'édition.
    </p>

    <!-- Jours -->
    <section
      v-for="day in days"
      :key="day.id"
      class="rounded-lg border border-gray-200 bg-white p-5 shadow-sm"
      :aria-labelledby="`day-${day.id}-title`"
    >
      <div class="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 :id="`day-${day.id}-title`" class="font-semibold text-gray-900">
            {{ day.label }} — <span class="capitalize">{{ formatDayLong(day.date) }}</span>
          </h3>
          <p class="text-sm text-gray-600">
            {{ formatHour(day.opensAt) }} – {{ formatHour(day.closesAt) }} · {{ day.slots.length }} créneau{{ day.slots.length > 1 ? 'x' : '' }}
            <span v-if="overlapCount(day)" class="font-medium text-amber-700">
              · {{ overlapCount(day) }} chevauchement{{ overlapCount(day) > 1 ? 's' : '' }}
            </span>
          </p>
        </div>
        <div class="flex flex-wrap gap-2">
          <button type="button" class="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50" @click="openDay(day)">
            Modifier le jour<span class="sr-only"> {{ day.label }}</span>
          </button>
          <button
            type="button"
            :disabled="day.slots.length < 2"
            class="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            @click="sortByHour(day)"
          >
            Trier par heure<span class="sr-only"> ({{ day.label }})</span>
          </button>
          <button type="button" class="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50" @click="removeDay(day)">
            Supprimer le jour<span class="sr-only"> {{ day.label }}</span>
          </button>
        </div>
      </div>

      <ol v-if="day.slots.length" class="divide-y divide-gray-100 rounded-lg border border-gray-100">
        <li v-for="(slot, i) in day.slots" :key="slot.id" class="flex flex-wrap items-start justify-between gap-3 p-3">
          <div class="min-w-0 flex-1">
            <p class="text-sm">
              <span class="font-mono text-gray-600">{{ formatHour(slot.startTime) }} – {{ formatHour(slot.endTime) }}</span>
              <span class="ml-2 font-semibold text-gray-900">{{ slot.title }}</span>
              <span class="ml-2 rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">{{ kindLabel(slot.kind) }}</span>
              <span v-if="slot.isHighlighted" class="ml-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800">Mis en avant</span>
            </p>
            <p v-if="slot.description" class="mt-1 text-sm text-gray-500">{{ slot.description }}</p>
            <p v-if="overlapText(day, slot)" class="mt-1 flex items-start gap-1 text-sm text-amber-700">
              <svg class="mt-0.5 size-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" role="img" aria-label="Avertissement">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m0 3.75h.008M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              </svg>
              Chevauche : {{ overlapText(day, slot) }}
            </p>
          </div>
          <div class="flex flex-wrap items-center gap-2">
            <SalmAdminOrderButtons
              :ref="orderFor(day).bindButtons(slot)"
              :index="i"
              :count="day.slots.length"
              :label="slot.title"
              @move="orderFor(day).move(i, $event)"
            />
            <button type="button" class="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50" @click="openSlot(day, slot)">
              Modifier<span class="sr-only"> « {{ slot.title }} »</span>
            </button>
            <button type="button" class="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50" @click="removeSlot(slot)">
              Supprimer<span class="sr-only"> « {{ slot.title }} »</span>
            </button>
          </div>
        </li>
      </ol>
      <p v-else class="text-sm text-gray-500">Aucun créneau.</p>

      <!-- Formulaire de créneau -->
      <form v-if="slotForm.dayId === day.id" class="mt-4 rounded-lg border border-emerald-200 bg-emerald-50/40 p-4" novalidate @submit.prevent="saveSlot">
        <h4 class="mb-3 text-sm font-semibold text-gray-900">{{ slotForm.id ? 'Modifier le créneau' : `Nouveau créneau — ${day.label}` }}</h4>
        <div class="grid gap-4 sm:grid-cols-4">
          <div>
            <label for="slot-start" class="block text-sm font-medium text-gray-700">Début</label>
            <input id="slot-start" v-model="slotForm.startTime" type="time" required :aria-invalid="slotErrors.startTime ? 'true' : undefined" :aria-describedby="describedBy(slotErrors, 'startTime', 'slot-start')" :class="input">
            <p v-if="slotErrors.startTime" id="slot-start-error" class="mt-1 text-sm text-red-600">{{ slotErrors.startTime }}</p>
          </div>
          <div>
            <label for="slot-end" class="block text-sm font-medium text-gray-700">Fin</label>
            <input id="slot-end" v-model="slotForm.endTime" type="time" required :aria-invalid="slotErrors.endTime ? 'true' : undefined" :aria-describedby="describedBy(slotErrors, 'endTime', 'slot-end')" :class="input">
            <p v-if="slotErrors.endTime" id="slot-end-error" class="mt-1 text-sm text-red-600">{{ slotErrors.endTime }}</p>
          </div>
          <div class="sm:col-span-2">
            <label for="slot-kind" class="block text-sm font-medium text-gray-700">Type</label>
            <select id="slot-kind" v-model="slotForm.kind" required :aria-invalid="slotErrors.kind ? 'true' : undefined" :aria-describedby="describedBy(slotErrors, 'kind', 'slot-kind')" :class="`bg-white ${input}`">
              <option v-for="k in kinds" :key="k.value" :value="k.value">{{ k.label }}</option>
            </select>
            <p v-if="slotErrors.kind" id="slot-kind-error" class="mt-1 text-sm text-red-600">{{ slotErrors.kind }}</p>
          </div>
          <div class="sm:col-span-4">
            <label for="slot-title" class="block text-sm font-medium text-gray-700">Titre</label>
            <input id="slot-title" v-model="slotForm.title" type="text" maxlength="150" required :aria-invalid="slotErrors.title ? 'true' : undefined" :aria-describedby="describedBy(slotErrors, 'title', 'slot-title')" :class="input">
            <p v-if="slotErrors.title" id="slot-title-error" class="mt-1 text-sm text-red-600">{{ slotErrors.title }}</p>
          </div>
          <div class="sm:col-span-4">
            <label for="slot-description" class="block text-sm font-medium text-gray-700">Description <span class="font-normal text-gray-500">(facultative)</span></label>
            <textarea id="slot-description" v-model="slotForm.description" rows="2" maxlength="1000" :aria-invalid="slotErrors.description ? 'true' : undefined" :aria-describedby="describedBy(slotErrors, 'description', 'slot-description')" :class="input" />
            <p v-if="slotErrors.description" id="slot-description-error" class="mt-1 text-sm text-red-600">{{ slotErrors.description }}</p>
          </div>
          <label class="inline-flex items-center gap-2 text-sm text-gray-700 sm:col-span-4">
            <input v-model="slotForm.isHighlighted" type="checkbox" class="size-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500">
            Mis en avant sur la page
          </label>
        </div>
        <div class="mt-4 flex gap-3">
          <button type="submit" :disabled="savingSlot" class="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50">
            {{ savingSlot ? 'Enregistrement…' : slotForm.id ? 'Enregistrer' : 'Ajouter le créneau' }}
          </button>
          <button type="button" class="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50" @click="closeSlot">Annuler</button>
        </div>
      </form>
      <button
        v-else
        type="button"
        class="mt-3 rounded-lg bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700 hover:bg-emerald-100"
        @click="openSlot(day)"
      >
        + Ajouter un créneau<span class="sr-only"> au {{ day.label }}</span>
      </button>
    </section>
  </div>
</template>
