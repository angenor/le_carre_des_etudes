<script setup lang="ts">
const currentYear = new Date().getFullYear()

// Réseaux sociaux, en dur pour l'instant (non éditables dans le back-office). Icônes : Simple Icons,
// dans la couleur de chaque marque (Instagram : son dégradé, défini dans le gabarit).
const socialLinks = [
  {
    label: 'Facebook',
    color: '#0866FF',
    url: 'https://www.facebook.com/profile.php?id=61573859167927',
    icon: 'M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z',
  },
  {
    label: 'LinkedIn',
    color: '#0A66C2',
    url: 'https://www.linkedin.com/showcase/salm-2026-salon-international-des-licences-et-masters-de-c%C3%B4te-d-ivoire/?viewAsMember=true',
    icon: 'M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z',
  },
  {
    label: 'Instagram',
    color: 'url(#footer-instagram-gradient)',
    url: 'https://www.instagram.com/salon__des_licences_et_masters/',
    icon: 'M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z',
  },
  {
    label: 'YouTube',
    color: '#FF0000',
    url: 'https://www.youtube.com/@SALM_2027',
    icon: 'M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z',
  },
]

const { data: salmStatus } = await useSalmStatus()

const newsletterEmail = ref('')
const newsletterStatus = ref<'idle' | 'loading' | 'success' | 'error' | 'duplicate'>('idle')
const newsletterMessage = ref('')

async function subscribeNewsletter() {
  const email = newsletterEmail.value.trim()
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    newsletterStatus.value = 'error'
    newsletterMessage.value = 'Veuillez saisir une adresse email valide.'
    return
  }

  newsletterStatus.value = 'loading'
  try {
    const res = await $fetch<{ success: boolean; message: string }>('/api/newsletter', {
      method: 'POST',
      body: { email },
    })
    newsletterStatus.value = 'success'
    newsletterMessage.value = res.message
    newsletterEmail.value = ''
  } catch (err: any) {
    const status = err?.response?.status
    const message = err?.data?.message
    if (status === 409) {
      newsletterStatus.value = 'duplicate'
      newsletterMessage.value = message || 'Cette adresse est déjà inscrite.'
    } else {
      newsletterStatus.value = 'error'
      newsletterMessage.value = message || 'Une erreur est survenue. Veuillez réessayer.'
    }
  }
}
</script>

