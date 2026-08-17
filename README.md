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
11. [Panneau de propriétés](./prompts/11-properties-panel.md) — édition des équipements, gestion multi-sélection. ✅
12. [Adressage IP structuré](./prompts/12-ip-addressing.md) — interfaces multi-IP par équipement. ✅
13. [Sites distants + tunnels IPsec](./prompts/13-remote-sites-ipsec.md) — sites repliables, tunnels logiques. ✅
14. [Système de design + thème clair/sombre](./prompts/14-design-system-theme.md) — variables CSS, palette, deux thèmes. ✅
15. [Habillage des panneaux](./prompts/15-panels-styling.md) — toolbar, palette, propriétés, VLAN. ✅
16. [Rendu du canvas](./prompts/16-canvas-rendering.md) — fond, grille, nœuds, liens, thème. ✅
17. [Vue d'export PNG exhaustive](./prompts/17-export-view.md) — écran ≠ export, tout afficher au rendu final. ✅
18. [Ports exposés sur les firewalls](./prompts/18-firewall-exposed-ports.md) — règles NAT/whitelist, badge discret, tableau à l'export. ✅
19. [Rattachement complet à un site](./prompts/19-full-site-attachment.md) — équipements/zones/baies tous rattachables à un site. ✅
20. [Baies : U à la création, repli/extension](./prompts/20-rack-units-collapse.md) — U configurable dès l'ajout, baie repliable. ✅
21. [Pan & zoom du canvas](./prompts/21-pan-zoom.md) — déplacer/zoomer la vue, prioritaire et fonctionnel. ✅
22. [Refonte de la colonne latérale](./prompts/22-sidebar-redesign.md) — palette soignée, aide repliable. ✅
23. [Réorganisation de la toolbar](./prompts/23-toolbar-redesign.md) — regroupement par nature, hiérarchie visuelle. ✅
24. [Restriction des extrémités de tunnel IPsec](./prompts/24-tunnel-gateway-restriction.md) — routeur/firewall uniquement. ✅
25. [Ports de branchement sur les câbles](./prompts/25-link-ports.md) — sourcePort/targetPort, édition dans le panneau de propriétés. ✅
26. [Exports enrichis : CSV branchements + encart PNG](./prompts/26-cabling-export.md) — table de câblage, légende VLAN et récap port↔VLAN à l'export. ✅
27. [Regroupement visuel des câbles en bus](./prompts/27-bus-grouping.md) — tronc commun + dérivations, réversible, sans toucher aux liens sous-jacents. ✅
28. [Alignement et distribution d'une sélection](./prompts/28-align-distribute.md) — aligner/centrer/distribuer plusieurs nœuds sélectionnés. ✅
29. [Bug — Zones/baies pas solidaires d'un site replié](./prompts/29-site-zone-rack-collapse-bug.md) — masquage manquant au repli, pas de bug au déplacement. ✅

Le code du projet Vue est scaffoldé à la racine de ce dossier (étape 1).
