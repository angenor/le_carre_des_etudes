// Retours non visuels du poste de contrôle (specs/008, R11) : vibration, bip, écran maintenu allumé.

export type ControlFeedbackKind = 'entered' | 'already' | 'refused' | 'neutral'

const VIBRATIONS: Record<ControlFeedbackKind, number[]> = {
  entered: [80],
  already: [80, 80, 80],
  refused: [400],
  neutral: [],
}

// Trois fréquences distinctes ; pas de son pour un résultat non vérifié
const FREQUENCIES: Partial<Record<ControlFeedbackKind, number>> = {
  entered: 1046,
  already: 660,
  refused: 220,
}

interface WakeLockSentinelLike {
  release(): Promise<void>
}

export function useControlFeedback() {
  const sound = ref(true)
  const wakeLockSupported = ref(false)

  let audio: AudioContext | null = null
  let wakeLock: WakeLockSentinelLike | null = null
  let keepingAwake = false

  onMounted(() => {
    sound.value = readControlPrefs().sound
    wakeLockSupported.value = 'wakeLock' in navigator
  })

  /** Crée ou relance le contexte audio : à appeler dans un geste de l'utilisateur (lecture automatique). */
  function unlockAudio() {
    try {
      const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
      if (!Ctx) return
      audio ??= new Ctx()
      if (audio.state === 'suspended') audio.resume().catch(() => {})
    }
    catch {
      audio = null
    }
  }

  function setSound(value: boolean) {
    sound.value = value
    writeControlPrefs({ ...readControlPrefs(), sound: value })
    if (value) unlockAudio()
  }

  function vibrate(kind: ControlFeedbackKind) {
    const pattern = VIBRATIONS[kind]
    if (pattern.length && typeof navigator.vibrate === 'function') navigator.vibrate(pattern)
  }

  function beep(kind: ControlFeedbackKind) {
    const frequency = FREQUENCIES[kind]
    if (!sound.value || !audio || !frequency || audio.state !== 'running') return
    const oscillator = audio.createOscillator()
    const gain = audio.createGain()
    oscillator.type = 'square'
    oscillator.frequency.value = frequency
    gain.gain.value = 0.15
    oscillator.connect(gain).connect(audio.destination)
    oscillator.start()
    oscillator.stop(audio.currentTime + 0.15)
  }

  function feedback(kind: ControlFeedbackKind) {
    vibrate(kind)
    beep(kind)
  }

  async function requestWakeLock() {
    if (!keepingAwake || document.visibilityState !== 'visible' || !('wakeLock' in navigator)) return
    try {
      wakeLock = await (navigator as unknown as { wakeLock: { request(type: 'screen'): Promise<WakeLockSentinelLike> } })
        .wakeLock.request('screen')
    }
    catch {
      wakeLock = null
    }
  }

  function onVisibility() {
    // Le verrou est relâché par le navigateur quand la page est masquée : le redemander au retour
    if (document.visibilityState === 'visible') requestWakeLock()
  }

  /** Maintient l'écran allumé tant que la page est visible (FR-214), sans erreur si l'API manque. */
  function keepAwake() {
    if (keepingAwake) return
    keepingAwake = true
    document.addEventListener('visibilitychange', onVisibility)
    requestWakeLock()
  }

  function releaseAwake() {
    keepingAwake = false
    document.removeEventListener('visibilitychange', onVisibility)
    wakeLock?.release().catch(() => {})
    wakeLock = null
  }

  onBeforeUnmount(() => {
    releaseAwake()
    audio?.close().catch(() => {})
    audio = null
  })

  return { sound, setSound, wakeLockSupported, unlockAudio, vibrate, beep, feedback, keepAwake, releaseAwake }
}
