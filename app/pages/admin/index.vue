<script setup lang="ts">
import { Line, Bar, Doughnut } from 'vue-chartjs'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
  Filler,
)

definePageMeta({
  layout: 'admin',
})

const periodOptions = [
  { label: '7 jours', value: '7d' },
  { label: '30 jours', value: '30d' },
  { label: '90 jours', value: '90d' },
  { label: '12 mois', value: '12m' },
]

const downloadsPeriod = ref('30d')
const visitsPeriod = ref('30d')

const { data: summary } = await useFetch('/api/stats/summary')

const { data: downloadsStats } = await useFetch('/api/stats/downloads', {
  query: { period: downloadsPeriod },
  watch: [downloadsPeriod],
})

const { data: visitsStats } = await useFetch('/api/stats/visits', {
  query: { period: visitsPeriod },
  watch: [visitsPeriod],
})

const summaryCards = computed(() => [
  { label: 'Téléchargements', value: summary.value?.totalDownloads ?? 0, icon: 'M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4', color: 'text-blue-600 bg-blue-50' },
  { label: 'Visites', value: summary.value?.totalVisits ?? 0, icon: 'M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z', color: 'text-emerald-600 bg-emerald-50' },
  { label: 'Abonnés newsletter', value: summary.value?.totalSubscribers ?? 0, icon: 'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z', color: 'text-amber-600 bg-amber-50' },
  { label: 'Magazines publiés', value: summary.value?.totalMagazines ?? 0, icon: 'M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z', color: 'text-purple-600 bg-purple-50' },
])

const doughnutColors = [
  '#3b82f6', '#f59e0b', '#10b981', '#8b5cf6', '#ef4444', '#06b6d4', '#f97316', '#ec4899',
]

const downloadsChartData = computed(() => ({
  labels: downloadsStats.value?.labels ?? [],
  datasets: [
    {
      label: 'Téléchargements',
      data: downloadsStats.value?.datasets?.[0]?.data ?? [],
      borderColor: '#3b82f6',
      backgroundColor: 'rgba(59, 130, 246, 0.1)',
      fill: true,
      tension: 0.3,
    },
  ],
}))

const visitsChartData = computed(() => ({
  labels: visitsStats.value?.labels ?? [],
  datasets: [
    {
      label: 'Visites',
      data: visitsStats.value?.datasets?.[0]?.data ?? [],
      borderColor: '#10b981',
      backgroundColor: 'rgba(16, 185, 129, 0.1)',
      fill: true,
      tension: 0.3,
    },
  ],
}))

const magazineChartData = computed(() => {
  const items = downloadsStats.value?.byMagazine ?? []
  return {
    labels: items.map((m: any) => m.name),
    datasets: [
      {
        data: items.map((m: any) => m.count),
        backgroundColor: doughnutColors.slice(0, items.length),
      },
    ],
  }
})

const studyLevelChartData = computed(() => {
  const items = downloadsStats.value?.byStudyLevel ?? []
  return {
    labels: items.map((s: any) => s.level),
    datasets: [
      {
        label: 'Téléchargements',
        data: items.map((s: any) => s.count),
        backgroundColor: '#f59e0b',
      },
    ],
  }
})

const lineOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
  },
  scales: {
    y: { beginAtZero: true, ticks: { precision: 0 } },
  },
}

const doughnutOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { position: 'bottom' as const },
  },
}

const barOptions = {
  responsive: true,
  maintainAspectRatio: false,
  indexAxis: 'y' as const,
  plugins: {
    legend: { display: false },
  },
  scales: {
    x: { beginAtZero: true, ticks: { precision: 0 } },
  },
}
</script>

<template>
  <div>
    <h1 class="text-xl font-semibold text-gray-800 mb-6">Tableau de bord</h1>

    <!-- Cartes chiffres clés -->
    <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
      <div
        v-for="card in summaryCards"
        :key="card.label"
        class="rounded-lg border border-gray-200 bg-white p-5 shadow-sm"
      >
        <div class="flex items-center gap-3">
          <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg" :class="card.color">
            <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
              <path stroke-linecap="round" stroke-linejoin="round" :d="card.icon" />
            </svg>
          </div>
          <div>
            <p class="text-2xl font-bold text-gray-900">{{ card.value.toLocaleString('fr-FR') }}</p>
            <p class="text-xs text-gray-500">{{ card.label }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Courbe téléchargements -->
    <div class="mb-6 rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
      <div class="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 class="text-base font-semibold text-gray-800">Téléchargements par période</h2>
        <div class="flex gap-1">
          <button
            v-for="opt in periodOptions"
            :key="opt.value"
            class="rounded-md px-3 py-1 text-xs font-medium transition-colors"
            :class="downloadsPeriod === opt.value
              ? 'bg-blue-100 text-blue-700'
              : 'text-gray-500 hover:bg-gray-100'"
            @click="downloadsPeriod = opt.value"
          >
            {{ opt.label }}
          </button>
        </div>
      </div>
      <div class="h-64">
        <Line
          v-if="downloadsStats?.datasets?.[0]?.data?.length"
          :data="downloadsChartData"
          :options="lineOptions"
        />
        <p v-else class="flex h-full items-center justify-center text-sm text-gray-400">
          Aucune donnée disponible
        </p>
      </div>
    </div>

    <!-- Répartition par magazine + niveau d'étude -->
    <div class="mb-6 grid gap-6 lg:grid-cols-2">
      <div class="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
        <h2 class="mb-4 text-base font-semibold text-gray-800">Par magazine</h2>
        <div class="h-64">
          <Doughnut
            v-if="downloadsStats?.byMagazine?.length"
            :data="magazineChartData"
            :options="doughnutOptions"
          />
          <p v-else class="flex h-full items-center justify-center text-sm text-gray-400">
            Aucune donnée disponible
          </p>
        </div>
      </div>
      <div class="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
        <h2 class="mb-4 text-base font-semibold text-gray-800">Par niveau d'étude</h2>
        <div class="h-64">
          <Bar
            v-if="downloadsStats?.byStudyLevel?.length"
            :data="studyLevelChartData"
            :options="barOptions"
          />
          <p v-else class="flex h-full items-center justify-center text-sm text-gray-400">
            Aucune donnée disponible
          </p>
        </div>
      </div>
    </div>

    <!-- Courbe visites -->
    <div class="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
      <div class="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 class="text-base font-semibold text-gray-800">Visites par période</h2>
        <div class="flex gap-1">
          <button
            v-for="opt in periodOptions"
            :key="opt.value"
            class="rounded-md px-3 py-1 text-xs font-medium transition-colors"
            :class="visitsPeriod === opt.value
              ? 'bg-emerald-100 text-emerald-700'
              : 'text-gray-500 hover:bg-gray-100'"
            @click="visitsPeriod = opt.value"
          >
            {{ opt.label }}
          </button>
        </div>
      </div>
      <div class="h-64">
        <Line
          v-if="visitsStats?.datasets?.[0]?.data?.length"
          :data="visitsChartData"
          :options="lineOptions"
        />
        <p v-else class="flex h-full items-center justify-center text-sm text-gray-400">
          Aucune donnée disponible
        </p>
      </div>
    </div>
  </div>
</template>
