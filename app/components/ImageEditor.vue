<script setup lang="ts">
// Éditeur d'image du back-office : recadrage, largeur, format et qualité, avant l'envoi.
// Ce qui sort d'ici EST le fichier envoyé : le poids affiché est mesuré sur l'encodage réel, jamais estimé.
// `keepOriginal` : image agrandissable au clic. Le fichier produit est gardé comme original (pleine largeur par
// défaut) et le serveur en tire lui-même la version web légère (`variants=web` de POST /api/upload).
// Le recadrage reste manuel : un rognage automatique au centre couperait le sujet d'une photo de salon.
const props = withDefaults(defineProps<{
  /** Fichier choisi sur le disque ; il n'est pas envoyé tel quel. */
  file: File
  title?: string
  description?: string
  /** Largeur ÷ hauteur proposée au départ ; `null` : recadrage libre. Modifiable dans l'éditeur. */
  aspectRatio?: number | null
  /** Nom de ce rapport s'il n'est pas dans la liste (« Affiche », « Bannière »…). */
  ratioLabel?: string
  keepOriginal?: boolean
  /** Largeur de sortie proposée (dimensions recommandées de l'emplacement) ; jamais au-delà de la sélection. */
  targetWidth?: number | null
  /** Poids maximal accepté par le serveur, en octets. */
  maxBytes?: number | null
  /** Envoi en cours chez l'appelant. */
  busy?: boolean
  /** Progression de l'envoi, en %. */
  progress?: number | null
  /** Erreur de l'envoi, déjà traduite : l'éditeur reste ouvert pour corriger. */
  error?: string
  applyLabel?: string
  cancelLabel?: string
}>(), {
  title: 'Recadrer l\'image',
  description: '',
  aspectRatio: null,
  ratioLabel: '',
  keepOriginal: false,
  targetWidth: null,
  maxBytes: null,
  busy: false,
  progress: null,
  error: '',
  applyLabel: 'Enregistrer l\'image',
  cancelLabel: 'Annuler',
})

const emit = defineEmits<{
  apply: [result: { file: File; width: number; height: number }]
  cancel: []
}>()

type Format = 'jpeg' | 'webp' | 'png'
const FORMATS: { value: Format; label: string; hint: string }[] = [
  { value: 'jpeg', label: 'JPEG', hint: 'Photographies : léger, sans transparence.' },
  { value: 'webp', label: 'WebP', hint: 'Le plus léger à qualité égale, transparence possible.' },
  { value: 'png', label: 'PNG', hint: 'Logos et aplats : sans perte, transparence gardée, lourd pour une photo.' },
]
const MIME: Record<Format, string> = { jpeg: 'image/jpeg', webp: 'image/webp', png: 'image/png' }
const EXTENSION: Record<Format, string> = { jpeg: 'jpg', webp: 'webp', png: 'png' }

const RATIOS: { label: string; value: number | null }[] = [
  { label: 'Libre', value: null },
  { label: '1:1', value: 1 },
  { label: '4:3', value: 4 / 3 },
  { label: '3:2', value: 3 / 2 },
  { label: '16:9', value: 16 / 9 },
  { label: '3:4', value: 3 / 4 },
  { label: 'A4', value: 210 / 297 },
  { label: '9:16', value: 9 / 16 },
]

/** Plus petit côté de sélection, en pixels d'écran. */
const MIN_DISPLAY_SIDE = 40
/** Rayon de préhension d'une poignée : aussi une cible tactile. */
const GRAB_RADIUS = 16
const HANDLE_RADIUS = 7
/** Marge autour de l'image dans le cadre : les poignées posées sur ses bords restent entières. */
const FRAME_PADDING = HANDLE_RADIUS + 5
/** Largeur proposée pour une image à format unique : au-delà, le poids ne paie plus. */
const DEFAULT_WEB_WIDTH = 2000
const MIN_OUTPUT_WIDTH = 320
const COLORS = { ground: '#f3f4f6', accent: '#10b981', handle: '#ffffff', scrim: '#000000' }

const id = useId()
const dialog = ref<HTMLDialogElement>()
const frame = ref<HTMLElement>()
const canvas = ref<HTMLCanvasElement>()

const image = shallowRef<HTMLImageElement | null>(null)
const loadFailed = ref(false)
const encodeFailed = ref(false)

