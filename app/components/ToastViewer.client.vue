<script setup lang="ts">
import Viewer from '@toast-ui/editor/dist/toastui-editor-viewer'
import '@toast-ui/editor/dist/toastui-editor-viewer.css'

const props = withDefaults(defineProps<{
  content?: string
}>(), {
  content: '',
})

const viewerRef = ref<HTMLDivElement>()
let viewerInstance: Viewer | null = null

onMounted(() => {
  if (!viewerRef.value) return

  viewerInstance = new Viewer({
    el: viewerRef.value,
    initialValue: props.content,
    usageStatistics: false,
  })
})

watch(() => props.content, (newVal) => {
  if (!viewerInstance) return
  viewerInstance.setMarkdown(newVal || '')
})

onBeforeUnmount(() => {
  viewerInstance?.destroy()
  viewerInstance = null
})
</script>

<template>
  <div ref="viewerRef" />
</template>
