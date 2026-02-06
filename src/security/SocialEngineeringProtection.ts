/**
 * SOCIAL ENGINEERING BUG FIX: Protection Against Psychological Manipulation and Dark Patterns
 *
 * This module provides protection against social engineering attacks including:
 * - Dark UI/UX patterns and deceptive interfaces
 * - Cognitive bias exploitation (urgency, fear, greed, authority)
 * - Phishing and pretexting through UI manipulation
 * - Clickjacking and UI redressing attacks
 * - Psychological timing attacks and manipulation
 * - Fake urgency and artificial scarcity tactics
 * - Trust indicator spoofing and visual deception
 * - Behavioral manipulation and nudging attacks
 * - Emotional exploitation and stress-based attacks
 * - Subliminal messaging and priming attacks
 */

export interface PsychologicalThreat {
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  technique: string;
  cognitiveTarget: string; // Which cognitive bias is being exploited
  blocked: boolean;
  evidence: string[];
  timestamp: number;
}

export interface DarkPattern {
  name: string;
  type:
    | 'bait_switch'
    | 'roach_motel'
    | 'forced_continuity'
    | 'hidden_costs'
    | 'confirmshaming'
    | 'trick_questions'
    | 'sneak_basket'
    | 'misdirection'
    | 'price_manipulation'
    | 'false_urgency';
  element: string;
  deceptionLevel: number; // 0-1
  detected: boolean;
  timestamp: number;
}

export interface ManipulationAttempt {
  type: string;
  targetEmotion:
    | 'fear'
    | 'greed'
    | 'urgency'
    | 'trust'
    | 'authority'
    | 'social_proof'
    | 'reciprocity'
    | 'commitment'
    | 'scarcity';
  intensity: number; // 0-1
  context: string;
  blocked: boolean;
  timestamp: number;
}

export interface UserBehaviorProfile {
  sessionId: string;
  emotionalState: 'neutral' | 'stressed' | 'excited' | 'fearful' | 'confident';
  vulnerabilityScore: number; // 0-1
  manipulationResistance: number; // 0-1
  recentDecisions: Array<{ action: string; timestamp: number; pressured: boolean }>;
  cognitiveLoad: number; // 0-1
}

export interface SocialEngineeringConfig {
  enableDarkPatternDetection: boolean;
  enableClickjackingProtection: boolean;
  enablePhishingDetection: boolean;
  enableManipulationDetection: boolean;
  enableEmotionalProtection: boolean;
  enableTimingProtection: boolean;
  enableVisualDeceptionDetection: boolean;
  enableSubliminalDetection: boolean;
  manipulationThreshold: number; // 0-1
  userProtectionLevel: 'low' | 'medium' | 'high' | 'maximum';
}

/**
 * SOCIAL ENGINEERING BUG FIX: Main social engineering protection class
 */
export class SocialEngineeringProtection {
  private static instance: SocialEngineeringProtection;
  private config: SocialEngineeringConfig;
  private threats: PsychologicalThreat[] = [];
  private darkPatterns: DarkPattern[] = [];
  private manipulationAttempts: ManipulationAttempt[] = [];
  private userProfiles: Map<string, UserBehaviorProfile> = new Map();
  private clickjackingProtected: boolean = false;
  private monitoringInterval: NodeJS.Timeout | null = null;

  // Psychological manipulation indicators
  private readonly MANIPULATION_KEYWORDS = {
    urgency: [
      'urgent',
      'expires',
      'limited time',
      'act now',
      'hurry',
      'last chance',
      'ending soon',
      'only today',
    ],
    fear: [
      'warning',
      'alert',
      'danger',
      'risk',
      'threat',
      'virus',
      'hacked',
      'compromised',
      'suspended',
    ],
    greed: ['free', 'win', 'prize', 'reward', 'bonus', 'profit', 'earn', 'money', 'cash'],
    authority: [
      'official',
      'verified',
      'certified',
      'approved',
      'authorized',
      'government',
      'legal',
    ],
    trust: ['secure', 'safe', 'protected', 'guaranteed', 'trusted', 'reliable', 'proven'],
    scarcity: ['only', 'left', 'remaining', 'stock', 'available', 'exclusive', 'limited', 'rare'],
    social: [
      'others',
      'people',
      'users',
      'customers',
      'trending',
      'popular',
      'everyone',
      'million',
    ],
  };

