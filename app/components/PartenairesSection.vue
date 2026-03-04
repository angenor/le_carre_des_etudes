<script setup lang="ts">
interface Partner {
  id: number
  name: string
  logoPath: string
  url: string | null
  order: number
}

const { data: partenaires } = useFetch<Partner[]>('/api/partenaires')

const hasContent = computed(() => (partenaires.value?.length ?? 0) > 0)
</script>

<template>
  <section v-if="hasContent" class="relative overflow-hidden bg-gray-950 pb-20 pt-6 sm:pb-28 sm:pt-10">
    <!-- Fond décoratif -->
    <div class="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(221,132,72,0.05),transparent_60%)]" />

    <div class="relative mx-auto max-w-6xl px-6">
      <!-- En-tête -->
      <div class="mb-12 text-center">
        <span class="inline-block rounded-full border border-amber-500/30 bg-amber-500/10 px-4 py-1.5 text-xs font-semibold tracking-widest text-amber-400 uppercase">
          Partenaires
        </span>

        <h2 class="mt-6 text-3xl font-bold tracking-tight text-white sm:text-4xl">
          Ils nous
          <span class="bg-linear-to-r from-amber-400 to-amber-500 bg-clip-text text-transparent">
            accompagnent
          </span>
        </h2>

        <!-- Séparateur -->
        <div class="mx-auto mt-8 flex items-center justify-center gap-3">
          <span class="h-px w-12 bg-linear-to-r from-transparent to-amber-500/50" />
          <svg class="h-3 w-3 rotate-45 text-amber-500/40" fill="currentColor" viewBox="0 0 16 16">
            <rect width="16" height="16" rx="2" />
          </svg>
          <span class="h-px w-12 bg-linear-to-l from-transparent to-amber-500/50" />
        </div>
      </div>

      <!-- Logos -->
      <div class="flex flex-wrap items-center justify-center gap-8 sm:gap-12">
        <component
          :is="partner.url ? 'a' : 'div'"
          v-for="partner in partenaires"
          :key="partner.id"
          :href="partner.url || undefined"
          :target="partner.url ? '_blank' : undefined"
          :rel="partner.url ? 'noopener noreferrer' : undefined"
          class="flex flex-col items-center gap-3 transition-opacity hover:opacity-80"
        >
          <img
            :src="partner.logoPath"
            :alt="`Logo ${partner.name}`"
            class="h-16 w-auto object-contain sm:h-20"
          />
          <span class="text-xs font-medium text-gray-400">{{ partner.name }}</span>
        </component>
      </div>

      <!-- CTA -->
      <div class="mt-12 text-center">
        <NuxtLink
          to="/partenaires"
          class="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-8 py-3 text-sm font-semibold text-amber-400 transition-all hover:bg-amber-500/20 hover:shadow-lg hover:shadow-amber-500/5"
        >
          Voir tous nos partenaires
          <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
          </svg>
        </NuxtLink>
      </div>
    </div>
  </section>
</template>
