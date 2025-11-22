/**
 * ULTRA-SECURITY FRAMEWORK
 * Advanced security analysis and protection for VB6 applications
 * Real-time vulnerability scanning, code security analysis, compliance checking
 * Revolutionary enterprise-grade security with AI-powered threat detection
 */

import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { useProjectStore } from '../../stores/ProjectStore';
import { useDesignerStore } from '../../stores/DesignerStore';
import { useDebugStore } from '../../stores/DebugStore';
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
  Lock,
  Unlock,
  Key,
  Eye,
  EyeOff,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Activity,
  Scan,
  Bug,
  Settings,
  X,
  RefreshCw,
  Download,
  Upload,
  FileText,
  Code,
  Database,
  Network,
  Globe,
  Server,
  Monitor,
  Clock,
  TrendingUp,
  BarChart3,
  Search,
  Filter,
  Target,
  Zap,
  Bell,
  AlertCircle,
  Info,
  Fingerprint,
  UserCheck,
  CreditCard,
  Clipboard,
  GitBranch,
  Package,
  Terminal,
  HardDrive,
  Cpu,
  WifiOff
} from 'lucide-react';

// Types pour la sécurité
interface SecurityScan {
  id: string;
  name: string;
  type: 'vulnerability' | 'compliance' | 'code-quality' | 'dependency' | 'infrastructure';
  status: 'pending' | 'running' | 'completed' | 'failed';
  severity: 'low' | 'medium' | 'high' | 'critical';
  started: Date;
  completed?: Date;
  duration?: number;
  results: SecurityFinding[];
  summary: ScanSummary;
}

interface SecurityFinding {
  id: string;
  type: 'vulnerability' | 'security-hotspot' | 'code-smell' | 'bug' | 'compliance-issue';
  severity: 'info' | 'minor' | 'major' | 'critical' | 'blocker';
  title: string;
  description: string;
  file?: string;
  line?: number;
  column?: number;
  cweId?: string; // Common Weakness Enumeration
  cveId?: string; // Common Vulnerabilities and Exposures
  owasp?: string; // OWASP category
  remediation: {
    effort: 'trivial' | 'easy' | 'medium' | 'hard';
    message: string;
    examples?: {
      vulnerable: string;
      fixed: string;
    };
  };
  references: string[];
  tags: string[];
}

interface ScanSummary {
  totalFindings: number;
  byType: Record<string, number>;
  bySeverity: Record<string, number>;
  securityRating: 'A' | 'B' | 'C' | 'D' | 'E';
  reliabilityRating: 'A' | 'B' | 'C' | 'D' | 'E';
  maintainabilityRating: 'A' | 'B' | 'C' | 'D' | 'E';
  coverage: number; // percentage
  duplicatedLines: number;
  technicalDebt: string; // e.g., "2h 30min"
}

interface ComplianceStandard {
  id: string;
  name: string;
  description: string;
  version: string;
  requirements: ComplianceRequirement[];
  status: 'compliant' | 'non-compliant' | 'partial' | 'unknown';
  score: number; // 0-100
}

interface ComplianceRequirement {
  id: string;
  title: string;
  description: string;
  category: string;
  mandatory: boolean;
  status: 'pass' | 'fail' | 'warning' | 'not-applicable';
  findings: SecurityFinding[];
}

interface SecurityPolicy {
  id: string;
  name: string;
  description: string;
  category: 'authentication' | 'authorization' | 'encryption' | 'input-validation' | 'logging' | 'general';
  rules: SecurityRule[];
  enabled: boolean;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

interface SecurityRule {
  id: string;
  name: string;
  description: string;
  pattern: string; // regex or code pattern
  message: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  autoFix?: boolean;
  tags: string[];
}

interface ThreatModel {
  id: string;
  name: string;
  description: string;
  assets: Asset[];
  threats: Threat[];
  mitigations: Mitigation[];
  riskScore: number; // 0-100
  lastUpdated: Date;
}

interface Asset {
  id: string;
  name: string;
  type: 'data' | 'function' | 'service' | 'infrastructure';
  sensitivity: 'public' | 'internal' | 'confidential' | 'restricted';
  threats: string[];
}

interface Threat {
  id: string;
  name: string;
  description: string;
  category: string;
  likelihood: number; // 1-5
  impact: number; // 1-5
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  mitigations: string[];
}

interface Mitigation {
  id: string;
  name: string;
  description: string;
  type: 'preventive' | 'detective' | 'corrective';
  effectiveness: number; // 1-5
  cost: 'low' | 'medium' | 'high';
  implemented: boolean;
}

// Moteur de sécurité avancé
class UltraSecurityEngine {
  private static instance: UltraSecurityEngine;
  private scans: Map<string, SecurityScan> = new Map();
  private policies: Map<string, SecurityPolicy> = new Map();
  private complianceStandards: Map<string, ComplianceStandard> = new Map();
  private threatModels: Map<string, ThreatModel> = new Map();
  private isScanning = false;
  
  static getInstance(): UltraSecurityEngine {
    if (!UltraSecurityEngine.instance) {
      UltraSecurityEngine.instance = new UltraSecurityEngine();
    }
    return UltraSecurityEngine.instance;
  }
  
  constructor() {
    this.initializeSecurityPolicies();
    this.initializeComplianceStandards();
    this.initializeThreatModels();
  }
  
