/**
 * ═══════════════════════════════════════════════════════════════════════
 * RAPATRIER DE POLY HAVEN — toujours DEUX versions, jamais une seule.
 * ═══════════════════════════════════════════════════════════════════════
 *
 * Chaque pièce est posée en deux variantes, et c'est la convention du dépôt :
 *
 *     bibliotheques/<boite>/<piece>/full/    la plus haute résolution utile
 *     bibliotheques/<boite>/<piece>/low/     la version pour le navigateur
 *     bibliotheques/<boite>/<piece>/provenance.json
 *
 * POURQUOI DEUX ET NON UNE. Le système nodal existe pour qu'un projet puisse
 * choisir : le rendu Blender veut la pleine résolution, la page web veut le
 * poids le plus bas. Ne garder qu'une version force à trancher une fois pour
 * toutes, et à retélécharger le jour où l'autre besoin se présente.
 *
 * CE QUE « LOW » NE RÈGLE PAS, et il faut le savoir avant de s'y fier : la
 * résolution ne touche QUE les cartes. Une pièce dont la masse est géométrique
 * ne maigrit pas — le jacaranda pèse 205 Mo en 1k contre 265 en 4k, parce que
 * ce sont ses millions de cartes de feuilles qui pèsent, pas ses textures. Pour
 * celles-là, un vrai « low » demande une décimation, donc Blender.
 *
 *     node outils/polyhaven.mjs --boite objets --slug Camera_01
 *     node outils/polyhaven.mjs --rejouer          # refait les deux variantes
 *                                                  # de tout ce qui est déjà là
 */
import { writeFileSync, mkdirSync, existsSync, readdirSync, readFileSync, statSync, rmSync } from "node:fs";
import { join, dirname, basename } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { createHash } from "node:crypto";

const RACINE = fileURLToPath(new URL("..", import.meta.url));
const UA = { headers: { "User-Agent": "atlas-v2/1.0" } };
const FULL = "4k", LOW = "1k";

const arg = (n, d = null) => { const i = process.argv.indexOf("--" + n); return i === -1 ? d : (process.argv[i + 1] ?? true); };
const api = async (u) => (await fetch("https://api.polyhaven.com" + u, UA)).json();
const ko = (o) => o < 1048576 ? `${(o / 1024).toFixed(0)} Ko` : `${(o / 1048576).toFixed(1)} Mo`;

async function ecrire(url, dest) {
  mkdirSync(dirname(dest), { recursive: true });
  const r = await fetch(url, UA);
  if (!r.ok) throw new Error(`${r.status} sur ${url}`);
  const b = Buffer.from(await r.arrayBuffer());
  writeFileSync(dest, b);
  return b.length;
}

/* ── LES RÔLES DE CARTE, EN FRANÇAIS ───────────────────────────────────────
   `atelier/cartes.py` cherche « _couleur. », « _normale. », « _rugosite. » et
   « _deplacement. » dans le nom du fichier. Une première version de cet outil a
   pris la clé `gltf` que Poly Haven expose AUSSI pour les textures — c'est une
   bille de matière, pas les cartes — et a effacé les cartes brutes de trente-
   huit jeux au passage. `cartes.py` ne trouvait plus rien.

   Les clés de l'API sont donc traduites explicitement, et la traduction est
   ici plutôt que dans un nom de fichier deviné. */
const ROLES = {
  Diffuse: "couleur", nor_gl: "normale", Rough: "rugosite",
  Displacement: "deplacement", AO: "occlusion",
};

/** Pose UNE variante. Rend son poids et le compte de fichiers. */
async function variante(f, kind, res, dossier) {
  let poids = 0, n = 0;
  if (kind === "texture") {
    for (const [cle, role] of Object.entries(ROLES)) {
      const e = f[cle]?.[res];
      if (!e) continue;
      const src = e.jpg ?? e.png ?? Object.values(e)[0];
      if (!src?.url) continue;
      const ext = src.url.split(".").pop();
      poids += await ecrire(src.url, join(dossier, `${basename(dirname(dossier))}_${role}.${ext}`));
      n++;
    }
    return n ? { resolution: res, octets: poids, poids: ko(poids), fichiers: n } : null;
  }
  if (kind === "hdri") {
    const e = f.hdri?.[res]?.hdr;
    if (!e) return null;
    poids += await ecrire(e.url, join(dossier, basename(e.url))); n++;
  } else {
    const e = f.gltf?.[res]?.gltf;
    if (!e) return null;
    poids += await ecrire(e.url, join(dossier, basename(e.url))); n++;
    for (const [rel, inc] of Object.entries(e.include ?? {})) {
      poids += await ecrire(inc.url, join(dossier, rel)); n++;
    }
  }
  return { resolution: res, octets: poids, poids: ko(poids), fichiers: n };
}

