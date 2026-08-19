/**
 * ═══════════════════════════════════════════════════════════════════════
 * LE NŒUD — et les trois origines, qui ne se devinent pas.
 * ═══════════════════════════════════════════════════════════════════════
 *
 * Tout ce qui entre dans une scène est un NŒUD : une texture, une matière, un
 * objet, un bâtiment, un climat, une feuille de temps. Un nœud a des entrées
 * (ce dont il a besoin) et une sortie (ce qu'il rend disponible).
 *
 * ═══ TROIS ORIGINES, ET UNE SEULE QUESTION LES SÉPARE ═══
 *
 *   catalogue              la pièce EXISTE déjà dans une bibliothèque.
 *                          Rien à générer, rien à payer.
 *
 *   generer_reutilisable   la pièce n'existe pas, mais elle est GÉNÉRIQUE :
 *                          une chaise, une écorce de chêne, un laiton brossé.
 *                          On la génère une fois, elle entre en bibliothèque,
 *                          et le projet suivant la trouve au catalogue.
 *
 *   generer_unique         la pièce n'existe pas et n'existera JAMAIS en
 *                          bibliothèque : le logo du client, son immeuble, la
 *                          disposition de sa scène, sa charte. Elle se génère
 *                          à chaque projet et ne se range nulle part.
 *
 * LA QUESTION QUI TRANCHE, et c'est la seule : **la pièce dépend-elle du
 * brief ?** Si oui, elle est unique — la ranger en bibliothèque produirait un
 * catalogue de pièces que personne ne peut réutiliser, et qui ferait croire
 * qu'on avance alors qu'on l'encombre. Si non, elle est réutilisable, et ne pas
 * la ranger revient à la regénérer à chaque fois — c'est-à-dire à la payer
 * chaque fois.
 *
 * On ne classe donc pas au jugé : `origineDe` applique la règle.
 */

export const ORIGINES = ["catalogue", "generer_reutilisable", "generer_unique"] as const;
export type Origine = (typeof ORIGINES)[number];

/** Les familles de nœuds — une par bibliothèque, plus celles qui n'en ont pas. */
export const FAMILLES = [
  "texture", "matiere", "terrain", "objet", "architecture",
  "mobilier_urbain", "mobilier_interieur", "humain", "vegetation",
  "vehicule", "ciel", "climat", "studio", "mouvement",
  "palette", "police", "transition", "loader", "animation",
  "composant_web", "shader", "inspiration",
  "scene", "livrable",
  /* DEUX FAMILLES QUI NE SE RANGENT PAS, et qui manquaient.
     `eclairage` : la direction du soleil et la dureté de l'ombre sont MESURÉES
     dans le ciel choisi pour cette scène-là. Un autre ciel, un autre soleil —
     rien à cataloguer. Elles n'étaient nulle part, et une chose qui n'est dans
     aucun nœud n'est dans aucun plan.
     `usure` : la trace qu'un objet laisse sur son sol dépend de CE couple —
     quelle pièce, quel sol, depuis combien de temps. La même borne sur du
     gazon ne marque pas comme sur de l'asphalte. */
  "eclairage", "usure",
] as const;
export type Famille = (typeof FAMILLES)[number];

/**
 * LES VARIANTES D'UNE PIÈCE — toujours deux, et c'est une règle du dépôt.
 *
 * `full` sert au rendu Blender, `low` sert au navigateur. Ne garder qu'une
 * version force à trancher une fois pour toutes, et à retélécharger le jour où
 * l'autre besoin se présente. Le système nodal existe précisément pour qu'un
 * projet CHOISISSE au moment où il en a besoin.
 *
 * `masse_geometrique` dit ce qu'aucun poids ne dit tout seul : quand le `low`
 * ne pèse presque rien de moins que le `full`, c'est que la masse de la pièce
 * est dans sa géométrie et non dans ses cartes. Baisser la résolution n'y peut
 * rien ; il faut décimer. Une pièce qui porte ce drapeau ne doit pas être
 * envoyée au navigateur en croyant qu'elle est légère.
 */
export interface Variante {
  readonly resolution: string;
  readonly octets: number;
  readonly poids: string;
  readonly fichiers: number;
}

export interface Variantes {
  readonly full: Variante | null;
  readonly low: Variante | null;
  readonly gain_low_sur_full: string | null;
  readonly masse_geometrique: boolean;
}

export interface Noeud {
  readonly id: string;
  readonly nom: string;
  readonly famille: Famille;
  readonly origine: Origine;
  /** Les identifiants dont ce nœud a besoin pour exister. */
  readonly entrees: readonly string[];
  /** Où la pièce vit, quand elle existe. `null` tant qu'elle est à générer. */
  readonly chemin: string | null;
  /** Pourquoi cette origine — jamais un jugement muet. */
  readonly raison: string;
  /** Les deux résolutions, quand la pièce en porte. `null` sinon. */
  readonly variantes?: Variantes | null;
}

