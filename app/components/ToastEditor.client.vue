<script setup lang="ts">
import Editor from '@toast-ui/editor'
import '@toast-ui/editor/dist/toastui-editor.css'

const props = withDefaults(defineProps<{
  modelValue?: string
  height?: string
  initialEditType?: 'markdown' | 'wysiwyg'
  previewStyle?: 'vertical' | 'tab'
  placeholder?: string
  language?: string
}>(), {
  modelValue: '',
  height: '400px',
  initialEditType: 'wysiwyg',
  previewStyle: 'vertical',
  placeholder: 'Commencez à écrire...',
  language: 'fr-FR',
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const editorRef = ref<HTMLDivElement>()
let editorInstance: Editor | null = null

onMounted(() => {
  if (!editorRef.value) return

  editorInstance = new Editor({
    el: editorRef.value,
    height: props.height,
    initialEditType: props.initialEditType,
    previewStyle: props.previewStyle,
    initialValue: props.modelValue,
    placeholder: props.placeholder,
    language: props.language,
    usageStatistics: false,
    events: {
      change: () => {
        if (!editorInstance) return
        const markdown = editorInstance.getMarkdown()
        emit('update:modelValue', markdown)
      },
    },
  })
})

watch(() => props.modelValue, (newVal) => {
  if (!editorInstance) return
  if (editorInstance.getMarkdown() !== newVal) {
    editorInstance.setMarkdown(newVal || '')
  }
})

onBeforeUnmount(() => {
  editorInstance?.destroy()
  editorInstance = null
})

defineExpose({
  getEditor: () => editorInstance,
  getMarkdown: () => editorInstance?.getMarkdown() ?? '',
  getHTML: () => editorInstance?.getHTML() ?? '',
})
</script>

<template>
  <div ref="editorRef" />
</template>
