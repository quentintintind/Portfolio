import React from 'react';

export function HoverTooltip({ visible, x, y }) {
  if (!visible) return null;

  return (
    <div
      style={{
        position: 'fixed',
        left: x + 14,
        top: y + 14,
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
  );
}