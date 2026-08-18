# Atlas V2 — où nous en sommes

> Artefact — refait par `node outils/etat.mjs`. Les nombres sont relevés sur
> la machine et dans les index, jamais saisis à la main.

**Atlas génère des environnements et objets 3D sous Blender, les transfère
vers Three.js pour qu'ils soient lisibles dans un navigateur, puis leur donne
la capacité d'être animés pour des sites internet via Theatre.js.**

---

## Les virages de direction

### Le terrain s'EXÉCUTE, il n'est plus seulement spécifié

Le trou le plus ancien d'ETAT.md : `terrain.mjs` rendait une spécification vérifiée que RIEN ne transformait en maillage. `generateurs/terrain.py` l'exécute désormais — grille déplacée par un bruit fractal semé (donc reproductible), matière du catalogue à la bonne échelle, export glTF relu. Les cinq presets sortent en géométrie réelle, au relief exact et dans le budget web. La séparation est gardée : le `.mjs` spécifie et se lit sans Blender, le `.py` exécute.

### Gaea : la question se tranche par une RÈGLE, pas preset par preset

Fallait-il acheter Gaea ? Y répondre au cas par cas aurait été un avis. `terrain.mjs` porte maintenant une règle à deux conditions physiques — pente ≥ 20 % (en dessous, l'eau DÉPOSE au lieu d'inciser) et étendue ≥ 500 m (en dessous, pas de bassin versant, un seul versant). Appliquée aux cinq presets : `plage` 1,5 %, `ville` 1,5 %, `campagne` 8 %, `sous-bois` 15 % sur 80 m — aucun ne justifie l'érosion. Seul `montagne` (40 % sur 2 000 m) la justifie. La règle vaudra pour les presets qui n'existent pas encore.

### Blendkit passe en Pro — l'architecture arrive par le catalogue, pas par un générateur

Décision de Sacha le 17/08/2026. Mesuré sur l'API : **8 781** modèles en `architecture`, **3 361** en mobilier d'extérieur, **1 596** en mobilier d'intérieur. Trois bibliothèques débloquées d'un coup, sans nouvel outil à intégrer. Ça déclasse Buildify et archimesh du rôle de voie principale : ils resteraient utiles pour du bâti PARAMÉTRIQUE sur empreintes réelles, pas pour peupler un catalogue.

### De « rechargeable » à « stocké »

Je bâtissais la provenance sur l'idée qu'une pièce venue de Poly Haven n'a pas besoin d'être gardée puisqu'elle se retélécharge. Sacha a tranché : « si Poly Haven meurt, on sera dans la merde ». Il a raison, et l'argument est simple — une empreinte prouve qu'un fichier est intact, elle ne le ressuscite pas. Tout ce qui a été téléchargé ou fabriqué est désormais gardé.

### Atlas a son magasin, et on l'appelle

Deuxième correction de Sacha : « je veux qu'Atlas ait son propre système de stockage à appeler ». Tant que le code ouvre `bibliotheques/textures/…/x.jpg`, Atlas dépend d'une arborescence et d'un disque. Il appelle maintenant `obtenir("marble_01", "full", "couleur")`, et le magasin se débrouille.

### Le magasin a une ADRESSE

Troisième correction, et elle invalidait la précédente à moitié : les liens durs ne quittent pas le volume, donc mon magasin était un magasin pour une seule machine. « Comment les collaborateurs y auront accès ? » — ils n'y avaient pas accès. Le magasin est maintenant servi par HTTP, en lecture seule, et le client vérifie l'empreinte de ce qu'il reçoit.

### Git / Supabase / R2

Le découpage est de Sacha. Git porte le code et l'**index** du magasin, donc un clone de 110 Mo sait déjà tout ce qui lui manque. Supabase portera le back-end. R2 portera les octets, parce que sa sortie est gratuite — et servir des assets 3D à des navigateurs est exactement le cas où la sortie facturée coûte cher.

---

## Ce qui est fait

### Phase 4 — preuve (19/08/2026)

La scène a **une seule carte d'environnement**, et tout la référence. C'est ce
que la phase devait établir — pas remplir un catalogue de ciels.

**Ouvrable :** `http://localhost:4400/immersive/viewport.html` après `pnpm web`.

| | |
| --- | ---: |
| ciels du magasin | **8**, variante `low` à 1,5 Mo au lieu de 25 Mo |
| presets climat | **4**, appelés sur `generateurs/climat.mjs` |
| éclairage local restant dans le viewport | **0** |

**Vérifié des deux côtés, séparément.** Moi par l'adresse publique ; Sacha sur
son téléphone, en navigateur réel, WebGL logiciel, tactile simulé. Il a ouvert
le panneau, posé `pluie_de_ville`, lu le bandeau, posé
`anniversary_lounge` et vu l'éclairage de la pièce se réchauffer.