/** Quelle variante servir, selon la destination. */
export function varianteFor(cible: "blender" | "navigateur", v: Variantes | null | undefined): "full" | "low" | null {
  if (!v) return null;
  if (cible === "blender") return v.full ? "full" : (v.low ? "low" : null);
  /* Pour le navigateur on veut `low` — SAUF si `low` n'allège pas, auquel cas
     le servir donnerait le poids du `full` en croyant faire une économie. On
     rend quand même `low`, mais `masse_geometrique` est là pour que l'appelant
     sache qu'il doit décimer avant de publier. */
  return v.low ? "low" : (v.full ? "full" : null);
}

export interface Lien { readonly de: string; readonly vers: string; }

/**
 * LA RÈGLE, appliquée et non récitée.
 *
 * `existe` vient d'un parcours du disque. `dependDuBrief` vient de la famille
 * du nœud : une scène, une charte, un livrable dépendent du brief par nature ;
 * une écorce de chêne n'en dépend pas, quel que soit le client.
 */
export function origineDe(
  existe: boolean,
  dependDuBrief: boolean,
  faitIci = false,
): Origine {
  if (dependDuBrief) return "generer_unique";
  /* FAIT ICI ≠ TROUVÉ AILLEURS, même une fois sur le disque.
     ═══════════════════════════════════════════════════════════════════════
     La règle disait « si c'est sur le disque, c'est du catalogue ». Elle
     confondait donc deux choses que Sacha distingue depuis le début : ce qu'on
     TÉLÉCHARGE d'un catalogue existant, et ce qu'on GÉNÈRE une fois avant de le
     cataloguer. Mesuré : `sphere-or` était classée « catalogue » alors que
     `sphere_or.py` la fabrique — la borne d'incendie, elle, vient bien de Poly
     Haven et reste au catalogue.
     La différence n'est pas d'emplacement, elle est d'ORIGINE — et elle est
     lisible : la provenance dit `source: "atlas"` pour ce qui sort d'ici. Une
     pièce qu'on a faite garde son générateur, se refait, se décline ; une pièce
     téléchargée ne se refait pas, elle se retélécharge.
     `existe` seul ne pouvait pas les séparer : la donnée manquait à la règle. */
  if (existe && faitIci) return "generer_reutilisable";
  return existe ? "catalogue" : "generer_reutilisable";
}

/** Les familles qui dépendent du brief PAR NATURE. */
export const LIEES_AU_BRIEF: ReadonlySet<Famille> = new Set<Famille>([
  "scene", "livrable",
  /* L'éclairage et l'usure se calculent POUR CETTE SCÈNE-LÀ. Le soleil est
     mesuré dans le ciel choisi ; la trace au sol dépend du couple objet-sol.
     Les ranger au catalogue reviendrait à cataloguer une ombre — elle n'a de
     sens que là où elle tombe. */
  "eclairage", "usure",
]);

/** Ce que chaque famille consomme. Un objet sans matière n'est pas un objet. */
export const ENTREES_PAR_FAMILLE: Readonly<Record<Famille, readonly Famille[]>> = {
  texture: [],
  matiere: ["texture"],
  terrain: ["matiere"],
  objet: ["matiere"],
  architecture: ["matiere", "objet"],
  mobilier_urbain: ["matiere"],
  mobilier_interieur: ["matiere"],
  humain: ["matiere"],
  vegetation: ["matiere"],
  vehicule: ["matiere"],
  ciel: [],
  climat: [],
  studio: ["ciel"],
  mouvement: [],
  palette: [],
  police: [],
  transition: ["mouvement"],
  loader: ["animation"],
  animation: ["mouvement"],
  composant_web: ["palette", "police", "animation"],
  shader: [],
  inspiration: [],
  /* L'éclairage consomme le CIEL — c'est de lui qu'on tire la direction du
     soleil — et la scène, qui dit ce qu'il faut cadrer. */
  eclairage: ["ciel", "scene"],
  /* L'usure naît d'une rencontre : une pièce posée sur un terrain, et la
     matière qui fera la trace. */
  usure: ["terrain", "matiere", "scene"],
  scene: ["terrain", "objet", "architecture", "mobilier_urbain",
          "mobilier_interieur", "humain", "vegetation", "vehicule",
          "ciel", "climat", "studio"],
  livrable: ["scene", "composant_web", "transition", "loader", "shader"],
};
