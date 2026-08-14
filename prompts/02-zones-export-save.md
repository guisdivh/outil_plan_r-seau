# Prompt 2 — Zones + export + sauvegarde

On continue le projet plans réseau. Ajoute maintenant :

- Zones / sous-réseaux : des rectangles/conteneurs qu'on dessine sur le canvas, nommables, avec une couleur. Les équipements posés dedans y sont visuellement rattachés.
- Sauvegarde locale : sérialiser tout le plan (nœuds, liens, zones, positions) en JSON, stocker en localStorage, et permettre de télécharger/recharger un fichier JSON éditable.
- Export image : exporter le plan en PNG et en SVG.

Garde le modèle de données compatible avec ce qu'on a déjà. Signale-moi si un choix précédent complique l'export.
