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
  'The House': {
    height: 380,
    decor: [
      { kind: 'decor-block', x: 20, y: 150, w: 60, h: 80, label: 'Entrée' },
      { kind: 'corridor', x: 80, y: 150, w: 600, h: 80, label: 'Couloir' },
    ],
    slots: [...row(20, 20, 132, 130, 5), ...row(20, 230, 132, 130, 5)],
  },

  // Aquarium : forme diagonale en U, atrium central décalé
  'The Aquarium': {
    height: 430,
    decor: [
      { kind: 'corridor', x: 100, y: 150, w: 500, h: 55, label: 'Main passage' },
      { kind: 'atrium', x: 245, y: 205, w: 210, h: 205, label: 'Aquarium atrium' },
      { kind: 'decor-block', x: 20, y: 20, w: 150, h: 100, label: 'Lobby' },
      { kind: 'decor-block', x: 530, y: 20, w: 150, h: 100, label: 'Elevators' },
      { kind: 'decor-block', x: 20, y: 310, w: 150, h: 100, label: 'Café' },
      { kind: 'decor-block', x: 530, y: 310, w: 150, h: 100, label: 'Restrooms' },
    ],
    slots: [
      { x: 170, y: 20, w: 100, h: 100 },
      { x: 270, y: 20, w: 100, h: 100 },
      { x: 370, y: 20, w: 140, h: 100 },
      { x: 20, y: 150, w: 80, h: 130 },
      { x: 600, y: 150, w: 80, h: 130 },
      { x: 170, y: 230, w: 75, h: 180 },
      { x: 455, y: 230, w: 75, h: 180 },
      { x: 170, y: 330, w: 75, h: 80 },
      { x: 455, y: 330, w: 75, h: 80 },
      { x: 530, y: 230, w: 150, h: 80 },
    ],
  },

  // Factory : campus en grille industrielle avec atelier central
  'The Factory': {
    height: 460,
    decor: [
      { kind: 'corridor', x: 260, y: 20, w: 180, h: 420, label: 'Central walkway' },
      { kind: 'decor-block', x: 20, y: 170, w: 240, h: 120, label: 'Workshop' },
      { kind: 'decor-block', x: 440, y: 360, w: 240, h: 80, label: 'Machine room' },
    ],
    slots: [
      { x: 20, y: 20, w: 115, h: 150 },
      { x: 145, y: 20, w: 115, h: 150 },
      { x: 20, y: 290, w: 115, h: 150 },
      { x: 145, y: 290, w: 115, h: 150 },
      { x: 440, y: 20, w: 115, h: 150 },
      { x: 555, y: 20, w: 125, h: 150 },
      { x: 440, y: 290, w: 115, h: 70 },
      { x: 555, y: 290, w: 125, h: 70 },
      { x: 440, y: 170, w: 115, h: 120 },
      { x: 555, y: 170, w: 125, h: 120 },
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
  return plans[campusName] || plans['The House']
}