**`RoomEnvironment` est retiré.** La phase 3 l'avait posé pour qu'un métal
cesse de rendre noir ; c'était un éclairage fabriqué par le viewport pour lui
seul, ce que la règle du cahier interdit. Le dépannage a servi et il a disparu
dès que la carte partagée a existé. La prédiction faite en fermant la phase 3
s'est vérifiée à la ligne près.

**La colonne n'invente pas ce que le générateur ne dit pas.** `climat.mjs`
rend deux formes : un état chiffré, ou un nom sans chiffres de surface. Le
bandeau affiche alors « le générateur ne rend pas encore de chiffres de
surface » plutôt que de traduire « mouillé » en rugosité. Sacha l'a lu mot pour
mot sur son téléphone.

**LE DÉFAUT QUE SEUL SON PROTOCOLE A TROUVÉ.** Après génération, la languette
d'ambiance ne répondait plus — par intermittence. Trois causes : un appui sur
un bouton armait le glissé de caméra, et 4 px de doigt suffisaient à avaler le
geste ; les zones étaient relues AU RELÂCHEMENT alors qu'une repeinture les
reconstruit entre-temps ; et la cible faisait 22 px là où l'ergonomie tactile
en demande 44. Une zone se saisit désormais à l'appui. Éprouvé 20 fois de
suite dans l'ordre documenté : 20 sur 20, du tap net au glissé de 15 px.

Quatre phases de vérifications côté constructeur ne l'avaient pas vu : il
n'apparaît qu'en suivant l'ordre écrit, sur un vrai appareil.

**LES TROIS MORCEAUX QUI RESTENT DEHORS, nommés plutôt que tus.** Décision de
Sacha du 19/08/2026 : ils sortent du phasage et rejoignent DeepBump et les
vignettes comme ajouts hors séquence.

- **Sky Pro** — un ciel réglable, heure du jour et couvert, à côté des HDRI.
  Licence plateforme achetée, donc légitime dans Atlas même.
- **Water Pro** — même chose pour l'eau, même levée, achetée séparément.
- **Particules volumétriques (VDB)** — le cahier les plaçait en phase 4 ; c'est
  un pipeline d'effets, pas un réglage d'ambiance.

Aucun des trois ne change la carte partagée : ils s'y branchent. C'est la
raison pour laquelle la phase se ferme sans eux.

### Phase 4 — le choix d'outil, écrit AVANT le code (18/08/2026)

Volet « avant » du portillon, deuxième application. Ce commit ne contient
aucun code de phase 4.

**La prédiction faite en fermant la phase 3 se confirme, à la ligne près.**
J'avais annoncé que la phase 4 mordrait sur ce que la phase 3 avait posé.
`viewport.js` ligne 86 fait `monde.environment = pmrem.fromScene(new
RoomEnvironment())` — le viewport DÉFINIT SON PROPRE ÉCLAIRAGE. Et la règle
de la phase 4, déjà écrite au cahier : « une règle d'intégration à imposer à
chaque générateur : référencer cette même carte plutôt que définir son propre
éclairage local ». `RoomEnvironment` était un dépannage pour rendre un métal
visible ; il doit disparaître.

**Ce que j'ai consulté.**

| source | mesuré | verdict |
| --- | --- | --- |
| **HDRI du magasin** | 9 ciels, variante `low` à **1,5–1,8 Mo** (1K), `full` à 25–28 Mo (4K), provenance vérifiée | **RETENUS** |
| **Sky Pro 2.1.0** | acheté, dans `vendor/`, produit bien une carte d'environnement | **bloqué par sa licence — décision de Sacha** |
| `RoomEnvironment` | généré en mémoire, éclairage LOCAL | à retirer |

**Le blocage de Sky Pro n'est pas technique, il est écrit dans sa licence.**
Lue, pas supposée. §3.3.1 autorise le code compilé dans un « End Product »
déployé publiquement — un site client fabriqué par Orphic et livré fini entre
dans ce cadre. Mais §3.4.2 :

> « It may not be offered, directly or indirectly, as a feature, component,
> template, asset, **preset**, or building block that third parties may
> incorporate into their own works, **whether or not the offering is
> multi-tenant**, and whether or not a separate fee is charged. »

Atlas est exactement ça : un outil où l'on choisit un **preset** de ciel qui
part ensuite dans le site d'un client. §1.7 définit le « Platform Service » en
nommant « website builder, page builder, design tool ». §3.4.3 tranche : cet
usage « requires a separate written platform or redistribution license », et
donne une adresse pour la demander.

**La frontière est donc nette, et elle ne m'appartient pas.** Sky Pro dans un
site livré fini = permis. Sky Pro embarqué dans l'interface d'Atlas comme
preset offert = non permis sans licence séparée. Tant que Sacha n'a pas
tranché, la phase 4 se construit sur les HDRI du magasin — qui satisfont la
règle du cahier (une seule carte partagée), sont redistribuables, et ne coûtent
rien.

