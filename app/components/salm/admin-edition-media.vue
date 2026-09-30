<script setup lang="ts">
import type { SalmAdminEditionDetail, SalmAdminPhoto, SalmAdminVideo } from '#shared/types/salm'

// Section « Médias produits » : médias tournés pendant cette édition, affichés sur la page de l'édition
// suivante (FR-160 à FR-164) : vidéo récapitulative, vidéos du canapé, catalogue photos.
const props = defineProps<{ edition: SalmAdminEditionDetail }>()
const emit = defineEmits<{ saved: [message?: string] }>()

const input = 'mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500'
const PHOTOS_PER_BATCH = 50

const { errorMessage, showError, clear } = useSalmFlash()

// ---- Vidéo récapitulative ----
const recap = reactive({ url: props.edition.recap.youtubeUrl ?? '', posterPath: props.edition.recap.posterPath })
const recapErrors = ref<Record<string, string>>({})
const savingRecap = ref(false)

watch(() => props.edition.recap, (r) => Object.assign(recap, { url: r.youtubeUrl ?? '', posterPath: r.posterPath }))

async function saveRecap() {
  savingRecap.value = true
  recapErrors.value = {}
  clear()
  try {
    await $fetch(`/api/admin/salm/editions/${props.edition.id}`, {
      method: 'PATCH',
      body: { recapVideoUrl: recap.url, recapPosterPath: recap.posterPath },
    })
    emit('saved', 'Vidéo récapitulative enregistrée.')
  }
  catch (err) {
    const { code, errors } = parseSalmAdminError(err)
    if (code !== 'VALIDATION') return showError(salmAdminErrorFrom(err))
    recapErrors.value = Object.fromEntries(Object.entries(errors).map(([f, c]) => [f, salmFieldErrorMessage(f, c)]))
  }
  finally {
    savingRecap.value = false
  }
}

// ---- Vidéos du canapé ----
const videos = ref<SalmAdminVideo[]>([...props.edition.videos])
watch(() => props.edition.videos, (list) => { videos.value = [...list] })

function videoLabel(v: SalmAdminVideo) {
  return v.title || `Vidéo ${String(videos.value.indexOf(v) + 1).padStart(2, '0')}`
}

const videoOrder = useSalmOrder({
  items: videos,
  key: (v) => v.id,
  label: videoLabel,
  url: () => `/api/admin/salm/editions/${props.edition.id}/videos/order`,
  onError: (message) => {
    showError(message)
    emit('saved')
  },
})

const editingVideo = ref<SalmAdminVideo | 'new' | null>(null)
const videoForm = reactive({ youtubeUrl: '', title: '', guest: '', institution: '' })
const videoErrors = ref<Record<string, string>>({})
const videoWarning = ref('')
const savingVideo = ref(false)

async function openVideo(target: SalmAdminVideo | 'new') {
  clear()
  videoErrors.value = {}
  videoWarning.value = ''
  editingVideo.value = target
  Object.assign(videoForm, target === 'new'
    ? { youtubeUrl: '', title: '', guest: '', institution: '' }
    : { youtubeUrl: target.youtubeUrl, title: target.title ?? '', guest: target.guest ?? '', institution: target.institution ?? '' })
  await nextTick()
  document.querySelector<HTMLInputElement>('#video-form input[type=url]')?.focus()
}

async function saveVideo() {
  if (!editingVideo.value) return
  savingVideo.value = true
  videoErrors.value = {}
  videoWarning.value = ''
  clear()
  const isNew = editingVideo.value === 'new'
  try {
    const result = await $fetch<SalmAdminVideo & { warnings?: string[] }>(
      isNew ? `/api/admin/salm/editions/${props.edition.id}/videos` : `/api/admin/salm/videos/${(editingVideo.value as SalmAdminVideo).id}`,
      { method: isNew ? 'POST' : 'PATCH', body: { ...videoForm } },
    )
    editingVideo.value = null
    // L'enregistrement a eu lieu ; le doublon est seulement signalé (FR-162)
    if (result.warnings?.includes('DUPLICATE_VIDEO')) videoWarning.value = 'Cette vidéo figure déjà dans la liste.'
    emit('saved', isNew ? 'Vidéo ajoutée.' : 'Vidéo enregistrée.')
  }
  catch (err) {
    const { code, errors } = parseSalmAdminError(err)
    if (code !== 'VALIDATION') return showError(salmAdminErrorFrom(err))
    videoErrors.value = Object.fromEntries(Object.entries(errors).map(([f, c]) => [f, salmFieldErrorMessage(f, c, 150)]))
  }
  finally {
    savingVideo.value = false
  }
}

