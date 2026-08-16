// Mapping question -> étape officielle du PER (id de progression d'apprentissage,
// tel que fourni par l'API per.ciip.ch). Vérifié manuellement contre les textes officiels.
// Certaines questions rédigées initialement "6P" relèvent en réalité d'étapes 7e-8e
// (conversions km↔m / kg↔g : 4989, périmètres : 4983) — le moteur les filtre par année.

export const QUESTION_STEP: Record<string, number> = {
  // math-nombres (MSN 22)
  n1: 4912, // passage du mot-nombre à son écriture chiffrée
  n2: 4898, // comparaison, classement, encadrement, intercalation
  n3: 4910, // décomposition en unités, dizaines, centaines, milliers
  n4: 4895, // comptage de 10 en 10, de 100 en 100…
  n5: 4902, // production d'un nombre plus petit/grand d'une unité…
  n6: 4898,
  n7: 4912,

  // math-operations (MSN 23)
  o1: 4955, // répertoire multiplicatif 0x0 à 9x9
  o2: 4955,
  o3: 4950, // propriétés addition/multiplication, décomposition
  o4: 4949, // calcul réfléchi
  o5: 4945, // critères de divisibilité 2, 5, 10, 100
  o6: 4937, // problèmes additifs et soustractifs
  o7: 4939, // problèmes multiplicatifs et divisifs

  // math-geometrie (MSN 21)
  g1: 4803, // reconnaissance de figures planes selon leurs propriétés
  g2: 4827, // repérage des axes de symétrie
  g3: 4803,
  g4: 4810, // parallélisme et perpendicularité
  g5: 4810,
  g6: 4827,
  g7: 4835, // itinéraires / repérage dans le plan

  // math-mesures (MSN 24)
  m1: 4986, // unités conventionnelles cm et m (5-6e)
  m2: 4989, // expression d'une grandeur dans différentes unités (7-8e !)
  m3: 4986,
  m4: 4975, // choix d'une unité
  m5: 4983, // calcul de périmètres (7-8e !)
  m6: 4983,
  m7: 4989,

  // fr-comprehension (L1 21)
  c1: 3867, // distinction des univers de fiction / genres
  c2: 3863, // schéma narratif et ses parties (personnages…)
  c3: 3863,
  c4: 390, // questionnement du texte, hypothèses, reformulation
  c5: 3865, // ordre chronologique des événements
  c6: 3865,
  c7: 390,

  // fr-grammaire (L1 26)
  gr1: 4367, // classes : déterminant, nom, verbe, adjectif
  gr2: 4367,
  gr3: 4367,
  gr4: 4372, // types de phrases
  gr5: 4372,
  gr6: 4350, // identification du sujet (GN, pronom, nom)
  gr7: 4350,

  // fr-conjugaison (L1 26) — 6e : présent, imparfait, futur, passé composé
  cj1: 4427,
  cj2: 4427,
  cj3: 4427,
  cj4: 4427,
  cj5: 4427,
  cj6: 4427,
  cj7: 4427,

  // sc-corps (MSN 27)
  co1: 2179, // les 5 sens et leurs organes
  co2: 2179,
  co3: 2180, // alimentation équilibrée
  co4: 2182, // cheminement de l'air / respiration
  co5: 5111, // localisation des organes
  co6: 5109, // comportements bénéfiques / néfastes
  co7: 5111,

  // sc-vivant (MSN 28)
  vi1: 2202, // parties des végétaux
  vi2: 2202,
  vi3: 2203, // morphologie et régime alimentaire
  vi4: 2205, // cycle de vie d'un animal
  vi5: 2209, // stratégies : hibernation, migration
  vi6: 2209,
  vi7: 2204, // relations entre êtres vivants
  vi8: 5150, // biodiversité et intervention humaine

  // sc-demarche (MSN 26)
  de1: 5040, // instruments de mesure
  de2: 5040,
  de3: 5045, // organisation des données (tableau, diagramme)
  de4: 5034, // formulation d'hypothèses
  de5: 2163, // catastrophes naturelles

  // shs-geo (SHS 21)
  ge1: 5246, // besoins vitaux et secondaires
  ge2: 3549, // lieux répondant aux besoins
  ge3: 3558, // vocabulaire : commune, canton, région, pays
  ge4: 3558,
  ge5: 3571, // raisons de la localisation d'un lieu
  ge6: 3579, // échelles (quartier, ville, canton…)
  ge7: 3559, // repères sur un plan
  ge8: 3576, // impacts des activités humaines

  // shs-histoire (SHS 22)
  hi1: 5253, // de la Préhistoire à la fin de l'Antiquité
  hi2: 5259, // vocabulaire : siècle, millénaire…
  hi3: 5259,
  hi4: 31, // situer les événements qui ont contribué au changement
  hi5: 3615, // fiction (mythe, légende) vs réalité
  hi6: 39, // traces et documents du passé
  hi7: 3616, // comparaison de sources

  // fr-orthographe (L1 26)
  or1: 4400, // homophones grammaticaux a/à, son/sont…
  or2: 4399, // utilisation d'homophones grammaticaux
  or3: 4388, // accord déterminant + adjectif avec le nom
  or4: 4390, // accord du verbe avec le sujet : cas simples
  or5: 4386, // accord dans le groupe nominal (genre / nombre)
  or6: 677, // majuscule : nom propre / nom commun
  or7: 4400,
};
