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

const BOOMBOX_POS = new THREE.Vector3(1.15, -0.15, 0);

function PortfolioApp() {
  const containerRef = useRef(null);

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
    camera.position.set(0, 0.8, 4.4);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;

    // 2. Éclairage
    scene.add(new THREE.AmbientLight(0xffffff, 2.0));
    const dirLight = new THREE.DirectionalLight(0x00f0ff, 3.2);
    dirLight.position.set(4, 5, 5);
    scene.add(dirLight);

    const gltfLoader = new GLTFLoader();
    const textureLoader = new THREE.TextureLoader();

    const items = [];
    const clickableMeshes = [];

    let boombox = null;
    let hoveredItem = null;

    // 3. Chargement de la BOOMBOX
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
          const basePos = new THREE.Vector3(baseX, 0, 0);
          const baseCaseScale = 0.5;

          jewelCase.scale.setScalar(baseCaseScale);
          jewelCase.position.copy(basePos);

          // Ajustement local du CD à l'intérieur du boîtier (à affiner selon ton cd.glb)
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

          // Hiérarchie : cd enfant de jewelCase
          jewelCase.add(cd);
          scene.add(jewelCase);

          // Position avancée vers la caméra quand survolé
          const dirToCam = new THREE.Vector3()
            .subVectors(camera.position, basePos)
            .normalize();
          const hoverPos = basePos.clone().addScaledVector(dirToCam, 0.9);

          const itemData = {
            id: project.id,
            jewelCase,
            cd,
            basePos,
            hoverPos,
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

    // 5. Raycaster sur la fenêtre (évite d'être bloqué par un overlay UI)
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

      if (hoveredItem && hoveredItem !== hitItem) {
        hoveredItem.hovered = false;
      }

      hoveredItem = hitItem;

      if (hoveredItem) {
        hoveredItem.hovered = true;
        document.body.style.cursor = 'pointer';
        setTooltip({
          visible: true,
          x: event.clientX,
          y: event.clientY,
        });
      } else {
        document.body.style.cursor = 'default';
        setTooltip((prev) => (prev.visible ? { ...prev, visible: false } : prev));
      }
    };

    const handleClick = (event) => {
      updatePointer(event);
      raycaster.setFromCamera(pointer, camera);

      const hits = raycaster.intersectObjects(clickableMeshes, false);
      if (hits.length > 0) {
        const item = hits[0].object.userData.itemData;
        if (item) {
          console.log('Clic sur le projet :', item.id);
        }
      }
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('click', handleClick);

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
        const smooth = 1 - Math.exp(-10 * delta);

        // 1) Rotation uniquement quand la pochette n'est pas survolée
        if (!item.hovered) {
          item.jewelCase.rotation.y += 0.7 * delta;
        }

        // 2) Avancée vers la caméra quand survolée (sinon retour à basePos)
        const targetPos = item.hovered ? item.hoverPos : item.basePos;
        item.jewelCase.position.lerp(targetPos, smooth);

        // 3) Léger grossissement au survol
        const targetScale = item.hovered
          ? item.baseCaseScale * 1.15
          : item.baseCaseScale;
        const nextScale = THREE.MathUtils.lerp(
          item.jewelCase.scale.x,
          targetScale,
          smooth
        );
        item.jewelCase.scale.setScalar(nextScale);
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
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('click', handleClick);
      document.body.style.cursor = 'default';
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