async function removeVideo(v: SalmAdminVideo) {
  if (!confirm(`Supprimer la vidéo « ${videoLabel(v)} » ?`)) return
  clear()
  try {
    await $fetch(`/api/admin/salm/videos/${v.id}`, { method: 'DELETE' })
    emit('saved', `Vidéo « ${videoLabel(v)} » supprimée.`)
  }
  catch (err) {
    showError(salmAdminErrorFrom(err))
  }
}

// ---- Photos ----
const photos = ref<(SalmAdminPhoto & { draftAlt: string; draftCaption: string })[]>([])
function syncPhotos(list: SalmAdminPhoto[]) {
  photos.value = list.map((p) => ({ ...p, draftAlt: p.alt, draftCaption: p.caption ?? '' }))
}
syncPhotos(props.edition.photos)
watch(() => props.edition.photos, syncPhotos)

function photoLabel(p: SalmAdminPhoto) {
  return p.caption || p.alt
}

const photoOrder = useSalmOrder({
  items: photos,
  key: (p) => p.id,
  label: photoLabel,
  url: () => `/api/admin/salm/editions/${props.edition.id}/photos/order`,
  onError: (message) => {
    showError(message)
    emit('saved')
  },
})

const photoErrors = ref<Record<number, string>>({})
const savingPhoto = ref<number | null>(null)

async function savePhoto(p: (typeof photos.value)[number]) {
  savingPhoto.value = p.id
  delete photoErrors.value[p.id]
  clear()
  try {
    await $fetch(`/api/admin/salm/photos/${p.id}`, { method: 'PATCH', body: { alt: p.draftAlt, caption: p.draftCaption } })
    emit('saved', 'Photo enregistrée.')
  }
  catch (err) {
    const { code, errors } = parseSalmAdminError(err)
    if (code !== 'VALIDATION') return showError(salmAdminErrorFrom(err))
    const [field, c] = Object.entries(errors)[0] ?? []
    photoErrors.value[p.id] = field === 'caption'
      ? `Légende : ${salmFieldErrorMessage(field, c, 200)}`
      : `Texte alternatif : ${salmFieldErrorMessage(field ?? 'alt', c, 200)}`
  }
  finally {
    savingPhoto.value = null
  }
}

async function removePhoto(p: SalmAdminPhoto) {
  if (!confirm(`Supprimer la photo « ${photoLabel(p)} » ?`)) return
  clear()
  try {
    await $fetch(`/api/admin/salm/photos/${p.id}`, { method: 'DELETE' })
    emit('saved', 'Photo supprimée.')
  }
  catch (err) {
    showError(salmAdminErrorFrom(err))
  }
}

// ---- Envoi multiple (FR-163) : chaque photo passe par l'éditeur, puis part aussitôt ; un échec n'interrompt pas la suite ----
// Photos agrandissables dans la galerie : l'image recadrée est gardée comme original et le serveur en tire
// la version web affichée dans l'aperçu (`keepOriginal`).
const { upload } = useSalmUpload()
const photoInput = ref<HTMLInputElement>()
const photoMaxBytes = salmMaxBytes('image', true)
const batch = reactive({ running: false, done: 0, total: 0, added: 0, skipped: 0, refused: [] as { name: string; reason: string }[], finished: false })
/** Photos qui attendent l'éditeur ; la première y est ouverte. */
const queue = shallowRef<File[]>([])
const editor = reactive({ busy: false, progress: 0, error: '' })