**Ce que ça évite, concrètement.** Sans ce détour, j'aurais empaqueté Sky Pro
dans le bundle de la page — et l'aurais servi par un tunnel public. C'est la
même famille que le piège déjà consigné : « un asset acheté poussé vers un
bucket public ».

**LEVÉE — décision de Sacha, 18/08/2026.** Il a acheté la **licence plateforme**
de Sky Pro. La restriction du §3.4.2 ne s'applique donc plus : Sky Pro peut être
proposé comme preset natif DANS Atlas, pas seulement embarqué dans un site livré
fini. Ceci est une DÉCLARATION DE SACHA, datée, pas une mesure : je ne l'ai pas
vérifiée et je n'ai pas les moyens de le faire — le contrat ne vit pas sur ce
disque. Elle est écrite ici avec sa circonstance pour qu'on sache d'où elle
vient, exactement comme `ouverte_par_sacha`.

Conséquence : **les deux voies sont légitimes**, et Sky Pro s'ajoute À CÔTÉ des
HDRI plutôt qu'à leur place. Un ciel réglable (heure du jour, couvert) et une
ambiance capturée ne font pas le même travail.

**WATER PRO PORTE LA MÊME CLAUSE, ET LA LEVÉE NE LE COUVRE PAS — mesuré.**
Vérifié avant de m'en servir, comme convenu : `vendor/threejs-water-pro`,
version 3.4.0, licence du **même éditeur** (DRG Software Solutions LLC), même
texte en version 2.2, et le §3.4.2 y est **mot pour mot**. La licence plateforme
de Sky Pro ne disait rien de l'eau, et la question est restée ouverte le temps
d'être posée.

**LEVÉE POUR L'EAU AUSSI — décision de Sacha, 18/08/2026.** Il a acheté la
licence plateforme de Water Pro **séparément**, et il le précise : ce n'est pas
l'extension automatique de celle de Sky Pro. Water Pro peut donc lui aussi être
proposé comme preset natif dans Atlas.

Même discipline que pour le ciel, et elle vaut d'être répétée plutôt que
sous-entendue : c'est une **déclaration de Sacha, datée** — pas une mesure. Ce
que j'ai mesuré, moi, c'est que les deux produits portent le même §3.4.2 mot
pour mot ; ce que je ne peux pas mesurer, c'est ce qu'un contrat autorise. Les
deux natures d'affirmation vivent dans ce fichier, et on doit pouvoir les
distinguer d'un coup d'œil.

### Phase 3 — preuve (18/08/2026)

La colonne droite habille une pièce, et ce qu'elle règle se voit.

**Ouvrable :** `http://localhost:4400/immersive/viewport.html` après `pnpm web`.

Les quatre propriétés, vérifiées par Sacha **depuis son téléphone**, par un
lien éphémère coupé aussitôt après : couleur, texture, rugosité, métallique.

| | |
| --- | ---: |
| matières servies depuis le magasin | **79** |
| adressage | par **empreinte** — un nom de pièce rend 400 |
| poids médian d'une carte | 0,6 Mo (chargée seulement au toucher) |

**Trois défauts trouvés en la construisant, et le premier n'était pas dans la
colonne.**

La pièce n'était pas HABILLABLE. Une vraie texture du magasin rendait un aplat
uniforme : les trois mailles ne portaient aucun `TEXCOORD_0`, et le moteur
échantillonnait l'image en (0,0) pour la peindre partout, sans lever d'erreur.
Le contrôle vérifiait qu'une pièce est adressable ; rien ne vérifiait qu'elle
est habillable. Deux propriétés de la même famille fondatrice, une seule avait
son garde. C'est devenu la cinquième règle de `nomenclature.mjs`, et le
générateur REFUSE désormais de rendre une pièce sans dépliage.

Un métal sans environnement est NOIR — il ne fabrique pas sa couleur, il
reflète, et deux lampes directionnelles éclairent sans se refléter. Une colonne
qui laisse régler un métal sans montrer ce qu'il devient fait croire au
réglage. `RoomEnvironment` est généré en mémoire, sans fichier ni tiers.

Et une cible relue à l'arrivée : texture demandée sur la bague, sélection
changée pendant le téléchargement, bois posé sur le barillet en écrasant l'or.
Le défaut de signature du dépôt par un troisième bout — une valeur juste au
départ, périmée à l'arrivée.

**Ce que le téléphone a montré, une fois de plus.** « aucun preset ne
correspond — essayez « un objectif » » se coupait à « essayez « un… », perdant
le conseil exactement là où il servait. J'avais borné l'invite du chat trois
lignes plus haut sans relire ses jumelles : réparer un cas sans chercher ses
semblables laisse le défaut vivant sous un autre nom.

