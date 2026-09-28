export interface SiteStatus {
  maintenance: boolean
  admin: boolean
}

/** État du site (mode maintenance, session admin), partagé entre le middleware, les layouts et la page de maintenance. */
export function useSiteStatus() {
  const status = useState<SiteStatus | null>('site-status', () => null)

  async function refresh(): Promise<SiteStatus> {
    try {
      status.value = await useRequestFetch()<SiteStatus>('/api/site/status')
    }
    catch {
      status.value = { maintenance: false, admin: false }
    }
    return status.value
  }

  async function ensure(): Promise<SiteStatus> {
    return status.value ?? refresh()
  }

  return { status, refresh, ensure }
}
