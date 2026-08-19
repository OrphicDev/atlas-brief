#!/usr/bin/env node
/**
 * IMPORTER UNE PIÈCE DE BLENDKIT DANS LE MAGASIN.
 *
 *     node outils/blendkit.mjs --chercher "apartment building"
 *     node outils/blendkit.mjs --boite architecture --id <assetBaseId> [--nom immeuble-r6]
 *
 * Écrit exactement ce que `polyhaven.mjs` écrit — même arborescence, mêmes
 * papiers, même magasin — pour qu'une pièce Blendkit soit indiscernable d'une
 * pièce Poly Haven à l'usage :
 *
 *     bibliotheques/<boite>/<piece>/full/<piece>.glb
 *     bibliotheques/<boite>/<piece>/provenance.json
 *
 * ═══ CE QUI DIFFÈRE DE POLY HAVEN, ET POURQUOI ═══
 *
 * Poly Haven sert du glTF ; Blendkit sert du `.blend`. La pièce passe donc par
 * Blender, qui l'ouvre et la réexporte — par `atelier/studio.exporter`, celui
 * qui RELIT le fichier écrit et refuse un matériau sans rugosité. Une pièce
 * venue d'ailleurs subit les mêmes contrôles qu'une pièce fabriquée ici ; c'est
 * tout l'intérêt de n'avoir qu'un seul exportateur.
 *
 * ═══ LE JETON NE TRANSITE PAS PAR LE DÉPÔT ═══
 *
 * La clé d'API vit dans les préférences de Blender. On la LIT au moment de
 * l'appel, on ne l'écrit nulle part, et elle n'apparaît dans aucun papier.
 */
import { writeFileSync, mkdirSync, existsSync, readFileSync, rmSync, statSync } from "node:fs";
import { join, dirname } from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";
import { createHash } from "node:crypto";

const RACINE = fileURLToPath(new URL("..", import.meta.url));
const BLENDER = "/Applications/Blender.app/Contents/MacOS/Blender";
const API = "https://www.blendkit.com/api/v1";
const arg = (n, d = null) => { const i = process.argv.indexOf("--" + n); return i === -1 ? d : (process.argv[i + 1] ?? true); };

/** La clé, lue dans Blender. Jamais stockée, jamais journalisée. */
function jeton() {
  const py = `import bpy;print("CLE=" + bpy.context.preferences.addons["bl_ext.BlenderKit.blenderkit"].preferences.api_key)`;
  const s = execFileSync(BLENDER, ["--background", "--python-expr", py],
                         { encoding: "utf8", maxBuffer: 32 << 20 });
  const m = s.match(/^CLE=(.+)$/m);
  if (!m || !m[1].trim()) {
    console.error("Blendkit n'est pas connecté : ouvrez Blender → Preferences → Add-ons → Blendkit → Login.");
    process.exit(2);
  }
  return m[1].trim();
}

async function api(chemin, params, cle) {
  const u = new URL(API + chemin);
  for (const [k, v] of Object.entries(params ?? {})) u.searchParams.set(k, v);
  const r = await fetch(u, { headers: { Authorization: "Bearer " + cle } });
  if (!r.ok) throw new Error(`${chemin} → HTTP ${r.status}`);
  return r.json();
}

/* ── --chercher : voir avant de prendre ────────────────────────────────── */
async function chercher(q) {
  const cle = jeton();
  const d = await api("/search/", { query: `asset_type:model ${q}`, page_size: 20, order: "-score" }, cle);
  console.log(`BLENDKIT — « ${q} » : ${d.count} résultats\n`);
  for (const a of d.results ?? []) {
    const f = (a.files ?? []).find(x => x.fileType === "blend");
    console.log(`  ${(a.name ?? "").slice(0, 44).padEnd(44)} ${((f?.fileUploadSize ?? 0) / 1e6).toFixed(1).padStart(7)} Mo  ${a.assetBaseId}`);
  }
  console.log("\n  node outils/blendkit.mjs --boite <boite> --id <assetBaseId>");
}

