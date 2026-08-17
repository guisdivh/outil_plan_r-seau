# Bug — Zones/baies pas solidaires d'un site replié

Dans le projet plans réseau, il y a un bug de rattachement des zones à un site. Quand je replie ou déplace un site, ses équipements suivent bien, mais ses zones restent sur place au lieu de suivre le site. Une zone qui a un siteId doit être solidaire de son site.

- Quand un site est déplacé : ses zones rattachées (zone.siteId === site.id) doivent se déplacer avec lui, exactement comme les nœuds (translation dx/dy appliquée à zone.x/zone.y).
- Quand un site est replié : ses zones doivent être masquées/repliées avec lui (elles ne doivent pas rester affichées sur le canvas alors que le site est réduit).
- Quand un site est déplié/étendu de nouveau : ses zones réapparaissent à la bonne position relative.
- Vérifie la symétrie avec ce qui existe déjà pour les nœuds (moveSite translate déjà les nœuds enfants) : applique le même traitement aux zones, et vérifie aussi les baies (rackId/siteId) tant que tu y es — elles ont probablement le même problème.

Montre-moi la fonction moveSite (ou équivalent) et ce qui gère le repli d'un site avant de corriger, pour qu'on voie si les nœuds, zones et baies sont traités de façon cohérente.
