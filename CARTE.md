# Atlas V2 — la carte, pour qui construit

> **Artefact.** Refait par `node outils/carte.mjs`. Chaque chemin déclaré est
> contrôlé sur le disque et chaque bibliothèque résolue pour de vrai : une carte
> qui pointe vers un fichier disparu est pire qu'une absence de carte.

Ce document répond à trois questions qu'`INVENTAIRE.md` ne traite pas : **quel
code produit quoi**, **avec quelle bibliothèque**, et **dans quel ordre lancer
les commandes qui se dépendent**.

## Ce qu'Atlas sait faire, et le code qui le porte

| capacité | le code | avec | la commande |
| --- | --- | --- | --- |
| **Stocker un objet pour toujours, adressé par son contenu**<br><span style="opacity:.7">SHA-256, objets en 444, liens durs vers l'arborescence — zéro octet dupliqué.</span> | `outils/magasin.mjs` | — | `node outils/magasin.mjs --ingerer` |
| **Servir le magasin à des tiers, et vérifier ce qu'ils reçoivent**<br><span style="opacity:.7">Le client recalcule l'empreinte : aucune confiance au transport.</span> | `outils/magasin.mjs`<br>`apps/web/src/visionneuse/magasin-navigateur.js` | Cloudflare R2 | `node outils/magasin.mjs --servir  |  --reclamer` |
| **Répliquer le magasin ailleurs (SSD, bucket) et le relire**<br><span style="opacity:.7">Type MIME par objet, cache immuable d'un an, index publié à la racine du bucket.</span> | `outils/magasin.mjs`<br>`outils/pousser-r2.mjs` | wrangler | `node outils/pousser-r2.mjs --bucket atlas-magasin` |
| **Inventorier tout le dépôt et vérifier qu'il est intact**<br><span style="opacity:.7">Chaque copie est RELUE à l'arrivée. Une copie non relue est un espoir.</span> | `outils/coffre.mjs` | — | `node outils/coffre.mjs --inventaire | --verifier | --miroir <dossier>` |
| **Savoir d'où vient chaque pièce et sous quelle licence**<br><span style="opacity:.7">Quatre sources : Poly Haven, ambientCG, Blender Foundation, Atlas.</span> | `outils/provenance.mjs`<br>`outils/empreintes.mjs` | — | `node outils/provenance.mjs --verifier` |
| **Rapatrier une texture ou un modèle depuis Poly Haven, en deux variantes**<br><span style="opacity:.7">full 4k + low 1k. L'ORDRE des tests compte : `Diffuse` avant `gltf`.</span> | `outils/polyhaven.mjs` | API Poly Haven | `node outils/polyhaven.mjs --boite textures --slug marble_01` |
| **Fabriquer un objet 3D sous Blender et l'exporter en glTF**<br><span style="opacity:.7">L'export RELIT le fichier écrit et REFUSE un matériau sans rugosité.</span> | `atelier/studio.py`<br>`atelier/matieres.py`<br>`bibliotheques/objets/` | Blender 5.2.0, bpy | `Blender --background --factory-startup --python <script> -- <sortie.png> <matiere>` |
| **Monter une scène à partir d'un fichier, dans un navigateur**<br><span style="opacity:.7">La scène NOMME ses pièces et un mouvement. Aucun chemin de fichier.</span> | `apps/web/src/visionneuse/scene.js`<br>`apps/web/src/visionneuse/scene.html`<br>`packages/contracts/src/scene.ts`<br>`scenes/` | three, @theatre/core | `http://localhost:<port>/visionneuse/scene.html?scene=premiere` |
| **Choisir un mouvement de caméra au répertoire**<br><span style="opacity:.7">Six mouvements, chacun avec une phrase « ce que ça fait au regard ».</span> | `packages/contracts/src/mouvement.ts`<br>`outils/extraire-mouvements.mjs` | — | `node outils/extraire-mouvements.mjs` |
| **Décider d'un climat cohérent (milieu × météo)**<br><span style="opacity:.7">8 milieux × 8 météos, 19 combinaisons que le monde interdit.</span> | `packages/contracts/src/climat.ts`<br>`generateurs/climat.mjs`<br>`outils/extraire-climat.mjs` | — | `node generateurs/climat.mjs` |
| **Ranger les pièces en système nodal (catalogue / réutilisable / unique)**<br><span style="opacity:.7">150 nœuds, 101 fiches.</span> | `packages/contracts/src/noeud.ts`<br>`outils/noeuds.mjs` | — | `node outils/noeuds.mjs` |
| **Se présenter : inventaire, état, documentation, carte**<br><span style="opacity:.7">Tous des artefacts. Aucun ne se corrige à la main.</span> | `outils/inventaire.mjs`<br>`outils/etat.mjs`<br>`outils/documentation.mjs`<br>`outils/racine.mjs`<br>`outils/carte.mjs` | — | `node outils/inventaire.mjs` |
| **Refuser un commit qui emporte une documentation périmée**<br><span style="opacity:.7">Posé en crochet pre-commit. Refabrique, PUIS refuse.</span> | `outils/garde.mjs` | — | `node outils/garde.mjs` |
| **Refuser de lancer un script d'objet sans enquête préalable**<br><span style="opacity:.7">Exige deux contrôles de réfutation, dont un INVARIANT.</span> | `atelier/portillon.py`<br>`outils/enquete.py`<br>`enquetes/` | — | `python3 outils/enquete.py ouvrir <sujet>` |

