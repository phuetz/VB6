/**
 * Tests de sécurité pour la suppression de eval()
 * TASK-001: Validation que eval() a été correctement remplacé
 */

import { describe, it, expect } from 'vitest';
import { safeMathEvaluator } from '../../utils/safeExpressionEvaluator';

describe('TASK-001: Suppression de eval()', () => {
  describe('safeMathEvaluator', () => {
    it('devrait évaluer des expressions arithmétiques simples', () => {
      expect(safeMathEvaluator('2 + 3')).toBe(5);
      expect(safeMathEvaluator('10 - 4')).toBe(6);
      expect(safeMathEvaluator('6 * 7')).toBe(42);
      expect(safeMathEvaluator('20 / 4')).toBe(5);
    });

    it('devrait respecter la priorité des opérateurs', () => {
      expect(safeMathEvaluator('2 + 3 * 4')).toBe(14);
      expect(safeMathEvaluator('(2 + 3) * 4')).toBe(20);
      expect(safeMathEvaluator('10 - 2 * 3')).toBe(4);
    });

    it('devrait gérer les nombres négatifs', () => {
      expect(safeMathEvaluator('-5')).toBe(-5);
      expect(safeMathEvaluator('-5 + 10')).toBe(5);
      expect(safeMathEvaluator('10 + -3')).toBe(7);
    });

    it('devrait gérer les nombres décimaux', () => {
      expect(safeMathEvaluator('3.14 * 2')).toBeCloseTo(6.28);
      expect(safeMathEvaluator('10.5 / 2')).toBe(5.25);
    });

    it('devrait gérer les parenthèses imbriquées', () => {
      expect(safeMathEvaluator('((2 + 3) * (4 + 1))')).toBe(25);
      expect(safeMathEvaluator('(((1 + 2)))')).toBe(3);
    });

    it('devrait rejeter les expressions avec caractères dangereux', () => {
      expect(() => safeMathEvaluator('alert(1)')).toThrow();
      expect(() => safeMathEvaluator('eval("code")')).toThrow();
      expect(() => safeMathEvaluator('function(){}')).toThrow();
      expect(() => safeMathEvaluator('window.location')).toThrow();
    });

    it('devrait rejeter les expressions vides', () => {
      expect(() => safeMathEvaluator('')).toThrow();
      expect(() => safeMathEvaluator('   ')).toThrow();
    });

    it('devrait gérer la division par zéro', () => {
      expect(() => safeMathEvaluator('10 / 0')).toThrow('Division by zero');
    });

    it('devrait gérer les expressions complexes', () => {
      expect(safeMathEvaluator('1 + 2 + 3 + 4 + 5')).toBe(15);
      expect(safeMathEvaluator('100 / 10 / 2')).toBe(5);
      expect(safeMathEvaluator('2 * 3 * 4')).toBe(24);
    });
  });

  describe('Vérification absence de eval() dans le code de production', () => {
    it('safeExpressionEvaluator ne devrait pas contenir eval() actif', async () => {
      // Vérification statique: le fichier ne contient que des commentaires mentionnant eval()
      const fs = await import('fs');
      const path = await import('path');
      const filePath = path.resolve(__dirname, '../../utils/safeExpressionEvaluator.ts');
      const content = fs.readFileSync(filePath, 'utf-8');

      // Rechercher eval() qui n'est pas dans un commentaire ou une string
      const evalUsages = content.match(/(?<!\/\/.*|\/\*.*|\*.*|['"`].*)\beval\s*\(/g);
      expect(evalUsages).toBeNull();
    });

    it('VB6CrystalReportsEngine ne devrait pas contenir eval() actif', async () => {
      const fs = await import('fs');
      const path = await import('path');
      const filePath = path.resolve(
        __dirname,
        '../../components/CrystalReports/VB6CrystalReportsEngine.ts'
      );
      const content = fs.readFileSync(filePath, 'utf-8');

      // Vérifier que eval() n'est pas utilisé (sauf en commentaires)
      const lines = content.split('\n');
      const evalLines = lines.filter((line, idx) => {
        const trimmed = line.trim();
        // Ignorer les commentaires
        if (trimmed.startsWith('//') || trimmed.startsWith('*') || trimmed.startsWith('/*')) {
          return false;
        }
        return /\beval\s*\(/.test(line);
      });

      expect(evalLines.length).toBe(0);
    });

    // VB6COMActiveXBridge was archived in TASK-P1-002 and deleted in iter-1
    // No need to test a file that no longer exists
  });

  describe('Sécurité des nouvelles implémentations', () => {
    it('safeMathEvaluator devrait bloquer les injections de code', () => {
      const maliciousInputs = [
        'constructor.constructor("return this")()',
        '__proto__.polluted = true',
        'this.constructor.constructor("return process")()',
        'require("child_process")',
        'import("fs")',
        'fetch("/api/secret")',
        'document.cookie',
        'localStorage.getItem("token")',
      ];

      maliciousInputs.forEach(input => {
        expect(() => safeMathEvaluator(input)).toThrow();
      });
    });

    it('devrait être résistant aux attaques par longueur', () => {
      // Expression très longue mais valide
      const longExpression = Array(100).fill('1').join('+');
      expect(safeMathEvaluator(longExpression)).toBe(100);
    });
  });
});
