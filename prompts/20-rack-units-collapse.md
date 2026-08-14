# Prompt Q — Baies : nombre d'unités à la création, repli et extension

Dans le projet plans réseau, améliore les baies.

- À la création d'une baie, je choisis le nombre d'unités U (champ demandé au moment de l'ajout, pas une valeur fixe).
- Une baie peut être repliée (affichage compact : juste le nom et un résumé, ex. nombre d'équipements) et étendue de nouveau, via un bouton sur la baie.
- Je peux aussi modifier le nombre d'U d'une baie existante après coup (sans casser les équipements déjà placés ; préviens-moi si des équipements dépassent la nouvelle taille).

Garde la compatibilité avec les baies existantes. Ne touche pas au comportement de rack (empilement, rack_u) au-delà de ces ajouts.
