import React, { useState } from 'react';
import { Control } from '../../context/types';

interface ModernButtonProps {
  control: Control;
  onClick?: () => void;
  executionMode?: 'design' | 'run';
}

const ModernButton: React.FC<ModernButtonProps> = ({
  control,
  onClick,
  executionMode = 'design',
}) => {
  const [isPressed, setIsPressed] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseDown = () => {
    if (executionMode === 'run') {
      setIsPressed(true);
    }
  };

  const handleMouseUp = () => {
    setIsPressed(false);
  };

  const handleClick = (e: React.MouseEvent) => {
    if (executionMode === 'run') {
      e.stopPropagation();
      onClick?.();

      // Ripple effect
      const button = e.currentTarget;
      const ripple = document.createElement('div');
      const rect = button.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height);
      const x = e.clientX - rect.left - size / 2;
      const y = e.clientY - rect.top - size / 2;

      ripple.style.width = ripple.style.height = size + 'px';
      ripple.style.left = x + 'px';
      ripple.style.top = y + 'px';
      ripple.className = 'ripple';

      button.appendChild(ripple);

      setTimeout(() => ripple.remove(), 600);
    }
  };

  const getButtonStyle = (): React.CSSProperties => {
    const baseStyle: React.CSSProperties = {
      position: 'absolute',
      left: control.x,
      top: control.y,
      width: control.width,
      height: control.height,
      fontSize: control.font?.size || 13,
      fontFamily: control.font?.name || 'Inter, sans-serif',
      fontWeight: control.font?.bold ? 600 : 400,
      cursor: executionMode === 'run' ? 'pointer' : 'move',
      userSelect: 'none',
      transition: 'all 0.2s ease',
      overflow: 'hidden',
      borderRadius: '8px',
      border: 'none',
      outline: 'none',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
    };

    // Modern color scheme
    let backgroundColor = '#2563EB'; // Primary blue
    let textColor = '#FFFFFF';
    let shadowColor = 'rgba(37, 99, 235, 0.3)';

    if (control.style === 1) {
      // Graphical style
      backgroundColor = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
    }

    if (!control.enabled) {
      backgroundColor = '#E5E7EB';
      textColor = '#9CA3AF';
      shadowColor = 'rgba(0, 0, 0, 0.1)';
    } else if (isPressed) {
      backgroundColor = '#1D4ED8';
      shadowColor = 'rgba(29, 78, 216, 0.4)';
    } else if (isHovered) {
      backgroundColor = '#3B82F6';
      shadowColor = 'rgba(59, 130, 246, 0.4)';
    }

    return {
      ...baseStyle,
      background: backgroundColor,
      color: textColor,
      boxShadow: isPressed
        ? `inset 0 2px 4px rgba(0, 0, 0, 0.2)`
        : `0 4px 12px ${shadowColor}, 0 1px 3px rgba(0, 0, 0, 0.08)`,
      transform: isPressed ? 'translateY(1px) scale(0.98)' : 'translateY(0) scale(1)',
    };
  };

  return (
    <button
      style={getButtonStyle()}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={() => {
        setIsHovered(false);
        setIsPressed(false);
      }}
      onMouseEnter={() => setIsHovered(true)}
      onClick={handleClick}
      disabled={!control.enabled}
      className="modern-button"
    >
      {/* Icon support */}
      {control.picture && (
        <span className="mr-2">
          <img src={control.picture} alt="" className="w-4 h-4" />
        </span>
      )}

      {/* Button text */}
      <span className="relative z-10">{control.caption}</span>

      {/* Focus ring */}
      {control.default && executionMode === 'run' && (
        <div className="absolute inset-0 rounded-lg ring-2 ring-offset-2 ring-blue-500 ring-opacity-50" />
      )}

      {/* Hover glow effect */}
      {isHovered && control.enabled && (
        <div className="absolute inset-0 rounded-lg bg-white opacity-10" />
      )}

      <style jsx>{`
        .modern-button {
          position: relative;
        }

        .modern-button .ripple {
          position: absolute;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.6);
          transform: scale(0);
          animation: ripple-animation 0.6s ease-out;
          pointer-events: none;
        }

        @keyframes ripple-animation {
          to {
            transform: scale(4);
            opacity: 0;
          }
        }
      `}</style>
    </button>
  );
};

export default ModernButton;
