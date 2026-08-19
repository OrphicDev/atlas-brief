/**
 * ═══════════════════════════════════════════════════════════════════════
 * LE MAGASIN — Atlas a son stockage, et on l'APPELLE.
 * ═══════════════════════════════════════════════════════════════════════
 *
 * LA CONSIGNE, ET CE QU'ELLE CORRIGE. Je cherchais des systèmes dehors —
 * Poly Haven pour recharger, un SSD, un Drive, un bucket. Sacha a coupé :
 * « je veux qu'Atlas ait son propre système de stockage à appeler ». La
 * différence n'est pas de rangement, elle est de dépendance. Tant que le code
 * ouvre `bibliotheques/textures/marble_01/full/marble_01_couleur.jpg`, Atlas
 * dépend d'une arborescence, d'un disque, et de qui a bien voulu la servir.
 * Quand il appelle `magasin.chemin("marble_01", "full", "couleur")`, il ne
 * dépend plus que d'Atlas.
 *
 * CE QU'EST LE MAGASIN. Un dépôt adressé par contenu. Une pièce y entre sous
 * l'empreinte SHA-256 de ses octets, et rien d'autre ne la nomme. Trois
 * conséquences, et chacune règle un problème qu'on a eu :
 *
 *   · DÉDOUBLONNAGE GRATUIT. Deux fichiers identiques sous deux noms n'occupent
 *     qu'une place. Le dépôt en portait — la même carte servie à deux pièces.
 *   · IMMUABLE. Un objet est écrit une fois, puis passé en lecture seule (444).
 *     On ne peut plus l'altérer par accident : une écriture échoue bruyamment
 *     au lieu de corrompre en silence.
 *   · L'ADRESSE EST LA PREUVE. Le nom d'un objet EST son empreinte. Vérifier
 *     le magasin, c'est relire chaque objet et voir s'il porte encore son nom.
 *     Aucun manifeste à tenir à jour, aucun manifeste à croire.
 *
 * CE QUE ÇA NE COÛTE PAS. L'arborescence lisible des bibliothèques reste en
 * place — mais chaque fichier y devient un LIEN DUR vers l'objet du magasin.
 * Même inode, zéro octet de plus, et tous les scripts existants continuent
 * d'ouvrir les chemins qu'ils connaissent. Le magasin n'ajoute pas une copie,
 * il devient le propriétaire de celle qui existait.
 *
 * CE QUE ÇA CHANGE POUR LE DEHORS. Un SSD, un bucket, un NAS ne sont plus des
 * destinations où l'on range : ce sont des ADOSSEMENTS du magasin, tous
 * équivalents, tous remplaçables. `--adosser` en réplique le contenu et le
 * vérifie. Si Poly Haven ferme demain, rien ne se passe : les octets sont ici.
 *
 *     node outils/magasin.mjs --ingerer          # fait entrer les bibliothèques
 *     node outils/magasin.mjs --verifier         # relit tout : l'objet porte-t-il son nom ?
 *     node outils/magasin.mjs --ou marble_01     # où est cette pièce, en quoi
 *     node outils/magasin.mjs --adosser <chemin> # réplique et contrôle ailleurs
 *     node outils/magasin.mjs --etat             # ce que le magasin contient
 */
import { readdirSync, statSync, existsSync, mkdirSync, createReadStream, renameSync,
         writeFileSync, readFileSync, chmodSync, linkSync, unlinkSync, copyFileSync,
         lstatSync } from "node:fs";
import { createHash } from "node:crypto";
import { join, dirname, extname, basename, relative } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

export const RACINE = fileURLToPath(new URL("..", import.meta.url));
export const MAGASIN = join(RACINE, "magasin");
const OBJETS = join(MAGASIN, "objets");
const INDEX = join(MAGASIN, "index.json");

/* Ce qui est un OBJET : des octets qu'on ne saurait pas refabriquer à
   l'identique. Le texte — provenance, fiches, scripts, index — reste en clair
   dans l'arborescence et dans git : il se lit, se compare et se corrige à la
   main, ce qu'un objet adressé par contenu interdit par construction. */
const BINAIRES = new Set([".jpg", ".jpeg", ".png", ".webp", ".exr", ".hdr",
  ".glb", ".gltf", ".bin", ".blend", ".blend1", ".ktx2", ".zip", ".mp4", ".tif", ".tiff"]);
const IGNORE = new Set(["node_modules", ".venv", ".git", ".DS_Store", "magasin"]);

/* LE RÔLE D'UN FICHIER, lu dans son nom — EN DEUX VOCABULAIRES.
   Les TEXTURES rapatriées sont renommées en français au téléchargement, et ce
   vocabulaire faisait foi. Mais les MODÈLES arrivent avec leurs textures
   annexes telles que Poly Haven les nomme — `_diff`, `_arm`, `_nor_gl`. Trouvé
   en faisant entrer une borne d'incendie : ses six cartes ont été étiquetées
   « rendu », comme des captures d'écran. Un rôle faux n'empêche pas la pièce
   d'exister, il empêche de la DEMANDER : `trouver(piece, variante, "couleur")`
   rendait null sur une pièce qui a bel et bien une couleur.
   (`_arm` porte occlusion+rugosité+métal dans les trois canaux d'une seule
   image — c'est une carte, pas trois, et elle se nomme donc `arm`.) */
const ROLES = ["couleur", "normale", "rugosite", "deplacement", "occlusion",
               "metal", "opacite", "emission", "specular"];
const ROLES_ANGLAIS = {
  diff: "couleur", diffuse: "couleur", albedo: "couleur", col: "couleur",
  nor_gl: "normale", nor_dx: "normale", nor: "normale", normal: "normale",
  rough: "rugosite", roughness: "rugosite",
  disp: "deplacement", displacement: "deplacement", height: "deplacement",
  ao: "occlusion", metal: "metal", spec: "specular", arm: "arm", bump: "deplacement",
};

const sha256 = (p) => new Promise((res, rej) => {
  const h = createHash("sha256");
  createReadStream(p).on("data", (d) => h.update(d))
    .on("end", () => res(h.digest("hex"))).on("error", rej);
});

/** Le chemin d'un objet dans le magasin, à partir de son empreinte. */
export const adresse = (sha) => join(OBJETS, sha.slice(0, 2), sha.slice(2, 4), sha);

/**
 * LE TOTAL SE DÉRIVE DE L'INDEX, JAMAIS DE CE QU'UNE COMMANDE VIENT DE VOIR.
 *
 * `--ingerer` écrivait `I.objets = vus.size`, où `vus` ne contient que les
 * fichiers qu'IL a parcourus. Les 44 objets rapatriés du cache d'Atlas V1
 * vivent au magasin sans être dans l'arborescence : la première ingestion
 * suivante les a effacés du compte, et le total est TOMBÉ de 890 à 872 au
 * moment même où j'ajoutais vingt-six fichiers. L'index et le disque, eux,
 * s'accordaient à 916.
 *
 * C'est la même faute que le poids qui annonçait « 0,0 Mo » au second
 * passage : un chiffre calculé à partir de ce qu'une commande a fait, plutôt
 * qu'à partir de ce qui EST. On la corrige ici pour toutes les commandes à la
 * fois, sinon elle reviendra à la prochaine.
 */
