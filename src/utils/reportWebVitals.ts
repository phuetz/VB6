/**
 * Web Vitals reporting utility
 * Tracks Core Web Vitals metrics: CLS, FID, FCP, LCP, TTFB, INP
 *
 * Learn more: https://web.dev/vitals/
 */

import { onCLS, onFID, onFCP, onLCP, onTTFB, onINP, Metric } from 'web-vitals';
import { logger } from './logger';

/**
 * Web Vitals thresholds for good user experience
 */
const THRESHOLDS = {
  CLS: { good: 0.1, poor: 0.25 },
  FID: { good: 100, poor: 300 },
  FCP: { good: 1800, poor: 3000 },
  LCP: { good: 2500, poor: 4000 },
  TTFB: { good: 800, poor: 1800 },
  INP: { good: 200, poor: 500 },
} as const;

type MetricName = keyof typeof THRESHOLDS;

/**
 * Get the rating for a metric value
 */
function getRating(name: MetricName, value: number): 'good' | 'needs-improvement' | 'poor' {
  const threshold = THRESHOLDS[name];
  if (value <= threshold.good) return 'good';
  if (value <= threshold.poor) return 'needs-improvement';
  return 'poor';
}

/**
 * Format metric value for display
 */
function formatValue(name: MetricName, value: number): string {
  // CLS is unitless, others are in milliseconds
  if (name === 'CLS') {
    return value.toFixed(3);
  }
  return `${Math.round(value)}ms`;
}

/**
 * Send metrics to analytics service (Google Analytics, Sentry, etc.)
 */
function sendToAnalytics(metric: Metric): void {
  const name = metric.name as MetricName;
  const rating = getRating(name, metric.value);
  const formatted = formatValue(name, metric.value);

  // Log to console in development
  if (import.meta.env.DEV) {
    const emoji = rating === 'good' ? '✅' : rating === 'needs-improvement' ? '⚠️' : '❌';
    logger.info(`${emoji} ${name}: ${formatted} (${rating})`);
  }

  // Send to analytics service in production
  if (!import.meta.env.DEV) {
    // Google Analytics 4 example
    if (typeof window !== 'undefined' && 'gtag' in window) {
      (window as any).gtag('event', metric.name, {
        value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
        metric_id: metric.id,
        metric_value: metric.value,
        metric_delta: metric.delta,
        metric_rating: rating,
      });
    }

    // Send to custom analytics endpoint
    // Uncomment and configure as needed
    /*
    fetch('/api/analytics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: metric.name,
        value: metric.value,
        rating,
        id: metric.id,
        delta: metric.delta,
        navigationType: metric.navigationType,
      }),
    }).catch(err => logger.error('Failed to send analytics', err));
    */
  }

  // Store in localStorage for debugging
  try {
    const metrics = JSON.parse(localStorage.getItem('web-vitals') || '[]');
    metrics.push({
      name: metric.name,
      value: metric.value,
      rating,
      timestamp: Date.now(),
    });
    // Keep only last 20 metrics
    if (metrics.length > 20) metrics.shift();
    localStorage.setItem('web-vitals', JSON.stringify(metrics));
  } catch (err) {
    // Silently fail if localStorage is not available
  }
}

/**
 * Initialize Web Vitals tracking
 * Call this function once in your app's entry point
 */
export function reportWebVitals(): void {
  try {
    onCLS(sendToAnalytics);
    onFID(sendToAnalytics);
    onFCP(sendToAnalytics);
    onLCP(sendToAnalytics);
    onTTFB(sendToAnalytics);
    onINP(sendToAnalytics);

    logger.debug('Web Vitals tracking initialized');
  } catch (err) {
    logger.error('Failed to initialize Web Vitals', err);
  }
}

/**
 * Get stored Web Vitals from localStorage
 * Useful for debugging and displaying metrics in dev tools
 */
export function getStoredWebVitals(): Array<{
  name: string;
  value: number;
  rating: string;
  timestamp: number;
}> {
  try {
    return JSON.parse(localStorage.getItem('web-vitals') || '[]');
  } catch {
    return [];
  }
}

/**
 * Clear stored Web Vitals
 */
export function clearWebVitals(): void {
  try {
    localStorage.removeItem('web-vitals');
    logger.debug('Web Vitals cleared');
  } catch {
    // Silently fail
  }
}
