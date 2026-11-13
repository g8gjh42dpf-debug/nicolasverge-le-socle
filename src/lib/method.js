// La méthode Drill's & Skills : critères, modèles d'événements, étapes de suivi.

export const CRITS = [
  { k: 'ens', n: 'Enseignement', d: 'Informations correctes, démonstration, progression claire' },
  { k: 'obs', n: 'Observation', d: 'Temps pour observer, reconnaît les bons mouvements' },
  { k: 'cor', n: 'Correction', d: 'Astuces efficaces, triage, suivi, intransigeance' },
  { k: 'grp', n: 'Gestion du groupe', d: 'Rythme, autorité, gestion du temps, sécurité' },
  { k: 'pre', n: 'Présence & attitude', d: 'Engagement, relations, empathie, respect' },
  { k: 'mev', n: 'Mise en œuvre', d: 'Paliers, adaptation, échauffement et récupération' },
  { k: 'cha', n: 'Respect de la Charte', d: 'Le cours suit le Standard de la box' },
]
export const LVL = { 1: 'À perfectionner', 2: 'Efficace', 3: 'Référence' }

export const PALETTE = [
  ['#3F5A3A', '#FFFFFF'], ['#F2E64A', '#2B2A10'], ['#5B4C45', '#FFFFFF'], ['#7A3B22', '#FFFFFF'],
  ['#7A1F1C', '#FFFFFF'], ['#C9612E', '#FFFFFF'], ['#2F5E6B', '#FFFFFF'], ['#BDB8B0', '#2B2B2B'],
]
export const DEFAULT_TYPES = ['CrossFit', 'Hyrox', 'Condi', 'Haltéro', 'Gym']

export const ONB_STEPS = [
  ['j1', 0, 'Accueil du jour 1', 'Présenter les coachs et 2-3 membres, expliquer le planning'],
  ['s1', 7, 'Message de la 1re semaine', '« Comment tu te sens après ta 1re semaine ? »'],
  ['s2', 14, 'Point habitude', 'Moins de 2 séances par semaine ? On relance'],
  ['j30', 30, 'Bilan du 30e jour', 'Objectifs, premiers progrès, prochain cap'],
  ['j60', 60, 'Ancrage du 60e jour', "L'intégrer à un événement ou un défi"],
]

// role : owner = l'owner, hc = head coach, coach = coachs en rotation, all = toute l'équipe
export const EVT_TYPES = {
  porte: { n: 'Porte ouverte', tasks: [
    [-21, 'owner', "Fixer la date et le format (WOD découverte, cours d'essai)"],
    [-18, 'coach', "Créer le visuel et l'annonce"],
    [-14, 'owner', "Demander à chaque adhérent d'inviter un proche ou un collègue"],
    [-10, 'owner', 'Contacter les commerces et entreprises voisines'],
    [-7, 'coach', 'Relancer sur les réseaux et par message aux adhérents'],
    [-3, 'hc', "Planning des coachs du jour et rappel de la séance d'essai en 3 phases"],
    [0, 'all', 'Accueil en 3 phases et noter chaque contact'],
    [1, 'owner', 'Relancer tous les contacts de la journée'],
    [3, 'owner', "Envoyer l'offre spéciale aux invités"],
    [7, 'owner', 'Bilan : essais générés et inscriptions'],
  ] },
  compet: { n: 'Compétition interne', tasks: [
    [-45, 'owner', 'Fixer la date, le format et les catégories'],
    [-40, 'owner', 'Trouver des partenaires locaux et des lots'],
    [-35, 'coach', 'Annoncer et ouvrir les inscriptions'],
    [-30, 'owner', "Commander le merch de l'événement"],
    [-21, 'hc', 'Écrire les WODs et les standards'],
    [-14, 'coach', 'Recruter les juges et les bénévoles'],
    [-10, 'coach', 'Relancer les inscriptions, teaser sur les réseaux'],
    [-7, 'hc', 'Plan du floor, heats et matériel'],
    [-3, 'hc', 'Briefer les juges'],
    [-1, 'all', 'Installer la salle'],
    [0, 'all', 'Accueillir les invités et noter les contacts'],
    [2, 'coach', 'Publier les résultats et les photos, remercier les partenaires'],
    [3, 'owner', 'Relancer les invités venus voir : proposer un essai'],
    [7, 'owner', 'Bilan : participants, CA, essais générés'],
  ] },
  semi: { n: 'Séminaire / atelier', tasks: [
    [-30, 'owner', "Choisir le thème, l'intervenant et le prix"],
    [-25, 'coach', 'Ouvrir les inscriptions'],
    [-21, 'coach', 'Visuel et publication'],
    [-14, 'coach', 'Relancer les adhérents'],
    [-7, 'hc', 'Préparer le contenu et le déroulé minuté'],
    [-2, 'coach', 'Préparer le matériel'],
    [0, 'all', "Animer l'atelier"],
    [1, 'coach', 'Envoyer un questionnaire de satisfaction'],
    [3, 'owner', 'Proposer la suite : programmation spécifique ou personal training'],
    [7, 'owner', 'Bilan : participants, CA, ventes de suivi'],
  ] },
  autre: { n: 'Autre projet', tasks: [
    [-14, 'owner', "Définir l'objectif et le responsable"],
    [-7, 'owner', "Point d'avancement"],
    [0, 'owner', 'Jour J'],
    [7, 'owner', 'Bilan'],
  ] },
}

export function assignRole(role, i, coaches) {
  const hc = coaches.find((c) => c.role_label === 'Head coach')
  const others = coaches.filter((c) => c !== hc && c.role_label !== 'Stagiaire')
  if (role === 'owner') return 'owner'
  if (role === 'hc') return hc ? hc.id : 'owner'
  if (role === 'all') return 'equipe'
  return others.length ? others[i % others.length].id : hc ? hc.id : 'owner'
}

export function whoName(w, coaches) {
  if (w === 'owner') return 'Owner'
  if (w === 'equipe') return "Toute l'équipe"
  const c = coaches.find((x) => x.id === w)
  return c ? c.name : '—'
}
