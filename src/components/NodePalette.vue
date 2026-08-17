<script setup>
import { ref } from 'vue'
import { usePlanStore } from '../stores/plan'
import { EQUIPMENT_TYPES } from '../constants/equipmentTypes'
import IconRouter from './icons/IconRouter.vue'
import IconSwitch from './icons/IconSwitch.vue'
import IconFirewall from './icons/IconFirewall.vue'
import IconAccessPoint from './icons/IconAccessPoint.vue'
import IconServer from './icons/IconServer.vue'
import IconWorkstation from './icons/IconWorkstation.vue'
import IconIot from './icons/IconIot.vue'

const ICONS = {
  IconRouter,
  IconSwitch,
  IconFirewall,
  IconAccessPoint,
  IconServer,
  IconWorkstation,
  IconIot,
}

const store = usePlanStore()
const helpOpen = ref(false)

// Regroupement purement visuel : mêmes types, mêmes raccourcis, aucune fonction changée.
const GROUPS = [
  { title: 'Réseau', types: ['router', 'switch', 'firewall', 'ap'] },
  { title: 'Terminaux', types: ['server', 'pc', 'iot'] },
]
const groupedEquipment = GROUPS.map((g) => ({
  title: g.title,
  items: g.types.map((t) => EQUIPMENT_TYPES.find((e) => e.type === t)).filter(Boolean),
}))

// Pose le nœud à une position par défaut visible ; l'utilisateur le déplace ensuite.
function addNode(type) {
  store.addNode(type, 150 + Math.random() * 100, 150 + Math.random() * 100)
}
</script>

<template>
  <aside class="node-palette">
    <div class="palette-scroll">
      <div v-for="group in groupedEquipment" :key="group.title" class="palette-group">
        <h3 class="group-title">{{ group.title }}</h3>
        <button
          v-for="item in group.items"
          :key="item.type"
          class="palette-item"
          type="button"
          @click="addNode(item.type)"
        >
          <svg class="palette-icon" width="22" height="22" viewBox="0 0 56 56">
            <component :is="ICONS[item.icon]" v-if="ICONS[item.icon]" />
          </svg>
          <span>{{ item.label }}</span>
        </button>
      </div>
    </div>

    <div class="help-block">
      <button type="button" class="help-toggle" @click="helpOpen = !helpOpen">
        <span>Aide</span>
        <span class="chevron" :class="{ open: helpOpen }">▾</span>
      </button>
      <p v-if="helpOpen" class="hint">
        Clic : sélectionner / déplacer.<br />
        Ctrl/Cmd+clic : ajouter à la sélection.<br />
        Drag dans le vide : sélection par rectangle.<br />
        Déplacer la vue (pan) : barre espace + glisser, ou clic molette + glisser, ou clic droit + glisser.<br />
        Molette seule : zoomer/dézoomer (centré sur le curseur). Touche 0 : recadrer sur tout le plan.<br />
        « Mode relier » (barre d'outils) : clic sur 2 nœuds pour les relier.<br />
        Raccourci : Alt+clic fait pareil sans activer le mode.<br />
        Glisser un équipement sur une baie : le monte sur la première U libre.<br />
        Double-clic sur une baie : renommer ; sur son « X U » : changer la taille ; « ▾ » : replier.<br />
        Clic sur un câble : sélectionner (double-clic sur l'étiquette : renommer).<br />
        Double-clic sur un câble : ajouter un point de passage ; glisser/double-clic dessus : déplacer/retirer.<br />
        Ctrl/Cmd+clic sur plusieurs câbles reliés au même équipement : « Grouper en bus » (panneau de propriétés) pour un tronc commun + dérivations. Clic sur le tronc : sélectionne tout le groupe (bouton Dégrouper) ; clic sur une dérivation : sélectionne ce câble.<br />
        Glisser un équipement sur un site : le rattache (position libre).<br />
        « Tunnel IPsec » (barre d'outils) : clic sur 2 passerelles (routeur ou firewall uniquement) pour créer un tunnel.<br />
        Double-clic sur un site : renommer ; « replier » : masque son contenu.<br />
        Suppr : supprimer la sélection (multiple incluse).
      </p>
    </div>
  </aside>
</template>

<style scoped>
.node-palette {
  width: 200px;
  background: var(--color-surface);
  border-right: 1px solid var(--color-border);
  display: flex;
  flex-direction: column;
  height: 100%;
}
.palette-scroll {
  flex: 1;
  overflow-y: auto;
  padding: var(--space-4) var(--space-3);
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}
.palette-group {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}
.group-title {
  font-size: var(--text-xs);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--color-text-muted);
  margin: 0 0 var(--space-1) var(--space-1);
  font-weight: 600;
}
.palette-item {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-2);
  border: 1px solid transparent;
  border-radius: var(--radius-md);
  background: transparent;
  color: var(--color-text);
  font-size: var(--text-sm);
  text-align: left;
  cursor: pointer;
  transition: background-color 0.15s, border-color 0.15s;
}
.palette-item:hover {
  background: var(--color-surface-2);
  border-color: var(--color-border);
}
.palette-icon {
  flex: none;
  border-radius: var(--radius-sm);
}

.help-block {
  border-top: 1px solid var(--color-border);
  flex: none;
}
.help-toggle {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-3) var(--space-4);
  border: none;
  background: transparent;
  color: var(--color-text-muted);
  font-size: var(--text-sm);
  font-weight: 600;
  cursor: pointer;
}
.help-toggle:hover {
  color: var(--color-text);
}
.chevron {
  transition: transform 0.15s;
}
.chevron.open {
  transform: rotate(180deg);
}
.hint {
  margin: 0;
  padding: 0 var(--space-4) var(--space-4);
  font-size: var(--text-xs);
  color: var(--color-text-muted);
  line-height: 1.6;
  max-height: 260px;
  overflow-y: auto;
}
</style>