function refusalReason(code: string | undefined, err?: unknown) {
  if (code === 'UNSUPPORTED_FORMAT') return 'format non accepté : JPEG, PNG ou WebP'
  if (code === 'FILE_TOO_LARGE') return 'plus de 10 Mo'
  if (code === 'CORRUPTED_FILE') return 'fichier illisible ou endommagé'
  if (code === 'BATCH_LIMIT') return `au-delà de ${PHOTOS_PER_BATCH} fichiers par envoi`
  return salmAdminErrorFrom(err).replace(/\.$/, '').toLocaleLowerCase('fr-FR')
}

function onPhotos(event: Event) {
  const target = event.target as HTMLInputElement
  const files = [...(target.files ?? [])]
  target.value = ''
  if (!files.length) return
  clear()
  Object.assign(batch, { running: true, done: 0, total: Math.min(files.length, PHOTOS_PER_BATCH), added: 0, skipped: 0, refused: [], finished: false })
  for (const file of files.slice(PHOTOS_PER_BATCH)) batch.refused.push({ name: file.name, reason: refusalReason('BATCH_LIMIT') })

  const accepted: File[] = []
  for (const file of files.slice(0, PHOTOS_PER_BATCH)) {
    // Le type se contrôle avant l'éditeur ; le poids, sur le fichier qui en sort
    if (checkSalmFile(file, 'image', true) === 'UNSUPPORTED_FORMAT') {
      batch.refused.push({ name: file.name, reason: refusalReason('UNSUPPORTED_FORMAT') })
      batch.done++
    }
    else accepted.push(file)
  }
  Object.assign(editor, { busy: false, progress: 0, error: '' })
  queue.value = accepted
  if (!accepted.length) finishBatch()
}

async function sendPhoto(file: File, onProgress?: (percent: number) => void) {
  const { path, originalPath } = await upload(file, 'image', { keepOriginal: true, onProgress })
  await $fetch(`/api/admin/salm/editions/${props.edition.id}/photos`, { method: 'POST', body: { imagePath: path, originalPath } })
  batch.added++
}

function nextPhoto() {
  batch.done++
  Object.assign(editor, { busy: false, progress: 0, error: '' })
  queue.value = queue.value.slice(1)
  if (!queue.value.length) finishBatch()
}

async function onPhotoApply({ file }: { file: File }) {
  Object.assign(editor, { busy: true, progress: 0, error: '' })
  try {
    await sendPhoto(file, (p) => { editor.progress = p })
    nextPhoto()
  }
  catch (err) {
    // L'éditeur reste ouvert sur cette photo : réduire le poids, réessayer ou l'écarter
    const reason = refusalReason(parseSalmAdminError(err).code, err)
    Object.assign(editor, { busy: false, error: `Envoi refusé : ${reason}.` })
  }
}

function skipPhoto() {
  batch.skipped++
  nextPhoto()
}

/** Les photos restantes partent telles quelles (sans recadrage), l'une après l'autre. */
async function sendRemainingAsIs() {
  const remaining = queue.value
  queue.value = []
  for (const file of remaining) {
    try {
      await sendPhoto(file)
    }
    catch (err) {
      batch.refused.push({ name: file.name, reason: refusalReason(parseSalmAdminError(err).code, err) })
    }
    batch.done++
  }
  finishBatch()
}

/** Annuler dans l'éditeur : les photos déjà envoyées restent, les suivantes sont écartées. */
function cancelBatch() {
  batch.skipped += queue.value.length
  batch.done += queue.value.length
  queue.value = []
  finishBatch()
}

function finishBatch() {
  Object.assign(batch, { running: false, finished: true })
  emit('saved')
}

const batchSummary = computed(() => {
  const plural = (n: number) => (n > 1 ? 's' : '')
  const skipped = batch.skipped ? ` ${batch.skipped} photo${plural(batch.skipped)} écartée${plural(batch.skipped)}.` : ''
  const added = `${batch.added} photo${plural(batch.added)} ajoutée${plural(batch.added)}.${skipped}`
  if (!batch.refused.length) return added
  const n = batch.refused.length
  return `${added} ${n} fichier${n > 1 ? 's' : ''} refusé${n > 1 ? 's' : ''} : ${batch.refused.map((r) => `${r.name} (${r.reason})`).join(', ')}.`
})
</script>

