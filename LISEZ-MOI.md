# Les bibliothèques d'Atlas

**22 boîtes — 20 avec du contenu, 2 vides.**

Ce fichier est un **artefact** : il est refait par `node outils/bibliotheques.mjs`,
qui parcourt le disque. Aucun chiffre n'y est saisi à la main, et « vide » veut
dire *mesuré vide*, pas *supposé vide*.

## Ce qui a du contenu

| bibliothèque | famille | pièces | entrées | poids | ce qu'elle porte |
| --- | --- | ---: | ---: | ---: | --- |
| `textures` | 3D | 56 pièces | 978 | 2.32 Go | Cartes photographiées : couleur, normale, rugosité, déplacement. Chaque jeu porte sa provenance et sa taille réelle. |
| `matieres` | 3D | 6 pièces | 59 | 958 Ko | Matières montées : uniformes (métaux, diélectriques) et à grain. Plus les shaders web. |
| `terrain` | monde | 4 pièces | 72 | 64.0 Mo | Sols, reliefs, étendues. |
| `objets` | 3D | 7 pièces | 114 | 69.2 Mo | Objets manufacturés : stylo, objectif photo, montre, bille. |
| `architecture` | 3D | 8 pièces | 149 | 1.88 Go | Maison, villa, immeuble, hangar. |
| `mobilier-urbain` | 3D | 5 pièces | 77 | 276.3 Mo | Banc, lampadaire, borne, abri. |
| `mobilier-interieur` | 3D | 5 pièces | 90 | 63.4 Mo | Chaise, table, lit, rangement, luminaire. |
| `humain` | 3D | 4 pièces | 102 | 105.9 Mo | Peau, cheveux, œil, pilosité, squelette, articulations. |
| `vegetation` | 3D | 7 pièces | 128 | 962.1 Mo | Arbres, écorces, feuillages, herbes. |
| `ciels` | monde | 9 pièces | 157 | 217.8 Mo | Environnements HDR : ce qui éclaire et ce qui se reflète. |
| `vehicules` | 3D | 2 pièces | 36 | 341.0 Mo | Voiture, vélo, deux-roues. |
| `climat` | monde | 1 pièce | 13 | 6 Ko | Milieux, météos, états dérivés, et la matrice des cases que le monde interdit. |
| `palettes` | web | 1 pièce | 50 | 28 Ko | Palettes de couleurs. |
| `polices` | web | 2 pièces | 1 823 | 1.5 Mo | Polices de caractères, avec leurs familles et leurs graisses. |
| `transitions` | web | 9 pièces | 372 | 1.7 Mo | Transitions de page et d'élément — un fonds général et neuf déclinaisons par secteur. |
| `loaders` | web | 10 pièces | 380 | 3.1 Mo | Écrans et animations d'attente — un fonds général et neuf déclinaisons par secteur. |
| `animations` | web | 1 pièce | 24 | 22 Ko | Animations d'interface. |
| `composants-web` | web | 14 pièces | 8 534 | 16.9 Mo | Composants d'interface relevés : boutons, cartes, accordéons, pointeurs, défilements, plus leurs fiches, notes et classements. |
| `shaders` | web | 1 pièce | 57 | 76 Ko | Shaders fragment pour le web, en dix familles. |
| `inspiration` | web | 16 pièces | 120 | 4.4 Mo | Références relevées sur des sites existants. |

## Ce qui est vide — et c'est voulu

Les 2 boîtes ci-dessous sont **posées et vides**. On sait où ranger
avant d'avoir à ranger ; une boîte vide se remplit, un rangement absent se
bricole.

| bibliothèque | famille | ce qu'elle attend |
| --- | --- | --- |
| `studio` | 3D | Éclairages, cadrages, bancs d'épreuve. |
| `mouvement` | web | Feuilles de temps Theatre.js, transitions, courbes. |

## D'où viennent les pièces

**107 pièces portent des papiers.** Compté en lisant chaque
`provenance.json`, comme tout le reste de ce fichier.