/** Sélection, en pixels de l'image (pas de l'écran). */
const crop = reactive({ x: 0, y: 0, w: 0, h: 0 })
/** Taille du cadre de dessin, en pixels CSS (tenue par l'observateur de taille). */
const view = reactive({ w: 0, h: 0 })

const ratioOptions = computed(() => {
  const r = props.aspectRatio
  if (r && !RATIOS.some((o) => o.value && Math.abs(o.value - r) < 0.01)) {
    return [{ label: props.ratioLabel || 'Conseillé', value: r }, ...RATIOS]
  }
  return RATIOS
})
const ratio = ref<number | null>(props.aspectRatio)

const format = ref<Format>('jpeg')
const quality = ref(82)
const outputWidth = ref(DEFAULT_WEB_WIDTH)
/** La largeur a été choisie à la main : elle ne suit plus le recadrage. */
const widthTouched = ref(false)

const output = shallowRef<{ blob: Blob; width: number; height: number } | null>(null)
const outputUrl = ref('')
const encoding = ref(false)
const cursor = ref('default')

let sourceUrl = ''
let encodeTimer: ReturnType<typeof setTimeout> | null = null

// ---- Ouverture et chargement ----

function defaultFormat(type: string): Format {
  if (type === 'image/png') return 'png'
  if (type === 'image/webp') return 'webp'
  return 'jpeg'
}

function load(file: File) {
  if (sourceUrl) URL.revokeObjectURL(sourceUrl)
  if (outputUrl.value) URL.revokeObjectURL(outputUrl.value)
  image.value = null
  output.value = null
  outputUrl.value = ''
  loadFailed.value = false
  encodeFailed.value = false
  widthTouched.value = false
  ratio.value = props.aspectRatio
  format.value = defaultFormat(file.type)
  quality.value = props.keepOriginal ? 92 : 82

  sourceUrl = URL.createObjectURL(file)
  const element = new Image()
  element.onload = () => {
    // Sans dimensions (SVG sans taille), rien à recadrer : drawImage lèverait plus loin, sans rien dire
    if (!element.naturalWidth || !element.naturalHeight) {
      loadFailed.value = true
      return
    }
    image.value = element
    initCrop()
    draw()
    scheduleEncode()
  }
  element.onerror = () => { loadFailed.value = true }
  element.src = sourceUrl
}

watch(() => props.file, load)

// L'observateur plutôt qu'une mesure au montage : la fenêtre vient de s'ouvrir et sa largeur peut valoir zéro ;
// il redessine aussi quand on tourne le téléphone.
let observer: ResizeObserver | null = null

onMounted(() => {
  dialog.value?.showModal()
  load(props.file)
  if (!frame.value) return
  observer = new ResizeObserver((entries) => {
    const box = entries[0]?.contentRect
    if (!box || box.width === 0) return
    view.w = box.width
    view.h = box.height
    draw()
  })
  observer.observe(frame.value)
})

onBeforeUnmount(() => {
  observer?.disconnect()
  if (encodeTimer) clearTimeout(encodeTimer)
  if (sourceUrl) URL.revokeObjectURL(sourceUrl)
  if (outputUrl.value) URL.revokeObjectURL(outputUrl.value)
  if (dialog.value?.open) dialog.value.close()
})

function onDialogCancel(event: Event) {
  event.preventDefault()
  if (!props.busy) emit('cancel')
}

// ---- Géométrie : image ↔ écran ----

/** L'image entière tient dans le cadre, sans être agrandie. */
const scale = computed(() => {
  const source = image.value
  if (!source || !view.w || !view.h) return 1
  const w = Math.max(1, view.w - 2 * FRAME_PADDING)
  const h = Math.max(1, view.h - 2 * FRAME_PADDING)
  return Math.min(w / source.naturalWidth, h / source.naturalHeight, 1)
})

const offset = computed(() => {
  const source = image.value
  if (!source) return { x: 0, y: 0 }
  return {
    x: (view.w - source.naturalWidth * scale.value) / 2,
    y: (view.h - source.naturalHeight * scale.value) / 2,
  }
})

const toScreen = (x: number, y: number) => ({ x: offset.value.x + x * scale.value, y: offset.value.y + y * scale.value })
const toImage = (x: number, y: number) => ({ x: (x - offset.value.x) / scale.value, y: (y - offset.value.y) / scale.value })
const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max)