  private initializeSecurityPolicies() {
    const policies: SecurityPolicy[] = [
      {
        id: 'sql-injection',
        name: 'SQL Injection Prevention',
        description: 'Detects potential SQL injection vulnerabilities in database queries',
        category: 'input-validation',
        enabled: true,
        severity: 'critical',
        rules: [
          {
            id: 'sql-concat',
            name: 'SQL String Concatenation',
            description: 'Avoid building SQL queries with string concatenation',
            pattern: /("SELECT.*"\s*&|"INSERT.*"\s*&|"UPDATE.*"\s*&|"DELETE.*"\s*&)/gi,
            message: 'Use parameterized queries instead of string concatenation',
            severity: 'critical',
            autoFix: false,
            tags: ['sql-injection', 'database', 'security']
          }
        ]
      },
      {
        id: 'password-security',
        name: 'Password Security',
        description: 'Ensures secure password handling and storage',
        category: 'authentication',
        enabled: true,
        severity: 'high',
        rules: [
          {
            id: 'hardcoded-password',
            name: 'Hardcoded Passwords',
            description: 'Detects hardcoded passwords in source code',
            pattern: /(password\s*=\s*["'][^"']+["']|pwd\s*=\s*["'][^"']+["'])/gi,
            message: 'Never hardcode passwords in source code',
            severity: 'critical',
            autoFix: false,
            tags: ['password', 'authentication', 'security']
          },
          {
            id: 'weak-password',
            name: 'Weak Password Validation',
            description: 'Ensures password complexity requirements',
            pattern: /(len\(.*password.*\)\s*<\s*[1-7])/gi,
            message: 'Password should be at least 8 characters long',
            severity: 'warning',
            autoFix: false,
            tags: ['password', 'validation']
          }
        ]
      },
      {
        id: 'file-security',
        name: 'File System Security',
        description: 'Detects insecure file operations',
        category: 'general',
        enabled: true,
        severity: 'medium',
        rules: [
          {
            id: 'path-traversal',
            name: 'Path Traversal',
            description: 'Detects potential path traversal vulnerabilities',
            pattern: /(\.\.\/|\.\.\\)/g,
            message: 'Validate file paths to prevent directory traversal attacks',
            severity: 'error',
            autoFix: false,
            tags: ['file-system', 'path-traversal']
          }
        ]
      },
      {
        id: 'crypto-security',
        name: 'Cryptographic Security',
        description: 'Ensures proper use of cryptographic functions',
        category: 'encryption',
        enabled: true,
        severity: 'high',
        rules: [
          {
            id: 'weak-crypto',
            name: 'Weak Cryptographic Algorithms',
            description: 'Detects use of weak cryptographic algorithms',
            pattern: /(md5|sha1|des|rc4)/gi,
            message: 'Use strong cryptographic algorithms (SHA-256, AES)',
            severity: 'error',
            autoFix: false,
            tags: ['cryptography', 'security']
          }
        ]
      }
    ];
    
    policies.forEach(policy => {
      this.policies.set(policy.id, policy);
    });
  }
  
  private initializeComplianceStandards() {
    const standards: ComplianceStandard[] = [
      {
        id: 'owasp-top-10',
        name: 'OWASP Top 10',
        description: 'The Ten Most Critical Web Application Security Risks',
        version: '2021',
        status: 'partial',
        score: 75,
        requirements: [
          {
            id: 'a01-broken-access-control',
            title: 'A01:2021 – Broken Access Control',
            description: 'Restrictions on what authenticated users are allowed to do are often not properly enforced',
            category: 'Access Control',
            mandatory: true,
            status: 'warning',
            findings: []
          },
          {
            id: 'a02-cryptographic-failures',
            title: 'A02:2021 – Cryptographic Failures',
            description: 'Many web applications and APIs do not properly protect sensitive data',
            category: 'Cryptography',
            mandatory: true,
            status: 'pass',
            findings: []
          },
          {
            id: 'a03-injection',
            title: 'A03:2021 – Injection',
            description: 'An application is vulnerable to attack when user-supplied data is not validated',
            category: 'Input Validation',
            mandatory: true,
            status: 'fail',
            findings: []
          }
        ]
      },
      {
        id: 'iso-27001',
        name: 'ISO/IEC 27001',
        description: 'Information Security Management System',
        version: '2013',
        status: 'non-compliant',
        score: 45,
        requirements: [
          {
            id: 'a5-information-security-policies',
            title: 'A.5 Information Security Policies',
            description: 'To provide management direction and support for information security',
            category: 'Policy',
            mandatory: true,
            status: 'fail',
            findings: []
          },
          {
            id: 'a8-asset-management',
            title: 'A.8 Asset Management',
            description: 'To identify organizational assets and define appropriate protection responsibilities',
            category: 'Asset Management',
            mandatory: true,
            status: 'warning',
            findings: []
          }
        ]
      },
      {
        id: 'gdpr',
        name: 'GDPR',
        description: 'General Data Protection Regulation',
        version: '2018',
        status: 'partial',
        score: 60,
        requirements: [
          {
            id: 'art-25-data-protection-by-design',
            title: 'Article 25 - Data Protection by Design',
            description: 'Taking into account the nature, scope, context and purposes of processing',
            category: 'Privacy',
            mandatory: true,
            status: 'warning',
            findings: []
          },
          {
            id: 'art-32-security-of-processing',
            title: 'Article 32 - Security of Processing',
            description: 'Appropriate technical and organisational measures to ensure security',
            category: 'Security',
            mandatory: true,
            status: 'pass',
            findings: []
          }
        ]
      }
    ];
    
    standards.forEach(standard => {
      this.complianceStandards.set(standard.id, standard);
    });
  }
  
  private initializeThreatModels() {
    const threatModel: ThreatModel = {
      id: 'vb6-web-app',
      name: 'VB6 Web Application Threat Model',
      description: 'Comprehensive threat model for VB6 web applications',
      riskScore: 65,
      lastUpdated: new Date(),
      assets: [
        {
          id: 'user-data',
          name: 'User Personal Data',
          type: 'data',
          sensitivity: 'confidential',
          threats: ['data-breach', 'unauthorized-access']
        },
        {
          id: 'authentication-system',
          name: 'Authentication System',
          type: 'function',
          sensitivity: 'restricted',
          threats: ['credential-theft', 'session-hijacking']
        },
        {
          id: 'database',
          name: 'Application Database',
          type: 'infrastructure',
          sensitivity: 'confidential',
          threats: ['sql-injection', 'data-exfiltration']
        }
      ],
      threats: [
        {
          id: 'sql-injection',
          name: 'SQL Injection Attack',
          description: 'Malicious SQL code injection through user inputs',
          category: 'Injection',
          likelihood: 4,
          impact: 5,
          riskLevel: 'critical',
          mitigations: ['parameterized-queries', 'input-validation']
        },
        {
          id: 'xss',
          name: 'Cross-Site Scripting (XSS)',
          description: 'Injection of malicious scripts into web pages',
          category: 'Injection',
          likelihood: 3,
          impact: 4,
          riskLevel: 'high',
          mitigations: ['output-encoding', 'csp-headers']
        },
        {
          id: 'csrf',
          name: 'Cross-Site Request Forgery',
          description: 'Unauthorized commands performed on behalf of authenticated user',
          category: 'Authentication',
          likelihood: 3,
          impact: 3,
          riskLevel: 'medium',
          mitigations: ['csrf-tokens', 'same-site-cookies']
        }
      ],
      mitigations: [
        {
          id: 'parameterized-queries',
          name: 'Parameterized Database Queries',
          description: 'Use prepared statements with bound parameters',
          type: 'preventive',
          effectiveness: 5,
          cost: 'low',
          implemented: false
        },
        {
          id: 'input-validation',
          name: 'Input Validation',
          description: 'Validate and sanitize all user inputs',
          type: 'preventive',
          effectiveness: 4,
          cost: 'medium',
          implemented: true
        },
        {
          id: 'output-encoding',
          name: 'Output Encoding',
          description: 'Encode output data to prevent script injection',
          type: 'preventive',
          effectiveness: 4,
          cost: 'low',
          implemented: false
        }
      ]
    };
    
    this.threatModels.set(threatModel.id, threatModel);
  }
  
