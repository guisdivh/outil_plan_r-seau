<script setup>
import { usePlanStore } from '../stores/plan'

defineEmits(['close'])

const store = usePlanStore()

const PALETTE = ['#a78bfa', '#38bdf8', '#4ade80', '#fb923c', '#f472b6', '#94a3b8']
</script>

<template>
  <div class="vlan-panel">
    <div class="vlan-panel-header">
      <strong>VLANs</strong>
      <button type="button" class="close-button" @click="$emit('close')">×</button>
    </div>

    <p v-if="!store.vlans.length" class="vlan-empty">Aucun VLAN défini.</p>

    <div v-for="vlan in store.vlans" :key="vlan.id" class="vlan-row">
      <input
        type="number"
        class="vlan-number"
        :value="vlan.number"
        @change="store.setVlanNumber(vlan.id, Number($event.target.value))"
      />
      <input
        type="text"
        class="vlan-name"
        :value="vlan.name"
        @change="store.renameVlan(vlan.id, $event.target.value)"
      />
      <div class="vlan-swatches">
        <button
          v-for="color in PALETTE"
          :key="color"
          type="button"
          class="vlan-swatch"
          :class="{ active: vlan.color === color }"
          :style="{ background: color }"
          @click="store.setVlanColor(vlan.id, color)"
        />
      </div>
      <button type="button" class="vlan-delete" @click="store.deleteVlan(vlan.id)">Suppr</button>
    </div>

    <button type="button" class="vlan-add" @click="store.addVlan()">+ VLAN</button>
  </div>
</template>

<style scoped>
.vlan-panel {
  position: absolute;
  top: 44px;
  left: 16px;
  z-index: 10;
  width: 340px;
  padding: var(--space-3);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.16);
}
.vlan-panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-2);
  color: var(--color-text);
}
.close-button {
  border: none;
  background: none;
  font-size: var(--text-md);
  line-height: 1;
  cursor: pointer;
  color: var(--color-text-muted);
}
.vlan-empty {
  font-size: var(--text-sm);
  color: var(--color-text-muted);
  margin: var(--space-1) 0 var(--space-3);
}
.vlan-row {
  display: flex;
  align-items: center;
  gap: var(--space-1);
  margin-bottom: var(--space-1);
}
.vlan-number {
  width: 56px;
  padding: var(--space-1) var(--space-2);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: var(--color-surface);
  color: var(--color-text);
}
.vlan-name {
  flex: 1;
  min-width: 0;
  padding: var(--space-1) var(--space-2);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: var(--color-surface);
  color: var(--color-text);
}
.vlan-swatches {
  display: flex;
  gap: 3px;
}
.vlan-swatch {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  border: 2px solid transparent;
  cursor: pointer;
  padding: 0;
}
.vlan-swatch.active {
  border-color: var(--color-text);
}
.vlan-delete {
  padding: var(--space-1) var(--space-2);
  font-size: var(--text-sm);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: var(--color-surface);
  color: var(--color-text);
  cursor: pointer;
}
.vlan-delete:hover,
.vlan-add:hover {
  background: var(--color-surface-2);
}
.vlan-add {
  margin-top: var(--space-1);
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  color: var(--color-text);
  cursor: pointer;
}
</style>