async function rapatrier(boite, slug) {
  const [f, info] = await Promise.all([api(`/files/${slug}`), api(`/info/${slug}`)]);
  /* ON NE DEVINE PLUS LE TYPE : ON LE DEMANDE.
     ═══════════════════════════════════════════════════════════════════════
     Deux fautes sur ce seul point, et la seconde a été trouvée en faisant
     entrer une borne d'incendie de bout en bout.
       ① D'abord j'ai testé `gltf` en premier — mais Poly Haven expose `gltf`
          sur les TEXTURES aussi (la bille de démonstration). Trente-huit jeux
          de cartes PBR ont été effacés et remplacés par une bille.
       ② J'ai donc testé `Diffuse` en premier. Mais un MODÈLE expose ses
          propres cartes, donc `Diffuse` : `fire_hydrant` a été classé texture,
          et seuls ses cinq maps sont arrivés — aucun maillage. La pièce
          existait sans exister.
     Réordonner une devinette ne fait que déplacer l'erreur : chaque ordre a son
     contre-exemple. `/info/<slug>` rend `type` — 0 HDRI, 1 texture, 2 modèle —
     et c'est l'AUTEUR de la donnée qui le dit. Vérifié sur les trois :
     fire_hydrant=2, marble_01=1, goegap=0.
     Quand une inférence a deux contre-exemples, c'est qu'il fallait demander. */
  const TYPES = { 0: "hdri", 1: "texture", 2: "gltf" };
  const kind = TYPES[info?.type];
  if (!kind) throw new Error(
    `Poly Haven ne dit pas le type de « ${slug} » (/info a rendu type=${JSON.stringify(info?.type)}). `
    + "On ne devine pas : sans le type, on ne sait pas quels fichiers prendre.");
  const base = join(RACINE, "bibliotheques", boite, slug);
  /* On efface les anciens fichiers posés à plat : sans ça la pièce porterait
     à la fois son ancienne version 2k et ses deux variantes, et son poids
     mentirait. */
  for (const x of existsSync(base) ? readdirSync(base) : []) {
    if (["full", "low", "provenance.json", "noeud.md"].includes(x)) continue;
    rmSync(join(base, x), { recursive: true, force: true });
  }
  const v = {};
  for (const [nom, res] of [["full", FULL], ["low", LOW]]) {
    rmSync(join(base, nom), { recursive: true, force: true });
    v[nom] = await variante(f, kind, res, join(base, nom));
  }
  if (!v.full && !v.low) throw new Error(`aucune variante disponible pour ${slug}`);

  const geometrique = v.full && v.low && (v.low.octets / v.full.octets) > 0.7;
  writeFileSync(join(base, "provenance.json"), JSON.stringify({
    id: slug, nom: info.name ?? slug, source: "Poly Haven", licence: "CC0",
    type: kind, categories: info.categories, tags: info.tags,
    auteurs: info.authors, dimensions_mm: info.dimensions ?? null,
    variantes: v,
    gain_low_sur_full: v.full && v.low
      ? `${(100 - v.low.octets / v.full.octets * 100).toFixed(0)} %` : null,
    masse_geometrique: geometrique,
    avertissement: geometrique
      ? "la version low ne pèse presque rien de moins : la masse de cette pièce "
        + "est GÉOMÉTRIQUE, pas texturale. Un vrai allègement demande une "
        + "décimation sous Blender."
      : null,
  }, null, 2) + "\n", "utf8");
  return { slug, boite, v, geometrique };
}

/* ── ce qui est déjà posé, pour `--rejouer` ── */
function dejaLa() {
  const out = [];
  const bib = join(RACINE, "bibliotheques");
  for (const boite of readdirSync(bib)) {
    const d = join(bib, boite);
    if (!statSync(d).isDirectory()) continue;
    for (const p of readdirSync(d)) {
      const pr = join(d, p, "provenance.json");
      if (!existsSync(pr)) continue;
      try {
        const J = JSON.parse(readFileSync(pr, "utf8"));
        if (J.source === "Poly Haven") out.push([boite, J.id ?? p]);
      } catch { /* provenance illisible : on ne devine pas */ }
    }
  }
  return out;
}

async function principal() {
  const cibles = arg("rejouer") ? dejaLa()
    : (arg("boite") && arg("slug")) ? [[arg("boite"), arg("slug")]] : null;
  if (!cibles) { console.error("usage : --boite <b> --slug <s>  |  --rejouer"); process.exit(2); }

  let tf = 0, tl = 0; const geo = [];
  for (const [boite, slug] of cibles) {
    try {
      const r = await rapatrier(boite, slug);
      tf += r.v.full?.octets ?? 0; tl += r.v.low?.octets ?? 0;
      if (r.geometrique) geo.push(slug);
      console.log(`  ${boite.padEnd(20)} ${slug.padEnd(26)} full ${(r.v.full?.poids ?? "—").padStart(8)}  low ${(r.v.low?.poids ?? "—").padStart(8)}${r.geometrique ? "   ⚠ masse géométrique" : ""}`);
    } catch (e) {
      console.log(`  ${boite.padEnd(20)} ${slug.padEnd(26)} ÉCHEC : ${e.message}`);
    }
  }
  console.log(`\n  full ${ko(tf)} · low ${ko(tl)} · total ${ko(tf + tl)}`);
  if (geo.length) console.log(`  ⚠ ${geo.length} pièces dont le low n'allège pas : ${geo.join(", ")}`);
}

/* ═══════════════════════════════════════════════════════════════════════
 * L'ARGV NE NOUS APPARTIENT PAS.
 * ═══════════════════════════════════════════════════════════════════════
 *
 * Importer ce fichier lisait la ligne de commande DE L'APPELANT, et les deux
 * issues étaient mauvaises :
 *
 *   sans `--boite`/`--slug`, `cibles` était nul : l'import imprimait un mode
 *   d'emploi puis `process.exit(2)` — le processus qui avait importé mourait
 *   là, avec le code d'un refus qu'il n'avait pas demandé ;
 *
 *   avec un `--rejouer` traînant dans l'argv d'un autre outil, l'import
 *   RETÉLÉCHARGEAIT les deux variantes de toutes les pièces Poly Haven du
 *   dépôt — et `rapatrier()` commence par effacer ce qui est en place.
 *
 * C'est mot pour mot la faute de `lieu.py` le 17/08/2026 : une garde qui
 * regarde l'argv déclenche l'outil avec les arguments d'un autre. On ne
 * regarde donc plus l'argv, on regarde QUI a été lancé. */
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await principal();