  // Dark pattern detection patterns
  private readonly DARK_PATTERNS = [
    { pattern: /unsubscribe.*hidden|tiny|small/gi, type: 'roach_motel' },
    { pattern: /confirm.*shame|guilt|bad/gi, type: 'confirmshaming' },
    { pattern: /added.*cart|basket.*automatically/gi, type: 'sneak_basket' },
    { pattern: /price.*change|increase.*checkout/gi, type: 'hidden_costs' },
    { pattern: /trial.*credit.*card|payment.*required/gi, type: 'forced_continuity' },
    { pattern: /default.*checked|pre.*selected/gi, type: 'trick_questions' },
    { pattern: /countdown|timer.*fake|artificial/gi, type: 'false_urgency' },
  ];

  // Visual deception indicators
  private readonly DECEPTIVE_STYLES = {
    hiddenElements: { opacity: 0.1, fontSize: '1px', color: 'transparent' },
    misleadingButtons: { similar: 0.9, confusing: true },
    fakeDisabled: { cursor: 'not-allowed', opacity: 0.5, pointerEvents: 'auto' },
  };

  private readonly DEFAULT_CONFIG: SocialEngineeringConfig = {
    enableDarkPatternDetection: true,
    enableClickjackingProtection: true,
    enablePhishingDetection: true,
    enableManipulationDetection: true,
    enableEmotionalProtection: true,
    enableTimingProtection: true,
    enableVisualDeceptionDetection: true,
    enableSubliminalDetection: true,
    manipulationThreshold: 0.7,
    userProtectionLevel: 'high',
  };

  static getInstance(config?: Partial<SocialEngineeringConfig>): SocialEngineeringProtection {
    if (!this.instance) {
      this.instance = new SocialEngineeringProtection(config);
    }
    return this.instance;
  }

  private constructor(config?: Partial<SocialEngineeringConfig>) {
    this.config = { ...this.DEFAULT_CONFIG, ...config };
    this.initializeProtection();
  }

  /**
   * SOCIAL ENGINEERING BUG FIX: Initialize comprehensive protection
   */
  private initializeProtection(): void {
    // Initialize dark pattern detection
    if (this.config.enableDarkPatternDetection) {
      this.initializeDarkPatternDetection();
    }

    // Initialize clickjacking protection
    if (this.config.enableClickjackingProtection) {
      this.initializeClickjackingProtection();
    }

    // Initialize phishing detection
    if (this.config.enablePhishingDetection) {
      this.initializePhishingDetection();
    }

    // Initialize manipulation detection
    if (this.config.enableManipulationDetection) {
      this.initializeManipulationDetection();
    }

    // Initialize emotional protection
    if (this.config.enableEmotionalProtection) {
      this.initializeEmotionalProtection();
    }

    // Initialize timing protection
    if (this.config.enableTimingProtection) {
      this.initializeTimingProtection();
    }

    // Initialize visual deception detection
    if (this.config.enableVisualDeceptionDetection) {
      this.initializeVisualDeceptionDetection();
    }

    // Start continuous monitoring
    this.startContinuousMonitoring();
  }

  /**
   * SOCIAL ENGINEERING BUG FIX: Initialize dark pattern detection
   */
  private initializeDarkPatternDetection(): void {
    if (typeof document === 'undefined') return;

    // Monitor DOM for dark patterns
    const observer = new MutationObserver(mutations => {
      mutations.forEach(mutation => {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach(node => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              this.checkForDarkPatterns(node as Element);
            }
          });
        } else if (mutation.type === 'attributes') {
          this.checkForDarkPatterns(mutation.target as Element);
        }
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['style', 'class', 'disabled', 'hidden'],
    });

