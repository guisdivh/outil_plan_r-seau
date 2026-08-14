# Outil Plan Réseau

App web de création de plans réseau (Vue 3 + Vite) : canvas de dessin manuel pour poser des équipements, les relier par des câbles, les regrouper en zones/sous-réseaux, et exporter le plan.

## Roadmap

Voir [`prompts/`](./prompts) — chaque fichier est une étape à donner à l'assistant dans l'ordre :

1. [Setup + socle du proto](./prompts/01-setup-canvas.md) — structure du projet, canvas de base, équipements, câbles. ✅
2. [Zones + export + sauvegarde](./prompts/02-zones-export-save.md) — zones/sous-réseaux, save JSON, export PNG/SVG. ✅
3. [Génération depuis données](./prompts/03-import-generation.md) — import CSV/JSON pour auto-générer le plan. ✅
4. [Rattachement nœud → zone plus fiable](./prompts/04-zone-attachment.md) — boîte englobante + zone la plus spécifique en cas de chevauchement. ✅
5. [Mode « relier » explicite](./prompts/05-link-mode.md) — remplace Alt+clic par un outil de câblage explicite. ✅
6. [Sélection et actions multiples](./prompts/06-multi-selection.md) — multi-sélection, déplacement/suppression groupés. ✅
7. [Baies (rack visuel + conteneur logique)](./prompts/07-racks.md) — nouveau type d'élément, distinct des zones. ✅
8. [VLANs](./prompts/08-vlans.md) — entité de première classe, prérequis des câbles taggés. ✅
9. [Câbles enrichis](./prompts/09-link-enrichment.md) — nom, VLAN natif, waypoints. ✅
10. [Routage anti-chevauchement](./prompts/10-link-routing.md) — tracé orthogonal auto, surchargeable à la main. ✅
11. [Panneau de propriétés](./prompts/11-properties-panel.md) — édition des équipements, gestion multi-sélection.
12. [Adressage IP structuré](./prompts/12-ip-addressing.md) — interfaces multi-IP par équipement.
13. [Sites distants + tunnels IPsec](./prompts/13-remote-sites-ipsec.md) — sites repliables, tunnels logiques.

Le code du projet Vue est scaffoldé à la racine de ce dossier (étape 1).
