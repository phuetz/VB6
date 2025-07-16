import React, { createContext, useContext, useCallback, useState, useRef, useEffect } from 'react';
import { shallow } from 'zustand/shallow';
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragOverlay,
  closestCenter,
  CollisionDetection,
  rectIntersection,
  MouseSensor,
} from '@dnd-kit/core';
import { useVB6Store } from '../../stores/vb6Store';
import { useUndoRedo } from '../../hooks/useUndoRedo';

interface DragDropContextType {
  isDragging: boolean;
  dragData: any;
  dropZones: DropZone[];
  registerDropZone: (zone: DropZone) => void;
  unregisterDropZone: (id: string) => void;
  playDropSound: () => void;
  playDragSound: () => void;
  vibrate: (pattern?: number | number[]) => void;
}

// Define a more specific type for dropZones to avoid undefined errors
interface DropZone {
  id: string;
  element: HTMLElement | null;
  accepts: string[];
  onDrop: (data: any, position: { x: number; y: number }) => void;
  highlight: boolean;
  constraints?: {
    snapToGrid?: boolean;
    gridSize?: number;
    allowedAreas?: Array<{ x: number; y: number; width: number; height: number }>;
  };
}

const DragDropContext = createContext<DragDropContextType | null>(null);

export const useDragDrop = () => {
  const context = useContext(DragDropContext);
  if (!context) {
    throw new Error('useDragDrop must be used within a DragDropProvider');
  }
  return context;
};