**Ce que la phase laisse derrière elle.** Les « vignettes » du cahier sont des
NOMS, pas des images — une grille de 79 aperçus tirerait 55 Mo, il faut un
pipeline de miniatures. « Générer par IA » n'est pas branché : DeepBump est
retenu par l'entrée « avant », pas encore appelé. Et l'écart le plus important
n'est pas dans cette colonne : « crée-moi une sphère » ne correspond à aucun
preset, et ce n'est pas un manque de contenu — c'est l'écart entre sélectionner
un preset et comprendre une demande, l'objectif transversal de la section 9.

### Phase 3 — le choix d'outil, écrit AVANT le code (18/08/2026)

Ceci n'est pas une preuve de phase : c'est le volet « avant » du portillon
d'outil, exigé par la section 7 du cahier. Il doit exister, daté, **antérieur à
la première ligne de génération** — et l'historique git le montre : ce commit ne
contient que cette entrée, aucun code de phase 3.

Ce qu'il empêche : écrire un substitut trivial sans avoir cherché si l'outil
dédié existe. Un contrôle qui bloquerait seulement l'exécution validerait une
citation ; il ne forcerait jamais la recherche qui aurait dû la précéder.

**Le besoin.** La colonne droite doit produire des cartes PBR — normale,
rugosité, métallique, occlusion — à partir d'une image, et proposer une
génération de texture par IA. Quatre outils étaient nommés au cahier.

**Ce que j'ai consulté, et ce que chacun a répondu.**

| outil | mesuré | verdict |
| --- | --- | --- |
| **DeepBump** | installé sous Blender **5.2**, 43 Mo, **2 modèles ONNX** de 16 et 25 Mo présents sur le disque | **RETENU** |
| **Dream Textures** | installé sous 5.2, 1,1 Go de dépendances, **0 poids de modèle** | en attente d'une décision de Sacha |
| **GenPBR** | client d'**API** : « Sign up for an account », clé requise | écarté |
| **AITextured** | site web, inscription présente sur la page | écarté |

**Pourquoi DeepBump et pas les autres.** Il est le seul à ne rien demander à
personne : ses modèles sont sur le disque, il ne sort pas de la machine, il
n'a ni compte ni clé. C'est la même règle qui a fait élaguer three plutôt que
d'appeler un CDN, et qui a fait donner une police locale à troika — un tiers
dans le chemin critique décide à notre place du jour où une scène client
s'affiche.

**Deux affirmations du cahier ne survivent pas à la mesure.**

« GenPBR se distingue en étant déterministe plutôt qu'une boîte noire d'IA
générative » : son propre README dit « generating PBR maps **using GenPBR
API** », et compresse les images « pour respecter les exigences de l'API ».
Déterministe ou non, le calcul se fait **ailleurs**, chez un tiers, contre une
clé obtenue en créant un compte. La question n'était pas la bonne : ce n'est
pas l'IA qui gêne, c'est le voyage.

« AITextured et GenPBR complètent l'offre gratuite, **sans compte à créer** » :
les deux en demandent un.

**Ce qui n'est pas tranché, et que je ne tranche pas seul.** Dream Textures est
installé et ne porte aucun poids : il les tire de Hugging Face au premier
usage. Mesuré sur l'API : `stabilityai/stable-diffusion-2-1` répond **401**,
`stable-diffusion-v1-5/stable-diffusion-v1-5` répond **200**. Une partie du
catalogue exige donc d'accepter une licence avec un compte — ce que l'agent ne
fait pas. Deux voies s'ouvrent, et le choix appartient à Sacha : rester sur un
modèle ouvert, ou accepter une licence lui-même. Tant qu'il n'a pas tranché, la
colonne droite se construit sur DeepBump et sur les textures déjà au magasin.

### Phase 2 — preuve (18/08/2026)

Le viewport et le chat sont la même surface, et la colonne gauche agit sur ce
qu'on y touche.

**Ouvrable :** `http://localhost:4400/immersive/viewport.html` après `pnpm web`.

Les quatre gestes, faits par Sacha **depuis son téléphone**, par un lien
éphémère coupé aussitôt après :

| geste | ce qui se passe |
| --- | --- |
| une phrase, puis « Envoyer » | Blender tourne, la pièce entre en scène en ~2 s |
| toucher une sous-partie | la colonne montre son chemin et ses cotes ; le chat passe de GÉNÉRER à MODIFIER |
| − / + sur X, Y, Z | déplacement au millimètre |
| curseur TAILLE | de 0,25× à 3× |
| Dupliquer | 3 → 4 mailles, la copie nommée `LogoClient_2` |

