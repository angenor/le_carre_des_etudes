export function useAdmin() {
  const isLoggedIn = useState<boolean>('admin-logged-in', () => false)
  const checked = useState<boolean>('admin-checked', () => false)

  async function checkSession(): Promise<boolean> {
    if (checked.value) return isLoggedIn.value
    try {
      const requestFetch = useRequestFetch()
      const { admin } = await requestFetch('/api/auth/me')
      isLoggedIn.value = admin
    }
    catch {
      isLoggedIn.value = false
    }
    checked.value = true
    return isLoggedIn.value
  }

  async function login(password: string): Promise<void> {
    await $fetch('/api/auth/login', {
      method: 'POST',
      body: { password },
    })
    isLoggedIn.value = true
    checked.value = true
  }

  async function logout(): Promise<void> {
    try {
      await $fetch('/api/auth/logout', { method: 'POST' })
    }
    catch {
      // la redirection vers la connexion a lieu quoi qu'il arrive
    }
    isLoggedIn.value = false
    checked.value = false
    // L'aperçu du site en maintenance n'est plus autorisé
    useState('site-status').value = null
    await navigateTo('/admin/login')
  }

  return { isLoggedIn, checked, login, logout, checkSession }
}
