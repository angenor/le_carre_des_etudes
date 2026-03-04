<script setup lang="ts">
useHead({
  title: 'Le Carré des Études — Guider, Informer, Inspirer',
})

const heroLoaded = ref(false)
const showLoader = ref(true)

// Sécurité : timeout de 5s si l'image ne charge pas
let timeout: ReturnType<typeof setTimeout> | undefined
onMounted(() => {
  timeout = setTimeout(() => {
    heroLoaded.value = true
  }, 5000)
})
onUnmounted(() => {
  clearTimeout(timeout)
})

function onHeroImageLoaded() {
  heroLoaded.value = true
  clearTimeout(timeout)
}
</script>

<template>
  <div>
    <HomeLoader v-if="showLoader" :loading="!heroLoaded" @done="showLoader = false" />
    <HeroSection @image-loaded="onHeroImageLoaded" />
    <AlaUneSection />
    <RubriquesSection />
    <PartenairesSection />
  </div>
</template>
