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
  padding: 12px;
  background: #fff;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}
.vlan-panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}
.close-button {
  border: none;
  background: none;
  font-size: 16px;
  line-height: 1;
  cursor: pointer;
  color: #6b7280;
}
.vlan-empty {
  font-size: 12px;
  color: #9ca3af;
  margin: 4px 0 12px;
}
.vlan-row {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 6px;
}
.vlan-number {
  width: 56px;
  padding: 4px 6px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
}
.vlan-name {
  flex: 1;
  min-width: 0;
  padding: 4px 6px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
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
  border-color: #1f2937;
}
.vlan-delete {
  padding: 4px 8px;
  font-size: 12px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  background: #fff;
  cursor: pointer;
}
.vlan-add {
  margin-top: 4px;
  padding: 6px 10px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  background: #fff;
  cursor: pointer;
}
</style>