export const DragDropProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragData, setDragData] = useState<any>(null);
  const [dropZones, setDropZones] = useState<DropZone[]>([]);
  const [activeDropZone, setActiveDropZone] = useState<string | null>(null);
  const [dragPosition, setDragPosition] = useState({ x: 0, y: 0 });
  const [showConstraints, setShowConstraints] = useState(false);
  const [isCtrlPressed, setIsCtrlPressed] = useState(false);

  const audioContextRef = useRef<AudioContext | null>(null);
  const { snapToGrid, gridSize } = useVB6Store(
    state => ({
      snapToGrid: state.snapToGrid,
      gridSize: state.gridSize,
    }),
    shallow
  );
  const { saveState } = useUndoRedo();
  const { addLog } = useVB6Store.getState();

  // Sensors avec support tactile amélioré
  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 8,
      },
    }),
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  // Audio feedback
  const initializeAudioContext = useCallback(() => {
    if (!audioContextRef.current && typeof window !== 'undefined') {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return audioContextRef.current;
  }, []);

  const playSound = useCallback(
    (frequency: number, duration: number, type: 'sine' | 'square' = 'sine') => {
      const audioContext = initializeAudioContext();
      if (!audioContext) return;

      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
      oscillator.type = type;

      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + duration);
    },
    [initializeAudioContext]
  );

  const playDropSound = useCallback(() => {
    playSound(800, 0.1);
    setTimeout(() => playSound(600, 0.1), 50);
  }, [playSound]);

  const playDragSound = useCallback(() => {
    playSound(400, 0.05, 'square');
  }, [playSound]);

  const playErrorSound = useCallback(() => {
    playSound(200, 0.2);
  }, [playSound]);

  // Vibration feedback
  const vibrate = useCallback((pattern: number | number[] = 50) => {
    if ('vibrate' in navigator) {
      navigator.vibrate(pattern);
    }
  }, []);

  // Gestion des raccourcis clavier
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        setIsCtrlPressed(true);
      }
      if (e.key === 'Escape' && isDragging) {
        // Annuler le drag en cours
        setIsDragging(false);
        setDragData(null);
        setActiveDropZone(null);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (!e.ctrlKey && !e.metaKey) {
        setIsCtrlPressed(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handleKeyUp);
    };
  }, [isDragging]);

  // Détection de collision personnalisée
  const customCollisionDetection: CollisionDetection = useCallback(
    args => {
      const rectCollisions = rectIntersection(args);

      // Prioriser les zones de dépôt actives
      if (activeDropZone) {
        const activeZone = rectCollisions.find(collision => collision.id === activeDropZone);
        if (activeZone) return [activeZone];
      }

      return rectCollisions;
    },
    [activeDropZone]
  );

  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const { active } = event;
      const data = active?.data?.current;
      addLog('debug', 'DragDrop', `Drag start event received`, {
        id: active?.id,
        data,
      });

      setIsDragging(true);
      setDragData(data);
      setShowConstraints(true);

      playDragSound();
      vibrate(50);

      // Sauvegarder l'état pour undo/redo
      saveState();
    },
    [playDragSound, vibrate, saveState]
  );

  const handleDragOver = useCallback(
    (event: DragOverEvent) => {
      const { over, delta } = event;
      if (!delta) {
        addLog('warn', 'DragDrop', 'No delta in dragOver event', event);
        return;
      }

      setDragPosition({ x: delta.x, y: delta.y });

      if (over && over.id !== activeDropZone) {
        setActiveDropZone(over.id as string);

        // Feedback visuel et sonore pour la zone active
        const zone = dropZones.find(z => z.id === over.id);
        if (zone && zone.accepts.includes(dragData?.type)) {
          vibrate(20);
          playSound(600, 0.03);
        }
      } else if (!over && activeDropZone) {
        setActiveDropZone(null);
      }
    },
    [activeDropZone, dropZones, dragData, vibrate, playSound, addLog]
  );

  useEffect(() => {
    addLog('info', 'DragDrop', `DragDropProvider initialized with ${dropZones.length} drop zones`);
    return () => addLog('info', 'DragDrop', 'DragDropProvider unmounted');
  }, []);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over, delta } = event;

      setIsDragging(false);
      setShowConstraints(false);

      if (over) {
        addLog('debug', 'DragDrop', `Drop over target: ${over.id}`, { over, active });

        const zone = dropZones.find(z => z.id === over.id);
        if (zone && zone.accepts.includes(dragData?.type)) {
          const dropPosition = { x: delta.x, y: delta.y };

          // Appliquer les contraintes de la zone
          addLog('debug', 'DragDrop', `Applying drop constraints`, {
            constraints: zone.constraints,
            position: dropPosition,
          });
          if (zone.constraints) {
            if (zone.constraints.snapToGrid && zone.constraints.gridSize) {
              dropPosition.x =
                Math.round(dropPosition.x / zone.constraints.gridSize) * zone.constraints.gridSize;
              dropPosition.y =
                Math.round(dropPosition.y / zone.constraints.gridSize) * zone.constraints.gridSize;
            }

            // Vérifier les zones autorisées
            if (zone.constraints.allowedAreas) {
              const isInAllowedArea = zone.constraints.allowedAreas.some(
                area =>
                  dropPosition.x >= area.x &&
                  dropPosition.x <= area.x + area.width &&
                  dropPosition.y >= area.y &&
                  dropPosition.y <= area.y + area.height
              );

              if (!isInAllowedArea) {
                addLog('warn', 'DragDrop', `Drop position out of allowed area`, {
                  position: dropPosition,
                  allowedAreas: zone.constraints.allowedAreas,
                });
                playErrorSound();
                vibrate([100, 50, 100]);
                setDragData(null);
                setActiveDropZone(null);
                return;
              }
            }
          }

          // Gérer la copie avec Ctrl
          const shouldCopy = isCtrlPressed && dragData?.allowCopy;
          const finalData = shouldCopy ? { ...dragData, copy: true } : dragData;
          addLog(
            'info',
            'DragDrop',
            `Dropping ${shouldCopy ? 'copy of' : ''} ${dragData?.type || 'item'}`,
            {
              data: finalData,
              position: dropPosition,
            }
          );

          zone.onDrop(finalData, dropPosition);
          playDropSound();
          vibrate([50, 20, 50]);
        } else {
          addLog('warn', 'DragDrop', `Invalid drop: ${dragData?.type} not accepted by ${over.id}`, {
            accepts: zone?.accepts,
            dragData,
          });
          // Drop invalide
          playErrorSound();
          vibrate([100, 50, 100]);
        }
      } else {
        // Drop en dehors d'une zone valide
        playErrorSound();
        addLog('warn', 'DragDrop', `Drop outside valid drop zone`);
        vibrate(100);
      }

      setDragData(null);
      setActiveDropZone(null);
      addLog('debug', 'DragDrop', `Drag end complete`);
    },
    [dropZones, dragData, isCtrlPressed, playDropSound, playErrorSound, vibrate]
  );

  const registerDropZone = useCallback((zone: DropZone) => {
    setDropZones(prev => [...prev.filter(z => z.id !== zone.id), zone]);
  }, []);

  const unregisterDropZone = useCallback((id: string) => {
    setDropZones(prev => prev.filter(z => z.id !== id));
  }, []);

  const contextValue: DragDropContextType = {
    isDragging,
    dragData,
    dropZones,
    registerDropZone,
    unregisterDropZone,
    playDropSound,
    playDragSound,
    vibrate,
  };

  return (
    <DragDropContext.Provider value={contextValue}>
      <DndContext
        sensors={sensors}
        collisionDetection={customCollisionDetection}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        {children}

        <DragOverlay>
          {isDragging && dragData && (
            <DragPreview data={dragData} isCtrlPressed={isCtrlPressed} position={dragPosition} />
          )}
        </DragOverlay>

        {/* Indicateurs de contraintes */}
        {showConstraints && (
          <ConstraintsOverlay
            activeDropZone={activeDropZone}
            dropZones={dropZones}
            dragData={dragData}
          />
        )}
      </DndContext>
    </DragDropContext.Provider>
  );
};

