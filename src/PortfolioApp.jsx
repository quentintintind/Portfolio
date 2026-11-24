import React, { useEffect, useRef, useState } from 'react';
import { usePortfolioCanvas } from './hooks/usePortfolioCanvas.js';
import { HoverTooltip } from './components/HoverTooltip.jsx';
import { ProjectPanel } from './components/ProjectPanel.jsx';

export function PortfolioApp() {
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

  usePortfolioCanvas({
    containerRef,
    selectedIdRef,
    onSelectProject: setSelectedProject,
    onTooltipChange: setTooltip,
  });

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
      <HoverTooltip visible={tooltip.visible} x={tooltip.x} y={tooltip.y} />

      {/* Panneau projet à droite au clic */}
      <ProjectPanel
        project={selectedProject}
        onClose={() => setSelectedProject(null)}
      />
    </div>
  );
}

export default PortfolioApp;