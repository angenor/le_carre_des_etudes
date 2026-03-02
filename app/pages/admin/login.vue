<script setup lang="ts">
definePageMeta({
  layout: false,
})

const { login } = useAdmin()
const password = ref('')
const error = ref('')
const loading = ref(false)

async function handleLogin() {
  error.value = ''
  loading.value = true

  try {
    await login(password.value)
    await navigateTo('/admin')
  }
  catch {
    error.value = 'Mot de passe incorrect'
  }
  finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-100 px-4">
    <div class="w-full max-w-sm">
      <div class="bg-white rounded-lg shadow-md p-8">
        <div class="text-center mb-6">
          <div class="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-emerald-600 text-white text-lg font-bold mb-3">
            CE
          </div>
          <h1 class="text-xl font-bold text-gray-900">Administration</h1>
          <p class="text-sm text-gray-500 mt-1">Le Carré des Études</p>
        </div>

        <form @submit.prevent="handleLogin" class="space-y-4">
          <div>
            <label for="password" class="block text-sm font-medium text-gray-700 mb-1">
              Mot de passe
            </label>
            <input
              id="password"
              v-model="password"
              type="password"
              required
              autocomplete="current-password"
              class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              placeholder="Entrez le mot de passe admin"
            />
          </div>

          <div v-if="error" class="text-sm text-red-600 bg-red-50 rounded-md px-3 py-2">
            {{ error }}
          </div>

          <button
            type="submit"
            :disabled="loading || !password"
            class="w-full py-2 px-4 bg-emerald-600 text-white font-medium rounded-md hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {{ loading ? 'Connexion...' : 'Se connecter' }}
          </button>
        </form>
      </div>
    </div>
  </div>
</template>