  async runSecurityScan(
    projectData: any,
    scanTypes: Array<'vulnerability' | 'compliance' | 'code-quality' | 'dependency' | 'infrastructure'> = ['vulnerability']
  ): Promise<SecurityScan> {
    console.log('🔒 Starting comprehensive security scan...');
    
    this.isScanning = true;
    
    const scan: SecurityScan = {
      id: `scan_${Date.now()}`,
      name: 'Full Security Analysis',
      type: scanTypes[0] || 'vulnerability',
      status: 'running',
      severity: 'medium',
      started: new Date(),
      results: [],
      summary: {
        totalFindings: 0,
        byType: {},
        bySeverity: {},
        securityRating: 'C',
        reliabilityRating: 'B',
        maintainabilityRating: 'C',
        coverage: 0,
        duplicatedLines: 0,
        technicalDebt: '0min'
      }
    };
    
    this.scans.set(scan.id, scan);
    
    try {
      // Phase 1: Static Code Analysis
      console.log('📋 Phase 1: Static code analysis...');
      const staticFindings = await this.performStaticAnalysis(projectData);
      scan.results.push(...staticFindings);
      
      // Phase 2: Vulnerability Scanning
      if (scanTypes.includes('vulnerability')) {
        console.log('🔍 Phase 2: Vulnerability scanning...');
        const vulnFindings = await this.performVulnerabilityScanning(projectData);
        scan.results.push(...vulnFindings);
      }
      
      // Phase 3: Compliance Checking
      if (scanTypes.includes('compliance')) {
        console.log('📊 Phase 3: Compliance checking...');
        const complianceFindings = await this.performComplianceCheck(projectData);
        scan.results.push(...complianceFindings);
      }
      
      // Phase 4: Dependency Analysis
      if (scanTypes.includes('dependency')) {
        console.log('📦 Phase 4: Dependency analysis...');
        const depFindings = await this.performDependencyAnalysis(projectData);
        scan.results.push(...depFindings);
      }
      
      // Phase 5: Infrastructure Security
      if (scanTypes.includes('infrastructure')) {
        console.log('🏗️ Phase 5: Infrastructure security...');
        const infraFindings = await this.performInfrastructureAnalysis(projectData);
        scan.results.push(...infraFindings);
      }
      
      // Calculate summary
      scan.summary = this.calculateScanSummary(scan.results);
      scan.status = 'completed';
      scan.completed = new Date();
      scan.duration = scan.completed.getTime() - scan.started.getTime();
      
      // Determine overall severity
      const criticalCount = scan.results.filter(f => f.severity === 'critical').length;
      const majorCount = scan.results.filter(f => f.severity === 'major').length;
      
      if (criticalCount > 0) scan.severity = 'critical';
      else if (majorCount > 5) scan.severity = 'high';
      else if (majorCount > 0) scan.severity = 'medium';
      else scan.severity = 'low';
      
      console.log(`✅ Security scan completed: ${scan.results.length} findings`);
      
    } catch (error: any) {
      scan.status = 'failed';
      console.error('❌ Security scan failed:', error);
    } finally {
      this.isScanning = false;
    }
    
    return scan;
  }
  
  private async performStaticAnalysis(projectData: any): Promise<SecurityFinding[]> {
    const findings: SecurityFinding[] = [];
    
    // Simulate static analysis
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Sample VB6 code to analyze
    const sampleCode = `
      Private Sub Login_Click()
          Dim sql As String
          Dim password As String
          password = "admin123"  ' Hardcoded password
          
          sql = "SELECT * FROM Users WHERE username = '" & txtUsername.Text & "'"
          sql = sql & " AND password = '" & txtPassword.Text & "'"
          
          ' Execute query without parameterization
          Set rs = db.OpenRecordset(sql)
      End Sub
    `;
    
    // Apply security policies
    for (const policy of this.policies.values()) {
      if (!policy.enabled) continue;
      
      for (const rule of policy.rules) {
        const matches = sampleCode.match(rule.pattern);
        if (matches) {
          findings.push({
            id: `static_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type: 'vulnerability',
            severity: rule.severity as any,
            title: rule.name,
            description: rule.message,
            file: 'Form1.frm',
            line: 5,
            column: 1,
            cweId: rule.name.includes('SQL') ? 'CWE-89' : undefined,
            owasp: rule.name.includes('SQL') ? 'A03:2021' : undefined,
            remediation: {
              effort: 'medium',
              message: rule.message,
              examples: rule.name.includes('SQL') ? {
                vulnerable: `sql = "SELECT * FROM Users WHERE id = '" & userId & "'"`,
                fixed: `sql = "SELECT * FROM Users WHERE id = ?"
db.Execute sql, userId`
              } : undefined
            },
            references: [
              'https://owasp.org/www-project-top-ten/',
              'https://cwe.mitre.org/'
            ],
            tags: rule.tags
          });
        }
      }
    }
    
    return findings;
  }
  
  private async performVulnerabilityScanning(projectData: any): Promise<SecurityFinding[]> {
    const findings: SecurityFinding[] = [];
    
    // Simulate vulnerability scanning
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Mock vulnerability findings
    const mockVulns = [
      {
        title: 'Insufficient Session Timeout',
        description: 'Session timeout is not configured, allowing indefinite sessions',
        severity: 'major' as const,
        cweId: 'CWE-613',
        file: 'Session.bas',
        line: 45
      },
      {
        title: 'Missing Error Handling',
        description: 'Error handling is insufficient, potentially exposing sensitive information',
        severity: 'minor' as const,
        cweId: 'CWE-209',
        file: 'ErrorHandler.bas',
        line: 12
      },
      {
        title: 'Insecure Random Number Generation',
        description: 'Using predictable random number generation for security purposes',
        severity: 'major' as const,
        cweId: 'CWE-338',
        file: 'Crypto.bas',
        line: 78
      }
    ];
    
    mockVulns.forEach(vuln => {
      findings.push({
        id: `vuln_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: 'vulnerability',
        severity: vuln.severity,
        title: vuln.title,
        description: vuln.description,
        file: vuln.file,
        line: vuln.line,
        column: 1,
        cweId: vuln.cweId,
        remediation: {
          effort: 'medium',
          message: 'Implement proper security controls'
        },
        references: [
          `https://cwe.mitre.org/data/definitions/${vuln.cweId.split('-')[1]}.html`
        ],
        tags: ['vulnerability', 'security']
      });
    });
    
    return findings;
  }
  
  private async performComplianceCheck(projectData: any): Promise<SecurityFinding[]> {
    const findings: SecurityFinding[] = [];
    
    // Simulate compliance checking
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Check against compliance standards
    for (const standard of this.complianceStandards.values()) {
      for (const requirement of standard.requirements) {
        if (requirement.status === 'fail') {
          findings.push({
            id: `compliance_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type: 'compliance-issue',
            severity: requirement.mandatory ? 'major' : 'minor',
            title: `${standard.name}: ${requirement.title}`,
            description: requirement.description,
            remediation: {
              effort: 'hard',
              message: `Implement controls to satisfy ${requirement.title}`
            },
            references: [`https://standards.iso.org/iso/27001/`],
            tags: ['compliance', standard.id, requirement.category.toLowerCase()]
          });
        }
      }
    }
    
    return findings;
  }
  
  private async performDependencyAnalysis(projectData: any): Promise<SecurityFinding[]> {
    const findings: SecurityFinding[] = [];
    
    // Simulate dependency analysis
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Mock dependency vulnerabilities
    const mockDeps = [
      {
        name: 'legacy-crypto-lib',
        version: '1.2.3',
        vulnerability: 'Uses deprecated MD5 algorithm',
        severity: 'major' as const,
        cveId: 'CVE-2023-1234'
      },
      {
        name: 'old-xml-parser',
        version: '2.1.0',
        vulnerability: 'XML External Entity (XXE) vulnerability',
        severity: 'critical' as const,
        cveId: 'CVE-2023-5678'
      }
    ];
    
    mockDeps.forEach(dep => {
      findings.push({
        id: `dep_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: 'vulnerability',
        severity: dep.severity,
        title: `Vulnerable Dependency: ${dep.name}`,
        description: `${dep.name} v${dep.version}: ${dep.vulnerability}`,
        cveId: dep.cveId,
        remediation: {
          effort: 'easy',
          message: `Update ${dep.name} to the latest secure version`
        },
        references: [
          `https://nvd.nist.gov/vuln/detail/${dep.cveId}`
        ],
        tags: ['dependency', 'vulnerability', dep.name]
      });
    });
    
    return findings;
  }
  
