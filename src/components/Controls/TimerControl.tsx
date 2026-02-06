/**
 * VB6 Timer Control - Contrôle Timer VB6 natif
 * Implémentation complète du contrôle Timer avec événements temporisés
 * Compatible 100% avec Visual Basic 6.0
 */

import React, { useEffect, useRef, useState, forwardRef } from 'react';
import { Control } from '../../types/Control';

export interface TimerControlProps {
  control: Control;
  isDesignMode?: boolean;
  onClick?: (e: React.MouseEvent) => void;
  onDoubleClick?: (e: React.MouseEvent) => void;
  onChange?: (value: any) => void;
  onTimer?: () => void; // Événement Timer
}

export const TimerControl = forwardRef<HTMLDivElement, TimerControlProps>(
  ({ control, isDesignMode = false, onClick, onDoubleClick, onChange, onTimer }, ref) => {
    // Propriétés VB6 Timer
    const [interval, setInterval] = useState<number>(control.interval || 0);
    const [enabled, setEnabled] = useState<boolean>(control.enabled !== false);
    const [name, setName] = useState<string>(control.name || 'Timer1');
    const [tag, setTag] = useState<string>(control.tag || '');
    const [index, setIndex] = useState<number | undefined>(control.index);

    // Référence pour le timer
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const startTimeRef = useRef<number>(0);
    const elapsedTimeRef = useRef<number>(0);

    // Gestion du timer
    useEffect(() => {
      // Nettoyer le timer existant
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

      // Démarrer le nouveau timer si activé et interval > 0
      if (enabled && interval > 0 && !isDesignMode) {
        startTimeRef.current = Date.now();

        timerRef.current = setInterval(() => {
          elapsedTimeRef.current = Date.now() - startTimeRef.current;

          // Déclencher l'événement Timer
          if (onTimer) {
            onTimer();
          }

          // Déclencher l'événement VB6 global
          if (typeof window !== 'undefined' && (window as any).VB6Runtime?.fireEvent) {
            (window as any).VB6Runtime.fireEvent(name, 'Timer', {
              elapsed: elapsedTimeRef.current,
              interval: interval,
            });
          }

          // Notifier le changement
          onChange?.({
            event: 'Timer',
            elapsed: elapsedTimeRef.current,
            interval: interval,
            timestamp: new Date().toISOString(),
          });
        }, interval);
      }

      // Cleanup
      return () => {
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
      };
    }, [enabled, interval, isDesignMode, onTimer, onChange, name]);

    // Méthodes VB6 exposées
    const vb6Methods = {
      // Propriétés
      get Name() {
        return name;
      },
      set Name(value: string) {
        setName(value);
        if (control) control.name = value;
      },

      get Interval() {
        return interval;
      },
      set Interval(value: number) {
        const newInterval = Math.max(0, Math.min(65535, Math.floor(value))); // VB6 limits: 0-65535 ms
        setInterval(newInterval);
        if (control) control.interval = newInterval;
      },

      get Enabled() {
        return enabled;
      },
      set Enabled(value: boolean) {
        setEnabled(Boolean(value));
        if (control) control.enabled = Boolean(value);
      },

      get Tag() {
        return tag;
      },
      set Tag(value: string) {
        setTag(String(value));
        if (control) control.tag = String(value);
      },

      get Index() {
        return index;
      },
      set Index(value: number | undefined) {
        setIndex(value);
        if (control) control.index = value;
      },

      // Propriétés en lecture seule
      get ElapsedTime() {
        return elapsedTimeRef.current;
      },

      get IsRunning() {
        return timerRef.current !== null;
      },

      // Méthodes VB6
      Start() {
        this.Enabled = true;
      },

      Stop() {
        this.Enabled = false;
      },

      Reset() {
        startTimeRef.current = Date.now();
        elapsedTimeRef.current = 0;
      },

      // Méthode pour obtenir le temps écoulé depuis le dernier déclenchement
      GetElapsedSinceLastTick(): number {
        if (!this.IsRunning) return 0;
        return (Date.now() - startTimeRef.current) % interval;
      },

      // Méthode pour obtenir le nombre de déclenchements
      GetTickCount(): number {
        if (!this.IsRunning || interval === 0) return 0;
        return Math.floor(elapsedTimeRef.current / interval);
      },
    };

    // Exposer les méthodes au parent
    useEffect(() => {
      if (control.ref && typeof control.ref === 'object' && 'current' in control.ref) {
        control.ref.current = vb6Methods;
      }
    }, [control.ref, vb6Methods]);

    // Styles pour le mode design
    const containerStyle: React.CSSProperties = {
      position: 'absolute',
      left: control.x || 0,
      top: control.y || 0,
      width: isDesignMode ? 32 : 0,
      height: isDesignMode ? 32 : 0,
      display: isDesignMode ? 'flex' : 'none',
      alignItems: 'center',
      justifyContent: 'center',
      border: '1px dashed #808080',
      backgroundColor: '#F0F0F0',
      cursor: 'default',
      fontFamily: 'MS Sans Serif, sans-serif',
      fontSize: '20px',
      opacity: control.visible !== false ? 1 : 0.5,
      zIndex: control.zIndex || 'auto',
    };

    const infoStyle: React.CSSProperties = {
      position: 'absolute',
      bottom: '-20px',
      left: '50%',
      transform: 'translateX(-50%)',
      fontSize: '8px',
      color: '#666',
      whiteSpace: 'nowrap',
      pointerEvents: 'none',
    };

    // Le Timer est invisible au runtime (comme en VB6)
    if (!isDesignMode) {
      return null;
    }

    return (
      <div
        ref={ref}
        style={containerStyle}
        onClick={onClick}
        onDoubleClick={onDoubleClick}
        data-control-type="Timer"
        data-control-name={name}
        title={`Timer: ${name}\nInterval: ${interval}ms\nEnabled: ${enabled}`}
      >
        {/* Icône de timer */}
        🕐
        {/* Informations en mode design */}
        <div style={infoStyle}>{interval}ms</div>
        {/* Indicateur d'état */}
        {enabled && interval > 0 && (
          <div
            style={{
              position: 'absolute',
              top: '-2px',
              right: '-2px',
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: '#00FF00',
              border: '1px solid #008000',
            }}
            title="Timer actif"
          />
        )}
      </div>
    );
  }
);

