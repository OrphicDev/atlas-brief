# Le magasin d'Atlas

**1321 objets, 6,01 Go, 122 pièces.**

Artefact — refait par `node outils/magasin.mjs --ingerer`.

## Pourquoi il existe

Atlas ne dépend plus d'un tiers pour ses octets. Ce qui a été téléchargé ou
fabriqué une fois est **gardé ici**. Si une source ferme, change ses URL ou
retire un asset, rien ne se passe : les octets sont là.

Le reste d'Atlas n'ouvre plus de chemins de disque. Il appelle :

```js
import { chemin, pieceEntiere } from "./outils/magasin.mjs";
chemin("marble_01", "full", "couleur");   // → le fichier, où qu'il soit
pieceEntiere("marble_01");                 // → toutes ses variantes et rôles
```

## Comment il est fait

Un objet est nommé par l'**empreinte SHA-256 de son contenu**, et par rien
d'autre. Trois propriétés en découlent, et chacune règle un problème qu'on a eu :

| | |
| --- | --- |
| **dédoublonnage** | deux fichiers identiques n'occupent qu'une place — 54 doublons trouvés dans le dépôt, 737,0 Mo récupérés |
| **immuable** | chaque objet est en lecture seule (444) : une écriture accidentelle échoue au lieu de corrompre en silence |
| **l'adresse est la preuve** | vérifier, c'est relire un objet et voir s'il porte encore son nom. Aucun manifeste à croire |

L'arborescence lisible des bibliothèques reste en place : chaque fichier y est
un **lien dur** vers l'objet. Même inode, zéro octet de plus, et tous les
scripts existants continuent d'ouvrir les chemins qu'ils connaissent.

## Où il est stocké

**Sur le même volume que le code**, et ce n'est pas un choix de commodité : un
lien dur ne traverse pas les volumes. Un magasin sur un disque externe et une
arborescence sur le disque interne ne partageraient aucun inode, et les
6,01 Go seraient doublés.

Tout le reste — SSD, NAS, bucket — est un **adossement** : le même magasin
ailleurs, réplique vérifiée à la relecture, remplaçable sans qu'une ligne
d'Atlas change.

```
node outils/magasin.mjs --adosser "/Volumes/SSD Stockage 4To/Atlas-magasin"
node outils/magasin.mjs --verifier
```

## Ce qu'il contient

| bibliothèque | pièces |
| --- | ---: |
| textures | 55 |
| inspiration | 15 |
| ciels | 9 |
| architecture | 8 |
| objets | 7 |
| vegetation | 7 |
| mobilier-interieur | 5 |
| mobilier-urbain | 5 |
| humain | 4 |
| terrain | 4 |
| vehicules | 2 |
| animaux | 1 |

## Les 35 pièces sans variante « low »

Le contrat dit que chaque pièce porte un `full` et un `low`. Celles-ci n'ont
que le `full` — c'est une dette, mesurée ici plutôt que supposée ailleurs.

- `IndoorEnvironmentHDRI001`
- `cheveux`
- `oeil`
- `peau`
- `active-theory`
- `aman`
- `apple-produit`
- `bruno-simon`
- `cheval-blanc`
- `hermes`
- `kinfolk`
- `linear`
- `locomotive`
- `lusion`
- `obys`
- `resn`
- `six-senses`
- `stripe`
- `studio-feixen`
- `anneau-or`
- `sphere-or`
- `cuit_boisDeChene`
- `cuit_bourreDeCoco`
- `cuit_coqueDeCoco`
- `cuit_duvetDeCoco`
- `cuit_feuilleDeChene`
- `cuit_palmeVerte`
- `cuit_stipeDeCocotier`
- `ecorce`
- `base-meshes`
- `marble-bust-01`
- `maison_medievale_complexe`
- `lampadaire`
- `banc`
- `palmier`
