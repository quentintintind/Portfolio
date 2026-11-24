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
export const BOOMBOX_POS = new THREE.Vector3(0.2, -1.15, -0.2);
export const BOOMBOX_SCALE = 2.1;

// Boombox rapprochée de l'écran et placée à droite quand un projet est sélectionné
export const BOOMBOX_ACTIVE_POS = new THREE.Vector3(1.35, -0.45, 1.15);
export const BOOMBOX_ACTIVE_SCALE = 2.25;

export const CAM_POS = new THREE.Vector3(0, 0.7, 4.5);
export const CAM_TARGET = new THREE.Vector3(-0.15, -0.05, 0);

// ============================================================================
// POSITIONNEMENT DE LA JAQUETTE AU CLIC (onClick) — À GAUCHE DE L'ÉCRAN
// ============================================================================
// y abaissé à -0.08 pour garder de la marge sous le titre "Portfolio" en haut à gauche
export const SELECTED_CASE_POS = new THREE.Vector3(-1.15, -0.08, 1.35);

// Retourné de 180° par rapport à Math.PI / 2 pour montrer la face avant de la pochette
export const FACE_OFFSET_ANGLE = Math.PI / 2 + Math.PI;

// ============================================================================
// OUVERTURE DE CASE_FRONT & TRAJET DU CD
// ============================================================================
// Axe de rotation de Case_Front : 'x', 'y' ou 'z'
export const CASE_OPEN_AXIS = 'y';
// Angle d'ouverture adouci pour éviter que le couvercle ne parte trop haut
export const CASE_OPEN_ANGLE = -0.60;

// CD : décalage un peu plus marqué vers la droite (x), puis recul vers l'arrière (z)
export const CD_STEP_RIGHT_X = 0.15;
export const CD_STEP_BACK_Z = -0.65;

// Délai (en secondes) après l'arrivée du CD avant que les speakers commencent à pulser
export const SPEAKERS_PULSE_DELAY = 0.5;