// Composant de prévisualisation pendant le drag
const DragPreview: React.FC<{
  data: any;
  isCtrlPressed: boolean;
  position: { x: number; y: number };
}> = ({ data, isCtrlPressed, position }) => {
  return (
    <div
      className="pointer-events-none relative select-none"
      style={{
        transform: `rotate(${Math.sin(Date.now() / 200) * 2}deg)`,
        filter: 'drop-shadow(0 10px 20px rgba(0,0,0,0.3))',
      }}
    >
      <div
        className={`bg-white border-2 border-blue-500 rounded-lg p-3 transition-all duration-200 ${
          isCtrlPressed ? 'border-green-500 bg-green-50' : ''
        }`}
        style={{
          minWidth: '80px',
          minHeight: '40px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '12px',
          fontWeight: 'bold',
          color: isCtrlPressed ? '#059669' : '#2563eb',
          animation: 'pulse 1s ease-in-out infinite',
        }}
      >
        {data.icon && <span className="mr-2 text-lg">{data.icon}</span>}
        {data.name || data.type}
        {isCtrlPressed && <span className="ml-2 text-xs bg-green-200 px-1 rounded">COPY</span>}
      </div>

      {/* Indicateur de position */}
      <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-xs bg-black text-white px-2 py-1 rounded">
        {Math.round(position.x)}, {Math.round(position.y)}
      </div>
    </div>
  );
};

// Overlay pour afficher les contraintes et zones de dépôt
const ConstraintsOverlay: React.FC<{
  activeDropZone: string | null;
  dropZones: DropZone[];
  dragData: any;
}> = ({ activeDropZone, dropZones, dragData }) => {
  return (
    <div className="fixed inset-0 pointer-events-none z-40">
      {dropZones.map(zone => {
        const isActive = zone.id === activeDropZone;
        const isValid = zone.accepts.includes(dragData?.type);

        if (!zone.element) return null;

        if (zone.element) {
          const rect = zone.element.getBoundingClientRect();
          return (
            <React.Fragment key={zone.id}>
              <div
                key={zone.id}
                className={`absolute border-2 border-dashed transition-all duration-200 ${
                  isActive && isValid
                    ? 'border-green-500 bg-green-100 bg-opacity-20'
                    : isValid
                      ? 'border-blue-500 bg-blue-100 bg-opacity-10'
                      : 'border-red-500 bg-red-100 bg-opacity-10'
                }`}
                style={{
                  left: rect.left,
                  top: rect.top,
                  width: rect.width,
                  height: rect.height,
                  borderRadius: '8px',
                  animation: isActive ? 'dropZonePulse 1s ease-in-out infinite' : 'none',
                }}
              >
                {/* Indicateur du type de zone */}
                <div
                  className={`absolute top-2 left-2 text-xs px-2 py-1 rounded ${
                    isValid ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'
                  }`}
                >
                  {zone.id}: {zone.accepts.join(', ')}
                </div>
                <div
                  className={`absolute bottom-2 right-2 text-xs px-2 py-1 rounded bg-blue-200 text-blue-800`}
                >
                  x: {Math.round(rect.left)}, y: {Math.round(rect.top)}, w: {Math.round(rect.width)}
                  , h: {Math.round(rect.height)}
                </div>

                {/* Grille si contrainte de grille active */}
                {zone.constraints?.snapToGrid && zone.constraints.gridSize && isActive && (
                  <GridOverlay
                    gridSize={zone.constraints.gridSize}
                    width={rect.width}
                    height={rect.height}
                  />
                )}
              </div>
            </React.Fragment>
          );
        }
        return null;
      })}
    </div>
  );
};

// Overlay de grille pour les contraintes
const GridOverlay: React.FC<{
  gridSize: number;
  width: number;
  height: number;
}> = ({ gridSize, width, height }) => {
  const lines = [];

  // Lignes verticales
  for (let x = 0; x <= width; x += gridSize) {
    lines.push(
      <div
        key={`v-${x}`}
        className="absolute bg-blue-300 opacity-30"
        style={{
          left: x,
          top: 0,
          width: 1,
          height: '100%',
        }}
      />
    );
  }

  // Lignes horizontales
  for (let y = 0; y <= height; y += gridSize) {
    lines.push(
      <div
        key={`h-${y}`}
        className="absolute bg-blue-300 opacity-30"
        style={{
          left: 0,
          top: y,
          width: '100%',
          height: 1,
        }}
      />
    );
  }

  return <div className="absolute inset-0">{lines}</div>;
};
