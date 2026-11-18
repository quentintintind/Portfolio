import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { PROJECTS_DATA } from '../data/projects.js';

export default function ThreeCanvas() {
  const mountRef = useRef(null);

  useEffect(() => {
    // --- 1. SCÈNE, CAMÉRA & RENDERER ---
    const container = mountRef.current;
    const scene = new THREE.Scene();
    
    const camera = new THREE.PerspectiveCamera(
      60,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    camera.position.set(0, 1.5, 5);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;

    // --- 2. ÉCLAIRAGE ---
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.5);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0x00f0ff, 3);
    directionalLight.position.set(5, 5, 5);
    scene.add(directionalLight);

    // --- 3. CHARGEMENT DES TEMPLATES & INSTANCIATION ---
    const loader = new GLTFLoader();
    const textureLoader = new THREE.TextureLoader();

    let boombox = null;

    // A. Chargement de la Boombox (à gauche)
    loader.load('/models/boombox.glb', (gltf) => {
      boombox = gltf.scene;
      boombox.scale.set(1.5, 1.5, 1.5);
      boombox.position.set(-2.5, 0, 0);
      scene.add(boombox);
    });

    // B. Chargement des templates Boîtier et CD, puis génération dynamique des projets
    Promise.all([
      loader.loadAsync('/models/jewel-case.glb'),
      loader.loadAsync('/models/cd.glb')
    ]).then(([caseGltf, cdGltf]) => {
      
      // Pour chaque projet dans ton tableau de données, on instancie un boîtier et un CD
      PROJECTS_DATA.forEach((project) => {
        const caseGroup = caseGltf.scene.clone();
        const cdGroup = cdGltf.scene.clone();

        // Positionnement global du projet dans la scène
        caseGroup.position.set(...project.position);
        cdGroup.position.set(...project.position);

        // Charger la texture spécifique de ce projet et l'injecter dans la face avant
        const coverTexture = textureLoader.load(project.coverUrl);
        coverTexture.colorSpace = THREE.SRGBColorSpace;
        coverTexture.flipY = false;

        caseGroup.traverse((child) => {
          if (child.isMesh && child.material.name === 'Mat_CoverFront') {
            child.material = child.material.clone();
            child.material.map = coverTexture;
            child.material.needsUpdate = true;
          }
        });

        scene.add(caseGroup);
        scene.add(cdGroup);
      });
    }).catch((error) => {
      console.error('Erreur lors du chargement des modèles 3D des boîtiers :', error);
    });

    // --- 4. BOUCLE D'ANIMATION ---
    let animationFrameId;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      if (boombox) {
        boombox.rotation.y += 0.005;
      }

      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // --- 5. RESPONSIVE ---
    const handleResize = () => {
      if (!container) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    // --- 6. NETTOYAGE ---
    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
      if (container && renderer.domElement) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  return (
    <div 
      ref={mountRef} 
      style={{ width: '100vw', height: '100vh', position: 'relative', overflow: 'hidden' }} 
    />
  );
}