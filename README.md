# Outil Plan Réseau

App web de création de plans réseau (Vue 3 + Vite) : canvas de dessin manuel pour poser des équipements, les relier par des câbles, les regrouper en zones/sous-réseaux, et exporter le plan.

## Roadmap

Voir [`prompts/`](./prompts) — chaque fichier est une étape à donner à l'assistant dans l'ordre :

1. [Setup + socle du proto](./prompts/01-setup-canvas.md) — structure du projet, canvas de base, équipements, câbles.
2. [Zones + export + sauvegarde](./prompts/02-zones-export-save.md) — zones/sous-réseaux, save JSON, export PNG/SVG.
3. [Génération depuis données](./prompts/03-import-generation.md) — import CSV/JSON pour auto-générer le plan.

Le code du projet Vue sera scaffoldé à la racine de ce dossier lors de l'étape 1.
