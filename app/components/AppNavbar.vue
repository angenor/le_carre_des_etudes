<script setup lang="ts">
const route = useRoute()

const navLinks = [
  { label: 'Accueil', to: '/' },
  { label: 'Magazine', to: '/magazine' },
  { label: 'Rubriques', to: '/rubriques' },
  { label: 'Résultats', to: '/resultats' },
  { label: 'Partenaires', to: '/partenaires' },
]

function isActive(to: string): boolean {
  if (to === '/') {
    return route.path === '/'
  }
  return route.path.startsWith(to)
}
</script>

<template>
  <nav class="fixed inset-x-0 top-4 z-50 flex justify-center px-4">
    <div class="nav-wrapper rounded-full border border-amber-400/20 bg-gray-900/60 backdrop-blur-xl">
      <div class="nav-links">
        <NuxtLink
          v-for="link in navLinks"
          :key="link.to"
          :to="link.to"
          class="nav-link"
          :class="{ 'is-active': isActive(link.to) }"
        >
          {{ link.label }}
        </NuxtLink>
      </div>
    </div>
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

@media (min-width: 640px) {
  .nav-link {
    padding-inline: 1rem;
    font-size: 0.875rem;
    line-height: 1.25rem;
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
