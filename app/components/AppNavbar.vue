<script setup lang="ts">
const route = useRoute()

const { data: salmStatus } = await useSalmStatus()

// Deux volets : le magazine (menu) et le SALM (lien direct). « Résultats » n'est plus dans la barre,
// mais /resultats reste en ligne : le lien a déjà été partagé.
// Icônes (Heroicons, contour) : livre ouvert, journal, groupe
const magazineLinks = [
  { label: 'Les numéros', description: 'Lire et télécharger le magazine', to: '/magazine', icon: 'M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25' },
  { label: 'Les rubriques', description: 'Parcours, focus, agenda et opportunités', to: '/rubriques', icon: 'M12 7.5h1.5m-1.5 3h1.5m-7.5 3h7.5m-7.5 3h7.5m3-9h3.375c.621 0 1.125.504 1.125 1.125V18a2.25 2.25 0 0 1-2.25 2.25M16.5 7.5V18a2.25 2.25 0 0 0 2.25 2.25M16.5 7.5V4.875c0-.621-.504-1.125-1.125-1.125H4.125C3.504 3.75 3 4.254 3 4.875V18a2.25 2.25 0 0 0 2.25 2.25h13.5M6 7.5h3v3H6v-3Z' },
  { label: 'Nos partenaires', description: 'Ils soutiennent le magazine', to: '/partenaires', icon: 'M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z' },
]

// Panneau image du menu : le numéro à la une (même source que la section « À la une » de l'accueil)
interface FeaturedMagazine {
  id: number
  name: string
  version: string
  subtitle: string | null
  coverImage: string | null
}
const { data: featured } = useFetch<FeaturedMagazine | null>('/api/magazines/featured')

function isActive(to: string): boolean {
  if (to === '/') {
    return route.path === '/'
  }
  return route.path.startsWith(to)
}

const magazineActive = computed(() => magazineLinks.some((link) => isActive(link.to)))

// Mode clair du magazine « Édition jaune » : barre en style kiosque (main.css, classe `mag-nav`), hors pages SALM
const salmPage = computed(() => route.path === '/salm' || route.path.startsWith('/salm/'))

// Menu « Le Magazine » : ouverture au survol de la souris (délai de fermeture pour rejoindre le panneau),
// au clic ou au toucher sinon ; fermeture par Échap, clic à l'extérieur, sortie du focus ou changement de page
const menuId = useId()
const menuOpen = ref(false)
const menuRef = ref<HTMLElement>()
const buttonRef = ref<HTMLButtonElement>()

let hoverCloseTimer: ReturnType<typeof setTimeout> | null = null

function cancelHoverClose() {
  if (hoverCloseTimer) clearTimeout(hoverCloseTimer)
  hoverCloseTimer = null
}

function onMenuPointerEnter(event: PointerEvent) {
  if (event.pointerType !== 'mouse') return
  cancelHoverClose()
  menuOpen.value = true
}

function onMenuPointerLeave(event: PointerEvent) {
  if (event.pointerType !== 'mouse') return
  cancelHoverClose()
  hoverCloseTimer = setTimeout(() => closeMenu(), 200)
}

// À la souris, le survol a déjà ouvert le menu : le clic le laisse ouvert. Au clavier ou au toucher, il bascule.
function onMenuButtonClick(event: MouseEvent) {
  const pointerType = (event as PointerEvent).pointerType
  menuOpen.value = pointerType === 'mouse' ? true : !menuOpen.value
}

function closeMenu({ focusButton = false } = {}) {
  cancelHoverClose()
  if (!menuOpen.value) return
  menuOpen.value = false
  if (focusButton) buttonRef.value?.focus()
}

function onDocumentPointerDown(event: PointerEvent) {
  if (menuRef.value && !menuRef.value.contains(event.target as Node)) closeMenu()
}

function onMenuKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    event.preventDefault()
    closeMenu({ focusButton: true })
  }
}

function onMenuFocusOut(event: FocusEvent) {
  const next = event.relatedTarget as Node | null
  if (next && !menuRef.value?.contains(next)) closeMenu()
}

// Téléphone : le panneau se centre dans l'écran. La pilule, floutée, sert de repère aux positions (le flou
// empêche un placement par rapport à l'écran) : on mesure son bord gauche à l'ouverture.
const dropdownStyle = ref<Record<string, string>>({})