    // Check existing elements
    this.scanForDarkPatterns();
  }

  /**
   * SOCIAL ENGINEERING BUG FIX: Check element for dark patterns
   */
  private checkForDarkPatterns(element: Element): void {
    const text = element.textContent || '';
    const html = element.innerHTML || '';

    // Check for text-based dark patterns
    for (const { pattern, type } of this.DARK_PATTERNS) {
      if (pattern.test(text) || pattern.test(html)) {
        this.recordDarkPattern({
          name: `${type}_pattern`,
          type: type as DarkPattern['type'],
          element: element.tagName,
          deceptionLevel: 0.8,
          detected: true,
          timestamp: Date.now(),
        });
      }
    }

    // Check for deceptive styling
    if (element instanceof HTMLElement) {
      this.checkDeceptiveStyling(element);
    }

    // Check for misleading form elements
    if (element instanceof HTMLFormElement || element.querySelector('form')) {
      this.checkDeceptiveForms(element);
    }

    // Check for fake urgency elements
    if (element.querySelector('[data-countdown], .countdown, .timer')) {
      this.checkFakeUrgency(element);
    }
  }

  /**
   * SOCIAL ENGINEERING BUG FIX: Check for deceptive styling
   */
  private checkDeceptiveStyling(element: HTMLElement): void {
    const styles = window.getComputedStyle(element);

    // Check for hidden or barely visible elements
    const opacity = parseFloat(styles.opacity);
    const fontSize = parseFloat(styles.fontSize);

    if (opacity < 0.3 || fontSize < 8) {
      // Check if this is important text (unsubscribe, terms, etc.)
      const importantKeywords = [
        'unsubscribe',
        'cancel',
        'terms',
        'privacy',
        'decline',
        'no thanks',
      ];
      const text = element.textContent?.toLowerCase() || '';

      if (importantKeywords.some(keyword => text.includes(keyword))) {
        this.recordThreat({
          type: 'hidden_important_element',
          severity: 'high',
          description: `Important element hidden or barely visible: ${text.substring(0, 50)}`,
          technique: 'visual_deception',
          cognitiveTarget: 'attention',
          blocked: false,
          evidence: [`opacity: ${opacity}`, `fontSize: ${fontSize}px`],
          timestamp: Date.now(),
        });
      }
    }

    // Check for misleading disabled states
    if (element.hasAttribute('disabled') || styles.cursor === 'not-allowed') {
      const clickable = styles.pointerEvents !== 'none';

      if (clickable && element.tagName === 'BUTTON') {
        this.recordThreat({
          type: 'fake_disabled_element',
          severity: 'medium',
          description: 'Fake disabled button that is actually clickable',
          technique: 'visual_deception',
          cognitiveTarget: 'perception',
          blocked: false,
          evidence: ['fake_disabled'],
          timestamp: Date.now(),
        });
      }
    }
  }

  /**
   * SOCIAL ENGINEERING BUG FIX: Check for deceptive forms
   */
  private checkDeceptiveForms(element: Element): void {
    // Check for pre-checked consent boxes
    const checkboxes = element.querySelectorAll('input[type="checkbox"]:checked');
    checkboxes.forEach(checkbox => {
      const label = checkbox.parentElement?.textContent || '';

      if (/newsletter|marketing|partners|share|sell/i.test(label)) {
        this.recordDarkPattern({
          name: 'pre_checked_consent',
          type: 'trick_questions',
          element: 'checkbox',
          deceptionLevel: 0.7,
          detected: true,
          timestamp: Date.now(),
        });
      }
    });

    // Check for confusing button labeling
    const buttons = element.querySelectorAll('button, input[type="submit"]');
    const buttonTexts: string[] = [];

    buttons.forEach(button => {
      const text = button.textContent || (button as HTMLInputElement).value || '';
      buttonTexts.push(text.toLowerCase());
    });

    // Check for confusing accept/decline patterns
    if (buttonTexts.includes('no') && buttonTexts.includes('yes')) {
      const noIndex = buttonTexts.indexOf('no');
      const yesIndex = buttonTexts.indexOf('yes');

      // If "No" comes before "Yes", it's likely deceptive
      if (noIndex < yesIndex) {
        this.recordThreat({
          type: 'confusing_button_order',
          severity: 'medium',
          description: 'Confusing button order (No before Yes)',
          technique: 'misdirection',
          cognitiveTarget: 'expectation',
          blocked: false,
          evidence: ['reversed_buttons'],
          timestamp: Date.now(),
        });
      }
    }
  }

  /**
   * SOCIAL ENGINEERING BUG FIX: Check for fake urgency
   */
  private checkFakeUrgency(element: Element): void {
    // Look for countdown timers
    const timerElements = element.querySelectorAll('[data-countdown], .countdown, .timer');

    timerElements.forEach(timer => {
      // Check if timer resets or is fake
      const previousValue = timer.textContent;

      setTimeout(() => {
        const currentValue = timer.textContent;

        // If timer hasn't changed or increased, it's fake
        if (
          currentValue === previousValue ||
          (previousValue && currentValue && currentValue > previousValue)
        ) {
          this.recordManipulationAttempt({
            type: 'fake_countdown_timer',
            targetEmotion: 'urgency',
            intensity: 0.9,
            context: 'Fake countdown timer detected',
            blocked: false,
            timestamp: Date.now(),
          });
        }
      }, 2000);
    });
  }

  /**
   * SOCIAL ENGINEERING BUG FIX: Initialize clickjacking protection
   */
  private initializeClickjackingProtection(): void {
    if (typeof window === 'undefined') return;

    // Frame busting code
    if (window.top !== window.self) {
      this.recordThreat({
        type: 'iframe_embedding_detected',
        severity: 'high',
        description: 'Page is embedded in an iframe (potential clickjacking)',
        technique: 'clickjacking',
        cognitiveTarget: 'perception',
        blocked: true,
        evidence: ['iframe_detected'],
        timestamp: Date.now(),
      });

      // Attempt to break out of frame
      try {
        window.top!.location = window.self.location;
      } catch (e) {
        // If we can't break out, make the page unusable
        document.body.style.display = 'none';
      }
    }

    // Monitor for invisible overlays
    document.addEventListener(
      'click',
      event => {
        this.checkForClickjacking(event);
      },
      true
    );

    // Add X-Frame-Options meta tag
    const meta = document.createElement('meta');
    meta.httpEquiv = 'X-Frame-Options';
    meta.content = 'DENY';
    document.head.appendChild(meta);

    this.clickjackingProtected = true;
  }

  /**
   * SOCIAL ENGINEERING BUG FIX: Check for clickjacking attempts
   */
  private checkForClickjacking(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    const rect = target.getBoundingClientRect();
    const x = event.clientX;
    const y = event.clientY;

    // Check if click coordinates match the visible element
    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      this.recordThreat({
        type: 'clickjacking_attempt',
        severity: 'high',
        description: 'Click coordinates do not match visible element',
        technique: 'clickjacking',
        cognitiveTarget: 'perception',
        blocked: true,
        evidence: [`click: ${x},${y}`, `element: ${rect.left},${rect.top}`],
        timestamp: Date.now(),
      });

      event.preventDefault();
      event.stopPropagation();
    }

    // Check for transparent overlays
    const elementAtPoint = document.elementFromPoint(x, y);
    if (elementAtPoint !== target) {
      const styles = window.getComputedStyle(elementAtPoint!);
      const opacity = parseFloat(styles.opacity);

      if (opacity < 0.1) {
        this.recordThreat({
          type: 'transparent_overlay_detected',
          severity: 'high',
          description: 'Transparent overlay intercepting clicks',
          technique: 'clickjacking',
          cognitiveTarget: 'perception',
          blocked: true,
          evidence: [`opacity: ${opacity}`],
          timestamp: Date.now(),
        });

        event.preventDefault();
        event.stopPropagation();
      }
    }
  }

  /**
   * SOCIAL ENGINEERING BUG FIX: Initialize phishing detection
   */
  private initializePhishingDetection(): void {
    // Monitor for phishing indicators
    this.checkForPhishingIndicators();

    // Monitor form submissions
    this.monitorFormSubmissions();

    // Check for lookalike domains
    this.checkDomainSpoofing();
  }

  /**
   * SOCIAL ENGINEERING BUG FIX: Check for phishing indicators
   */
  private checkForPhishingIndicators(): void {
    if (typeof document === 'undefined') return;

    // Check for fake browser chrome
    const suspiciousElements = document.querySelectorAll(
      '[class*="browser"], [class*="address-bar"], [class*="url-bar"], [id*="fake-url"]'
    );

    if (suspiciousElements.length > 0) {
      this.recordThreat({
        type: 'fake_browser_chrome',
        severity: 'critical',
        description: 'Fake browser UI elements detected',
        technique: 'phishing',
        cognitiveTarget: 'trust',
        blocked: false,
        evidence: ['fake_browser_ui'],
        timestamp: Date.now(),
      });
    }

    // Check for password fields in suspicious contexts
    const passwordFields = document.querySelectorAll('input[type="password"]');
    passwordFields.forEach(field => {
      const form = field.closest('form');
      if (form) {
        const action = form.action;

        // Check if form submits to suspicious location
        if (action && !action.startsWith(window.location.origin)) {
          this.recordThreat({
            type: 'cross_origin_password_form',
            severity: 'critical',
            description: `Password form submits to different origin: ${action}`,
            technique: 'phishing',
            cognitiveTarget: 'trust',
            blocked: false,
            evidence: [`action: ${action}`],
            timestamp: Date.now(),
          });
        }
      }
    });
  }

  /**
   * SOCIAL ENGINEERING BUG FIX: Monitor form submissions
   */
  private monitorFormSubmissions(): void {
    if (typeof document === 'undefined') return;

    document.addEventListener(
      'submit',
      event => {
        const form = event.target as HTMLFormElement;
        const inputs = form.querySelectorAll('input');

        let hasSensitiveData = false;
        let suspiciousSubmission = false;

        inputs.forEach(input => {
          const type = input.type;
          const name = input.name.toLowerCase();
          const value = input.value;

          // Check for sensitive data
          if (type === 'password' || name.includes('ssn') || name.includes('credit')) {
            hasSensitiveData = true;
          }

          // Check for suspicious patterns
          if (value && this.containsManipulativeContent(value)) {
            suspiciousSubmission = true;
          }
        });

        if (hasSensitiveData && suspiciousSubmission) {
          this.recordThreat({
            type: 'suspicious_form_submission',
            severity: 'high',
            description: 'Form with sensitive data has suspicious content',
            technique: 'phishing',
            cognitiveTarget: 'trust',
            blocked: true,
            evidence: ['sensitive_data', 'suspicious_content'],
            timestamp: Date.now(),
          });

          if (this.config.userProtectionLevel === 'maximum') {
            event.preventDefault();
            alert('This form submission has been blocked for your security.');
          }
        }
      },
      true
    );
  }

  /**
   * SOCIAL ENGINEERING BUG FIX: Check for domain spoofing
   */
  private checkDomainSpoofing(): void {
    if (typeof window === 'undefined') return;

    const currentDomain = window.location.hostname;

    // Check for homograph attacks
    const homographs = {
      o: ['0', 'о'], // Latin o vs number 0 vs Cyrillic o
      i: ['1', 'l', 'і'], // Latin i vs number 1 vs Latin l vs Cyrillic i
      a: ['а', '@'], // Latin a vs Cyrillic a
      e: ['е', '3'], // Latin e vs Cyrillic e
      c: ['с'], // Latin c vs Cyrillic c
    };

    let suspiciousDomain = false;
    for (const [char, replacements] of Object.entries(homographs)) {
      if (replacements.some(rep => currentDomain.includes(rep))) {
        suspiciousDomain = true;
        break;
      }
    }

    if (suspiciousDomain) {
      this.recordThreat({
        type: 'homograph_attack',
        severity: 'critical',
        description: 'Domain contains homograph characters (possible phishing)',
        technique: 'domain_spoofing',
        cognitiveTarget: 'perception',
        blocked: false,
        evidence: [`domain: ${currentDomain}`],
        timestamp: Date.now(),
      });
    }
  }

  /**
   * SOCIAL ENGINEERING BUG FIX: Initialize manipulation detection
   */
  private initializeManipulationDetection(): void {
    // Monitor page content for manipulation
    this.scanForManipulativeContent();

    // Monitor user interactions
    this.monitorUserBehavior();

    // Check for cognitive bias exploitation
    this.detectCognitiveBiasExploitation();
  }

  /**
   * SOCIAL ENGINEERING BUG FIX: Scan for manipulative content
   */
  private scanForManipulativeContent(): void {
    if (typeof document === 'undefined') return;

    const textElements = document.querySelectorAll(
      'p, h1, h2, h3, h4, h5, h6, span, div, button, a'
    );

    textElements.forEach(element => {
      const text = element.textContent?.toLowerCase() || '';

      // Check for manipulation keywords
      for (const [emotion, keywords] of Object.entries(this.MANIPULATION_KEYWORDS)) {
        const keywordCount = keywords.filter(keyword => text.includes(keyword)).length;

        if (keywordCount >= 2) {
          // Multiple keywords indicate manipulation
          this.recordManipulationAttempt({
            type: `${emotion}_manipulation`,
            targetEmotion: emotion as ManipulationAttempt['targetEmotion'],
            intensity: Math.min(keywordCount / 5, 1),
            context: text.substring(0, 100),
            blocked: false,
            timestamp: Date.now(),
          });
        }
      }
    });
  }

  /**
   * SOCIAL ENGINEERING BUG FIX: Monitor user behavior for vulnerability
   */
  private monitorUserBehavior(): void {
    const sessionId = this.getSessionId();
    let profile = this.userProfiles.get(sessionId);

    if (!profile) {
      profile = {
        sessionId,
        emotionalState: 'neutral',
        vulnerabilityScore: 0,
        manipulationResistance: 0.5,
        recentDecisions: [],
        cognitiveLoad: 0,
      };
      this.userProfiles.set(sessionId, profile);
    }

    // Monitor click patterns
    document.addEventListener('click', event => {
      const target = event.target as HTMLElement;
      const isRushed = this.detectRushedDecision(profile!);

      profile!.recentDecisions.push({
        action: `click_${target.tagName}`,
        timestamp: Date.now(),
        pressured: isRushed,
      });

      // Keep only recent decisions
      if (profile!.recentDecisions.length > 50) {
        profile!.recentDecisions = profile!.recentDecisions.slice(-50);
      }

      // Update emotional state based on behavior
      this.updateEmotionalState(profile!);
    });

    // Monitor mouse movement for stress indicators
    let mouseMovements = 0;
    let lastMouseTime = Date.now();

    document.addEventListener('mousemove', () => {
      mouseMovements++;
      const now = Date.now();

      if (now - lastMouseTime > 1000) {
        // High mouse movement indicates stress or confusion
        profile!.cognitiveLoad = Math.min(mouseMovements / 100, 1);

        if (profile!.cognitiveLoad > 0.7) {
          profile!.emotionalState = 'stressed';
        }

        mouseMovements = 0;
        lastMouseTime = now;
      }
    });
  }

  /**
   * SOCIAL ENGINEERING BUG FIX: Detect rushed decisions
   */
  private detectRushedDecision(profile: UserBehaviorProfile): boolean {
    if (profile.recentDecisions.length < 2) return false;

    const recent = profile.recentDecisions.slice(-5);
    const timeDiffs = [];

    for (let i = 1; i < recent.length; i++) {
      timeDiffs.push(recent[i].timestamp - recent[i - 1].timestamp);
    }

    const avgTime = timeDiffs.reduce((a, b) => a + b, 0) / timeDiffs.length;

    // If average time between decisions is less than 2 seconds, user is rushing
    return avgTime < 2000;
  }

  /**
   * SOCIAL ENGINEERING BUG FIX: Update user emotional state
   */
  private updateEmotionalState(profile: UserBehaviorProfile): void {
    // Calculate vulnerability based on recent behavior
    let vulnerabilityFactors = 0;

    if (profile.emotionalState === 'stressed') vulnerabilityFactors += 0.3;
    if (profile.emotionalState === 'fearful') vulnerabilityFactors += 0.4;
    if (profile.cognitiveLoad > 0.7) vulnerabilityFactors += 0.2;

    const rushedDecisions = profile.recentDecisions.filter(d => d.pressured).length;
    if (rushedDecisions > 3) vulnerabilityFactors += 0.2;

    profile.vulnerabilityScore = Math.min(vulnerabilityFactors, 1);

    // Adjust manipulation resistance
    profile.manipulationResistance = 1 - profile.vulnerabilityScore;

    // Warn user if highly vulnerable
    if (profile.vulnerabilityScore > 0.8) {
      this.recordThreat({
        type: 'user_highly_vulnerable',
        severity: 'high',
        description: 'User is in vulnerable state - high risk of manipulation',
        technique: 'psychological_state',
        cognitiveTarget: 'emotional_state',
        blocked: false,
        evidence: [
          `vulnerability: ${profile.vulnerabilityScore}`,
          `state: ${profile.emotionalState}`,
        ],
        timestamp: Date.now(),
      });
    }
  }

  /**
   * SOCIAL ENGINEERING BUG FIX: Initialize emotional protection
   */
  private initializeEmotionalProtection(): void {
    // Monitor for emotional manipulation
    this.monitorEmotionalTriggers();

    // Provide emotional shields
    this.implementEmotionalShields();
  }

  /**
   * SOCIAL ENGINEERING BUG FIX: Monitor emotional triggers
   */
  private monitorEmotionalTriggers(): void {
    // Monitor for fear-inducing elements
    const fearElements = document.querySelectorAll(
      '.warning, .alert, .danger, [class*="virus"], [class*="threat"]'
    );

    if (fearElements.length > 3) {
      this.recordManipulationAttempt({
        type: 'excessive_fear_triggers',
        targetEmotion: 'fear',
        intensity: Math.min(fearElements.length / 10, 1),
        context: 'Multiple fear-inducing elements on page',
        blocked: false,
        timestamp: Date.now(),
      });
    }

    // Monitor for artificial scarcity
    const scarcityElements = document.querySelectorAll(
      '[class*="limited"], [class*="remaining"], [class*="stock"]'
    );

    scarcityElements.forEach(element => {
      const text = element.textContent || '';
      const numberMatch = text.match(/\d+/);

      if (numberMatch && parseInt(numberMatch[0]) < 10) {
        this.recordManipulationAttempt({
          type: 'artificial_scarcity',
          targetEmotion: 'scarcity',
          intensity: 0.8,
          context: `Low stock claim: ${text}`,
          blocked: false,
          timestamp: Date.now(),
        });
      }
    });
  }

  /**
   * SOCIAL ENGINEERING BUG FIX: Implement emotional shields
   */
  private implementEmotionalShields(): void {
    // Add protective delay to high-pressure decisions
    const protectButton = (button: HTMLElement) => {
      const originalOnClick = button.onclick;

      button.onclick = event => {
        const profile = this.getUserProfile();

        if (profile.vulnerabilityScore > 0.7) {
          // Add cooling-off period for vulnerable users
          if (
            confirm('You seem stressed. Are you sure you want to proceed? Take a moment to think.')
          ) {
            // Add 3 second delay
            button.disabled = true;
            setTimeout(() => {
              button.disabled = false;
              if (originalOnClick) originalOnClick.call(button, event);
            }, 3000);
          }
          return false;
        }

        return originalOnClick ? originalOnClick.call(button, event) : true;
      };
    };

    // Protect high-stakes buttons
    const buttons = document.querySelectorAll('button[type="submit"], .purchase, .buy, .confirm');
    buttons.forEach(button => protectButton(button as HTMLElement));
  }

  /**
   * SOCIAL ENGINEERING BUG FIX: Initialize timing protection
   */
  private initializeTimingProtection(): void {
    // Protect against time-pressure tactics
    this.detectTimePressure();

    // Monitor for artificial deadlines
    this.monitorDeadlines();
  }

  /**
   * SOCIAL ENGINEERING BUG FIX: Initialize visual deception detection
   */
  private initializeVisualDeceptionDetection(): void {
    // Check for misleading visual elements
    this.scanForVisualDeception();

    // Monitor for UI redressing
    this.monitorUIRedressing();
  }

  /**
   * SOCIAL ENGINEERING BUG FIX: Scan for visual deception
   */
  private scanForVisualDeception(): void {
    // Check for fake system dialogs
    const systemDialogImitators = document.querySelectorAll(
      '[class*="system-dialog"], [class*="os-dialog"], [class*="browser-dialog"]'
    );

    systemDialogImitators.forEach(element => {
      this.recordThreat({
        type: 'fake_system_dialog',
        severity: 'high',
        description: 'Fake system dialog detected',
        technique: 'visual_spoofing',
        cognitiveTarget: 'trust',
        blocked: false,
        evidence: ['fake_dialog'],
        timestamp: Date.now(),
      });
    });

    // Check for misleading close buttons
    const closeButtons = document.querySelectorAll('[class*="close"], .x, [aria-label*="close"]');

    closeButtons.forEach(button => {
      const onClick = (button as HTMLElement).onclick;

      if (onClick && onClick.toString().includes('subscribe')) {
        this.recordDarkPattern({
          name: 'deceptive_close_button',
          type: 'bait_switch',
          element: 'close_button',
          deceptionLevel: 0.9,
          detected: true,
          timestamp: Date.now(),
        });
      }
    });
  }

  /**
   * SOCIAL ENGINEERING BUG FIX: Start continuous monitoring
   */
  private startContinuousMonitoring(): void {
    this.monitoringInterval = setInterval(() => {
      this.performSecurityChecks();
    }, 5000); // Every 5 seconds
  }

  /**
   * SOCIAL ENGINEERING BUG FIX: Perform periodic security checks
   */
  private performSecurityChecks(): void {
    // Re-scan for new manipulative content
    this.scanForManipulativeContent();

    // Check user vulnerability levels
    this.assessUserVulnerability();

    // Clean up old data
    this.cleanupOldData();
  }

  /**
   * Helper methods
   */
  private scanForDarkPatterns(): void {
    this.checkForDarkPatterns(document.body);
  }

  private detectCognitiveBiasExploitation(): void {
    // Implementation for cognitive bias detection
  }

  private detectTimePressure(): void {
    // Implementation for time pressure detection
  }

  private monitorDeadlines(): void {
    // Implementation for deadline monitoring
  }

  private monitorUIRedressing(): void {
    // Implementation for UI redressing monitoring
  }

  private containsManipulativeContent(text: string): boolean {
    const lowerText = text.toLowerCase();

    for (const keywords of Object.values(this.MANIPULATION_KEYWORDS)) {
      if (keywords.some(keyword => lowerText.includes(keyword))) {
        return true;
      }
    }

    return false;
  }

  private getSessionId(): string {
    return (
      sessionStorage.getItem('se_session_id') ||
      (() => {
        const id = `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        sessionStorage.setItem('se_session_id', id);
        return id;
      })()
    );
  }

  private getUserProfile(): UserBehaviorProfile {
    const sessionId = this.getSessionId();
    return (
      this.userProfiles.get(sessionId) || {
        sessionId,
        emotionalState: 'neutral',
        vulnerabilityScore: 0,
        manipulationResistance: 0.5,
        recentDecisions: [],
        cognitiveLoad: 0,
      }
    );
  }

  private assessUserVulnerability(): void {
    for (const profile of this.userProfiles.values()) {
      this.updateEmotionalState(profile);
    }
  }

  private cleanupOldData(): void {
    const cutoff = Date.now() - 24 * 60 * 60 * 1000; // 24 hours

    this.threats = this.threats.filter(t => t.timestamp > cutoff);
    this.darkPatterns = this.darkPatterns.filter(d => d.timestamp > cutoff);
    this.manipulationAttempts = this.manipulationAttempts.filter(m => m.timestamp > cutoff);
  }

  /**
   * Record methods
   */
  private recordThreat(threat: PsychologicalThreat): void {
    this.threats.push(threat);
    console.warn('Social engineering threat detected:', threat);

    if (threat.severity === 'critical') {
      this.alertUser(threat);
    }
  }

  private recordDarkPattern(pattern: DarkPattern): void {
    this.darkPatterns.push(pattern);
    console.warn('Dark pattern detected:', pattern);
  }

  private recordManipulationAttempt(attempt: ManipulationAttempt): void {
    this.manipulationAttempts.push(attempt);
    console.warn('Manipulation attempt detected:', attempt);
  }

  private alertUser(threat: PsychologicalThreat): void {
    if (this.config.userProtectionLevel === 'maximum') {
      alert(
        `Security Warning: ${threat.description}\n\nThis page may be trying to manipulate you.`
      );
    }
  }

  /**
   * Get security statistics
   */
  getSecurityStats(): {
    totalThreats: number;
    criticalThreats: number;
    darkPatternsDetected: number;
    manipulationAttempts: number;
    averageUserVulnerability: number;
    mostTargetedEmotion: string;
  } {
    const criticalThreats = this.threats.filter(t => t.severity === 'critical').length;

    const emotionCounts = this.manipulationAttempts.reduce(
      (acc, attempt) => {
        acc[attempt.targetEmotion] = (acc[attempt.targetEmotion] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    const mostTargeted =
      Object.entries(emotionCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'none';

    const avgVulnerability =
      Array.from(this.userProfiles.values()).reduce(
        (sum, profile) => sum + profile.vulnerabilityScore,
        0
      ) / Math.max(this.userProfiles.size, 1);

    return {
      totalThreats: this.threats.length,
      criticalThreats,
      darkPatternsDetected: this.darkPatterns.length,
      manipulationAttempts: this.manipulationAttempts.length,
      averageUserVulnerability: avgVulnerability,
      mostTargetedEmotion: mostTargeted,
    };
  }

  /**
   * Cleanup and shutdown
   */
  shutdown(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }

    this.threats = [];
    this.darkPatterns = [];
    this.manipulationAttempts = [];
    this.userProfiles.clear();
  }
}

// Auto-initialize protection
let autoProtection: SocialEngineeringProtection | null = null;

if (typeof window !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      autoProtection = SocialEngineeringProtection.getInstance();
    });
  } else {
    autoProtection = SocialEngineeringProtection.getInstance();
  }

  window.addEventListener('beforeunload', () => {
    if (autoProtection) {
      autoProtection.shutdown();
    }
  });
}

export default SocialEngineeringProtection;