<template>
  <footer class="dark [color-scheme:dark] relative bg-gray-950">
    <!-- Toujours sombre, dans les deux modes : `dark` y rend aux jetons leurs valeurs sombres -->
    <!-- Vague SVG en haut -->
    <div class="absolute inset-x-0 -top-px w-full overflow-hidden leading-none">
      <svg
        class="relative block w-full"
        style="height: 80px"
        viewBox="0 0 1200 120"
        preserveAspectRatio="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M0,60 C150,100 350,0 600,60 C850,120 1050,20 1200,60 L1200,120 L0,120 Z"
          class="fill-gray-950"
        />
      </svg>
    </div>

    <!-- Motifs SVG décoratifs -->
    <div class="pointer-events-none absolute inset-0 overflow-hidden">
      <!-- Grille de points ambrés -->
      <svg class="absolute left-0 top-0 h-full w-full opacity-[0.04]" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="footer-dots" x="0" y="0" width="32" height="32" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="1.2" fill="#fbbf24" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#footer-dots)" />
      </svg>

      <!-- Losange géométrique flottant en haut à droite -->
      <svg class="absolute -right-10 -top-6 size-64 rotate-12 opacity-[0.03]" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
        <polygon points="100,10 190,100 100,190 10,100" fill="none" stroke="#dd8448" stroke-width="1.5" />
        <polygon points="100,40 160,100 100,160 40,100" fill="none" stroke="#dd8448" stroke-width="1" />
        <polygon points="100,70 130,100 100,130 70,100" fill="none" stroke="#fbbf24" stroke-width="0.8" />
      </svg>

      <!-- Cercles concentriques en bas à gauche -->
      <svg class="absolute -bottom-12 -left-16 size-72 opacity-[0.03]" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
        <circle cx="100" cy="100" r="90" fill="none" stroke="#dd8448" stroke-width="0.8" />
        <circle cx="100" cy="100" r="70" fill="none" stroke="#dd8448" stroke-width="0.6" />
        <circle cx="100" cy="100" r="50" fill="none" stroke="#fbbf24" stroke-width="0.5" />
        <circle cx="100" cy="100" r="30" fill="none" stroke="#fbbf24" stroke-width="0.4" />
      </svg>

      <!-- Halo radial ambré -->
      <div class="absolute -right-32 top-1/3 size-96 rounded-full bg-amber-500/4 blur-3xl" />
    </div>

    <!-- Contenu du footer -->
    <div class="relative z-10 mx-auto max-w-7xl px-4 pb-8 pt-16 sm:px-6 lg:px-8">
      <!-- Newsletter -->
      <div class="mb-12 rounded-xl border border-gray-800/80 bg-white/3 px-6 py-6 sm:flex sm:items-center sm:justify-between sm:gap-6">
        <div class="mb-4 sm:mb-0">
          <h3 class="text-sm font-semibold text-white">Restez informé</h3>
          <p class="mt-1 text-xs text-gray-400">Recevez une alerte lors de la sortie de nos prochaines éditions.</p>
        </div>
        <form @submit.prevent="subscribeNewsletter" class="flex w-full max-w-md gap-2">
          <input
            v-model="newsletterEmail"
            type="email"
            placeholder="Votre adresse email"
            :disabled="newsletterStatus === 'loading'"
            class="min-w-0 flex-1 rounded-lg border border-gray-700 bg-gray-900 px-4 py-2.5 text-sm text-white placeholder-gray-500 transition focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 disabled:opacity-50"
          />
          <button
            type="submit"
            :disabled="newsletterStatus === 'loading'"
            class="shrink-0 rounded-lg bg-amber-500 px-5 py-2.5 text-sm font-medium text-gray-950 transition-colors hover:bg-amber-400 disabled:opacity-50"
          >
            {{ newsletterStatus === 'loading' ? '...' : "S'inscrire" }}
          </button>
        </form>
      </div>
      <p
        v-if="newsletterStatus !== 'idle' && newsletterStatus !== 'loading'"
        class="-mt-9 mb-12 text-center text-sm"
        :class="{
          'text-emerald-400': newsletterStatus === 'success',
          'text-red-400': newsletterStatus === 'error',
          'text-amber-400': newsletterStatus === 'duplicate',
        }"
      >
        {{ newsletterMessage }}
      </p>

      <!-- Grille principale -->
      <div class="grid gap-12 md:grid-cols-12">
        <!-- Colonne 1 : À propos du magazine -->
        <div class="md:col-span-5">
          <div class="flex items-center gap-3">
            <div class="flex size-10 items-center justify-center rounded-lg border border-amber-500/20 bg-amber-500/10">
              <svg class="size-5 text-amber-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" xmlns="http://www.w3.org/2000/svg">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
              </svg>
            </div>
            <h2 class="bg-linear-to-r from-amber-400 to-amber-500 bg-clip-text text-xl font-bold tracking-tight text-transparent">
              Le Carré des Études
            </h2>
          </div>
          <p class="mt-4 max-w-md text-sm leading-relaxed text-gray-400">
            « Le Carré des Études » est un magazine ivoirien pensé pour les étudiants, avec pour mission principale de guider, informer et inspirer la jeunesse estudiantine de Côte d'Ivoire.
          </p>

          <!-- Réseaux sociaux -->
          <p class="mt-6 text-xs font-semibold uppercase tracking-widest text-gray-500">Suivez-nous</p>
          <ul class="mt-3 flex flex-wrap items-center gap-2.5">
            <li v-for="social in socialLinks" :key="social.label">
              <a
                :href="social.url"
                target="_blank"
                rel="noopener noreferrer"
                :aria-label="`${social.label} (nouvel onglet)`"
                :title="social.label"
                class="group flex size-10 items-center justify-center rounded-full border border-gray-800 bg-white/3 transition-all duration-300 hover:-translate-y-0.5 hover:border-amber-500/40 hover:bg-amber-500/10 hover:shadow-lg hover:shadow-amber-500/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400"
              >
                <svg class="size-[18px]" viewBox="0 0 24 24" aria-hidden="true">
                  <defs v-if="social.label === 'Instagram'">
                    <radialGradient id="footer-instagram-gradient" cx="0.3" cy="1.07" r="1.3">
                      <stop offset="0" stop-color="#FFDD55" />
                      <stop offset="0.1" stop-color="#FFDD55" />
                      <stop offset="0.5" stop-color="#FF543E" />
                      <stop offset="1" stop-color="#C837AB" />
                    </radialGradient>
                  </defs>
                  <!-- Fond blanc sous les parties évidées des logos (« f », « in », bouton « lecture »), blanches sur les originaux -->
                  <circle v-if="social.label === 'Facebook'" cx="12" cy="12" r="11" fill="#FFFFFF" />
                  <rect v-if="social.label === 'LinkedIn'" x="2" y="2" width="20" height="20" fill="#FFFFFF" />
                  <path v-if="social.label === 'YouTube'" d="M9 8h7v8H9z" fill="#FFFFFF" />
                  <path :d="social.icon" :fill="social.color" />
                </svg>
              </a>
            </li>
          </ul>
        </div>

        <!-- Colonne 2 : Contact -->
        <div class="md:col-span-4">
          <h3 class="text-xs font-semibold uppercase tracking-widest text-amber-400">
            Contact
          </h3>
          <ul class="mt-5 space-y-4 text-sm text-gray-400">
            <li class="flex items-start gap-3">
              <div class="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-md border border-gray-800 bg-white/3">
                <svg class="size-3.5 text-amber-400/70" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" /><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" /></svg>
              </div>
              Abidjan Riviera FAYA, 03 BP 2517 ABIDJAN 03
            </li>
            <li class="flex items-start gap-3">
              <div class="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-md border border-gray-800 bg-white/3">
                <svg class="size-3.5 text-amber-400/70" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z" /></svg>
              </div>
              <span>
                (+225) 07 68 01 14 09<br>
                01 02 09 63 71<br>
                27 22 40 98 18
              </span>
            </li>
            <li class="flex items-start gap-3">
              <div class="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-md border border-gray-800 bg-white/3">
                <svg class="size-3.5 text-amber-400/70" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" /></svg>
              </div>
              <a href="mailto:contact@sucreycorporates.com" class="transition hover:text-amber-400">contact@sucreycorporates.com</a>
            </li>
            <li class="flex items-start gap-3">
              <div class="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-md border border-gray-800 bg-white/3">
                <svg class="size-3.5 text-amber-400/70" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>
              </div>
              Lun – Ven : 08h00 – 17h00
            </li>
          </ul>
        </div>

        <!-- Colonne 3 : les deux volets de la plateforme (même découpage que la barre de navigation) -->
        <div class="space-y-8 md:col-span-3">
          <nav aria-labelledby="footer-magazine">
            <h3 id="footer-magazine" class="text-xs font-semibold uppercase tracking-widest text-amber-400">
              Le magazine
            </h3>
            <ul class="mt-5 space-y-3 text-sm">
              <li>
                <NuxtLink to="/magazine" class="group flex items-center gap-2 text-gray-400 transition-colors duration-200 hover:text-white">
                  <span class="inline-block h-px w-0 bg-amber-500 transition-all duration-300 group-hover:w-4" />
                  Les numéros
                </NuxtLink>
              </li>
              <li>
                <NuxtLink to="/rubriques" class="group flex items-center gap-2 text-gray-400 transition-colors duration-200 hover:text-white">
                  <span class="inline-block h-px w-0 bg-amber-500 transition-all duration-300 group-hover:w-4" />
                  Les rubriques
                </NuxtLink>
              </li>
              <li>
                <NuxtLink to="/partenaires" class="group flex items-center gap-2 text-gray-400 transition-colors duration-200 hover:text-white">
                  <span class="inline-block h-px w-0 bg-amber-500 transition-all duration-300 group-hover:w-4" />
                  Nos partenaires
                </NuxtLink>
              </li>
            </ul>
          </nav>
          <nav v-if="salmStatus?.published" aria-labelledby="footer-salm">
            <h3 id="footer-salm" class="text-xs font-semibold uppercase tracking-widest text-amber-400">
              Le SALM
            </h3>
            <ul class="mt-5 space-y-3 text-sm">
              <li>
                <NuxtLink to="/salm" class="group flex items-center gap-2 text-gray-400 transition-colors duration-200 hover:text-white">
                  <span class="inline-block h-px w-0 bg-amber-500 transition-all duration-300 group-hover:w-4" />
                  Salon SALM {{ salmStatus.year }}
                </NuxtLink>
              </li>
            </ul>
          </nav>
        </div>
      </div>

      <!-- Séparateur décoratif -->
      <div class="relative mt-12">
        <div class="absolute inset-0 flex items-center">
          <div class="w-full border-t border-gray-800/80" />
        </div>
        <div class="relative flex justify-center">
          <div class="bg-gray-950 px-4">
            <svg class="size-5 text-amber-500/30" viewBox="0 0 20 20" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
              <path d="M10 2 L12 8 L18 10 L12 12 L10 18 L8 12 L2 10 L8 8 Z" />
            </svg>
          </div>
        </div>
      </div>

      <!-- Copyright -->
      <p class="mt-6 text-center text-xs text-gray-600">
        &copy; {{ currentYear }} Le Carré des Études. Tous droits réservés.
      </p>
      <p class="mt-2 text-center text-xs text-gray-700">
        Plateforme développée par
        <a href="https://angenor.firebaseapp.com/" target="_blank" rel="noopener noreferrer" class="text-gray-500 transition-colors duration-200 hover:text-amber-400">Angenor N'GOUANDI</a>
      </p>
    </div>
  </footer>
</template>