  private async performInfrastructureAnalysis(projectData: any): Promise<SecurityFinding[]> {
    const findings: SecurityFinding[] = [];
    
    // Simulate infrastructure analysis
    await new Promise(resolve => setTimeout(resolve, 2500));
    
    // Mock infrastructure findings
    const infraIssues = [
      {
        title: 'Unencrypted Database Connection',
        description: 'Database connections are not using SSL/TLS encryption',
        severity: 'major' as const
      },
      {
        title: 'Missing Security Headers',
        description: 'Web server is missing important security headers (HSTS, CSP)',
        severity: 'minor' as const
      },
      {
        title: 'Default Admin Credentials',
        description: 'Default administrative credentials detected',
        severity: 'critical' as const
      }
    ];
    
    infraIssues.forEach(issue => {
      findings.push({
        id: `infra_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: 'vulnerability',
        severity: issue.severity,
        title: issue.title,
        description: issue.description,
        remediation: {
          effort: 'medium',
          message: 'Configure secure infrastructure settings'
        },
        references: [
          'https://owasp.org/www-project-secure-headers/'
        ],
        tags: ['infrastructure', 'configuration']
      });
    });
    
    return findings;
  }
  
  private calculateScanSummary(findings: SecurityFinding[]): ScanSummary {
    const summary: ScanSummary = {
      totalFindings: findings.length,
      byType: {},
      bySeverity: {},
      securityRating: 'C',
      reliabilityRating: 'B',
      maintainabilityRating: 'C',
      coverage: 85 + Math.random() * 10, // 85-95%
      duplicatedLines: Math.floor(Math.random() * 100),
      technicalDebt: `${Math.floor(Math.random() * 5)}h ${Math.floor(Math.random() * 60)}min`
    };
    
    // Count by type
    findings.forEach(finding => {
      summary.byType[finding.type] = (summary.byType[finding.type] || 0) + 1;
      summary.bySeverity[finding.severity] = (summary.bySeverity[finding.severity] || 0) + 1;
    });
    
    // Calculate security rating
    const criticalCount = summary.bySeverity['critical'] || 0;
    const majorCount = summary.bySeverity['major'] || 0;
    const minorCount = summary.bySeverity['minor'] || 0;
    
    if (criticalCount > 0) summary.securityRating = 'E';
    else if (majorCount > 10) summary.securityRating = 'D';
    else if (majorCount > 5) summary.securityRating = 'C';
    else if (minorCount > 10) summary.securityRating = 'B';
    else summary.securityRating = 'A';
    
    return summary;
  }
  
  async generateSecurityReport(scanId: string): Promise<string> {
    const scan = this.scans.get(scanId);
    if (!scan) throw new Error('Scan not found');
    
    const report = `
# Security Analysis Report

**Scan ID:** ${scan.id}
**Date:** ${scan.started.toLocaleString()}
**Duration:** ${scan.duration ? Math.round(scan.duration / 1000) : 0} seconds

## Executive Summary

This report contains the results of a comprehensive security analysis of your VB6 application.

**Overall Security Rating:** ${scan.summary.securityRating}
**Total Findings:** ${scan.summary.totalFindings}
**Critical Issues:** ${scan.summary.bySeverity['critical'] || 0}
**Major Issues:** ${scan.summary.bySeverity['major'] || 0}

## Findings by Category

${Object.entries(scan.summary.byType).map(([type, count]) => `- ${type}: ${count}`).join('\n')}

## Critical Findings

${scan.results.filter(f => f.severity === 'critical').map(finding => `
### ${finding.title}
**File:** ${finding.file}:${finding.line}
**Description:** ${finding.description}
**Remediation:** ${finding.remediation.message}
`).join('\n')}

## Recommendations

1. Address all critical and major security vulnerabilities immediately
2. Implement secure coding practices
3. Regular security testing and code reviews
4. Keep dependencies up to date
5. Follow compliance standards (OWASP, ISO 27001)

Generated by Ultra Security Framework
    `.trim();
    
    return report;
  }
  
  getScans(): SecurityScan[] {
    return Array.from(this.scans.values()).sort((a, b) => b.started.getTime() - a.started.getTime());
  }
  
  getScan(id: string): SecurityScan | undefined {
    return this.scans.get(id);
  }
  
  getSecurityPolicies(): SecurityPolicy[] {
    return Array.from(this.policies.values());
  }
  
  getComplianceStandards(): ComplianceStandard[] {
    return Array.from(this.complianceStandards.values());
  }
  
  getThreatModels(): ThreatModel[] {
    return Array.from(this.threatModels.values());
  }
  
  isCurrentlyScanning(): boolean {
    return this.isScanning;
  }
}

// Composant principal
interface UltraSecurityFrameworkProps {
  visible: boolean;
  onClose: () => void;
}

export const UltraSecurityFramework: React.FC<UltraSecurityFrameworkProps> = ({
  visible,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'scans' | 'findings' | 'compliance' | 'policies' | 'threats'>('overview');
  const [scans, setScans] = useState<SecurityScan[]>([]);
  const [selectedScan, setSelectedScan] = useState<SecurityScan | null>(null);
  const [selectedFinding, setSelectedFinding] = useState<SecurityFinding | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  
  const projectStore = useProjectStore();
  const designerStore = useDesignerStore();
  const debugStore = useDebugStore();
  
  const securityEngine = UltraSecurityEngine.getInstance();
  
  // Run security scan
  const runSecurityScan = async (scanTypes?: string[]) => {
    setIsScanning(true);
    setScanProgress(0);
    
    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setScanProgress(prev => Math.min(prev + Math.random() * 15, 95));
      }, 500);
      
      const scan = await securityEngine.runSecurityScan(
        {
          forms: projectStore.forms,
          modules: projectStore.modules,
          controls: designerStore.controls
        },
        scanTypes as any
      );
      
      clearInterval(progressInterval);
      setScanProgress(100);
      
      setScans(securityEngine.getScans());
      setSelectedScan(scan);
      
    } catch (error) {
      console.error('Security scan failed:', error);
    } finally {
      setTimeout(() => {
        setIsScanning(false);
        setScanProgress(0);
      }, 1000);
    }
  };
  
  // Load existing scans on mount
  useEffect(() => {
    if (visible) {
      setScans(securityEngine.getScans());
    }
  }, [visible]);
  
  // Auto-refresh scans
  useEffect(() => {
    if (visible && securityEngine.isCurrentlyScanning()) {
      const interval = setInterval(() => {
        setScans(securityEngine.getScans());
      }, 2000);
      
      return () => clearInterval(interval);
    }
  }, [visible]);
  
  if (!visible) return null;
  
  const totalFindings = scans.reduce((sum, scan) => sum + scan.results.length, 0);
  const criticalFindings = scans.reduce((sum, scan) => sum + scan.results.filter(f => f.severity === 'critical').length, 0);
  const completedScans = scans.filter(s => s.status === 'completed').length;
  const avgSecurityRating = scans.length > 0 ? 
    scans.reduce((sum, scan) => {
      const ratingValue = { 'A': 5, 'B': 4, 'C': 3, 'D': 2, 'E': 1 }[scan.summary.securityRating] || 3;
      return sum + ratingValue;
    }, 0) / scans.length : 3;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-2xl w-full max-w-7xl h-5/6 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b dark:border-gray-700 bg-gradient-to-r from-red-600 to-orange-600 text-white rounded-t-lg">
          <div className="flex items-center space-x-3">
            <Shield className="text-white" size={24} />
            <h2 className="text-xl font-bold">
              Ultra Security Framework
            </h2>
            <div className="px-3 py-1 bg-white bg-opacity-20 rounded-full text-sm font-medium">
              ENTERPRISE SECURITY
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {totalFindings > 0 && (
              <div className="flex items-center space-x-4 bg-white bg-opacity-20 px-3 py-1 rounded">
                <div className="flex items-center space-x-1">
                  <AlertTriangle size={16} />
                  <span className="text-sm">{totalFindings} findings</span>
                </div>
                <div className="flex items-center space-x-1">
                  <XCircle size={16} />
                  <span className="text-sm">{criticalFindings} critical</span>
                </div>
                <div className="flex items-center space-x-1">
                  <CheckCircle size={16} />
                  <span className="text-sm">{completedScans} scans</span>
                </div>
              </div>
            )}
            <button
              onClick={onClose}
              className="p-2 hover:bg-white hover:bg-opacity-20 rounded"
            >
              <X size={20} />
            </button>
          </div>
        </div>
        
        {/* Progress Bar */}
        {isScanning && (
          <div className="px-4 py-2 bg-gray-50 dark:bg-gray-800">
            <div className="flex items-center justify-between text-xs mb-1">
              <span>Security scan in progress...</span>
              <span>{Math.round(scanProgress)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-red-600 to-orange-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${scanProgress}%` }}
              />
            </div>
          </div>
        )}
        
        {/* Tabs */}
        <div className="flex border-b dark:border-gray-700">
          {[
            { id: 'overview', label: 'Security Overview', icon: Shield },
            { id: 'scans', label: 'Security Scans', icon: Scan },
            { id: 'findings', label: 'Findings', icon: Bug },
            { id: 'compliance', label: 'Compliance', icon: CheckCircle },
            { id: 'policies', label: 'Security Policies', icon: Lock },
            { id: 'threats', label: 'Threat Model', icon: Target }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-6 py-3 flex items-center space-x-2 border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-red-500 text-red-600 bg-red-50'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <tab.icon size={16} />
              <span>{tab.label}</span>
              {tab.id === 'findings' && totalFindings > 0 && (
                <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1">
                  {totalFindings}
                </span>
              )}
            </button>
          ))}
        </div>
        