function recompter(I) {
  const shas = new Map();
  for (const p of Object.values(I.pieces))
    for (const v of Object.values(p.variantes))
      for (const o of Object.values(v)) shas.set(o.sha, o.octets ?? 0);
  I.objets = shas.size;
  I.octets = [...shas.values()].reduce((a, x) => a + x, 0);
  I.poids = Go(I.octets);
  return I;
}

const lireIndex = () => existsSync(INDEX)
  ? JSON.parse(readFileSync(INDEX, "utf8"))
  : { _: "ARTEFACT — tenu par `node outils/magasin.mjs`.", pieces: {} };

/**
 * CHERCHER UNE PIÈCE — c'est l'appel qu'Atlas fait, et le seul.
 * Rend le chemin absolu de l'objet, ou null. Le code appelant ne sait pas, et
 * n'a pas à savoir, si l'objet vient d'un SSD, d'un bucket ou d'ici.
 */
export function chemin(piece, variante = "full", role = null) {
  const I = lireIndex();
  const p = I.pieces[piece];
  if (!p) return null;
  /* Une pièce peut n'avoir qu'une variante : on rend celle qui existe plutôt
     que rien. Refuser sur une variante absente forcerait chaque appelant à
     connaître les variantes de chaque pièce — c'est exactement le savoir que
     le magasin est là pour reprendre. */
  const v = p.variantes[variante] ?? p.variantes.full ?? p.variantes.low
         ?? Object.values(p.variantes)[0];
  if (!v) return null;
  if (!role) {
    const seul = Object.values(v);
    return seul.length === 1 ? adresse(seul[0].sha) : null;
  }
  /* On cherche par rôle parmi les fichiers. `v[role]` marchait tant que la clé
     ÉTAIT le rôle ; elle est maintenant le nom de fichier, qui ne perd rien. */
  const t = Object.values(v).find(o => o.role === role);
  return t ? adresse(t.sha) : null;
}

/* ═══════════════════════════════════════════════════════════════════════
   LE MAGASIN A UNE ADRESSE — sinon c'est un magasin pour une seule machine.
   ═══════════════════════════════════════════════════════════════════════

   CE QUE SACHA A VU, ET QUE J'AVAIS MANQUÉ. Le lien dur ne quitte pas le
   volume. Un magasin qui ne vit que sur mon disque est un magasin auquel
   personne d'autre ne peut rien demander : « comment les collaborateurs y
   auront accès ? ». Ils n'y avaient pas accès. `--adosser` déposait des
   octets sur un SSD — un carton, pas un service.

   POURQUOI C'EST FACILE À RÉPARER ICI. Un objet s'appelle par l'empreinte de
   son contenu. Servir le magasin ne demande donc aucune API, aucun schéma,
   aucune version : un GET sur le nom de l'objet suffit. Et surtout, le CLIENT
   PEUT VÉRIFIER CE QU'IL REÇOIT — il recalcule l'empreinte et la compare au
   nom qu'il a demandé. Un octet altéré en route, un serveur qui se trompe de
   fichier, un intermédiaire qui bricole : rien ne passe. C'est une propriété
   qu'aucun partage de fichiers ne donne.

   Deux conséquences pratiques :
     · un objet est IMMUABLE, donc cachable pour toujours — on ne redemande
       jamais ce qu'on a déjà, et il n'y a pas d'invalidation à penser ;
     · le serveur est bête et en LECTURE SEULE. R2, Supabase, un NAS derrière
       un tunnel, ou `--servir` ci-dessous : ce sont des interchangeables.

   L'index, lui, est du texte et vit dans git. Un collaborateur qui clone sait
   donc EXACTEMENT ce qui lui manque avant d'avoir téléchargé un seul octet. */

/* Les adresses du magasin, dans l'ordre où on les interroge.
 *
 * ELLES VIVENT À DEUX ENDROITS, ET C'EST VOULU.
 *
 * `magasin/adossements.json` est écarté de git : il peut porter un jeton, et
 * un secret ne part pas dans un dépôt public. Mais je m'étais arrêté là — et
 * un collaborateur qui clone se retrouvait alors sans AUCUNE adresse :
 * `--reclamer` lui répondait « aucun adossement déclaré ». Il aurait fallu lui
 * transmettre l'URL de la main à la main, ce qui vide de son sens un index
 * versionné qui dit déjà exactement ce qui manque.
 *
 * Donc : les adresses SANS jeton sont recopiées dans `magasin/index.json`, qui
 * est versionné. Elles ne sont pas des secrets — le bucket R2 est public en
 * lecture, et de toute façon un objet ne s'obtient qu'en connaissant son
 * empreinte de soixante-quatre caractères. Celles qui portent un jeton restent
 * dans le fichier écarté. Un clone frais sait donc où réclamer, sans que rien
 * de confidentiel n'ait voyagé. */
const ADOSSEMENTS = join(MAGASIN, "adossements.json");
export function lireAdossements() {
  const local = existsSync(ADOSSEMENTS)
    ? JSON.parse(readFileSync(ADOSSEMENTS, "utf8"))
    : { _: "Les adresses du magasin, interrogées dans cet ordre.", distants: [] };
  const publics = (lireIndex().adossements_publics ?? [])
    .filter(u => !local.distants.some(d => d.url === u))
    .map(url => ({ url, jeton: null, depuis: "index versionné" }));
  return { ...local, distants: [...local.distants, ...publics] };
}

/**
 * OBTENIR UNE PIÈCE — l'appel qu'Atlas fait vraiment, et le seul qui compte.
 *
 * Rend le chemin local de l'objet. S'il n'est pas là, il est réclamé au
 * premier adossement qui répond, VÉRIFIÉ, puis rangé — donc jamais redemandé.
 * L'appelant ne sait pas si l'octet vient de son disque ou d'un serveur, et
 * c'est exactement ce qu'on veut : le magasin est une adresse, pas un dossier.
 */
export async function obtenir(piece, variante = "full", role = null) {
  const local = chemin(piece, variante, role);
  return local ? obtenirEmpreinte(basename(local)) : null;
}