function placeDropdown() {
  if (window.innerWidth >= 768) {
    dropdownStyle.value = {}
    return
  }
  const wrapper = menuRef.value?.closest('.nav-wrapper')
  if (!wrapper) return
  const width = Math.min(352, window.innerWidth - 32)
  const left = (window.innerWidth - width) / 2 - wrapper.getBoundingClientRect().left
  dropdownStyle.value = { left: `${Math.round(left)}px`, width: `${width}px` }
}

watch(menuOpen, (open) => {
  if (open) {
    placeDropdown()
    document.addEventListener('pointerdown', onDocumentPointerDown)
  }
  else document.removeEventListener('pointerdown', onDocumentPointerDown)
})
watch(() => route.path, () => closeMenu())
onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', onDocumentPointerDown)
  cancelHoverClose()
})

// Bouton clair / sombre masqué pour l'instant : le site est imposé en sombre (colorMode de nuxt.config.ts).
// Passer à true, avec la configuration indiquée dans nuxt.config.ts, pour le réafficher.
const THEME_TOGGLE = false

// Clair / sombre (@nuxtjs/color-mode) : réglage du visiteur au premier affichage, puis son choix, mémorisé.
// Mode sombre : soleil, pour passer en clair ; mode clair : lune, pour revenir au sombre.
const colorMode = useColorMode()
// Le serveur ne connaît pas le thème du visiteur : l'icône suit le thème une fois la page montée,
// sinon le rendu serveur et le premier rendu du navigateur divergeraient.
const mounted = ref(false)
onMounted(() => { mounted.value = true })
const lightMode = computed(() => mounted.value && colorMode.value === 'light')
const themeLabel = computed(() => (lightMode.value ? 'Passer en mode sombre' : 'Passer en mode clair'))

function toggleTheme() {
  colorMode.preference = lightMode.value ? 'dark' : 'light'
}
</script>

<template>
  <nav class="site-nav fixed inset-x-0 top-4 z-50 flex items-center justify-center gap-1.5 px-4" :class="{ 'mag-nav': !salmPage }" aria-label="Navigation principale">
    <div class="nav-wrapper rounded-full border border-accent/20 bg-surface/60 backdrop-blur-xl">
      <div class="nav-links">
        <NuxtLink to="/" class="nav-link" :class="{ 'is-active': isActive('/') }">
          Accueil
        </NuxtLink>

        <div ref="menuRef" class="nav-menu" @keydown="onMenuKeydown" @focusout="onMenuFocusOut" @pointerenter="onMenuPointerEnter" @pointerleave="onMenuPointerLeave">
          <button
            ref="buttonRef"
            type="button"
            class="nav-link nav-menu-button"
            :class="{ 'is-active': magazineActive }"
            :aria-expanded="menuOpen ? 'true' : 'false'"
            :aria-controls="menuId"
            @click="onMenuButtonClick"
          >
            Le Magazine
            <svg class="nav-chevron" :class="{ 'is-open': menuOpen }" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fill-rule="evenodd" d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z" clip-rule="evenodd" />
            </svg>
          </button>

          <Transition name="nav-dropdown">
            <div v-show="menuOpen" :id="menuId" class="nav-dropdown" :style="dropdownStyle">
              <!-- À gauche : le numéro à la une, couverture sur voile sombre -->
              <NuxtLink
                v-if="featured"
                :to="`/magazine/${featured.id}`"
                class="nav-feature"
                @click="closeMenu()"
              >
                <img v-if="featured.coverImage" :src="featured.coverImage" alt="" class="nav-feature-image" loading="lazy">
                <span class="nav-feature-shade" aria-hidden="true" />
                <span class="nav-feature-body">
                  <span class="nav-feature-badge">Dernier numéro · {{ featured.version }}</span>
                  <span class="nav-feature-title">{{ featured.name }}</span>
                  <span v-if="featured.subtitle" class="nav-feature-text">{{ featured.subtitle }}</span>
                  <span class="nav-feature-cta">Découvrir le numéro <span aria-hidden="true">→</span></span>
                </span>
              </NuxtLink>

              <!-- À droite : les pages du magazine -->
              <ul class="nav-dropdown-list">
                <li v-for="link in magazineLinks" :key="link.to">
                  <NuxtLink
                    :to="link.to"
                    class="nav-dropdown-link"
                    :class="{ 'is-current': isActive(link.to) }"
                    @click="closeMenu()"
                  >
                    <span class="nav-dropdown-icon" aria-hidden="true">
                      <svg fill="none" viewBox="0 0 24 24" stroke-width="1.6" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" :d="link.icon" /></svg>
                    </span>
                    <span class="nav-dropdown-text">
                      <span class="nav-dropdown-label">{{ link.label }}</span>
                      <span class="nav-dropdown-description">{{ link.description }}</span>
                    </span>
                  </NuxtLink>
                </li>
              </ul>
            </div>
          </Transition>
        </div>

        <!-- Lien SALM seulement si une édition est publiée (FR-018) -->
        <NuxtLink
          v-if="salmStatus?.published"
          to="/salm"
          class="nav-link"
          :class="{ 'is-active': isActive('/salm') }"
        >
          SALM {{ salmStatus.year }}
        </NuxtLink>
      </div>
    </div>

    <!-- Bouton clair / sombre, hors de la pilule : ensemble, ils dessinent un « i » couché -->
    <button
      v-if="THEME_TOGGLE"
      type="button"
      class="theme-toggle rounded-full border border-accent/20 bg-surface/60 backdrop-blur-xl"
      :aria-label="themeLabel"
      :title="themeLabel"
      @click="toggleTheme"
    >
      <Transition name="theme-icon" mode="out-in">
        <svg v-if="lightMode" key="moon" class="theme-toggle-icon" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z" />
        </svg>
        <svg v-else key="sun" class="theme-toggle-icon" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z" />
        </svg>
      </Transition>
    </button>
  </nav>