/** Largeur de sortie par défaut : la largeur conseillée, sinon toute la sélection pour un original, 2000 px au plus. */
function defaultWidth() {
  const wanted = props.targetWidth ?? (props.keepOriginal ? Infinity : DEFAULT_WEB_WIDTH)
  return Math.max(1, Math.round(Math.min(wanted, crop.w)))
}

/** La plus grande sélection au rapport choisi, centrée. */
function initCrop() {
  const source = image.value
  if (!source) return
  const W = source.naturalWidth
  const H = source.naturalHeight
  const r = ratio.value
  if (!r) Object.assign(crop, { x: 0, y: 0, w: W, h: H })
  else {
    const width = Math.min(W, H * r)
    const height = width / r
    Object.assign(crop, { x: (W - width) / 2, y: (H - height) / 2, w: width, h: height })
  }
  if (!widthTouched.value) outputWidth.value = defaultWidth()
}

function chooseRatio(value: number | null) {
  ratio.value = value
  initCrop()
  scheduleEncode()
}

// ---- Dessin ----

type Handle = 'nw' | 'ne' | 'sw' | 'se' | 'n' | 's' | 'w' | 'e'
const HANDLES: Handle[] = ['nw', 'ne', 'sw', 'se', 'n', 's', 'w', 'e']
const CURSORS: Record<Handle, string> = {
  nw: 'nwse-resize', se: 'nwse-resize', ne: 'nesw-resize', sw: 'nesw-resize',
  n: 'ns-resize', s: 'ns-resize', w: 'ew-resize', e: 'ew-resize',
}

/** Position d'une poignée, en pixels de l'image. */
function handleAt(handle: Handle) {
  const x = handle.includes('w') ? crop.x : handle.includes('e') ? crop.x + crop.w : crop.x + crop.w / 2
  const y = handle.includes('n') ? crop.y : handle.includes('s') ? crop.y + crop.h : crop.y + crop.h / 2
  return { x, y }
}

function draw() {
  const element = canvas.value
  const source = image.value
  if (!element || !source || !view.w) return

  const dpr = window.devicePixelRatio || 1
  element.width = Math.round(view.w * dpr)
  element.height = Math.round(view.h * dpr)
  const ctx = element.getContext('2d')
  if (!ctx) return
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

  const dw = source.naturalWidth * scale.value
  const dh = source.naturalHeight * scale.value
  const { x: ox, y: oy } = offset.value

  ctx.fillStyle = COLORS.ground
  ctx.fillRect(0, 0, view.w, view.h)
  ctx.drawImage(source, ox, oy, dw, dh)

  // Le voile laisse deviner ce qui est hors sélection : on recadre en voyant ce qu'on laisse
  ctx.globalAlpha = 0.55
  ctx.fillStyle = COLORS.scrim
  ctx.fillRect(ox, oy, dw, dh)
  ctx.globalAlpha = 1

  const a = toScreen(crop.x, crop.y)
  const b = toScreen(crop.x + crop.w, crop.y + crop.h)
  const cw = b.x - a.x
  const ch = b.y - a.y

  ctx.save()
  ctx.beginPath()
  ctx.rect(a.x, a.y, cw, ch)
  ctx.clip()
  ctx.drawImage(source, ox, oy, dw, dh)
  ctx.restore()

  // Grille des tiers
  ctx.strokeStyle = COLORS.handle
  ctx.globalAlpha = 0.4
  ctx.lineWidth = 1
  ctx.beginPath()
  for (let i = 1; i < 3; i++) {
    ctx.moveTo(a.x + (cw * i) / 3, a.y)
    ctx.lineTo(a.x + (cw * i) / 3, b.y)
    ctx.moveTo(a.x, a.y + (ch * i) / 3)
    ctx.lineTo(b.x, a.y + (ch * i) / 3)
  }
  ctx.stroke()
  ctx.globalAlpha = 1

  ctx.strokeStyle = COLORS.accent
  ctx.lineWidth = 2
  ctx.strokeRect(a.x, a.y, cw, ch)

  ctx.fillStyle = COLORS.handle
  for (const handle of HANDLES) {
    const p = handleAt(handle)
    const s = toScreen(p.x, p.y)
    ctx.beginPath()
    ctx.arc(s.x, s.y, HANDLE_RADIUS, 0, Math.PI * 2)
    ctx.fill()
    ctx.stroke()
  }
}

watch(() => [crop.x, crop.y, crop.w, crop.h], draw)

