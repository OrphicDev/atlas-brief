# Le magasin et le système nodal — le code, pas son résumé

Ces fichiers sont la copie exacte de ceux qui tournent dans le dépôt privé.
Ils sont ici pour être **lus**, pas exécutés : rien n'est branché, et le reste
du dépôt reste absent.

## Le magasin — `code/magasin/`

| fichier | ce qu'il fait |
| --- | --- |
| `magasin.mjs` | le magasin lui-même : ingestion, adressage par contenu, liens durs, adossements, vérification |
| `blendkit.mjs` | la porte d'entrée Blendkit : cherche, prédit le coût mémoire, convertit par Blender, range |
| `polyhaven.mjs` | la même porte, pour Poly Haven, qui sert déjà du glTF |
| `index.json` | l'artefact : ce que le magasin contient aujourd'hui, pièce par pièce |

**Le principe tient en une phrase** : un objet est nommé par l'empreinte
SHA-256 de son contenu, et par rien d'autre. Trois conséquences en découlent —
le dédoublonnage est gratuit, chaque objet est immuable, et vérifier ne demande
aucun manifeste à croire : on relit l'objet et on regarde s'il porte encore son
nom.

`MAGASIN.md`, à la racine de ce dépôt, explique le pourquoi. Le code dit le
comment.

## Le système nodal — `code/noeuds/`

| fichier | ce qu'il fait |
| --- | --- |
| `noeud.ts` | la RÈGLE : `origineDe(existe, dependDuBrief)` décide où une pièce doit vivre |
| `noeuds.mjs` | le relevé : parcourt le projet et construit le graphe |
| `noeuds.json` | l'artefact : 173 nœuds, 451 arcs |

**La question qui tranche** est dans `NOEUDS.md`, à la racine : *la pièce
dépend-elle du brief ?* Oui, elle est unique et ne se range pas. Non, elle est
réutilisable et se range — sans quoi on la repaie à chaque projet.

## Ce qui n'est PAS ici, et pourquoi

- **les octets du magasin** — 6,01 Go d'assets sous licences tierces ;
- **`adossements.json`** — il porte les adresses des répliques, dont certaines
  avec jeton. Il est écarté de git dans le dépôt privé aussi, et le code le
  documente en toutes lettres ;
- **aucune clé d'API** — `blendkit.mjs` lit la sienne dans les préférences de
  Blender au moment de l'appel, ne l'écrit nulle part et ne la journalise pas.
