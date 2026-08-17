<script setup>
import { computed } from 'vue'
import { usePlanStore } from '../stores/plan'

const props = defineProps({
  bus: { type: Object, required: true },
})

const store = usePlanStore()

const route = computed(() => store.busRoutes.get(props.bus.id))
const memberLinkIds = computed(() => route.value?.memberLinkIds ?? [])
const trunkPoints = computed(() => (route.value ? route.value.trunk.map((p) => `${p.x},${p.y}`).join(' ') : ''))
const isTrunkSelected = computed(
  () => memberLinkIds.value.length > 0 && memberLinkIds.value.every((id) => store.selectedIds.includes(id)),
)

function derivationPoints(linkId) {
  const pts = route.value?.derivations.get(linkId)
  return pts ? pts.map((p) => `${p.x},${p.y}`).join(' ') : ''
}

function vlanColor(linkId) {
  const link = store.links.find((l) => l.id === linkId)
  const vlan = link ? store.vlans.find((v) => v.id === link.vlanId) : null
  return vlan?.color ?? 'var(--color-link)'
}

// Le tronc sélectionne tout le groupe (mène au bouton « Dégrouper » dans le
// panneau de propriétés) ; une dérivation sélectionne son câble individuel,
// comme un câble normal — pour rester éditable (ports, VLAN...) sans dégrouper.
function onTrunkPointerDown(event) {
  event.stopPropagation()
  store.selectIds(memberLinkIds.value, { additive: event.ctrlKey || event.metaKey })
}

function onDerivationPointerDown(event, linkId) {
  event.stopPropagation()
  if (event.ctrlKey || event.metaKey) {
    store.toggleSelected(linkId)
  } else {
    store.select(linkId)
  }
}
</script>

<template>
  <g v-if="route" class="bus-group">
    <polyline
      :points="trunkPoints"
      fill="none"
      stroke="transparent"
      stroke-width="16"
      class="hit-area"
      @pointerdown="onTrunkPointerDown"
    />
    <polyline :points="trunkPoints" fill="none" class="bus-trunk" :class="{ selected: isTrunkSelected }" />

    <template v-for="linkId in memberLinkIds" :key="linkId">
      <polyline
        :points="derivationPoints(linkId)"
        fill="none"
        stroke="transparent"
        stroke-width="12"
        class="hit-area"
        @pointerdown="onDerivationPointerDown($event, linkId)"
      />
      <polyline
        :points="derivationPoints(linkId)"
        fill="none"
        :stroke="vlanColor(linkId)"
        class="bus-derivation"
        :class="{ selected: store.selectedIds.includes(linkId) && !isTrunkSelected }"
      />
    </template>

    <circle :cx="route.busPoint.x" :cy="route.busPoint.y" r="3" class="bus-point" />
  </g>
</template>

<style scoped>
.bus-trunk {
  stroke: var(--color-link);
  stroke-width: 3;
}
.bus-trunk.selected {
  stroke: var(--color-accent);
}
.bus-derivation {
  stroke-width: 1.5;
}
.bus-derivation.selected {
  stroke: var(--color-accent);
  stroke-width: 2.5;
}
.bus-point {
  fill: var(--color-link);
}
.hit-area {
  cursor: pointer;
}
</style>
