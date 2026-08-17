<script setup>
import { computed, ref, watch } from 'vue'
import { usePlanStore } from '../stores/plan'
import { EQUIPMENT_TYPES } from '../constants/equipmentTypes'
import { INTERFACE_ROLES } from '../utils/interfaces'
import { canExposePorts, parseWhitelist, formatWhitelist } from '../utils/exposedPorts'
import {
  alignLeft,
  alignRight,
  alignTop,
  alignBottom,
  centerHorizontal,
  centerVertical,
  distributeHorizontal,
  distributeVertical,
} from '../utils/align'

const store = usePlanStore()
const nameDraft = ref('')

const selectedNodes = computed(() => store.selectedNodes)
const singleNode = computed(() => (selectedNodes.value.length === 1 ? selectedNodes.value[0] : null))

// Un seul câble sélectionné (et rien d'autre) : édition des ports de
// branchement. Distinct des interfaces IP et des ports exposés (sur le nœud).
const selectedLink = computed(() => {
  if (store.selectedIds.length !== 1) return null
  return store.links.find((l) => l.id === store.selectedIds[0]) ?? null
})
const linkSourceLabel = computed(
  () => store.nodes.find((n) => n.id === selectedLink.value?.sourceId)?.label ?? '?',
)
const linkTargetLabel = computed(
  () => store.nodes.find((n) => n.id === selectedLink.value?.targetId)?.label ?? '?',
)

// Plusieurs câbles (et uniquement des câbles) sélectionnés : proposer de les
// grouper en bus, ou de dégrouper si c'est déjà un bus complet.
const selectedLinks = computed(() => {
  if (store.selectedIds.length < 2) return []
  const links = store.links.filter((l) => store.selectedIds.includes(l.id))
  return links.length === store.selectedIds.length ? links : []
})
const selectedBusId = computed(() => {
  if (!selectedLinks.value.length) return null
  const busId = selectedLinks.value[0].busId
  if (!busId) return null
  return selectedLinks.value.every((l) => l.busId === busId) ? busId : null
})
function groupBus() {
  if (!store.groupSelectedLinksIntoBus()) {
    window.alert('Ces câbles ne partagent pas un équipement commun : regroupement en bus impossible.')
  }
}
function ungroupBus() {
  if (selectedBusId.value) store.ungroupBus(selectedBusId.value)
}

// Exclut les nœuds montés en baie : leur position vient du rack (syncRackNodePositions),
// pas d'eux — ni déplacés, ni comptés dans le calcul des bords de la sélection.
const alignableNodes = computed(() => selectedNodes.value.filter((n) => !n.rackId))
const rackedExcludedCount = computed(() => selectedNodes.value.length - alignableNodes.value.length)

function align(fn) {
  if (alignableNodes.value.length >= 2) store.setNodePositions(fn(alignableNodes.value))
}

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
const siteName = computed(() => {
  if (!singleNode.value?.siteId) return null
  return store.sites.find((s) => s.id === singleNode.value.siteId)?.name ?? null
})

function onWhitelistChange(ruleId, event) {
  store.updateExposedPort(singleNode.value.id, ruleId, { whitelist: parseWhitelist(event.target.value) })
}
</script>

