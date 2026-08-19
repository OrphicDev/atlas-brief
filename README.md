# Atlas — dossier d'explication

De quoi comprendre Atlas — pour demander de l'aide sans ouvrir l'atelier.

**Ce dépôt contient les documents, et UN extrait de code nommé.** Ni assets,
ni adresses d'écriture, ni clés — seulement ce qui explique le projet, plus le
magasin et le système nodal, déposés dans `code/` pour être lus. Tout le reste
du code vit dans un dépôt privé.

Cet extrait a été ajouté le 19/08/2026 à la demande de Sacha : le magasin et son
système nodal sont une pièce de fond, et les résumer de seconde main revenait à
en perdre le raisonnement. `code/LISEZ-MOI.md` dit ce qui s'y trouve et ce qui
en est délibérément absent.

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
| `MAGASIN.md` | pourquoi le magasin existe et comment il est fait |
| `NOEUDS.md` | la règle qui décide où chaque pièce doit vivre |
| `code/` | **le code du magasin et du système nodal**, à lire |
| `MAGASIN.md` | le stockage : objets adressés par leur contenu |
| `CLAUDE.md` | les règles que suit tout agent qui travaille sur le projet |

## Si vous êtes une IA à qui on demande de l'aide

Lisez `CARTE.md` puis `ETAT.md`. Le second porte la liste des fautes déjà
trouvées et de leur cause : plusieurs reviendraient sans ça.

Trois règles gouvernent ce dépôt, et elles expliquent beaucoup de ses choix :
un artefact ne se relit pas, il se refabrique ; une pièce sans provenance
n'entre pas ; une sonde se vérifie avant son verdict.

_Documents refaits depuis la source par `node outils/distribuer.mjs`._