<template>
  <div class="space-y-6">
    <!-- Encadré FR-160 -->
    <div class="rounded-lg border border-sky-200 bg-sky-50 p-4 text-sm text-sky-900">
      <p>Ces médias ont été produits pendant le SALM {{ edition.year }}. Ils s'affichent sur la page du SALM {{ edition.nextEditionYear }}.</p>
      <p v-if="edition.previousEdition" class="mt-1">
        La page du SALM {{ edition.year }} affiche les médias du SALM {{ edition.previousEdition.year }}
        (<NuxtLink :to="`/admin/salm/editions/${edition.previousEdition.id}?section=medias`" class="font-medium underline underline-offset-2">Gérer les médias {{ edition.previousEdition.year }}</NuxtLink>).
      </p>
      <p v-else class="mt-1">La page du SALM {{ edition.year }} n'affiche aucun média d'une édition précédente.</p>
    </div>

    <SalmAdminFlash :error="errorMessage" @dismiss="clear" />

    <!-- Vidéo récapitulative -->
    <form class="rounded-lg border border-gray-200 bg-white p-6 shadow-sm" novalidate @submit.prevent="saveRecap">
      <h2 class="text-lg font-semibold text-gray-900">Vidéo récapitulative</h2>
      <p class="mb-4 text-sm text-gray-500">Bouton « Revivre le SALM {{ edition.year }} » et fond du haut de la page du SALM {{ edition.nextEditionYear }}.</p>
      <div class="grid gap-6 lg:grid-cols-2">
        <SalmAdminYoutubeField v-model="recap.url" label="Adresse YouTube" :error="recapErrors.recapVideoUrl" />
        <SalmAdminImageField
          v-model="recap.posterPath"
          label="Image de secours"
          decorative
          :aspect-ratio="16 / 9"
          :error="recapErrors.recapPosterPath"
        />
      </div>
      <button
        type="submit"
        :disabled="savingRecap"
        class="mt-4 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
      >
        {{ savingRecap ? 'Enregistrement…' : 'Enregistrer' }}
      </button>
    </form>

    <!-- Vidéos du canapé -->
    <div class="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <div class="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 class="text-lg font-semibold text-gray-900">Vidéos du canapé</h2>
          <p class="text-sm text-gray-500">« Le canapé du SALM {{ edition.year }} », dans cet ordre.</p>
        </div>
        <button v-if="!editingVideo" type="button" class="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700" @click="openVideo('new')">
          + Ajouter une vidéo
        </button>
      </div>
      <p class="sr-only" aria-live="polite">{{ videoOrder.announcement.value }}</p>
      <p v-if="videoWarning" class="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800" role="status">{{ videoWarning }}</p>

      <form v-if="editingVideo" id="video-form" class="mb-6 rounded-lg border border-emerald-200 bg-emerald-50/40 p-4" novalidate @submit.prevent="saveVideo">
        <h3 class="mb-3 text-sm font-semibold text-gray-900">{{ editingVideo === 'new' ? 'Nouvelle vidéo' : 'Modifier la vidéo' }}</h3>
        <div class="grid gap-4 sm:grid-cols-3">
          <div class="sm:col-span-3">
            <SalmAdminYoutubeField v-model="videoForm.youtubeUrl" label="Adresse YouTube" required :error="videoErrors.youtubeUrl" />
          </div>
          <div>
            <label for="video-title" class="block text-sm font-medium text-gray-700">Titre <span class="font-normal text-gray-500">(facultatif)</span></label>
            <input id="video-title" v-model="videoForm.title" type="text" maxlength="150" :aria-invalid="videoErrors.title ? 'true' : undefined" :aria-describedby="videoErrors.title ? 'video-title-error' : undefined" :class="input">
            <p v-if="videoErrors.title" id="video-title-error" class="mt-1 text-sm text-red-600">{{ videoErrors.title }}</p>
          </div>
          <div>
            <label for="video-guest" class="block text-sm font-medium text-gray-700">Invité·e <span class="font-normal text-gray-500">(facultatif)</span></label>
            <input id="video-guest" v-model="videoForm.guest" type="text" maxlength="150" :aria-invalid="videoErrors.guest ? 'true' : undefined" :aria-describedby="videoErrors.guest ? 'video-guest-error' : undefined" :class="input">
            <p v-if="videoErrors.guest" id="video-guest-error" class="mt-1 text-sm text-red-600">{{ videoErrors.guest }}</p>
          </div>
          <div>
            <label for="video-institution" class="block text-sm font-medium text-gray-700">Établissement <span class="font-normal text-gray-500">(facultatif)</span></label>
            <input id="video-institution" v-model="videoForm.institution" type="text" maxlength="150" :aria-invalid="videoErrors.institution ? 'true' : undefined" :aria-describedby="videoErrors.institution ? 'video-institution-error' : undefined" :class="input">
            <p v-if="videoErrors.institution" id="video-institution-error" class="mt-1 text-sm text-red-600">{{ videoErrors.institution }}</p>
          </div>
        </div>
        <div class="mt-4 flex gap-3">
          <button type="submit" :disabled="savingVideo" class="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50">
            {{ savingVideo ? 'Enregistrement…' : editingVideo === 'new' ? 'Ajouter' : 'Enregistrer' }}
          </button>
          <button type="button" class="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50" @click="editingVideo = null">Annuler</button>
        </div>
      </form>

      <ol v-if="videos.length" class="divide-y divide-gray-100 rounded-lg border border-gray-100">
        <li v-for="(v, i) in videos" :key="v.id" class="flex flex-wrap items-center gap-3 p-3">
          <img
            v-if="v.youtubeId"
            :src="`https://i.ytimg.com/vi/${v.youtubeId}/hqdefault.jpg`"
            alt=""
            class="h-14 w-24 shrink-0 rounded bg-gray-100 object-cover"
          >
          <div class="min-w-0 flex-1 text-sm">
            <p class="font-semibold text-gray-900">{{ videoLabel(v) }}</p>
            <p class="text-gray-500">{{ [v.guest, v.institution].filter(Boolean).join(' · ') || '—' }}</p>
          </div>
          <div class="flex flex-wrap items-center gap-2">
            <SalmAdminOrderButtons :ref="videoOrder.bindButtons(v)" :index="i" :count="videos.length" :label="videoLabel(v)" @move="videoOrder.move(i, $event)" />
            <button type="button" class="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50" @click="openVideo(v)">
              Modifier<span class="sr-only"> « {{ videoLabel(v) }} »</span>
            </button>
            <button type="button" class="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50" @click="removeVideo(v)">
              Supprimer<span class="sr-only"> « {{ videoLabel(v) }} »</span>
            </button>
          </div>
        </li>
      </ol>
      <p v-else-if="!editingVideo" class="text-sm text-gray-500">Aucune vidéo.</p>
    </div>

    <!-- Photos -->
    <div class="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <div class="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 class="text-lg font-semibold text-gray-900">Photos</h2>
          <p class="text-sm text-gray-500">
            {{ photos.length }} photo{{ photos.length > 1 ? 's' : '' }} ; les 4 premières forment l'aperçu de la page.
            JPEG, PNG ou WebP, 10 Mo au plus, {{ PHOTOS_PER_BATCH }} fichiers par envoi. Chaque photo s'ouvre dans l'éditeur avant l'envoi.
          </p>
        </div>
        <button
          type="button"
          :disabled="batch.running"
          class="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
          @click="photoInput?.click()"
        >
          + Ajouter des photos
        </button>
        <input ref="photoInput" type="file" multiple accept="image/jpeg,image/png,image/webp" class="hidden" tabindex="-1" aria-hidden="true" @change="onPhotos">
      </div>

      <div aria-live="polite" class="mb-4 empty:hidden">
        <div v-if="batch.running">
          <label for="photos-progress" class="mb-1 block text-sm text-gray-700">Envoi {{ batch.done }} / {{ batch.total }}</label>
          <progress id="photos-progress" :value="batch.done" :max="batch.total" class="h-2 w-full accent-emerald-500" />
        </div>
        <p
          v-else-if="batch.finished"
          class="rounded-lg p-3 text-sm"
          :class="batch.refused.length ? 'border border-amber-200 bg-amber-50 text-amber-900' : 'bg-green-50 text-green-700'"
        >
          {{ batchSummary }}
        </p>
      </div>
      <p class="sr-only" aria-live="polite">{{ photoOrder.announcement.value }}</p>

      <ol v-if="photos.length" class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <li v-for="(p, i) in photos" :key="p.id" class="overflow-hidden rounded-lg border border-gray-200">
          <img :src="p.imagePath" alt="" class="aspect-[4/3] w-full bg-gray-100 object-cover">
          <form class="space-y-2 p-3" novalidate @submit.prevent="savePhoto(p)">
            <p class="text-xs font-semibold text-gray-500">Photo {{ i + 1 }}</p>
            <div>
              <label :for="`photo-${p.id}-alt`" class="block text-xs font-medium text-gray-700">Texte alternatif</label>
              <input :id="`photo-${p.id}-alt`" v-model="p.draftAlt" type="text" maxlength="200" required :aria-invalid="photoErrors[p.id] ? 'true' : undefined" :aria-describedby="photoErrors[p.id] ? `photo-${p.id}-error` : undefined" :class="input">
            </div>
            <div>
              <label :for="`photo-${p.id}-caption`" class="block text-xs font-medium text-gray-700">Légende <span class="font-normal text-gray-500">(facultative)</span></label>
              <input :id="`photo-${p.id}-caption`" v-model="p.draftCaption" type="text" maxlength="200" :class="input">
            </div>
            <p v-if="photoErrors[p.id]" :id="`photo-${p.id}-error`" class="text-sm text-red-600">{{ photoErrors[p.id] }}</p>
            <div class="flex flex-wrap items-center gap-2">
              <button
                type="submit"
                :disabled="savingPhoto === p.id || (p.draftAlt === p.alt && p.draftCaption === (p.caption ?? ''))"
                class="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-40"
              >
                Enregistrer<span class="sr-only"> la photo {{ i + 1 }}</span>
              </button>
              <SalmAdminOrderButtons :ref="photoOrder.bindButtons(p)" :index="i" :count="photos.length" :label="photoLabel(p)" @move="photoOrder.move(i, $event)" />
              <button type="button" class="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50" @click="removePhoto(p)">
                Supprimer<span class="sr-only"> la photo {{ i + 1 }}</span>
              </button>
            </div>
          </form>
        </li>
      </ol>
      <p v-else class="text-sm text-gray-500">Aucune photo.</p>
    </div>

    <ImageEditor
      v-if="queue[0]"
      :file="queue[0]"
      :title="`Photo ${batch.done + 1} sur ${batch.total}`"
      description="Recadrez la photo telle qu'elle apparaîtra dans le catalogue."
      keep-original
      :max-bytes="photoMaxBytes"
      :busy="editor.busy"
      :progress="editor.progress"
      :error="editor.error"
      :apply-label="queue.length > 1 ? 'Envoyer et passer à la suivante' : 'Envoyer la photo'"
      :cancel-label="queue.length > 1 ? 'Arrêter l\'envoi' : 'Annuler'"
      @apply="onPhotoApply"
      @cancel="cancelBatch"
    >
      <template #actions>
        <button
          type="button"
          :disabled="editor.busy"
          class="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          @click="skipPhoto"
        >
          Écarter cette photo
        </button>
        <button
          v-if="queue.length > 1"
          type="button"
          :disabled="editor.busy"
          class="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          @click="sendRemainingAsIs"
        >
          Envoyer les {{ queue.length }} photos sans recadrer
        </button>
      </template>
    </ImageEditor>
  </div>
</template>
