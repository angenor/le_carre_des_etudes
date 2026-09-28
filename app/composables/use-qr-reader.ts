// Lecture continue de QR codes par la caméra arrière (specs/008, R1 bis, R2).
// Moteur : `BarcodeDetector` natif s'il lit les QR codes, sinon `jsqr` chargé à la demande (iPhone).

export type QrReaderError = 'denied' | 'missing' | 'busy' | 'unsupported'

interface NativeDetector {
  detect(source: CanvasImageSource): Promise<{ rawValue: string }[]>
}

interface NativeDetectorClass {
  new (options: { formats: string[] }): NativeDetector
  getSupportedFormats(): Promise<string[]>
}

type JsQr = typeof import('jsqr').default

const FRAME_INTERVAL_MS = 125 // ~8 images par seconde
const MAX_CROP = 640

let jsQrPromise: Promise<JsQr> | null = null

/** Charge le morceau `jsqr` (mis en cache par le service worker pour le hors ligne). */
export function loadJsQr(): Promise<JsQr> {
  jsQrPromise ??= import('jsqr').then((m) => m.default).catch((error) => {
    jsQrPromise = null
    throw error
  })
  return jsQrPromise
}

/** Moteur de lecture prêt pour le hors ligne : natif, sinon morceau `jsqr` chargé (et mis en cache). */
export async function preloadQrEngine(): Promise<void> {
  const Native = (globalThis as { BarcodeDetector?: NativeDetectorClass }).BarcodeDetector
  try {
    if (Native && (await Native.getSupportedFormats()).includes('qr_code')) return
  }
  catch {
    // repli sur jsqr
  }
  await loadJsQr()
}

function cameraError(error: unknown): QrReaderError {
  const name = (error as { name?: string })?.name
  if (name === 'NotAllowedError' || name === 'SecurityError') return 'denied'
  if (name === 'NotFoundError' || name === 'OverconstrainedError') return 'missing'
  if (name === 'NotReadableError' || name === 'AbortError') return 'busy'
  return 'unsupported'
}

export function useQrReader(onRead: (text: string) => void) {
  const error = ref<QrReaderError | null>(null)
  const active = ref(false)
  const starting = ref(false)
  const engine = ref<'native' | 'jsqr' | null>(null)

  let video: HTMLVideoElement | null = null
  let stream: MediaStream | null = null
  let detector: NativeDetector | null = null
  let jsQr: JsQr | null = null
  let canvas: HTMLCanvasElement | null = null
  let context: CanvasRenderingContext2D | null = null
  let frameHandle: number | null = null
  let lastFrameAt = 0
  let decoding = false
  let paused = false
  // La caméra a été démarrée par l'utilisateur : elle reprend seule au retour de veille (FR-214)
  let wanted = false

  async function ensureEngine() {
    if (engine.value) return
    const Native = (globalThis as { BarcodeDetector?: NativeDetectorClass }).BarcodeDetector
    if (Native) {
      try {
        if ((await Native.getSupportedFormats()).includes('qr_code')) {
          detector = new Native({ formats: ['qr_code'] })
          engine.value = 'native'
          return
        }
      }
      catch {
        // repli sur jsqr
      }
    }
    jsQr = await loadJsQr()
    engine.value = 'jsqr'
  }

  function cancelFrame() {
    if (frameHandle === null || !video) return
    if ('cancelVideoFrameCallback' in video) video.cancelVideoFrameCallback(frameHandle)
    else cancelAnimationFrame(frameHandle)
    frameHandle = null
  }

  function scheduleFrame() {
    if (!video || !stream) return
    frameHandle = 'requestVideoFrameCallback' in video
      ? video.requestVideoFrameCallback(onFrame)
      : requestAnimationFrame(onFrame)
  }

  async function decode(v: HTMLVideoElement): Promise<string | null> {
    if (detector) return (await detector.detect(v))[0]?.rawValue ?? null
    if (!jsQr || !v.videoWidth) return null
    // Carré central, réduit à 640 px au plus : suffisant pour un badge présenté dans le cadre
    const side = Math.min(v.videoWidth, v.videoHeight)
    const size = Math.min(side, MAX_CROP)
    canvas ??= document.createElement('canvas')
    if (canvas.width !== size) {
      canvas.width = size
      canvas.height = size
      context = canvas.getContext('2d', { willReadFrequently: true })
    }
    if (!context) return null
    context.drawImage(v, (v.videoWidth - side) / 2, (v.videoHeight - side) / 2, side, side, 0, 0, size, size)
    const image = context.getImageData(0, 0, size, size)
    return jsQr(image.data, size, size, { inversionAttempts: 'dontInvert' })?.data ?? null
  }

  async function onFrame() {
    frameHandle = null
    const v = video
    if (!v || !stream) return
    const now = performance.now()
    if (!paused && !decoding && now - lastFrameAt >= FRAME_INTERVAL_MS && v.readyState >= 2) {
      lastFrameAt = now
      decoding = true
      try {
        const text = await decode(v)
        if (text && !paused) onRead(text)
      }
      catch {
        // image illisible : on passe à la suivante
      }
      finally {
        decoding = false
      }
    }
    scheduleFrame()
  }

  function stopStream() {
    cancelFrame()
    stream?.getTracks().forEach((t) => t.stop())
    stream = null
    if (video) video.srcObject = null
    active.value = false
  }

  async function openStream(): Promise<boolean> {
    if (!video) return false
    if (!navigator.mediaDevices?.getUserMedia) {
      error.value = 'unsupported'
      return false
    }
    starting.value = true
    try {
      await ensureEngine()
      stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      })
      // Onglet masqué pendant la demande d'autorisation
      if (!wanted || document.visibilityState === 'hidden') {
        stopStream()
        return false
      }
      video.srcObject = stream
      await video.play().catch(() => {})
      error.value = null
      active.value = true
      scheduleFrame()
      return true
    }
    catch (e) {
      stopStream()
      error.value = cameraError(e)
      wanted = false
      return false
    }
    finally {
      starting.value = false
    }
  }

  function onVisibility() {
    if (document.visibilityState === 'hidden') stopStream()
    else if (wanted && !stream) openStream()
  }

  /** Démarre la caméra dans `el` (à appeler depuis un geste de l'utilisateur la première fois). */
  async function start(el: HTMLVideoElement): Promise<boolean> {
    video = el
    wanted = true
    if (stream) return true
    document.addEventListener('visibilitychange', onVisibility)
    return openStream()
  }

  function stop() {
    wanted = false
    document.removeEventListener('visibilitychange', onVisibility)
    stopStream()
  }

  /** Suspend le décodage sans couper la vidéo (panneau de saisie ouvert). */
  function setPaused(value: boolean) {
    paused = value
  }

  onBeforeUnmount(stop)

  return { error, active, starting, engine, start, stop, setPaused, ensureEngine }
}
