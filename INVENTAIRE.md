# Atlas V2 — inventaire

> **Artefact.** Refait par `node outils/inventaire.mjs`. Rien n'y est saisi :
> les outils sont lus sur le disque, leur titre vient de leur propre en-tête,
> les nombres viennent des index.

**À lire en premier.** Ce fichier existe parce que sur une longue session on
perd le compte de ce qui a déjà été construit, et qu'on repropose alors un
outil qui existe. Un projet qui ne sait pas se présenter oblige quiconque y
arrive à le redécouvrir en le fouillant.

## En un coup d'œil

| | |
| --- | ---: |
| objets au magasin | **1321** (6,01 Go) |
| pièces indexées | 122 |
| bibliothèques | 22 — 20 pleines, 2 vides |
| pièces avec papiers | 107 |
| nœuds | 170 |
| adossements | `https://pub-2b7bae29511147ee9e21410d4cff8624.r2.dev` + SSD local |

## La racine

| | poids | ce que c'est |
| --- | ---: | --- |
| 📁 `.agentcad` | 460 o | Réglages d'agentcad. |
| 📁 `.cache` | 0 o | Vide. Le cache d'Atlas V1 a été rapatrié au magasin ; ce tiroir ne doit plus rien porter. |
| 📁 `.claude` | 36 Ko | Les skills et réglages de Claude Code pour ce dépôt. |
| 📁 `.distribution` | 239 Ko | Sortie de `node outils/distribuer.mjs` — les deux arbres de skills avant publication. Écartée de git : les versionner ferait deux vérités pour un même skill. |
| 📁 `.git` | 549 Mo | L'historique. |
| 📁 `.venv` | 1,47 Go | L'environnement Python de l'agent (build123d, cadquery, mediapipe, agentcad). Réinstallable. |
| 📁 `apps` | 56 Mo | Le front. `apps/web` porte la visionneuse three.js et le bundle iris-3d. |
| 📁 `atelier` | 339 Ko | Les modules Blender partagés : matières, studio, peau, cheveux, œil, cartes, épreuve. |
| 📁 `bibliotheques` | 6,77 Go | Les 22 boîtes de pièces, leurs fiches, leurs provenances. C'est l'arborescence LISIBLE — les octets, eux, vivent au magasin. |
| 📁 `docs` | 1 Mo | Notes et documents de travail. |
| 📁 `donnees` | 3 Mo | Les relevés bruts d'un lieu RÉEL — extraits OSM, altimétrie. On les GARDE pour que la chaîne soit rejouable : le 18/08/2026, la rupture entre la passe 2 et la passe 3 a pu passer inaperçue parce que tout vivait dans des fichiers temporaires. |
| 📁 `enquetes` | 17 Ko | Une enquête par objet, exigée par `atelier/portillon.py` AVANT de lancer son script. Cinq sections, dont « ce qui réfuterait » — au moins deux contrôles et un invariant. |
| 📁 `generateurs` | 341 Ko | Ce qui doit être fabriqué à chaque projet — climat, ambiance, terrain, mouvement — avec leurs presets. |
| 📁 `magasin` | 6,58 Go | Le stockage d'Atlas. Objets adressés par leur empreinte SHA-256, immuables, en lecture seule. `objets/` est écarté de git ; l'index l'est. |
| 📁 `node_modules` | 1,05 Go | Dépendances npm. Réinstallables depuis le verrou. |
| 📁 `outils` | 583 Ko | Les commandes. Chacune refabrique un artefact ou mesure un état ; aucune ne se contente d'afficher. |
| 📁 `packages` | 8 Mo | Les contrats TypeScript partagés — nœuds, climat, variantes. |
| 📁 `r2` | 4,38 Go | Adossement local du magasin — `node outils/magasin.mjs --adosser r2`. Une COPIE (4,4 Go), jamais l'original : le magasin reste la vérité, r2 n'est qu'une réplique de plus, au même titre que le bucket Cloudflare. Écartée de git. |
| 📁 `scenes` | 4 Ko | Les descripteurs de scène — du JSON. Une scène nomme ses pièces, son ciel et un mouvement du répertoire ; `apps/web/src/visionneuse/scene.js` les monte. Monter un site, c'est écrire un fichier ici. |
| 📁 `sorties` | 629 Mo | Les artefacts produits par les passes du quartier, un dossier par lieu. Rejouables depuis `donnees/`, donc écartés de git. |
| 📁 `vendor` | 72 Mo | Les paquets ACHETÉS — `threejs-sky-pro`, `threejs-water-pro`. Référencés en `file:` par `apps/web/package.json`, écartés de git : le dépôt s'ouvre par moments et les y versionner les redistribuerait. Un clone frais saura donc qu'ils manquent, et pourquoi. |
| 📄 `.gitignore` | 9 Ko | Ce qui ne part pas au dépôt — et chaque règle porte la raison qui la justifie. |
| 📄 `AGENTS.md` | 4 Ko | Artefact — `node outils/amorce.mjs`. Le jumeau de CLAUDE.md pour les agents qui ne sont pas Claude (Codex et la plupart des autres lisent ce nom). Même corps, généré de la même source ; seule la queue diffère — chez eux rien ne se charge tout seul, il faut lire les consignes. |
| 📄 `CAHIER-DES-CHARGES.md` | 106 Ko | Le cahier des charges d'Atlas V2 (Sacha, 18/08/2026). Écrit à la main — PAS un artefact. Il se CORRIGE dès qu'une mesure contredit une hypothèse qu'il pose, et chaque correction porte sa date. Se lit avec `SUIVI-OBLIGATOIRE.md`, jamais seul. |
| 📄 `CARTE.md` | 28 Ko | Artefact — `node outils/carte.mjs`. POUR QUI CONSTRUIT : quel code produit quoi, avec quelle bibliothèque, les recettes, les pièges déjà rencontrés, ce dont on dépend dehors. |
| 📄 `CLAUDE.md` | 3 Ko | Artefact — `node outils/amorce.mjs`. LE SEUL FICHIER LU SANS CONDITION par tout agent qui travaille ici : où l'on est, pour qui on répond, ce qu'il ne faut jamais faire. Court délibérément — il coûte à chaque question. |
| 📄 `DOCUMENTATION.md` | 18 Ko | Artefact — `node outils/documentation.mjs`. |
| 📄 `ETAT.md` | 35 Ko | Artefact — `node outils/etat.mjs`. Les directions prises, ce qui est fait, ce qui ne l'est pas et POURQUOI. |
| 📄 `INVENTAIRE.md` | 17 Ko | Ce fichier. Artefact — `node outils/inventaire.mjs`. |
| 📄 `package.json` | 575 o | Le manifeste du workspace. |
| 📄 `pnpm-lock.yaml` | 188 Ko | Le verrou des dépendances. |
| 📄 `pnpm-workspace.yaml` | 535 o | Les paquets du workspace. |
| 📄 `README.md` | 8 Ko | Artefact — `node outils/racine.mjs`. |
| 📄 `SUIVI-OBLIGATOIRE.md` | 11 Ko | L'ordre des phases et ce qui PROUVE qu'une phase est finie — une URL que Sacha ouvre lui-même, jamais un compte rendu. Écrit à la main. Porte aussi les deux volets du portillon d'outil et l'état `SUIVI.json`. Se lit avec `CAHIER-DES-CHARGES.md`, jamais seul. |
| 📄 `SUIVI.config.json` | 2 Ko | Les CRITÈRES du portillon de phase — qui précède qui, ce qui compte comme entrée mesurée. Séparé de la logique exprès : ces critères bougent à l'usage, la mécanique du refus non. |
| 📄 `SUIVI.json` | 4 Ko | L'ÉTAT du phasage — quelle phase est ouverte, par qui, depuis quand. Deux champs n'appartiennent qu'à Sacha et aucun agent ne les renseigne : `ouverte_par_sacha` et `derogation_sacha`. Lu par `refuserSiPhaseSansPreuve()` dans le garde. |
| 📄 `tsconfig.base.json` | 598 o | La base TypeScript. |
| 📄 `VITRINE.md` | 5 Ko | Artefact — `node outils/vitrine.mjs`. POUR LE CLIENT : ce qu'Atlas sait faire, ce qu'il faut fournir, les limites, ce que ça coûte. Aucun code. |