/**
 * OBTENIR UN OBJET PAR SON EMPREINTE — l'adresse exacte, celle qui ne peut
 * pas se tromper de cible.
 *
 * POURQUOI IL A FALLU L'ÉCRIRE. `--reclamer` passait par
 * `obtenir(pièce, variante, rôle)`, qui résout vers le PREMIER fichier
 * portant ce rôle. Les quatre-vingt-six rendus d'une planche de matières sont
 * tous des « rendu » : l'outil retéléchargeait le même objet quatre-vingt-six
 * fois et comptait quatre-vingt-six succès. Il a annoncé « 1 024 rapatriés,
 * 0 introuvable » quand le disque n'en portait que 553 sur 890.
 *
 * C'est la troisième fois que la collision de rôles me coûte quelque chose.
 * Les deux premières perdaient des données en silence ; celle-ci PROCLAMAIT
 * une réussite, ce qui est pire. Un rapport faux vaut moins que pas de
 * rapport du tout. La seule trace était un total qui dépassait le nombre
 * d'objets du magasin — 1 024 pour 890 — et ça pouvait passer pour un détail
 * de comptage.
 *
 * Le rôle n'est pas une adresse. L'empreinte, si.
 */
export async function obtenirEmpreinte(sha) {
  const local = adresse(sha);
  if (existsSync(local)) return local;
  for (const d of lireAdossements().distants) {
    try {
      const r = await fetch(`${d.url.replace(/\/$/, "")}/objets/${sha.slice(0, 2)}/${sha.slice(2, 4)}/${sha}`,
        { headers: d.jeton ? { "x-atlas-jeton": d.jeton } : {} });
      if (!r.ok) continue;
      const octets = Buffer.from(await r.arrayBuffer());
      /* LA VÉRIFICATION N'EST PAS OPTIONNELLE. On a demandé un nom qui EST une
         empreinte : si ce qui arrive ne la porte pas, ce n'est pas l'objet.
         On jette sans rien ranger — un magasin qui accepte n'importe quoi
         n'est plus un magasin, c'est un cache empoisonné. */
      const vu = createHash("sha256").update(octets).digest("hex");
      if (vu !== sha) continue;
      mkdirSync(dirname(local), { recursive: true });
      writeFileSync(local, octets);
      chmodSync(local, 0o444);
      return local;
    } catch { /* cet adossement ne répond pas : on essaie le suivant */ }
  }
  return null;
}

/** Ce qui manque au magasin local — des OBJETS DISTINCTS, pas des entrées.
 *
 *  La version d'avant rendait une entrée par (pièce, variante, fichier). Un
 *  même objet référencé par plusieurs pièces sortait plusieurs fois, et le
 *  total dépassait le nombre d'objets du magasin : 1 024 pour 890. Un compte
 *  qui excède son propre total est un compte faux, pas une redondance. */
export function manquants() {
  const I = lireIndex(), vus = new Map();
  for (const [nom, p] of Object.entries(I.pieces))
    for (const [v, roles] of Object.entries(p.variantes))
      for (const o of Object.values(roles))
        if (!existsSync(adresse(o.sha)) && !vus.has(o.sha))
          vus.set(o.sha, { piece: nom, variante: v, role: o.role, fichier: o.nom, sha: o.sha, octets: o.octets });
  return [...vus.values()];
}

/** Toutes les faces d'une pièce, par variante puis par rôle. */
export function pieceEntiere(piece) {
  const p = lireIndex().pieces[piece];
  if (!p) return null;
  return Object.fromEntries(Object.entries(p.variantes).map(([v, roles]) =>
    [v, Object.fromEntries(Object.entries(roles).map(([f, o]) =>
      /* `nom` PASSE. Il ne passait pas, et `--ou` affichait une colonne vide là
         où on veut lire le nom du fichier : la donnée était dans l'index, perdue
         par cette projection. Un champ rempli que rien ne relit à l'arrivée —
         le défaut de signature de ce projet, retrouvé une fois de plus. */
      [f, { role: o.role, nom: o.nom, chemin: adresse(o.sha), octets: o.octets, sha: o.sha }]))]));
}

/** Fait entrer un fichier au magasin. Rend son empreinte. */
async function deposer(abs) {
  const sha = await sha256(abs);
  const cible = adresse(sha);
  if (existsSync(cible)) return { sha, nouveau: false };
  mkdirSync(dirname(cible), { recursive: true });
  /* On DÉPLACE, on ne copie pas : le fichier existant devient l'objet, puis on
     rebranche l'arborescence dessus par un lien dur. Copier doublerait 3,4 Go
     pour rien. Le déplacement échoue entre volumes — on retombe alors sur une
     copie suivie d'une suppression, et on le signale. */
  let traverse = false;
  try { renameSync(abs, cible); }
  catch { copyFileSync(abs, cible); unlinkSync(abs); traverse = true; }
  chmodSync(cible, 0o444);
  return { sha, nouveau: true, traverse };
}

/** Rebranche un chemin de l'arborescence sur l'objet, par lien dur. */
function rebrancher(abs, sha) {
  const src = adresse(sha);
  if (existsSync(abs)) {
    /* Déjà le même inode ? Rien à faire — c'est le cas au second passage. */
    try { if (lstatSync(abs).ino === lstatSync(src).ino) return "deja"; } catch {}
    unlinkSync(abs);
  }
  mkdirSync(dirname(abs), { recursive: true });
  try { linkSync(src, abs); return "lien"; }
  catch { copyFileSync(src, abs); return "copie"; }
}

/** Découpe un chemin de bibliothèque en pièce / variante / rôle.
 *  EXPORTÉE pour être éprouvée : c'est une fonction pure d'un chemin, et ses
 *  fautes sont silencieuses — un rôle faux n'empêche pas la pièce d'exister, il
 *  empêche de la DEMANDER. */
export function situer(rel) {
  const m = rel.split("/");           // bibliotheques/<boite>/<piece>/[variante/]<fichier>
  const boite = m[1], piece = m[2];
  const fichier = m[m.length - 1];
  const variante = (m.length >= 5 && (m[3] === "full" || m[3] === "low")) ? m[3] : "full";
  const nu = basename(fichier, extname(fichier));
  const ext = extname(fichier).toLowerCase();
  /* On cherche le rôle dans les deux vocabulaires, du suffixe le plus long au
     plus court : `nor_gl` avant `nor`, sinon « nor » gagnerait et on perdrait
     la variante d'espace tangent. */
  const anglais = Object.keys(ROLES_ANGLAIS).sort((a, b) => b.length - a.length)
    .find(k => new RegExp(`_${k}(_\\d+k)?$`, "i").test(nu));
  const role = ROLES.find(r => nu.endsWith("_" + r) || nu === r)
            ?? (anglais ? ROLES_ANGLAIS[anglais] : null)
            ?? (ext === ".glb" || ext === ".gltf" ? "maillage"
            : ext === ".bin" ? "geometrie"
            : ext === ".exr" || ext === ".hdr" ? "environnement"
            : ext === ".blend" ? "source"
            : ext === ".png" || ext === ".jpg" ? "rendu" : "fichier");
  return { boite, piece, variante, role, fichier };
}

