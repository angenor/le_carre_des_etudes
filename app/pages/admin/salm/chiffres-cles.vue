<script setup lang="ts">
import type { SalmKeyFigure } from '#shared/types/salm'

// Chiffres clés du SALM, toutes éditions confondues : section « Le SALM en chiffres » en fin de page /salm.
// La liste entière est enregistrée d'un coup (PUT /api/admin/salm/key-figures), dans l'ordre affiché.
definePageMeta({ layout: 'admin' })
useSeoMeta({ title: 'Chiffres clés du SALM — Administration' })

const FIGURES_MAX = 6
const input = 'mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500'

interface FigureRow { key: number; value: string; label: string }
let nextKey = 0

const { data } = await useFetch<{ data: SalmKeyFigure[] }>('/api/admin/salm/key-figures', { key: 'salm-admin-key-figures' })

function toRows(figures: SalmKeyFigure[] = []) {
  return figures.map((f): FigureRow => ({ key: nextKey++, value: f.value, label: f.label }))
}

const rows = ref<FigureRow[]>(toRows(data.value?.data))
watch(() => data.value?.data, (figures) => { rows.value = toRows(figures) })

const errors = ref<Record<string, string>>({})
const { successMessage, errorMessage, showSuccess, showError, clear } = useSalmFlash()
const saving = ref(false)

const order = useSalmOrder({ items: rows, key: (r) => r.key, label: (r) => r.value || 'Chiffre sans valeur' })

async function addFigure() {
  rows.value = [...rows.value, { key: nextKey++, value: '', label: '' }]
  await nextTick()
  document.getElementById(`figure-${rows.value.at(-1)!.key}-value`)?.focus()
}

function removeFigure(row: FigureRow) {
  if (!confirm(`Retirer le chiffre « ${row.value || 'sans valeur'} » ?`)) return
  rows.value = rows.value.filter((r) => r !== row)
}

function fieldError(field: string) {
  return errors.value[field]
}

async function save() {
  saving.value = true
  errors.value = {}
  clear()
  try {
    const saved = await $fetch<{ data: SalmKeyFigure[] }>('/api/admin/salm/key-figures', {
      method: 'PUT',
      body: { keyFigures: rows.value.map(({ value, label }) => ({ value, label })) },
    })
    data.value = saved
    showSuccess(saved.data.length ? 'Chiffres clés enregistrés.' : 'Chiffres clés retirés : la section n\'est plus affichée.')
  }
  catch (err) {
    const { code, errors: fieldErrors } = parseSalmAdminError(err)
    if (code !== 'VALIDATION') return showError(salmAdminErrorFrom(err))
    const max: Record<string, number> = { value: 20, label: 120 }
    errors.value = Object.fromEntries(Object.entries(fieldErrors).map(([f, c]) => [f, salmFieldErrorMessage(f, c, max[f.split('.').at(-1)!])]))
    showError(salmAdminErrorMessage('VALIDATION'))
  }
  finally {
    saving.value = false
  }
}
</script>

<template>
  <div>
    <div class="mb-6 flex flex-wrap items-center justify-between gap-4">
      <div>
        <h1 class="text-xl font-semibold text-gray-800">Chiffres clés du SALM</h1>
        <p class="mt-1 text-sm text-gray-500">
          Toutes éditions confondues, affichés en fin de page
          <a href="/salm" target="_blank" rel="noopener" class="font-medium text-emerald-700 underline underline-offset-2">/salm</a>.
        </p>
      </div>
    </div>

    <SalmAdminFlash :success="successMessage" :error="errorMessage" @dismiss="clear" />

    <form class="space-y-6" novalidate @submit.prevent="save">
      <fieldset class="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <legend class="px-1 text-lg font-semibold text-gray-900">« Le SALM en chiffres »</legend>
        <p class="mb-4 text-sm text-gray-500">
          {{ FIGURES_MAX }} chiffres au plus, dans l'ordre de la page. Le nombre de la valeur défile de 0 jusqu'à lui à l'affichage ;
          le texte autour (« + de », « % »…) reste tel quel. Sans aucun chiffre, la section n'est pas affichée.
        </p>
        <p class="sr-only" aria-live="polite">{{ order.announcement.value }}</p>
        <p v-if="fieldError('keyFigures')" class="mb-3 text-sm text-red-600">{{ fieldError('keyFigures') }}</p>

        <ol v-if="rows.length" class="space-y-4">
          <li v-for="(r, i) in rows" :key="r.key" class="rounded-lg border border-gray-200 p-4">
            <div class="mb-3 flex items-center justify-between gap-2">
              <span class="text-sm font-medium text-gray-500">Chiffre {{ i + 1 }}</span>
              <span class="flex items-center gap-2">
                <SalmAdminOrderButtons
                  :ref="order.bindButtons(r)"
                  :index="i"
                  :count="rows.length"
                  :label="r.value || 'Chiffre sans valeur'"
                  @move="order.move(i, $event)"
                />
                <button
                  type="button"
                  class="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50"
                  @click="removeFigure(r)"
                >
                  Retirer<span class="sr-only"> « {{ r.value || 'sans valeur' }} »</span>
                </button>
              </span>
            </div>
            <div class="grid gap-3 sm:grid-cols-[12rem_minmax(0,1fr)]">
              <div>
                <label :for="`figure-${r.key}-value`" class="block text-sm font-medium text-gray-700">Valeur</label>
                <input
                  :id="`figure-${r.key}-value`"
                  v-model="r.value"
                  type="text"
                  maxlength="20"
                  required
                  placeholder="+ de 2 000"
                  :aria-invalid="fieldError(`keyFigures.${i}.value`) ? 'true' : undefined"
                  :aria-describedby="fieldError(`keyFigures.${i}.value`) ? `figure-${r.key}-value-error` : undefined"
                  :class="input"
                >
                <p v-if="fieldError(`keyFigures.${i}.value`)" :id="`figure-${r.key}-value-error`" class="mt-1 text-sm text-red-600">{{ fieldError(`keyFigures.${i}.value`) }}</p>
              </div>
              <div>
                <label :for="`figure-${r.key}-label`" class="block text-sm font-medium text-gray-700">Texte</label>
                <input
                  :id="`figure-${r.key}-label`"
                  v-model="r.label"
                  type="text"
                  maxlength="120"
                  required
                  placeholder="étudiants participants lors de nos salons"
                  :aria-invalid="fieldError(`keyFigures.${i}.label`) ? 'true' : undefined"
                  :aria-describedby="fieldError(`keyFigures.${i}.label`) ? `figure-${r.key}-label-error` : undefined"
                  :class="input"
                >
                <p v-if="fieldError(`keyFigures.${i}.label`)" :id="`figure-${r.key}-label-error`" class="mt-1 text-sm text-red-600">{{ fieldError(`keyFigures.${i}.label`) }}</p>
              </div>
            </div>
          </li>
        </ol>
        <p v-else class="text-sm text-gray-500">Aucun chiffre clé : la section n'est pas affichée.</p>

        <button
          type="button"
          :disabled="rows.length >= FIGURES_MAX"
          class="mt-4 rounded-lg bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700 hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-50"
          @click="addFigure"
        >
          + Ajouter un chiffre
        </button>
      </fieldset>

      <div class="flex justify-end">
        <button
          type="submit"
          :disabled="saving"
          class="rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
        >
          {{ saving ? 'Enregistrement…' : 'Enregistrer' }}
        </button>
      </div>
    </form>
  </div>
</template>
