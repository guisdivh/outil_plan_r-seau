<script setup>
import { usePlanStore } from '../stores/plan'
import { EQUIPMENT_TYPES } from '../constants/equipmentTypes'

const store = usePlanStore()

// Pose le nœud à une position par défaut visible ; l'utilisateur le déplace ensuite.
function addNode(type) {
  store.addNode(type, 150 + Math.random() * 100, 150 + Math.random() * 100)
}
</script>

<template>
  <aside class="node-palette">
    <h2>Équipements</h2>
    <button
      v-for="item in EQUIPMENT_TYPES"
      :key="item.type"
      class="palette-item"
      type="button"
      @click="addNode(item.type)"
    >
      {{ item.label }}
    </button>

    <p class="hint">
      Clic : sélectionner / déplacer.<br />
      Ctrl/Cmd+clic : ajouter à la sélection.<br />
      Drag dans le vide : sélection par rectangle.<br />
      « Mode relier » (barre d'outils) : clic sur 2 nœuds pour les relier.<br />
      Raccourci : Alt+clic fait pareil sans activer le mode.<br />
      Glisser un équipement sur une baie : le monte sur la première U libre.<br />
      Double-clic sur une baie : renommer ; sur son « X U » : changer la taille ; « ▾ » : replier.<br />
      Clic sur un câble : sélectionner (double-clic sur l'étiquette : renommer).<br />
      Double-clic sur un câble : ajouter un point de passage ; glisser/double-clic dessus : déplacer/retirer.<br />
      Glisser un équipement sur un site : le rattache (position libre).<br />
      « Tunnel IPsec » (barre d'outils) : clic sur 2 passerelles pour créer un tunnel.<br />
      Double-clic sur un site : renommer ; « replier » : masque son contenu.<br />
      Suppr : supprimer la sélection (multiple incluse).
    </p>
  </aside>
</template>

<style scoped>
.node-palette {
  width: 200px;
  padding: var(--space-4);
  background: var(--color-surface);
  border-right: 1px solid var(--color-border);
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}
.node-palette h2 {
  font-size: var(--text-sm);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--color-text-muted);
  margin: 0 0 var(--space-2);
}
.palette-item {
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  color: var(--color-text);
  font-size: var(--text-sm);
  text-align: left;
  cursor: pointer;
  transition: background-color 0.15s, border-color 0.15s;
}
.palette-item:hover {
  background: var(--color-surface-2);
  border-color: var(--color-border-strong);
}
.hint {
  margin-top: var(--space-4);
  font-size: var(--text-xs);
  color: var(--color-text-muted);
  line-height: 1.5;
}
</style>