<template>
  <aside v-if="selectedNodes.length || selectedLink || selectedLinks.length" class="properties-panel">
    <h2>Propriétés</h2>

    <template v-if="selectedLink">
      <p class="info-line">Câble : {{ linkSourceLabel }} → {{ linkTargetLabel }}</p>
      <label class="field">
        <span>Nom</span>
        <input
          type="text"
          :value="selectedLink.label"
          @change="store.renameLink(selectedLink.id, $event.target.value)"
        />
      </label>
      <label class="field">
        <span>VLAN</span>
        <select
          :value="selectedLink.vlanId ?? ''"
          @change="store.setLinkVlan(selectedLink.id, $event.target.value || null)"
        >
          <option value="">Sans VLAN</option>
          <option v-for="v in store.vlans" :key="v.id" :value="v.id">{{ v.number }} · {{ v.name }}</option>
        </select>
      </label>
      <label class="field">
        <span>Port source ({{ linkSourceLabel }})</span>
        <input
          type="text"
          :value="selectedLink.sourcePort"
          placeholder="ex : GE0/1"
          @change="store.setLinkSourcePort(selectedLink.id, $event.target.value)"
        />
      </label>
      <label class="field">
        <span>Port cible ({{ linkTargetLabel }})</span>
        <input
          type="text"
          :value="selectedLink.targetPort"
          placeholder="ex : port 12"
          @change="store.setLinkTargetPort(selectedLink.id, $event.target.value)"
        />
      </label>
      <p v-if="selectedLink.busId" class="info-line">Fait partie d'un bus.</p>
    </template>

    <template v-else-if="selectedLinks.length">
      <p class="multi-hint">{{ selectedLinks.length }} câbles sélectionnés.</p>
      <button v-if="selectedBusId" type="button" class="action-button" @click="ungroupBus">Dégrouper le bus</button>
      <button v-else type="button" class="action-button" @click="groupBus">Grouper en bus</button>
    </template>

    <template v-else-if="singleNode">
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
      <p class="info-line">Site : {{ siteName ?? 'aucun' }}</p>

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

      <div v-if="canExposePorts(singleNode)" class="interfaces">
        <div class="interfaces-header">
          <span>Ports exposés</span>
          <button type="button" @click="store.addExposedPort(singleNode.id)">+ Règle</button>
        </div>
        <p v-if="!singleNode.exposedPorts.length" class="multi-hint">Aucune règle.</p>
        <div v-for="rule in singleNode.exposedPorts" :key="rule.id" class="iface-row">
          <div class="iface-row-top">
            <input
              type="text"
              placeholder="Alias (ex: E-Logis)"
              :value="rule.alias"
              @change="store.updateExposedPort(singleNode.id, rule.id, { alias: $event.target.value })"
            />
            <button type="button" class="iface-delete" @click="store.removeExposedPort(singleNode.id, rule.id)">×</button>
          </div>
          <div class="iface-row-top">
            <input
              type="number"
              placeholder="Port"
              :value="rule.port"
              @change="store.updateExposedPort(singleNode.id, rule.id, { port: Number($event.target.value) || null })"
            />
            <select
              :value="rule.protocol"
              @change="store.updateExposedPort(singleNode.id, rule.id, { protocol: $event.target.value })"
            >
              <option value="tcp">TCP</option>
              <option value="udp">UDP</option>
            </select>
          </div>
          <div class="iface-row-top">
            <input
              type="text"
              placeholder="IP destination"
              :value="rule.destinationIp"
              @change="store.updateExposedPort(singleNode.id, rule.id, { destinationIp: $event.target.value })"
            />
            <input
              type="number"
              placeholder="Port dest."
              :value="rule.destinationPort"
              @change="store.updateExposedPort(singleNode.id, rule.id, { destinationPort: Number($event.target.value) || null })"
            />
          </div>
          <input
            type="text"
            placeholder="Whitelist IP (séparées par virgule)"
            :value="formatWhitelist(rule)"
            @change="onWhitelistChange(rule.id, $event)"
          />
          <div class="iface-row-top">
            <select
              :value="rule.direction"
              @change="store.updateExposedPort(singleNode.id, rule.id, { direction: $event.target.value })"
            >
              <option value="inbound">Entrant</option>
              <option value="outbound">Sortant</option>
            </select>
            <select
              :value="rule.status"
              @change="store.updateExposedPort(singleNode.id, rule.id, { status: $event.target.value })"
            >
              <option value="active">Actif</option>
              <option value="inactive">Inactif</option>
            </select>
          </div>
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

      <div v-if="alignableNodes.length >= 2" class="align-block">
        <div class="interfaces-header"><span>Alignement</span></div>
        <div class="align-grid">
          <button type="button" class="action-button" title="Aligner à gauche" @click="align(alignLeft)">Gauche</button>
          <button type="button" class="action-button" title="Centrer horizontalement" @click="align(centerHorizontal)">Centre H</button>
          <button type="button" class="action-button" title="Aligner à droite" @click="align(alignRight)">Droite</button>
          <button type="button" class="action-button" title="Aligner en haut" @click="align(alignTop)">Haut</button>
          <button type="button" class="action-button" title="Centrer verticalement" @click="align(centerVertical)">Centre V</button>
          <button type="button" class="action-button" title="Aligner en bas" @click="align(alignBottom)">Bas</button>
        </div>
        <div v-if="alignableNodes.length >= 3" class="align-grid two-cols">
          <button type="button" class="action-button" title="Distribuer horizontalement" @click="align(distributeHorizontal)">
            Distribuer H
          </button>
          <button type="button" class="action-button" title="Distribuer verticalement" @click="align(distributeVertical)">
            Distribuer V
          </button>
        </div>
        <p v-if="rackedExcludedCount" class="multi-hint">
          {{ rackedExcludedCount }} équipement(s) en baie exclu(s) (position fixée par la baie).
        </p>
      </div>
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
.action-button {
  padding: var(--space-2) var(--space-3);
  font-size: var(--text-sm);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  color: var(--color-text);
  cursor: pointer;
}
.action-button:hover {
  background: var(--color-surface-2);
}
.align-block {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  padding-top: var(--space-2);
  border-top: 1px solid var(--color-border);
}
.align-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-1);
}
.align-grid.two-cols {
  grid-template-columns: repeat(2, 1fr);
}
.align-grid .action-button {
  padding: var(--space-1) var(--space-2);
  font-size: var(--text-xs);
  text-align: center;
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
