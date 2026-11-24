import * as THREE from 'three';
import {
  BOOMBOX_POS,
  SELECTED_CASE_POS,
  FACE_OFFSET_ANGLE,
} from '../data/projects.js';

function normalizeAngle(angle) {
  let a = angle;
  while (a > Math.PI) a -= Math.PI * 2;
  while (a < -Math.PI) a += Math.PI * 2;
  return a;
}

export function createSceneAnimator({
  renderer,
  scene,
  camera,
  items,
  state,
  selectedIdRef,
}) {
  const clock = new THREE.Clock();
  let animationFrameId;

  const animate = () => {
    animationFrameId = requestAnimationFrame(animate);
    const delta = Math.min(clock.getDelta(), 0.05);
    const elapsed = clock.getElapsedTime();
    const smooth = 1 - Math.exp(-9 * delta);
    const activeId = selectedIdRef.current;

    // ========================================================================
    // ZONE D'ANIMATION 1 : LA BOOMBOX
    // ========================================================================
    if (state.boombox) {
      state.boombox.rotation.y += 0.25 * delta;
      // Exemple à décommenter/adapter plus tard :
      // state.boombox.position.y = BOOMBOX_POS.y + Math.sin(elapsed * 2) * 0.04;
    }

    // ========================================================================
    // ZONE D'ANIMATION 2 : LE FOND (si tu ajoutes un mesh/particules/fond)
    // ========================================================================
    // Ex : bgMesh.rotation.z += 0.05 * delta;

    items.forEach((item) => {
      const isSelected = activeId === item.project.id;
      const hasOtherSelected = activeId !== null && !isSelected;

      // Position et zoom selon l'état (sélectionnée à gauche / autre en arrière-plan / survolée / repos)
      let targetPos = item.basePos;
      let targetScale = item.baseCaseScale;

      if (isSelected) {
        // <-- POSITIONNEMENT DE LA JAQUETTE AU CLIC (via SELECTED_CASE_POS)
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

      // Toujours ramener X et Z à 0 pour éviter que la pochette ne s'incline de travers
      item.jewelCase.rotation.x = THREE.MathUtils.lerp(
        item.jewelCase.rotation.x,
        0,
        smooth
      );
      item.jewelCase.rotation.z = THREE.MathUtils.lerp(
        item.jewelCase.rotation.z,
        0,
        smooth
      );

      // Orientation Y : face caméra (horizontale) si survolée ou sélectionnée, sinon rotation continue
      if (item.hovered || isSelected) {
        const dx = camera.position.x - item.jewelCase.position.x;
        const dz = camera.position.z - item.jewelCase.position.z;
        const targetYaw = Math.atan2(dx, dz) + FACE_OFFSET_ANGLE;
        const currentYaw = item.jewelCase.rotation.y;
        const deltaYaw = normalizeAngle(targetYaw - currentYaw);

        item.jewelCase.rotation.y = currentYaw + deltaYaw * smooth;
      } else {
        item.jewelCase.rotation.y += 0.7 * delta;
      }

      // ======================================================================
      // ZONE D'ANIMATION 3 : LE CD À L'INTÉRIEUR DU BOÎTIER (`item.cd`)
      // ======================================================================
      // Ex :
      // const targetCdX = isSelected ? 0.35 : 0;
      // item.cd.position.x = THREE.MathUtils.lerp(item.cd.position.x, targetCdX, smooth);
    });

    renderer.render(scene, camera);
  };

  animate();

  return () => {
    cancelAnimationFrame(animationFrameId);
  };
}