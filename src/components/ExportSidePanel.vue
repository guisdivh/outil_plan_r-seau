<script setup>
import { computed } from 'vue'
import { usePlanStore } from '../stores/plan'
import { computePlanBounds } from '../utils/planBounds'
import { SIDE_PANEL_WIDTH, SIDE_PANEL_GAP, legendHeight, cablingHeight } from '../utils/exportSidePanel'

const store = usePlanStore()

// Position en coordonnées "plan" (pas écran) : ce composant est rendu dans le
// même groupe transformé (pan/zoom) que le reste, donc ses coordonnées sont
// déjà dans le bon espace — pas besoin de mesurer le DOM écran, qui donnerait
// une position fausse dès que la vue est zoomée ou déplacée (voir prompt 21).
const bounds = computed(() =>
  computePlanBounds(store.nodes, store.zones, store.racks, store.sites, store.links),
)
const originX = computed(() => bounds.value.maxX + SIDE_PANEL_GAP)
const originY = computed(() => bounds.value.minY)

const legendH = computed(() => legendHeight(store.vlans.length))
// Section « Branchements » sous la légende VLAN, avec un petit espace entre
// les deux (0 si pas de légende, pour ne pas laisser un trou vide au-dessus).
const cablingOriginY = computed(() => legendH.value + (legendH.value ? 12 : 0))

function nodeLabel(id) {
  return store.nodes.find((n) => n.id === id)?.label ?? '?'
}

// Une ligne synthétique par câble : équipement[:port] → équipement[:port], et
// son VLAN en second niveau. Le détail exhaustif reste dans le CSV branchements.
const cablingLines = computed(() =>
  store.links.map((l) => {
    const source = nodeLabel(l.sourceId) + (l.sourcePort ? `:${l.sourcePort}` : '')
    const target = nodeLabel(l.targetId) + (l.targetPort ? `:${l.targetPort}` : '')
    const vlan = store.vlans.find((v) => v.id === l.vlanId)
    return {
      id: l.id,
      route: `${source} → ${target}`,
      vlanLabel: vlan ? `VLAN ${vlan.number} — ${vlan.name}` : 'sans VLAN',
    }
  }),
)
const cablingH = computed(() => cablingHeight(cablingLines.value.length))
</script>

<template>
  <g
    v-if="store.vlans.length || cablingLines.length"
    :transform="`translate(${originX}, ${originY})`"
    class="export-side-panel"
  >
    <g v-if="store.vlans.length" class="legend-block">
      <rect :width="SIDE_PANEL_WIDTH" :height="legendH" rx="6" class="panel-bg" />
      <text x="10" y="18" class="panel-title">VLANs</text>
      <g v-for="(vlan, i) in store.vlans" :key="vlan.id" :transform="`translate(10, ${32 + i * 18})`">
        <circle cx="4" cy="-4" r="5" :fill="vlan.color" />
        <text x="14" y="0" class="panel-item">{{ vlan.number }} — {{ vlan.name }}</text>
      </g>
    </g>

    <g v-if="cablingLines.length" :transform="`translate(0, ${cablingOriginY})`" class="cabling-block">
      <rect :width="SIDE_PANEL_WIDTH" :height="cablingH" rx="6" class="panel-bg" />
      <text x="10" y="18" class="panel-title">Branchements</text>
      <g v-for="(line, i) in cablingLines" :key="line.id" :transform="`translate(10, ${32 + i * 28})`">
        <text y="0" class="panel-item cabling-route">{{ line.route }}</text>
        <text y="14" class="panel-item cabling-vlan">{{ line.vlanLabel }}</text>
      </g>
    </g>
  </g>
</template>

<style scoped>
.panel-bg {
  fill: var(--color-surface);
  stroke: var(--color-border-strong);
  stroke-width: 1;
}
.panel-title {
  font-size: 11px;
  font-weight: 700;
  fill: var(--color-text);
}
.panel-item {
  font-size: 10px;
  fill: var(--color-text);
}
.cabling-route {
  font-weight: 600;
}
.cabling-vlan {
  font-size: 9px;
  fill: var(--color-text-muted);
}
</style>
