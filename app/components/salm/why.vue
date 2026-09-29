<script setup lang="ts">
import '~/assets/css/salm.css'
import type { SalmPublicEdition } from '#shared/types/salm'

// « Pourquoi le SALM ? » : affiche officielle, texte, publics et organisateur.
defineProps<{ edition: SalmPublicEdition }>()
</script>

<template>
  <section id="pourquoi" class="scroll-mt-24 bg-salm-surface px-5 py-16 md:px-12 md:py-[100px] xl:px-24">
    <div class="flex flex-col gap-10 lg:flex-row lg:items-start lg:gap-24">
      <figure v-if="edition.poster" class="m-0 w-full shrink-0 lg:w-[400px] xl:w-[480px]">
        <img
          :src="edition.poster.path"
          :alt="edition.poster.alt ?? `Affiche du SALM ${edition.year}`"
          width="480"
          height="620"
          loading="lazy"
          class="aspect-[480/620] w-full rounded-[20px] bg-[#F7F4EF] object-cover object-top"
        >
      </figure>

      <div class="flex min-w-0 grow flex-col gap-6 md:gap-7 lg:pt-5">
        <span class="font-salm-title text-xs font-bold tracking-[0.16em] text-salm-accent-text md:text-[13px]">POURQUOI LE SALM ?</span>
        <h2 v-if="edition.whyTitle" class="font-salm-title text-[28px] leading-[1.1] font-extrabold tracking-[-0.03em] text-[#F5F3EF] md:text-[44px]">
          {{ edition.whyTitle }}
        </h2>
        <p v-if="edition.whyText" class="text-base leading-[1.65] text-stone-300 md:text-lg">{{ edition.whyText }}</p>
        <ul v-if="edition.audiences.length" class="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <li v-for="audience in edition.audiences" :key="audience.title" class="flex flex-col gap-2 rounded-2xl bg-salm-surface-3 p-[22px]">
            <span class="font-salm-title text-[17px] font-extrabold text-[#F5F3EF]">{{ audience.title }}</span>
            <span class="text-sm leading-normal text-stone-400">{{ audience.text }}</span>
          </li>
        </ul>
        <div class="flex items-center gap-[18px] border-t border-salm-border pt-6">
          <!-- Emblème de Sucrey Corporates (fixe : l'organisateur ne change pas d'une édition à l'autre), extrait de public/images/logos/LOGO-BLANC-.png -->
          <img src="/images/logos/sucrey-embleme-blanc.png" alt="" width="52" height="52" loading="lazy" class="size-13 shrink-0">
          <div class="flex flex-col gap-0.5">
            <span class="text-[13px] text-stone-400">Organisé par</span>
            <span class="font-salm-title text-[17px] font-bold text-[#F5F3EF]">{{ edition.organizerName.toLocaleUpperCase('fr-FR') }}</span>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