**Le contrôle de nomenclature a dicté un geste d'interface.** Dupliquer ne peut
pas copier le nom : deux mailles au même chemin ne sont pas adressables
individuellement, `trouverIris` rendrait la première et l'autre serait
inatteignable à jamais. La copie reçoit donc un nom libre du même père. C'est
la première fois qu'un contrôle de la phase 1 décide d'un comportement plutôt
que de refuser un fichier.

**Le prompt ne fabrique pas de commande.** `/atelier/generer` porte une TABLE
de presets ; le texte sert à choisir une clé, jamais à composer un appel. Les
deux portes du cahier — le champ et la commande technique — convergent donc
vers le même moteur au lieu d'en entretenir deux.

**Ce que le téléphone a montré, et que l'écran cachait.** La page ne tenait pas
à 375 px : pas de bouton d'envoi — j'avais éprouvé au clavier PHYSIQUE —,
l'invite débordait du panneau de moitié faute de largeur maximale, le bouton
sortait de 26 px sous le panneau, et surtout le panneau restait SOUS le clavier
virtuel, où l'on tape sans voir ce qu'on écrit. La règle inscrite au cahier
pour le tunnel — vérifier avec l'outil de la personne distante — n'avait pas
été appliquée un cran plus bas, au clavier.

**Ce que la phase laisse derrière elle.** La carte « Depuis le catalogue » et
le placement par sphère du cahier ne sont pas construits ; la modification par
le chat sur une pièce sélectionnée affiche l'intention sans encore l'exécuter.
Et le quartier de Fontvieille reste à la dette de nomenclature, 91 366 mailles
inadressables.

### Phase 1 — preuve (18/08/2026)

Une pièce demandée sort en `.glb` réel, et ses sous-parties se touchent une
par une. C'est la seule chose qui distingue une pièce d'un bloc.

**Ouvrable :** `http://localhost:4400/immersive/piece.html` après `pnpm web`.

| ce qu'on touche | ce qui remonte |
| --- | --- |
| l'étiquette | `Lens/FocusRing/LogoClient` — 28,0 × 28,0 × 0,8 mm |
| le barillet | `Lens/FrontBarrel` |
| la bague | `Lens/FocusRing` |

Vérifié par Sacha à distance, sur une adresse publique éphémère, puis coupée.

**Les tubes sont creux, et c'est mesuré.** Le barillet rend 4,7043e-05 m³
contre 4,7077e-05 attendus pour une paroi de 3 mm — et 4,59e-04 s'il avait été
plein, soit dix fois plus. Le générateur REFUSE au-delà de 2 % d'écart et
refuse la moindre arête de bord. De l'extérieur, un plein et un creux sont
identiques : seule la mesure les sépare, et un plein aurait fallu tout refaire
le jour où une lentille entre.

**Trois cotes sont des standards publiés** — PL Ø 54 mm, bride 52,00 mm, avant
Ø 114 mm. Le reste est CHOISI, l'épaisseur de paroi surtout, et le générateur
le dit dans sa sortie plutôt que de le faire passer pour une mesure.

**Ce que la phase laisse derrière elle, et qu'il ne faut pas croire réglé.** Le
contrôle de nomenclature a mordu sur les trois sorties existantes :
`sorties/fontvieille/quartier.glb`, 91 366 mailles, PAS UNE adressable. Le
quartier de Monaco tourne à 60 i/s dans un navigateur et reste un BLOC — on ne
peut ni toucher un bâtiment, ni descendre à un étage, ni franchir un seuil. Il
est inscrit à la dette datée du contrôle, pas réparé : le réparer demande de
reprendre les passes qui l'ont produit.

Neuf générateurs sur dix ne citent toujours pas l'outil qu'ils invoquent. Deux
le font — `relief.py` et `objectif-troncon.py`.

### Phase 0 — preuve (18/08/2026)

La question du cahier — interface en DOM au-dessus d'un canvas, ou tout en
WebGL, texte compris — est tranchée pour le WebGL, et prouvée plutôt que
décrite.

**Ouvrable :** `http://localhost:4400/immersive/` après `pnpm web`.

Trois sources indépendantes disent la même chose sur le point qui décidait :

| | |
| --- | ---: |
| textes rendus dans le canvas | **12** |
| caractères de texte dans le DOM | **0** |
| arbre d'accessibilité | **vide** |
| coût d'une image (60 rendus enchaînés) | **1,01 ms** |
| poids du bundle | 632 Ko brut, **174 Ko gzip** |
| dont troika-three-text | **90 Ko** — ce que coûte le texte en WebGL |

**Deux fautes trouvées en le construisant, et la seconde est la vraie.**

D'abord la politique de sécurité : `worker-src blob:` ne suffit pas, le
SCRIPT du worker de troika se charge sous `script-src`. Écran noir, et
aucun repli sur le fil principal contrairement à ce que j'avais écrit dans
le code — `preloadFont` ne rappelle jamais, la boucle ne démarre pas.

