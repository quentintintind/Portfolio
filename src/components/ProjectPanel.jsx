import React from 'react';

export function ProjectPanel({ project, onClose }) {
  if (!project) return null;

  return (
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
            onClick={onClose}
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
          {project.title}
        </h2>

        <p style={{ lineHeight: 1.6, opacity: 0.88, fontSize: '0.95rem' }}>
          {project.description}
        </p>
      </div>

      <p style={{ fontSize: '12px', opacity: 0.55 }}>
        Clique sur une autre pochette ou dans le vide pour revenir.
      </p>
    </aside>
  );
}