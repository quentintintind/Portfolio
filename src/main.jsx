import React, { useEffect, useRef, useState } from 'react';
import ReactDOM from 'react-dom/client';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import './style.css';

const PROJECTS = [
  {
    id: 'halo-remix',
    coverUrl: '/images/HALOREMIX.png',
    x: -2.2,
  },
  {
    id: 'petite-mariie',
    coverUrl: '/images/petitemariie.png',
    x: -1.1,
  },
  {
    id: 'zoe-remix',
    coverUrl: '/images/zoeremixcovr.png',
    x: 0.0,
  },
];

// Position cible de la boombox (rapprochée du centre)
const BOOMBOX_POS = new THREE.Vector3(1.15, -0.15, 0);

function PortfolioApp() {
  const containerRef = useRef(null);

  // État React uniquement pour afficher/déplacer le petit badge "ouvrir ?" à côté du curseur
  const [tooltip, setTooltip] = useState({
    visible: false,
    x: 0,
    y: 0,
  });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    // 1. Scène, caméra et renderer
    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
    camera.position.set(0, 0.8, 4.2);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;

    // 2. Éclairage
    scene.add(new THREE.AmbientLight(0xffffff, 1.9));
    const dirLight = new THREE.DirectionalLight(0x00f0ff, 3.2);
    dirLight.position.set(4, 5, 5);
    scene.add(dirLight);

    const gltfLoader = new GLTFLoader();
    const textureLoader = new THREE.TextureLoader();

    // Données interactives pour chaque projet
    // { jewelCase, cd, hitMeshes, baseScale, hovered, animState, animProgress, cdStartPos, cdEjectPos }
    const items = [];
    const clickableMeshes = [];

    let boombox = null;
    let hoveredItem = null;

    // 3. Chargement de la BOOMBOX (rapprochée)
    gltfLoader.load(
      '/models/boombox.glb',
      (gltf) => {
        boombox = gltf.scene;
        boombox.scale.setScalar(1.45);
        boombox.position.copy(BOOMBOX_POS);
        scene.add(boombox);
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
          const baseCaseScale = 0.5;
          const baseCdScale = 0.375;

          jewelCase.scale.setScalar(baseCaseScale);
          jewelCase.position.set(baseX, 0, 0);

          cd.scale.setScalar(baseCdScale);
          cd.position.set(baseX + 0.3, 0, 0.1);

          // Texture de pochette si disponible
          if (project.coverUrl) {
            const coverTexture = textureLoader.load(project.coverUrl);
            coverTexture.colorSpace = THREE.SRGBColorSpace;
            coverTexture.flipY = false;

            jewelCase.traverse((child) => {
              if (
                child.isMesh &&
                child.material &&
                (child.material.name === 'Mat_CoverFront' ||
                  child.material.name.includes('Cover'))
              ) {
                child.material = child.material.clone();
                child.material.map = coverTexture;
                child.material.needsUpdate = true;
              }
            });
          }

          scene.add(jewelCase, cd);

          const itemData = {
            id: project.id,
            jewelCase,
            cd,
            baseCaseScale,
            baseCdScale,
            hovered: false,
            // 'idle' | 'ejecting' | 'flying' | 'inserted'
            animState: 'idle',
            animProgress: 0,
            cdStartPos: cd.position.clone(),
            cdEjectPos: new THREE.Vector3(baseX + 0.95, 0.15, 0.55),
          };

          // On rattache une référence vers itemData sur chaque mesh de la jewelCase pour le raycast
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

    // 5. Raycaster pour le survol et le clic sur la jewel case
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();

    const updatePointer = (event) => {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    };

    const handlePointerMove = (event) => {
      updatePointer(event);
      raycaster.setFromCamera(pointer, camera);

      const hits = raycaster.intersectObjects(clickableMeshes, false);
      const hitItem = hits.length > 0 ? hits[0].object.userData.itemData : null;

      // Reset ancien hover
      if (hoveredItem && hoveredItem !== hitItem) {
        hoveredItem.hovered = false;
      }

      hoveredItem = hitItem;

      if (hoveredItem) {
        hoveredItem.hovered = true;
        renderer.domElement.style.cursor = 'pointer';
        setTooltip({
          visible: true,
          x: event.clientX,
          y: event.clientY,
        });
      } else {
        renderer.domElement.style.cursor = 'grab';
        setTooltip((prev) => (prev.visible ? { ...prev, visible: false } : prev));
      }
    };

    const handleClick = (event) => {
      updatePointer(event);
      raycaster.setFromCamera(pointer, camera);

      const hits = raycaster.intersectObjects(clickableMeshes, false);
      if (hits.length > 0) {
        const item = hits[0].object.userData.itemData;
        if (item && item.animState === 'idle') {
          item.animState = 'ejecting';
          item.animProgress = 0;
          item.cdStartPos.copy(item.cd.position);
        }
      }
    };

    renderer.domElement.addEventListener('pointermove', handlePointerMove);
    renderer.domElement.addEventListener('click', handleClick);

    // 6. Boucle d'animation
    const clock = new THREE.Clock();
    let animationFrameId;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const delta = Math.min(clock.getDelta(), 0.05);

      if (boombox) {
        boombox.rotation.y += 0.25 * delta;
      }

      items.forEach((item) => {
        // Grossissement fluide de la jewel case au survol
        const targetScale = item.hovered
          ? item.baseCaseScale * 1.18
          : item.baseCaseScale;
        const currentScale = item.jewelCase.scale.x;
        const nextScale = THREE.MathUtils.lerp(
          currentScale,
          targetScale,
          1 - Math.exp(-10 * delta)
        );
        item.jewelCase.scale.setScalar(nextScale);

        // Rotation continue du CD tant qu'il n'est pas inséré dans la boombox
        if (item.animState !== 'inserted') {
          item.cd.rotation.y += 1.4 * delta;
        }

        // Étape 1 : le CD sort de la case
        if (item.animState === 'ejecting') {
          item.animProgress += delta * 1.4; // ~0.7s
          const t = Math.min(item.animProgress, 1);
          const ease = 1 - Math.pow(1 - t, 3); // easeOutCubic

          item.cd.position.lerpVectors(item.cdStartPos, item.cdEjectPos, ease);

          if (t >= 1) {
            item.animState = 'flying';
            item.animProgress = 0;
            item.cdStartPos.copy(item.cd.position);
          }
        }
        // Étape 2 : le CD part vers la boombox avec un léger arc en Y
        else if (item.animState === 'flying') {
          item.animProgress += delta * 1.1; // ~0.9s
          const t = Math.min(item.animProgress, 1);
          const ease = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;

          const targetPos = boombox ? boombox.position : BOOMBOX_POS;
          item.cd.position.lerpVectors(item.cdStartPos, targetPos, ease);
          item.cd.position.y += Math.sin(t * Math.PI) * 0.45;

          // Le CD rétrécit un peu en entrant dans la boombox
          const flyScale = THREE.MathUtils.lerp(
            item.baseCdScale,
            item.baseCdScale * 0.45,
            ease
          );
          item.cd.scale.setScalar(flyScale);

          if (t >= 1) {
            item.animState = 'inserted';
            item.cd.visible = false; // rentré dans la boombox
          }
        }
      });

      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // 7. Resize
    const handleResize = () => {
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    };
    window.addEventListener('resize', handleResize);

    // 8. Cleanup
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      renderer.domElement.removeEventListener('pointermove', handlePointerMove);
      renderer.domElement.removeEventListener('click', handleClick);
      controls.dispose();
      renderer.dispose();
      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      style={{
        width: '100vw',
        height: '100vh',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {tooltip.visible && (
        <div
          style={{
            position: 'fixed',
            left: tooltip.x + 14,
            top: tooltip.y + 14,
            pointerEvents: 'none',
            background: 'rgba(12, 18, 28, 0.88)',
            color: '#e8fbff',
            border: '1px solid rgba(0, 240, 255, 0.45)',
            borderRadius: '8px',
            padding: '5px 10px',
            fontSize: '13px',
            fontFamily: 'system-ui, sans-serif',
            zIndex: 20,
            backdropFilter: 'blur(6px)',
          }}
        >
          ouvrir ?
        </div>
      )}
    </div>
  );
}

const target =
  document.getElementById('canvas-container') || document.getElementById('root');
if (target) {
  ReactDOM.createRoot(target).render(
    <React.StrictMode>
      <PortfolioApp />
    </React.StrictMode>
  );
}