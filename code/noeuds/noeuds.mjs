/**
 * ═══════════════════════════════════════════════════════════════════════
 * LE SYSTÈME NODAL — bâti sur ce qui est SUR LE DISQUE, pas sur une intention.
 * ═══════════════════════════════════════════════════════════════════════
 *
 * Chaque pièce des bibliothèques devient un nœud. Son origine n'est pas
 * choisie : `origineDe(existe, dependDuBrief)` l'applique, et les deux entrées
 * sont mesurées — `existe` par un parcours du disque, `dependDuBrief` par la
 * famille du nœud.
 *
 *     node outils/noeuds.mjs
 *
 * Écrit `bibliotheques/noeuds.json` et `bibliotheques/NOEUDS.md`. Les deux sont
 * des ARTEFACTS : ils se refabriquent, ils ne se relisent pas.
 */
import { readdirSync, readFileSync, writeFileSync, existsSync, statSync } from "node:fs";
import { join, extname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const RACINE = fileURLToPath(new URL("..", import.meta.url));
const BIB = join(RACINE, "bibliotheques");

/* Quelle bibliothèque nourrit quelle famille de nœuds. */
const FAMILLE_DE = {
  textures: "texture", matieres: "matiere", terrain: "terrain", objets: "objet",
  architecture: "architecture", "mobilier-urbain": "mobilier_urbain",
  "mobilier-interieur": "mobilier_interieur", humain: "humain",
  vegetation: "vegetation", vehicules: "vehicule", ciels: "ciel",
  climat: "climat", studio: "studio", mouvement: "mouvement",
  palettes: "palette", polices: "police", transitions: "transition",
  loaders: "loader", animations: "animation", "composants-web": "composant_web",
  shaders: "shader", inspiration: "inspiration",
};

/* Les familles SANS bibliothèque : elles n'existent qu'au moment d'un projet. */
const SANS_BOITE = {
  scene: "la disposition d'une scène tient au brief : elle ne se range pas",
  livrable: "le site livré est le projet lui-même",
  /* Ces deux-là manquaient, et une chose absente du graphe est absente du plan.
     L'ÉCLAIRAGE se mesure dans le ciel de CETTE scène : `soleilDe()` lit la
     direction et la dureté dans l'image même. Un autre ciel donne un autre
     soleil ; il n'y a rien à cataloguer.
     L'USURE est la trace qu'un objet laisse là où il est posé. Elle dépend du
     couple — la même borne ne marque pas l'asphalte comme le gazon. */
  eclairage: "le soleil et l'ombre sont mesurés dans le ciel de cette scène — un autre ciel, un autre soleil",
  usure: "la trace d'un objet sur son sol dépend du couple : quelle pièce, quel terrain",
};

const ADMIN = new Set(["LISEZ-MOI.md", "catalogue.json", "noeud.md", ".DS_Store"]);

/* Ce que chaque famille FAIT — écrit une fois, servi à chaque nœud. */
const DESCRIPTIONS = {
  texture: "Un jeu de cartes photographiées — couleur, normale, rugosité, parfois déplacement — avec sa taille réelle. C'est la matière première : sans échelle juste, une matière montée dessus rend du papier peint.",
  matiere: "Une matière montée, prête à poser sur un objet. Uniforme (métal, verre) ou à grain (cartes photographiées).",
  terrain: "Un sol : son étendue, son relief, sa matière. Ce sur quoi une scène repose.",
  objet: "Un objet manufacturé, mesuré à ses vraies cotes, avec sa matière.",
  architecture: "Un bâtiment ou une partie de bâtiment.",
  mobilier_urbain: "Une pièce de mobilier de rue — banc, lampadaire, borne.",
  mobilier_interieur: "Une pièce de mobilier d'intérieur.",
  humain: "Le corps et ce qui le couvre : peau, cheveux, œil, pilosité.",
  vegetation: "Un végétal ou une de ses matières — écorce, feuillage.",
  vehicule: "Un véhicule.",
  ciel: "Un environnement HDR. Ce qui éclaire la scène ET ce qui s'y reflète — sur un métal poli, c'est 90 % du réalisme.",
  climat: "Le milieu, la météo, et l'état qui en découle. Un état ne réécrit jamais une cote : il pose un coefficient.",
  studio: "Un éclairage et un cadrage — comment la pièce est montrée.",
  mouvement: "Une feuille de temps : ce qui bouge, à quelle vitesse, dans quel sens.",
  palette: "Une palette de couleurs.",
  police: "Une police de caractères.",
  transition: "Une transition de page ou d'élément.",
  loader: "Un écran d'attente.",
  animation: "Une animation d'interface.",
  composant_web: "Un composant d'interface relevé, avec sa fiche et son classement.",
  shader: "Un shader fragment pour le web.",
  inspiration: "Une référence relevée sur un site existant.",
  eclairage: "La lumière et l'ombre d'une scène. La direction du soleil et la dureté de l'ombre sont MESURÉES dans le ciel choisi, jamais posées à la main : une ombre qui ne tombe pas dans le sens du ciel réfléchi se voit tout de suite.",
  usure: "Ce qui montre qu'un objet appartient à son sol — la trace, la salissure, le creux au pied. Sans elle un objet flotte, même parfaitement éclairé.",
  scene: "L'assemblage d'une scène 3D pour un projet donné. Dépend du brief : ne se range pas.",
  livrable: "Le site livré. C'est le projet lui-même.",
};
/** Recompose le graphe et réécrit ses artefacts. Il ÉCRIT : sur appel seulement. */
async function refaire() {
  /* LE CONTRAT SE CHARGE ICI, pas au niveau du module. Un `await import` en
     tête faisait deux choses à la simple lecture du fichier : exécuter un
     autre module, et JETER si `packages/contracts/dist/` n'était pas encore
     construit — un import qui échoue avant même qu'on ait demandé quoi que
     ce soit. */
  const { origineDe, LIEES_AU_BRIEF, ENTREES_PAR_FAMILLE } =
    await import(join(RACINE, "packages/contracts/dist/noeud.js"));

  const noeuds = [], liens = [];
  const idsParFamille = {};

  for (const [boite, famille] of Object.entries(FAMILLE_DE)) {
    const dir = join(BIB, boite);
    idsParFamille[famille] ??= [];
    if (!existsSync(dir)) continue;
    const pieces = readdirSync(dir, { withFileTypes: true })
      .filter(x => !ADMIN.has(x.name))
      .filter(x => x.isDirectory() || [".json", ".glb", ".exr", ".hdr"].includes(extname(x.name).toLowerCase()))
      .map(x => x.name).sort();

    for (const p of pieces) {
      const nom = p.replace(/\.(json|glb|exr|hdr)$/i, "");
      const id = `${famille}/${nom}`;
      const dependDuBrief = LIEES_AU_BRIEF.has(famille);
      /* Les variantes viennent de la PROVENANCE, jamais d'un parcours du disque :
         c'est l'outil de rapatriement qui les a mesurées, et les recompter ici
         les ferait diverger au premier écart. */
      let variantes = null, J = null;
      const prov = join(RACINE, "bibliotheques", boite, p, "provenance.json");
      if (existsSync(prov)) {
        try {
          J = JSON.parse(readFileSync(prov, "utf8"));
          if (J.variantes) variantes = {
            full: J.variantes.full ?? null, low: J.variantes.low ?? null,
            gain_low_sur_full: J.gain_low_sur_full ?? null,
            masse_geometrique: !!J.masse_geometrique,
          };
        } catch { /* provenance illisible : on ne devine pas */ }
      }
      noeuds.push({
        id, nom, famille,
        /* « Fait ici » se lit dans la provenance, pas dans le chemin. */
        origine: origineDe(true, dependDuBrief, J?.source === "atlas"),
        entrees: ENTREES_PAR_FAMILLE[famille] ?? [],
        chemin: join("bibliotheques", boite, p),
        raison: "la pièce est sur le disque, dans sa bibliothèque",
        variantes,
      });
      idsParFamille[famille].push(id);
    }

    /* Une boîte VIDE porte quand même un nœud : celui qui dit ce qu'il faudra
       générer. Sans lui, une bibliothèque vide disparaîtrait du graphe, et on
       croirait qu'il n'y a rien à faire. */
    if (pieces.length === 0) {
      const dependDuBrief = LIEES_AU_BRIEF.has(famille);
      const id = `${famille}/*`;
      noeuds.push({
        id, nom: `toute pièce de ${famille}`, famille,
        origine: origineDe(false, dependDuBrief),
        entrees: ENTREES_PAR_FAMILLE[famille] ?? [],
        chemin: null,
        raison: dependDuBrief
          ? "dépend du brief : jamais rangeable"
          : "la bibliothèque est vide — à générer, puis à ranger pour la fois suivante",
      });
      idsParFamille[famille].push(id);
    }
  }

  for (const [famille, raison] of Object.entries(SANS_BOITE)) {
    const id = `${famille}/*`;
    noeuds.push({
      id, nom: `toute ${famille}`, famille,
      origine: origineDe(false, true),
      entrees: ENTREES_PAR_FAMILLE[famille] ?? [],
      chemin: null, raison,
    });
    idsParFamille[famille] = [id];
  }

  /* Les liens : de chaque famille consommée vers la famille consommatrice. */
  for (const n of noeuds)
    for (const f of n.entrees)
      for (const source of (idsParFamille[f] ?? []))
        liens.push({ de: source, vers: n.id });

  /* ── À QUOI SERT CHAQUE NŒUD, ÉCRIT À SA RACINE ────────────────────────────
     Un nœud dont on ne sait plus à quoi il sert n'est pas rangé, il est stocké.
     Chaque pièce qui est un DOSSIER reçoit donc un `noeud.md` : ce qu'elle est,
     d'où elle vient, ce qu'elle consomme, ce qu'elle nourrit. Le fichier est un
     artefact — il se refabrique et n'a pas à être tenu à jour à la main. */
  const nourrit = {};
  for (const n of noeuds)
    for (const f of n.entrees) (nourrit[f] ??= new Set()).add(n.famille);

  let ecrits = 0;
  /**
   * La provenance, en tableau lisible.
   *
   * La version d'avant vidait le JSON brut et le COUPAIT à 700 caractères. La
   * coupe tombait au milieu d'une chaîne — les fiches affichaient `"fichiers": [
   * "s` puis la clôture du bloc, c'est-à-dire du JSON invalide donné à lire à un
   * humain. Une fiche est faite pour être LUE : on nomme les champs en français,
   * on ne coupe rien, et le commentaire vit dans une phrase, pas dans une clé.
   */
  function ficheProvenance(J) {
    const l = [];
    const met = (t, v) => { if (v !== null && v !== undefined && v !== "") l.push(`| ${t} | ${v} |`); };
    met("source", J.source_nom ?? J.source);
    met("licence", J.licence);
    met("page", (J.page ?? J.source_url) ? `<${J.page ?? J.source_url}>` : null);
    /* `auteurs` est le CRÉDIT des pièces CC0 — celui de la personne qui a
       photographié ou modélisé. Le premier tableau l'oubliait : on affichait la
       licence d'une pièce sans jamais nommer qui l'avait faite. */
    met("auteur", J.auteur ?? (J.auteurs ? Object.keys(J.auteurs).join(", ") : null));
    met("date", J.le);
    met("type", J.type);
    /* La cote réelle : c'est la règle d'admission du dépôt, pas un détail. */
    met("taille réelle", Array.isArray(J.dimensions_mm)
      ? J.dimensions_mm.map(x => (x / 1000).toFixed(2).replace(".", ",") + " m").join(" × ")
      : null);
    met("motif", J.motif_mm ? `${J.motif_mm} mm` : null);
    met("catégories", J.categories?.length ? J.categories.join(", ") : null);
    met("mots-clefs", J.tags?.length ? J.tags.join(", ") : null);
    met("généré par", J.generateur ? `\`${J.generateur}\`` : null);
    met("matière", J.matiere);
    met("d'où vient la matière", J.matiere_source);
    met("œuvre dérivée de", J.oeuvre_derivee_de);
    if (J.reproductible !== undefined)
      met("reproductible", J.reproductible ? "oui — relancer le script rend la même pièce"
                                           : "**non** — voir la note ci-dessous");
    /* Rechargeable : mesuré par `outils/empreintes.mjs`, qui apparie chaque
       fichier du disque à la source PAR SON MD5. Une fiche qui donne une
       licence sans dire si la pièce se récupère ne dit que la moitié. */
    if (J.empreintes) {
      const n = J.empreintes.length, ok = J.empreintes.filter(f => f.url).length;
      met("rechargeable", ok === n
        ? `oui — les ${n} fichiers appariés à la source par leur empreinte`
        : `**partiellement** — ${ok} fichiers sur ${n} ; les autres diffèrent de la source`);
    }
    met("empreinte", J.md5 ? `\`${J.md5}\`` : null);
    return "\n## Provenance\n\n| | |\n| --- | --- |\n" + l.join("\n") + "\n"
         + (J.comment ? `\n${J.comment}\n` : "");
  }

  for (const n of noeuds) {
    if (!n.chemin) continue;
    const abs = join(RACINE, n.chemin);
    if (!existsSync(abs) || !statSync(abs).isDirectory()) continue;
    const nourri = [...(nourrit[n.famille] ?? [])].sort();
    const consomme = n.entrees.length ? n.entrees.join(", ") : "rien — c'est une pièce de base";
    let provenance = null;
    const prov = join(abs, "provenance.json");
    if (existsSync(prov)) { try { provenance = JSON.parse(readFileSync(prov, "utf8")); } catch {} }
    const contenu = readdirSync(abs).filter(x => x !== "noeud.md").sort();

    writeFileSync(join(abs, "noeud.md"),
`# ${n.nom}

**Nœud \`${n.id}\`** — famille \`${n.famille}\`.

## À quoi il sert

${DESCRIPTIONS[n.famille] ?? "Pièce de la bibliothèque."}

## Sa place dans le graphe

| | |
| --- | --- |
| origine | **${{catalogue: "① au catalogue — rien à générer", generer_reutilisable: "② à générer, puis rangeable", generer_unique: "③ à générer, jamais rangeable"}[n.origine]}** |
| pourquoi | ${n.raison} |
| il consomme | ${consomme} |
| il nourrit | ${nourri.length ? nourri.join(", ") : "rien pour l'instant"} |
| il vit dans | \`${n.chemin}\` |

## Ses deux versions

${n.variantes
  ? `| variante | résolution | poids | fichiers |\n| --- | --- | ---: | ---: |\n`
    + `| \`full\` — rendu Blender | ${n.variantes.full?.resolution ?? "—"} | ${n.variantes.full?.poids ?? "—"} | ${n.variantes.full?.fichiers ?? "—"} |\n`
    + `| \`low\` — navigateur | ${n.variantes.low?.resolution ?? "—"} | ${n.variantes.low?.poids ?? "—"} | ${n.variantes.low?.fichiers ?? "—"} |\n`
    + (n.variantes.gain_low_sur_full ? `\nLe \`low\` pèse **${n.variantes.gain_low_sur_full} de moins** que le \`full\`.\n` : "")
    + (n.variantes.masse_geometrique
        ? `\n> ⚠ **Le \`low\` n'allège presque pas.** La masse de cette pièce est\n`
          + `> **géométrique**, pas texturale : baisser la résolution des cartes n'y\n`
          + `> peut rien. Un vrai allègement demande une décimation sous Blender.\n`
        : "")
  : "_Cette pièce ne porte pas de variantes._"}

## Ce qu'il contient

${contenu.map(c => "- `" + c + "`").join("\n") || "_vide_"}
${provenance ? ficheProvenance(provenance) : ""}
---
_Artefact — refait par \`node outils/noeuds.mjs\`._
`, "utf8");
    ecrits++;
  }

  const parOrigine = (o) => noeuds.filter(n => n.origine === o);
  const compte = Object.fromEntries(["catalogue", "generer_reutilisable", "generer_unique"]
    .map(o => [o, parOrigine(o).length]));

  writeFileSync(join(BIB, "noeuds.json"), JSON.stringify({
    _: "ARTEFACT — refait par `node outils/noeuds.mjs`. Ne pas éditer à la main.",
    regle: "origineDe(existe, dependDuBrief) — packages/contracts/src/noeud.ts",
    noeuds: noeuds.length, liens: liens.length, par_origine: compte,
    avec_deux_variantes: noeuds.filter(n => n.variantes?.full && n.variantes?.low).length,
    masse_geometrique: noeuds.filter(n => n.variantes?.masse_geometrique).map(n => n.id),
    familles: Object.fromEntries(Object.entries(idsParFamille).map(([f, l]) => [f, l.length])),
    detail: noeuds, arcs: liens,
  }, null, 2) + "\n", "utf8");

  const tableau = (o) => {
    const l = parOrigine(o);
    const parFam = {};
    for (const n of l) (parFam[n.famille] ??= []).push(n);
    return Object.entries(parFam).sort()
      .map(([f, ns]) => `| \`${f}\` | ${ns.length} | ${ns.slice(0, 6).map(n => n.nom).join(", ")}${ns.length > 6 ? ` … +${ns.length - 6}` : ""} |`)
      .join("\n");
  };

  writeFileSync(join(BIB, "NOEUDS.md"),
`# Le système nodal d'Atlas

**${noeuds.length} nœuds, ${liens.length} arcs.** Artefact — refait par
\`node outils/noeuds.mjs\`.

Tout ce qui entre dans une scène est un **nœud** : une texture, une matière, un
objet, un climat, une feuille de temps. Chaque nœud déclare ce dont il a besoin,
et porte une **origine** qui n'est pas choisie mais **appliquée** par
\`origineDe(existe, dependDuBrief)\` — la règle vit dans
\`packages/contracts/src/noeud.ts\`.

## La question qui tranche

**La pièce dépend-elle du brief ?**

- **oui** → elle est *unique*. La ranger produirait un catalogue de pièces que
  personne ne peut réutiliser, et qui ferait croire qu'on avance alors qu'on
  l'encombre.
- **non** → elle est *réutilisable*. Ne pas la ranger revient à la regénérer à
  chaque projet — c'est-à-dire à la payer chaque fois.

## ① Au catalogue — rien à générer · **${compte.catalogue} nœuds**

La pièce est sur le disque, dans sa bibliothèque.

| famille | nœuds | quelques-uns |
| --- | ---: | --- |
${tableau("catalogue")}

## ② À générer, puis rangeable — **${compte.generer_reutilisable} nœuds**

La pièce n'existe pas encore, mais elle est générique : une chaise, un terrain,
un lampadaire. On la génère **une fois**, elle entre en bibliothèque, et le
projet suivant la trouve en ①.

| famille | nœuds | ce qu'il faudra générer |
| --- | ---: | --- |
${tableau("generer_reutilisable")}

## ③ À générer, jamais rangeable — **${compte.generer_unique} nœuds**

La pièce dépend du brief. Elle se génère à chaque projet et ne se range nulle
part — non par négligence, mais parce qu'elle ne servirait à personne d'autre.

| famille | nœuds | pourquoi |
| --- | ---: | --- |
${tableau("generer_unique")}

## Le graphe

Les arcs vont de ce qui est consommé vers ce qui consomme. Une texture nourrit
une matière ; une matière nourrit un objet, un terrain, un bâtiment ; tout cela
nourrit une scène ; la scène nourrit le livrable.

\`\`\`
texture → matiere → { terrain, objet, architecture, mobilier, humain, vegetation, vehicule }
                                        ↘
ciel → studio ─────────────────────────→ scene → livrable
climat ────────────────────────────────↗          ↑
mouvement → { animation, transition } ─────────────┤
{ palette, police } → composant_web ───────────────┤
shader ────────────────────────────────────────────┘
\`\`\`
`, "utf8");

  console.log(`${noeuds.length} nœuds, ${liens.length} arcs, ${ecrits} fiches \`noeud.md\` écrites`);
  for (const [o, n] of Object.entries(compte)) console.log(`  ${o.padEnd(22)} ${String(n).padStart(4)}`);
  console.log("→ bibliotheques/noeuds.json et bibliotheques/NOEUDS.md");
}

/* Lire ce fichier réécrivait `noeuds.json`, `NOEUDS.md` ET un `noeud.md` à la
   racine de CHAQUE pièce des bibliothèques — plusieurs centaines de fichiers
   posés par un simple import. Le 17/08/2026, `imports.test.mjs` importait les
   trente outils pour trouver ceux qui agissent à la lecture : c'est ce
   contrôle-là qui déclenchait les écritures qu'il cherchait à interdire. Le
   graphe ne se recompose donc plus qu'à l'APPEL. */
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await refaire();
