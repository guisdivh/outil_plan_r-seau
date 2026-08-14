# Prompt P — Rattachement complet à un site

Dans le projet plans réseau, consolide le rattachement des éléments à un site. Aujourd'hui c'est partiel : je veux que postes/équipements, zones et baies appartiennent explicitement à un site (siteId).

- Poser ou déplacer un élément dans un site le rattache automatiquement ; le sortir le détache.
- Déplacer un site déplace tout ce qu'il contient (équipements, zones, baies).
- Le panneau de propriétés d'un élément indique son site de rattachement.
- Vérifie la cohérence à l'export/import : rien ne doit se retrouver orphelin ou mal rattaché.

Signale-moi les endroits du code impactés avant de coder. Ne casse pas les rattachements zone/baie déjà en place.
