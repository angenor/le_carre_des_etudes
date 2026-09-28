// Bandeaux du back-office SALM : succès effacé après 3 s (`role="status"`), erreur persistante
// (`role="alert"`) ; pattern de `app/components/salm/admin-header.vue`.
export function useSalmFlash() {
  const successMessage = ref('')
  const errorMessage = ref('')
  let timer: ReturnType<typeof setTimeout> | undefined

  function showSuccess(message: string) {
    errorMessage.value = ''
    successMessage.value = message
    clearTimeout(timer)
    timer = setTimeout(() => { successMessage.value = '' }, 3000)
  }

  function showError(message: string) {
    successMessage.value = ''
    errorMessage.value = message
  }

  function clear() {
    successMessage.value = ''
    errorMessage.value = ''
  }

  onBeforeUnmount(() => clearTimeout(timer))

  return { successMessage, errorMessage, showSuccess, showError, clear }
}
