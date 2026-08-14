# Prompt R — Pan & zoom du canvas (prioritaire, fonctionnel)

Dans le projet plans réseau, il manque une fonction critique : je ne peux pas déplacer la vue ni zoomer. Dès qu'un plan dépasse l'écran, une partie devient inaccessible.

- Pan : déplacer la vue en glissant sur le fond vide (ou clic molette / barre espace + glisser), sans déplacer d'éléments.
- Zoom : à la molette (centré sur le curseur) et via des boutons +/− et « ajuster à l'écran » / « 100 % ».
- Un indicateur du niveau de zoom, et un raccourci pour recadrer sur l'ensemble du plan.
- Le pan/zoom ne doit pas casser le drag des nœuds, la sélection par rectangle, le tracé des liens ni les coordonnées à l'export.

C'est de la fonctionnalité, pas de l'esthétique. Signale les endroits impactés (conversion coordonnées écran ↔ canvas) avant de coder.
