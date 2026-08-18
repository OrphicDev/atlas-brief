# Atlas — ce que ça sait faire

> **Artefact.** Refait par `node outils/vitrine.mjs`. Les chiffres sont relevés
> sur le dépôt, jamais estimés.

Atlas fabrique des objets et des décors en 3D, les prépare pour qu'ils
s'affichent dans un navigateur, et leur donne un mouvement — pour des sites
internet.

## Ce qu'il y a en réserve, aujourd'hui

| | |
| --- | ---: |
| pièces disponibles | **122** |
| fichiers stockés | 1321 (6,01 Go) |
| catégories | 22 |
| scènes montées | 4 |

- **55** — Matières photographiées — marbre, bois, tissu, béton, écorce
- **15** — Références relevées sur des sites existants
- **9** — Ciels et intérieurs qui éclairent la scène
- **8** — architecture
- **7** — Objets fabriqués sur mesure
- **7** — Écorces et feuillages
- **5** — Mobilier d'intérieur
- **5** — mobilier-urbain
- **4** — Corps, peau, cheveux
- **4** — Sols et reliefs
- **2** — vehicules
- **1** — animaux

Chaque pièce existe en **deux qualités** : une pour le rendu soigné, une
allégée pour le navigateur. Le choix se fait tout seul selon l'appareil et la
connexion du visiteur.

## Ce qu'on peut demander

### Une scène 3D animée pour une page web

Un objet ou un décor qui se dévoile au défilement : la caméra bouge, la lumière change, les matières réagissent au ciel.

- **Ce que vous fournissez** : Ce que la scène doit montrer, et l'effet voulu sur le visiteur.
- **Délai** : Une scène simple se monte dans la journée si les pièces existent déjà.

### Un objet modélisé à ses vraies cotes

Un objet fabriqué sous Blender, mesuré, avec sa matière — et livré en deux qualités : une pour le rendu, une allégée pour le navigateur.

- **Ce que vous fournissez** : Les dimensions réelles, ou une photo cotée. À défaut, la référence du produit.
- **Délai** : Compter plus longtemps : chaque objet passe par une enquête écrite avant d'être construit.

### Une matière précise

Marbre, chêne, laine, béton… photographiée, avec sa taille réelle — une dalle de 1,50 m reste une dalle de 1,50 m à l'écran.

- **Ce que vous fournissez** : Le nom de la matière, ou une photo de ce qui s'en approche.
- **Délai** : Immédiat si elle est au catalogue, sinon quelques minutes.

### Une ambiance lumineuse

Le ciel choisi éclaire ET se reflète : un métal n'existe que par ce qu'il reflète. Changer de ciel change tout, sans retoucher un objet.

- **Ce que vous fournissez** : Le moment de la journée, l'endroit, l'humeur.
- **Délai** : Immédiat.

## Comment ça se passe

On part de ce que la scène doit produire chez le visiteur, pas d'une liste de
fichiers. Selon ce qui est déjà clair, **deux à quatre questions** sont posées
avant de commencer — jamais des questions toutes faites : elles naissent de la
demande, et chaque réponse proposée dit ce qu'elle change concrètement. Un
choix « autre » reste toujours ouvert.

Ce qui a été compris est **écrit avant de construire** — y compris ce qui ne
sera pas fait. C'est ce point-là qui évite les malentendus : un accord sur ce
qu'on fait cache souvent un désaccord sur ce qu'on laisse de côté.

Sur demande, quatre questions supplémentaires sont posées **après** la
livraison, pour vérifier que le résultat correspond bien à l'intention.

## Ce qu'il faut savoir avant de s'engager

**Avant une mise en ligne réelle, un nom de domaine est nécessaire.** Les fichiers sont servis aujourd'hui par une adresse de développement, que l'hébergeur bride volontairement. Pour un site qui reçoit du public, il faut y brancher un domaine — c'est un réglage, pas un chantier.

**Une pièce sans origine vérifiable n'entre pas.** Chaque matière, chaque objet porte sa source et sa licence. Des modèles gratuits mais sans origine claire ont été écartés : utiliser une pièce dont on ne peut pas prouver le droit d'usage est un risque qu'on ne prend pas.

**Les corps humains sont à refaire.** Ce qui existe sur la peau, les cheveux et les yeux sera repris autrement. Ne pas compter dessus pour l'instant.

**Le lourd et le léger sont livrés ensemble.** Chaque pièce existe en deux versions. Le navigateur prend la légère sur un téléphone ou une connexion lente, sans qu'on ait à y penser.

## De quoi ça dépend, et ce que ça coûte

| | |
| --- | --- |
| **Stockage des fichiers** | Cloudflare R2 — gratuit jusqu'à 10 Go, et la consultation ne coûte rien, quel que soit le trafic. Occupé aujourd'hui : 6,01 Go. |
| **Logiciel de fabrication** | Blender — libre et gratuit. |
| **Matières et ciels** | Poly Haven et ambientCG — libres de droits (CC0), réutilisables commercialement, sans attribution obligatoire. L'attribution est portée quand même. |
| **Ce qui reste à ouvrir** | Trois catalogues d'assets demandent la création d'un compte (gratuits) : Blendkit, Geo-Scatter, Buildify. |

## Ce qui garantit que ça tient

Trois choses, et aucune ne repose sur la bonne volonté :

- **Chaque fichier est vérifié à l'arrivée.** Un fichier est nommé d'après son
  contenu ; s'il arrive abîmé, il est refusé au lieu d'être affiché.
- **Rien n'est perdu.** Ce qui a été téléchargé ou fabriqué une fois est
  conservé, en trois endroits. Si un fournisseur ferme, rien ne change.
- **La documentation ne peut pas mentir.** Elle est refabriquée à partir du
  projet, et une modification qui la laisserait en retard est refusée
  automatiquement.