/* ═══════════════════════════════════════════════════════════════════════
 * LE BUDGET MÉMOIRE — ce qui a éteint la machine deux fois le 17/08/2026.
 * ═══════════════════════════════════════════════════════════════════════
 *
 * LES FAITS. Deux redémarrages brutaux à vingt-quatre minutes d'intervalle,
 * sur une machine dont le précédent datait de trois semaines. Aucun rapport de
 * panique, aucun `jetsam` : la mémoire partait trop vite pour que le système
 * ait le temps de tuer proprement quoi que ce soit.
 *
 * LA CAUSE, MESURÉE SUR LES FICHIERS PRODUITS. Le poids n'était pas la
 * géométrie : `villa_mediterraneenne` pèse 414 Mo pour 134 000 triangles, dont
 * 411 Mo — 99 % — d'images. `maison_medievale` : 27 images, 192 Mo, dont une
 * seule à 79,7 Mo COMPRESSÉE. C'est son import qui a tué la machine, et il a
 * laissé son `source.blend` de 137 Mo derrière lui, faute d'être arrivé à la
 * ligne qui l'efface.
 *
 * LE MÉCANISME, ET C'EST MA FAUTE. Blender matérialise une image en flottants
 * RGBA : quatre canaux, quatre octets. Une 4K coûte 268 Mo de RAM, une 8K
 * coûte 1,07 Go. Et `blendkit-convertir.py` appelait `im.scale()` sur TOUTES
 * les images — donc les chargeait TOUTES en même temps. Vingt-sept textures à
 * ce régime dépassent les 16 Go de la machine avant même l'export, qui
 * construit ensuite le glTF entier en mémoire par-dessus.
 *
 * L'ABSURDITÉ. Je téléchargeais le fichier PLEIN, puis je redimensionnais dans
 * Blender pour obtenir du 1K. Je payais le plein tarif mémoire pour arriver au
 * résultat léger. Or Blendkit publie déjà, à côté du `blend`, des fichiers
 * `resolution_0_5K`, `resolution_1K` et `resolution_2K` — je l'avais mesuré la
 * veille, et je ne m'en étais pas servi.
 *
 * CE QU'ON FAIT. On PRÉDIT le coût avant de télécharger — l'API annonce
 * `textureCount` et `textureResolutionMax` — et on prend la plus grosse
 * variante qui tient dans le budget. Au-delà, on REFUSE : mieux vaut un import
 * refusé qu'une machine éteinte.
 *
 * RÉSERVE HONNÊTE, à éprouver : je SUPPOSE que les variantes de résolution
 * portent la même géométrie que le fichier plein, et ne diffèrent que par les
 * textures. C'est ce que leur nom annonce, ce n'est pas encore vérifié. La
 * première pièce importée par cette voie doit être comparée au plein sur son
 * nombre de triangles et ses cotes.
 */
const BUDGET_RAM_OCTETS = 6e9;          // 6 Go sur une machine de 16
const OCTETS_PAR_PIXEL = 16;            // RGBA en flottants, côté Blender

/** La RAM que Blender demandera pour les textures de cette pièce. */
export function ramPrevisible(nbTextures, cote) {
  if (!nbTextures || !cote) return null;   // inconnu n'est pas zéro
  return nbTextures * cote * cote * OCTETS_PAR_PIXEL;
}

/** Le côté de texture qu'un fichier de variante annonce, par son nom. */
function coteDe(fileType) {
  const m = String(fileType).match(/resolution_(\d+)_?(\d*)K/i);
  if (!m) return null;
  return Math.round(parseFloat(m[2] ? `${m[1]}.${m[2]}` : m[1]) * 1024);
}

/**
 * La plus grosse variante qui tient dans le budget — et un refus motivé si
 * même la plus petite n'y tient pas.
 */
