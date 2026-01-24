/**
 * HTML Sanitizer - Secure HTML rendering utility
 * TASK-004: Remplacement de dangerouslySetInnerHTML par DOMPurify
 *
 * Ce module fournit des fonctions sécurisées pour sanitizer du HTML
 * avant de l'injecter dans le DOM via React.
 */

import DOMPurify from 'dompurify';

/**
 * Configuration par défaut de DOMPurify
 * - Autorise les balises HTML de base pour le formatage
 * - Supprime tous les scripts et event handlers
 * - Supprime les URLs javascript:
 */
const DEFAULT_CONFIG: DOMPurify.Config = {
  ALLOWED_TAGS: [
    // Structure
    'div', 'span', 'p', 'br', 'hr',
    // Formatage texte
    'b', 'i', 'u', 's', 'strong', 'em', 'mark', 'small', 'sub', 'sup',
    // Listes
    'ul', 'ol', 'li',
    // Tableaux
    'table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td', 'caption', 'colgroup', 'col',
    // Code
    'pre', 'code', 'kbd', 'samp',
    // Autres
    'blockquote', 'q', 'cite', 'abbr', 'address',
    // Headers
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    // Media (avec restrictions)
    'img',
    // Links (avec restrictions)
    'a',
  ],
  ALLOWED_ATTR: [
    // Attributs généraux
    'class', 'id', 'style', 'title',
    // Pour les images
    'src', 'alt', 'width', 'height',
    // Pour les liens
    'href', 'target', 'rel',
    // Pour les tableaux
    'colspan', 'rowspan', 'scope',
    // Data attributes
    'data-*',
  ],
  // Bloquer les protocoles dangereux
  ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto|tel):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
  // Pas de scripts
  FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed', 'form', 'input', 'button'],
  FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onfocus', 'onblur'],
};

/**
 * Configuration stricte pour le code highlighting
 * - Seulement les balises nécessaires pour la coloration syntaxique
 */
const CODE_HIGHLIGHT_CONFIG: DOMPurify.Config = {
  ALLOWED_TAGS: ['span', 'br', 'code', 'pre'],
  ALLOWED_ATTR: ['class', 'style'],
  FORBID_TAGS: ['script', 'style'],
  FORBID_ATTR: ['onerror', 'onload', 'onclick'],
};

/**
 * Configuration pour les rapports
 * - Permet plus de balises pour le rendu de rapports complexes
 */
const REPORT_CONFIG: DOMPurify.Config = {
  ...DEFAULT_CONFIG,
  ALLOWED_TAGS: [
    ...(DEFAULT_CONFIG.ALLOWED_TAGS as string[]),
    // Éléments supplémentaires pour rapports
    'header', 'footer', 'section', 'article', 'aside', 'nav',
    'figure', 'figcaption',
  ],
};

/**
 * Configuration pour le texte riche (RTF)
 * - Permet les balises de formatage de texte
 */
const RICH_TEXT_CONFIG: DOMPurify.Config = {
  ALLOWED_TAGS: [
    'div', 'span', 'p', 'br',
    'b', 'i', 'u', 's', 'strong', 'em',
    'ul', 'ol', 'li',
    'font', 'sup', 'sub',
    'table', 'tr', 'td', 'th',
  ],
  ALLOWED_ATTR: ['class', 'style', 'color', 'size', 'face', 'align'],
  FORBID_TAGS: ['script', 'style', 'iframe'],
  FORBID_ATTR: ['onerror', 'onload', 'onclick'],
};

/**
 * Types de sanitization disponibles
 */
export type SanitizeType = 'default' | 'code' | 'report' | 'richtext';

/**
 * Obtenir la configuration selon le type
 */
function getConfig(type: SanitizeType): DOMPurify.Config {
  switch (type) {
    case 'code':
      return CODE_HIGHLIGHT_CONFIG;
    case 'report':
      return REPORT_CONFIG;
    case 'richtext':
      return RICH_TEXT_CONFIG;
    default:
      return DEFAULT_CONFIG;
  }
}

/**
 * Sanitize du HTML pour un rendu sécurisé
 *
 * @param html - Le HTML brut à sanitizer
 * @param type - Le type de sanitization à appliquer
 * @returns Le HTML sanitizé, sûr pour dangerouslySetInnerHTML
 *
 * @example
 * ```tsx
 * <div dangerouslySetInnerHTML={{ __html: sanitizeHTML(content, 'default') }} />
 * ```
 */
export function sanitizeHTML(html: string, type: SanitizeType = 'default'): string {
  if (!html) return '';

  const config = getConfig(type);
  return DOMPurify.sanitize(html, config);
}

/**
 * Sanitize du HTML pour le code highlighting
 * Raccourci pour sanitizeHTML(html, 'code')
 */
export function sanitizeCode(html: string): string {
  return sanitizeHTML(html, 'code');
}

/**
 * Sanitize du HTML pour les rapports
 * Raccourci pour sanitizeHTML(html, 'report')
 */
export function sanitizeReport(html: string): string {
  return sanitizeHTML(html, 'report');
}

/**
 * Sanitize du HTML pour le texte riche
 * Raccourci pour sanitizeHTML(html, 'richtext')
 */
export function sanitizeRichText(html: string): string {
  return sanitizeHTML(html, 'richtext');
}

/**
 * Crée un objet sûr pour dangerouslySetInnerHTML
 *
 * @param html - Le HTML brut
 * @param type - Le type de sanitization
 * @returns Un objet { __html: string } sûr pour React
 *
 * @example
 * ```tsx
 * <div dangerouslySetInnerHTML={createSafeHTML(content, 'report')} />
 * ```
 */
export function createSafeHTML(
  html: string,
  type: SanitizeType = 'default'
): { __html: string } {
  return { __html: sanitizeHTML(html, type) };
}

/**
 * Vérifie si une chaîne contient du HTML potentiellement dangereux
 * Utile pour les validations
 */
export function containsDangerousHTML(html: string): boolean {
  if (!html) return false;

  const dangerousPatterns = [
    /<script[^>]*>/i,
    /javascript:/i,
    /on\w+\s*=/i,
    /<iframe[^>]*>/i,
    /<object[^>]*>/i,
    /<embed[^>]*>/i,
    /data:/i,
    /vbscript:/i,
  ];

  return dangerousPatterns.some(pattern => pattern.test(html));
}

/**
 * Escape les caractères HTML spéciaux (alternative à DOMPurify pour le texte pur)
 * Utile quand on veut afficher du texte brut sans interprétation HTML
 */
export function escapeHTML(text: string): string {
  if (!text) return '';

  const htmlEntities: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  };

  return text.replace(/[&<>"']/g, char => htmlEntities[char]);
}

export default {
  sanitizeHTML,
  sanitizeCode,
  sanitizeReport,
  sanitizeRichText,
  createSafeHTML,
  containsDangerousHTML,
  escapeHTML,
};