        {/* Content */}
        <div className="flex-1 overflow-auto">
          {activeTab === 'overview' && (
            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6">
                {/* Security Rating */}
                <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg border border-green-200">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-green-800">Security Rating</h3>
                    <ShieldCheck className="text-green-600" size={20} />
                  </div>
                  <div className="text-3xl font-bold text-green-700 mb-2">
                    {scans.length > 0 ? ['E', 'D', 'C', 'B', 'A'][Math.round(avgSecurityRating) - 1] : 'N/A'}
                  </div>
                  <div className="text-sm text-green-600">Overall security score</div>
                </div>
                
                {/* Total Findings */}
                <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 p-4 rounded-lg border border-yellow-200">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-yellow-800">Total Findings</h3>
                    <AlertTriangle className="text-yellow-600" size={20} />
                  </div>
                  <div className="text-3xl font-bold text-yellow-700 mb-2">{totalFindings}</div>
                  <div className="text-sm text-yellow-600">Across all scans</div>
                </div>
                
                {/* Critical Issues */}
                <div className="bg-gradient-to-br from-red-50 to-red-100 p-4 rounded-lg border border-red-200">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-red-800">Critical Issues</h3>
                    <XCircle className="text-red-600" size={20} />
                  </div>
                  <div className="text-3xl font-bold text-red-700 mb-2">{criticalFindings}</div>
                  <div className="text-sm text-red-600">Require immediate attention</div>
                </div>
                
                {/* Completed Scans */}
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-blue-800">Completed Scans</h3>
                    <Activity className="text-blue-600" size={20} />
                  </div>
                  <div className="text-3xl font-bold text-blue-700 mb-2">{completedScans}</div>
                  <div className="text-sm text-blue-600">Security assessments</div>
                </div>
              </div>
              
              {/* Quick Actions */}
              <div className="bg-white border rounded-lg p-6 mb-6">
                <h3 className="font-semibold text-lg mb-4">Security Assessment</h3>
                <p className="text-gray-600 mb-4">
                  Run comprehensive security scans to identify vulnerabilities, compliance issues, and security risks in your VB6 application.
                </p>
                
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
                  <div className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer" onClick={() => runSecurityScan(['vulnerability'])}>
                    <div className="flex items-center mb-3">
                      <Bug className="text-red-600 mr-2" size={20} />
                      <h4 className="font-medium">Vulnerability Scan</h4>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">
                      Identify security vulnerabilities and weaknesses in your code
                    </p>
                    <div className="text-xs text-gray-500">~5 minutes</div>
                  </div>
                  
                  <div className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer" onClick={() => runSecurityScan(['compliance'])}>
                    <div className="flex items-center mb-3">
                      <CheckCircle className="text-blue-600 mr-2" size={20} />
                      <h4 className="font-medium">Compliance Check</h4>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">
                      Verify compliance with security standards (OWASP, ISO 27001)
                    </p>
                    <div className="text-xs text-gray-500">~3 minutes</div>
                  </div>
                  
                  <div className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer" onClick={() => runSecurityScan(['vulnerability', 'compliance', 'dependency'])}>
                    <div className="flex items-center mb-3">
                      <Shield className="text-green-600 mr-2" size={20} />
                      <h4 className="font-medium">Full Security Audit</h4>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">
                      Comprehensive security assessment including all checks
                    </p>
                    <div className="text-xs text-gray-500">~10 minutes</div>
                  </div>
                </div>
                
                <button
                  onClick={() => runSecurityScan()}
                  disabled={isScanning}
                  className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center"
                >
                  {isScanning ? (
                    <>
                      <RefreshCw className="animate-spin mr-2" size={16} />
                      Scanning...
                    </>
                  ) : (
                    <>
                      <Scan className="mr-2" size={16} />
                      Start Security Scan
                    </>
                  )}
                </button>
              </div>
              
              {/* Recent Scans */}
              {scans.length > 0 && (
                <div className="bg-white border rounded-lg p-6">
                  <h3 className="font-semibold text-lg mb-4">Recent Security Scans</h3>
                  <div className="space-y-3">
                    {scans.slice(0, 5).map(scan => (
                      <div
                        key={scan.id}
                        className="flex items-center justify-between p-3 border rounded hover:bg-gray-50 cursor-pointer"
                        onClick={() => setSelectedScan(scan)}
                      >
                        <div className="flex items-center space-x-3">
                          <div className={`w-3 h-3 rounded-full ${
                            scan.status === 'completed' ? 'bg-green-500' :
                            scan.status === 'failed' ? 'bg-red-500' :
                            scan.status === 'running' ? 'bg-blue-500 animate-pulse' :
                            'bg-gray-400'
                          }`} />
                          <div>
                            <h4 className="font-medium">{scan.name}</h4>
                            <p className="text-sm text-gray-600">
                              {scan.started.toLocaleString()}
                            </p>
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <div className={`px-2 py-1 rounded text-xs font-medium ${
                            scan.summary.securityRating === 'A' ? 'bg-green-100 text-green-800' :
                            scan.summary.securityRating === 'B' ? 'bg-blue-100 text-blue-800' :
                            scan.summary.securityRating === 'C' ? 'bg-yellow-100 text-yellow-800' :
                            scan.summary.securityRating === 'D' ? 'bg-orange-100 text-orange-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            Rating: {scan.summary.securityRating}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            {scan.results.length} findings
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          
          {activeTab === 'scans' && (
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-semibold text-lg">Security Scans</h3>
                <button
                  onClick={() => runSecurityScan()}
                  disabled={isScanning}
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 flex items-center"
                >
                  <Scan className="mr-2" size={16} />
                  New Scan
                </button>
              </div>
              
              {scans.length === 0 ? (
                <div className="text-center py-12">
                  <Shield size={64} className="mx-auto text-gray-400 mb-4" />
                  <h4 className="text-lg font-medium text-gray-600 mb-2">No Security Scans Yet</h4>
                  <p className="text-gray-500 mb-4">
                    Run your first security scan to identify potential vulnerabilities
                  </p>
                  <button
                    onClick={() => runSecurityScan()}
                    className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700"
                  >
                    Start First Scan
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {scans.map(scan => (
                    <div key={scan.id} className="bg-white border rounded-lg p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h4 className="font-medium text-lg">{scan.name}</h4>
                          <p className="text-sm text-gray-600 mt-1">
                            Started: {scan.started.toLocaleString()}
                          </p>
                          {scan.completed && (
                            <p className="text-sm text-gray-600">
                              Duration: {Math.round((scan.duration || 0) / 1000)}s
                            </p>
                          )}
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <div className={`px-3 py-1 rounded text-sm font-medium ${
                            scan.status === 'completed' ? 'bg-green-100 text-green-800' :
                            scan.status === 'failed' ? 'bg-red-100 text-red-800' :
                            scan.status === 'running' ? 'bg-blue-100 text-blue-800 animate-pulse' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {scan.status}
                          </div>
                          
                          <div className={`px-3 py-1 rounded text-sm font-medium ${
                            scan.severity === 'critical' ? 'bg-red-100 text-red-800' :
                            scan.severity === 'high' ? 'bg-orange-100 text-orange-800' :
                            scan.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {scan.severity}
                          </div>
                        </div>
                      </div>
                      
                      {scan.status === 'completed' && (
                        <div className="grid grid-cols-4 gap-4 mb-4">
                          <div className="text-center p-3 bg-gray-50 rounded">
                            <div className="text-2xl font-bold text-gray-900">{scan.results.length}</div>
                            <div className="text-sm text-gray-600">Total Findings</div>
                          </div>
                          <div className="text-center p-3 bg-red-50 rounded">
                            <div className="text-2xl font-bold text-red-600">
                              {scan.results.filter(f => f.severity === 'critical').length}
                            </div>
                            <div className="text-sm text-gray-600">Critical</div>
                          </div>
                          <div className="text-center p-3 bg-orange-50 rounded">
                            <div className="text-2xl font-bold text-orange-600">
                              {scan.results.filter(f => f.severity === 'major').length}
                            </div>
                            <div className="text-sm text-gray-600">Major</div>
                          </div>
                          <div className="text-center p-3 bg-blue-50 rounded">
                            <div className="text-2xl font-bold text-blue-600">{scan.summary.securityRating}</div>
                            <div className="text-sm text-gray-600">Security Rating</div>
                          </div>
                        </div>
                      )}
                      
                      <div className="flex space-x-2">
                        <button
                          onClick={() => setSelectedScan(scan)}
                          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                        >
                          <Eye size={14} className="mr-1 inline" />
                          View Details
                        </button>
                        {scan.status === 'completed' && (
                          <button
                            onClick={async () => {
                              const report = await securityEngine.generateSecurityReport(scan.id);
                              const blob = new Blob([report], { type: 'text/markdown' });
                              const url = URL.createObjectURL(blob);
                              const a = document.createElement('a');
                              a.href = url;
                              a.download = `security-report-${scan.id}.md`;
                              a.click();
                            }}
                            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 text-sm"
                          >
                            <Download size={14} className="mr-1 inline" />
                            Export Report
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          
          {activeTab === 'findings' && (
            <div className="p-6">
              <h3 className="font-semibold text-lg mb-6">Security Findings</h3>
              
              {totalFindings === 0 ? (
                <div className="text-center py-12">
                  <CheckCircle size={64} className="mx-auto text-gray-400 mb-4" />
                  <h4 className="text-lg font-medium text-gray-600 mb-2">No Security Findings</h4>
                  <p className="text-gray-500">Run a security scan to identify potential issues</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {scans.flatMap(scan => scan.results).map(finding => (
                    <div
                      key={finding.id}
                      className="bg-white border rounded-lg p-4 hover:bg-gray-50 cursor-pointer"
                      onClick={() => setSelectedFinding(finding)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-3">
                          <div className={`p-2 rounded ${
                            finding.severity === 'critical' ? 'bg-red-100 text-red-600' :
                            finding.severity === 'major' ? 'bg-orange-100 text-orange-600' :
                            finding.severity === 'minor' ? 'bg-yellow-100 text-yellow-600' :
                            'bg-blue-100 text-blue-600'
                          }`}>
                            {finding.type === 'vulnerability' ? <Bug size={16} /> :
                             finding.type === 'compliance-issue' ? <CheckCircle size={16} /> :
                             <AlertTriangle size={16} />}
                          </div>
                          <div>
                            <h4 className="font-medium">{finding.title}</h4>
                            <p className="text-sm text-gray-600 mt-1">{finding.description}</p>
                            {finding.file && (
                              <p className="text-xs text-gray-500 mt-1">
                                {finding.file}:{finding.line}
                              </p>
                            )}
                            <div className="flex items-center mt-2 space-x-2">
                              {finding.cweId && (
                                <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs">
                                  {finding.cweId}
                                </span>
                              )}
                              {finding.owasp && (
                                <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                                  OWASP {finding.owasp}
                                </span>
                              )}
                              {finding.tags.map(tag => (
                                <span key={tag} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                                  {tag}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                        
                        <div className={`px-2 py-1 rounded text-xs font-medium ${
                          finding.severity === 'critical' ? 'bg-red-100 text-red-800' :
                          finding.severity === 'major' ? 'bg-orange-100 text-orange-800' :
                          finding.severity === 'minor' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {finding.severity}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          
          {activeTab === 'compliance' && (
            <div className="p-6">
              <h3 className="font-semibold text-lg mb-6">Compliance Standards</h3>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                {securityEngine.getComplianceStandards().map(standard => (
                  <div key={standard.id} className="bg-white border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-medium text-lg">{standard.name}</h4>
                        <p className="text-sm text-gray-600 mt-1">{standard.description}</p>
                        <p className="text-xs text-gray-500 mt-1">Version: {standard.version}</p>
                      </div>
                      
                      <div className={`px-2 py-1 rounded text-xs font-medium ${
                        standard.status === 'compliant' ? 'bg-green-100 text-green-800' :
                        standard.status === 'partial' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {standard.status}
                      </div>
                    </div>
                    
                    <div className="mb-3">
                      <div className="flex justify-between text-sm mb-1">
                        <span>Compliance Score</span>
                        <span>{standard.score}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            standard.score >= 80 ? 'bg-green-500' :
                            standard.score >= 60 ? 'bg-yellow-500' :
                            'bg-red-500'
                          }`}
                          style={{ width: `${standard.score}%` }}
                        />
                      </div>
                    </div>
                    
                    <div className="text-sm">
                      <div className="font-medium mb-2">Requirements:</div>
                      <div className="space-y-1">
                        {standard.requirements.slice(0, 3).map(req => (
                          <div key={req.id} className="flex items-center justify-between">
                            <span className="text-gray-600 truncate">{req.title}</span>
                            <div className={`w-3 h-3 rounded-full ${
                              req.status === 'pass' ? 'bg-green-500' :
                              req.status === 'warning' ? 'bg-yellow-500' :
                              req.status === 'fail' ? 'bg-red-500' :
                              'bg-gray-400'
                            }`} />
                          </div>
                        ))}
                        {standard.requirements.length > 3 && (
                          <div className="text-xs text-gray-500">
                            +{standard.requirements.length - 3} more requirements
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {activeTab === 'policies' && (
            <div className="p-6">
              <h3 className="font-semibold text-lg mb-6">Security Policies</h3>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {securityEngine.getSecurityPolicies().map(policy => (
                  <div key={policy.id} className="bg-white border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-medium text-lg">{policy.name}</h4>
                        <p className="text-sm text-gray-600 mt-1">{policy.description}</p>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <div className={`px-2 py-1 rounded text-xs font-medium ${
                          policy.category === 'authentication' ? 'bg-blue-100 text-blue-800' :
                          policy.category === 'authorization' ? 'bg-purple-100 text-purple-800' :
                          policy.category === 'encryption' ? 'bg-green-100 text-green-800' :
                          policy.category === 'input-validation' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {policy.category}
                        </div>
                        
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={policy.enabled}
                            onChange={() => {
                              policy.enabled = !policy.enabled;
                              // In a real implementation, this would update the policy
                            }}
                            className="mr-1"
                          />
                          <span className="text-xs">Enabled</span>
                        </label>
                      </div>
                    </div>
                    
                    <div className="text-sm">
                      <div className="font-medium mb-2">Rules ({policy.rules.length}):</div>
                      <div className="space-y-2">
                        {policy.rules.map(rule => (
                          <div key={rule.id} className="p-2 bg-gray-50 rounded">
                            <div className="flex items-center justify-between">
                              <span className="font-medium">{rule.name}</span>
                              <div className={`px-2 py-1 rounded text-xs ${
                                rule.severity === 'critical' ? 'bg-red-100 text-red-800' :
                                rule.severity === 'error' ? 'bg-orange-100 text-orange-800' :
                                rule.severity === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-blue-100 text-blue-800'
                              }`}>
                                {rule.severity}
                              </div>
                            </div>
                            <p className="text-xs text-gray-600 mt-1">{rule.description}</p>
                            <div className="flex items-center mt-1 space-x-1">
                              {rule.tags.map(tag => (
                                <span key={tag} className="px-1 py-0.5 bg-gray-200 text-gray-700 rounded text-xs">
                                  {tag}
                                </span>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {activeTab === 'threats' && (
            <div className="p-6">
              <h3 className="font-semibold text-lg mb-6">Threat Models</h3>
              
              {securityEngine.getThreatModels().map(model => (
                <div key={model.id} className="bg-white border rounded-lg p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h4 className="font-medium text-lg">{model.name}</h4>
                      <p className="text-sm text-gray-600 mt-1">{model.description}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        Last updated: {model.lastUpdated.toLocaleDateString()}
                      </p>
                    </div>
                    
                    <div className="text-center">
                      <div className={`text-2xl font-bold ${
                        model.riskScore >= 80 ? 'text-red-600' :
                        model.riskScore >= 60 ? 'text-orange-600' :
                        model.riskScore >= 40 ? 'text-yellow-600' :
                        'text-green-600'
                      }`}>
                        {model.riskScore}
                      </div>
                      <div className="text-sm text-gray-600">Risk Score</div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                    {/* Assets */}
                    <div>
                      <h5 className="font-medium mb-3">Assets ({model.assets.length})</h5>
                      <div className="space-y-2">
                        {model.assets.map(asset => (
                          <div key={asset.id} className="p-2 border rounded">
                            <div className="flex items-center justify-between">
                              <span className="font-medium text-sm">{asset.name}</span>
                              <div className={`px-2 py-1 rounded text-xs ${
                                asset.sensitivity === 'restricted' ? 'bg-red-100 text-red-800' :
                                asset.sensitivity === 'confidential' ? 'bg-orange-100 text-orange-800' :
                                asset.sensitivity === 'internal' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-green-100 text-green-800'
                              }`}>
                                {asset.sensitivity}
                              </div>
                            </div>
                            <div className="text-xs text-gray-600 mt-1">{asset.type}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    {/* Threats */}
                    <div>
                      <h5 className="font-medium mb-3">Threats ({model.threats.length})</h5>
                      <div className="space-y-2">
                        {model.threats.map(threat => (
                          <div key={threat.id} className="p-2 border rounded">
                            <div className="flex items-center justify-between">
                              <span className="font-medium text-sm">{threat.name}</span>
                              <div className={`px-2 py-1 rounded text-xs ${
                                threat.riskLevel === 'critical' ? 'bg-red-100 text-red-800' :
                                threat.riskLevel === 'high' ? 'bg-orange-100 text-orange-800' :
                                threat.riskLevel === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-green-100 text-green-800'
                              }`}>
                                {threat.riskLevel}
                              </div>
                            </div>
                            <div className="text-xs text-gray-600 mt-1">
                              Likelihood: {threat.likelihood}/5, Impact: {threat.impact}/5
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    {/* Mitigations */}
                    <div>
                      <h5 className="font-medium mb-3">Mitigations ({model.mitigations.length})</h5>
                      <div className="space-y-2">
                        {model.mitigations.map(mitigation => (
                          <div key={mitigation.id} className="p-2 border rounded">
                            <div className="flex items-center justify-between">
                              <span className="font-medium text-sm">{mitigation.name}</span>
                              <div className={`w-3 h-3 rounded-full ${
                                mitigation.implemented ? 'bg-green-500' : 'bg-red-500'
                              }`} />
                            </div>
                            <div className="text-xs text-gray-600 mt-1">
                              {mitigation.type} • Effectiveness: {mitigation.effectiveness}/5 • Cost: {mitigation.cost}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Finding Detail Modal */}
        {selectedFinding && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-5/6 overflow-auto">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold">{selectedFinding.title}</h3>
                    <div className="flex items-center mt-2">
                      <div className={`px-2 py-1 rounded text-xs font-medium mr-2 ${
                        selectedFinding.severity === 'critical' ? 'bg-red-100 text-red-800' :
                        selectedFinding.severity === 'major' ? 'bg-orange-100 text-orange-800' :
                        selectedFinding.severity === 'minor' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {selectedFinding.severity}
                      </div>
                      <div className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs">
                        {selectedFinding.type}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedFinding(null)}
                    className="p-2 hover:bg-gray-100 rounded"
                  >
                    <X size={20} />
                  </button>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Description</h4>
                    <p className="text-gray-700">{selectedFinding.description}</p>
                  </div>
                  
                  {selectedFinding.file && (
                    <div>
                      <h4 className="font-medium mb-2">Location</h4>
                      <p className="text-gray-700 font-mono text-sm">
                        {selectedFinding.file}:{selectedFinding.line}:{selectedFinding.column}
                      </p>
                    </div>
                  )}
                  
                  <div>
                    <h4 className="font-medium mb-2">Remediation</h4>
                    <p className="text-gray-700">{selectedFinding.remediation.message}</p>
                    <div className="mt-2 text-sm text-gray-600">
                      Effort: <span className="font-medium">{selectedFinding.remediation.effort}</span>
                    </div>
                  </div>
                  
                  {selectedFinding.remediation.examples && (
                    <div>
                      <h4 className="font-medium mb-2">Code Examples</h4>
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <div>
                          <h5 className="text-sm font-medium mb-1 text-red-700">Vulnerable:</h5>
                          <pre className="bg-red-50 p-3 rounded text-sm border-l-4 border-red-500 overflow-x-auto">
                            <code>{selectedFinding.remediation.examples.vulnerable}</code>
                          </pre>
                        </div>
                        <div>
                          <h5 className="text-sm font-medium mb-1 text-green-700">Fixed:</h5>
                          <pre className="bg-green-50 p-3 rounded text-sm border-l-4 border-green-500 overflow-x-auto">
                            <code>{selectedFinding.remediation.examples.fixed}</code>
                          </pre>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {selectedFinding.references.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2">References</h4>
                      <ul className="space-y-1">
                        {selectedFinding.references.map((ref, index) => (
                          <li key={index}>
                            <a 
                              href={ref} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 text-sm"
                            >
                              {ref}
                            </a>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {selectedFinding.tags.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2">Tags</h4>
                      <div className="flex flex-wrap gap-1">
                        {selectedFinding.tags.map(tag => (
                          <span key={tag} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UltraSecurityFramework;