## Les outils — 36 commandes

Chacune **refabrique** ou **mesure**. Aucune ne se contente d'afficher, et
aucun artefact ne se corrige à la main : on corrige l'outil, on relance.

| outil | ce qu'il fait |
| --- | --- |
| `amorce.mjs` | L'AMORCE — le seul fichier qu'un agent lit SANS QU'ON LE LUI DEMANDE. |
| `bibliotheques.mjs` | LA BIBLIOTHÈQUE DE BIBLIOTHÈQUES — et la racine COMPTE, elle n'affirme pas. |
| `blendkit.mjs` | IMPORTER UNE PIÈCE DE BLENDKIT DANS LE MAGASIN. |
| `capture.mjs` | CAPTURER LA VISIONNEUSE — une image de ce que le navigateur montre vraiment. |
| `carte.mjs` | LA CARTE — pour qui CONSTRUIT Atlas. Qui produit quoi, où, avec quoi. |
| `catalogue.mjs` | L'AGENT QUI CHOISIT — le catalogue des pièces éligibles à une scène. |
| `citations.mjs` | LES CITATIONS — un générateur dit quel outil il invoque, ou il ne tourne pas. |
| `coffre.mjs` | LE COFFRE — ce qui est téléchargé ou fabriqué une fois est GARDÉ. |
| `diag.mjs` | DIAGNOSTIC DE LA VISIONNEUSE — ce que la page casse, en console et en réseau. |
| `distribuer.mjs` | LA DISTRIBUTION — deux dépôts, une seule source. |
| `documentation.mjs` | LA DOCUMENTATION COMPLÈTE — générée, pour que ses chiffres ne dérivent pas. |
| `eclater.mjs` | ÉCLATER UN KIT DE LA BIBLIOTHÈQUE EN MODULES POSABLES. |
| `empreintes.mjs` | LES EMPREINTES — ce qui est vraiment rechargeable, mesuré, pas supposé. |
| `etat.mjs` | L'ÉTAT — ce qui est fait, ce qui ne l'est pas, et pourquoi. |
| `extension-blender.mjs` | POSER UNE EXTENSION DANS BLENDER, ET LE VÉRIFIER SUR LE DISQUE. |
| `extraire-climat.mjs` | LA BIBLIOTHÈQUE DE CLIMAT — extraite du CONTRAT COMPILÉ, pas du source. |
| `extraire-mouvements.mjs` | LE RÉPERTOIRE DE MOUVEMENTS — extrait du CONTRAT COMPILÉ, pas recopié. |
| `garde.mjs` | LE GARDE — les artefacts sont à jour, ou rien ne passe. |
| `hublot.mjs` | LE HUBLOT — montrer UNE page à distance, et rien d'autre. |
| `imports.test.mjs` | AUCUN OUTIL NE DOIT AGIR QUAND ON LE LIT. |
| `inventaire-matieres.mjs` | INVENTAIRE DES MATIÈRES — compté sur le disque, jamais recopié d'une liste. |
| `inventaire.mjs` | L'INVENTAIRE — ce qu'il y a dans Atlas, et par quelle commande y toucher. |
| `magasin.mjs` | LE MAGASIN — Atlas a son stockage, et on l'APPELLE. |
| `noeuds.mjs` | LE SYSTÈME NODAL — bâti sur ce qui est SUR LE DISQUE, pas sur une intention. |
| `nomenclature.mjs` | LA NOMENCLATURE — une pièce dont les sous-parties n'ont pas de nom |
| `polyhaven.mjs` | RAPATRIER DE POLY HAVEN — toujours DEUX versions, jamais une seule. |
| `pousser-r2.mjs` | POUSSER LE MAGASIN CHEZ R2 — et vérifier ce qui est arrivé. |
| `preuve-rotation.mjs` | PREUVE DE LA ROTATION — mesurée sur la scène en marche, pas sur le code. |
| `provenance.mjs` | LA PROVENANCE — une orthographe par source, et personne sans papiers. |
| `racine.mjs` | LE README DE LA RACINE — généré, parce qu'un état écrit à la main ment vite. |
| `reprendre.mjs` | REPRENDRE — une machine neuve, une seule commande. |
| `skills.mjs` | LES SKILLS — leur prose est écrite, leurs chiffres sont COMPTÉS. |
| `sondes.mjs` | LES SONDES — une mesure, une implémentation, un test pour chaque faute. |
| `sondes.test.mjs` | LE MÉMORIAL DES FAUTES — chacune devient un test, pour toujours. |
| `vitre.mjs` | LA VITRE — ouvrir le dépôt, et ne pas oublier de le refermer. |
| `vitrine.mjs` | LA VITRINE — ce qu'Atlas sait faire, pour qui ne code pas. |

