<script setup>
import { computed } from 'vue'
import { usePlanStore } from '../stores/plan'

const store = usePlanStore()

const width = computed(() => {
  const svg = document.querySelector('.canvas-board svg')
  return svg ? svg.getBoundingClientRect().width : 800
})
const originX = computed(() => Math.max(0, width.value - 200))
const boxHeight = computed(() => 26 + store.vlans.length * 18)
</script>

<template>
  <g v-if="store.vlans.length" :transform="`translate(${originX}, 20)`" class="export-legend">
    <rect width="180" :height="boxHeight" rx="6" class="legend-bg" />
    <text x="10" y="18" class="legend-title">VLANs</text>
    <g v-for="(vlan, i) in store.vlans" :key="vlan.id" :transform="`translate(10, ${32 + i * 18})`">
      <circle cx="4" cy="-4" r="5" :fill="vlan.color" />
      <text x="14" y="0" class="legend-item">{{ vlan.number }} — {{ vlan.name }}</text>
    </g>
  </g>
</template>

<style scoped>
.legend-bg {
  fill: var(--color-surface);
  stroke: var(--color-border-strong);
  stroke-width: 1;
}
.legend-title {
  font-size: 11px;
  font-weight: 700;
  fill: var(--color-text);
}
.legend-item {
  font-size: 10px;
  fill: var(--color-text);
}
</style>
