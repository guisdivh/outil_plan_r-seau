<script setup>
import { computed } from 'vue'
import { usePlanStore } from '../stores/plan'

const props = defineProps({
  tunnel: { type: Object, required: true },
})

const store = usePlanStore()

const endpoints = computed(() => store.tunnelEndpoints.get(props.tunnel.id) ?? null)
const isSelected = computed(() => store.selectedIds.includes(props.tunnel.id))
const midPoint = computed(() => {
  if (!endpoints.value) return { x: 0, y: 0 }
  const { source, target } = endpoints.value
  return { x: (source.x + target.x) / 2, y: (source.y + target.y) / 2 }
})

function onLinePointerDown(event) {
  event.stopPropagation()
  if (event.ctrlKey || event.metaKey) {
    store.toggleSelected(props.tunnel.id)
  } else {
    store.select(props.tunnel.id)
  }
}

function rename() {
  const name = window.prompt('Nom du tunnel', props.tunnel.name || '')
  if (name !== null) store.renameTunnel(props.tunnel.id, name)
}

function editPhase() {
  const phase = window.prompt('Phase / protocole (ex: IKEv2, Phase 2 AES256)', props.tunnel.phase || '')
  if (phase !== null) store.setTunnelPhase(props.tunnel.id, phase)
}
</script>

<template>
  <g v-if="endpoints" class="tunnel-link-group">
    <!-- Zone de clic élargie invisible -->
    <line
      :x1="endpoints.source.x"
      :y1="endpoints.source.y"
      :x2="endpoints.target.x"
      :y2="endpoints.target.y"
      stroke="transparent"
      stroke-width="14"
      class="hit-area"
      @pointerdown="onLinePointerDown"
    />
    <line
      :x1="endpoints.source.x"
      :y1="endpoints.source.y"
      :x2="endpoints.target.x"
      :y2="endpoints.target.y"
      class="tunnel-line"
      :class="{ selected: isSelected }"
    />
    <text
      :x="midPoint.x"
      :y="midPoint.y - 6"
      text-anchor="middle"
      class="tunnel-label"
      @pointerdown.stop
      @dblclick.stop="rename"
    >
      🔒 {{ tunnel.name || 'tunnel IPsec' }}
    </text>
    <text
      v-if="tunnel.phase || isSelected"
      :x="midPoint.x"
      :y="midPoint.y + 10"
      text-anchor="middle"
      class="tunnel-phase"
      @pointerdown.stop
      @dblclick.stop="editPhase"
    >
      {{ tunnel.phase || 'définir la phase' }}
    </text>
  </g>
</template>

<style scoped>
.tunnel-line {
  stroke: #7c3aed;
  stroke-width: 2;
  stroke-dasharray: 6 4;
  pointer-events: none;
}
.tunnel-line.selected {
  stroke-width: 3;
}
.hit-area {
  cursor: pointer;
}
.tunnel-label {
  font-size: 10px;
  fill: #7c3aed;
  font-weight: 600;
  cursor: pointer;
  user-select: none;
}
.tunnel-phase {
  font-size: 9px;
  fill: #7c3aed;
  font-style: italic;
  cursor: pointer;
  user-select: none;
}
</style>
