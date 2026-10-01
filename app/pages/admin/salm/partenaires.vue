<script setup lang="ts">
import type { SalmPartner } from '#shared/types/salm'

// Partenaires du SALM, toutes éditions confondues : bandeaux de logos en fin de page /salm.
// La liste entière est enregistrée d'un coup (PUT /api/admin/salm/partners), dans l'ordre affiché ;
// les logos remplacés ou retirés sont supprimés du serveur à l'enregistrement.
definePageMeta({ layout: 'admin' })
useSeoMeta({ title: 'Partenaires du SALM — Administration' })

const PARTNERS_MAX = 40
const input = 'mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500'

interface PartnerRow { key: number; name: string; logoPath: string | null; url: string }
let nextKey = 0

const { data } = await useFetch<{ data: SalmPartner[] }>('/api/admin/salm/partners', { key: 'salm-admin-partners' })

function toRows(partners: SalmPartner[] = []) {
  return partners.map((p): PartnerRow => ({ key: nextKey++, name: p.name, logoPath: p.logoPath, url: p.url ?? '' }))
}

const rows = ref<PartnerRow[]>(toRows(data.value?.data))
watch(() => data.value?.data, (partners) => { rows.value = toRows(partners) })

const errors = ref<Record<string, string>>({})
const { successMessage, errorMessage, showSuccess, showError, clear } = useSalmFlash()
const saving = ref(false)

const order = useSalmOrder({ items: rows, key: (r) => r.key, label: (r) => r.name || 'Partenaire sans nom' })

async function addPartner() {
  rows.value = [...rows.value, { key: nextKey++, name: '', logoPath: null, url: '' }]
  await nextTick()
  document.getElementById(`partner-${rows.value.at(-1)!.key}-name`)?.focus()
}

function removePartner(row: PartnerRow) {
  if (!confirm(`Retirer le partenaire « ${row.name || 'sans nom'} » ?`)) return
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
    const saved = await $fetch<{ data: SalmPartner[] }>('/api/admin/salm/partners', {
      method: 'PUT',
      body: { partners: rows.value.map(({ name, logoPath, url }) => ({ name, logoPath, url })) },
    })
    data.value = saved
    showSuccess(saved.data.length ? 'Partenaires enregistrés.' : 'Partenaires retirés : la section n\'est plus affichée.')
  }
  catch (err) {
    const { code, errors: fieldErrors } = parseSalmAdminError(err)
    if (code !== 'VALIDATION') return showError(salmAdminErrorFrom(err))
    const max: Record<string, number> = { name: 80, url: 300 }
    errors.value = Object.fromEntries(Object.entries(fieldErrors).map(([f, c]) => {
      const key = f.split('.').at(-1)!
      return [f, salmFieldErrorMessage(key, c, max[key])]
    }))
    showError(salmAdminErrorMessage('VALIDATION'))
  }
  finally {
    saving.value = false
  }
}
</script>

<template>
  <div>
    <div class="mb-6">
      <h1 class="text-xl font-semibold text-gray-800">Partenaires du SALM</h1>
      <p class="mt-1 text-sm text-gray-500">
        Toutes éditions confondues, affichés en fin de page
        <a href="/salm" target="_blank" rel="noopener" class="font-medium text-emerald-700 underline underline-offset-2">/salm</a>,
        après les chiffres clés. Distincts des partenaires du magazine.
      </p>
    </div>

    <SalmAdminFlash :success="successMessage" :error="errorMessage" @dismiss="clear" />

    <form class="space-y-6" novalidate @submit.prevent="save">
      <fieldset class="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <legend class="px-1 text-lg font-semibold text-gray-900">Logos des partenaires</legend>
        <p class="mb-4 text-sm text-gray-500">
          {{ PARTNERS_MAX }} au plus, dans l'ordre de défilement. Les logos sont posés sur une pastille blanche :
          un PNG sans fond ou un logo sur fond blanc rend le mieux. Sans aucun partenaire, la section n'est pas affichée.
        </p>
        <p class="sr-only" aria-live="polite">{{ order.announcement.value }}</p>
        <p v-if="fieldError('partners')" class="mb-3 text-sm text-red-600">{{ fieldError('partners') }}</p>

        <ol v-if="rows.length" class="space-y-4">
          <li v-for="(r, i) in rows" :key="r.key" class="rounded-lg border border-gray-200 p-4">
            <div class="mb-3 flex items-center justify-between gap-2">
              <span class="text-sm font-medium text-gray-500">Partenaire {{ i + 1 }}</span>
              <span class="flex items-center gap-2">
                <SalmAdminOrderButtons
                  :ref="order.bindButtons(r)"
                  :index="i"
                  :count="rows.length"
                  :label="r.name || 'Partenaire sans nom'"
                  @move="order.move(i, $event)"
                />
                <button
                  type="button"
                  class="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50"
                  @click="removePartner(r)"
                >
                  Retirer<span class="sr-only"> « {{ r.name || 'sans nom' }} »</span>
                </button>
              </span>
            </div>
            <div class="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
              <SalmAdminImageField
                v-model="r.logoPath"
                label="Logo"
                logo
                required
                :error="fieldError(`partners.${i}.logoPath`)"
              />
              <div class="space-y-3">
                <div>
                  <label :for="`partner-${r.key}-name`" class="block text-sm font-medium text-gray-700">Nom <span class="text-red-600" aria-hidden="true">*</span></label>
                  <input
                    :id="`partner-${r.key}-name`"
                    v-model="r.name"
                    type="text"
                    maxlength="80"
                    required
                    placeholder="Université Senghor"
                    :aria-invalid="fieldError(`partners.${i}.name`) ? 'true' : undefined"
                    :aria-describedby="fieldError(`partners.${i}.name`) ? `partner-${r.key}-name-error` : `partner-${r.key}-name-help`"
                    :class="input"
                  >
                  <p v-if="fieldError(`partners.${i}.name`)" :id="`partner-${r.key}-name-error`" class="mt-1 text-sm text-red-600">{{ fieldError(`partners.${i}.name`) }}</p>
                  <p v-else :id="`partner-${r.key}-name-help`" class="mt-1 text-xs text-gray-500">Lu à la place du logo par les lecteurs d'écran.</p>
                </div>
                <div>
                  <label :for="`partner-${r.key}-url`" class="block text-sm font-medium text-gray-700">Site web <span class="font-normal text-gray-500">(facultatif)</span></label>
                  <input
                    :id="`partner-${r.key}-url`"
                    v-model="r.url"
                    type="url"
                    maxlength="300"
                    placeholder="https://…"
                    :aria-invalid="fieldError(`partners.${i}.url`) ? 'true' : undefined"
                    :aria-describedby="fieldError(`partners.${i}.url`) ? `partner-${r.key}-url-error` : undefined"
                    :class="input"
                  >
                  <p v-if="fieldError(`partners.${i}.url`)" :id="`partner-${r.key}-url-error`" class="mt-1 text-sm text-red-600">{{ fieldError(`partners.${i}.url`) }}</p>
                </div>
              </div>
            </div>
          </li>
        </ol>
        <p v-else class="text-sm text-gray-500">Aucun partenaire : la section n'est pas affichée.</p>

        <button
          type="button"
          :disabled="rows.length >= PARTNERS_MAX"
          class="mt-4 rounded-lg bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700 hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-50"
          @click="addPartner"
        >
          + Ajouter un partenaire
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
