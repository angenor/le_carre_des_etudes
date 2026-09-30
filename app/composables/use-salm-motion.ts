/**
 * Animations d'apparition au défilement de la page SALM (le hero, lui, s'anime en CSS : salm.css).
 * Chaque élément déclare son effet dans le gabarit par data-motion="<effet>" ; chaque effet illustre
 * son contenu : badge au bout de son cordon, affiche épinglée, cartes distribuées, photos lancées sur la table…
 * Rien ne bouge si l'appareil demande de réduire les animations (FR-082) : gsap.matchMedia n'exécute
 * alors aucun effet, et annule tout (styles compris) au démontage.
 */

// Chaque effet ne joue qu'une fois, quand son élément entre dans l'écran
const onEnter = (trigger: Element, start = 'top 85%') => ({ trigger, start, once: true })

const random = (min: number, max: number) => () => useGsap.utils.random(min, max)

const EFFECTS: Record<string, (el: HTMLElement) => void> = {
  // Deux cartes qui arrivent chacune de son côté (« Deux façons de participer »)
  duo(el) {
    const [left, right] = el.children
    useGsap.timeline({ scrollTrigger: onEnter(el) })
      .from(left!, { x: -90, rotation: -4, autoAlpha: 0, duration: 0.9, ease: 'back.out(1.3)' })
      .from(right!, { x: 90, rotation: 4, autoAlpha: 0, duration: 0.9, ease: 'back.out(1.3)' }, '<0.12')
  },

  // Étapes numérotées, l'une après l'autre
  steps(el) {
    useGsap.from(el.children, {
      x: -20, autoAlpha: 0, duration: 0.5, ease: 'power2.out', stagger: 0.15, delay: 0.5,
      scrollTrigger: onEnter(el, 'top 90%'),
    })
  },

  // Badge au bout de son cordon : il tombe, se balance, puis oscille doucement
  lanyard(el) {
    if (!el.offsetParent) return // affiché seulement sur grand écran
    useGsap.timeline({ scrollTrigger: onEnter(el, 'top 90%') })
      .from(el, { y: -180, rotation: -28, autoAlpha: 0, transformOrigin: '50% -60px', duration: 1.8, ease: 'elastic.out(1, 0.35)' }, 0.4)
      .to(el, { rotation: -2, duration: 1.1, ease: 'sine.out' })
      .to(el, { rotation: 2, duration: 2.2, ease: 'sine.inOut', yoyo: true, repeat: -1 })
  },

  // Affiche qu'on vient d'épingler : elle se balance depuis son bord haut
  pin(el) {
    useGsap.from(el, {
      rotation: -9, y: -24, autoAlpha: 0, transformOrigin: '50% 0%', duration: 1.6, ease: 'elastic.out(1, 0.45)',
      scrollTrigger: onEnter(el),
    })
  },

  // Cartes distribuées une à une (temps forts du programme)
  deal(el) {
    useGsap.from(el.children, {
      y: 90, rotation: random(-10, 10), scale: 0.9, autoAlpha: 0, duration: 0.8, ease: 'back.out(1.6)', stagger: 0.1,
      scrollTrigger: onEnter(el),
    })
  },

  // Chronogramme : les créneaux arrivent heure après heure, puis le créneau mis en avant s'illumine.
  // Déclenché par la grille entière : sur mobile, le jour masqué par les onglets s'anime avec les autres.
  hours(el) {
    const glows = el.querySelectorAll('[data-glow]')
    const tl = useGsap.timeline({ scrollTrigger: onEnter(el, 'top 80%') })
      .from(el.querySelectorAll('li'), { x: -24, autoAlpha: 0, duration: 0.5, ease: 'power2.out', stagger: 0.06 })
    if (glows.length) {
      tl.fromTo(glows,
        { boxShadow: '0 0 0 0 rgb(251 191 36 / 0)' },
        { boxShadow: '0 0 0 6px rgb(251 191 36 / 0.28)', duration: 0.45, ease: 'sine.inOut', yoyo: true, repeat: 3, clearProps: 'boxShadow' },
      )
    }
  },

  // Vignettes qui surgissent (vidéos du canapé)
  pop(el) {
    useGsap.from(el.children, {
      y: 40, scale: 0.85, autoAlpha: 0, duration: 0.7, ease: 'back.out(1.8)', stagger: 0.08,
      scrollTrigger: onEnter(el),
    })
  },

  // Photos lancées en vrac sur la table, qui retombent droites
  toss(el) {
    useGsap.from(el.children, {
      y: -60, rotation: random(-16, 16), scale: 1.25, autoAlpha: 0, duration: 0.75, ease: 'back.out(1.4)',
      stagger: { each: 0.07, from: 'random' },
      scrollTrigger: onEnter(el),
    })
  },

  rise(el) {
    useGsap.from(el, { y: 36, autoAlpha: 0, duration: 0.8, ease: 'power3.out', scrollTrigger: onEnter(el) })
  },

  // Bouton d'appel final : il arrive, puis frétille pour attirer l'œil
  wiggle(el) {
    useGsap.timeline({ scrollTrigger: onEnter(el, 'top 92%') })
      .from(el, { scale: 0.85, autoAlpha: 0, duration: 0.5, ease: 'back.out(2)' }, 0.3)
      .to(el, { keyframes: { rotation: [0, -4, 4, -3, 2, 0] }, duration: 0.7, ease: 'none' }, '+=0.15')
  },
}

