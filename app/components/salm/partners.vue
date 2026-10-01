<script setup lang="ts">
import '~/assets/css/salm.css'
import type { SalmPartner } from '#shared/types/salm'

// Partenaires du SALM (back-office : SALM › Partenaires) : un bandeau de logos qui défile en boucle,
// bords en fondu. Défilement sans couture : la même série enchaînée deux fois, décalée de -50 % en boucle.
// Arrêt au survol et au clavier ; immobile si l'appareil demande de réduire les animations (salm.css).
const props = defineProps<{ partners: SalmPartner[] }>()

/** Série assez longue pour couvrir l'écran : la liste répétée jusqu'à 10 logos au moins. */
const series = computed(() => {
  const list = props.partners
  const out: SalmPartner[] = []
  while (out.length < Math.max(10, list.length)) out.push(...list)
  return out
})
// Vitesse constante quel que soit le nombre de logos
const duration = computed(() => ({ '--salm-marquee-duration': `${series.value.length * 3.2}s` }))
</script>

<template>
  <section aria-labelledby="salm-partenaires-titre" class="salm-partners bg-salm-bg pt-16 pb-16 md:pt-[100px] md:pb-[100px]">
    <div class="flex flex-col gap-3 px-5 md:gap-4 md:px-12 xl:px-24" data-motion="rise">
      <span class="font-salm-title text-xs font-bold tracking-[0.16em] text-salm-accent-text md:text-[13px]">ILS NOUS SOUTIENNENT</span>
      <h2 id="salm-partenaires-titre" class="font-salm-title text-[28px] leading-[1.1] font-extrabold tracking-[-0.03em] text-salm-ink md:text-[44px]">Les partenaires du SALM</h2>
    </div>

    <!-- La première occurrence de chaque partenaire est lue et atteignable au clavier, les répétitions non -->
    <div class="salm-marquee mt-10 md:mt-14" :style="duration">
      <ul class="salm-marquee-track" role="list">
        <template v-for="copy in 2" :key="copy">
          <li
            v-for="(p, i) in series"
            :key="`${copy}-${i}`"
            class="salm-marquee-item"
            :aria-hidden="copy > 1 || i >= partners.length ? 'true' : undefined"
          >
            <component
              :is="p.url ? 'a' : 'span'"
              :href="p.url ?? undefined"
              :target="p.url ? '_blank' : undefined"
              :rel="p.url ? 'noopener' : undefined"
              :tabindex="p.url && (copy > 1 || i >= partners.length) ? -1 : undefined"
              :title="p.name"
              class="salm-marquee-logo"
            >
              <img :src="p.logoPath" :alt="p.name" loading="lazy" decoding="async">
            </component>
          </li>
        </template>
      </ul>
    </div>
  </section>
</template>
