// « Le savais-tu ? » — rattaché à l'ÉTAPE travaillée, jamais hors-sujet.
// Règle d'écriture : chaque fait prolonge la notion que l'enfant vient d'exercer,
// et si le fait va plus loin, il explique le lien. Pas de fait pertinent → pas de fait.

const KILO = [
  "Tu viens de jongler avec les milliers : un million, c'est mille milliers — et un milliard, mille millions. Mille fois mille fois mille !",
  "Après les milliers viennent les millions : il te faudrait presque deux semaines pour compter jusqu'à un million à voix haute.",
];

const FIGURES = [
  "Aucun visage n'est parfaitement symétrique — pas même le tien ! Les abeilles, elles, construisent des hexagones presque parfaits.",
  "Le carré et le cercle sont si parfaits qu'on ne les trouve presque jamais dans la nature — ce sont des inventions de l'esprit humain.",
];

const MESURE = [
  "Le mètre a été inventé à la Révolution française : un quarante-millionième du tour de la Terre, pour que tout le monde mesure pareil.",
  "Avant le mètre, chaque ville avait SA mesure : le pied de Genève ne valait pas le pied de Berne — imagine les disputes au marché !",
];

export const STEP_FACTS: Record<number, string[]> = {
  // Maths — livrets et calculs
  4955: [
    "Les livrets existaient déjà à Babylone il y a 4'000 ans, gravés sur des tablettes d'argile — tu révises comme un écolier babylonien.",
    "9 × 9 = 81, le plus grand livret : au-delà, même les champions posent le calcul ou décomposent.",
  ],
  4954: [
    "« Soustraire » veut dire « tirer par en dessous » en latin. Les Romains calculaient sans le zéro — bien plus dur !",
  ],
  4952: [
    "Poser les calculs en colonnes nous vient d'Inde, comme nos chiffres — les « chiffres arabes » sont en réalité nés en Inde.",
  ],
  4949: [
    "Le calcul de tête a ses champions du monde : certains multiplient deux nombres de 8 chiffres en quelques secondes — par décomposition, comme toi.",
  ],
  4950: [
    "Changer l'ordre d'une addition sans changer le résultat a un nom savant : la commutativité. Tu viens de l'utiliser !",
  ],
  // Maths — nombres et milliers
  4890: KILO,
  4895: KILO,
  4902: KILO,
  4904: [
    "On compte par paquets de 10… sûrement parce qu'on a 10 doigts. Les Mayas comptaient par 20 : doigts ET orteils !",
  ],
  4906: [
    "On compte par paquets de 10… sûrement parce qu'on a 10 doigts. Les Mayas comptaient par 20 : doigts ET orteils !",
  ],
  4912: [
    "« Septante » et « nonante » sont plus anciens que « soixante-dix » et « quatre-vingt-dix » — la Suisse romande a gardé la version logique !",
  ],
  4896: [
    "Tu viens de voir que les nombres ne s'arrêtent jamais : le plus grand nombre nommé est le « googol », un 1 suivi de 100 zéros.",
  ],
  4898: [
    "Ranger des nombres du plus petit au plus grand, c'est ce que fait un ordinateur des milliards de fois par seconde pour trier des listes.",
  ],
  4917: [
    "Les chiffres romains servent encore : les siècles (XXIe), les horloges, les suites de films… mais essaie de poser une multiplication avec !",
  ],
  4943: [
    "Les nombres qui ne sont multiples de personne (à part 1 et eux-mêmes) s'appellent les nombres premiers — il y en a une infinité, et personne ne connaît leur motif.",
  ],
  4945: [
    "Les nombres qui ne sont divisibles par personne (à part 1 et eux-mêmes) s'appellent les nombres premiers — les codes secrets d'internet reposent sur eux.",
  ],
  4937: [
    "Les toutes premières écritures de l'humanité, en Mésopotamie, sont… des comptes de marchands : des problèmes comme celui-ci, sur de l'argile.",
  ],
  4939: [
    "Multiplier pour compter des paquets, c'est le réflexe des caissiers, des maçons, des cuisiniers — le calcul le plus utilisé au travail.",
  ],
  4935: [
    "Les tableaux de valeurs sont partout : classements sportifs, horaires de bus, météo — savoir les lire, c'est décoder le monde.",
  ],
  // Maths — géométrie et mesures
  4803: FIGURES,
  4827: FIGURES,
  4805: FIGURES,
  4810: [
    "Les rails d'un train sont parallèles avec 1'435 mm d'écart presque partout dans le monde — l'écartement des premiers trains anglais.",
  ],
  4812: [
    "Des dés cubiques ont été retrouvés dans des tombes d'Égypte ancienne : on jouait déjà avec des cubes il y a 4'000 ans.",
  ],
  4814: [
    "Des dés cubiques ont été retrouvés dans des tombes d'Égypte ancienne : on jouait déjà avec des cubes il y a 4'000 ans.",
  ],
  4986: MESURE,
  4981: MESURE,
  4975: MESURE,
  4976: [
    "Estimer avant de mesurer, c'est le réflexe des pros : les charpentiers disent « environ 2 mètres » avant de sortir le mètre pliant.",
  ],
  4835: [
    "Les codes de déplacement comme tes flèches, c'est exactement ainsi qu'on programme les robots — tu viens d'écrire un mini-programme.",
  ],
  4837: [
    "Les codes de déplacement comme tes flèches, c'est exactement ainsi qu'on programme les robots — tu viens d'écrire un mini-programme.",
  ],
  // Français
  4427: [
    "« Être » et « avoir », que tu viens de conjuguer, sont les verbes les plus utilisés du français — et les plus irréguliers, à force de servir depuis 2'000 ans.",
  ],
  4425: [
    "« Être » et « avoir », que tu viens de conjuguer, sont les verbes les plus utilisés du français — et les plus irréguliers, à force de servir depuis 2'000 ans.",
  ],
  4367: [
    "« Grammaire » et « grimoire » étaient le même mot au Moyen Âge : savoir nommer les mots passait pour de la magie !",
  ],
  4350: [
    "Dans « Le chat dort », le plus court sujet possible tient en un mot — le record inverse existe : des sujets de plus de vingt mots dans les romans !",
  ],
  4372: [
    "Le point d'interrogation est né d'un « q » penché, abréviation de « quaestio » (question, en latin).",
  ],
  4400: [
    "« Son » et « sont » sonnaient différemment au Moyen Âge : l'écriture a gardé la trace de l'ancienne prononciation — voilà pourquoi les homophones existent.",
  ],
  4399: [
    "« Son » et « sont » sonnaient différemment au Moyen Âge : l'écriture a gardé la trace de l'ancienne prononciation — voilà pourquoi les homophones existent.",
  ],
  4390: [
    "L'accord sujet-verbe que tu viens de faire n'existe presque pas en anglais : « they play, she plays » — une lettre, pas plus. Le français adore les accords !",
  ],
  4386: [
    "Le pluriel en -aux (chevaux, journaux) vient d'une vieille prononciation où le « l » se changeait en « u » — les scribes l'ont notée, et elle est restée.",
  ],
  677: [
    "Les majuscules aux noms propres sont une invention des copistes du Moyen Âge, pour retrouver les noms importants d'un coup d'œil dans les manuscrits.",
  ],
  390: [
    "Ton cerveau ne lit pas lettre par lettre : il photographie les mots entiers — c'est pour ça que tu lis de plus en plus vite.",
  ],
  3865: [
    "Repérer l'ordre des événements, c'est le travail des scénaristes : certains films racontent exprès l'histoire dans le désordre pour te faire enquêter.",
  ],
  3863: [
    "Presque tous les contes du monde suivent le même schéma que tu viens de repérer — des chercheurs l'ont vérifié sur des centaines d'histoires.",
  ],
  // Sciences
  2179: [
    "Tes cinq sens ne travaillent jamais seuls : sans l'odorat, une pomme et une pomme de terre crues ont presque le même goût. Essaie en te bouchant le nez !",
  ],
  5111: [
    "Ton cœur, que tu viens de situer, bat environ 100'000 fois par jour — sans jamais prendre de pause.",
  ],
  2180: [
    "Ton estomac produit un acide si fort qu'il pourrait dissoudre du métal — sa paroi se renouvelle sans arrêt pour résister.",
  ],
  2182: [
    "Tu respires environ 20'000 fois par jour — et tu viens d'expliquer où va tout cet air.",
  ],
  2202: [
    "Les racines dont tu viens de parler communiquent entre arbres voisins, aidées par des champignons — une vraie messagerie souterraine.",
  ],
  2205: [
    "Dans la chrysalide, la chenille se liquéfie presque entièrement avant de se reconstruire en papillon — la transformation la plus radicale du monde animal.",
  ],
  2209: [
    "Pendant l'hibernation, le cœur de la marmotte tombe à 3 ou 4 battements par minute — contre environ 90 pour le tien.",
  ],
  2203: [
    "Les dents racontent le régime alimentaire : plates pour brouter, pointues pour chasser — les paléontologues font parler les fossiles comme ça.",
  ],
  5150: [
    "Une seule prairie sauvage peut abriter plus de 1'000 espèces — c'est cette variété-là, la biodiversité que tu viens de protéger en quiz.",
  ],
  5040: [
    "Galilée bricolait déjà un ancêtre du thermomètre il y a 400 ans — il s'appelait le « thermoscope ».",
  ],
  5034: [
    "« Je pense que… » : toutes les grandes découvertes ont commencé par une hypothèse comme la tienne — puis par une expérience pour la vérifier.",
  ],
  2163: [
    "« Catastrophe » veut dire « renversement » en grec — et les inondations dont tu parles ont façonné le Rhône et ses digues à Genève.",
  ],
  // Histoire-Géo
  5253: [
    "La Préhistoire que tu viens de ranger a duré des millions d'années ; l'histoire écrite, à peine 5'000 ans — une miette à côté.",
  ],
  31: [
    "L'écriture, qui marque le début de l'histoire, est née pour… compter les sacs de grain et les moutons.",
  ],
  5259: [
    "Un millénaire, c'est l'âge de la cathédrale de Genève — elle a vu passer dix siècles entiers.",
  ],
  3615: [
    "La légende de Guillaume Tell n'apparaît dans les textes que 200 ans après les faits supposés — c'est exactement ce qui la rend suspecte aux historiens.",
  ],
  39: [
    "Des chaussures romaines en cuir ont survécu 2'000 ans dans la boue — la boue conserve mieux que l'air. Voilà les « traces » dont tu parles.",
  ],
  3616: [
    "Comparer les sources, comme tu viens de le faire, est le geste de base du métier d'historien — et du bon lecteur d'internet.",
  ],
  3558: [
    "La plus petite commune de Suisse compte moins de 30 habitants ; la plus grande, Zurich, plus de 400'000 — toutes ont une mairie, comme la tienne.",
  ],
  5246: [
    "Un humain peut survivre des semaines sans loisirs… mais 3 jours à peine sans boire : voilà la différence entre besoin vital et secondaire.",
  ],
  3571: [
    "Genève est née exactement là où le Rhône sort du Léman — l'eau décidait de l'emplacement des villes, comme dans ta question.",
  ],
  3549: [
    "Les tout premiers hôpitaux de nos régions étaient tenus par des moines, au bord des routes — déjà des « lieux qui répondent aux besoins ».",
  ],
};

/** Un fait lié à l'étape travaillée — jamais hors-sujet, sinon rien. */
export function pickFact(stepId: number, shown: Set<string>): string | null {
  const pool = (STEP_FACTS[stepId] ?? []).filter((f) => !shown.has(f));
  if (pool.length === 0) return null;
  return pool[Math.floor(Math.random() * pool.length)];
}
