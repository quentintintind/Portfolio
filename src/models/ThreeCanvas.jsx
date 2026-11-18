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

    // --- 3. VARIABLES & CHARGEMENT ---
    const loader = new GLTFLoader();
    const textureLoader = new THREE.TextureLoader();

    let boombox = null;
    const rotatingCDs = []; // Tableau pour stocker les instances de CD à faire tourner

    // A. Chargement de la Boombox (placée sur la DROITE)
    loader.load('/models/boombox.glb', (gltf) => {
      boombox = gltf.scene;
      boombox.scale.set(1.5, 1.5, 1.5);
      boombox.position.set(3.0, 0, 0); // Position X positive = à droite
      scene.add(boombox);
    });

    // B. Chargement des templates Boîtier et CD (placés sur la GAUCHE)
    Promise.all([
      loader.loadAsync('/models/jewel-case.glb'),
      loader.loadAsync('/models/cd.glb')
    ]).then(([caseGltf, cdGltf]) => {
      
      PROJECTS_DATA.forEach((project, index) => {
        const caseGroup = caseGltf.scene.clone();
        const cdGroup = cdGltf.scene.clone();

        const scaleFactor = 0.5;
        caseGroup.scale.set(scaleFactor, scaleFactor, scaleFactor);
        cdGroup.scale.set(scaleFactor, scaleFactor, scaleFactor);

        // Positionnement sur la GAUCHE (décalé selon l'index s'il y a plusieurs projets)
        const posX = -3.0 + (index * 2.5);
        caseGroup.position.set(posX, 0, 0);
        cdGroup.position.set(posX, 0, 0);

        // On ajoute le CD dans le tableau pour l'animer dans la boucle
        rotatingCDs.push(cdGroup);

        // Texture dynamique de la pochette sur le boîtier
        const coverTexture = textureLoader.load(project.coverUrl, (texture) => {
          texture.colorSpace = THREE.SRGBColorSpace;
          texture.flipY = false;
        });

        caseGroup.traverse((child) => {
          if (child.isMesh && (child.material.name === 'Mat_CoverFront' || child.material.name.includes('Cover'))) {
            child.material = child.material.clone();
            child.material.map = coverTexture;
            child.material.needsUpdate = true;
          }
        });

        scene.add(caseGroup);
        scene.add(cdGroup);
      });
    }).catch((error) => {
      console.error('Erreur lors du chargement des modèles 3D :', error);
    });

    // --- 4. BOUCLE D'ANIMATION ---
    let animationFrameId;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      // Rotation de la boombox sur elle-même
      if (boombox) {
        boombox.rotation.y += 0.005;
      }

      // =====================================================================
      // 💿 SECTION DE ROTATION DES CD
      // On parcourt chaque CD instancié pour lui appliquer une rotation sur l'axe Y
      // =====================================================================
      rotatingCDs.forEach((cd) => {
        cd.rotation.y += 0.01; // Modifie cette valeur pour accélérer/ralentir
      });
      // =====================================================================

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