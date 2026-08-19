# Le système nodal d'Atlas

**173 nœuds, 451 arcs.** Artefact — refait par
`node outils/noeuds.mjs`.

Tout ce qui entre dans une scène est un **nœud** : une texture, une matière, un
objet, un climat, une feuille de temps. Chaque nœud déclare ce dont il a besoin,
et porte une **origine** qui n'est pas choisie mais **appliquée** par
`origineDe(existe, dependDuBrief)` — la règle vit dans
`packages/contracts/src/noeud.ts`.

## La question qui tranche

**La pièce dépend-elle du brief ?**

- **oui** → elle est *unique*. La ranger produirait un catalogue de pièces que
  personne ne peut réutiliser, et qui ferait croire qu'on avance alors qu'on
  l'encombre.
- **non** → elle est *réutilisable*. Ne pas la ranger revient à la regénérer à
  chaque projet — c'est-à-dire à la payer chaque fois.

## ① Au catalogue — rien à générer · **153 nœuds**

La pièce est sur le disque, dans sa bibliothèque.

| famille | nœuds | quelques-uns |
| --- | ---: | --- |
| `animation` | 1 | animations |
| `architecture` | 8 | facades_modulaires, immeuble_bureaux_verre, immeuble_mediterraneen, immeuble_tour, maison_medievale_complexe, modular_factory_facade … +2 |
| `ciel` | 9 | IndoorEnvironmentHDRI001, alps_field, anniversary_lounge, autoshop_01, castle_zavelstein_cellar, cobblestone_street_night … +3 |
| `climat` | 1 | climat |
| `composant_web` | 14 | accordeons-web, boutons-web, cards-web, components-raw, composants-cadence, composants-classement … +8 |
| `humain` | 1 | base-meshes |
| `inspiration` | 16 | active-theory, aman, apple-produit, bruno-simon, cheval-blanc, hermes … +10 |
| `loader` | 10 | loaders-commerce, loaders-corporate, loaders-culture, loaders-immobilier, loaders-luxe, loaders-restauration … +4 |
| `matiere` | 1 | liste |
| `mobilier_interieur` | 5 | Sofa_01, modern_arm_chair_01, sofa_02, sofa_03, wooden_table_02 |
| `mobilier_urbain` | 5 | banc, concrete_road_barrier, fire_hydrant, lampadaire, rue_modulaire |
| `objet` | 5 | Camera_01, Television_01, cassette_player, marble-bust-01, power_box_01 |
| `palette` | 1 | palettes |
| `police` | 2 | inter, polices |
| `shader` | 1 | shaders-web |
| `terrain` | 4 | grass_bermuda_01, grass_medium_01, rock_moss_set_01, rock_moss_set_02 |
| `texture` | 49 | aerial_grass_rock, american_walnut_veneer, asphalt_02, asphalt_04, bark_platanus, bark_willow … +43 |
| `transition` | 9 | transitions-commerce, transitions-corporate, transitions-culture, transitions-immobilier, transitions-luxe, transitions-sante … +3 |
| `vegetation` | 9 | arbre_lod_1, arbre_lod_2, arbre_lod_3, cypres, island_tree_02, jacaranda_tree … +3 |
| `vehicule` | 2 | dutch_ship_medium, ship_pinnace |

## ② À générer, puis rangeable — **16 nœuds**

La pièce n'existe pas encore, mais elle est générique : une chaise, un terrain,
un lampadaire. On la génère **une fois**, elle entre en bibliothèque, et le
projet suivant la trouve en ①.

| famille | nœuds | ce qu'il faudra générer |
| --- | ---: | --- |
| `humain` | 3 | cheveux, oeil, peau |
| `matiere` | 1 | planches |
| `mouvement` | 1 | toute pièce de mouvement |
| `objet` | 2 | anneau-or, sphere-or |
| `studio` | 1 | toute pièce de studio |
| `texture` | 7 | cuit_boisDeChene, cuit_bourreDeCoco, cuit_coqueDeCoco, cuit_duvetDeCoco, cuit_feuilleDeChene, cuit_palmeVerte … +1 |
| `vegetation` | 1 | ecorce |

## ③ À générer, jamais rangeable — **4 nœuds**

La pièce dépend du brief. Elle se génère à chaque projet et ne se range nulle
part — non par négligence, mais parce qu'elle ne servirait à personne d'autre.

| famille | nœuds | pourquoi |
| --- | ---: | --- |
| `eclairage` | 1 | toute eclairage |
| `livrable` | 1 | toute livrable |
| `scene` | 1 | toute scene |
| `usure` | 1 | toute usure |

## Le graphe

Les arcs vont de ce qui est consommé vers ce qui consomme. Une texture nourrit
une matière ; une matière nourrit un objet, un terrain, un bâtiment ; tout cela
nourrit une scène ; la scène nourrit le livrable.

```
texture → matiere → { terrain, objet, architecture, mobilier, humain, vegetation, vehicule }
                                        ↘
ciel → studio ─────────────────────────→ scene → livrable
climat ────────────────────────────────↗          ↑
mouvement → { animation, transition } ─────────────┤
{ palette, police } → composant_web ───────────────┤
shader ────────────────────────────────────────────┘
```