Ensuite, et c'est le vrai enseignement : **troika va chercher ses polices sur
`cdn.jsdelivr.net`** quand on ne lui en donne pas. Un tiers dans le chemin
critique d'une page, ce que ce dépôt a déjà retiré une fois en élaguant three.
C'est la CSP qui l'a refusé — sans elle la page marchait ici et cassait chez
un client le jour où le CDN tombe. La bibliothèque `polices` annonçait
1 809 entrées et ne portait **aucun octet** : c'étaient des fiches, avec des
`css_url` vers Google. `bibliotheques/polices/inter/` porte désormais
Inter Regular et SemiBold en TrueType — OFL-1.1, redistribuable, empreintes
et URL sources inscrites. Ce sont les deux premiers vrais fichiers de cette
bibliothèque.

**Ce que la page ne prouve pas.** Elle n'est pas l'interface d'Atlas : deux
colonnes sur six, deux cartes. Et l'arbre d'accessibilité vide n'est pas
qu'une preuve, c'est aussi le PRIX du chemin choisi — un lecteur d'écran ne
voit rien de cette interface. Igloo a exactement le même défaut. C'est à
rouvrir avant que la phase 2 en dépende.

### Le magasin — le stockage propre d'Atlas

| | |
| --- | ---: |
| objets | **1321** |
| poids | **6,01 Go** |
| pièces | **122** |
| doublons trouvés et fusionnés | 54 |

Un objet est nommé par l'empreinte SHA-256 de son contenu, et par rien
d'autre. Trois propriétés en découlent :

- **dédoublonnage gratuit** — le dépôt servait la même carte à plusieurs
  pièces sans le savoir ;
- **immuable** — chaque objet est en lecture seule (444) : une écriture
  accidentelle échoue au lieu de corrompre en silence ;
- **l'adresse est la preuve** — vérifier, c'est relire un objet et voir s'il
  porte encore son nom. Aucun manifeste à croire.

L'arborescence lisible reste en place : chaque fichier y est un **lien dur**
vers l'objet. Même inode, zéro octet de plus, tous les scripts existants
continuent de marcher.

```js
import { obtenir, pieceEntiere } from "./outils/magasin.mjs";
await obtenir("marble_01", "full", "couleur");
```

### Le magasin est servi, et le client vérifie

```bash
ATLAS_MAGASIN_JETON=… node outils/magasin.mjs --servir --port 8787
node outils/magasin.mjs --declarer "https://…" --jeton "…"
node outils/magasin.mjs --reclamer
```

Le serveur est bête et en lecture seule. Éprouvé : `401` sans jeton, `405` en
écriture, `404` sur `../../../../etc/passwd`, `404` sur une empreinte
inventée, et l'octet servi porte bien l'empreinte demandée.

Un collaborateur qui clone obtient **110 Mo** et sait immédiatement qu'il lui
manque **1321 objets, 6,01 Go** — sans avoir téléchargé un seul octet,
parce que l'index est du texte versionné. Testé de bout en bout : l'objet
réclamé arrive, son empreinte est vérifiée, il est rangé en lecture seule.

### La provenance

| | |
| --- | ---: |
| pièces avec papiers | **107** |
| dont Poly Haven | 80 |
| dont fabriquées ici | 14 |
| dont ambientCG | 1 |
| non reproductibles | 7 |

Une orthographe et une seule par source. Le dépôt en portait quatre pour
trois, et un classement qui cherchait la première rangeait neuf pièces
documentées dans « sans provenance ». Chaque fichier Poly Haven a été apparié
à ce que la source sert **par son MD5**, jamais par son nom : 654 sur 654,
zéro orphelin.

### Les bibliothèques et les nœuds

| | |
| --- | ---: |
| bibliothèques | 22 — 20 pleines, 2 vides |
| nœuds | 170 |
| générateurs | 4 |
| presets | 13 |

Les boîtes vides le sont **délibérément** : on pose le rangement avant d'avoir
à ranger. « Vide » veut dire *mesuré vide*, pas *supposé vide*.

### Installé sur la machine

**Paquets npm** — résolus depuis `apps/web`, avec leur version :

| paquet | état |
| --- | --- |
| `@theatre/studio` | ✅ 0.7.2 |
| `@theatre/core` | ✅ 0.7.2 |
| `@theatre/r3f` | ✅ 0.7.2 |
| `@react-three/fiber` | ✅ 8.18.0 |
| `@react-three/drei` | ✅ 9.122.0 |
| `@react-three/rapier` | ✅ 1.5.0 |
| `@interverse/three-terrain-lod` | ✅ 2.1.1 |
| `three` | ✅ 0.185.1 |
| `bullmq` | ✅ 6.1.1 |
| `ioredis` | ✅ 6.0.0 |
| `three-nebula` | ✅ 12.1.0 |
| `three-particles` | ❌ absent |

