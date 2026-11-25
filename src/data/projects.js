import * as THREE from 'three';

export const PROJECTS = [
  {
    id: 'halo-remix',
    title: 'Halo Remix',
    description:
      'Relecture électronique et énergie rythmique travaillée autour du timbre, de la dynamique et du mix.',
    coverUrl: '/images/HALOREMIX.png',
    x: -2.2,
  },
  {
    id: 'petite-mariie',
    title: 'Petite Mariie',
    description:
      'Projet musical axé sur l’ambiance, les textures et une construction progressive.',
    coverUrl: '/images/petitemariie.png',
    x: -1.1,
  },
  {
    id: 'zoe-remix',
    title: 'Zoé Remix',
    description:
      'Arrangement et sound design pensés pour donner un nouvel espace et un nouveau relief au morceau.',
    coverUrl: '/images/zoeremixcovr.png',
    x: 0.0,
  },
];

// ============================================================================
// POSITIONNEMENT DE LA BOOMBOX (repos + état actif quand un projet est cliqué)
// ============================================================================
export const BOOMBOX_POS = new THREE.Vector3(0.2, -2.15, -0.2);
export const BOOMBOX_SCALE = 5.2;

// Boombox rapprochée de l'écran et placée à droite quand un projet est sélectionné
export const BOOMBOX_ACTIVE_POS = new THREE.Vector3(2.35, -0.45, 1.15);
export const BOOMBOX_ACTIVE_SCALE = 5.2;

export const CAM_POS = new THREE.Vector3(0, 0.7, 4.5);
export const CAM_TARGET = new THREE.Vector3(-0.15, -0.05, 0);

// ============================================================================
// POSITIONNEMENT DE LA JAQUETTE AU CLIC (onClick) — À GAUCHE DE L'ÉCRAN
// ============================================================================
// y abaissé à -0.08 pour garder de la marge sous le titre "Portfolio" en haut à gauche
export const SELECTED_CASE_POS = new THREE.Vector3(-1.55, -0.08, 1.35);

// Retourné de 180° par rapport à Math.PI / 2 pour montrer la face avant de la pochette
export const FACE_OFFSET_ANGLE = Math.PI / 2 + Math.PI;

// ============================================================================
// OUVERTURE DE CASE_FRONT & TRAJET DU CD
// ============================================================================
// Axe de rotation de Case_Front : 'x', 'y' ou 'z'
export const CASE_OPEN_AXIS = 'y';
// Angle d'ouverture adouci pour éviter que le couvercle ne parte trop haut
export const CASE_OPEN_ANGLE = -0.50;

// CD : décalage un peu plus marqué vers la droite (x), puis recul vers l'arrière (z)
export const CD_STEP_RIGHT_X = 0.15;
export const CD_STEP_BACK_Z = -4.0;

// Mise à plat / horizontale du CD avant d'aller vers la boombox (à ajuster selon cd.glb)
export const CD_FLAT_ROTATION = new THREE.Euler(Math.PI / 2, 0, 0);

// Position du CD par rapport à la boombox : devant/au-dessus (approche) puis dedans (insertion)
export const CD_BOOMBOX_APPROACH_OFFSET = new THREE.Vector3(-0.55, 0.35, 0.35);
export const CD_BOOMBOX_INSERT_OFFSET = new THREE.Vector3(0, 0.12, 0);

// Vitesse de retour rapide du CD quand on clique ailleurs
export const CD_EJECT_SMOOTH = 18;

// Délai (en secondes) après l'arrivée du CD avant que les speakers commencent à pulser
export const SPEAKERS_PULSE_DELAY = 0.5;

// Point devant la boombox (décalage ajouté à state.boombox.position)
export const CD_BOOMBOX_DROP_OFFSET = new THREE.Vector3(-0.45, 0.25, 0.85);

// Distance à partir de laquelle le CD de la jaquette est considéré arrivé au point
export const CD_ARRIVE_THRESHOLD = 0.14;

// Animation du CD dédié à la boombox une fois visible (décalage d'insertion + rotation)
export const BOOMBOX_CD_INSERT_OFFSET = new THREE.Vector3(0, 0.12, 0.15);
export const BOOMBOX_CD_FLAT_ROTATION = new THREE.Euler(Math.PI / 2, 0, 0);
export const BOOMBOX_CD_SPIN_SPEED = 4.5;