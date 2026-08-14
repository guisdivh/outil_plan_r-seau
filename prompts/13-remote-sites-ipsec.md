# Prompt J — Sites distants + tunnels IPsec

Dans le projet plans réseau, ajoute la schématisation des réseaux distants reliés par IPsec.

- Site distant : un conteneur/bloc représentant un site (ex. une agence), avec un nom, qui regroupe ses propres équipements. Distinct de la zone (sous-réseau visuel) et de la baie (rack). Idéalement repliable pour ne montrer que le site en vue d'ensemble.
- Tunnel IPsec : un type de lien spécial entre deux passerelles/sites, visuellement distinct d'un câble normal (ex. trait pointillé, icône cadenas, couleur dédiée). Il représente un lien logique par-dessus la topologie physique, pas une connexion filaire.
- Un tunnel peut porter des infos : nom, extrémités (passerelles), éventuellement un libellé de phase/protocole.

C'est une notion structurante : propose-moi ton modèle de données (comment tu distingues site / zone / baie, comment un tunnel se rattache aux passerelles) avant de coder. Garde la compatibilité avec l'existant.