## Les recettes

Des séquences que rien ne devinait, et qui ont été payées en tâtonnements.

### Régénérer un objet dont le .glb est faux

_Les fichiers de l'arborescence sont des liens durs vers des objets en lecture seule : Blender échoue sur « cannot save » sans dire pourquoi._

```bash
node outils/magasin.mjs --detacher bibliotheques/objets/<piece>
python3 outils/enquete.py ouvrir <piece>-<script>   # le portillon l'exige
# remplir l'enquête : 2 contrôles minimum, dont un INVARIANT
Blender --background --factory-startup --python bibliotheques/objets/<piece>/<script>.py -- <sortie.png> <matiere>
node outils/magasin.mjs --ingerer
node outils/pousser-r2.mjs --bucket atlas-magasin
node outils/magasin.mjs --adosser "/Volumes/SSD Stockage 4To/Atlas-magasin"
```

### Ajouter une texture au magasin

_Deux variantes sont exigées ; l'outil les prend ensemble._

```bash
node outils/polyhaven.mjs --boite textures --slug <slug>
node outils/magasin.mjs --ingerer
node outils/pousser-r2.mjs --bucket atlas-magasin
```

### Écrire une nouvelle scène

_Le rayon est en MÈTRES et cadre la composition entière, pas une pièce._

```bash
node outils/magasin.mjs --etat            # quelles pièces existent
node outils/magasin.mjs --ou <piece>      # ses variantes et ses rôles
# écrire scenes/<nom>.json
# ouvrir /visionneuse/scene.html?scene=<nom> — la page signale un rayon faux
```

### Voir la scène dans un navigateur

_Le port 4400 est souvent déjà pris ; `autoPort` en attribue un autre._

```bash
# preview_start sur la configuration « atlas-v2-web » de .claude/launch.json
# puis /visionneuse/scene.html?scene=premiere
```

### Publier

_Le crochet pre-commit refuse si un artefact est en retard._

```bash
node outils/garde.mjs
git add -A && git commit
git push origin main
```

## Les pièges déjà rencontrés

Une faute réparée qui n'est pas écrite se refait. Toutes celles-ci ont été
trouvées par le même réflexe : **faire dire le même nombre à deux sources
indépendantes**.

