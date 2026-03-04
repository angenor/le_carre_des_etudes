export default defineNuxtPlugin(() => {
  const router = useRouter()

  router.afterEach((to) => {
    // Ne pas tracker les pages admin
    if (to.fullPath.startsWith('/admin')) return

    $fetch('/api/visits', {
      method: 'POST',
      body: { path: to.fullPath },
    }).catch(() => {
      // fire-and-forget : on ignore les erreurs de tracking
    })
  })
})
