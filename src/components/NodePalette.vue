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
      Double-clic sur une baie : renommer ; sur son « X U » : changer la taille.<br />
      Clic sur un câble : sélectionner (double-clic sur l'étiquette : renommer).<br />
      Double-clic sur un câble : ajouter un point de passage ; glisser/double-clic dessus : déplacer/retirer.<br />
      Suppr : supprimer la sélection (multiple incluse).
    </p>
  </aside>
</template>

<style scoped>
.node-palette {
  width: 200px;
  padding: 16px;
  border-right: 1px solid #e5e7eb;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.node-palette h2 {
  font-size: 14px;
  text-transform: uppercase;
  color: #6b7280;
  margin: 0 0 8px;
}
.palette-item {
  padding: 8px 10px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  background: #fff;
  text-align: left;
  cursor: pointer;
}
.palette-item:hover {
  background: #f3f4f6;
}
.hint {
  margin-top: 16px;
  font-size: 12px;
  color: #9ca3af;
  line-height: 1.5;
}
</style>