## Les commandes, telles que les outils les documentent

```bash
node outils/amorce.mjs
node outils/bibliotheques.mjs
node outils/blendkit.mjs --chercher "apartment
node outils/blendkit.mjs --boite architecture --id <assetBaseId>
node outils/capture.mjs
node outils/carte.mjs
node outils/catalogue.mjs --boite architecture
node outils/catalogue.mjs --boite architecture --style mediterraneen --sortie /tmp/cat.json
node outils/citations.mjs
node outils/coffre.mjs --inventaire
node outils/coffre.mjs --verifier
node outils/coffre.mjs --miroir "/Volumes/SSD
node outils/coffre.mjs --controler "/Volumes/SSD
node outils/diag.mjs
node outils/distribuer.mjs
node outils/distribuer.mjs --pousser
node outils/documentation.mjs
node outils/eclater.mjs --mesurer
node outils/eclater.mjs --piece architecture/facades_modulaires
node outils/empreintes.mjs
node outils/empreintes.mjs --verifier
node outils/empreintes.mjs --hors-ligne
node outils/etat.mjs
node outils/extension-blender.mjs --etat
node outils/extension-blender.mjs --poser <pkg_id>
node outils/extraire-climat.mjs
node outils/extraire-mouvements.mjs
node outils/garde.mjs
node outils/garde.mjs --installer
node outils/hublot.mjs --page index
node outils/hublot.mjs --page piece --piece objectif-troncon.glb
node outils/hublot.mjs --page piece --port 4470 --minutes 30
node outils/imports.test.mjs
node outils/inventaire-matieres.mjs
node outils/inventaire.mjs
node outils/magasin.mjs --ingerer
node outils/magasin.mjs --verifier
node outils/magasin.mjs --ou marble_01
node outils/magasin.mjs --adosser <chemin>
node outils/magasin.mjs --etat
node outils/noeuds.mjs
node outils/polyhaven.mjs --boite objets --slug Camera_01
node outils/polyhaven.mjs --rejouer
node outils/pousser-r2.mjs --bucket atlas-magasin
node outils/pousser-r2.mjs --bucket atlas-magasin --controler
node outils/pousser-r2.mjs --bucket atlas-magasin --paralleles 8
node outils/preuve-rotation.mjs
node outils/provenance.mjs
node outils/provenance.mjs --verifier
node outils/racine.mjs
node outils/reprendre.mjs
node outils/reprendre.mjs --sans-assets
node outils/skills.mjs
node outils/sondes.test.mjs
node outils/vitre.mjs
node outils/vitre.mjs --ouvrir "raison"
node outils/vitre.mjs --fermer
node outils/vitrine.mjs
```

