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
    },
  },
  modules: ['@hypernym/nuxt-gsap'],
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