function parcours(dir, sortie = []) {
  if (!existsSync(dir)) return sortie;
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    if (IGNORE.has(e.name)) continue;
    const p = join(dir, e.name);
    if (e.isDirectory()) parcours(p, sortie);
    else if (e.isFile() && BINAIRES.has(extname(e.name).toLowerCase())) sortie.push(p);
  }
  return sortie;
}

const Go = (o) => o >= 1e9 ? (o / 1e9).toFixed(2).replace(".", ",") + " Go"
                : (o / 1e6).toFixed(1).replace(".", ",") + " Mo";

/* ═══════════════════════════════════════════════════════════════════════
   LA LIGNE DE COMMANDE NE S'EXÉCUTE QUE SI ON APPELLE CE FICHIER.
   Sans ce garde, `import { chemin } from "./magasin.mjs"` déclenchait le bloc
   CLI : le module crachait son mode d'emploi sur la sortie standard de son
   appelant. Ma propre sonde en est morte — elle a lu « Usage : … » là où elle
   attendait un chemin. Un module qui parle quand on l'importe n'est pas une
   bibliothèque. */
const EN_LIGNE_DE_COMMANDE =
  process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
const args = EN_LIGNE_DE_COMMANDE ? process.argv.slice(2) : [];
const a = (n) => args.includes(n);
const val = (n) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : null; };

