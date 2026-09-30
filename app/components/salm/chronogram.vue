<script setup lang="ts">
import '~/assets/css/salm.css'
import { formatDayLong, formatDayTab, formatHour } from '#shared/utils/salm'
import type { SalmPublicDay } from '#shared/types/salm'

// Chronogramme jour par jour (FR-014, FR-015). Desktop : une colonne par jour ; mobile : onglets ARIA.
const props = defineProps<{
  year: number
  days: SalmPublicDay[]
  programPdfPath: string | null
  studentsOpen: boolean
}>()

const uid = useId()
const selected = ref(0)
// Onglets (mobile) : le jour choisi glisse depuis le côté de son onglet
const tabSlide = ref<'' | 'salm-slide-next' | 'salm-slide-prev'>('')
watch(selected, (to, from) => {
  tabSlide.value = to > from ? 'salm-slide-next' : 'salm-slide-prev'
})
const isMobile = ref(false)
const tabRefs = ref<HTMLButtonElement[]>([])
let media: MediaQueryList | undefined
const onMedia = () => { isMobile.value = !!media?.matches }

onMounted(() => {
  media = window.matchMedia('(max-width: 767px)')
  onMedia()
  media.addEventListener('change', onMedia)
})
onUnmounted(() => media?.removeEventListener('change', onMedia))

function selectTab(index: number) {
  selected.value = index
  tabRefs.value[index]?.focus()
}

function onTabKeydown(event: KeyboardEvent) {
  const last = props.days.length - 1
  const moves: Record<string, number> = {
    ArrowRight: selected.value === last ? 0 : selected.value + 1,
    ArrowLeft: selected.value === 0 ? last : selected.value - 1,
    Home: 0,
    End: last,
  }
  if (!(event.key in moves)) return
  event.preventDefault()
  selectTab(moves[event.key]!)
}

function capitalize(text: string) {
  return text.charAt(0).toLocaleUpperCase('fr-FR') + text.slice(1)
}
</script>

