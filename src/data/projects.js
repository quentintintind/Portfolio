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
// POSITIONNEMENT DE LA BOOMBOX (plus grande + placée sous les CD)
// ============================================================================
export const BOOMBOX_POS = new THREE.Vector3(0.2, -1.15, -0.2);
export const BOOMBOX_SCALE = 2.1;

export const CAM_POS = new THREE.Vector3(0, 0.7, 4.5);
export const CAM_TARGET = new THREE.Vector3(-0.15, -0.05, 0);

// ============================================================================
// POSITIONNEMENT DE LA JAQUETTE AU CLIC (onClick) — À GAUCHE DE L'ÉCRAN
// ============================================================================
// x négatif (-1.15) place la jaquette à gauche pour ne pas passer derrière le panneau à droite
export const SELECTED_CASE_POS = new THREE.Vector3(-1.15, 0.05, 1.35);

// Retourné de 180° par rapport à Math.PI / 2 pour montrer la face avant de la pochette
export const FACE_OFFSET_ANGLE = Math.PI / 2 + Math.PI;