function choisirFichier(a, plein) {
  const fichiers = a.files ?? [];
  const par = (a.dictParameters ?? {});
  const n = Number(par.textureCount) || null;

  if (plein) {
    const f = fichiers.find(x => x.fileType === "blend");
    const cote = Number(par.textureResolutionMax) || null;
    const ram = ramPrevisible(n, cote);
    console.log(`  --plein demandé : ${n ?? "?"} textures à ${cote ?? "?"} px`
      + ` → ${ram ? (ram / 1e9).toFixed(1) + " Go de RAM prévisibles" : "coût inconnu"}`);
    if (ram && ram > BUDGET_RAM_OCTETS)
      console.log(`  ⚠ au-dessus du budget de ${(BUDGET_RAM_OCTETS / 1e9).toFixed(0)} Go.`
        + " C'est exactement ce qui a éteint la machine le 17/08/2026.");
    return f;
  }

  const variantes = fichiers
    .map(x => ({ f: x, cote: coteDe(x.fileType) }))
    .filter(x => x.cote)
    .sort((x, y) => y.cote - x.cote);

  /* COÛT INCONNU N'EST PAS COÛT NUL. Si l'API n'annonce pas `textureCount`,
     on ne peut RIEN prédire — et laisser passer le format plein « puisqu'on ne
     sait pas » est précisément la faute que ce dépôt interdit depuis le début.
     On prend alors la variante la PLUS PETITE, et on le dit. */
  if (n === null && variantes.length) {
    const v = variantes[variantes.length - 1];
    console.log(`  coût INCONNU (l'API n'annonce pas textureCount) → variante la plus`
      + ` petite, ${v.f.fileType} à ${v.cote} px. On ne parie pas avec la mémoire.`);
    return v.f;
  }

  for (const v of variantes) {
    const ram = ramPrevisible(n, v.cote);
    if (ram <= BUDGET_RAM_OCTETS) {
      console.log(`  variante ${v.f.fileType} — ${n ?? "?"} textures à ${v.cote} px`
        + `${ram ? `, ${(ram / 1e9).toFixed(2)} Go de RAM prévisibles` : ""}`);
      return v.f;
    }
  }

  /* Aucune variante publiée : on retombe sur le `blend`, mais seulement si le
     coût annoncé tient. Un asset sans variante ET trop lourd ne s'importe pas. */
  const brut = fichiers.find(x => x.fileType === "blend");
  const cote = Number(par.textureResolutionMax) || null;
  const ram = ramPrevisible(n, cote);
  if (brut && ram !== null && ram <= BUDGET_RAM_OCTETS) {
    console.log(`  aucune variante de résolution publiée ; le fichier plein tient`
      + ` (${(ram / 1e9).toFixed(2)} Go)`);
    return brut;
  }
  /* ═══ LE POIDS DU FICHIER EST UNE BORNE, ET C'EST UNE MESURE ═══
   *
   * Le refus « coût inconnu » est juste sur une pièce d'architecture, où l'API
   * se tait sur 27 textures dont une de 79,7 Mo compressée. Il est ABSURDE sur
   * un arbre low-poly dont le `.blend` entier pèse 0,1 Mo : un fichier de cette
   * taille ne PEUT PAS contenir une texture 4K, qui coûterait 268 Mo une fois
   * matérialisée. On ne suppose rien — le poids du conteneur borne son contenu.
   *
   * Mesuré le 19/08/2026 : les arbres low-poly de Blendkit publient tous un
   * `.blend` de 0,1 à 0,3 Mo, et aucun n'annonce `textureCount`. Sans cette
   * borne, la porte d'entrée du magasin les refuse tous — et c'est exactement
   * la catégorie dont le semis a besoin.
   *
   * 24 Mo : au-delà, on retombe dans l'inconnu et le refus reprend ses droits.
   * En dessous, même entièrement fait d'images non compressées, la pièce ne peut
   * pas approcher le budget. */
  const PETIT_OCTETS = 24e6;
  if (brut && ram === null && Number(brut.fileUploadSize) > 0
      && Number(brut.fileUploadSize) <= PETIT_OCTETS) {
    console.log(`  coût non annoncé, mais le fichier ne pèse que`
      + ` ${(Number(brut.fileUploadSize) / 1e6).toFixed(2)} Mo — son POIDS borne`
      + ` son contenu, aucune texture lourde ne peut y tenir.`);
    return brut;
  }
  if (brut && ram === null) {
    console.error(`\n  REFUSÉ — cette pièce ne publie AUCUNE variante de résolution,`
      + `\n  et l'API n'annonce ni textureCount ni textureResolutionMax : son coût`
      + `\n  mémoire est imprévisible. Le 17/08/2026, un import de coût non mesuré`
      + `\n  a éteint la machine deux fois.`
      + `\n  Pour l'ouvrir quand même, en sachant ce qu'on ignore : --plein`);
    process.exit(2);
  }
  console.error(`\n  REFUSÉ — ${n} textures à ${cote} px demanderaient`
    + ` ${(ram / 1e9).toFixed(1)} Go de RAM, au-dessus du budget de`
    + ` ${(BUDGET_RAM_OCTETS / 1e9).toFixed(0)} Go.`
    + `\n  Cette pièce ne publie aucune variante de résolution assez légère.`
    + `\n  Le 17/08/2026, un import de ce gabarit a éteint la machine deux fois.`
    + `\n  Pour passer outre en connaissance de cause : --plein`);
  process.exit(2);
}

