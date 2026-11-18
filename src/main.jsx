import './style.css';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

// 1. Scène, Caméra et Rendu
const container = document.getElementById('canvas-container');
const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 1, 5);

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
container.appendChild(renderer.domElement);

// Contrôles orbitaux pour tourner autour des objets à la souris
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

// 2. Éclairage
const ambientLight = new THREE.AmbientLight(0xffffff, 1.5);
scene.add(ambientLight);

const pointLight = new THREE.DirectionalLight(0x00f0ff, 3);
pointLight.position.set(5, 5, 5);
scene.add(pointLight);

// 3. Chargement des modèles 3D et des textures
let boombox;
const loader = new GLTFLoader();
const textureLoader = new THREE.TextureLoader();

// A. Chargement de la Boombox (avec rotation)
loader.load(
  '/models/boombox.glb',
  (gltf) => {
    boombox = gltf.scene;
    boombox.scale.set(1.5, 1.5, 1.5);
    boombox.position.set(-2, 0, 0); // Décalée sur la gauche
    scene.add(boombox);
  },
  undefined,
  (error) => {
    console.error('Erreur lors du chargement de la boombox :', error);
  }
);

// B. Chargement de la texture dynamique pour la pochette
const coverTexture = textureLoader.load('/images/pochettes/swp-cover.jpg');
coverTexture.colorSpace = THREE.SRGBColorSpace;
coverTexture.flipY = false;

// C. Chargement du Boîtier (Jewel Case)
loader.load(
  '/models/jewel-case.glb',
  (gltf) => {
    const jewelCase = gltf.scene;
    jewelCase.position.set(2, 0, 0); // Décalé sur la droite

    // Application dynamique de la texture sur le matériau de la face avant
    jewelCase.traverse((child) => {
      if (child.isMesh && child.material.name === 'Mat_CoverFront') {
        child.material = child.material.clone();
        child.material.map = coverTexture;
        child.material.needsUpdate = true;
      }
    });

    scene.add(jewelCase);
  },
  undefined,
  (error) => {
    console.error('Erreur lors du chargement du jewel-case :', error);
  }
);

// D. Chargement du CD séparé
loader.load(
  '/models/cd.glb',
  (gltf) => {
    const cd = gltf.scene;
    cd.position.set(2, 0, 0); // Aligné avec le boîtier
    scene.add(cd);
  },
  undefined,
  (error) => {
    console.error('Erreur lors du chargement du CD :', error);
  }
);

// 4. Boucle d'animation
function animate() {
  requestAnimationFrame(animate);
  
  // Animation de rotation de la boombox
  if (boombox) {
    boombox.rotation.y += 0.005;
  }

  controls.update();
  renderer.render(scene, camera);
}
animate();

// 5. Ajustement responsive
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});