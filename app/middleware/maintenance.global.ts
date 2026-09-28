// Mode maintenance : les visiteurs sont renvoyés vers /maintenance, y compris en navigation côté client.
// Le back-office reste accessible ; un administrateur connecté voit le site normalement.
export default defineNuxtRouteMiddleware(async (to) => {
  if (to.path.startsWith('/admin')) return

  const { ensure, refresh } = useSiteStatus()
  let status = await ensure()
  // État en cache « visiteur » alors que la maintenance est active : il a pu se connecter depuis
  if (import.meta.client && status.maintenance && !status.admin) status = await refresh()

  const blocked = status.maintenance && !status.admin
  if (to.path === '/maintenance') {
    if (!blocked) return navigateTo('/', { replace: true })
    return
  }
  if (blocked) return navigateTo('/maintenance', { replace: true })
})