/* ── --boite/--id : prendre, convertir, ranger ─────────────────────────── */
async function importer(boite, id, nomVoulu, plein = false) {
  const cle = jeton();
  const d = await api("/search/", { query: `asset_base_id:${id}`, page_size: 1 }, cle);
  const a = (d.results ?? [])[0];
  if (!a) { console.error("pièce introuvable :", id); process.exit(2); }

  const f = choisirFichier(a, plein);
  if (!f) { console.error("aucun fichier exploitable pour", a.name); process.exit(2); }

  const piece = (nomVoulu ?? a.name ?? id)
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
  const base = join(RACINE, "bibliotheques", boite, piece);
  mkdirSync(join(base, "full"), { recursive: true });

  console.log(`BLENDKIT ${a.name}`);
  console.log(`  ${(f.fileUploadSize / 1e6).toFixed(1)} Mo à télécharger…`);

  /* LE TÉLÉCHARGEMENT SE FAIT EN DEUX TEMPS, et les deux surprennent.
     ① `downloadUrl` exige `scene_uuid` — sans lui il rend 403 « Parameter
        scene_uuid not set ». C'est leur compteur de téléchargements ; il veut
        un UUID, pas une valeur particulière.
     ② Il ne rend pas le fichier mais un JSON portant `filePath`, une URL
        SIGNÉE et temporaire. La prendre pour le fichier écrit un .blend de
        deux cents octets que Blender ouvre sans rien y trouver. */
  const scene = crypto.randomUUID();
  const j = await fetch(`${f.downloadUrl}?scene_uuid=${scene}`,
                        { headers: { Authorization: "Bearer " + cle } });
  if (!j.ok) { console.error(`lien refusé : HTTP ${j.status} — ${(await j.text()).slice(0, 140)}`); process.exit(2); }
  const lien = (await j.json()).filePath;
  if (!lien) { console.error("la réponse ne porte pas de `filePath`"); process.exit(2); }
  const r = await fetch(lien);
  if (!r.ok) { console.error(`téléchargement refusé : HTTP ${r.status}`); process.exit(2); }
  const octets = Buffer.from(await r.arrayBuffer());
  const blend = join(base, "source.blend");
  writeFileSync(blend, octets);
  console.log(`  reçu ${(octets.length / 1e6).toFixed(1)} Mo`);
  if (f.fileUploadSize && Math.abs(octets.length - f.fileUploadSize) > f.fileUploadSize * 0.02) {
    console.error(`  TRONQUÉ : ${octets.length} reçus pour ${f.fileUploadSize} annoncés`);
    process.exit(2);
  }

  /* La conversion passe par NOTRE exportateur — celui qui relit et refuse. */
  const glb = join(base, "full", `${piece}.glb`);
  const glbLow = join(base, "low", `${piece}.glb`);
  mkdirSync(join(base, "low"), { recursive: true });
  const sortie = execFileSync(BLENDER, ["--background", "--factory-startup", blend,
    "--python", join(RACINE, "outils/blendkit-convertir.py"), "--", glb, glbLow],
    { encoding: "utf8", maxBuffer: 256 << 20,
    });
  const releve = sortie.match(/^BLENDKIT_CONV (\{.*\})$/m);
  if (!releve) {
    console.error("  la conversion n'a rien rendu :");
    console.error(sortie.split("\n").filter(l => /Error|Traceback|BLENDKIT_CONV/.test(l)).slice(0, 8).join("\n"));
    process.exit(2);
  }
  const m = JSON.parse(releve[1]);
  rmSync(blend, { force: true });

  const sha = createHash("sha256").update(readFileSync(glb)).digest("hex");
  writeFileSync(join(base, "provenance.json"), JSON.stringify({
    id: a.assetBaseId, nom: a.name, source: "Blendkit", source_nom: a.name,
    source_url: `https://www.blendkit.com/asset-gallery-detail/${a.assetBaseId}/`,
    licence: a.license, auteur: (a.author ?? {}).firstName
      ? `${a.author.firstName} ${a.author.lastName ?? ""}`.trim() : null,
    type: "modele", categories: a.category ? [a.category] : [],
    /* La DESCRIPTION est gardée parce que la catégorie de Blendkit est trop
       grossière pour le style : « historic » couvre aussi bien une maison à
       colombages qu'un immeuble méditerranéen. C'est le texte de l'auteur qui
       les sépare, et `outils/catalogue.mjs` s'en sert — en gardant la preuve. */
    description: (a.description ?? "").slice(0, 600),
    /* Les cotes sont MESURÉES sur le maillage reçu, pas recopiées de la fiche :
       Blendkit rend `dimensions: null` pour la plupart des pièces, et une cote
       absente présentée comme une cote est exactement ce que le dépôt refuse. */
    dimensions_mm: m.dimensions_mm, dimensions_mesurees: true,
    triangles: m.triangles, materiaux: m.materiaux,
    /* Ce qu'on a dû SIMPLIFIER pour que glTF puisse le dire. Une pièce
       modifiée en silence est une pièce dont on ne sait plus ce qu'elle vaut. */
    materiaux_simplifies: m.materiaux_simplifies ?? [],
    kit: m.kit ?? null, kit_pourquoi: m.kit_pourquoi ?? null,
    empreinte_glb: sha, octets: statSync(glb).size,
    fichier_source: f.fileType,
    variante_low: m.low,
    reproductible: true,
    comment: "Téléchargée en .blend depuis Blendkit, réexportée en glTF par "
           + "`atelier/studio.exporter` — le même contrôle que les pièces d'ici.",
  }, null, 2) + "\n", "utf8");

  console.log(`  ${m.triangles} triangles · ${m.dimensions_mm.map(x => Math.round(x)).join(" × ")} mm · ${(statSync(glb).size / 1e6).toFixed(1)} Mo`);
  console.log(`  → ${join("bibliotheques", boite, piece)}`);
  return { piece, boite };
}

/* La ligne de commande ne s'exécute QUE si on lance ce fichier — voir
   `outils/imports.test.mjs`. Sans cette garde, importer le module pour
   réutiliser `ramPrevisible()` affichait le mode d'emploi et sortait en 2. */
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const q = arg("chercher");
  if (q) await chercher(q);
  else if (arg("id")) await importer(arg("boite") ?? "architecture", arg("id"), arg("nom"), !!arg("plein"));
  else {
    console.error("usage : --chercher \"<mots>\"  |  --boite <boite> --id <assetBaseId> [--nom <nom>] [--plein]");
    process.exit(2);
  }
}
