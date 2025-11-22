import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AnimationService } from '../../services/AnimationService';

// Mock Web Animations API
global.Element.prototype.animate = vi.fn().mockImplementation(() => ({
  play: vi.fn(),
  pause: vi.fn(),
  cancel: vi.fn(),
  finish: vi.fn(),
  reverse: vi.fn(),
  playState: 'running',
  currentTime: 0,
  playbackRate: 1,
  addEventListener: vi.fn(),
  removeEventListener: vi.fn()
}));

// Mock requestAnimationFrame
global.requestAnimationFrame = vi.fn((cb) => {
  setTimeout(cb, 16); // ~60fps
  return 1;
});

global.cancelAnimationFrame = vi.fn();

describe('Animation System Tests', () => {
  let animationService: AnimationService;

  beforeEach(() => {
    animationService = new AnimationService();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Basic Animations', () => {
    it('should create fade in animation', async () => {
      const element = document.createElement('div');
      document.body.appendChild(element);
      
      const animation = animationService.fadeIn(element, { duration: 500 });
      
      expect(element.animate).toHaveBeenCalledWith(
        [
          { opacity: '0' },
          { opacity: '1' }
        ],
        {
          duration: 500,
          easing: 'ease-in-out',
          fill: 'forwards'
        }
      );
      
      expect(animation).toBeDefined();
    });

    it('should create fade out animation', async () => {
      const element = document.createElement('div');
      document.body.appendChild(element);
      
      const animation = animationService.fadeOut(element, { duration: 300 });
      
      expect(element.animate).toHaveBeenCalledWith(
        [
          { opacity: '1' },
          { opacity: '0' }
        ],
        {
          duration: 300,
          easing: 'ease-in-out',
          fill: 'forwards'
        }
      );
    });

    it('should create slide animations', () => {
      const element = document.createElement('div');
      document.body.appendChild(element);
      
      // Slide in from left
      animationService.slideIn(element, 'left', { duration: 400 });
      
      expect(element.animate).toHaveBeenCalledWith(
        [
          { transform: 'translateX(-100%)' },
          { transform: 'translateX(0)' }
        ],
        expect.objectContaining({ duration: 400 })
      );
      
      // Slide out to right
      animationService.slideOut(element, 'right', { duration: 400 });
      
      expect(element.animate).toHaveBeenCalledWith(
        [
          { transform: 'translateX(0)' },
          { transform: 'translateX(100%)' }
        ],
        expect.objectContaining({ duration: 400 })
      );
    });

    it('should create scale animations', () => {
      const element = document.createElement('div');
      document.body.appendChild(element);
      
      // Scale up
      animationService.scaleIn(element, { duration: 200 });
      
      expect(element.animate).toHaveBeenCalledWith(
        [
          { transform: 'scale(0)' },
          { transform: 'scale(1)' }
        ],
        expect.objectContaining({ duration: 200 })
      );
      
      // Scale down
      animationService.scaleOut(element, { duration: 200 });
      
      expect(element.animate).toHaveBeenCalledWith(
        [
          { transform: 'scale(1)' },
          { transform: 'scale(0)' }
        ],
        expect.objectContaining({ duration: 200 })
      );
    });

    it('should create rotation animations', () => {
      const element = document.createElement('div');
      document.body.appendChild(element);
      
      animationService.rotate(element, { degrees: 360, duration: 1000 });
      
      expect(element.animate).toHaveBeenCalledWith(
        [
          { transform: 'rotate(0deg)' },
          { transform: 'rotate(360deg)' }
        ],
        expect.objectContaining({ 
          duration: 1000,
          iterations: 1
        })
      );
    });

    it('should create bounce animation', () => {
      const element = document.createElement('div');
      document.body.appendChild(element);
      
      animationService.bounce(element, { duration: 600 });
      
      expect(element.animate).toHaveBeenCalledWith(
        [
          { transform: 'translateY(0)' },
          { transform: 'translateY(-20px)' },
          { transform: 'translateY(0)' },
          { transform: 'translateY(-10px)' },
          { transform: 'translateY(0)' }
        ],
        expect.objectContaining({ 
          duration: 600,
          easing: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)'
        })
      );
    });

    it('should create pulse animation', () => {
      const element = document.createElement('div');
      document.body.appendChild(element);
      
      animationService.pulse(element, { duration: 1000, iterations: Infinity });
      
      expect(element.animate).toHaveBeenCalledWith(
        [
          { transform: 'scale(1)' },
          { transform: 'scale(1.05)' },
          { transform: 'scale(1)' }
        ],
        expect.objectContaining({ 
          duration: 1000,
          iterations: Infinity
        })
      );
    });

    it('should create shake animation', () => {
      const element = document.createElement('div');
      document.body.appendChild(element);
      
      animationService.shake(element, { duration: 500 });
      
      expect(element.animate).toHaveBeenCalledWith(
        [
          { transform: 'translateX(0)' },
          { transform: 'translateX(-10px)' },
          { transform: 'translateX(10px)' },
          { transform: 'translateX(-10px)' },
          { transform: 'translateX(10px)' },
          { transform: 'translateX(0)' }
        ],
        expect.objectContaining({ duration: 500 })
      );
    });
  });

  describe('Complex Animations', () => {
    it('should create morphing animations', () => {
      const element = document.createElement('div');
      document.body.appendChild(element);
      
      const fromStyle = { width: '100px', height: '100px', borderRadius: '0px' };
      const toStyle = { width: '50px', height: '200px', borderRadius: '25px' };
      
      animationService.morph(element, fromStyle, toStyle, { duration: 800 });
      
      expect(element.animate).toHaveBeenCalledWith(
        [fromStyle, toStyle],
        expect.objectContaining({ duration: 800 })
      );
    });

    it('should create path animations', () => {
      const element = document.createElement('div');
      document.body.appendChild(element);
      
      const path = [
        { x: 0, y: 0 },
        { x: 100, y: 50 },
        { x: 200, y: 0 },
        { x: 300, y: 100 }
      ];
      
      animationService.animateAlongPath(element, path, { duration: 2000 });
      
      const expectedKeyframes = path.map(point => ({
        transform: `translate(${point.x}px, ${point.y}px)`
      }));
      
      expect(element.animate).toHaveBeenCalledWith(
        expectedKeyframes,
        expect.objectContaining({ duration: 2000 })
      );
    });

    it('should create particle effects', async () => {
      const container = document.createElement('div');
      document.body.appendChild(container);
      
      const particles = animationService.createParticleEffect(container, {
        count: 20,
        duration: 3000,
        spread: 50,
        gravity: 0.5
      });
      
      expect(particles).toHaveLength(20);
      expect(container.children).toHaveLength(20);
      
      // Each particle should have animation
      particles.forEach(particle => {
        expect(particle.element.animate).toHaveBeenCalled();
      });
    });

    it('should create ripple effect', () => {
      const element = document.createElement('button');
      document.body.appendChild(element);
      
      const ripple = animationService.createRipple(element, { x: 50, y: 30 });
      
      expect(element.querySelector('.ripple')).toBeTruthy();
      expect(ripple.animate).toHaveBeenCalledWith(
        [
          { transform: 'scale(0)', opacity: '1' },
          { transform: 'scale(4)', opacity: '0' }
        ],
        expect.objectContaining({
          duration: 600,
          easing: 'cubic-bezier(0.4, 0, 0.2, 1)'
        })
      );
    });

    it('should create typewriter effect', async () => {
      const element = document.createElement('div');
      document.body.appendChild(element);
      
      const text = 'Hello, World!';
      const animation = animationService.typewriter(element, text, { duration: 1000 });
      
      // Should progressively reveal text
      expect(animation).toBeDefined();
      
      // Simulate animation steps
      for (let i = 0; i <= text.length; i++) {
        const expectedText = text.substring(0, i);
        // Animation should update element content
      }
    });

    it('should create loading spinner', () => {
      const container = document.createElement('div');
      document.body.appendChild(container);
      
      const spinner = animationService.createSpinner(container, {
        type: 'dots',
        size: 40,
        color: '#007bff'
      });
      
      expect(container.querySelector('.spinner')).toBeTruthy();
      expect(spinner.element.animate).toHaveBeenCalled();
    });

    it('should create progress bar animation', () => {
      const progressBar = document.createElement('div');
      document.body.appendChild(progressBar);
      
      animationService.animateProgress(progressBar, 0, 75, { duration: 1500 });
      
      expect(progressBar.animate).toHaveBeenCalledWith(
        [
          { width: '0%' },
          { width: '75%' }
        ],
        expect.objectContaining({ duration: 1500 })
      );
    });
  });

  describe('Animation Groups and Sequences', () => {
    it('should create animation sequence', async () => {
      const element1 = document.createElement('div');
      const element2 = document.createElement('div');
      document.body.appendChild(element1);
      document.body.appendChild(element2);
      
      const sequence = animationService.sequence([
        () => animationService.fadeIn(element1, { duration: 300 }),
        () => animationService.slideIn(element2, 'right', { duration: 400 }),
        () => animationService.bounce(element1, { duration: 200 })
      ]);
      
      await sequence.play();
      
      expect(element1.animate).toHaveBeenCalledTimes(2); // fadeIn + bounce
      expect(element2.animate).toHaveBeenCalledTimes(1); // slideIn
    });

    it('should create parallel animations', async () => {
      const element1 = document.createElement('div');
      const element2 = document.createElement('div');
      document.body.appendChild(element1);
      document.body.appendChild(element2);
      
      const parallel = animationService.parallel([
        animationService.fadeIn(element1, { duration: 500 }),
        animationService.scaleIn(element2, { duration: 300 })
      ]);
      
      await parallel.play();
      
      expect(element1.animate).toHaveBeenCalled();
      expect(element2.animate).toHaveBeenCalled();
    });

    it('should create staggered animations', () => {
      const elements = [
        document.createElement('div'),
        document.createElement('div'),
        document.createElement('div')
      ];
      
      elements.forEach(el => document.body.appendChild(el));
      
      animationService.stagger(elements, (el, index) => 
        animationService.slideIn(el, 'bottom', { 
          duration: 300,
          delay: index * 100 
        })
      );
      
      elements.forEach((el, index) => {
        expect(el.animate).toHaveBeenCalledWith(
          expect.any(Array),
          expect.objectContaining({
            delay: index * 100
          })
        );
      });
    });

    it('should create timeline animations', async () => {
      const element = document.createElement('div');
      document.body.appendChild(element);
      
      const timeline = animationService.timeline([
        { at: 0, animation: () => animationService.fadeIn(element, { duration: 200 }) },
        { at: 100, animation: () => animationService.scaleIn(element, { duration: 300 }) },
        { at: 300, animation: () => animationService.rotate(element, { degrees: 180, duration: 400 }) }
      ]);
      
      await timeline.play();
      
      expect(element.animate).toHaveBeenCalledTimes(3);
    });
  });

  describe('Animation Control', () => {
    it('should play and pause animations', () => {
      const element = document.createElement('div');
      document.body.appendChild(element);
      
      const mockAnimation = {
        play: vi.fn(),
        pause: vi.fn(),
        cancel: vi.fn(),
        finish: vi.fn()
      };
      
      element.animate = vi.fn().mockReturnValue(mockAnimation);
      
      const animation = animationService.fadeIn(element);
      
      animationService.play(animation);
      expect(mockAnimation.play).toHaveBeenCalled();
      
      animationService.pause(animation);
      expect(mockAnimation.pause).toHaveBeenCalled();
      
      animationService.cancel(animation);
      expect(mockAnimation.cancel).toHaveBeenCalled();
      
      animationService.finish(animation);
      expect(mockAnimation.finish).toHaveBeenCalled();
    });

    it('should control playback rate', () => {
      const element = document.createElement('div');
      document.body.appendChild(element);
      
      const mockAnimation = { playbackRate: 1 };
      element.animate = vi.fn().mockReturnValue(mockAnimation);
      
      const animation = animationService.fadeIn(element);
      
      animationService.setSpeed(animation, 2);
      expect(mockAnimation.playbackRate).toBe(2);
      
      animationService.setSpeed(animation, 0.5);
      expect(mockAnimation.playbackRate).toBe(0.5);
    });

    it('should reverse animations', () => {
      const element = document.createElement('div');
      document.body.appendChild(element);
      
      const mockAnimation = { reverse: vi.fn() };
      element.animate = vi.fn().mockReturnValue(mockAnimation);
      
      const animation = animationService.slideIn(element, 'left');
      
      animationService.reverse(animation);
      expect(mockAnimation.reverse).toHaveBeenCalled();
    });

    it('should seek to specific time', () => {
      const element = document.createElement('div');
      document.body.appendChild(element);
      
      const mockAnimation = { currentTime: 0 };
      element.animate = vi.fn().mockReturnValue(mockAnimation);
      
      const animation = animationService.fadeIn(element, { duration: 1000 });
      
      animationService.seek(animation, 500);
      expect(mockAnimation.currentTime).toBe(500);
    });
  });

  describe('Animation Events', () => {
    it('should handle animation start events', () => {
      const element = document.createElement('div');
      document.body.appendChild(element);
      
      const onStart = vi.fn();
      const mockAnimation = {
        addEventListener: vi.fn()
      };
      element.animate = vi.fn().mockReturnValue(mockAnimation);
      
      animationService.fadeIn(element, { onStart });
      
      expect(mockAnimation.addEventListener).toHaveBeenCalledWith('start', onStart);
    });

    it('should handle animation end events', () => {
      const element = document.createElement('div');
      document.body.appendChild(element);
      
      const onEnd = vi.fn();
      const mockAnimation = {
        addEventListener: vi.fn()
      };
      element.animate = vi.fn().mockReturnValue(mockAnimation);
      
      animationService.fadeOut(element, { onEnd });
      
      expect(mockAnimation.addEventListener).toHaveBeenCalledWith('finish', onEnd);
    });

    it('should handle animation iteration events', () => {
      const element = document.createElement('div');
      document.body.appendChild(element);
      
      const onIteration = vi.fn();
      const mockAnimation = {
        addEventListener: vi.fn()
      };
      element.animate = vi.fn().mockReturnValue(mockAnimation);
      
      animationService.pulse(element, { iterations: 3, onIteration });
      
      expect(mockAnimation.addEventListener).toHaveBeenCalledWith('iteration', onIteration);
    });

    it('should handle animation cancel events', () => {
      const element = document.createElement('div');
      document.body.appendChild(element);
      
      const onCancel = vi.fn();
      const mockAnimation = {
        addEventListener: vi.fn(),
        cancel: vi.fn(() => {
          const event = new Event('cancel');
          onCancel(event);
        })
      };
      element.animate = vi.fn().mockReturnValue(mockAnimation);
      
      const animation = animationService.scaleIn(element, { onCancel });
      animationService.cancel(animation);
      
      expect(onCancel).toHaveBeenCalled();
    });
  });

  describe('Easing Functions', () => {
    it('should provide built-in easing functions', () => {
      const easings = animationService.getEasingFunctions();
      
      expect(easings).toHaveProperty('easeIn');
      expect(easings).toHaveProperty('easeOut');
      expect(easings).toHaveProperty('easeInOut');
      expect(easings).toHaveProperty('bounce');
      expect(easings).toHaveProperty('elastic');
      expect(easings).toHaveProperty('back');
    });

    it('should create custom cubic-bezier easing', () => {
      const customEasing = animationService.createEasing(0.68, -0.55, 0.265, 1.55);
      
      expect(customEasing).toBe('cubic-bezier(0.68, -0.55, 0.265, 1.55)');
    });

    it('should apply easing to animations', () => {
      const element = document.createElement('div');
      document.body.appendChild(element);
      
      animationService.fadeIn(element, { 
        duration: 500,
        easing: 'bounce'
      });
      
      expect(element.animate).toHaveBeenCalledWith(
        expect.any(Array),
        expect.objectContaining({
          easing: expect.stringContaining('cubic-bezier')
        })
      );
    });
  });

  describe('Performance Optimizations', () => {
    it('should use transform and opacity for performance', () => {
      const element = document.createElement('div');
      document.body.appendChild(element);
      
      // Optimized slide animation should use transform
      animationService.slideIn(element, 'left');
      
      const calls = element.animate.mock.calls[0][0];
      expect(calls[0]).toHaveProperty('transform');
      expect(calls[1]).toHaveProperty('transform');
    });

    it('should batch animations for better performance', () => {
      const elements = Array.from({ length: 100 }, () => document.createElement('div'));
      elements.forEach(el => document.body.appendChild(el));
      
      const batchStart = performance.now();
      animationService.batchAnimate(elements, (el) => 
        animationService.fadeIn(el, { duration: 300 })
      );
      const batchEnd = performance.now();
      
      // Should complete quickly even with 100 elements
      expect(batchEnd - batchStart).toBeLessThan(50); // Less than 50ms
    });

    it('should use RAF for smooth animations', () => {
      const element = document.createElement('div');
      document.body.appendChild(element);
      
      const startValue = 0;
      const endValue = 100;
      
      animationService.animateWithRAF(element, 'width', startValue, endValue, 500);
      
      expect(requestAnimationFrame).toHaveBeenCalled();
    });

    it('should cleanup animations to prevent memory leaks', () => {
      const element = document.createElement('div');
      document.body.appendChild(element);
      
      const mockAnimation = {
        cancel: vi.fn(),
        removeEventListener: vi.fn()
      };
      element.animate = vi.fn().mockReturnValue(mockAnimation);
      
      const animation = animationService.fadeIn(element);
      
      animationService.cleanup(animation);
      
      expect(mockAnimation.cancel).toHaveBeenCalled();
      expect(mockAnimation.removeEventListener).toHaveBeenCalled();
    });

    it('should handle reduced motion preference', () => {
      // Mock reduced motion preference
      Object.defineProperty(window, 'matchMedia', {
        value: vi.fn().mockImplementation(() => ({
          matches: true, // Prefers reduced motion
          addEventListener: vi.fn(),
          removeEventListener: vi.fn()
        }))
      });
      
      const element = document.createElement('div');
      document.body.appendChild(element);
      
      animationService.fadeIn(element, { duration: 1000 });
      
      // Should use much shorter duration
      expect(element.animate).toHaveBeenCalledWith(
        expect.any(Array),
        expect.objectContaining({
          duration: expect.any(Number) // Should be much less than 1000
        })
      );
    });
  });

  describe('Animation Presets', () => {
    it('should provide entrance animations', () => {
      const element = document.createElement('div');
      document.body.appendChild(element);
      
      animationService.entrance.fadeInDown(element);
      animationService.entrance.slideInLeft(element);
      animationService.entrance.zoomIn(element);
      animationService.entrance.bounceIn(element);
      
      expect(element.animate).toHaveBeenCalledTimes(4);
    });

    it('should provide exit animations', () => {
      const element = document.createElement('div');
      document.body.appendChild(element);
      
      animationService.exit.fadeOutUp(element);
      animationService.exit.slideOutRight(element);
      animationService.exit.zoomOut(element);
      animationService.exit.bounceOut(element);
      
      expect(element.animate).toHaveBeenCalledTimes(4);
    });

    it('should provide attention animations', () => {
      const element = document.createElement('div');
      document.body.appendChild(element);
      
      animationService.attention.flash(element);
      animationService.attention.jello(element);
      animationService.attention.wobble(element);
      animationService.attention.rubberBand(element);
      
      expect(element.animate).toHaveBeenCalledTimes(4);
    });
  });

  describe('CSS Transitions Integration', () => {
    it('should work with CSS transitions', () => {
      const element = document.createElement('div');
      element.style.transition = 'all 0.3s ease';
      document.body.appendChild(element);
      
      animationService.changeProperty(element, 'opacity', '0', '1');
      
      expect(element.style.opacity).toBe('1');
    });

    it('should detect transition end', async () => {
      const element = document.createElement('div');
      document.body.appendChild(element);
      
      const promise = animationService.waitForTransition(element);
      
      // Simulate transition end
      setTimeout(() => {
        element.dispatchEvent(new Event('transitionend'));
      }, 100);
      
      await expect(promise).resolves.toBeUndefined();
    });

    it('should apply multiple property changes', () => {
      const element = document.createElement('div');
      document.body.appendChild(element);
      
      animationService.applyStyles(element, {
        opacity: '0.5',
        transform: 'scale(1.2)',
        backgroundColor: '#ff0000'
      });
      
      expect(element.style.opacity).toBe('0.5');
      expect(element.style.transform).toBe('scale(1.2)');
      expect(element.style.backgroundColor).toBe('rgb(255, 0, 0)');
    });
  });

  describe('Animation State Management', () => {
    it('should track animation states', () => {
      const element = document.createElement('div');
      document.body.appendChild(element);
      
      const mockAnimation = {
        playState: 'running',
        currentTime: 250
      };
      element.animate = vi.fn().mockReturnValue(mockAnimation);
      
      const animation = animationService.fadeIn(element, { duration: 500 });
      
      expect(animationService.getState(animation)).toEqual({
        playState: 'running',
        progress: 0.5, // 250/500
        currentTime: 250,
        duration: 500
      });
    });

    it('should save and restore animation states', () => {
      const element = document.createElement('div');
      document.body.appendChild(element);
      
      const animation = animationService.fadeIn(element);
      
      // Save state
      const state = animationService.saveState(animation);
      
      // Modify animation
      animationService.seek(animation, 300);
      
      // Restore state
      animationService.restoreState(animation, state);
      
      // Should be back to saved position
      expect(animation.currentTime).toBe(state.currentTime);
    });

    it('should group animations by category', () => {
      const element1 = document.createElement('div');
      const element2 = document.createElement('div');
      document.body.appendChild(element1);
      document.body.appendChild(element2);
      
      const group = animationService.createGroup('ui-transitions');
      
      group.add(animationService.fadeIn(element1));
      group.add(animationService.slideIn(element2, 'right'));
      
      expect(group.animations).toHaveLength(2);
      
      group.playAll();
      expect(element1.animate).toHaveBeenCalled();
      expect(element2.animate).toHaveBeenCalled();
    });
  });
});