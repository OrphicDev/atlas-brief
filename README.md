# Atlas — dossier d'explication

De quoi comprendre Atlas — pour demander de l'aide sans ouvrir l'atelier.

**Ce dépôt ne contient aucun code.** Ni scripts, ni assets, ni adresses
d'écriture — seulement les documents qui expliquent le projet. Le code vit dans
un dépôt privé.

Atlas génère des objets et environnements 3D sous Blender, les transfère vers
Three.js pour qu'ils soient lisibles dans un navigateur, puis leur donne la
capacité d'être animés pour des sites internet via Theatre.js.

## Par où commencer

| fichier | ce qu'il dit |
| --- | --- |
| `CARTE.md` | quel code produit quoi, avec quelle bibliothèque, les recettes, les pièges déjà rencontrés |
| `ETAT.md` | les directions prises, ce qui est fait, ce qui ne l'est pas et **pourquoi** |
| `INVENTAIRE.md` | ce qu'il y a, entrée par entrée |
| `VITRINE.md` | ce qu'Atlas sait faire, sans vocabulaire technique |
| `MAGASIN.md` | le stockage : objets adressés par leur contenu |
| `CLAUDE.md` | les règles que suit tout agent qui travaille sur le projet |

## Si vous êtes une IA à qui on demande de l'aide

Lisez `CARTE.md` puis `ETAT.md`. Le second porte la liste des fautes déjà
trouvées et de leur cause : plusieurs reviendraient sans ça.

Trois règles gouvernent ce dépôt, et elles expliquent beaucoup de ses choix :
un artefact ne se relit pas, il se refabrique ; une pièce sans provenance
n'entre pas ; une sonde se vérifie avant son verdict.

_Documents refaits depuis la source par `node outils/distribuer.mjs`._