## Les skills — 5

Ils sont listés ici pour la raison même qui a fait naître ce fichier : **ce qui
n'est pas listé sera réécrit.**

| skill | ce qu'il déclenche |
| --- | --- |
| `agentcad` | CAD tool for AI agents. Use when the user asks you to design, model, or build a 3D object. agentcad executes build123d or CadQuery Python scripts and produces STEP files, PNG renders, mesh exports (STL/GLB/OBJ), and geometric metrics. |
| `construire` | À CHARGER par qui développe Atlas V2 — dès qu'il faut modifier du code, ajouter une pièce, régénérer un objet, écrire un outil, toucher au magasin, à l'atelier Blender, aux contrats ou au front. Donne la carte du code (quel fichier produit quoi, avec quelle bibliothèque), les recettes en plusieurs commandes, les pièges déjà rencontrés et ce qui refuse. Évite de travailler de mémoire. |
| `inventaire` | À CHARGER AVANT TOUTE ACTION sur le dépôt Atlas V2 (~/Projet de développement/atlas-v2) — dès qu'il est question du magasin, des bibliothèques, des textures, des provenances, des nœuds, du stockage R2/SSD, de la visionneuse three.js ou de n'importe quel outil de outils/. Fait lire l'inventaire et l'état avant d'agir, pour ne pas reconstruire ce qui existe ni redire ce qui a déjà été dit. |
| `presenter` | À CHARGER quand la réponse est destinée à un CLIENT, ou à quelqu'un qui ne développe pas Atlas — présenter ce qu'Atlas sait faire, chiffrer une demande, dire ce qu'il faut fournir, annoncer un délai, expliquer une limite, préparer un devis ou une proposition. Se charge aussi quand on prépare une présentation. Interdit le vocabulaire technique et les lignes de commande. |
| `scene` | Monter une scène 3D d'Atlas à partir d'une demande en langage courant — pour un site client, une démonstration, un rendu. À charger dès qu'il s'agit de composer, cadrer, animer une scène, ou d'écrire un descripteur de scène. Définit les deux rôles (comprendre, construire), le protocole de questions libres et ses quatre duretés, et le contrat d'alignement. |