if (a("--ingerer")) {
  mkdirSync(OBJETS, { recursive: true });
  const I = lireIndex();
  /* LE FRONT N'EST PAS UNE BIBLIOTHÈQUE. `apps/` était parcouru, et ses .glb
     de travail entraient au magasin sous une pièce nommée « src », dans une
     boîte « web » qui n'existe pas. Pire : `apps/web/src/visionneuse/sphere-or.glb`
     était une COPIE PÉRIMÉE de l'or cassé — sans roughnessFactor — pendant que
     la pièce de bibliothèque, elle, était corrigée. Une copie d'asset hors du
     magasin vieillit en silence ; c'est exactement ce que le magasin existe
     pour empêcher. Le front DEMANDE, il ne détient pas. */
  const fichiers = parcours(join(RACINE, "bibliotheques"));
  /* L'ARBORESCENCE FAIT FOI POUR CE QU'ELLE PORTE.
     L'ingestion AJOUTAIT à l'index sans jamais retirer. Après régénération de
     la sphère d'or, `sphere-or/full` portait DEUX entrées `sphere-or.glb` —
     l'ancienne et la neuve — et le résolveur rendait la première, donc
     l'ancienne. La page affichait un or corrigé sur le disque et resté faux à
     l'écran, sans une erreur nulle part.
     La clé par empreinte empêche les collisions ; elle ne dit pas laquelle est
     VIVANTE. C'est le disque qui le dit. On vide donc les variantes de chaque
     pièce que ce parcours rencontre, avant de les remplir. Les pièces qu'il ne
     voit pas — celles rapatriées d'ailleurs, qui n'ont pas de fichier dans
     l'arbre — ne sont pas touchées : on n'efface que ce qu'on peut recompter. */
  const vues = new Set();
  for (const abs of fichiers) vues.add(situer(relative(RACINE, abs).split("\\").join("/")).piece);
  for (const nom of vues) if (I.pieces[nom]) I.pieces[nom].variantes = {};

  /* UNE PIÈCE QUI N'A PLUS DE PLACE DANS LES BIBLIOTHÈQUES N'EST PLUS UNE PIÈCE.
     Vider les variantes des pièces VUES ne suffisait pas : celles qui avaient
     disparu du disque restaient inscrites, intactes. Trois fantômes vivaient
     ainsi dans l'index — « src » (les fichiers de travail du front), « rendus »
     (renommé « planches »), « marble_bust_01 » (rangé sous un autre nom). Un
     index qui garde ce qui n'existe plus finit par décrire un dépôt imaginaire.
     Leurs OBJETS ne sont pas touchés : ils restent au magasin, adossés, servis,
     retrouvables par leur empreinte. On retire un NOM, jamais des octets — et
     on dit lesquels. */
  const fantomes = Object.keys(I.pieces).filter(n => !vues.has(n));
  for (const n of fantomes) delete I.pieces[n];
  let entres = 0, deja = 0, octets = 0, economises = 0, traverses = 0, n = 0;
  const vus = new Set();
  for (const abs of fichiers) {
    n++;
    const rel = relative(RACINE, abs).split("\\").join("/");
    const taille = statSync(abs).size;
    const { boite, piece, variante, role, fichier } = situer(rel);
    const { sha, nouveau, traverse } = await deposer(abs);
    if (traverse) traverses++;
    if (nouveau) entres++; else deja++;
    /* Le poids du magasin est celui de ses objets DISTINCTS, et il ne dépend
       pas de la fois où on le compte. La première version n'ajoutait que les
       objets nouveaux : au second passage, tout était déjà là et la fiche
       annonçait « 0,0 Mo ». Un chiffre qui change selon le nombre de fois
       qu'on a lancé l'outil ne mesure pas le magasin, il mesure l'outil. */
    if (vus.has(sha)) economises += taille; else octets += taille;
    vus.add(sha);
    rebrancher(abs, sha);
    const P = (I.pieces[piece] ??= { boite, variantes: {} });
    /* (voir la note sur la clé, plus bas dans --rapatrier)
       ANCIENNE NOTE, gardée parce qu'elle explique l'étape intermédiaire :
       La première version faisait `variantes[variante][role] = …`. Plusieurs
       fichiers d'une même pièce tombent sur le même rôle — quinze captures
       d'une page d'inspiration sont toutes des « rendu » — et chacune écrasait
       la précédente. Résultat mesuré : 846 objets au magasin, 551 seulement
       référencés par l'index. 295 objets stockés, payés, vérifiés, et
       INATTEIGNABLES par leur nom ; un collaborateur qui réclame tout n'en
       aurait reçu que les deux tiers. La perte était silencieuse — rien ne
       protestait, les deux comptes vivaient dans deux fichiers différents.
       Le nom de fichier, lui, est unique dans une pièce et une variante. */
    /* LA CLÉ EST L'EMPREINTE, et c'est la troisième tentative.
       ① par RÔLE : quatre-vingt-six rendus sont tous des « rendu » — ils
          s'écrasaient, 295 objets devenaient inatteignables.
       ② par NOM DE FICHIER : unique dans une pièce, croyais-je. Le cache
          d'Atlas V1 porte des `marble_01_couleur.jpg` d'une AUTRE résolution ;
          ils ont écrasé ceux de V2 et l'index est tombé de 846 à 776.
       Deux fois j'ai choisi une clé qui « ne peut pas » entrer en collision,
       et deux fois elle l'a fait — silencieusement, parce qu'une affectation
       qui écrase ne proteste jamais. L'empreinte, elle, ne peut pas mentir :
       deux contenus différents ont deux clés différentes, par construction.
       Le nom et le rôle deviennent des attributs, et on les cherche. */
    (P.variantes[variante] ??= {})[sha] = { sha, octets: taille, role, nom: fichier };
    if (n % 100 === 0) process.stdout.write(`\r  ${n}/${fichiers.length} — entrés ${entres}, déjà là ${deja}…   `);
  }
  process.stdout.write("\r".padEnd(70) + "\r");
  recompter(I);
  /* Le compte des fichiers vus et des doublons vit dans l'index, pas dans la
     tête de qui lit la sortie. ETAT.md les reprenait en dur — deux nombres
     saisis à la main dans un dépôt dont toute la règle est qu'on ne saisit
     rien. Ils vieillissaient dès la prochaine ingestion, en silence. */
  I.fichiers_vus = fichiers.length;
  I.doublons = fichiers.length - vus.size;
  I.octets_economises = economises;
  writeFileSync(INDEX, JSON.stringify(I, null, 2) + "\n", "utf8");
  console.log(`MAGASIN — ingestion`);
  console.log(`  fichiers vus            ${fichiers.length}`);
  /* DEUX CHIFFRES, ET ILS NE DISENT PAS LA MÊME CHOSE. `vus` est ce que CE
     parcours a rencontré dans l'arborescence ; `I.objets` est ce que le
     magasin contient, y compris les objets rapatriés d'ailleurs qui n'ont pas
     de fichier dans l'arbre. Afficher le premier en le nommant « objets du
     magasin » était faux, et c'est ce qui m'a fait lire une chute de 890 à
     872 au moment où j'ajoutais des fichiers. */
  console.log(`  objets vus ici          ${vus.size}   (${Go(octets)})`);
  console.log(`  objets AU MAGASIN       ${I.objets}   (${I.poids})`);
  console.log(`  doublons dédoublonnés   ${fichiers.length - vus.size}${economises ? `  — ${Go(economises)} économisés` : ""}`);
  console.log(`  pièces indexées         ${Object.keys(I.pieces).length}`);
  if (fantomes.length) {
    console.log(`  noms retirés            ${fantomes.length}  (plus de fichier dans bibliotheques/ ; leurs objets restent au magasin)`);
    for (const f of fantomes) console.log(`     ${f}`);
  }
  if (traverses) console.log(`  ⚠ ${traverses} fichiers copiés au lieu d'être déplacés (volumes différents)`);

  /* La fiche du magasin est un ARTEFACT : elle se refabrique, elle ne se
     relit pas. Aucun chiffre n'y est saisi — ils sortent tous de l'index
     qu'on vient d'écrire. */
  const pieces = Object.entries(I.pieces);
  const parBoite = {};
  for (const [, p] of pieces) parBoite[p.boite] = (parBoite[p.boite] ?? 0) + 1;
  const sansLow = pieces.filter(([, p]) => !p.variantes.low).map(([n]) => n);
  writeFileSync(join(MAGASIN, "MAGASIN.md"),
`# Le magasin d'Atlas

**${vus.size} objets, ${Go(octets)}, ${pieces.length} pièces.**

Artefact — refait par \`node outils/magasin.mjs --ingerer\`.

## Pourquoi il existe

Atlas ne dépend plus d'un tiers pour ses octets. Ce qui a été téléchargé ou
fabriqué une fois est **gardé ici**. Si une source ferme, change ses URL ou
retire un asset, rien ne se passe : les octets sont là.

Le reste d'Atlas n'ouvre plus de chemins de disque. Il appelle :

\`\`\`js
import { chemin, pieceEntiere } from "./outils/magasin.mjs";
chemin("marble_01", "full", "couleur");   // → le fichier, où qu'il soit
pieceEntiere("marble_01");                 // → toutes ses variantes et rôles
\`\`\`

## Comment il est fait

Un objet est nommé par l'**empreinte SHA-256 de son contenu**, et par rien
d'autre. Trois propriétés en découlent, et chacune règle un problème qu'on a eu :

| | |
| --- | --- |
| **dédoublonnage** | deux fichiers identiques n'occupent qu'une place — ${fichiers.length - vus.size} doublons trouvés dans le dépôt${economises ? `, ${Go(economises)} récupérés` : ""} |
| **immuable** | chaque objet est en lecture seule (444) : une écriture accidentelle échoue au lieu de corrompre en silence |
| **l'adresse est la preuve** | vérifier, c'est relire un objet et voir s'il porte encore son nom. Aucun manifeste à croire |

L'arborescence lisible des bibliothèques reste en place : chaque fichier y est
un **lien dur** vers l'objet. Même inode, zéro octet de plus, et tous les
scripts existants continuent d'ouvrir les chemins qu'ils connaissent.

## Où il est stocké

**Sur le même volume que le code**, et ce n'est pas un choix de commodité : un
lien dur ne traverse pas les volumes. Un magasin sur un disque externe et une
arborescence sur le disque interne ne partageraient aucun inode, et les
${Go(octets)} seraient doublés.

Tout le reste — SSD, NAS, bucket — est un **adossement** : le même magasin
ailleurs, réplique vérifiée à la relecture, remplaçable sans qu'une ligne
d'Atlas change.

\`\`\`
node outils/magasin.mjs --adosser "/Volumes/SSD Stockage 4To/Atlas-magasin"
node outils/magasin.mjs --verifier
\`\`\`

## Ce qu'il contient

| bibliothèque | pièces |
| --- | ---: |
${Object.entries(parBoite).sort((x, y) => y[1] - x[1]).map(([b, n]) => `| ${b} | ${n} |`).join("\n")}

${sansLow.length ? `## Les ${sansLow.length} pièces sans variante « low »

Le contrat dit que chaque pièce porte un \`full\` et un \`low\`. Celles-ci n'ont
que le \`full\` — c'est une dette, mesurée ici plutôt que supposée ailleurs.

${sansLow.map(x => `- \`${x}\``).join("\n")}
` : ""}`, "utf8");
  console.log(`  → magasin/index.json et magasin/MAGASIN.md`);
}

