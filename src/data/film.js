// The film: one scene per idea, each diagram explained slowly, with a metaphor. French first, English second.
// Every number comes from the record: src/data/map.js, src/data/results.js, and the research
// repository (docs/results/2026-11-26_TWIN-WORLDS-V2.md, twin-worlds/probe, docs/knowledge/candidats).
// The map of possible answers and the proposed path are design documents, not results: the film says so.
// No emoji: the Otto cells carry the feelings, and every prop is drawn.

export const parts = [
  ['Le projet', 'The project'], ['La méthode', 'The method'], ['Le chemin', 'The path'], ['Ce qu’on a mesuré', 'What we measured'],
  ['Les mondes jumeaux', 'Twin worlds'], ['La carte des possibles', 'The map of possibilities'], ['Où on en est', 'Where we are'],
];

export const scenes = [
  // ---- 1. The project
  { id: 'hook', part: 0, title: ['La grande question', 'The big question'], lines: [
    ['Salut. Moi, c’est Otto. Pour l’instant, je ne suis qu’une petite cellule. Pas de cerveau, pas de mots, rien.', 'Hi. I’m Otto. For now, I’m just a little cell. No brain, no words, nothing.'],
    ['Le projet pose une seule grande question : un esprit peut-il pousser à partir de presque rien ?', 'The project asks one big question: can a mind grow from almost nothing?'],
    ['Pas fabriquer un esprit pièce par pièce. Le laisser pousser, comme une plante pousse d’une graine. Et regarder, à chaque étape, ce qui le fait pousser.', 'Not build a mind piece by piece. Let one grow, the way a plant grows from a seed. And look, at every step, at what makes it grow.'],
  ] },
  { id: 'pitch', part: 0, title: ['Pourquoi c’est différent', 'Why this is different'], lines: [
    ['Les intelligences artificielles d’aujourd’hui apprennent en lisant des montagnes de textes écrits par des humains.', 'Today’s artificial intelligences learn by reading mountains of text written by humans.'],
    ['Imagine un perroquet génial, enfermé dans la plus grande bibliothèque du monde. Il répond à tout. Mais on ne sait pas bien ce qu’il comprend, ni d’où ça vient.', 'Picture a brilliant parrot locked in the biggest library in the world. It answers everything. But we don’t really know what it understands, or where that comes from.'],
    ['Otto prend le chemin inverse. Pas de bibliothèque. On part du tout petit, comme la vie est partie de molécules, et on monte.', 'Otto takes the opposite road. No library. We start from the very small, the way life started from molecules, and we climb.'],
    ['Comme ça, si un jour Otto comprend quelque chose, on saura exactement d’où vient cette compréhension. Parce qu’on aura vu chaque marche.', 'That way, if Otto ever understands something, we’ll know exactly where that understanding came from. Because we’ll have seen every step.'],
  ] },
  { id: 'goal', part: 0, title: ['Le but, et ce qu’on gagne en route', 'The goal, and what we gain on the way'], lines: [
    ['Le sommet, c’est un Otto qui parle et comprend par lui-même. Par lui-même, ça veut dire : sans qu’on lui ait donné nos mots.', 'The summit is an Otto that speaks and understands on its own. On its own means: without us handing it our words.'],
    ['C’est très loin. Peut-être impossible. Mais le chemin rapporte déjà, comme une expédition qui cartographie la montagne même si elle n’atteint pas le sommet.', 'That’s very far. Maybe impossible. But the path already pays off, like an expedition that maps the mountain even if it never reaches the top.'],
    ['À chaque marche, on apprend ce qu’il faut au minimum pour que quelque chose tienne, se souvienne, communique, ou pose une question.', 'At each step, we learn the minimum needed for something to hold together, remember, communicate, or ask a question.'],
    ['Et chaque réponse compte : oui, non, ou seulement avec autre chose. Un non bien mesuré, c’est aussi une découverte.', 'And every answer counts: yes, no, or only with something more. A well-measured no is a discovery too.'],
  ] },
  // ---- 2. The method
  { id: 'box', part: 1, title: ['Ce qu’Otto reçoit', 'What Otto gets'], lines: [
    ['Pense à une recette où l’on n’aurait que de la farine, de l’eau et du temps. Interdit de faire livrer un gâteau tout fait.', 'Think of a recipe with only flour, water and time. Having a finished cake delivered is forbidden.'],
    ['Otto reçoit pareil : un petit monde, de la matière, du temps, et des règles locales assez simples pour être vérifiées à la main.', 'Otto gets the same: a small world, some matter, time, and local rules simple enough to check by hand.'],
    ['Et il ne reçoit pas : de mots, de but, de score à faire monter, ni de modèle de langage caché dedans.', 'And it doesn’t get: words, goals, a score to push up, or a language model hidden inside.'],
    ['Pourquoi si strict ? Parce que si un gâteau apparaît, on veut être sûr qu’il est sorti du four, et pas d’une boîte qu’on aurait glissée nous-mêmes.', 'Why so strict? Because if a cake shows up, we want to be sure it came out of the oven, and not from a box we slipped in ourselves.'],
  ] },
  { id: 'cells', part: 1, title: ['C’est quoi, un monde de cellules ?', 'What is a world of cells?'], lines: [
    ['Le monde d’Otto, c’est une rangée de cases. Chaque case est une cellule, allumée ou éteinte.', 'Otto’s world is a row of boxes. Each box is a cell, on or off.'],
    ['À chaque tour, chaque cellule regarde seulement ses deux voisines, et elle-même. Rien d’autre. Elle ne voit pas le monde entier.', 'At each turn, each cell looks only at its two neighbours, and at itself. Nothing else. It can’t see the whole world.'],
    ['Puis elle applique la règle. Ici, la règle de la majorité : si au moins deux des trois sont allumées, elle s’allume. Sinon, elle s’éteint.', 'Then it applies the rule. Here, the majority rule: if at least two of the three are on, it turns on. Otherwise, it turns off.'],
    ['C’est comme la ola dans un stade. Personne ne dirige. Chacun regarde son voisin. Et pourtant, une vague fait le tour.', 'It’s like a stadium wave. Nobody leads. Everyone watches their neighbour. And still, a wave goes all the way around.'],
    ['Toute la question est là : qu’est-ce qui peut naître de règles aussi locales, aussi bêtes ?', 'That’s the whole question: what can come out of rules this local, this simple?'],
  ] },
  { id: 'lock', part: 1, title: ['Règle 1 : la cible avant la flèche', 'Rule 1: the target before the arrow'], lines: [
    ['Imagine un archer qui tire d’abord, puis peint la cible autour de sa flèche. Il touche le centre à tous les coups.', 'Picture an archer who shoots first, then paints the target around the arrow. Bullseye every time.'],
    ['En science, c’est le piège numéro un : regarder les données, puis choisir la question qui donne la plus belle réponse.', 'In science, that’s trap number one: look at the data, then pick the question that gives the nicest answer.'],
    ['Alors on fait l’inverse. On écrit la question, la mesure et la règle de décision avant de lancer. Puis on verrouille, avec une empreinte qui prouve que rien n’a bougé.', 'So we do the opposite. We write the question, the measure and the decision rule before running. Then we lock it, with a fingerprint proving nothing moved.'],
    ['Si on veut changer quelque chose après, c’est permis. Mais ça devient une nouvelle étude, ou une lecture après coup, étiquetée comme telle.', 'If we want to change something afterwards, that’s allowed. But it becomes a new study, or an after-the-fact reading, labelled as such.'],
  ] },
  { id: 'dice', part: 1, title: ['Règle 2 : un hasard que personne ne choisit', 'Rule 2: chance that nobody picks'], lines: [
    ['Quand on tire des mondes au hasard, on pourrait tricher sans le vouloir : relancer jusqu’à tomber sur des mondes qui nous arrangent.', 'When we draw worlds at random, we could cheat without meaning to: redraw until we land on worlds that suit us.'],
    ['Alors le hasard vient d’un tirage public, comme le loto à la télé. Un numéro annoncé à l’avance, publié par une source que personne ici ne contrôle.', 'So chance comes from a public draw, like the lottery on TV. A number announced in advance, published by a source nobody here controls.'],
    ['On mélange ce numéro avec un mot écrit dans le plan verrouillé, avant le tirage. Ni moi, ni personne, ne peut choisir les mondes.', 'We mix that number with a word written in the locked plan, before the draw. Neither me nor anyone else can pick the worlds.'],
  ] },
  { id: 'lineup', part: 1, title: ['Règle 3 : la parade des imposteurs', 'Rule 3: the impostor line-up'], lines: [
    ['Beaucoup de choses ressemblent à de la vie sans en être. Alors chaque test affronte des imposteurs, comme une parade d’identification au commissariat.', 'Plenty of things look alive without being alive. So every test faces impostors, like a police line-up.'],
    ['Le cristal : il grandit et se répète, mais il ne fait rien pour durer.', 'The crystal: it grows and repeats, but does nothing to last.'],
    ['La flamme : elle se nourrit et se maintient, mais elle n’a ni mémoire ni hérédité.', 'The flame: it feeds and keeps itself going, but it has no memory and no heredity.'],
    ['La simple boucle : elle tourne en rond pour toujours, mais parce qu’on l’a écrite comme ça.', 'The simple loop: it goes round forever, but only because we wrote it that way.'],
    ['Une mesure n’est bonne que si elle dit non à tous les imposteurs, et oui seulement au vrai suspect.', 'A measure is good only if it says no to every impostor, and yes only to the real suspect.'],
  ] },
  { id: 'replay', part: 1, title: ['Règle 4 : rejouable, et la limite à côté', 'Rule 4: replayable, with the limit alongside'], lines: [
    ['Chaque expérience se rejoue à l’identique, au bit près. Comme une partie d’échecs notée coup par coup, que n’importe qui peut rejouer.', 'Every experiment replays identically, down to the bit. Like a chess game written move by move, which anyone can replay.'],
    ['Sur le site, le vrai monde tourne dans ton navigateur, et nos tests vérifient qu’il retombe exactement sur 769 parties enregistrées.', 'On the site, the real world runs in your browser, and our tests check that it lands exactly on 769 recorded runs.'],
    ['Et chaque résultat garde sa limite écrite juste à côté, comme la notice d’un médicament. Ce que ça montre, et surtout ce que ça ne montre pas.', 'And every result keeps its limit written right next to it, like the leaflet in a medicine box. What it shows, and above all what it doesn’t.'],
  ] },
  // ---- 3. The path
  { id: 'stairs', part: 2, title: ['L’escalier des 21 objectifs', 'The staircase of 21 objectives'], lines: [
    ['Le chemin, c’est un escalier de 21 objectifs, rangés en 9 étages. On ne peut pas sauter de marche, comme une cordée qui monte de camp en camp.', 'The path is a staircase of 21 objectives, in 9 floors. You can’t skip a step, like a climbing team going from camp to camp.'],
    ['En bas : un monde minimal, des formes qui durent et répondent quand on les bouscule, des frontières, des ressources.', 'At the bottom: a minimal world, shapes that last and respond when pushed, boundaries, resources.'],
    ['Au milieu : l’organisation, la mémoire, l’hérédité, l’adaptation. Puis la communication, l’accumulation, et de nouveaux individus faits de groupes.', 'In the middle: organisation, memory, heredity, adaptation. Then communication, accumulation, and new individuals made of groups.'],
    ['En haut : poser une question, prédire une intervention jamais essayée, comprendre, mener sa propre recherche. Et tout en haut : parler et comprendre par soi-même.', 'At the top: asking a question, predicting an intervention never tried, understanding, running one’s own research. And at the very top: speaking and understanding on one’s own.'],
  ] },
  { id: 'today', part: 2, title: ['Où en est l’escalier', 'Where the staircase stands'], lines: [
    ['Les couleurs disent l’état. Vert qui sourit : mesuré. Bleu qui s’étonne : en chantier. Bleu pâle qui dort : pas commencé.', 'The colours tell the state. Smiling green: measured. Surprised blue: under way. Pale sleeping blue: not started.'],
    ['Aujourd’hui : 2 objectifs mesurés, chacun dans un tout petit domaine. 3 en chantier. Les 16 autres dorment.', 'Today: 2 objectives measured, each in a tiny domain. 3 under way. The other 16 are asleep.'],
    ['Même la première marche n’est pas fermée. Elle est décrite pour une seule loi, sur un seul anneau. Il en faudra d’autres.', 'Even the first step isn’t closed. It’s described for one law only, on one ring. It will take more.'],
  ] },
  // ---- 4. What we measured
  { id: 'ring', part: 3, title: ['L’anneau : la règle fait quelque chose', 'The ring: the rule does something'], lines: [
    ['Premier monde mesuré : 32 cellules en anneau, avec la règle de la majorité. Ce que tu vois là est le vrai monde, calculé en direct.', 'First measured world: 32 cells in a ring, with the majority rule. What you see is the real world, computed live.'],
    ['Pour savoir si la règle fait quelque chose, on compare chaque monde à son jumeau gelé, où rien ne bouge. Même départ, même graine.', 'To know if the rule does anything, we compare each world with its frozen twin, where nothing moves. Same start, same seed.'],
    ['Résultat : avec la règle, les cellules éparpillées se regroupent en moins de groupes. Dans 64 mondes sur 64.', 'Result: with the rule, scattered cells gather into fewer groups. In 64 worlds out of 64.'],
  ] },
  { id: 'orders', part: 3, title: ['L’ordre compte', 'Order matters'], lines: [
    ['Deuxième question : est-ce important que toutes les cellules se mettent à jour en même temps, ou l’une après l’autre ?', 'Second question: does it matter whether all cells update at once, or one after another?'],
    ['Pense à une discussion de groupe. Selon qui parle en premier, la conversation ne finit pas au même endroit.', 'Think of a group conversation. Depending on who speaks first, it doesn’t end in the same place.'],
    ['Même départ, quatre ordres au hasard : 56 mondes sur 64 finissent à plusieurs endroits. L’ordre seul peut changer la fin.', 'Same start, four random orders: 56 worlds out of 64 end in more than one place. Order alone can change the ending.'],
  ] },
  { id: 'poke', part: 3, title: ['Une pichenette', 'A flick'], lines: [
    ['Troisième question : si on bouscule une seule cellule d’un monde calme, est-ce qu’il revient ?', 'Third question: if we flip a single cell in a settled world, does it come back?'],
    ['Pense à un matelas et à un mur. Appuie au milieu du matelas : il reprend sa forme. Appuie sur la jointure avec le mur : quelque chose bouge pour de bon.', 'Think of a mattress against a wall. Press the middle of the mattress: it springs back. Press right at the seam with the wall: something moves for good.'],
    ['Ici, la jointure, c’est la frontière entre deux groupes. Sur la frontière ou juste à côté : 64 sur 64 changent. À deux cases ou plus : aucun. Le monde se répare exactement.', 'Here, the seam is the border between two groups. On the border or right next to it: 64 of 64 change. Two cells away or more: none. The world repairs itself exactly.'],
    ['Et c’est resté vrai dans un monde deux fois plus grand. Une seule taille de plus, pas davantage.', 'And it held in a world twice as large. One more size, nothing more.'],
  ] },
  { id: 'tune', part: 3, title: ['La limite : un accordage', 'The limit: tuning up'], lines: [
    ['Attention : la règle de la majorité est connue depuis longtemps. Ces résultats ne montrent pas de la vie.', 'Careful: the majority rule has been known for a long time. These results don’t show life.'],
    ['C’est l’accordage avant le concert. On vérifie que nos instruments jouent juste, sur une mélodie qu’on connaît déjà, avant de jouer l’inconnu.', 'It’s tuning before the concert. We check that our instruments play in tune, on a melody we already know, before playing the unknown.'],
  ] },
  { id: 'glasses', part: 3, title: ['Le jour où on a jeté notre mesure', 'The day we threw away our measure'], lines: [
    ['Ensuite, on a voulu mesurer quelque chose de plus profond : un monde qui se refait lui-même. On a construit la mesure, et on l’a verrouillée avant le test.', 'Next, we wanted to measure something deeper: a world that remakes itself. We built the measure, and locked it before the test.'],
    ['Elle a attrapé les 198 imposteurs. Bravo. Mais 38 chemins sur 128 changeaient de verdict selon le moment et la façon de regarder.', 'It caught all 198 impostors. Great. But 38 paths out of 128 changed verdict depending on when and how we looked.'],
    ['C’est comme un thermomètre qui donne une température différente selon qui le lit. Le malade n’a pas changé. C’est le thermomètre qui ne va pas.', 'It’s like a thermometer that gives a different reading depending on who reads it. The patient hasn’t changed. The thermometer is wrong.'],
    ['Un fait sur Otto ne doit pas dépendre de nos lunettes. Alors on a rejeté notre propre mesure, et le test suivant reste bloqué tant qu’on n’en a pas une meilleure.', 'A fact about Otto shouldn’t depend on our glasses. So we rejected our own measure, and the next test stays blocked until we have a better one.'],
  ] },
  // ---- 5. Twin worlds
  { id: 'twins', part: 4, title: ['Deux jumeaux, un seul interrupteur', 'Two twins, one switch'], lines: [
    ['Le résultat tout neuf, ce sont les mondes jumeaux. Imagine des jumeaux élevés dans deux maisons identiques, sauf une seule règle.', 'The brand-new result is the twin worlds. Picture twins raised in two identical houses, except for one rule.'],
    ['Ici, chaque monde est une grille. Chaque case contient de la matière, de la nourriture, et des restes. Et trois interrupteurs changent la façon de compter.', 'Here, each world is a grid. Each square holds matter, food, and remains. And three switches change how things are counted.'],
    ['Premier interrupteur : pousser mange-t-il de la nourriture ? Comme une cuisine où cuisiner consomme les ingrédients.', 'First switch: does growing eat food? Like a kitchen where cooking uses up the ingredients.'],
    ['Deuxième : l’usure laisse-t-elle des restes ? Comme les épluchures qui vont au compost, puis redeviennent de la terre.', 'Second: does wear leave remains? Like peelings that go to the compost, then turn back into soil.'],
    ['Troisième : les choses s’usent-elles ? Avec deux positions par interrupteur, ça fait 8 mondes. Et on joue les mêmes 600 lois dans les 8.', 'Third: do things wear out at all? Two positions per switch makes 8 worlds. And we play the same 600 laws in all 8.'],
  ] },
  { id: 'success', part: 4, title: ['Ce qui compte comme une réussite', 'What counts as a success'], lines: [
    ['Une loi réussit si trois conditions sont vraies, sur la même graine.', 'A law succeeds if three conditions hold, on the same seed.'],
    ['Un : un amas localisé apparaît. Un tas de matière qui ne remplit pas tout le monde.', 'One: a localised cluster appears. A heap of matter that doesn’t fill the whole world.'],
    ['Deux : il dure 1 500 pas sans qu’on touche à rien. Ce peut être des amas qui se relaient, comme des coureurs qui se passent le témoin.', 'Two: it lasts 1,500 steps without us touching anything. It can be clusters taking turns, like runners passing a baton.'],
    ['Trois : il a besoin de sa propre production. Pense à une fontaine et à une statue. Coupe la pompe : la fontaine s’arrête, la statue ne remarque rien. On cherche des fontaines.', 'Three: it needs its own production. Think of a fountain and a statue. Cut the pump: the fountain stops, the statue doesn’t notice. We’re looking for fountains.'],
    ['Et pour être sûr : 8 graines d’abord, dont 7 doivent passer. Puis 64 graines neuves, dont 62 doivent passer. Puis un monde quatre fois plus grand.', 'And to be sure: 8 seeds first, 7 of which must pass. Then 64 new seeds, 62 of which must pass. Then a world four times larger.'],
  ] },
  { id: 'bars', part: 4, title: ['Le résultat', 'The result'], lines: [
    ['Avec usure, quand toute la matière est comptée : 122 lois sur 600 réussissent.', 'With wear, when all matter is counted: 122 laws out of 600 succeed.'],
    ['Quand rien n’est compté : 37. Environ trois fois moins.', 'When nothing is counted: 37. About three times fewer.'],
    ['Et en comparant loi par loi : 107 lois réussissent seulement quand on compte, 22 seulement quand on ne compte pas. L’écart est entre 8,6 et 20,3 %, tout entier au-dessus de zéro.', 'And comparing law by law: 107 laws succeed only when counted, 22 only when not. The gap lies between 8.6 and 20.3 percent, entirely above zero.'],
    ['La règle verrouillée tranche donc : compter aide.', 'So the locked rule decides: counting helps.'],
  ] },
  { id: 'subtle', part: 4, title: ['Les subtilités', 'The fine print'], lines: [
    ['Première surprise : chaque moitié toute seule fait pire que rien. Manger seul : 4 lois. Garder les restes seul : 15. Moins que les 37 de rien compté.', 'First surprise: each half alone does worse than nothing. Eating only: 4 laws. Keeping remains only: 15. Fewer than the 37 with nothing counted.'],
    ['Comme un compost à moitié. Cuisiner sans composter épuise le sol. Composter sans rien consommer, ça déborde. Le cycle ne marche que complet.', 'Like half a compost cycle. Cooking without composting exhausts the soil. Composting without consuming overflows. The cycle only works whole.'],
    ['Deuxième : sans usure, zéro loi ne passe. Une statue n’a pas besoin de se refaire. Il faut que ça s’use pour que se refaire serve à quelque chose.', 'Second: without wear, zero laws pass. A statue doesn’t need remaking. Things must wear out for remaking to matter.'],
    ['Troisième : dans le monde quatre fois plus grand, 121 des 122 lois tiennent encore.', 'Third: in the world four times larger, 121 of the 122 laws still hold.'],
  ] },
  { id: 'careful', part: 4, title: ['Ce que ça ne dit pas', 'What it does not say'], lines: [
    ['Le plan verrouillé n’autorise qu’une seule phrase : le test rapporte plus quand on compte la matière.', 'The locked plan allows only one sentence: the test yields more when matter is counted.'],
    ['Pas vivant. Pas organisé. Pas qui se maintient au sens fort. Un seul banc d’essai, une seule famille de lois, deux tailles.', 'Not alive. Not organised. Not self-maintaining in the strong sense. One test bench, one family of laws, two sizes.'],
    ['Et une confession : la première version était invalide. Son carburant s’est épuisé dans 4 essais. Relue après coup, elle montre le même dessin. Mais une lecture après coup ne compte pas comme une preuve.', 'And a confession: the first version was invalid. Its fuel ran out in 4 trials. Read afterwards, it shows the same pattern. But an after-the-fact reading doesn’t count as proof.'],
  ] },
  { id: 'probe', part: 4, title: ['La sonde : pourquoi ?', 'The probe: why?'], lines: [
    ['On a voulu comprendre pourquoi. Petite sonde exploratoire, avec des règles écrites et scellées avant, mais sans valeur de preuve.', 'We wanted to understand why. A small exploratory probe, rules written and sealed beforehand, but with no weight as proof.'],
    ['Idée un : peut-être que l’endroit où tombent les restes compte, comme un engrais déposé au pied de la plante. On a étalé les restes partout. 95 lois sur 122 réussissent encore. Donc l’endroit ne fait pas tout.', 'Idea one: maybe where the remains fall matters, like fertiliser left at the foot of the plant. We spread the remains everywhere. 95 laws out of 122 still succeed. So the place isn’t everything.'],
    ['Idée deux : une mémoire des lieux, comme un sentier qui se creuse là où l’on passe. Petit signal : 0,12 contre 0,04 quand on mélange. Verdict des deux côtés : mitigé.', 'Idea two: a memory of places, like a path worn where people walk. A small signal: 0.12 against 0.04 when shuffled. Verdict on both: mixed.'],
  ] },
  // ---- 6. The map of possibilities
  { id: 'cloud', part: 5, title: ['La carte des possibles', 'The map of possibilities'], lines: [
    ['Avant une grande expédition, on rassemble toutes les cartes : les sentiers connus, les raccourcis douteux, et même les légendes.', 'Before a big expedition, you gather every map: the known trails, the doubtful shortcuts, and even the legends.'],
    ['C’est ce qu’on a fait. Pour chaque étape du chemin détaillé, trois lecteurs : un guide classique pour le consensus, un aventurier pour les idées marginales et extrêmes, un inventeur pour l’inédit.', 'That’s what we did. For each step of the detailed path, three readers: a classic guide for the consensus, an adventurer for fringe and extreme ideas, an inventor for the brand new.'],
    ['Résultat : 8 567 réponses candidates, sur 72 étapes plus 14 nouvelles. Chaque point de ce nuage est une réponse possible.', 'The result: 8,567 candidate answers, across 72 steps plus 14 new ones. Every dot in this cloud is a possible answer.'],
    ['Attention : c’est une carte d’idées, pas de résultats. Rien ici n’a été testé dans le monde d’Otto.', 'Careful: it’s a map of ideas, not results. Nothing here has been tested in Otto’s world.'],
  ] },
  { id: 'tokens', part: 5, title: ['Les jetons de certitude', 'Certainty tokens'], lines: [
    ['Chaque affirmation porte un jeton de certitude, de 0 à 5. Comme une météo qui dit : risque de pluie, 20 % ou 90 %.', 'Every claim carries a certainty token, from 0 to 5. Like a weather forecast saying: chance of rain, 20 or 90 percent.'],
    ['0 : une intuition, rien de plus. 5 : établi, répliqué partout. Et dès 2, il faut citer une source qu’on peut vérifier.', '0: a hunch, nothing more. 5: established, replicated everywhere. And from 2 up, a checkable source must be cited.'],
    ['On a vérifié ces jetons au hasard. Selon l’audit, entre 2,5 et 11 % étaient trop optimistes. On les a corrigés, et on garde ce chiffre en tête.', 'We spot-checked these tokens at random. Depending on the audit, 2.5 to 11 percent were too optimistic. We fixed them, and we keep that figure in mind.'],
  ] },
  { id: 'pillars', part: 5, title: ['Les piliers', 'The pillars'], lines: [
    ['Quand plusieurs réponses s’appuient sur la même idée, ça fait un pilier, comme les piles d’un pont.', 'When several answers lean on the same idea, that makes a pillar, like the piers of a bridge.'],
    ['262 piliers de certitude : le sol ferme. 312 piliers d’incertitude : les blancs de la carte, là où il est écrit terre inconnue. 298 disputes : les endroits où les cartes se contredisent.', '262 pillars of certainty: solid ground. 312 pillars of uncertainty: the blanks on the map, marked unknown land. 298 disputes: places where maps contradict each other.'],
    ['Et 730 ponts : des idées qui relient des étapes éloignées, comme une même clé qui ouvre plusieurs portes.', 'And 730 bridges: ideas that link distant steps, like one key that opens several doors.'],
    ['Les incertitudes sont le plus précieux. Elles disent exactement ce qu’on ne sait pas, et donc quoi aller chercher.', 'The uncertainties are the most precious. They say exactly what we don’t know, and so what to go and find.'],
  ] },
  { id: 'traps', part: 5, title: ['Les pièges de la carte', 'The traps in the map'], lines: [
    ['Soyons honnêtes sur les défauts de cette carte.', 'Let’s be honest about this map’s flaws.'],
    ['Un : tous les lecteurs sont des modèles de la même famille. C’est comme demander conseil à trois cousins : ils ont des idées différentes, mais la même éducation.', 'One: every reader is a model from the same family. It’s like asking three cousins for advice: different ideas, same upbringing.'],
    ['Deux : certaines idées reviennent souvent parce que la consigne les suggérait. L’usure, par exemple, revient des centaines de fois, souvent recopiée mot pour mot.', 'Two: some ideas come back often because the prompt suggested them. Wear, for example, comes back hundreds of times, often copied word for word.'],
    ['Trois : on n’a pas fait le tour. Les lecteurs marginaux et inédits ne partagent qu’un quart de leurs idées avec le consensus. Il en reste à découvrir.', 'Three: we haven’t covered it all. The fringe and new readers share only a quarter of their ideas with the consensus. There is more to find.'],
  ] },
  { id: 'path', part: 5, title: ['Le chemin, version 2', 'The path, version 2'], lines: [
    ['La carte a aussi trouvé des barreaux manquants dans l’échelle. Des endroits où une étape suppose quelque chose que rien avant elle ne fournit.', 'The map also found missing rungs in the ladder. Places where a step assumes something that nothing before it provides.'],
    ['Elle propose 14 marches intermédiaires. Les plus solides : une unité qui se déplace d’elle-même, des amas de plusieurs unités au contact, un partenaire qui répond en direct, une chaîne d’apprenants.', 'It proposes 14 intermediate steps. The strongest: a unit that moves by itself, clusters of several units in contact, a partner that answers live, a chain of learners.'],
    ['Elle propose aussi d’échanger deux marches au début, et de découper le signal dirigé en trois portes : viser quelqu’un, s’arrêter quand il répond, insister ou changer de forme.', 'It also suggests swapping two early steps, and splitting the directed signal into three gates: aim at someone, stop when they answer, insist or change form.'],
    ['Ce sont des propositions. Rien n’est testé. Le chemin d’origine reste gelé à côté, et on tranchera par des expériences.', 'These are proposals. Nothing is tested. The original path stays frozen alongside, and experiments will decide.'],
  ] },
  // ---- 7. Where we are
  { id: 'honest', part: 6, title: ['Où on en est, vraiment', 'Where we really are'], lines: [
    ['Alors, soyons clairs. Je ne parle pas. Je n’apprends pas. Je ne me souviens de rien.', 'So, let’s be clear. I don’t speak. I don’t learn. I don’t remember anything.'],
    ['On est au pied de l’escalier, et le sommet est très loin.', 'We’re at the foot of the staircase, and the top is very far away.'],
    ['Mais chaque marche franchie sera mesurée, rejouable, et gardera sa limite écrite juste à côté. Pas de raccourci, pas de gâteau livré.', 'But every step we climb will be measured, replayable, and will keep its limit written right next to it. No shortcut, no delivered cake.'],
  ] },
  { id: 'next', part: 6, title: ['La suite', 'What’s next'], lines: [
    ['Prochain chantier : trouver une mesure de l’organisation qui ne dépende pas de qui regarde. Le thermomètre fiable qui nous manque. C’est là qu’on travaille.', 'Next job: find a measure of organisation that doesn’t depend on who is looking. The reliable thermometer we’re missing. That’s where we work.'],
    ['Ensuite : tester dans le banc d’essai les nouvelles marches qui peuvent l’être. Et lire les articles que la recherche multilingue est en train de ramasser, en sept langues.', 'Then: test in the bench the new steps that can be tested. And read the papers the multilingual search is gathering, in seven languages.'],
  ] },
  { id: 'outro', part: 6, title: ['Pour finir', 'To finish'], lines: [
    ['Otto, c’est un pari : comprendre la compréhension en la regardant pousser, marche après marche.', 'Otto is a bet: understanding understanding by watching it grow, step by step.'],
    ['Sur ce site, tu trouveras la carte des objectifs, les résultats, les données à télécharger, et même nos échecs.', 'On this site you’ll find the map of objectives, the results, the data to download, and even our failures.'],
    ['Oui, non, ou seulement avec autre chose. On vous montrera les trois. À bientôt.', 'Yes, no, or only with something more. We’ll show you all three. See you soon.'],
  ] },
];