**Comment les nommer.** Le dossier scope déjà les skills à Atlas — les préfixer
d'`atlas-` ne distingue rien. Un nom dit **ce que le skill fait**, en un mot :
`inventaire`, pas `atlas`. Et le champ `name:` doit être exactement le nom du
dossier.

## Le front — 11 pages et modules

Ce qu'Atlas montre. Lu sur le disque, comme le reste.

| fichier | ce que c'est |
| --- | --- |
| `banc.mjs` | LE BANC DE LA VISIONNEUSE — les chiffres, et l'épreuve des sondes. |
| `chaine-complete.html` | LA CHAÎNE ENTIÈRE, EN UNE PAGE. |
| `fontvieille.html` | Atlas — Fontvieille, Monaco |
| `index.html` | Visionneuse — Iris |
| `magasin-navigateur.js` | LE MAGASIN, CÔTÉ NAVIGATEUR — et il vérifie ce qu'il reçoit. |
| `monaco-avenue.html` | Atlas — Avenue Albert II, Monaco |
| `scene.html` | Atlas — une scène est un fichier |
| `scene.js` | LE MOTEUR DE SCÈNE — il ne connaît aucune scène en particulier. |
| `soleil.js` | LE SOLEIL D'UN CIEL — mesuré dans l'image, et ÉPROUVABLE hors navigateur. |
| `trois.mjs` | TROIS — une seule copie de three.js, embarquée, élaguée. |
| `visionneuse.js` | LA VISIONNEUSE — la scène du générateur, dans un navigateur. |

## Les trois règles du dépôt

1. **Un artefact ne se relit pas, il se refabrique.** README, DOCUMENTATION,
   ETAT, INVENTAIRE, les index, les fiches de nœud : tous générés. Corriger un
   artefact à la main, c'est réparer le symptôme et laisser la faute en place.
2. **Une pièce sans provenance n'entre pas.** La règle a servi à écarter des
   pièces utiles ; la plier une fois la ferait cesser d'exister.
3. **Une sonde se vérifie avant son verdict.** Sur une configuration à réponse
   connue. Une sonde fausse est pire qu'aucune sonde — ce dépôt en a la
   démonstration écrite dans `ETAT.md`.

## Où lire la suite

- `CARTE.md` — **pour qui construit** : quel code produit quoi, les recettes, les pièges.
- `VITRINE.md` — **pour le client** : ce qu'Atlas sait faire, sans code.
- `ETAT.md` — les directions prises, ce qui est fait, ce qui ne l'est pas et pourquoi.
- `DOCUMENTATION.md` — le projet en détail.
- `magasin/MAGASIN.md` — le stockage, comment on l'appelle, où il est adossé.
- `bibliotheques/LISEZ-MOI.md` — les boîtes, les sources, ce qui est irremplaçable.
- `bibliotheques/NOEUDS.md` — le graphe des nœuds et leurs origines.