// ---- Manipulation à la souris, au doigt et au clavier ----

type Mode = { kind: 'move' } | { kind: 'resize'; handle: Handle } | null
let mode: Mode = null
let startPointer = { x: 0, y: 0 }
let startCrop = { x: 0, y: 0, w: 0, h: 0 }

/** Ce qui est visé à cet endroit : les poignées d'abord, l'intérieur ensuite. */
function targetAt(x: number, y: number): Handle | 'move' | null {
  for (const handle of HANDLES) {
    const p = handleAt(handle)
    const s = toScreen(p.x, p.y)
    if (Math.hypot(x - s.x, y - s.y) <= GRAB_RADIUS) return handle
  }
  const a = toScreen(crop.x, crop.y)
  const b = toScreen(crop.x + crop.w, crop.y + crop.h)
  return x >= a.x && x <= b.x && y >= a.y && y <= b.y ? 'move' : null
}

function pointerPosition(event: PointerEvent) {
  const box = canvas.value!.getBoundingClientRect()
  return { x: event.clientX - box.left, y: event.clientY - box.top }
}

function onPointerDown(event: PointerEvent) {
  if (!image.value) return
  const position = pointerPosition(event)
  const target = targetAt(position.x, position.y)
  if (!target) return
  mode = target === 'move' ? { kind: 'move' } : { kind: 'resize', handle: target }
  startPointer = position
  startCrop = { ...crop }
  ;(event.target as HTMLElement).setPointerCapture(event.pointerId)
  event.preventDefault()
}

function onPointerMove(event: PointerEvent) {
  const source = image.value
  if (!source) return
  const position = pointerPosition(event)
  if (!mode) {
    const target = targetAt(position.x, position.y)
    cursor.value = target === 'move' ? 'move' : target ? CURSORS[target] : 'default'
    return
  }
  if (mode.kind === 'move') {
    const dx = (position.x - startPointer.x) / scale.value
    const dy = (position.y - startPointer.y) / scale.value
    crop.x = clamp(startCrop.x + dx, 0, source.naturalWidth - startCrop.w)
    crop.y = clamp(startCrop.y + dy, 0, source.naturalHeight - startCrop.h)
    return
  }
  resize(mode.handle, toImage(position.x, position.y))
}

function onPointerUp(event: PointerEvent) {
  if (!mode) return
  mode = null
  ;(event.target as HTMLElement).releasePointerCapture?.(event.pointerId)
  afterCropChange()
}

/**
 * Redimensionnement en trois temps : le bord tiré, le rapport imposé, puis le retour dans l'image.
 * Quand le rapport fait déborder la sélection, elle est rétrécie autour de son ancre plutôt que coupée
 * (couper romprait le rapport).
 */
function resize(handle: Handle, pointer: { x: number; y: number }) {
  const source = image.value
  if (!source) return
  const W = source.naturalWidth
  const H = source.naturalHeight
  const min = MIN_DISPLAY_SIDE / scale.value
  let left = startCrop.x
  let top = startCrop.y
  let right = startCrop.x + startCrop.w
  let bottom = startCrop.y + startCrop.h

  if (handle.includes('w')) left = clamp(pointer.x, 0, right - min)
  if (handle.includes('e')) right = clamp(pointer.x, left + min, W)
  if (handle.includes('n')) top = clamp(pointer.y, 0, bottom - min)
  if (handle.includes('s')) bottom = clamp(pointer.y, top + min, H)

  const r = ratio.value
  if (r) {
    let width = right - left
    let height = bottom - top
    if (handle === 'n' || handle === 's') {
      width = height * r
      const cx = (left + right) / 2
      left = cx - width / 2
      right = cx + width / 2
    }
    else if (handle === 'e' || handle === 'w') {
      height = width / r
      const cy = (top + bottom) / 2
      top = cy - height / 2
      bottom = cy + height / 2
    }
    else {
      if (width / height > r) width = height * r
      else height = width / r
      if (handle.includes('w')) left = right - width
      else right = left + width
      if (handle.includes('n')) top = bottom - height
      else bottom = top + height
    }

    const availableW = handle.includes('w') ? right : handle.includes('e') ? W - left : W
    const availableH = handle.includes('n') ? bottom : handle.includes('s') ? H - top : H
    const shrink = Math.min(1, availableW / (right - left), availableH / (bottom - top))
    if (shrink < 1) {
      const w2 = (right - left) * shrink
      const h2 = (bottom - top) * shrink
      if (handle.includes('w')) left = right - w2
      else if (handle.includes('e')) right = left + w2
      else {
        const cx = (left + right) / 2
        left = cx - w2 / 2
        right = cx + w2 / 2
      }
      if (handle.includes('n')) top = bottom - h2
      else if (handle.includes('s')) bottom = top + h2
      else {
        const cy = (top + bottom) / 2
        top = cy - h2 / 2
        bottom = cy + h2 / 2
      }
    }
  }

  const width = Math.min(right - left, W)
  const height = Math.min(bottom - top, H)
  crop.x = clamp(left, 0, Math.max(0, W - width))
  crop.y = clamp(top, 0, Math.max(0, H - height))
  crop.w = width
  crop.h = height
}