<template>
  <section id="chronogramme" class="scroll-mt-24 bg-salm-surface px-5 py-16 md:px-12 md:py-[100px] xl:px-24">
    <div class="flex flex-col gap-8 md:gap-11">
      <div class="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div class="flex flex-col gap-2.5 md:gap-3.5">
          <span class="font-salm-title text-xs font-bold tracking-[0.16em] text-salm-accent-text md:text-[13px]">HEURE PAR HEURE</span>
          <h2 class="font-salm-title text-[32px] font-extrabold tracking-[-0.03em] text-salm-ink md:text-5xl">Chronogramme SALM {{ year }}</h2>
        </div>
        <a
          v-if="programPdfPath"
          :href="programPdfPath"
          download
          class="flex h-12 items-center gap-2.5 self-start rounded-xl border border-salm-line-strong px-5 text-[15px] font-semibold text-salm-ink-strong transition-colors hover:border-salm-ink-muted"
        >
          <svg class="size-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" /></svg>
          Télécharger le programme (PDF)
        </a>
      </div>

      <!-- Onglets (mobile) -->
      <div
        v-if="days.length > 1"
        role="tablist"
        aria-label="Jour du salon"
        class="grid gap-1 rounded-[14px] bg-salm-bg p-1 md:hidden"
        :style="{ gridTemplateColumns: `repeat(${days.length}, minmax(0, 1fr))` }"
      >
        <button
          v-for="(day, i) in days"
          :id="`${uid}-tab-${i}`"
          :key="day.date"
          :ref="(el) => { if (el) tabRefs[i] = el as HTMLButtonElement }"
          type="button"
          role="tab"
          :aria-selected="selected === i ? 'true' : 'false'"
          :aria-controls="`${uid}-panel-${i}`"
          :tabindex="selected === i ? 0 : -1"
          class="h-11 rounded-[10px] text-sm transition-colors"
          :class="selected === i ? 'bg-salm-accent font-bold text-white' : 'font-semibold text-salm-ink-muted hover:text-salm-ink-strong'"
          @click="selected = i"
          @keydown="onTabKeydown"
        >
          {{ day.label }} · {{ formatDayTab(day.date) }}
        </button>
      </div>

      <div class="grid grid-cols-1 gap-6 lg:grid-cols-2" data-motion="hours">
        <div
          v-for="(day, dayIndex) in days"
          :id="`${uid}-panel-${dayIndex}`"
          :key="day.date"
          :role="isMobile && days.length > 1 ? 'tabpanel' : undefined"
          :aria-labelledby="isMobile && days.length > 1 ? `${uid}-tab-${dayIndex}` : undefined"
          :tabindex="isMobile && days.length > 1 ? 0 : undefined"
          class="self-start rounded-3xl border border-salm-border bg-salm-bg px-5 pt-2 pb-5 md:px-8"
          :class="[{ 'hidden md:block': days.length > 1 && dayIndex !== selected }, dayIndex === selected ? tabSlide : '', dayIndex % 2 ? 'salm-day-2' : 'salm-day-1']"
        >
          <h3 class="flex flex-wrap items-baseline gap-x-3.5 gap-y-1 pt-6 pb-5">
            <span class="font-salm-title text-2xl font-extrabold text-salm-accent-text">{{ day.label }}</span>
            <span class="text-base font-normal text-salm-ink-muted">{{ capitalize(formatDayLong(day.date)) }}</span>
          </h3>
          <ol>
            <li
              v-for="(slot, i) in day.slots"
              :key="i"
              :data-glow="slot.isHighlighted || undefined"
              class="grid grid-cols-1 gap-1 py-4 sm:grid-cols-[136px_1fr] sm:gap-4"
              :class="slot.isHighlighted
                ? 'salm-slot-sun -mx-3 rounded-xl bg-glow/9 px-3'
                : 'border-t border-salm-surface-4'"
            >
              <span
                class="text-[13px] font-bold tabular-nums sm:text-[15px] sm:font-semibold"
                :class="slot.isHighlighted ? 'text-accent' : slot.kind === 'pause' ? 'text-salm-ink-dim' : 'text-salm-accent-text sm:text-salm-ink-soft'"
              >{{ formatHour(slot.startTime) }} – {{ formatHour(slot.endTime) }}</span>
              <div class="flex flex-col gap-1.5">
                <template v-if="slot.kind === 'panel'">
                  <span class="self-start rounded-md bg-salm-accent-tint px-[9px] py-[3px] text-xs font-bold tracking-[0.06em] text-salm-accent-text">{{ slot.title }}</span>
                  <span v-if="slot.description" class="text-base leading-[1.4] font-bold text-salm-ink">{{ slot.description }}</span>
                </template>
                <template v-else>
                  <span
                    class="text-base leading-[1.4]"
                    :class="slot.isHighlighted ? 'font-bold text-salm-highlight' : slot.kind === 'pause' ? 'text-salm-ink-dim' : 'font-bold text-salm-ink'"
                  >{{ slot.title }}</span>
                  <span v-if="slot.description" class="text-sm leading-normal text-salm-ink-muted">{{ slot.description }}</span>
                </template>
              </div>
            </li>
          </ol>
          <div
            v-if="dayIndex === days.length - 1 && days.length > 1"
            class="mt-3 flex items-center justify-between gap-4 rounded-[14px] bg-salm-surface-2 p-5"
          >
            <span class="text-[15px] leading-[1.45] text-salm-ink-soft">Ton badge est valable {{ days.length === 2 ? 'les deux jours' : 'tous les jours du salon' }}.</span>
            <NuxtLink v-if="studentsOpen" to="/salm/inscription-etudiant" class="shrink-0 text-[15px] font-bold text-salm-accent-text hover:text-salm-accent-soft">M'inscrire →</NuxtLink>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
