import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import {
  PROJECTS,
  BOOMBOX_POS,
  BOOMBOX_SCALE,
  CAM_POS,
  CAM_TARGET,
} from '../data/projects.js';

export function createPortfolioScene() {
  // 1. Scène et caméra
  const scene = new THREE.Scene();

  // ==========================================================================
  // FOND DE LA SCÈNE (à décommenter / adapter plus tard si tu veux un fond)
  // ==========================================================================
  // Option A : Couleur unie
  // scene.background = new THREE.Color(0x0b0f17);
  //
  // Option B : Image / texture de fond (décommenter et remplacer le chemin)
  // const bgTexture = new THREE.TextureLoader().load('/images/fond.png');
  // bgTexture.colorSpace = THREE.SRGBColorSpace;
  // scene.background = bgTexture;
  //
  // Option C : Brouillard léger pour fondre la profondeur (utile si fond animé / grilles / étoiles)
  // scene.fog = new THREE.FogExp2(0x0b0f17, 0.04);

  const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 1000);
  camera.position.copy(CAM_POS);
  camera.lookAt(CAM_TARGET);

  // 2. Éclairage
  scene.add(new THREE.AmbientLight(0xffffff, 2.0));
  const dirLight = new THREE.DirectionalLight(0x00f0ff, 3.2);
  dirLight.position.set(4, 5, 5);
  scene.add(dirLight);

  const gltfLoader = new GLTFLoader();
  const textureLoader = new THREE.TextureLoader();

  const items = [];
  const clickableMeshes = [];

  const state = {
    boombox: null,
    hoveredItem: null,
  };

  // 3. Chargement de la BOOMBOX
  gltfLoader.load(
    '/models/boombox.glb',
    (gltf) => {
      const boombox = gltf.scene;
      boombox.scale.setScalar(BOOMBOX_SCALE);
      boombox.position.copy(BOOMBOX_POS);
      scene.add(boombox);
      state.boombox = boombox;
    },
    undefined,
    (error) => console.error('Erreur chargement boombox :', error)
  );

  // 4. Chargement des Jewel Cases + CDs
  Promise.all([
    gltfLoader.loadAsync('/models/jewel-case.glb'),
    gltfLoader.loadAsync('/models/cd.glb'),
  ])
    .then(([caseGltf, cdGltf]) => {
      PROJECTS.forEach((project, index) => {
        const jewelCase = caseGltf.scene.clone();
        const cd = cdGltf.scene.clone();

        const baseX = (project.x ?? -1.6) + index * 1.1;
        const basePos = new THREE.Vector3(baseX, 0, 0);
        const bgPos = new THREE.Vector3(baseX, -0.1, -1.35); // arrière-plan quand un autre projet est actif
        const baseCaseScale = 0.5;

        jewelCase.scale.setScalar(baseCaseScale);
        jewelCase.position.copy(basePos);
        jewelCase.rotation.set(0, 0, 0);

        // CD enfant de jewelCase, sans rotation
        cd.position.set(0, -0.05, -0.02);
        cd.rotation.set(0, 0, 0);
        cd.scale.setScalar(1);

        // Application de la pochette
        if (project.coverUrl) {
          const coverTexture = textureLoader.load(project.coverUrl);
          coverTexture.colorSpace = THREE.SRGBColorSpace;
          coverTexture.flipY = false;

          jewelCase.traverse((child) => {
            if (
              child.isMesh &&
              child.material &&
              (child.material.name === 'Mat_CoverFront' ||
                child.material.name.toLowerCase().includes('cover'))
            ) {
              child.material = child.material.clone();
              child.material.map = coverTexture;
              child.material.needsUpdate = true;
            }
          });
        }

        jewelCase.add(cd);
        scene.add(jewelCase);

        const dirToCam = new THREE.Vector3()
          .subVectors(camera.position, basePos)
          .normalize();
        const hoverPos = basePos.clone().addScaledVector(dirToCam, 0.85);

        const itemData = {
          project,
          jewelCase,
          cd,
          basePos,
          hoverPos,
          bgPos,
          baseCaseScale,
          hovered: false,
        };

        jewelCase.traverse((child) => {
          if (child.isMesh) {
            child.userData.itemData = itemData;
            clickableMeshes.push(child);
          }
        });

        items.push(itemData);
      });
    })
    .catch((error) => console.error('Erreur chargement CD / boîtier :', error));

  return {
    scene,
    camera,
    items,
    clickableMeshes,
    state,
  };
}