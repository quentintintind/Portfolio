import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

// 1. Scène, Caméra et Rendu
const container = document.getElementById('canvas-container');
const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 0, 5);

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
container.appendChild(renderer.domElement);

// 2. Éclairage
const ambientLight = new THREE.AmbientLight(0xffffff, 1.5);
scene.add(ambientLight);

const pointLight = new THREE.DirectionalLight(0x00f0ff, 3);
pointLight.position.set(5, 5, 5);
scene.add(pointLight);

// 3. Chargement du modèle 3D
let boombox;
const loader = new GLTFLoader();
loader.load(
  '/models/boombox.glb',
  (gltf) => {
    boombox = gltf.scene;
    boombox.scale.set(1.5, 1.5, 1.5);
    scene.add(boombox);
  },
  undefined,
  (error) => {
    console.error('Erreur lors du chargement du modèle 3D :', error);
  }
);

// 4. Boucle d'animation
function animate() {
  requestAnimationFrame(animate);
  
  if (boombox) {
    boombox.rotation.y += 0.005; // Rotation lente
  }

  renderer.render(scene, camera);
}
animate();

// 5. Ajustement responsive
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});