export function useSalmMotion(root: Ref<HTMLElement | null>) {
  let mm: ReturnType<typeof useGsap.matchMedia> | undefined
  // La page arrive décalée par sa transition d'entrée : positions des déclencheurs recalculées à la fin
  const offTransition = useNuxtApp().hook('page:transition:finish', () => useScrollTrigger.refresh())

  onMounted(() => {
    if (!root.value) return
    mm = useGsap.matchMedia()
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      root.value?.querySelectorAll<HTMLElement>('[data-motion]').forEach((el) => {
        EFFECTS[el.dataset.motion ?? '']?.(el)
      })
      requestAnimationFrame(() => useScrollTrigger.refresh())
    })
  })

  onBeforeUnmount(() => {
    offTransition()
    mm?.revert()
  })
}

const CONFETTI_COLORS = ['#D5570B', '#F4792B', '#FBBF24', 'var(--salm-ink)', '#9A3A06'] // var(--salm-ink) : crème en sombre, encre en clair (visible sur les deux fonds)

/**
 * Pluie de confettis aux couleurs du SALM, lancée depuis le centre de `origin` (badge obtenu).
 * Calque fixe et décoratif, retiré du DOM à la fin. Rien si l'appareil demande de réduire les animations.
 */
export function launchSalmConfetti(origin: HTMLElement | null | undefined, count = 70) {
  if (!origin || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
  const { random } = useGsap.utils
  const box = origin.getBoundingClientRect()
  const layer = document.createElement('div')
  layer.setAttribute('aria-hidden', 'true')
  Object.assign(layer.style, { position: 'fixed', inset: '0', pointerEvents: 'none', zIndex: '60', overflow: 'hidden' })
  document.body.appendChild(layer)

  const all = useGsap.timeline({ onComplete: () => layer.remove() })
  for (let i = 0; i < count; i++) {
    const piece = document.createElement('span')
    const width = random(6, 11)
    Object.assign(piece.style, {
      position: 'absolute',
      left: `${box.left + box.width / 2}px`,
      top: `${box.top + box.height / 2}px`,
      width: `${width}px`,
      height: `${width * random(0.4, 1.6)}px`,
      background: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      borderRadius: i % 3 === 0 ? '50%' : '2px',
    })
    layer.appendChild(piece)
    // Éclatement vers le haut, puis chute en tournoyant
    const angle = random(-Math.PI * 0.95, -Math.PI * 0.05)
    const speed = random(220, 520)
    all.add(useGsap.timeline()
      .to(piece, { x: Math.cos(angle) * speed, y: Math.sin(angle) * speed, rotation: random(-540, 540), duration: random(0.5, 0.8), ease: 'power2.out' })
      .to(piece, { y: `+=${random(320, 620)}`, x: `+=${random(-60, 60)}`, rotation: `+=${random(-360, 360)}`, opacity: 0, duration: random(1.2, 1.9), ease: 'power1.in' }), 0)
  }
}
