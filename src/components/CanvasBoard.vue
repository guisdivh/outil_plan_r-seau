<script setup>
import { onMounted, onUnmounted } from 'vue'
import { usePlanStore } from '../stores/plan'
import NetworkNode from './NetworkNode.vue'
import NetworkLink from './NetworkLink.vue'
import ZoneRect from './ZoneRect.vue'

const store = usePlanStore()

function onBackgroundClick() {
  store.clearSelection()
  store.cancelLinking()
}

function onKeydown(event) {
  if (event.key === 'Delete' || event.key === 'Backspace') {
    // Backspace ne doit pas déclencher la navigation retour du navigateur.
    if (event.key === 'Backspace' && event.target !== document.body) return
    store.deleteSelection()
  }
  if (event.key === 'Escape') {
    store.clearSelection()
    store.cancelLinking()
  }
}

onMounted(() => window.addEventListener('keydown', onKeydown))
onUnmounted(() => window.removeEventListener('keydown', onKeydown))
</script>

<template>
  <div class="canvas-board">
    <svg width="100%" height="100%" @pointerdown="onBackgroundClick">
      <rect width="100%" height="100%" fill="#fafafa" />

      <ZoneRect v-for="zone in store.zones" :key="zone.id" :zone="zone" />
      <NetworkLink v-for="link in store.links" :key="link.id" :link="link" />
      <NetworkNode v-for="node in store.nodes" :key="node.id" :node="node" />
    </svg>
  </div>
</template>

<style scoped>
.canvas-board {
  flex: 1;
  height: 100%;
}
svg {
  display: block;
}
</style>
