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
    if (!container) return;

    const scene = new THREE.Scene();
    
    const camera = new THREE.PerspectiveCamera(
      60,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    camera.position.set(0, 1.2, 4.5);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;

    // --- 2. ÉCLAIRAGE ---
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.8);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0x00f0ff, 3);
    directionalLight.position.set(5, 5, 5);
    scene.add(directionalLight);

    // --- 3. CHARGEMENT MODÈLES & TEXTURES ---
    const loader = new GLTFLoader();
    const textureLoader = new THREE.TextureLoader();

    let boombox = null;
    const rotatingCDs = [];

    // A. Chargement de la Boombox (placée à DROITE : X = +2.2)
    loader.load('/models/boombox.glb', (gltf) => {
      boombox = gltf.scene;
      boombox.scale.set(1.4, 1.4, 1.4);
      boombox.position.set(2.2, -0.2, 0); // À droite
      scene.add(boombox);
    });

    // B. Chargement des templates Boîtier & CD (placés à GAUCHE : X = -2.2)
    Promise.all([
      loader.loadAsync('/models/jewel-case.glb'),
      loader.loadAsync('/models/cd.glb')
    ]).then(([caseGltf, cdGltf]) => {
      
      PROJECTS_DATA.forEach((project, index) => {
        const caseGroup = caseGltf.scene.clone();
        const cdGroup = cdGltf.scene.clone();

        // Réduction du CD d'un quart par rapport au boîtier (0.5 * 0.75 = 0.375)
        const caseScale = 0.5;
        const cdScale = 0.375; 

        caseGroup.scale.set(caseScale, caseScale, caseScale);
        cdGroup.scale.set(cdScale, cdScale, cdScale);

        // Ancrage à GAUCHE (-2.2), avec léger décalage si plusieurs projets
        const baseX = -2.2 + (index * 1.8);
        caseGroup.position.set(baseX, 0, 0);
        cdGroup.position.set(baseX + 0.3, 0, 0.1); // Légèrement sorti du boîtier

        // Stockage du CD pour l'animation
        rotatingCDs.push(cdGroup);

        // Texture dynamique de la pochette
        if (project.coverUrl) {
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
        }

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

      // Rotation de la boombox à droite
      if (boombox) {
        boombox.rotation.y += 0.004;
      }

      // Rotation continue des CD à gauche sur l'axe Y
      rotatingCDs.forEach((cd) => {
        cd.rotation.y += 0.015; // Ajuste la vitesse selon tes préférences
      });

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