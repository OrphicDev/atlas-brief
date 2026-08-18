# Atlas V2 — à lire d'abord

> **Artefact.** Refait par `node outils/amorce.mjs`. Ne pas éditer à la main :
> la prochaine génération effacerait la correction.

**Atlas génère des objets et environnements 3D sous Blender, les transfère vers
Three.js pour qu'ils soient lisibles dans un navigateur, puis leur donne la
capacité d'être animés pour des sites internet via Theatre.js.**

## Si vous lisez ceci, vous construisez

Avoir ce dépôt sous la main, c'est être du côté de la fabrication. Un client n'a
pas de dépôt cloné.

Ce qui varie n'est pas votre rôle mais **le destinataire de votre réponse** :

| pour qui vous répondez | la consigne | le document |
| --- | --- | --- |
| vous-même, pour agir sur le code | `construire` | `CARTE.md` |
| un client, ou celui qui présente | `presenter` | `VITRINE.md` |

**En cas de doute, demandez.** Une question, deux à quatre choix qui disent ce
qu'ils changent, et un « Autre » toujours ouvert. Ne devinez pas le public : un
constructeur et un client posent la même question — « qu'est-ce qu'Atlas sait
faire ? » — et attendent deux réponses différentes.

## Avant la première action

```bash
node outils/carte.mjs && cat CARTE.md
```

Elle se **refait** avant de s'afficher. Elle dit quel fichier produit quoi, avec
quelle bibliothèque, et dans quel ordre lancer les commandes qui se dépendent —
36 outils, et des séquences qu'on ne devine pas.

## Quatre choses à ne jamais faire

1. **Corriger un artefact à la main.** `README`, `DOCUMENTATION`, `ETAT`,
   `INVENTAIRE`, `CARTE`, `VITRINE`, ce fichier, les index, les fiches de
   nœud, et les chiffres entre marques dans les skills. On corrige l'outil, on
   relance. Sinon on répare le symptôme et la génération suivante l'efface.
2. **Écrire un chemin de fichier d'asset.** On nomme une pièce, le magasin
   résout. Une copie d'asset hors du magasin vieillit en silence : c'est arrivé,
   l'or du front est resté cassé pendant que la pièce était corrigée.
3. **Croire un rapport.** On regarde le disque. Les pièges consignés dans
   `CARTE.md` ont tous été trouvés par le même réflexe : faire dire le même
   nombre à deux sources indépendantes.
4. **Contourner un garde.** Ils refusent quelque chose de précis et ce ne sont
   pas des pannes. On les satisfait sur leurs termes.

## Ce dont il ne faut pas s'occuper

Les humanoïdes et le rig (`bibliotheques/humain/`) seront refaits autrement
(Sacha, 17/08/2026).

## Ce que l'agent ne fait pas lui-même

Créer un compte, saisir un mot de passe, manipuler un jeton d'API.

---

_1321 objets au magasin (6,01 Go) · détail dans `INVENTAIRE.md`_

## Si vous n'êtes pas Claude

**Rien ne se charge tout seul chez vous.** Les fichiers de `.claude/skills/` sont
des consignes en Markdown, lisibles par n'importe qui — mais aucun mécanisme ne
vous les présentera. **Ouvrez-les selon ce que vous faites :**

| ce que vous faites | à lire |
| --- | --- |
| modifier du code, ajouter une pièce, régénérer un objet | `.claude/skills/construire/SKILL.md` |
| monter ou cadrer une scène 3D | `.claude/skills/scene/SKILL.md` |
| répondre pour un client, chiffrer, présenter | `.claude/skills/presenter/SKILL.md` |

**Ce qui ne dépend d'aucun agent, en revanche, s'applique à vous.** Le crochet
`pre-commit` est au niveau de git et `portillon.exiger()` est appelé dans les
scripts Python : ils refuseront votre travail comme celui d'un autre, y compris
lancé à la main. Ce ne sont pas des pannes — lisez le motif, il est écrit.

`.claude/launch.json` ne vous servira pas : c'est l'outil d'aperçu de Claude
Code. Lancez le serveur comme vous en avez l'habitude —
`pnpm --filter @atlas/web exec tsx src/main.ts` — puis ouvrez
`/visionneuse/scene.html?scene=premiere`.