if (a("--verifier")) {
  /* Le nom d'un objet EST son empreinte : vérifier, c'est relire et comparer
     au nom. Rien d'autre à croire — pas de manifeste, pas de date. */
  const objets = [];
  const marche = (d) => { if (!existsSync(d)) return;
    for (const e of readdirSync(d, { withFileTypes: true }))
      e.isDirectory() ? marche(join(d, e.name)) : objets.push(join(d, e.name)); };
  marche(OBJETS);
  let ok = 0; const faux = [], ouverts = [];
  let i = 0;
  for (const o of objets) {
    i++;
    if ((await sha256(o)) === basename(o)) ok++; else faux.push(relative(OBJETS, o));
    if ((statSync(o).mode & 0o222) !== 0) ouverts.push(relative(OBJETS, o));
    if (i % 200 === 0) process.stdout.write(`\r  ${i}/${objets.length}…   `);
  }
  process.stdout.write("\r".padEnd(40) + "\r");
  /* L'index promet des objets : ceux qui manquent sont des promesses vides. */
  const I = lireIndex();
  const promis = new Set();
  for (const p of Object.values(I.pieces))
    for (const v of Object.values(p.variantes))
      for (const o of Object.values(v)) promis.add(o.sha);
  const absents = [...promis].filter(s => !existsSync(adresse(s)));
  console.log("CONTRÔLE DU MAGASIN");
  console.log(`  objets                  ${objets.length}`);
  console.log(`  portent bien leur nom   ${ok}`);
  console.log(`  ALTÉRÉS                 ${faux.length}`);
  console.log(`  encore inscriptibles    ${ouverts.length}${ouverts.length ? "  (devraient être en 444)" : ""}`);
  console.log(`  promis par l'index, absents  ${absents.length}`);
  /* L'INVERSE COMPTE AUSSI. Régénérer une pièce remplace son entrée : l'ancien
     objet reste au magasin, adossé et servi, mais plus rien ne le nomme. Ce
     n'est pas une perte — c'est l'historique, et il se retrouve par son
     empreinte. Mais un magasin qui n'annonce pas ses orphelins laisse croire
     que son total est celui de son index, et les deux divergent en silence. */
  const orphelins = objets.filter(o => !promis.has(basename(o)));
  console.log(`  au magasin, plus référencés  ${orphelins.length}` +
    (orphelins.length ? `   (versions précédentes — retrouvables par empreinte)` : ""));
  for (const x of [...faux.slice(0, 8), ...absents.slice(0, 8)]) console.log(`     ${x}`);
  process.exit(faux.length || absents.length ? 2 : 0);
}

const ou = val("--ou");
if (ou) {
  const p = pieceEntiere(ou);
  if (!p) { console.log(`Aucune pièce « ${ou} » au magasin.`); process.exit(2); }
  console.log(`PIÈCE ${ou}`);
  for (const [v, roles] of Object.entries(p)) {
    console.log(`  ${v}`);
    /* On affiche le RÔLE et le NOM, pas la clé. Depuis que l'index est rangé
       par empreinte, la clé est l'empreinte : l'afficher comme libellé rendait
       une colonne de hachages illisible là où on veut lire « couleur ». */
    for (const o of Object.values(roles))
      console.log(`    ${String(o.role ?? "?").padEnd(14)} ${(o.nom ?? "").padEnd(34)} `
        + `${Go(o.octets).padStart(9)}  ${o.sha.slice(0, 12)}…`);
  }
}

const dest = val("--adosser");
if (dest) {
  /* Un adossement n'est pas une sauvegarde de plus : c'est le MÊME magasin
     ailleurs. Mêmes noms, donc même vérification — on relit à l'arrivée. */
  const objets = [];
  const marche = (d) => { if (!existsSync(d)) return;
    for (const e of readdirSync(d, { withFileTypes: true }))
      e.isDirectory() ? marche(join(d, e.name)) : objets.push(join(d, e.name)); };
  marche(OBJETS);
  mkdirSync(join(dest, "objets"), { recursive: true });
  let copies = 0, deja = 0, octets = 0; const fautes = [];
  let i = 0;
  for (const o of objets) {
    i++;
    const rel = relative(MAGASIN, o);
    const cible = join(dest, rel);
    if (existsSync(cible) && (await sha256(cible)) === basename(o)) { deja++; continue; }
    mkdirSync(dirname(cible), { recursive: true });
    copyFileSync(o, cible);
    if ((await sha256(cible)) === basename(o)) { copies++; octets += statSync(o).size; chmodSync(cible, 0o444); }
    else fautes.push(rel);
    if (i % 100 === 0) process.stdout.write(`\r  ${i}/${objets.length}…   `);
  }
  process.stdout.write("\r".padEnd(40) + "\r");
  copyFileSync(INDEX, join(dest, "index.json"));
  console.log(`ADOSSEMENT → ${dest}`);
  console.log(`  déjà présents et vérifiés  ${deja}`);
  console.log(`  copiés puis RELUS          ${copies}  (${Go(octets)})`);
  console.log(`  copies fautives            ${fautes.length}`);
  for (const x of fautes.slice(0, 8)) console.log(`     ${x}`);
  process.exit(fautes.length ? 2 : 0);
}

if (a("--etat")) {
  const I = lireIndex();
  const pieces = Object.entries(I.pieces);
  const parBoite = {};
  for (const [, p] of pieces) parBoite[p.boite] = (parBoite[p.boite] ?? 0) + 1;
  console.log(`MAGASIN — ${I.objets ?? "?"} objets, ${I.poids ?? "?"}`);
  console.log(`  pièces  ${pieces.length}`);
  for (const [b, n] of Object.entries(parBoite).sort((x, y) => y[1] - x[1]))
    console.log(`    ${b.padEnd(22)} ${String(n).padStart(3)}`);
  const sansLow = pieces.filter(([, p]) => !p.variantes.low).map(([n]) => n);
  console.log(`  pièces sans variante « low »  ${sansLow.length}`);
}

/* ═══ --rapatrier : faire entrer des octets venus d'ailleurs ══════════════

   POURQUOI CE MODE EXISTE. 337 Mo d'assets téléchargés dormaient dans le
   `.cache/` d'Atlas V1 — le tiroir même que le .gitignore écarte, et dont la
   documentation dit déjà qu'il « n'aurait jamais été versionné ». Sous la
   règle « une fois téléchargé, on ne retélécharge pas », ces octets doivent
   entrer.

   TROIS RÈGLES, et chacune répond à un risque réel :

   ① ON COPIE, JAMAIS ON NE DÉPLACE. `--ingerer` déplace, parce qu'il travaille
      chez lui. Ici la source est un AUTRE projet : le vider serait le casser.

   ② LA RÈGLE D'ADMISSION TIENT. Une pièce sans provenance n'entre pas, et elle
      est NOMMÉE dans le rapport. C'est la règle qui a servi à écarter des
      pièces utiles ; la plier pour du confort la ferait cesser d'exister.

   ③ ON COMPARE PAR CONTENU. 157 des 244 fichiers du cache V1 étaient déjà au
      magasin sous un autre chemin. Comparer les noms aurait fait croire à
      244 nouveautés — c'est le contenu qui décide, et le dédoublonnage est
      gratuit puisqu'un objet est nommé par son empreinte. */
