<script setup>
import { computed, ref, watch } from 'vue'
import { usePlanStore } from '../stores/plan'
import { EQUIPMENT_TYPES } from '../constants/equipmentTypes'
import { INTERFACE_ROLES } from '../utils/interfaces'

const store = usePlanStore()
const nameDraft = ref('')

const selectedNodes = computed(() => store.selectedNodes)
const singleNode = computed(() => (selectedNodes.value.length === 1 ? selectedNodes.value[0] : null))

watch(
  singleNode,
  (node) => {
    nameDraft.value = node ? node.label : ''
  },
  { immediate: true },
)

function commitName() {
  if (singleNode.value) store.renameNode(singleNode.value.id, nameDraft.value)
}

function onTypeChange(event) {
  const type = event.target.value
  if (singleNode.value) {
    store.setNodeType(singleNode.value.id, type)
  } else if (selectedNodes.value.length > 1) {
    store.setNodesType(
      selectedNodes.value.map((n) => n.id),
      type,
    )
  }
}

const zoneName = computed(() => {
  if (!singleNode.value?.zoneId) return null
  return store.zones.find((z) => z.id === singleNode.value.zoneId)?.name ?? null
})
const rackName = computed(() => {
  if (!singleNode.value?.rackId) return null
  return store.racks.find((r) => r.id === singleNode.value.rackId)?.name ?? null
})
</script>

<template>
  <aside v-if="selectedNodes.length" class="properties-panel">
    <h2>Propriétés</h2>

    <template v-if="singleNode">
      <label class="field">
        <span>Nom</span>
        <input v-model="nameDraft" type="text" @change="commitName" />
      </label>
      <label class="field">
        <span>Type</span>
        <select :value="singleNode.type" @change="onTypeChange">
          <option v-for="t in EQUIPMENT_TYPES" :key="t.type" :value="t.type">{{ t.label }}</option>
        </select>
      </label>
      <p class="info-line">Zone : {{ zoneName ?? 'aucune' }}</p>
      <p class="info-line">Baie : {{ rackName ?? 'aucune' }}</p>

      <div class="interfaces">
        <div class="interfaces-header">
          <span>Interfaces</span>
          <button type="button" @click="store.addInterface(singleNode.id)">+ Interface</button>
        </div>
        <p v-if="!singleNode.interfaces.length" class="multi-hint">Aucune interface.</p>
        <div v-for="iface in singleNode.interfaces" :key="iface.id" class="iface-row">
          <div class="iface-row-top">
            <select
              :value="iface.role"
              @change="store.updateInterface(singleNode.id, iface.id, { role: $event.target.value })"
            >
              <option v-for="r in INTERFACE_ROLES" :key="r.value" :value="r.value">{{ r.label }}</option>
            </select>
            <button type="button" class="iface-delete" @click="store.removeInterface(singleNode.id, iface.id)">×</button>
          </div>
          <input
            type="text"
            placeholder="Adresse IP"
            :value="iface.ip"
            @change="store.updateInterface(singleNode.id, iface.id, { ip: $event.target.value })"
          />
          <input
            type="text"
            placeholder="Masque (/24 ou 255.255.255.0)"
            :value="iface.mask"
            @change="store.updateInterface(singleNode.id, iface.id, { mask: $event.target.value })"
          />
          <select
            :value="iface.vlanId ?? ''"
            @change="store.updateInterface(singleNode.id, iface.id, { vlanId: $event.target.value || null })"
          >
            <option value="">Sans VLAN</option>
            <option v-for="v in store.vlans" :key="v.id" :value="v.id">{{ v.number }} · {{ v.name }}</option>
          </select>
        </div>
      </div>
    </template>

    <template v-else>
      <p class="multi-hint">{{ selectedNodes.length }} équipements sélectionnés.</p>
      <label class="field">
        <span>Type (appliqué à tous)</span>
        <select value="" @change="onTypeChange">
          <option value="" disabled>Choisir…</option>
          <option v-for="t in EQUIPMENT_TYPES" :key="t.type" :value="t.type">{{ t.label }}</option>
        </select>
      </label>
      <p class="multi-hint">Le nom ne peut être édité qu'en sélection simple.</p>
    </template>
  </aside>
</template>

<style scoped>
.properties-panel {
  width: 260px;
  padding: var(--space-4);
  background: var(--color-surface);
  border-left: 1px solid var(--color-border);
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  overflow-y: auto;
}
.properties-panel h2 {
  font-size: var(--text-sm);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--color-text-muted);
  margin: 0;
}
.field {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  font-size: var(--text-sm);
  color: var(--color-text);
}
.field input,
.field select {
  padding: var(--space-2);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  color: var(--color-text);
}
.info-line {
  margin: 0;
  font-size: var(--text-sm);
  color: var(--color-text-muted);
}
.multi-hint {
  margin: 0;
  font-size: var(--text-sm);
  color: var(--color-text-muted);
}
.interfaces {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  padding-top: var(--space-2);
  border-top: 1px solid var(--color-border);
}
.interfaces-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--color-text);
}
.interfaces-header button {
  padding: 3px var(--space-2);
  font-size: var(--text-xs);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: var(--color-surface);
  color: var(--color-text);
  cursor: pointer;
}
.interfaces-header button:hover {
  background: var(--color-surface-2);
}
.iface-row {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  padding: var(--space-2);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface-2);
}
.iface-row input,
.iface-row select {
  padding: 5px 6px;
  font-size: var(--text-sm);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: var(--color-surface);
  color: var(--color-text);
}
.iface-row-top {
  display: flex;
  gap: var(--space-1);
}
.iface-row-top select {
  flex: 1;
}
.iface-delete {
  width: 24px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: var(--color-surface);
  cursor: pointer;
  color: var(--color-danger);
}
</style>
