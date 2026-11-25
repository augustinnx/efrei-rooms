// Plans 2D des 4 campus. Chaque plan décrit :
// - height : la hauteur du dessin (la largeur est toujours 700)
// - decor  : les zones qui ne sont pas des salles (couloirs, hall, escaliers...)
// - slots  : les emplacements des salles, dans l'ordre A1, A2, A3... (x, y, largeur, hauteur)

// Petit outil : fabrique une rangée de salles côte à côte
function row(x, y, w, h, count) {
  return Array.from({ length: count }, (_, i) => ({ x: x + i * w, y, w, h }))
}

const plans = {
  // Couloir central : 5 salles en haut, 5 en bas
  'La Maison': {
    height: 380,
    decor: [
      { kind: 'decor-block', x: 20, y: 150, w: 60, h: 80, label: 'Entrée' },
      { kind: 'corridor', x: 80, y: 150, w: 600, h: 80, label: 'Couloir' },
    ],
    slots: [...row(20, 20, 132, 130, 5), ...row(20, 230, 132, 130, 5)],
  },

  // Salles autour d'un atrium central
  "L'Aquarium": {
    height: 400,
    decor: [
      { kind: 'atrium', x: 150, y: 140, w: 400, h: 120, label: 'Atrium' },
      { kind: 'decor-block', x: 20, y: 20, w: 130, h: 120, label: 'Escaliers' },
      { kind: 'decor-block', x: 550, y: 20, w: 130, h: 120, label: 'Sanitaires' },
      { kind: 'decor-block', x: 20, y: 260, w: 130, h: 120, label: 'Accueil' },
      { kind: 'decor-block', x: 550, y: 260, w: 130, h: 120, label: 'Cafétéria' },
    ],
    slots: [
      ...row(150, 20, 100, 120, 4), // en haut
      { x: 550, y: 140, w: 130, h: 120 }, // à droite
      ...row(150, 260, 100, 120, 4), // en bas
      { x: 20, y: 140, w: 130, h: 120 }, // à gauche
    ],
  },

  // Forme de H : deux couloirs verticaux reliés par un hall
  'La Factory': {
    height: 400,
    decor: [
      { kind: 'corridor', x: 160, y: 20, w: 50, h: 360, label: '' },
      { kind: 'corridor', x: 490, y: 20, w: 50, h: 360, label: '' },
      { kind: 'corridor', x: 210, y: 140, w: 280, h: 120, label: 'Hall central' },
    ],
    slots: [
      { x: 20, y: 20, w: 140, h: 120 },
      { x: 20, y: 140, w: 140, h: 120 },
      { x: 20, y: 260, w: 140, h: 120 },
      ...row(210, 20, 140, 120, 2),
      ...row(210, 260, 140, 120, 2),
      { x: 540, y: 20, w: 140, h: 120 },
      { x: 540, y: 140, w: 140, h: 120 },
      { x: 540, y: 260, w: 140, h: 120 },
    ],
  },

  // Forme de T : un long couloir et un hall qui descend vers l'entrée
  'New Republic': {
    height: 470,
    decor: [
      { kind: 'corridor', x: 20, y: 140, w: 660, h: 50, label: 'Couloir' },
      { kind: 'corridor', x: 300, y: 190, w: 100, h: 240, label: 'Hall' },
      { kind: 'decor-block', x: 300, y: 430, w: 100, h: 40, label: 'Entrée' },
    ],
    slots: [
      ...row(20, 20, 110, 120, 6),
      { x: 190, y: 190, w: 110, h: 120 },
      { x: 190, y: 310, w: 110, h: 120 },
      { x: 400, y: 190, w: 110, h: 120 },
      { x: 400, y: 310, w: 110, h: 120 },
    ],
  },
}

// Retourne le plan d'un campus d'après son nom (La Maison par défaut)
export function getPlan(campusName) {
  return plans[campusName] || plans['La Maison']
}