const rapatrier = val("--rapatrier");
if (EN_LIGNE_DE_COMMANDE && rapatrier) {
  if (!existsSync(rapatrier)) { console.error(`Introuvable : ${rapatrier}`); process.exit(1); }
  mkdirSync(OBJETS, { recursive: true });
  const I = lireIndex();

  /* Une pièce = le dossier qui porte le provenance.json. On remonte depuis le
     fichier jusqu'à trouver des papiers, sans sortir de l'arbre source. */
  const papiersDe = (dir) => {
    let d = dir;
    while (d.startsWith(rapatrier)) {
      const p = join(d, "provenance.json");
      if (existsSync(p)) { try { return { dir: d, J: JSON.parse(readFileSync(p, "utf8")) }; } catch { return null; } }
      const parent = dirname(d);
      if (parent === d) break;
      d = parent;
    }
    return null;
  };

  const tous = [];
  (function marche(d) {
    for (const e of readdirSync(d, { withFileTypes: true })) {
      if (IGNORE.has(e.name)) continue;
      const p = join(d, e.name);
      if (e.isDirectory()) marche(p);
      else if (e.isFile() && BINAIRES.has(extname(e.name).toLowerCase())) tous.push(p);
    }
  })(rapatrier);

  let entres = 0, deja = 0, octets = 0; const refuses = new Map();
  let n = 0;
  for (const abs of tous) {
    n++;
    const sha = await sha256(abs);
    const pap = papiersDe(dirname(abs));
    if (!pap) {
      const cle = relative(rapatrier, dirname(abs)).split("/").slice(0, 2).join("/") || ".";
      const r = refuses.get(cle) ?? { fichiers: 0, octets: 0 };
      r.fichiers++; r.octets += statSync(abs).size;
      refuses.set(cle, r);
      continue;
    }
    const cible = adresse(sha);
    if (existsSync(cible)) deja++;
    else {
      mkdirSync(dirname(cible), { recursive: true });
      copyFileSync(abs, cible);
      /* On relit ce qu'on vient d'écrire. Une copie non relue n'est pas une
         copie, c'est un espoir — et ici l'empreinte est déjà connue, donc la
         vérification ne coûte qu'une lecture. */
      if ((await sha256(cible)) !== sha) { unlinkSync(cible); console.error(`copie fautive : ${abs}`); continue; }
      chmodSync(cible, 0o444);
      entres++; octets += statSync(cible).size;
    }
    const piece = basename(pap.dir);
    const boite = relative(rapatrier, dirname(pap.dir)).split("/")[0] || "rapatrie";
    const sousChemin = relative(pap.dir, abs).split("/");
    const variante = (sousChemin.length > 1 && ["full", "low"].includes(sousChemin[0])) ? sousChemin[0] : "full";
    const fichier = basename(abs);
    const nu = basename(fichier, extname(fichier));
    const role = ROLES.find(r => nu.endsWith("_" + r) || nu === r) ?? "fichier";
    const P = (I.pieces[piece] ??= { boite, variantes: {} });
    /* LA CLÉ EST L'EMPREINTE, et c'est la troisième tentative.
       ① par RÔLE : quatre-vingt-six rendus sont tous des « rendu » — ils
          s'écrasaient, 295 objets devenaient inatteignables.
       ② par NOM DE FICHIER : unique dans une pièce, croyais-je. Le cache
          d'Atlas V1 porte des `marble_01_couleur.jpg` d'une AUTRE résolution ;
          ils ont écrasé ceux de V2 et l'index est tombé de 846 à 776.
       Deux fois j'ai choisi une clé qui « ne peut pas » entrer en collision,
       et deux fois elle l'a fait — silencieusement, parce qu'une affectation
       qui écrase ne proteste jamais. L'empreinte, elle, ne peut pas mentir :
       deux contenus différents ont deux clés différentes, par construction.
       Le nom et le rôle deviennent des attributs, et on les cherche. */
    (P.variantes[variante] ??= {})[sha] = { sha, octets: statSync(abs).size, role, nom: fichier };
    if (n % 50 === 0) process.stdout.write(`\r  ${n}/${tous.length}…   `);
  }
  process.stdout.write("\r".padEnd(40) + "\r");

  recompter(I);
  writeFileSync(INDEX, JSON.stringify(I, null, 2) + "\n", "utf8");

  console.log(`RAPATRIEMENT ← ${rapatrier}`);
  console.log(`  fichiers examinés        ${tous.length}`);
  console.log(`  déjà au magasin          ${deja}   (mêmes octets sous un autre chemin)`);
  console.log(`  entrés                   ${entres}  (${Go(octets)})`);
  console.log(`  REFUSÉS, sans provenance ${[...refuses.values()].reduce((a, r) => a + r.fichiers, 0)}`);
  for (const [c, r] of [...refuses].sort((a, b) => b[1].octets - a[1].octets))
    console.log(`     ${c.padEnd(34)} ${String(r.fichiers).padStart(3)} fichiers  ${Go(r.octets)}`);
  console.log(`  objets au magasin        ${I.objets}`);
}

/* ═══ --detacher : rendre un chemin réinscriptible ═══════════════════════

   L'IMMUABILITÉ AVAIT UN REVERS QUE JE N'AVAIS PAS VU. Les fichiers de
   l'arborescence sont des LIENS DURS vers des objets en 444 : c'est ce qui
   fait qu'une écriture accidentelle échoue au lieu de corrompre en silence.
   Mais un générateur qui refait sa pièce écrit sur ce même chemin — et il
   échoue, lui aussi. Blender rendait « cannot save », et rien n'indiquait que
   la cause était le magasin.

   Détacher ne supprime PAS l'objet : il reste au magasin, adossé, servi par
   R2. On coupe seulement le lien de l'arborescence, pour que le générateur
   écrive un fichier neuf. `--ingerer` refera le lien ensuite, vers l'objet
   nouveau si le contenu a changé, vers l'ancien s'il est identique.

       node outils/magasin.mjs --detacher bibliotheques/objets/sphere-or */
const detacher = val("--detacher");
if (EN_LIGNE_DE_COMMANDE && detacher) {
  const abs = join(RACINE, detacher);
  if (!existsSync(abs)) { console.error(`Introuvable : ${detacher}`); process.exit(1); }
  let coupes = 0, ignores = 0;
  const traiter = (p) => {
    const st = lstatSync(p);
    if (st.isDirectory()) { for (const e of readdirSync(p)) traiter(join(p, e)); return; }
    /* Un fichier est « du magasin » s'il partage son inode avec un objet.
       On ne coupe que ceux-là : les fiches et les provenances restent. */
    if (!BINAIRES.has(extname(p).toLowerCase())) { ignores++; return; }
    if (st.nlink > 1) { unlinkSync(p); coupes++; }
    else ignores++;
  };
  traiter(abs);
  console.log(`DÉTACHÉ ${detacher}`);
  console.log(`  liens coupés     ${coupes}   (les objets restent au magasin)`);
  console.log(`  laissés en place ${ignores}`);
  console.log(`  → régénérer, puis \`node outils/magasin.mjs --ingerer\``);
}

