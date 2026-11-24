import { useEffect } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { CAM_TARGET } from '../data/projects.js';
import { createPortfolioScene } from '../scene/createScene.js';
import { createSceneAnimator } from '../scene/animateScene.js';

export function usePortfolioCanvas({
  containerRef,
  selectedIdRef,
  onSelectProject,
  onTooltipChange,
}) {
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    const { scene, camera, items, clickableMeshes, state } =
      createPortfolioScene();
    camera.aspect = width / height;
    camera.updateProjectionMatrix();

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

    // Raycaster survol + clic fiable (pointerdown / pointerup)
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

      if (state.hoveredItem && state.hoveredItem !== hitItem) {
        state.hoveredItem.hovered = false;
      }

      state.hoveredItem = hitItem;

      if (state.hoveredItem) {
        state.hoveredItem.hovered = true;
        document.body.style.cursor = 'pointer';
        onTooltipChange({
          visible: true,
          x: event.clientX,
          y: event.clientY,
        });
      } else {
        document.body.style.cursor = 'default';
        onTooltipChange((prev) =>
          prev.visible ? { ...prev, visible: false } : prev
        );
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
          onSelectProject(hitItem.project);
        }
      } else if (selectedIdRef.current !== null) {
        // Clic dans le vide : referme la fiche projet
        onSelectProject(null);
      }
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('pointerup', handlePointerUp);

    const stopAnimation = createSceneAnimator({
      renderer,
      scene,
      camera,
      items,
      state,
      selectedIdRef,
    });

    const handleResize = () => {
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    };
    window.addEventListener('resize', handleResize);

    return () => {
      stopAnimation();
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
  }, [containerRef, selectedIdRef, onSelectProject, onTooltipChange]);
}