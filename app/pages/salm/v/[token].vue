<script setup lang="ts">
import '~/assets/css/salm.css'
import type { SalmVerifyResponse } from '#shared/types/salm'

// Vérification d'un badge ouverte par le QR code (FR-028) : édition et validité, aucune donnée personnelle.
const route = useRoute()
const token = computed(() => String(route.params.token ?? ''))
const { data } = await useFetch<SalmVerifyResponse>(() => `/api/salm/verify/${encodeURIComponent(token.value)}`)

useHead({ meta: [{ name: 'robots', content: 'noindex, nofollow' }] })
useSeoMeta({ title: 'Vérification d\'un badge SALM · Le Carré des Études' })
</script>

<template>
  <div class="salm-scope flex min-h-[80vh] items-center justify-center bg-salm-bg px-5 pt-28 pb-16 font-salm-body text-[#F5F3EF]">
    <div class="flex w-full max-w-md flex-col items-center gap-5 rounded-3xl border border-salm-border bg-salm-surface-2 p-8 text-center">
      <template v-if="data?.valid && data.edition">
        <span class="flex size-16 items-center justify-center rounded-full bg-green-500/15 text-green-400" aria-hidden="true">
          <svg class="size-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
        </span>
        <h1 class="font-salm-title text-2xl font-extrabold tracking-[-0.02em]">Badge valide · SALM {{ data.edition.year }}</h1>
        <p class="text-sm leading-relaxed text-stone-400">{{ data.edition.salonName }}</p>
      </template>
      <template v-else>
        <span class="flex size-16 items-center justify-center rounded-full bg-red-500/15 text-red-400" aria-hidden="true">
          <svg class="size-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"><path d="M6 18 18 6M6 6l12 12" /></svg>
        </span>
        <h1 class="font-salm-title text-2xl font-extrabold tracking-[-0.02em]">Badge invalide</h1>
        <p class="text-sm leading-relaxed text-stone-400">Ce badge n'existe pas ou n'est plus valable.</p>
      </template>
      <NuxtLink to="/salm" class="text-sm font-semibold text-salm-accent-text hover:text-orange-300">Découvrir le SALM</NuxtLink>
    </div>
  </div>
</template>
