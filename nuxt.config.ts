import tailwindcss from '@tailwindcss/vite'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
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
