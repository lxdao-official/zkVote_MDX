import React from 'react';
import '../WerewolfGame.css';

export const PixelCard = ({ children, title, className = '' }: { children: React.ReactNode; title?: string; className?: string }) => {
  return (
    <div className={`ww-card ${className}`}>
      <div className="ww-card-corner tl"></div>
      <div className="ww-card-corner tr"></div>
      <div className="ww-card-corner bl"></div>
      <div className="ww-card-corner br"></div>
      
      <div className="ww-card-content">
        {title && (
          <div className="ww-card-title">
            <h3>{title}</h3>
          </div>
        )}
        {children}
      </div>
    </div>
  );
};

export const PixelButton = ({ onClick, children, disabled = false, variant = 'primary', className = '' }: { onClick: (e?: React.MouseEvent) => void; children: React.ReactNode; disabled?: boolean; variant?: 'primary' | 'danger' | 'success' | 'parchment'; className?: string }) => {
  const btnClass = variant === 'parchment' ? 'pixel-btn-parchment' : `ww-btn ww-btn-${variant}`;
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${btnClass} ${className}`}
    >
      {children}
    </button>
  );
};
