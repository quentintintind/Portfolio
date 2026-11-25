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
  CD_EJECT_SMOOTH,
  CD_BOOMBOX_DROP_OFFSET,
  CD_ARRIVE_THRESHOLD,
  BOOMBOX_CD_INSERT_OFFSET,
  BOOMBOX_CD_FLAT_ROTATION,
  BOOMBOX_CD_SPIN_SPEED,
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

  const dropWorldPos = new THREE.Vector3();
  const dropLocalPos = new THREE.Vector3();
  const boomboxCdTargetLocal = new THREE.Vector3();

  const animate = () => {
    animationFrameId = requestAnimationFrame(animate);
    const delta = Math.min(clock.getDelta(), 0.05);
    const elapsed = clock.getElapsedTime();
    const smooth = 1 - Math.exp(-9 * delta);
    const ejectSmooth = 1 - Math.exp(-CD_EJECT_SMOOTH * delta);
    const activeId = selectedIdRef.current;
    const hasAnySelected = activeId !== null;

    let shouldPulseSpeakers = false;

    // 1. Boombox : position et taille (repos vs projet actif), sans rotation continue
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

    // Réinitialise le CD dédié à la boombox quand aucun projet n'est sélectionné
    if (!hasAnySelected && state.boomboxCd) {
      state.boomboxCd.visible = false;
      state.boomboxCd.position.set(0, 0, 0);
      state.boomboxCd.rotation.set(0, 0, 0);
    }

    items.forEach((item) => {
      const isSelected = activeId === item.project.id;
      const hasOtherSelected = hasAnySelected && !isSelected;

      if (isSelected) {
        item.selectElapsed += delta;
      } else {
        item.selectElapsed = 0;
        item.cdArrivedAt = null;
      }

      // 2. Position et zoom de la jaquette
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

      // 3. Orientation de la jaquette
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

      // 4. Ouverture de Case_Front
      if (item.caseFront) {
        const shouldOpenFront = isSelected && item.selectElapsed >= 0.2;
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

      // 5. Relais du CD : sortie de la pochette -> point devant la boombox -> relais vers state.boomboxCd
      if (isSelected) {
        const t = item.selectElapsed;
        const stepOut = t >= 0.45;
        const stepToDropPoint = t >= 0.85;

        if (!item.cdHandedOff) {
          item.cd.visible = true;

          if (stepToDropPoint && state.boombox) {
            dropWorldPos
              .copy(state.boombox.position)
              .add(CD_BOOMBOX_DROP_OFFSET);
            dropLocalPos.copy(dropWorldPos);
            item.jewelCase.worldToLocal(dropLocalPos);
            item.cd.position.lerp(dropLocalPos, smooth);

            if (item.cd.position.distanceTo(dropLocalPos) < CD_ARRIVE_THRESHOLD) {
              item.cdHandedOff = true;
              item.cd.visible = false;

              if (state.boomboxCd) {
                state.boomboxCd.visible = true;
                state.boomboxCd.position.copy(CD_BOOMBOX_DROP_OFFSET);
                state.boomboxCd.rotation.set(0, 0, 0);
              }
            }
          } else {
            dropLocalPos.set(
              item.cdBasePos.x + (stepOut ? CD_STEP_RIGHT_X : 0),
              item.cdBasePos.y,
              item.cdBasePos.z + (stepOut ? CD_STEP_BACK_Z : 0)
            );
            item.cd.position.lerp(dropLocalPos, smooth);
          }
        } else if (state.boomboxCd) {
          boomboxCdTargetLocal.copy(BOOMBOX_CD_INSERT_OFFSET);
          state.boomboxCd.position.lerp(boomboxCdTargetLocal, smooth);

          state.boomboxCd.rotation.x = THREE.MathUtils.lerp(
            state.boomboxCd.rotation.x,
            BOOMBOX_CD_FLAT_ROTATION.x,
            smooth
          );
          state.boomboxCd.rotation.z = THREE.MathUtils.lerp(
            state.boomboxCd.rotation.z,
            BOOMBOX_CD_FLAT_ROTATION.z,
            smooth
          );
          state.boomboxCd.rotation.y += BOOMBOX_CD_SPIN_SPEED * delta;

          if (item.cdArrivedAt === null) {
            item.cdArrivedAt = t;
          }
          if (t - item.cdArrivedAt >= SPEAKERS_PULSE_DELAY) {
            shouldPulseSpeakers = true;
          }
        }
      } else {
        // Retour rapide du CD de la pochette quand on clique ailleurs
        item.cdHandedOff = false;
        item.cd.visible = true;
        item.cd.position.lerp(item.cdBasePos, ejectSmooth);
        item.cd.rotation.x = THREE.MathUtils.lerp(
          item.cd.rotation.x,
          0,
          ejectSmooth
        );
        item.cd.rotation.y = THREE.MathUtils.lerp(
          item.cd.rotation.y,
          0,
          ejectSmooth
        );
        item.cd.rotation.z = THREE.MathUtils.lerp(
          item.cd.rotation.z,
          0,
          ejectSmooth
        );
      }
    });

    // 6. Speakers : pulsation après arrivée + SPEAKERS_PULSE_DELAY (0.5s)
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