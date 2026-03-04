export default defineNuxtPlugin(() => {
  const router = useRouter()

  router.afterEach((to) => {
    $fetch('/api/visits', {
      method: 'POST',
      body: { path: to.fullPath },
    }).catch(() => {
      // fire-and-forget : on ignore les erreurs de tracking
    })
  })
})