**Python** (`.venv`) : ✅ `build123d` · ✅ `cadquery` · ✅ `mediapipe` · ✅ `agentcad`

**Infrastructure** : ✅ Redis · ❌ Docker · ✅ Node v24.18.0

**Blender 5.2.0** : ✅ mpfb · ✅ blosm · ✅ deepbump · ✅ dream_textures · ✅ scatter_objects · ✅ archimesh · ✅ biome_reader · ✅ mcp

**Skills Claude** : ✅ webgpu-threejs-tsl · ✅ procedural-landscapes-threejs · ❌ agentcad

### Les sauvegardes

- **Magasin adossé au SSD** — 846 objets copiés puis **relus** à l'arrivée, zéro faute.
- **Inventaire complet du dépôt** (`outils/coffre.mjs`) — 1 430 fichiers,
  3,47 Go, miroités sur le SSD. Contrôle **à froid**, après démontage et
  remontage du volume : 1 430 / 1 430 conformes.
- Les deux sondes sont éprouvées sur une configuration à réponse connue : un
  octet ajouté est détecté et nommé, le fichier remis rend le contrôle propre.

---

## Ce qui n'est pas fait, et pourquoi

### Docker

L'installation demande le mot de passe administrateur. Sacha a proposé de me le donner en le changeant ensuite ; j'ai refusé, et je maintiens ce refus. Rien d'autre ne bloque : le worker tourne sans conteneur, Redis est installé et fonctionne.

### Biome-Reader — la bibliothèque de biomes est vide

L'extension est installée sur Blender 5.2.0 et charge ses 105 opérateurs `scatter5`. Ce qui manque n'est pas le lecteur, c'est ce qu'il lit : `blend_environment_paths` est à **0 entrée**. Biome-Reader est un LECTEUR de biomes Geo-Scatter, il n'en fournit aucun. Il faut soit des biomes achetés, soit en fabriquer — et un biome fabriqué n'est jamais qu'une liste d'objets à disperser, que le magasin sait déjà fournir.

### Buildify — installé hors du magasin, délibérément

Ce n'est PAS une extension : c'est un `.blend` de nœuds géométriques, rangé dans `~/Documents/Atlas — outils sous licence/` et déclaré à Blender comme bibliothèque d'assets. Il reste hors du magasin, dont le bucket est public en lecture. (Correction du 17/08/2026 : j'écrivais ici qu'il lui fallait un kit d'assets « non fourni ». C'est FAUX, mesuré en l'ouvrant — il livre ses collections `modules`, `trim` et `rooftop_details`. Une entrée sans test peut rester fausse longtemps ; celle-ci l'est restée.)

### Érosion — écrite, mesurée, ÉCHOUÉE

Trois voies essayées le 17-18/08/2026, une seule tient.

① ÉCRIRE l'érosion — fait, et ÉCHOUÉ. `terrain.py::eroder` implémente une érosion hydraulique par gouttes : elle tourne en 3 s, conserve 98,3 % de la matière, creuse jusqu'à 69 m — et dégrade le relief au lieu de le structurer. La mesure qui tranche est la longueur d'écoulement : 184 pas de référence contre 174, 153, 140 et 145 sur quatre réglages, de 6 400 à 102 400 gouttes. Plus on érode, PIRE c'est. La fonction se juge elle-même (`_reseau_forme`) et rend le relief d'origine plutôt que de prétendre.

② ACHETER Gaea — impossible sur cette machine : `Gaea-2.3.0.1.exe` est un binaire « PE32, for MS Windows », la machine est en arm64, ni Wine ni CrossOver. World Machine et Terragen ont, eux, des versions macOS natives.

③ RELEVER le vrai relief — `generateurs/relief.py`, et c'est la seule des trois qui obéisse à la règle indérogeable : une partie du monde qui existe se prend dans la DONNÉE. Éprouvé sur le mont Agel : 5 630 × 5 597 m, 1 229 m de dénivelé, 91 224 triangles, aucune clé requise. Les vallées y sont parce qu'un million d'années d'eau les y a mises.

Reste donc bloqué le seul cas d'un relief INVENTÉ à érosion crédible — besoin qu'aucun brief n'a encore formulé.

### Buildify — entrées incompatibles avec Blender 5.2

