<script setup>
import { onMounted, onUnmounted } from 'vue'
import NodePalette from './components/NodePalette.vue'
import CanvasBoard from './components/CanvasBoard.vue'
import Toolbar from './components/Toolbar.vue'
import { usePlanStore } from './stores/plan'

const store = usePlanStore()

onMounted(() => {
  store.loadFromLocalStorage()
})

// Sauvegarde locale automatique, débouncée, à chaque changement du plan.
let saveTimeout = null
const unsubscribe = store.$subscribe(() => {
  clearTimeout(saveTimeout)
  saveTimeout = setTimeout(() => store.saveToLocalStorage(), 300)
})
onUnmounted(() => {
  clearTimeout(saveTimeout)
  unsubscribe()
})
</script>

<template>
  <div class="app">
    <Toolbar />
    <div class="body">
      <NodePalette />
      <CanvasBoard />
    </div>
  </div>
</template>

<style scoped>
.app {
  display: flex;
  flex-direction: column;
  width: 100vw;
  height: 100vh;
}
.body {
  flex: 1;
  display: flex;
  min-height: 0;
}
</style>
