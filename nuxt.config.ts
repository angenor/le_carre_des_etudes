import tailwindcss from '@tailwindcss/vite'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  runtimeConfig: {
    public: {
      // URL absolue du site (QR code des badges SALM). Surchargeable par NUXT_PUBLIC_SITE_URL.
      siteUrl: 'https://lecarredesetudes.com',
    },
  },
  nitro: {
    routeRules: {
      '/api/upload': { maxBodySize: 50 * 1024 * 1024 },
      // Adresse courte du contrôle d'entrée SALM, favori des téléphones de l'équipe (FR-201)
      '/controle': { redirect: { to: '/admin/salm/controle', statusCode: 302 } },
      // Adresse courte du formulaire étudiant, encodée dans le QR code de l'affiche d'inscription (FR-240)
      '/inscription': { redirect: { to: '/salm/inscription-etudiant', statusCode: 302 } },
    },
  },
  modules: ['@hypernym/nuxt-gsap', '@nuxtjs/color-mode'],
  // Mode clair / sombre du site public : réglage du visiteur au premier affichage, puis son choix mémorisé.
  // Classe `light` ou `dark` sur <html> ; les couleurs suivent les jetons de app/assets/css/main.css.
  colorMode: {
    preference: 'system',
    fallback: 'dark',
    classSuffix: '',
    storageKey: 'lcde-theme',
  },
  gsap: {
    composables: true,
    provide: false,
    extraPlugins: {
      scrollTrigger: true,
    },
  },
  css: ['~/assets/css/main.css'],
  vite: {
    plugins: [
      tailwindcss() as any,
    ],
    server: {
      allowedHosts: true,
    },
  },
})