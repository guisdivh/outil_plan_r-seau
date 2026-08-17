# Prompt X — Alignement et distribution d'une sélection

Dans le projet plans réseau, ajoute des actions d'alignement sur une sélection multiple de nœuds (la multi-sélection est déjà en place).

- Quand plusieurs nœuds sont sélectionnés, propose des actions : aligner à gauche / à droite / en haut / en bas, centrer horizontalement / verticalement, et distribuer régulièrement (espacement égal à l'horizontale et à la verticale).
- Accessibles via une petite barre d'actions contextuelle (qui apparaît quand ≥2 nœuds sont sélectionnés) ou des boutons dans la toolbar. Choisis l'emplacement le plus cohérent avec l'interface actuelle et dis-moi lequel.
- L'alignement modifie les x/y des nœuds (coordonnées absolues, comme le reste). Les liens et leurs waypoints doivent suivre correctement.
- Cas à gérer proprement : les nœuds montés en baie (leur position est calculée depuis le rack) ne doivent pas être déplacés par l'alignement, ou alors préviens-moi. Idem pour les nœuds rattachés à une zone/site : l'alignement ne doit pas casser leur rattachement.

Montre-moi comment tu calcules l'alignement et la distribution (référence : bords de la sélection ? premier nœud ?) avant de coder.