/* ═══ --servir : le magasin répond à une adresse ═════════════════════════
   Bête et en LECTURE SEULE. Il ne sait faire qu'une chose — rendre un objet
   dont on lui donne l'empreinte — et c'est tout ce qu'il faut savoir faire.
   Aucune écriture n'est exposée : un serveur qui accepte des dépôts devrait
   authentifier, autoriser, valider, et deviendrait la pièce fragile du
   système. Ici, la seule façon d'entrer au magasin est `--ingerer`, en local.

   Le jeton (ATLAS_MAGASIN_JETON) n'est pas un mécanisme d'intégrité : celle-là
   vient du hash et le client la vérifie de toute façon. Il ne sert qu'à ne pas
   ouvrir 3 Go d'assets d'agence au premier venu qui trouve l'URL. */
if (EN_LIGNE_DE_COMMANDE && a("--servir")) {
  const http = await import("node:http");
  const { createReadStream } = await import("node:fs");
  const port = Number(val("--port") ?? 8787);
  const jeton = process.env.ATLAS_MAGASIN_JETON ?? null;
  const SHA = /^[0-9a-f]{64}$/;
  let servis = 0, refuses = 0;

  http.createServer((req, res) => {
    const fin = (code, texte) => { res.writeHead(code, { "content-type": "text/plain; charset=utf-8" }); res.end(texte); };
    if (req.method !== "GET" && req.method !== "HEAD") return fin(405, "lecture seule");
    if (jeton && req.headers["x-atlas-jeton"] !== jeton) { refuses++; return fin(401, "jeton"); }

    const u = new URL(req.url, "http://x");
    if (u.pathname === "/index.json") {
      res.writeHead(200, { "content-type": "application/json; charset=utf-8" });
      return res.end(readFileSync(INDEX));
    }
    if (u.pathname === "/etat") {
      const I = lireIndex();
      res.writeHead(200, { "content-type": "application/json; charset=utf-8" });
      return res.end(JSON.stringify({ objets: I.objets, poids: I.poids,
        pieces: Object.keys(I.pieces).length, servis, refuses }, null, 2));
    }
    /* Le chemin demandé est reconstruit à partir de l'empreinte SEULE, jamais
       repris de l'URL. Sans ça, « /objets/../../.ssh/id_rsa » sortirait du
       magasin — un serveur de fichiers qui fait confiance à son chemin est un
       serveur de fichiers qui sert tout le disque. */
    const m = u.pathname.match(/^\/objets\/[0-9a-f]{2}\/[0-9a-f]{2}\/([0-9a-f]{64})$/);
    if (!m || !SHA.test(m[1])) return fin(404, "adresse inconnue");
    const f = adresse(m[1]);
    if (!existsSync(f)) return fin(404, "objet absent");
    const st = statSync(f);
    res.writeHead(200, { "content-type": "application/octet-stream",
      "content-length": st.size, "etag": `"${m[1]}"`,
      /* Immuable par construction : le contenu ne peut pas changer sans
         changer de nom. On peut donc le cacher pour toujours. */
      "cache-control": "public, max-age=31536000, immutable" });
    if (req.method === "HEAD") return res.end();
    servis++;
    createReadStream(f).pipe(res);
  }).listen(port, () => {
    const I = lireIndex();
    console.log(`LE MAGASIN SERT — http://localhost:${port}`);
    console.log(`  ${I.objets} objets, ${I.poids}, ${Object.keys(I.pieces).length} pièces`);
    console.log(`  jeton : ${jeton ? "exigé (ATLAS_MAGASIN_JETON)" : "AUCUN — n'exposez pas cette adresse hors du réseau local"}`);
    console.log(`  routes : /index.json  /etat  /objets/<xx>/<yy>/<empreinte>`);
  });
}

/* ═══ --reclamer : rapatrier ce qui manque, depuis les adossements ════════ */
if (EN_LIGNE_DE_COMMANDE && a("--reclamer")) {
  const abs = manquants();
  if (!abs.length) { console.log("Rien ne manque au magasin local."); }
  else {
    const D = lireAdossements().distants;
    if (!D.length) {
      console.log(`${abs.length} objets manquent, et AUCUN adossement n'est déclaré.`);
      console.log("  Déclarez-en un :  node outils/magasin.mjs --declarer <url> [--jeton <jeton>]");
      process.exit(2);
    }
    let repris = 0; const perdus = [];
    for (const o of abs) {
      /* PAR EMPREINTE, jamais par (pièce, variante, rôle) : le rôle n'est pas
         une adresse, il désigne parfois quatre-vingt-six fichiers. */
      const r = await obtenirEmpreinte(o.sha);
      if (r) repris++; else perdus.push(`${o.piece}/${o.variante}/${o.fichier ?? o.role}`);
      if (repris % 50 === 0 && r) process.stdout.write(`\r  ${repris}/${abs.length}…   `);
    }
    process.stdout.write("\r".padEnd(30) + "\r");
    console.log(`RÉCLAMATION — ${abs.length} objets manquaient`);
    console.log(`  rapatriés et vérifiés  ${repris}`);
    console.log(`  introuvables           ${perdus.length}`);
    for (const p of perdus.slice(0, 10)) console.log(`     ${p}`);
    process.exit(perdus.length ? 2 : 0);
  }
}

const declarer = val("--declarer");
if (EN_LIGNE_DE_COMMANDE && declarer) {
  const A = lireAdossements();
  A.distants = A.distants.filter(d => d.url !== declarer);
  A.distants.push({ url: declarer, jeton: val("--jeton") ?? null, declare: true });
  writeFileSync(ADOSSEMENTS, JSON.stringify(A, null, 2) + "\n", "utf8");
  /* Sans jeton = pas un secret = ça part dans l'index versionné, pour qu'un
     clone frais sache où réclamer sans qu'on ait à le lui dire. */
  if (!val("--jeton")) {
    const I = lireIndex();
    I.adossements_publics = [...new Set([...(I.adossements_publics ?? []), declarer])];
    writeFileSync(INDEX, JSON.stringify(I, null, 2) + "\n", "utf8");
    console.log("  adresse publique — inscrite dans magasin/index.json, donc versionnée");
  }
  console.log(`Adossement déclaré : ${declarer}`);
  console.log(`  ${A.distants.length} adresse${A.distants.length > 1 ? "s" : ""} au total`);
  if (val("--jeton")) console.log("  ⚠ le jeton est écrit en clair dans magasin/adossements.json — ce fichier ne doit pas partir dans git");
}

/* Le garde vaut AUSSI pour le mode d'emploi. Sans lui, `args` est vide à
   l'import — par construction — et le module annonçait son usage à chaque
   `import`. Le garde posé plus haut ne servait alors à rien. */
if (EN_LIGNE_DE_COMMANDE && !args.length) console.log(
  "Usage : --ingerer | --verifier | --etat | --ou <pièce> | --adosser <chemin>");
