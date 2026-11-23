import React, { useEffect, useRef, useState } from 'react';
import ReactDOM from 'react-dom/client';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import './style.css';

const PROJECTS = [
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

const BOOMBOX_POS = new THREE.Vector3(1.45, -0.15, -0.2);
const CAM_POS = new THREE.Vector3(0, 0.7, 4.5);
const CAM_TARGET = new THREE.Vector3(-0.15, -0.05, 0);

// Position 3D à droite quand une pochette est sélectionnée
const SELECTED_CASE_POS = new THREE.Vector3(1.15, 0.05, 1.35);

function PortfolioApp() {
  const containerRef = useRef(null);

  const [tooltip, setTooltip] = useState({
    visible: false,
    x: 0,
    y: 0,
  });

  const [selectedProject, setSelectedProject] = useState(null);
  const selectedIdRef = useRef(null);

  // Synchronise la ref avec l'état React pour que Three.js y accède en direct
  useEffect(() => {
    selectedIdRef.current = selectedProject ? selectedProject.id : null;
  }, [selectedProject]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    // 1. Scène, caméra et renderer
    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
    camera.position.copy(CAM_POS);
    camera.lookAt(CAM_TARGET);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(renderer.domElement);

    // Caméra verrouillée (tu peux passer controls.enabled = true si tu veux explorer)
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.copy(CAM_TARGET);
    controls.enabled = false;
    controls.update();

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
        boombox.scale.setScalar(1.35);
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
          const bgPos = new THREE.Vector3(baseX, -0.1, -1.35); // arrière-plan quand un autre projet est actif
          const baseCaseScale = 0.5;

          jewelCase.scale.setScalar(baseCaseScale);
          jewelCase.position.copy(basePos);

          // CD enfant de jewelCase, sans rotation
          cd.position.set(0, -0.05, -0.02);
          cd.rotation.set(0, 0, 0);
          cd.scale.setScalar(0.55);

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

    // 5. Raycaster survol + clic fiable (pointerdown / pointerup)
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    let downPos = { x: 0, y: 0 };

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

    const handlePointerDown = (event) => {
      downPos = { x: event.clientX, y: event.clientY };
    };

    const handlePointerUp = (event) => {
      const dist = Math.hypot(
        event.clientX - downPos.x,
        event.clientY - downPos.y
      );
      if (dist > 6) return; // ignore si c'était un glissement

      updatePointer(event);
      raycaster.setFromCamera(pointer, camera);

      const hits = raycaster.intersectObjects(clickableMeshes, false);
      if (hits.length > 0) {
        const hitItem = hits[0].object.userData.itemData;
        if (hitItem) {
          setSelectedProject(hitItem.project);
        }
      } else if (selectedIdRef.current !== null) {
        // Clic dans le vide : referme la fiche projet
        setSelectedProject(null);
      }
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('pointerup', handlePointerUp);

    // 6. Boucle d'animation
    const clock = new THREE.Clock();
    let animationFrameId;

    // Objets temporaires réutilisés à chaque frame pour orienter face caméra sans allouer en boucle
    const dummyMatrix = new THREE.Matrix4();
    const faceCamQuat = new THREE.Quaternion();
    const tempCamPos = new THREE.Vector3();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const delta = Math.min(clock.getDelta(), 0.05);
      const smooth = 1 - Math.exp(-9 * delta);
      const activeId = selectedIdRef.current;

      if (boombox) {
        boombox.rotation.y += 0.25 * delta;
      }

      items.forEach((item) => {
        const isSelected = activeId === item.project.id;
        const hasOtherSelected = activeId !== null && !isSelected;

        // Position cible selon l'état (sélectionnée à droite / autre en arrière-plan / survolée / repos)
        let targetPos = item.basePos;
        let targetScale = item.baseCaseScale;

        if (isSelected) {
          targetPos = SELECTED_CASE_POS;
          targetScale = item.baseCaseScale * 1.25;
        } else if (hasOtherSelected) {
          targetPos = item.bgPos;
          targetScale = item.baseCaseScale * 0.78;
        } else if (item.hovered) {
          targetPos = item.hoverPos;
          targetScale = item.baseCaseScale * 1.15;
        }

        item.jewelCase.position.lerp(targetPos, smooth);

        const nextScale = THREE.MathUtils.lerp(
          item.jewelCase.scale.x,
          targetScale,
          smooth
        );
        item.jewelCase.scale.setScalar(nextScale);

        // Orientation : face caméra si survolée ou sélectionnée, sinon rotation continue
        if (item.hovered || isSelected) {
          tempCamPos.copy(camera.position);
          dummyMatrix.lookAt(
            item.jewelCase.position,
            tempCamPos,
            item.jewelCase.up
          );
          faceCamQuat.setFromRotationMatrix(dummyMatrix);
          item.jewelCase.quaternion.slerp(faceCamQuat, smooth);
        } else {
          item.jewelCase.rotation.y += 0.7 * delta;
        }
      });

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
      window.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('pointerup', handlePointerUp);
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
      {/* Tooltip au survol */}
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
            zIndex: 20,
            backdropFilter: 'blur(6px)',
          }}
        >
          ouvrir ?
        </div>
      )}

      {/* Panneau projet à droite au clic */}
      {selectedProject && (
        <aside
          style={{
            position: 'fixed',
            top: '24px',
            right: '24px',
            bottom: '24px',
            width: 'min(360px, calc(100vw - 48px))',
            padding: '24px',
            background: 'rgba(10, 15, 24, 0.82)',
            border: '1px solid rgba(0, 240, 255, 0.28)',
            borderRadius: '16px',
            color: '#f3f6fa',
            backdropFilter: 'blur(12px)',
            zIndex: 30,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '12px',
                marginBottom: '16px',
              }}
            >
              <span
                style={{
                  fontSize: '11px',
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  color: '#00f0ff',
                }}
              >
                Projet sélectionné
              </span>
              <button
                type="button"
                onClick={() => setSelectedProject(null)}
                style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  color: '#fff',
                  border: '1px solid rgba(255, 255, 255, 0.18)',
                  borderRadius: '8px',
                  padding: '4px 10px',
                  cursor: 'pointer',
                  fontSize: '12px',
                }}
              >
                Fermer
              </button>
            </div>

            <h2 style={{ fontSize: '1.6rem', marginBottom: '12px' }}>
              {selectedProject.title}
            </h2>

            <p style={{ lineHeight: 1.6, opacity: 0.88, fontSize: '0.95rem' }}>
              {selectedProject.description}
            </p>
          </div>

          <p style={{ fontSize: '12px', opacity: 0.55 }}>
            Clique sur une autre pochette ou dans le vide pour revenir.
          </p>
        </aside>
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