| le piège | ce qu'il produisait |
| --- | --- |
| Une date de calendrier comparée à un instant UTC | Le portillon a refusé une preuve écrite le jour même : « datée du 19/08/2026 — dans le futur ». Il était 00 h 26 en France, donc 22 h 26 UTC la veille, et `jour()` bâtissait minuit UTC. Une date écrite par un humain est une date de CALENDRIER — celui qu'il a sous les yeux. La comparer à un instant UTC ouvre une fenêtre de deux heures, CHAQUE NUIT, où le contrôle refuse ce qui est vrai. Un défaut qui ne se montre qu'entre minuit local et minuit UTC ne se trouve jamais en testant à midi. Les dates se construisent et se comparent en local, et l'âge se compte en jours de calendrier depuis minuit. |
| Une zone relue au relâchement au lieu d'être saisie à l'appui | Signalé par Sacha sur un vrai téléphone : après avoir généré une pièce, la languette d'ambiance ne répondait plus — PAR INTERMITTENCE, ce qui accusait une course et non une géométrie. Trois causes en une. ① Un appui sur un bouton armait quand même le glissé de caméra : au-delà de 4 px de doigt, `bouge` passait à vrai et le relâchement sortait avant d'actionner la zone — or un doigt n'est JAMAIS immobile. ② Je relisais les zones au relâchement, alors que `batir()` les reconstruit à chaque repeinture ; une repeinture tombant entre l'appui et le relâchement (un ciel qui finit de charger, une ligne d'état) laissait viser des mailles retirées de la scène, dont la matrice monde ne se met plus à jour. ③ 22 px de languette là où l'ergonomie tactile en demande 44. La zone se SAISIT désormais à l'appui et s'actionne au relâchement si le doigt n'a pas dérivé de plus de 24 px, sans rien relire. |
| Un type de contenu supposé au lieu d'être déduit | La route des matières servait `image/jpeg` EN DUR. Elle a servi un `.hdr` de ciel le jour où la colonne haut est arrivée, en mentant sur ce qu'elle envoyait. Un fichier adressé par empreinte n'a pas d'extension : le type se relit dans l'index, il ne se devine pas au contexte d'origine de la route. |
| Une hauteur de panneau posée à vue | 250 px « à peu près » pour le panneau d'ambiance : la seconde rangée de climats pendait 4 px sous le fond. Troisième rectangle de la journée à dépasser son cadre — après le bouton d'envoi et l'invite du chat. La hauteur se DÉDUIT de ce qu'on met dedans (marge, titre, cartes, rangées) ; posée à vue, elle est juste jusqu'au jour où l'on ajoute une ligne. |
| Une correction qui n'a pas fait le tour de ses semblables | L'invite du chat débordait à 375 px : bornée. Mais la LIGNE D'ÉTAT du bandeau, un texte de même nature à trois lignes de là, ne l'était pas — et « aucun preset ne correspond — essayez « un objectif » » se coupait à « essayez « un… », perdant le conseil exactement là où il servait. Réparer un cas sans chercher ses jumeaux laisse le défaut vivant sous un autre nom. Quand une faute de mise en page est trouvée, on relit TOUS les textes libres du même écran, pas seulement celui qui a été signalé. |
| Une pièce sans UV, habillée d'un aplat | Une vraie texture du magasin posée sur le tronçon rendait une couleur UNIFORME. Le maillage ne portait aucun TEXCOORD_0 : le moteur échantillonne alors l'image en (0,0) et peint ce seul pixel sur toute la pièce, sans lever la moindre erreur. Le contrôle vérifiait qu'une pièce est ADRESSABLE, rien ne vérifiait qu'elle est HABILLABLE — deux capacités du cahier rendues impossibles par une absence silencieuse, une seule avait son garde. Cinquième règle de `nomenclature.mjs` depuis le 18/08. |
| Un métal sans environnement, donc noir | La colonne droite règle `metalness` ; la pièce est devenue NOIRE au premier essai. Un métal ne fabrique pas sa couleur, il REFLÈTE — et deux lampes directionnelles éclairent sans se refléter. Le dépôt connaissait déjà la faute par l'autre bout (l'anneau d'or rendu « crème mat » faute de rugosité). Une colonne qui laisse régler un métal sans montrer ce qu'il devient est pire qu'absente : elle fait croire au réglage. `RoomEnvironment` est généré en mémoire, sans fichier ni tiers. |
| Une cible relue à l'arrivée d'un chargement | J'ai demandé une texture sur la bague, changé de sélection pendant le téléchargement, et le bois s'est posé sur le BARILLET en écrasant l'or. Le rappel relisait `choisi` au lieu de la cible figée au départ. C'est le défaut de signature du dépôt pris par un troisième bout : non plus un champ que personne ne relit, ni un champ que deux lecteurs attendent autrement, mais une valeur JUSTE au départ et périmée à l'arrivée. |
| Un outil « local » qui calcule ailleurs | Le cahier retenait GenPBR pour sa vertu supposée — « déterministe plutôt qu'une boîte noire d'IA générative ». La question était mal posée : son README dit « generating PBR maps USING GENPBR API » et exige « Sign up for an account » plus une clé. Déterministe ou non, le calcul part chez un tiers. Un outil se juge d'abord sur OÙ il calcule, ensuite sur COMMENT — la même règle qui a fait élaguer three plutôt qu'appeler esm.sh, et donner une police locale à troika. Vérifié AVANT d'écrire du code, ce qui est tout l'objet du volet « avant » du portillon. |
| Deux portillons, un seul verbe | Le dépôt en porte deux — `portillon.exiger(sujet)` réclame une ENQUÊTE, `outil.exiger(nom)` réclamait un OUTIL — et je les avais nommés pareil. La sonde statique de `citations.mjs` a lu `portillon.exiger("cinema-objectif-troncon")` comme une citation d'outil et REFUSÉ un générateur parfaitement en règle, en affirmant qu'il citait un outil inexistant. Un faux positif de contrôle est plus dangereux qu'un manque : c'est ce qui fait désactiver le contrôle. Le symptôme se réparait dans l'expression régulière ; la cause était le nom, devenu `exiger_outil`. Deux contrôles qui portent le même verbe finiront toujours par être confondus — par une sonde comme par un lecteur. |
| Un tunnel éprouvé au `curl` et non au navigateur | `localtunnel` était retenu au cahier pour une raison précise — « aucune authentification connue » — et cette propriété était fausse : il rend un HTTP 511 et une page d'interstitiel à franchir en saisissant l'IP publique de la machine hôte. Ce qui l'a caché un instant : un `curl` NU reçoit un 502 muet, pas l'interstitiel. Il faut l'agent d'un navigateur pour que le service montre ce qu'un humain verra. Une porte ouverte pour quelqu'un qui est loin s'éprouve avec l'outil de celui qui est loin, jamais avec le plus commode. |
| Un champ de contrat inventé au lieu d'être lu | J'ai écrit `empreintes` en DICTIONNAIRE `{fichier: sha}` dans la provenance des polices. Le contrat du dépôt est une LISTE d'objets `{fichier, md5, octets, url}` — lisible dans n'importe quelle provenance existante, que je n'ai pas ouverte. Les deux outils qui parcourent ce champ sont tombés d'un coup (`object is not iterable`), et c'est le garde qui l'a dit. La forme d'un champ se LIT sur une pièce déjà admise ; l'inventer, c'est le défaut de signature du projet pris par l'autre bout — non plus un champ que personne ne relit, mais un champ que deux lecteurs attendaient autrement. |
| Une police qui vient d'un CDN sans qu'on l'ait demandé | `troika-three-text` ne se contente pas d'une police par défaut : sans `font`, il va résoudre les caractères sur `cdn.jsdelivr.net` (unicode-font-resolver). Un tiers dans le chemin critique d'une page — exactement ce que l'élagage de three avait retiré. C'est la CSP de la page qui l'a REFUSÉ, pas une relecture : sans elle, la page marchait en développement et cassait chez un client le jour où le CDN tombe. Et la bibliothèque `polices` annonçait 1 809 entrées sans porter un seul octet — c'étaient des fiches avec des `css_url`. Une bibliothèque « pleine » peut ne rien contenir. |
| Un worker de blob refusé par `script-src`, pas par `worker-src` | J'avais écrit dans le code que `worker-src blob:` était « nécessaire et suffisant », et qu'à défaut troika retomberait sur le fil principal en saccadant. Les deux moitiés étaient fausses : le SCRIPT du worker se charge sous `script-src-elem`, qui retombe sur `script-src` ; et il n'y a AUCUN repli — `preloadFont` ne rappelle jamais, la boucle ne démarre pas, écran noir. Une page vide, pas une page lente. |
| Une règle de `.gitignore` qui attrape un homonyme | `vendor/` sans barre initiale vise TOUS les dossiers de ce nom : écrite pour les paquets achetés de la racine, elle attrapait aussi `apps/web/src/vendor/`, où vivent les bundles bâtis ici. Les fichiers déjà suivis y restaient suivis — donc rien ne signalait le conflit ; seul un fichier NOUVEAU tombait dans le trou, en silence, et un clone frais n'aurait pas eu de quoi afficher la page. Une règle de chemin se lit sur ce qu'elle attrape, pas sur ce qu'elle visait. |
| Des versions mesurées dans une liste écrite à la main | README.md annonçait « Paquets npm — versions RÉSOLUES, pas les plages du package.json », et c'était vrai de chaque version. Mais l'ENSEMBLE était une liste de neuf noms saisie à la main, sur une vingtaine de dépendances déclarées : `@react-three/fiber`, `rapier`, `three-nebula`, `bullmq` n'y ont jamais figuré, et les trois paquets installés le 18/08 n'y seraient jamais apparus. Une mesure exacte sur un ensemble choisi à la main donne une section qui a l'air relevée et ne l'est pas. La liste se lit maintenant dans les manifestes — 27 paquets. Au passage, le repli du magasin pnpm rendait « file+vendor+threejs-sky-pro (magasin) » comme numéro de version pour les paquets ACHETÉS, une chaîne absurde qu'aucune sonde ne rejetait. |
| Un paquet dont les pairs sont tous `*` | `@whatisjery/react-fluid-distortion` déclare `@react-three/postprocessing`, `postprocessing`, `three`, `react` — tous en `*`. Un pair en `*` est satisfait par l'ABSENCE : `pnpm peers check` répond « No peer dependency issues found » sur un paquet à qui il manque les deux moitiés dont il dépend. L'installation est verte et le composant ne rend rien. Un avertissement de pairs qui se tait ne prouve pas que les dépendances sont là ; on lit `peerDependencies` et on installe ce qui manque. |
| Un artefact qui AFFIRME en dur à côté de ce qu'il mesure | README.md portait « Sept bibliothèques vides : `studio`, `mouvement` » — le mot était saisi à la main, la liste était relevée, et les deux se contredisaient à trois mots d'écart, dans un fichier qui se termine par « aucun chiffre n'y est saisi à la main ». Deux phrases voisines étaient devenues fausses de la même façon : « aucun script Blender ne transforme la spécification de terrain » (terrain.py existe depuis le 17/08) et « `@theatre/studio` n'est pas dans le dépôt » (déclaré et installé dans apps/web). Une affirmation en dur dans un générateur d'artefact ne vieillit jamais bruyamment : elle est republiée intacte à chaque exécution. Ce qui se mesure se mesure, le reste ne s'écrit pas. |
| Un axe supposé sur un fichier qui en change | Ma sonde du .glb de terrain lisait les bornes comme du Z-up et annonçait « relief 200 m » sur un terrain de 1,5 m. Le glTF est Y-UP par convention, l'inverse de Blender : les trois nombres étaient justes et deux étaient au mauvais endroit. Une sonde qui traverse une frontière de convention doit la nommer — la même famille de faute que le point zéro que Blosm ne partage pas. |
| Deux fichiers qui parlent d'eux-mêmes, lus comme une contradiction | `terrain.mjs --liste` dit « rend une SPÉCIFICATION, pas un maillage » pendant que `terrain.py` (21 Ko) rend de la géométrie. J'y ai vu deux affirmations incompatibles ; il n'y en avait qu'une, chacune parlant de son propre fichier — la séparation spécifier/exécuter est VOULUE. Avant de déclarer une contradiction, vérifier que les deux phrases parlent bien du même sujet. |
| Un état corrigé qui survit dans un document en aval | Le cahier des charges décrivait Buildify « bloqué par un formulaire Gumroad » et « sans kit de pièces » — deux affirmations qu'ETAT.md avait déjà corrigées le 17/08 à 19:43 (acheté, installé hors magasin, kit `modules`/`trim`/`rooftop_details` mesuré présent ; le vrai blocage est l'API 5.2 qui n'expose plus `Input_N` en IDProperties). Une entrée fausse recopiée en aval ne se corrige pas quand la source se corrige : quand deux états s'excluent, on DATE les deux et le plus récent gagne. |
| Un compte qui dépasse son total | 1 024 objets « rapatriés » pour un magasin qui en contient 890 : `--reclamer` résolvait par (pièce, variante, rôle) et redemandait le même objet 86 fois. On demande par EMPREINTE. |
| Un index qui grossit au lieu de se remplacer | Régénérer ajoutait une entrée sans retirer l'ancienne, et le résolveur rendait la première — l'ancienne. L'arborescence fait foi pour ce qu'elle porte. |
| Un total qui baisse quand on ajoute | 890 → 872 en ajoutant 26 fichiers : le total venait du parcours, pas de l'index. Un chiffre se dérive de ce qui EST. |
| Un export qui se tait | Les .glb d'or n'avaient aucun `roughnessFactor` — le glTF vaut alors 1,0, un métal entièrement diffus. L'exportateur ne sait pas réduire un réseau de nœuds à un facteur, et il n'en dit rien. |
| Un chemin qui compte des dossiers | « remonte trois dossiers » : vrai en V1, faux depuis que les pièces vivent sous `bibliotheques/`. Douze générateurs sur seize ne démarraient plus. |
| Une sonde qui ne rejoue pas la vraie configuration | J'ai « innocenté » l'exportateur avec une épreuve appelant `metal(nom)` — sans `variation`, l'argument même qui cause le défaut. |
| Une sonde qui mesure son propre algorithme | Ma contre-épreuve des chemins remontait les dossiers avec MON code, donc réussissait toujours. |
| Un module qui parle à l'import | `import magasin.mjs` exécutait son bloc CLI et crachait son mode d'emploi dans la sortie de l'appelant. |
| Un classeur qui ne connaît qu'une orthographe | `"Poly Haven"` cherché littéralement rangeait neuf pièces documentées dans « sans provenance ». |
| `connect-src 'self'` | Bloquait tout appel à R2 : page affichée, canvas visible, aucune texture — l'erreur ne vivant que dans la console. `blob:` est nécessaire aussi, les loaders relisent l'ArrayBuffer par une URL blob. |
| Un asset acheté poussé vers un bucket public | Le magasin sert par R2 en LECTURE PUBLIQUE. Ingérer Buildify — acheté sur Gumroad, 33 objets de détail sous licence d'usage — l'aurait publié pour quiconque connaît son empreinte. Ce n'est pas une nuance juridique, c'est une redistribution. Les outils sous licence vivent hors du dépôt et sont déclarés à Blender comme bibliothèque locale. |
| Une inférence avec deux contre-exemples | Le type d'un asset Poly Haven était DEVINÉ à la présence d'une clé. Tester `gltf` d'abord a effacé 38 jeux de cartes (une texture expose `gltf` : la bille de démo). Tester `Diffuse` d'abord a classé un MODÈLE en texture (un modèle expose ses propres cartes) : la borne d'incendie est arrivée sans maillage. Réordonner une devinette déplace l'erreur — `/info/<slug>` DIT le type, on demande. |
| Un `.gltf` chargé depuis un magasin adressé par contenu | Il référence son `.bin` et ses textures par chemin RELATIF, qui n'existe pas. Six « Couldn't load texture » et la scène s'arrête. Le chargeur reçoit un aiguilleur d'URL qui résout chaque nom de fichier dans la même pièce du magasin. |
| Un champ perdu par une projection | `pieceEntiere()` ne recopiait pas `nom` : la donnée était dans l'index, et `--ou` affichait une colonne vide. Le défaut de signature du projet — un champ rempli que rien ne relit à l'arrivée. |
| Un vocabulaire de rôles trop étroit | Les textures d'un MODÈLE arrivent avec les suffixes de Poly Haven (`_diff`, `_arm`, `_nor_gl`), pas les noms français des textures rapatriées. Les six cartes de la borne ont été étiquetées « rendu » : `trouver(piece, variante, "couleur")` rendait null sur une pièce qui a bien une couleur. |
| Une profondeur floutée prise pour une occlusion | L'ombre de contact a produit un carré gris sous les objets. J'ai cru corriger par un flou ; il l'a rendu plus doux et PLUS LARGE, et Sacha l'a revu aussitôt. Un rendu de profondeur n'est pas une mesure d'occlusion : la silhouette occupe une grande part du cadre, le flou l'étale en gris presque uniforme, et multiplier un gris uniforme sur un plan carré donne un rectangle à bord net. Retirée — un artefact visible est pire qu'une fonctionnalité absente, il salit toutes les scènes en attendant. |
| Une scène sans ombre | Le moteur n'avait NI lumière NI ombre : seul l'environnement éclairait, et un environnement ne projette rien. L'œil de Sacha l'a vu avant toute mesure — « les ombres intègrent les objets au décor ». Deux mécanismes, pas un : l'ombre PORTÉE (il faut une source) et l'occlusion de CONTACT (il n'en faut pas, et c'est elle qui attache l'objet au sol sous un ciel couvert). |
| Une somme là où il fallait un pic | La direction du soleil était cherchée au bloc de plus grande ÉNERGIE TOTALE. Sur un désert de midi, le SABLE totalise plus que le disque solaire, minuscule et intense : la sonde a annoncé « soleil à -11° », donc sous l'horizon. Un chiffre impossible trahit une sonde ; une image plausible ne trahit rien. On cherche le PIC, et seulement dans l'hémisphère supérieur. |
| Un demi-flottant lu comme un entier | `HDRLoader` rend un Uint16Array de demi-flottants. Les lire bruts préserve l'ORDRE — d'où une direction juste — mais pas les RAPPORTS : pic/moyenne valait 1,13 au lieu de 273, et la « franchise » tombait à 0,00 en plein soleil. Un ordre juste et une échelle fausse : la sonde répondait à moitié, et c'est la moitié muette qui décidait de la dureté de l'ombre. |
| Le sol dans sa propre passe d'occlusion | La caméra de contact regarde vers le haut depuis le niveau du sol : celui-ci se trouvait à un dixième de millimètre devant elle et occultait le cadre entier. On obtenait un assombrissement uniforme, qu'on prend pour un problème d'exposition. |
| Un avertissement qui n'empêche rien | `inventaire.mjs` signalait deux dossiers non décrits ; j'ai commité par-dessus. D'où `outils/garde.mjs`. |

## Ce qui refuse, et pourquoi

5 gardes. Ce ne sont pas des pannes — ils empêchent quelque chose de précis.

| garde | il refuse | pour |
| --- | --- | --- |
| `outils/garde.mjs` (pre-commit) | un commit dont les artefacts sont périmés | qu'une documentation ne mente jamais sur le code |
| `atelier/portillon.py` | de lancer un script d'objet sans enquête complète | qu'on cherche avant de construire |
| `atelier/studio.exporter()` | de publier un matériau sans rugosité | qu'un or n'arrive pas en crème mat dans un navigateur |
| `magasin.obtenirEmpreinte()` | un objet dont l'empreinte ne concorde pas | qu'aucune confiance ne soit accordée au transport |
| `outils/skills.mjs` | une marque de skill dont la clé n'est pas mesurable | qu'un chiffre mort ne se lise pas comme un chiffre vrai |

## Les bibliothèques, résolues

| paquet | version |
| --- | --- |
| `three` | 0.185.1 |
| `@theatre/core` | 0.7.2 |
| `@theatre/studio` | 0.7.2 |
| `@react-three/fiber` | 8.18.0 |
| `@react-three/drei` | 9.122.0 |
| `@react-three/rapier` | 1.5.0 |
| `@interverse/three-terrain-lod` | 2.1.1 |
| `three-nebula` | 12.1.0 |
| `bullmq` | 6.1.1 |
| `ioredis` | 6.0.0 |
| `zod` | 4.4.3 |
| `playwright` | 1.62.1 |
| `esbuild` | 0.28.2 |
| `typescript` | 5.9.3 |

## Le dehors — ce qui n'est pas dans le dépôt

| | |
| --- | --- |
| **Outils sous licence** | `~/Documents/Atlas — outils sous licence/` — Buildify y vit, HORS du dépôt et hors du magasin. Le bucket R2 est PUBLIC EN LECTURE : y faire entrer un asset acheté le redistribuerait. Déclaré à Blender comme bibliothèque d'assets locale. La règle : une pièce n'entre au magasin que si sa licence permet qu'on la SERVE publiquement — CC0 et domaine public passent, une licence d'usage non. |
| **Cloudflare R2** | bucket `atlas-magasin`, public en lecture via `pub-….r2.dev`. Sortie gratuite. ⚠ `r2.dev` est BRIDÉ (HTTP 429) : un domaine personnalisé sera nécessaire pour servir de vrais sites. |
| **wrangler** | autorisé par `npx wrangler login` — le jeton reste chez wrangler, il ne transite jamais par le dépôt. |
| **Blender 5.2.0** | `/Applications/Blender.app`. Extensions présentes : mpfb, blosm, deepbump, dream_textures, scatter_objects, archimesh, biome_reader, mcp. |
| **Python (.venv)** | build123d, cadquery, mediapipe, agentcad, numpy, Pillow. |
| **Redis** | `~/.local/bin/redis-server`, pour la file BullMQ. Docker absent (mot de passe administrateur). |
| **SSD 4 To** | `/Volumes/SSD Stockage 4To/Atlas-magasin` — adossement local, relu à chaque copie. |
| **API Poly Haven** | `api.polyhaven.com` — exige un en-tête User-Agent, sinon 403. |

## Ce dont il ne faut pas s'occuper

Les humanoïdes et le rig (`bibliotheques/humain/`) seront refaits autrement
(Sacha, 17/08/2026).

## Où lire la suite

- `INVENTAIRE.md` — ce qu'il y a, et par quelle commande y toucher.
- `ETAT.md` — les directions prises, ce qui n'est pas fait et pourquoi.
- `VITRINE.md` — la même chose côté client, sans code.
