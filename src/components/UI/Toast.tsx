import React, { useEffect, useState } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastProps {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
  onClose: (id: string) => void;
  action?: {
    label: string;
    onClick: () => void;
  };
}

const Toast: React.FC<ToastProps> = ({
  id,
  type,
  title,
  message,
  duration = 5000,
  onClose,
  action,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    // Enter animation
    requestAnimationFrame(() => {
      setIsVisible(true);
    });

    // Auto dismiss
    if (duration > 0) {
      const timer = setTimeout(() => {
        handleClose();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [duration]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      onClose(id);
    }, 300);
  };

  const getTypeStyles = () => {
    const styles = {
      success: {
        icon: <CheckCircle className="w-5 h-5" />,
        bg: 'bg-green-50 border-green-200',
        text: 'text-green-800',
        iconColor: 'text-green-500',
        progress: 'bg-green-500',
      },
      error: {
        icon: <XCircle className="w-5 h-5" />,
        bg: 'bg-red-50 border-red-200',
        text: 'text-red-800',
        iconColor: 'text-red-500',
        progress: 'bg-red-500',
      },
      warning: {
        icon: <AlertTriangle className="w-5 h-5" />,
        bg: 'bg-yellow-50 border-yellow-200',
        text: 'text-yellow-800',
        iconColor: 'text-yellow-500',
        progress: 'bg-yellow-500',
      },
      info: {
        icon: <Info className="w-5 h-5" />,
        bg: 'bg-blue-50 border-blue-200',
        text: 'text-blue-800',
        iconColor: 'text-blue-500',
        progress: 'bg-blue-500',
      },
    };
    return styles[type];
  };

  const typeStyles = getTypeStyles();

  return (
    <div
      className={`
        relative max-w-sm w-full 
        ${typeStyles.bg} border rounded-lg shadow-lg
        transform transition-all duration-300 ease-out
        ${
          isVisible && !isExiting
            ? 'translate-x-0 opacity-100 scale-100'
            : 'translate-x-full opacity-0 scale-95'
        }
      `}
    >
      {/* Progress bar */}
      {duration > 0 && (
        <div className="absolute top-0 left-0 h-1 bg-gray-200 rounded-t-lg overflow-hidden w-full">
          <div
            className={`h-full ${typeStyles.progress} transition-all ease-linear`}
            style={{
              animation: `toast-progress ${duration}ms linear forwards`,
            }}
          />
        </div>
      )}

      <div className="p-4">
        <div className="flex items-start">
          <div className={`flex-shrink-0 ${typeStyles.iconColor}`}>{typeStyles.icon}</div>

          <div className="ml-3 flex-1">
            <h3 className={`text-sm font-semibold ${typeStyles.text}`}>{title}</h3>
            {message && <p className={`mt-1 text-xs ${typeStyles.text} opacity-80`}>{message}</p>}

            {action && (
              <button
                onClick={action.onClick}
                className={`mt-2 text-xs font-medium ${typeStyles.text} hover:underline`}
              >
                {action.label}
              </button>
            )}
          </div>

          <button
            onClick={handleClose}
            className={`flex-shrink-0 ml-2 ${typeStyles.text} opacity-60 hover:opacity-100 transition-opacity`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes toast-progress {
          from {
            width: 100%;
          }
          to {
            width: 0%;
          }
        }
      `}</style>
    </div>
  );
};

export default Toast;
