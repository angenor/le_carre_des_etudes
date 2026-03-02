export function useAdmin() {
  const isLoggedIn = useState<boolean>('admin-logged-in', () => false)

  async function login(password: string): Promise<void> {
    await $fetch('/api/auth/login', {
      method: 'POST',
      body: { password },
    })
    isLoggedIn.value = true
  }

  function logout(): void {
    isLoggedIn.value = false
    navigateTo('/admin/login')
  }

  return { isLoggedIn, login, logout }
}
