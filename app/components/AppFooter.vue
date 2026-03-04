<script setup lang="ts">
const currentYear = new Date().getFullYear()

const facebookUrl = 'https://www.facebook.com/profile.php?id=61588510360890'

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
  <footer class="relative bg-gray-950">
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

          <!-- Suivez-nous sur Facebook -->
          <a
            :href="facebookUrl"
            target="_blank"
            rel="noopener noreferrer"
            class="group mt-6 inline-flex items-center gap-2.5 rounded-full border border-gray-800 bg-white/3 px-4 py-2 transition-all duration-300 hover:border-amber-500/40 hover:bg-amber-500/10 hover:shadow-lg hover:shadow-amber-500/5"
          >
            <svg class="size-4 text-gray-500 transition-colors duration-300 group-hover:text-amber-400" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
            </svg>
            <span class="text-sm text-gray-400 transition-colors duration-300 group-hover:text-white">Suivez-nous sur Facebook</span>
          </a>
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

        <!-- Colonne 3 : Liens rapides -->
        <div class="md:col-span-3">
          <h3 class="text-xs font-semibold uppercase tracking-widest text-amber-400">
            Liens rapides
          </h3>
          <ul class="mt-5 space-y-3 text-sm">
            <li>
              <NuxtLink to="/" class="group flex items-center gap-2 text-gray-400 transition-colors duration-200 hover:text-white">
                <span class="inline-block h-px w-0 bg-amber-500 transition-all duration-300 group-hover:w-4" />
                Accueil
              </NuxtLink>
            </li>
            <li>
              <NuxtLink to="/magazine" class="group flex items-center gap-2 text-gray-400 transition-colors duration-200 hover:text-white">
                <span class="inline-block h-px w-0 bg-amber-500 transition-all duration-300 group-hover:w-4" />
                Magazine
              </NuxtLink>
            </li>
            <li>
              <NuxtLink to="/rubriques" class="group flex items-center gap-2 text-gray-400 transition-colors duration-200 hover:text-white">
                <span class="inline-block h-px w-0 bg-amber-500 transition-all duration-300 group-hover:w-4" />
                Rubriques
              </NuxtLink>
            </li>
            <li>
              <NuxtLink to="/partenaires" class="group flex items-center gap-2 text-gray-400 transition-colors duration-200 hover:text-white">
                <span class="inline-block h-px w-0 bg-amber-500 transition-all duration-300 group-hover:w-4" />
                Partenaires
              </NuxtLink>
            </li>
          </ul>
        </div>
      </div>

      <!-- Newsletter -->
      <div class="mt-12 rounded-xl border border-gray-800/80 bg-white/3 px-6 py-6 sm:flex sm:items-center sm:justify-between sm:gap-6">
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
        class="mt-3 text-center text-sm"
        :class="{
          'text-emerald-400': newsletterStatus === 'success',
          'text-red-400': newsletterStatus === 'error',
          'text-amber-400': newsletterStatus === 'duplicate',
        }"
      >
        {{ newsletterMessage }}
      </p>

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