</template>

<style scoped>
/* Couleurs de la barre : en sombre, les valeurs d'origine exactes ; en clair, les jetons du site */
.site-nav {
  --nav-accent: rgb(251 191 36); /* ambre */
  --nav-surface: rgb(17 24 39); /* gris 900 */
  --nav-muted: rgb(156 163 175); /* gris 400 */
}

.light .site-nav {
  --nav-accent: var(--site-accent);
  --nav-surface: var(--site-surface);
  --nav-muted: var(--site-ink-muted);
}

.nav-wrapper {
  --nav-indicator-hover: color-mix(in srgb, var(--nav-accent) 15%, transparent);
  --nav-indicator-active: rgb(251 191 36); /* aplat ambre, le même dans les deux modes */
  --nav-padding: 0.375rem;
  --nav-trans-duration: 700ms;
  --nav-trans-easing: linear(0, 1 44.7%, 0.898 51.8%, 0.874 55.1%, 0.866 58.4%, 0.888 64.3%, 1 77.4%, 0.98 84.5%, 1);

  position: relative;
  isolation: isolate;
  width: fit-content;
  padding: var(--nav-padding);
}

.nav-links {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.nav-link {
  display: block;
  border-radius: 999vw;
  padding: 0.375rem 0.75rem;
  font-size: 0.75rem;
  font-weight: 500;
  line-height: 1rem;
  color: color-mix(in srgb, var(--site-ink) 80%, transparent);
  text-decoration: none;
  transition: color 150ms ease-in-out;
}

/* Sous 640 px : si la pilule ne tient pas sur une ligne, elle passe sur deux plutôt que de déborder
   (FR-018 : tous les liens visibles, texte ≥ 12 px, cible ≥ 24 px, pas de défilement horizontal) */
@media (max-width: 639px) {
  .nav-wrapper {
    --nav-padding: 0.25rem;
    max-width: 100%;
    border-radius: 1.25rem;
  }

  .nav-links {
    flex-wrap: wrap;
    justify-content: center;
    gap: 0.125rem 0;
  }

  .nav-link {
    padding: 0.375rem 0.625rem;
    white-space: nowrap;
  }
}

@media (min-width: 640px) {
  .nav-link {
    padding-inline: 1rem;
    font-size: 0.875rem;
    line-height: 1.25rem;
  }
}

/* Bouton clair / sombre : un rond de la hauteur exacte de la pilule
   (padding de la pilule + padding et hauteur de ligne d'un lien + bordures) */
.theme-toggle {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: calc(2.75rem + 2px);
  height: calc(2.75rem + 2px);
  color: color-mix(in srgb, var(--site-ink) 80%, transparent);
  cursor: pointer;
  transition: color 150ms ease-in-out, background-color 150ms ease-in-out;
}

.theme-toggle:hover {
  background-color: color-mix(in srgb, var(--nav-accent) 15%, transparent);
  color: var(--nav-accent);
}

.theme-toggle:focus-visible {
  outline: 2px solid var(--nav-accent);
  outline-offset: 2px;
}

.theme-toggle-icon {
  width: 1.25rem;
  height: 1.25rem;
}

/* Changement d'icône : quart de tour et fondu */
.theme-icon-enter-active,
.theme-icon-leave-active {
  transition: opacity 150ms ease, transform 150ms ease;
}

.theme-icon-enter-from {
  opacity: 0;
  transform: rotate(-90deg) scale(0.6);
}

.theme-icon-leave-to {
  opacity: 0;
  transform: rotate(90deg) scale(0.6);
}

@media (prefers-reduced-motion: reduce) {
  .theme-icon-enter-active,
  .theme-icon-leave-active {
    transition: none;
  }
}

@media (max-width: 639px) {
  .theme-toggle {
    width: calc(2.25rem + 2px);
    height: calc(2.25rem + 2px);
  }

  .theme-toggle-icon {
    width: 1rem;
    height: 1rem;
  }
}

/* Bouton du menu « Le Magazine » */
.nav-menu {
  position: relative;
}

.nav-menu-button {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  border: 0;
  background: transparent;
  cursor: pointer;
  font: inherit;
  font-size: 0.75rem;
  font-weight: 500;
  line-height: 1rem;
}

@media (min-width: 640px) {
  .nav-menu-button {
    font-size: 0.875rem;
    line-height: 1.25rem;
  }
}

.nav-chevron {
  width: 1rem;
  height: 1rem;
  transition: transform 200ms ease;
}

.nav-chevron.is-open {
  transform: rotate(180deg);
}

/* Menu déroulant : panneau image (numéro à la une) à gauche, pages du magazine à droite */
.nav-dropdown {
  position: absolute;
  top: calc(100% + 0.75rem);
  left: 50%;
  translate: -50% 0;
  display: flex;
  width: 36rem;
  max-width: calc(100vw - 2rem);
  overflow: hidden;
  border: 1px solid color-mix(in srgb, var(--nav-accent) 20%, transparent);
  border-radius: 1.25rem;
  background: var(--nav-surface); /* opaque : le titre de la page ne doit pas transparaître */
  box-shadow: 0 24px 48px -12px rgb(0 0 0 / 0.6);
}

/* Pont invisible au-dessus du panneau : la souris le rejoint sans que le menu se ferme */
.nav-dropdown::before {
  content: '';
  position: absolute;
  inset: -0.85rem 0 auto;
  height: 0.85rem;
}

/* Sur fond clair, une ombre noire marquée ferait tache : ombre chaude et légère */
.light .nav-dropdown {
  box-shadow: 0 24px 48px -18px rgb(120 53 15 / 0.3);
}

.nav-feature {
  position: relative;
  display: flex;
  flex-shrink: 0;
  width: 13.5rem;
  min-height: 17rem;
  overflow: hidden;
  text-decoration: none;
}

.nav-feature-image {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: top;
  transition: scale 500ms ease;
}

.nav-feature:hover .nav-feature-image {
  scale: 1.05;
}

.nav-feature-shade {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgb(17 24 39 / 0.15) 0%, rgb(17 24 39 / 0.55) 45%, rgb(17 24 39 / 0.94) 100%);
}

