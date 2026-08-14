# Prompt C — Sélection et actions multiples

Dans le projet plans réseau, la sélection ne gère qu'un seul élément (selectedId). Fais évoluer vers une sélection multiple :

- Sélection additive (Ctrl/Cmd+clic) et sélection par rectangle (drag dans le vide).
- Déplacement groupé de tous les nœuds sélectionnés.
- Suppression multiple.
- Adapte le store proprement (passer d'un selectedId unique à un ensemble d'ids) sans casser l'export, l'import et la sauvegarde.

Signale-moi les endroits du code impactés par ce passage au multi-sélection avant de coder.
