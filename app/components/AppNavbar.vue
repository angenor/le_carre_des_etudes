<script setup lang="ts">
const route = useRoute()

const { data: salmStatus } = await useSalmStatus()

// Deux volets : le magazine (menu) et le SALM (lien direct). « Résultats » n'est plus dans la barre,
// mais /resultats reste en ligne : le lien a déjà été partagé.
const magazineLinks = [
  { label: 'Les numéros', description: 'Lire et télécharger le magazine', to: '/magazine' },
  { label: 'Les rubriques', description: 'Parcours, focus, agenda et opportunités', to: '/rubriques' },
  { label: 'Nos partenaires', description: 'Ils soutiennent le magazine', to: '/partenaires' },
]

function isActive(to: string): boolean {
  if (to === '/') {
    return route.path === '/'
  }
  return route.path.startsWith(to)
}

const magazineActive = computed(() => magazineLinks.some((link) => isActive(link.to)))

// Menu « Le Magazine » : ouverture au clic (pas au survol, absent sur téléphone), fermeture par Échap,
// clic à l'extérieur, sortie du focus ou changement de page
const menuId = useId()
const menuOpen = ref(false)
const menuRef = ref<HTMLElement>()
const buttonRef = ref<HTMLButtonElement>()

function closeMenu({ focusButton = false } = {}) {
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

watch(menuOpen, (open) => {
  if (open) document.addEventListener('pointerdown', onDocumentPointerDown)
  else document.removeEventListener('pointerdown', onDocumentPointerDown)
})
watch(() => route.path, () => closeMenu())
onBeforeUnmount(() => document.removeEventListener('pointerdown', onDocumentPointerDown))

// Clair / sombre : pour l'instant, le clic ne fait qu'alterner l'icône (le thème clair viendra plus tard).
// Mode sombre (le site actuel) : soleil, pour passer en clair ; mode clair : lune, pour revenir au sombre.
const lightMode = ref(false)
const themeLabel = computed(() => (lightMode.value ? 'Passer en mode sombre' : 'Passer en mode clair'))
</script>

<template>
  <nav class="fixed inset-x-0 top-4 z-50 flex items-center justify-center gap-1.5 px-4" aria-label="Navigation principale">
    <div class="nav-wrapper rounded-full border border-amber-400/20 bg-gray-900/60 backdrop-blur-xl">
      <div class="nav-links">
        <NuxtLink to="/" class="nav-link" :class="{ 'is-active': isActive('/') }">
          Accueil
        </NuxtLink>

        <div ref="menuRef" class="nav-menu" @keydown="onMenuKeydown" @focusout="onMenuFocusOut">
          <button
            ref="buttonRef"
            type="button"
            class="nav-link nav-menu-button"
            :class="{ 'is-active': magazineActive }"
            :aria-expanded="menuOpen ? 'true' : 'false'"
            :aria-controls="menuId"
            @click="menuOpen = !menuOpen"
          >
            Le Magazine
            <svg class="nav-chevron" :class="{ 'is-open': menuOpen }" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fill-rule="evenodd" d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z" clip-rule="evenodd" />
            </svg>
          </button>

          <Transition name="nav-dropdown">
            <ul v-show="menuOpen" :id="menuId" class="nav-dropdown">
              <li v-for="link in magazineLinks" :key="link.to">
                <NuxtLink
                  :to="link.to"
                  class="nav-dropdown-link"
                  :class="{ 'is-current': isActive(link.to) }"
                  @click="closeMenu()"
                >
                  <span class="nav-dropdown-label">{{ link.label }}</span>
                  <span class="nav-dropdown-description">{{ link.description }}</span>
                </NuxtLink>
              </li>
            </ul>
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
      type="button"
      class="theme-toggle rounded-full border border-amber-400/20 bg-gray-900/60 backdrop-blur-xl"
      :aria-label="themeLabel"
      :title="themeLabel"
      @click="lightMode = !lightMode"
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
.nav-wrapper {
  --nav-indicator-hover: rgb(251 191 36 / 0.15); /* amber-400/15 */
  --nav-indicator-active: rgb(251 191 36); /* amber-400 */
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
  color: rgb(255 255 255 / 0.8);
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
  color: rgb(255 255 255 / 0.8);
  cursor: pointer;
  transition: color 150ms ease-in-out, background-color 150ms ease-in-out;
}

.theme-toggle:hover {
  background-color: rgb(251 191 36 / 0.15);
  color: rgb(251 191 36);
}

.theme-toggle:focus-visible {
  outline: 2px solid rgb(251 191 36);
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

/* Menu déroulant */
.nav-dropdown {
  position: absolute;
  top: calc(100% + 0.75rem);
  left: 50%;
  translate: -50% 0;
  width: max-content;
  min-width: 15rem;
  max-width: calc(100vw - 2rem);
  margin: 0;
  padding: 0.375rem;
  list-style: none;
  border: 1px solid rgb(251 191 36 / 0.2);
  border-radius: 1rem;
  background: rgb(17 24 39); /* gray-900 : opaque, le titre de la page ne doit pas transparaître */
  box-shadow: 0 20px 40px -12px rgb(0 0 0 / 0.6);
}

.nav-dropdown-link {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
  border-radius: 0.75rem;
  padding: 0.625rem 0.875rem;
  text-decoration: none;
  transition: background-color 150ms ease-in-out;
}

.nav-dropdown-link:hover,
.nav-dropdown-link:focus-visible {
  background-color: rgb(251 191 36 / 0.1);
}

.nav-dropdown-link:focus-visible {
  outline: 2px solid rgb(251 191 36);
  outline-offset: -2px;
}

.nav-dropdown-label {
  font-size: 0.875rem;
  font-weight: 600;
  color: rgb(255 255 255);
}

.nav-dropdown-link.is-current .nav-dropdown-label {
  color: rgb(251 191 36);
}

.nav-dropdown-description {
  font-size: 0.75rem;
  color: rgb(156 163 175); /* gray-400 */
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
  color: rgb(251 191 36);
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
    color: rgb(255 255 255);
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