| source | pièces | licence |
| --- | ---: | --- |
| Poly Haven | 80 | CC0 |
| fabriqué ici | 14 | propriétaire — à nous |
| Blendkit | 10 | CC0 |
| ambientCG | 1 | CC0 |
| blender | 1 | CC0 |
| google-fonts | 1 | CC0 |

Une orthographe et une seule par source. Le dépôt en portait quatre pour trois
sources — `Poly Haven`, `polyhaven`, `ambientcg`, et rien du tout — et un
classement qui cherchait la première rangeait neuf pièces documentées dans
« sans provenance ». `node outils/provenance.mjs --verifier` contrôle qu'on
n'y retombe pas.

### Ce qui se retélécharge, et ce qui ne se retéléchargera jamais

**852 fichiers — 4360 Mo — sont rechargeables.**
Ce n'est pas une espérance : chaque fichier du disque a été apparié à ce que la
source sert aujourd'hui **par son MD5**, jamais par son nom, et sa provenance
porte désormais l'URL exacte et l'empreinte. `node outils/empreintes.mjs
--hors-ligne --verifier` recontrôle le tout sans réseau, et il en trouve zéro qui manque à l'appel.

Les 14 pièces **fabriquées ici** n'ont pas de source à
recharger — par définition. Elles se régénèrent en relançant leur script, sauf
les 7 cartes cuites nommées plus bas.

14 pièces d'une autre source restent à apparier : `architecture/facades_modulaires`, `architecture/immeuble_bureaux_verre`, `architecture/immeuble_mediterraneen`, `architecture/immeuble_tour`, `architecture/maison_medievale_complexe`, `architecture/villa_mediterraneenne`, `ciels/IndoorEnvironmentHDRI001`, `humain/base-meshes`, `mobilier-urbain/banc`, `mobilier-urbain/rue_modulaire`, `textures/asphalt_04`, `textures/concrete_pavement`, `vegetation/cypres`, `vegetation/palmier`.

### Les 7 pièces qu'on ne peut pas refaire

Celles-ci ne se retéléchargent pas et ne se régénèrent pas. Leur graine vient
de `hash()` en Python, qui est randomisé à chaque processus : relancer le
script rend une carte du même genre, jamais la même.

- `textures/cuit_boisDeChene`
- `textures/cuit_bourreDeCoco`
- `textures/cuit_coqueDeCoco`
- `textures/cuit_duvetDeCoco`
- `textures/cuit_feuilleDeChene`
- `textures/cuit_palmeVerte`
- `textures/cuit_stipeDeCocotier`

Ce sont elles — et nos objets — qu'une sauvegarde doit couvrir en premier.

## Pourquoi treize et pas sept

Sept boîtes ont été demandées. Six ont été ajoutées, et chacune parce que le
dépôt la réclamait déjà :

- **humain** — l'atelier porte six modules dédiés au corps
- **vegetation** — l'écorce et les feuilles sont déjà des familles de matière
- **ciels** — studio.py le dit : l'environnement fait 90 % du réalisme d'un métal
- **studio** — atelier/studio.py et epreuve.py existent, leurs pièces non
- **mouvement** — @theatre/core est dans le front, aucune pièce ne l'utilise encore
- **vehicules** — par symétrie avec l'architecture et le mobilier
- **climat** — le contrat climat.ts existait déjà, sans boîte pour ses tables
- **palettes** — reprise de Talos
- **polices** — reprise de Talos
- **transitions** — reprise de Talos
- **loaders** — reprise de Talos
- **animations** — reprise de Talos
- **composants-web** — reprise de Talos
- **shaders** — sortie de data/ — un shader est une pièce, pas une donnée de configuration
- **inspiration** — reprise de Talos

## Règle commune

Une pièce entre dans une bibliothèque quand elle est **mesurée** : ses cotes, sa
matière, sa provenance. C'est la règle du dépôt, et elle vaut pour les treize.
