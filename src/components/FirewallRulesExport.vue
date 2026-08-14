<script setup>
import { computed } from 'vue'
import { formatWhitelist } from '../utils/exposedPorts'

const props = defineProps({
  node: { type: Object, required: true },
})

const ROW_HEIGHT = 28
const HEADER_HEIGHT = 20
const WIDTH = 280

const rules = computed(() => props.node.exposedPorts)
const height = computed(() => HEADER_HEIGHT + rules.value.length * ROW_HEIGHT + 8)
const originX = computed(() => props.node.x + 40)
const originY = computed(() => props.node.y + 40)

function summaryLine(rule) {
  const status = rule.status === 'inactive' ? ', inactif' : ''
  const direction = rule.direction === 'inbound' ? 'entrant' : 'sortant'
  return `${rule.alias || 'sans alias'} — ${rule.protocol.toUpperCase()} ${rule.port ?? '?'} → ${rule.destinationIp || '?'}:${rule.destinationPort ?? '?'} (${direction}${status})`
}
</script>

<template>
  <g v-if="rules.length" :transform="`translate(${originX}, ${originY})`" class="firewall-rules">
    <rect :width="WIDTH" :height="height" rx="6" class="rules-bg" />
    <text x="8" y="14" class="rules-title">Ports exposés — {{ node.label }}</text>
    <g v-for="(rule, i) in rules" :key="rule.id" :transform="`translate(8, ${HEADER_HEIGHT + i * ROW_HEIGHT})`">
      <text y="10" class="rules-row">{{ summaryLine(rule) }}</text>
      <text y="22" class="rules-row-small">Whitelist : {{ formatWhitelist(rule) || 'aucune' }}</text>
    </g>
  </g>
</template>

<style scoped>
.rules-bg {
  fill: var(--color-surface);
  stroke: var(--color-border-strong);
  stroke-width: 1;
}
.rules-title {
  font-size: 10px;
  font-weight: 700;
  fill: var(--color-text);
}
.rules-row {
  font-size: 9px;
  fill: var(--color-text);
}
.rules-row-small {
  font-size: 8px;
  fill: var(--color-text-muted);
  font-family: var(--font-mono);
}
</style>
