import * as THREE from 'three';
import {
  BOOMBOX_POS,
  BOOMBOX_SCALE,
  BOOMBOX_ACTIVE_POS,
  BOOMBOX_ACTIVE_SCALE,
  SELECTED_CASE_POS,
  FACE_OFFSET_ANGLE,
  CASE_OPEN_AXIS,
  CASE_OPEN_ANGLE,
  CD_STEP_RIGHT_X,
  CD_STEP_BACK_Z,
  SPEAKERS_PULSE_DELAY,
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
    const hasAnySelected = activeId !== null;

    let shouldPulseSpeakers = false;

    items.forEach((item) => {
      const isSelected = activeId === item.project.id;
      const hasOtherSelected = hasAnySelected && !isSelected;

      // Chrono propre à l'état sélectionné pour séquencer les étapes
      if (isSelected) {
        item.selectElapsed += delta;
      } else {
        item.selectElapsed = 0;
        item.cdArrivedAt = null;
      }

      // 1. Position et zoom de la jaquette
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

      // 2. Garde X et Z à 0 sur le boîtier principal, et oriente vers la caméra si survolé / sélectionné
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

      // 3. Ouverture horizontale de Case_Front (axe 'x')
      if (item.caseFront) {
        const shouldOpenFront = isSelected && item.selectElapsed >= 0.25;
        const baseRot = item.caseFront.userData.baseRot ?? {
          x: item.caseFront.rotation.x,
          y: item.caseFront.rotation.y,
          z: item.caseFront.rotation.z,
        };
        item.caseFront.userData.baseRot = baseRot;

        const targetX =
          CASE_OPEN_AXIS === 'x' && shouldOpenFront
            ? baseRot.x + CASE_OPEN_ANGLE
            : baseRot.x;
        const targetY =
          CASE_OPEN_AXIS === 'y' && shouldOpenFront
            ? baseRot.y + CASE_OPEN_ANGLE
            : baseRot.y;
        const targetZ =
          CASE_OPEN_AXIS === 'z' && shouldOpenFront
            ? baseRot.z + CASE_OPEN_ANGLE
            : baseRot.z;

        item.caseFront.rotation.x = THREE.MathUtils.lerp(
          item.caseFront.rotation.x,
          targetX,
          smooth
        );
        item.caseFront.rotation.y = THREE.MathUtils.lerp(
          item.caseFront.rotation.y,
          targetY,
          smooth
        );
        item.caseFront.rotation.z = THREE.MathUtils.lerp(
          item.caseFront.rotation.z,
          targetZ,
          smooth
        );
      }

      // 4. CD : avance légèrement sur la droite (x), puis recule vers l'arrière (z)
      const stepRightCd = isSelected && item.selectElapsed >= 0.55;
      const stepBackCd = isSelected && item.selectElapsed >= 0.85;

      const targetCdX = stepRightCd
        ? item.cdBasePos.x + CD_STEP_RIGHT_X
        : item.cdBasePos.x;
      const targetCdZ = stepBackCd
        ? item.cdBasePos.z + CD_STEP_BACK_Z
        : item.cdBasePos.z;

      item.cd.position.x = THREE.MathUtils.lerp(
        item.cd.position.x,
        targetCdX,
        smooth
      );
      item.cd.position.z = THREE.MathUtils.lerp(
        item.cd.position.z,
        targetCdZ,
        smooth
      );
      item.cd.position.y = THREE.MathUtils.lerp(
        item.cd.position.y,
        item.cdBasePos.y,
        smooth
      );

      // Détecte l'arrivée du CD et déclenche les speakers après SPEAKERS_PULSE_DELAY (0.5s)
      if (stepBackCd) {
        const reachedBack = Math.abs(item.cd.position.z - targetCdZ) < 0.06;
        if (reachedBack && item.cdArrivedAt === null) {
          item.cdArrivedAt = item.selectElapsed;
        }
        if (
          item.cdArrivedAt !== null &&
          item.selectElapsed - item.cdArrivedAt >= SPEAKERS_PULSE_DELAY
        ) {
          shouldPulseSpeakers = true;
        }
      }
    });

    // 5. Boombox : pas de rotation continuous ; avance et se place à droite quand un projet est actif
    if (state.boombox) {
      const targetBoomboxPos = hasAnySelected ? BOOMBOX_ACTIVE_POS : BOOMBOX_POS;
      const targetBoomboxScale = hasAnySelected
        ? BOOMBOX_ACTIVE_SCALE
        : BOOMBOX_SCALE;

      state.boombox.position.lerp(targetBoomboxPos, smooth);

      const nextBoomboxScale = THREE.MathUtils.lerp(
        state.boombox.scale.x,
        targetBoomboxScale,
        smooth
      );
      state.boombox.scale.setScalar(nextBoomboxScale);
    }

    // 6. Speakers : pulsation après l'arrivée du CD + 0.5s
    if (state.speakers && state.speakersBaseScale) {
      const pulseFactor = shouldPulseSpeakers
        ? 1 + Math.sin(elapsed * 10) * 0.045
        : 1;
      const targetSx = state.speakersBaseScale.x * pulseFactor;
      const targetSy = state.speakersBaseScale.y * pulseFactor;
      const targetSz = state.speakersBaseScale.z * pulseFactor;

      state.speakers.scale.x = THREE.MathUtils.lerp(
        state.speakers.scale.x,
        targetSx,
        smooth
      );
      state.speakers.scale.y = THREE.MathUtils.lerp(
        state.speakers.scale.y,
        targetSy,
        smooth
      );
      state.speakers.scale.z = THREE.MathUtils.lerp(
        state.speakers.scale.z,
        targetSz,
        smooth
      );
    }

    renderer.render(scene, camera);
  };

  animate();

  return () => {
    cancelAnimationFrame(animationFrameId);
  };
}