.nav-feature-body {
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  gap: 0.375rem;
  padding: 1.125rem;
  color: rgb(255 255 255);
}

.nav-feature-badge {
  align-self: flex-start;
  border: 1px solid rgb(255 255 255 / 0.2);
  border-radius: 999px;
  padding: 0.2rem 0.6rem;
  background: rgb(255 255 255 / 0.15);
  font-size: 0.6875rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  backdrop-filter: blur(6px);
}

.nav-feature-title {
  font-size: 1.0625rem;
  font-weight: 800;
  line-height: 1.2;
}

.nav-feature-text {
  font-size: 0.75rem;
  line-height: 1.45;
  color: rgb(255 255 255 / 0.8);
}

.nav-feature-cta {
  margin-top: 0.25rem;
  font-size: 0.8125rem;
  font-weight: 700;
  color: rgb(251 191 36); /* ambre, lisible sur le voile sombre dans les deux modes */
}

.nav-dropdown-list {
  display: flex;
  flex: 1;
  flex-direction: column;
  justify-content: center;
  gap: 0.25rem;
  margin: 0;
  padding: 0.75rem;
  list-style: none;
}

.nav-dropdown-link {
  display: flex;
  align-items: center;
  gap: 0.875rem;
  border-radius: 0.875rem;
  padding: 0.75rem;
  text-decoration: none;
  transition: background-color 150ms ease-in-out;
}