/** Flèches : déplacer la sélection (Alt : pas fin) ; Maj + flèches : la redimensionner par le coin bas-droit. */
function onKeyDown(event: KeyboardEvent) {
  const source = image.value
  if (!source) return
  const step = (event.altKey ? 1 : 10) / scale.value
  const moves: Record<string, [number, number]> = {
    ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step],
  }
  const move = moves[event.key]
  if (!move) return
  event.preventDefault()
  if (event.shiftKey) {
    startCrop = { ...crop }
    resize('se', { x: crop.x + crop.w + move[0], y: crop.y + crop.h + move[1] })
  }
  else {
    crop.x = clamp(crop.x + move[0], 0, source.naturalWidth - crop.w)
    crop.y = clamp(crop.y + move[1], 0, source.naturalHeight - crop.h)
  }
  afterCropChange()
}

function afterCropChange() {
  if (!widthTouched.value) outputWidth.value = defaultWidth()
  else if (outputWidth.value > maxOutputWidth.value) outputWidth.value = maxOutputWidth.value
  scheduleEncode()
}

// ---- Encodage ----

const maxOutputWidth = computed(() => Math.max(1, Math.round(crop.w)))
const minOutputWidth = computed(() => Math.min(MIN_OUTPUT_WIDTH, maxOutputWidth.value))

/** Encodage différé : réencoder à chaque pixel glissé bloquerait la page sur une grande photo. */
function scheduleEncode() {
  if (encodeTimer) clearTimeout(encodeTimer)
  encoding.value = true
  encodeTimer = setTimeout(() => void encode(), 160)
}

async function encode() {
  const source = image.value
  encoding.value = false
  if (!source) return
  encodeFailed.value = false

  const width = Math.max(1, Math.round(Math.min(outputWidth.value, crop.w)))
  const height = Math.max(1, Math.round(width / (crop.w / crop.h)))
  const target = document.createElement('canvas')
  target.width = width
  target.height = height
  const ctx = target.getContext('2d')
  if (!ctx) {
    encodeFailed.value = true
    return
  }
  // Fond blanc hors PNG : une transparence aplatie en JPEG donnerait du noir
  if (format.value !== 'png') {
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, width, height)
  }
  ctx.imageSmoothingQuality = 'high'

  // drawImage lève sur une sélection dégénérée ; toBlob rend `null` si le navigateur ne sait pas encoder
  // le format ou si le canevas dépasse sa limite de taille : les deux s'affichent.
  let blob: Blob | null = null
  try {
    ctx.drawImage(source, crop.x, crop.y, crop.w, crop.h, 0, 0, width, height)
    blob = await new Promise<Blob | null>((resolve) => {
      target.toBlob(resolve, MIME[format.value], format.value === 'png' ? undefined : quality.value / 100)
    })
  }
  catch {
    blob = null
  }
  // Safari rend du PNG quand il ne sait pas encoder le WebP demandé : ce serait un fichier mal nommé
  if (!blob || blob.type !== MIME[format.value]) {
    encodeFailed.value = true
    output.value = null
    return
  }
  if (outputUrl.value) URL.revokeObjectURL(outputUrl.value)
  output.value = { blob, width, height }
  outputUrl.value = URL.createObjectURL(blob)
}

watch([format, quality, outputWidth], scheduleEncode)

// ---- Ce que l'écran annonce ----

function formatSize(bytes: number) {
  const n = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 1 })
  if (bytes < 1024 * 1024) return `${n.format(Math.max(1, Math.round(bytes / 1024)))} Ko`
  return `${n.format(bytes / (1024 * 1024))} Mo`
}