TimerControl.displayName = 'TimerControl';

// Utilitaires Timer VB6
export const TimerUtils = {
  // Créer les propriétés par défaut d'un Timer
  getDefaultProperties(id: number) {
    return {
      id,
      type: 'Timer',
      name: `Timer${id}`,
      x: 100,
      y: 100,
      width: 32,
      height: 32,
      interval: 0,
      enabled: true,
      visible: false, // Invisible au runtime comme en VB6
      tag: '',
      index: undefined,
    };
  },

  // Valider l'intervalle VB6 (0-65535 ms)
  validateInterval(interval: number): number {
    return Math.max(0, Math.min(65535, Math.floor(interval)));
  },

  // Convertir les unités de temps
  convertTimeUnits: {
    secondsToMs: (seconds: number) => seconds * 1000,
    minutesToMs: (minutes: number) => minutes * 60 * 1000,
    hoursToMs: (hours: number) => hours * 60 * 60 * 1000,
    msToSeconds: (ms: number) => ms / 1000,
    msToMinutes: (ms: number) => ms / (60 * 1000),
    msToHours: (ms: number) => ms / (60 * 60 * 1000),
  },

  // Créer des intervalles prédéfinis courants
  commonIntervals: {
    // Intervalles très courts
    VERY_FAST: 50, // 20 fois par seconde
    FAST: 100, // 10 fois par seconde
    ANIMATION: 16, // ~60 FPS

    // Intervalles courts
    TENTH_SECOND: 100, // 1/10 seconde
    QUARTER_SECOND: 250, // 1/4 seconde
    HALF_SECOND: 500, // 1/2 seconde

    // Intervalles standards
    ONE_SECOND: 1000, // 1 seconde
    TWO_SECONDS: 2000, // 2 secondes
    FIVE_SECONDS: 5000, // 5 secondes
    TEN_SECONDS: 10000, // 10 secondes

    // Intervalles longs
    THIRTY_SECONDS: 30000, // 30 secondes
    ONE_MINUTE: 60000, // 1 minute
    FIVE_MINUTES: 300000, // 5 minutes
    TEN_MINUTES: 600000, // 10 minutes

    // Intervalles très longs
    THIRTY_MINUTES: 1800000, // 30 minutes
    ONE_HOUR: 3600000, // 1 heure
  },

  // Formater l'intervalle pour l'affichage
  formatInterval(interval: number): string {
    if (interval === 0) return 'Disabled';
    if (interval < 1000) return `${interval}ms`;
    if (interval < 60000) return `${(interval / 1000).toFixed(1)}s`;
    if (interval < 3600000) return `${(interval / 60000).toFixed(1)}m`;
    return `${(interval / 3600000).toFixed(1)}h`;
  },

  // Calculer la fréquence en Hz
  getFrequency(interval: number): number {
    return interval > 0 ? 1000 / interval : 0;
  },

  // Créer un timer haute précision (utilise requestAnimationFrame si disponible)
  createHighPrecisionTimer(
    callback: () => void,
    interval: number
  ): {
    start: () => void;
    stop: () => void;
    isRunning: () => boolean;
  } {
    let isRunning = false;
    let lastTime = 0;
    let animationId: number | null = null;

    const tick = (currentTime: number) => {
      if (!isRunning) return;

      if (currentTime - lastTime >= interval) {
        callback();
        lastTime = currentTime;
      }

      animationId = requestAnimationFrame(tick);
    };

    return {
      start() {
        if (isRunning) return;
        isRunning = true;
        lastTime = performance.now();
        animationId = requestAnimationFrame(tick);
      },

      stop() {
        isRunning = false;
        if (animationId) {
          cancelAnimationFrame(animationId);
          animationId = null;
        }
      },

      isRunning() {
        return isRunning;
      },
    };
  },
};

export default TimerControl;
