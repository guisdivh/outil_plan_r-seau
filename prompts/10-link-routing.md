# Prompt G — Routage des câbles anti-chevauchement

Dans le projet plans réseau, le tracé des câbles est illisible quand le plan est dense : les liens se croisent et se superposent. Améliore le routage.

- Par défaut, tracé orthogonal (coudes à angle droit) avec un routage automatique qui limite les chevauchements et les croisements.
- Quand plusieurs câbles partent du même équipement, écarte-les proprement (pas tous collés sur le même point).
- Le routage auto reste surchargeable à la main : les waypoints posés manuellement (voir prompt câbles) priment sur l'auto.

C'est un point d'UX critique pour moi (je viens de draw.io où ce comportement est mauvais). Propose ta stratégie de routage avant de coder, et signale si un choix d'archi précédent la complique.
