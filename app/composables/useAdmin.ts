export function useAdmin() {
  const isLoggedIn = useState<boolean>('admin-logged-in', () => false)
  const checked = useState<boolean>('admin-checked', () => false)

  async function checkSession(): Promise<boolean> {
    if (checked.value) return isLoggedIn.value
    try {
      const { admin } = await $fetch('/api/auth/me')
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

  function logout(): void {
    isLoggedIn.value = false
    checked.value = false
    navigateTo('/admin/login')
  }

  return { isLoggedIn, checked, login, logout, checkSession }
}