const tooHeavy = computed(() => !!props.maxBytes && !!output.value && output.value.blob.size > props.maxBytes)

/** Le nom suit le format : un `.png` encodé en JPEG serait un piège. */
const outputName = computed(() => {
  const base = props.file.name.replace(/\.[^.]+$/, '') || 'image'
  return `${base}.${EXTENSION[format.value]}`
})

/** Ce qui retient l'envoi, en une phrase ; vide quand rien ne le retient. */
const blockedBecause = computed(() => {
  if (loadFailed.value) return 'Image illisible : choisissez un fichier JPEG, PNG ou WebP.'
  if (encodeFailed.value) return 'Impossible de préparer l\'image : réduisez la largeur ou changez de format.'
  if (tooHeavy.value) return `Image trop lourde (${formatSize(props.maxBytes!)} au plus) : réduisez la largeur ou la qualité.`
  if (!output.value) return 'Préparation de l\'image…'
  return ''
})

const canApply = computed(() => !!output.value && !encoding.value && !blockedBecause.value && !props.busy)

function apply() {
  const result = output.value
  if (!result || !canApply.value) return
  emit('apply', {
    file: new File([result.blob], outputName.value, { type: MIME[format.value] }),
    width: result.width,
    height: result.height,
  })
}
</script>

<template>
  <dialog
    ref="dialog"
    class="m-auto max-h-[94dvh] w-[min(100%-1.5rem,68rem)] overflow-hidden rounded-xl bg-white p-0 text-gray-900 shadow-2xl backdrop:bg-black/60"
    :aria-labelledby="`${id}-title`"
    :aria-describedby="description ? `${id}-description` : undefined"
    @cancel="onDialogCancel"
  >
    <div class="flex max-h-[94dvh] flex-col">
      <header class="flex items-start justify-between gap-4 border-b border-gray-200 px-5 py-4">
        <div class="min-w-0">
          <h2 :id="`${id}-title`" class="text-lg font-semibold">{{ title }}</h2>
          <p v-if="description" :id="`${id}-description`" class="mt-0.5 text-sm text-gray-500">{{ description }}</p>
        </div>
        <button
          type="button"
          :disabled="busy"
          class="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-700 disabled:opacity-40"
          aria-label="Fermer sans enregistrer"
          @click="emit('cancel')"
        >
          <svg class="size-5" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
          </svg>
        </button>
      </header>

      <div class="min-h-0 flex-1 overflow-y-auto px-5 py-4">
        <p v-if="loadFailed" class="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700" role="alert">
          Image illisible : choisissez un fichier JPEG, PNG ou WebP.
        </p>

        <div v-else class="flex flex-col gap-5 lg:flex-row">
          <!-- Cadre de travail : hauteur fixe, pour que la fenêtre ne saute pas d'une image à l'autre -->
          <div class="min-w-0 flex-1">
            <div class="flex flex-wrap gap-1.5" role="group" aria-label="Proportions du recadrage">
              <button
                v-for="option in ratioOptions"
                :key="option.label"
                type="button"
                class="rounded-md border px-2.5 py-1 text-xs font-semibold transition-colors"
                :class="ratio === option.value
                  ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                  : 'border-gray-300 bg-white text-gray-600 hover:bg-gray-50'"
                :aria-pressed="ratio === option.value"
                @click="chooseRatio(option.value)"
              >
                {{ option.label }}
              </button>
            </div>
            <div ref="frame" class="mt-3 h-72 w-full overflow-hidden rounded-lg border border-gray-200 sm:h-[22rem] lg:h-[26rem]">
              <canvas
                ref="canvas"
                class="size-full touch-none outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                tabindex="0"
                role="application"
                aria-label="Zone de recadrage : flèches pour déplacer, Maj + flèches pour redimensionner"
                :style="{ cursor }"
                @pointerdown="onPointerDown"
                @pointermove="onPointerMove"
                @pointerup="onPointerUp"
                @pointercancel="onPointerUp"
                @keydown="onKeyDown"
              />
            </div>
            <p class="mt-2 text-xs text-gray-500">
              Faites glisser le cadre ou ses poignées. Au clavier : flèches pour déplacer, Maj + flèches pour redimensionner.
            </p>
          </div>

          <!-- Réglages : peu, et chacun dit ce qu'il coûte -->
          <div class="w-full space-y-5 lg:w-72 lg:shrink-0">
            <section>
              <h3 class="text-sm font-semibold">Aperçu</h3>
              <div class="mt-2 flex min-h-28 items-center justify-center rounded-lg border border-gray-200 bg-gray-50 p-2">
                <img v-if="outputUrl" :src="outputUrl" alt="Aperçu de l'image recadrée" class="max-h-36 max-w-full rounded">
                <span v-else class="text-xs text-gray-400">{{ encodeFailed ? 'Aucun aperçu' : 'Préparation…' }}</span>
              </div>
            </section>

            <p v-if="keepOriginal" class="rounded-lg border border-sky-200 bg-sky-50 p-3 text-xs text-sky-900">
              Cette image s'agrandit au clic : elle est gardée dans ce format pour l'agrandissement, et une version
              légère pour le web (WebP, 1600 px au plus) est créée automatiquement pour l'affichage en liste.
            </p>

            <section>
              <h3 class="text-sm font-semibold">Format</h3>
              <div class="mt-2 flex gap-2">
                <button
                  v-for="f in FORMATS"
                  :key="f.value"
                  type="button"
                  class="min-h-9 flex-1 rounded-md border px-2 text-xs font-semibold transition-colors"
                  :class="format === f.value
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                    : 'border-gray-300 bg-white text-gray-600 hover:bg-gray-50'"
                  :aria-pressed="format === f.value"
                  @click="format = f.value"
                >
                  {{ f.label }}
                </button>
              </div>
              <p class="mt-1 text-xs text-gray-500">{{ FORMATS.find((f) => f.value === format)?.hint }}</p>
            </section>

            <section v-if="format !== 'png'">
              <div class="flex items-baseline justify-between">
                <label :for="`${id}-quality`" class="text-sm font-semibold">Qualité</label>
                <span class="font-mono text-sm text-gray-600">{{ quality }} %</span>
              </div>
              <input :id="`${id}-quality`" v-model.number="quality" type="range" min="30" max="100" step="1" class="mt-2 w-full accent-emerald-500">
            </section>

            <section>
              <div class="flex items-baseline justify-between">
                <label :for="`${id}-width`" class="text-sm font-semibold">Largeur</label>
                <span class="font-mono text-sm text-gray-600">{{ output ? `${output.width} × ${output.height}` : '—' }}</span>
              </div>
              <input
                :id="`${id}-width`"
                v-model.number="outputWidth"
                type="range"
                :min="minOutputWidth"
                :max="maxOutputWidth"
                step="1"
                class="mt-2 w-full accent-emerald-500"
                @input="widthTouched = true"
              >
              <p class="mt-1 text-xs text-gray-500">
                {{ keepOriginal ? 'Pleine largeur par défaut : c\'est l\'image montrée en grand.' : 'Au-delà de 2000 px, l\'image pèse plus sans se voir mieux.' }}
              </p>
            </section>

            <section class="rounded-lg border border-gray-200 p-3">
              <div class="flex items-baseline justify-between text-sm">
                <span class="font-semibold">Poids</span>
                <span class="font-mono" :class="tooHeavy ? 'text-red-600' : 'text-gray-600'">
                  {{ encoding ? '…' : output ? formatSize(output.blob.size) : '—' }}
                </span>
              </div>
              <p v-if="maxBytes" class="mt-1 text-xs text-gray-500">{{ formatSize(maxBytes) }} au plus.</p>
            </section>
          </div>
        </div>
      </div>

      <footer class="flex flex-wrap items-center justify-end gap-3 border-t border-gray-200 px-5 py-3">
        <p v-if="error" class="me-auto max-w-md text-sm text-red-600" role="alert">{{ error }}</p>
        <p v-else-if="busy && progress !== null" class="me-auto text-sm text-gray-600" aria-live="polite">Envoi… {{ progress }} %</p>
        <p v-else-if="blockedBecause" class="me-auto max-w-md text-sm text-gray-600" aria-live="polite">{{ blockedBecause }}</p>
        <slot name="actions" />
        <button
          type="button"
          :disabled="busy"
          class="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          @click="emit('cancel')"
        >
          {{ cancelLabel }}
        </button>
        <button
          type="button"
          :disabled="!canApply"
          class="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
          @click="apply"
        >
          {{ busy ? 'Envoi…' : applyLabel }}
        </button>
      </footer>
    </div>
  </dialog>
</template>
