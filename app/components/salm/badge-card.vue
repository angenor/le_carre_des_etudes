<script setup lang="ts">
import '~/assets/css/salm.css'
import { splitSalonName } from '#shared/utils/salm'

// Visuel HTML du recto du badge (maquettes inscription-etudiant et page-desktop).
// Décoratif : `aria-hidden`, la légende textuelle est fournie par le parent.
const props = withDefaults(defineProps<{
  year: number
  salonName: string
  fullName: string
  studyLevel: string
  number?: string | null
  /** SVG du QR code produit par le serveur (bibliothèque qrcode) : jamais de donnée saisie. */
  qrSvg?: string | null
  size?: 'sm' | 'md'
  variant?: 'accent' | 'light'
}>(), { number: null, qrSvg: null, size: 'sm', variant: 'accent' })

const title = computed(() => splitSalonName(props.salonName))
const name = computed(() => props.fullName.toLocaleUpperCase('fr-FR'))
const level = computed(() => props.studyLevel.toLocaleUpperCase('fr-FR'))
const isMd = computed(() => props.size === 'md')
</script>

<template>
  <!-- Variante claire : carte « Deux façons de participer » -->
  <div
    v-if="variant === 'light'"
    aria-hidden="true"
    class="flex h-[345px] w-[230px] flex-col items-center gap-2.5 rounded-[18px] bg-[#F5F3EF] px-4 py-5 text-[#9A3A06] shadow-[0_30px_60px_rgba(0,0,0,0.3)]"
  >
    <span class="h-1.5 w-11 rounded-full bg-stone-300" />
    <span class="text-center font-salm-title text-[10px] leading-[1.2] font-extrabold">{{ title.main }}</span>
    <span class="font-salm-script text-[58px] leading-[0.9] text-[#C4500A]">Salm</span>
    <span class="-mt-2 font-salm-title text-xl font-extrabold text-stone-900">{{ year }}</span>
    <span class="text-center font-salm-title text-[13px] font-extrabold text-stone-900">{{ name }}</span>
    <span class="size-[74px] bg-white p-1">
      <svg viewBox="0 0 21 21" class="size-full" shape-rendering="crispEdges">
        <g fill="#1C1917">
          <path d="M0 0h7v7H0zM14 0h7v7h-7zM0 14h7v7H0z" />
          <path fill="#fff" d="M1 1h5v5H1zM15 1h5v5h-5zM1 15h5v5H1z" />
          <path d="M2 2h3v3H2zM16 2h3v3h-3zM2 16h3v3H2zM8 1h2v2H8zM11 3h2v2h-2zM8 6h1v3H8zM10 8h4v1h-4zM15 9h2v2h-2zM18 8h2v3h-2zM9 11h2v2H9zM12 12h3v1h-3zM16 13h1v3h-1zM9 15h3v2H9zM13 16h2v1h-2zM18 17h2v3h-2zM8 18h2v2H8zM12 19h4v1h-4zM1 9h3v1H1zM4 11h2v2H4z" />
        </g>
      </svg>
    </span>
  </div>

  <!-- Variante orange : aperçu du formulaire et écran « Félicitations » -->
  <div
    v-else
    aria-hidden="true"
    class="flex shrink-0 flex-col items-center gap-1.5 bg-salm-accent text-white"
    :class="isMd
      ? 'h-[390px] w-[260px] rounded-[18px] px-[18px] py-[22px] shadow-[0_24px_50px_rgba(28,25,23,0.22)]'
      : 'h-[345px] w-[230px] rounded-2xl px-4 py-5 shadow-[0_20px_40px_rgba(28,25,23,0.18)]'"
  >
    <span class="text-center font-salm-title leading-[1.2] font-extrabold" :class="isMd ? 'text-[11px]' : 'text-[10px]'">{{ title.main }}</span>
    <span v-if="isMd && title.sub" class="text-[10px] tracking-[0.08em]">{{ title.sub }}</span>
    <span class="font-salm-script leading-[0.95] text-[#F5F3EF]" :class="isMd ? 'mt-2 text-[76px]' : 'mt-2.5 text-[66px]'">Salm</span>
    <span
      class="self-end font-salm-title font-medium"
      :class="isMd ? '-mt-2.5 mr-[30px] text-[26px]' : '-mt-2 mr-[26px] text-[22px]'"
    >{{ year }}</span>
    <span
      class="mt-2.5 text-center font-salm-title font-extrabold break-words"
      :class="isMd ? 'text-base' : 'text-sm'"
    >{{ name }}</span>
    <span class="text-center text-[11px] font-semibold tracking-[0.06em] text-white">{{ level }}<template v-if="number"> · <span class="whitespace-nowrap">N° {{ number }}</span></template></span>
    <!-- eslint-disable-next-line vue/no-v-html -->
    <span
      v-if="qrSvg"
      class="mt-auto block overflow-hidden rounded bg-white [&>svg]:size-full"
      :class="isMd ? 'size-[84px]' : 'size-[72px]'"
      v-html="qrSvg"
    />
    <span v-else class="mt-auto block size-[72px] rounded bg-white/22" />
  </div>
</template>