Le `.blend` est chargé, son groupe de nœuds `building` s'append, son kit est bien fourni (collections `modules`, `trim`, `rooftop_details` — ma mesure précédente disait le contraire). Il porte même une entrée `- BLOSM or ADE -`, faite pour ce cas exact. Mais Buildify 1.0 date de Blender 3.x : ses entrées portent des identifiants `Input_N`, et en 5.2 le modificateur de nœuds ne les expose plus en IDProperties (`bpy_struct.keys(): this type doesn't support IDProperties`). Appliqué tel quel il ne génère rien — 20 empreintes entrent, 20 polygones sortent. C'est un chantier d'adaptation d'API, pas un réglage.

### Quaternius

Techniquement accessible sans compte, mais ces modèles n'ont **ni cotes mesurées ni provenance vérifiable**. Les faire entrer violerait la règle d'admission du dépôt — celle-là même qui a servi à écarter des pièces bien plus utiles. Une règle qu'on plie une fois ne règle plus rien.

### Gaussian Splatting natif

La spec supposait qu'il fallait mettre `three` à jour depuis 0.169 pour l'obtenir. `three` est en 0.185.1, la dernière publiée, et **le support natif n'y est pas**. La prémisse était fausse ; il n'y a rien à mettre à jour, il y a à attendre ou à passer par une bibliothèque tierce.

### `three-particles`

Introuvable au registre npm sous ce nom. `three-nebula` — l'alternative que la spec elle-même désignait — est installée à sa place.

### `animaux` par le Smithsonian

ÉPROUVÉ ET ÉCARTÉ, pas supposé. La voie SANS COMPTE existe — `api.si.edu` exige une clé (`API_KEY_MISSING`), mais le dépôt de données ouvertes sur S3 est public et porte un préfixe `3d/`. Les métadonnées sont vérifiables et TOUT est CC0. Mais ce que la collection contient, ce sont des SCANS DE SPÉCIMENS : crânes, mandibules, ulnas, fémurs, en `.ply` sans textures ni UV. Un crâne de gibbon n'est pas un animal pour une scène de site. Trois autres unités sondées (herpétologie, zoo, poissons) : zéro modèle 3D. Les importer satisferait la lettre de la consigne en trahissant son but.

### `vehicules` : pas de véhicule routier libre et mesuré

Poly Haven déclare 45 catégories, AUCUNE n'est véhicule — vérifié sur `/categories/models`, pas déduit. La page `/models/vehicles-transport` répond HTTP 200, mais le site est une application monopage : toute route répond 200. Seule `ships` (4 navires) existe, et elle est entrée. Pour du véhicule routier, il faudra fabriquer — build123d est installé.

### Supabase

Décidé pour le back-end, pas câblé. Rien n'en dépend encore : le magasin ne passe pas par lui, et c'est délibéré — les octets vont chez R2, dont la sortie est gratuite.

### Un vrai `low` pour les pièces à masse géométrique

35 pièces n'ont que leur `full`. Pour les cartes, un `low` se refabrique en retéléchargeant en 1k. Pour les maillages — l'arbre jacaranda notamment — la masse est **géométrique** et non texturale : baisser la résolution des cartes n'y peut rien, il faut décimer sous Blender. C'est un travail de forme, pas de réglage.

### Les 7 cartes cuites

Elles resteront non reproductibles. Leur graine vient de `hash()` en Python, randomisé à chaque processus : relancer la cuisson rend une carte du même genre, jamais la même. On ne peut pas réparer ça après coup — on peut seulement les stocker, ce qui est fait.

---

## Les fautes trouvées dans mes propres outils

Elles sont listées parce qu'elles enseignent plus que les réussites, et parce
qu'une sonde fausse est pire que pas de sonde du tout.

| la faute | ce qu'elle produisait |
| --- | --- |
| le vérificateur de provenance ne reconnaissait pas les clés canoniques qu'il venait d'écrire | 71 pièces en règle signalées fautives — la faute exacte qu'il répare |
| `polyhaven.mjs` testait la clé `gltf`, que Poly Haven expose AUSSI sur les textures | les cartes PBR de 38 jeux effacées et remplacées par une bille de démonstration |
| importer `magasin.mjs` exécutait son bloc de ligne de commande | le module crachait son mode d'emploi dans la sortie de son appelant ; ma sonde y est morte |
| le garde posé ne couvrait pas la ligne d'usage, déclenchée sur `!args.length` | vraie par construction à l'import — le garde ne servait à rien |
| le poids du magasin n'additionnait que les objets **nouveaux** | au second passage, la fiche annonçait « 0,0 Mo » |
| le mode `--hors-ligne` des empreintes lisait une clé que rien n'écrit | il ne vérifiait rien, en silence |
| la première sonde de ce fichier cherchait les paquets à la racine | dix paquets installés déclarés ABSENTS — elle ne mesurait qu'elle-même |
| j'ai affirmé que la provenance portait « les URL et les MD5 » | elle ne les portait pas : le chiffre de 94 % était juste, la raison était fausse |

---

## La prochaine chose à faire

Créer le bucket R2 et son jeton, puis :

```bash
node outils/magasin.mjs --declarer "https://<bucket>.r2.dev" --jeton "<jeton>"
node outils/magasin.mjs --reclamer
```

Tout le reste est écrit et éprouvé.