.nav-dropdown-link:hover,
.nav-dropdown-link:focus-visible {
  background-color: color-mix(in srgb, var(--nav-accent) 10%, transparent);
}

.nav-dropdown-link:focus-visible {
  outline: 2px solid var(--nav-accent);
  outline-offset: -2px;
}

.nav-dropdown-icon {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 0.75rem;
  background: color-mix(in srgb, var(--nav-accent) 12%, transparent);
  color: var(--nav-accent);
  transition: background-color 150ms ease-in-out, color 150ms ease-in-out;
}

.nav-dropdown-icon svg {
  width: 1.25rem;
  height: 1.25rem;
}

.nav-dropdown-link:hover .nav-dropdown-icon {
  background: var(--nav-accent);
  color: var(--nav-surface);
}

.nav-dropdown-text {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
  min-width: 0;
}

.nav-dropdown-label {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--site-ink);
}

.nav-dropdown-link.is-current .nav-dropdown-label {
  color: var(--nav-accent);
}

.nav-dropdown-description {
  font-size: 0.75rem;
  color: var(--nav-muted);
}

/* Téléphone et petite tablette : pas de panneau image, faute de place ; le menu se centre dans l'écran
   (position calculée à l'ouverture, placeDropdown) au lieu de se centrer sous le bouton, décentré */
@media (max-width: 767px) {
  .nav-menu {
    position: static;
  }

  .nav-dropdown {
    left: 0;
    translate: 0 0;
    width: min(22rem, calc(100vw - 2rem));
  }

  .nav-feature {
    display: none;
  }
}

.nav-dropdown-enter-active,
.nav-dropdown-leave-active {
  transition: opacity 150ms ease, transform 150ms ease;
}

.nav-dropdown-enter-from,
.nav-dropdown-leave-to {
  opacity: 0;
  transform: translateY(-0.25rem);
}

@media (prefers-reduced-motion: reduce) {
  .nav-chevron,
  .nav-dropdown-enter-active,
  .nav-dropdown-leave-active {
    transition: none;
  }
}

/* Repli : navigateurs sans « anchor positioning » (Firefox, anciens Safari) */
.nav-link:hover {
  background-color: var(--nav-indicator-hover);
  color: var(--nav-accent);
}

.nav-link.is-active {
  background-color: var(--nav-indicator-active);
  color: rgb(17 24 39); /* gray-900 */
}

/* Indicateur glissant animé via CSS anchor positioning */
@supports (anchor-name: --a) and (top: anchor(top)) {
  .nav-wrapper::before,
  .nav-wrapper::after {
    content: '';
    position: absolute;
    top: anchor(top);
    left: anchor(left);
    right: anchor(right);
    bottom: anchor(bottom);
    z-index: -1;
    border-radius: 999vw;
    background: var(--nav-indicator-hover);
    transition: var(--nav-trans-duration) var(--nav-trans-easing);
    pointer-events: none;
  }

  .nav-wrapper::before {
    position-anchor: --hovered-option;
  }

  .nav-wrapper::after {
    background: var(--nav-indicator-active);
    position-anchor: --active-option;
  }

  .nav-links {
    anchor-name: --hovered-option;
  }

  .nav-link:hover {
    anchor-name: --hovered-option;
    background-color: transparent;
    color: var(--site-ink);
  }

  .nav-link.is-active {
    anchor-name: --active-option;
    background-color: transparent;
    color: rgb(17 24 39);
  }

  .nav-link.is-active:hover {
    color: rgb(17 24 39);
  }
}
</style>
