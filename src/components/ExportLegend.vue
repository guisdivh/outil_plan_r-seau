<script setup>
import { computed } from 'vue'
import { usePlanStore } from '../stores/plan'
import { computePlanBounds } from '../utils/planBounds'

const store = usePlanStore()

// Position en coordonnées "plan" (pas écran) : ce composant est rendu dans le
// même groupe transformé (pan/zoom) que le reste, donc ses coordonnées sont
// déjà dans le bon espace — pas besoin de mesurer le DOM écran, qui donnerait
// une position fausse dès que la vue est zoomée ou déplacée (voir prompt 21).
const bounds = computed(() =>
  computePlanBounds(store.nodes, store.zones, store.racks, store.sites, store.links),
)
const originX = computed(() => bounds.value.maxX + 20)
const originY = computed(() => bounds.value.minY)
const boxHeight = computed(() => 26 + store.vlans.length * 18)
</script>

<template>
  <g v-if="store.vlans.length" :transform="`translate(${originX}, ${originY})`" class="export-legend">
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
