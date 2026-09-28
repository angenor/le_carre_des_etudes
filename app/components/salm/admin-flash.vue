<script setup lang="ts">
// Bandeaux de succès et d'erreur du back-office SALM (style de admin-header.vue), à utiliser avec useSalmFlash().
defineProps<{ success?: string; error?: string }>()
defineEmits<{ dismiss: [] }>()
</script>

<template>
  <div>
    <div v-if="error" class="mb-4 rounded-lg bg-red-50 p-4 text-sm text-red-700" role="alert">
      {{ error }}
      <button type="button" class="ml-2 font-medium underline" @click="$emit('dismiss')">Fermer</button>
    </div>
    <!-- Zone toujours présente pour que l'annonce soit lue par les lecteurs d'écran -->
    <div role="status" aria-live="polite">
      <p v-if="success" class="mb-4 rounded-lg bg-green-50 p-4 text-sm text-green-700">{{ success }}</p>
    </div>
  </div>
</template>
