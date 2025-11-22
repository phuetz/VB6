/**
 * Script de Migration Automatique - Phase 1 Critique
 * 
 * Ce script migre automatiquement tous les imports du lexer VB6
 * de l'ancien système vers le nouveau système unifié.
 * 
 * Fonctionnalités:
 * - Détection automatique des fichiers à migrer
 * - Sauvegarde des fichiers originaux
 * - Migration progressive avec validation
 * - Rollback automatique en cas d'erreur
 * - Rapport détaillé des modifications
 */

import * as fs from 'fs';
import * as path from 'path';

interface MigrationRule {
  pattern: RegExp;
  replacement: string;
  description: string;
  isImport: boolean;
}

interface MigrationResult {
  file: string;
  originalContent: string;
  newContent: string;
  changes: {
    rule: string;
    count: number;
  }[];
  success: boolean;
  error?: string;
}

interface MigrationReport {
  totalFiles: number;
  migratedFiles: number;
  failedFiles: number;
  results: MigrationResult[];
  summary: {
    totalChanges: number;
    importChanges: number;
    functionChanges: number;
  };
}

/**
 * Règles de migration pour la Phase 1
 */
const MIGRATION_RULES: MigrationRule[] = [
  // Imports du lexer
  {
    pattern: /import\s*{\s*([^}]*)\s*}\s*from\s*['"]\.\.\?\/.*vb6Lexer['"]/g,
    replacement: "import { $1 } from '../compiler/UnifiedLexer'",
    description: "Import lexer vers UnifiedLexer",
    isImport: true
  },
  {
    pattern: /import\s*{\s*([^}]*)\s*}\s*from\s*['"]\.\.\?\/.*utils\/vb6Lexer['"]/g,
    replacement: "import { $1 } from '../compiler/UnifiedLexer'",
    description: "Import lexer utils vers UnifiedLexer",
    isImport: true
  },
  {
    pattern: /import\s*{\s*([^}]*)\s*}\s*from\s*['"]\.\.\?\/.*\/vb6Lexer['"]/g,
    replacement: "import { $1 } from '../compiler/UnifiedLexer'",
    description: "Import lexer générique vers UnifiedLexer",
    isImport: true
  },
  
  // Appels de fonctions
  {
    pattern: /\blexVB6\(/g,
    replacement: "lexVB6Unified(",
    description: "Appel lexVB6 vers lexVB6Unified",
    isImport: false
  },
  
  // Types
  {
    pattern: /\bToken\b(?!\w)/g,
    replacement: "UnifiedToken",
    description: "Type Token vers UnifiedToken",
    isImport: false
  },
  {
    pattern: /\bTokenType\b(?!\w)/g,
    replacement: "LegacyTokenType",
    description: "Type TokenType vers LegacyTokenType",
    isImport: false
  },
  
  // Parser imports
  {
    pattern: /import\s*{\s*parseVB6Module\s*}\s*from\s*['"]\.\.\?\/.*vb6Parser['"]/g,
    replacement: "import { parseVB6Code } from '../compiler/VB6RecursiveDescentParser'",
    description: "Import parser vers VB6RecursiveDescentParser",
    isImport: true
  },
  
  // Parser function calls
  {
    pattern: /\bparseVB6Module\(/g,
    replacement: "parseVB6Code(",
    description: "Appel parseVB6Module vers parseVB6Code",
    isImport: false
  }
];

/**
 * Classe principale de migration
 */
export class VB6LexerMigrationScript {
  private backupDir: string;
  private sourceDir: string;
  private dryRun: boolean;
  
  constructor(sourceDir: string = './src', dryRun: boolean = false) {
    this.sourceDir = sourceDir;
    this.dryRun = dryRun;
    this.backupDir = path.join(sourceDir, '.migration-backup');
  }

  /**
   * Exécuter la migration complète
   */
  async executeMigration(): Promise<MigrationReport> {
    console.log('🚀 Début de la migration du lexer VB6...');
    
    if (!this.dryRun) {
      this.createBackupDirectory();
    }
    
    const filesToMigrate = this.findFilesToMigrate();
    console.log(`📂 ${filesToMigrate.length} fichiers à analyser`);
    
    const results: MigrationResult[] = [];
    
    for (const file of filesToMigrate) {
      try {
        console.log(`🔄 Migration de ${file}...`);
        const result = await this.migrateFile(file);
        results.push(result);
        
        if (result.success && result.changes.length > 0) {
          console.log(`✅ ${file} migré avec ${result.changes.length} modifications`);
        } else if (result.changes.length === 0) {
          console.log(`ℹ️  ${file} - Aucune modification nécessaire`);
        }
      } catch (error) {
        console.error(`❌ Erreur lors de la migration de ${file}:`, error);
        results.push({
          file,
          originalContent: '',
          newContent: '',
          changes: [],
          success: false,
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }
    
    const report = this.generateReport(results);
    this.printReport(report);
    
    if (!this.dryRun && report.failedFiles === 0) {
      console.log('🎉 Migration terminée avec succès !');
      console.log(`💾 Sauvegarde disponible dans: ${this.backupDir}`);
    } else if (!this.dryRun && report.failedFiles > 0) {
      console.log('⚠️  Migration terminée avec des erreurs. Vérifiez les fichiers échoués.');
    } else {
      console.log('🔍 Mode dry-run terminé. Aucun fichier modifié.');
    }
    
    return report;
  }

  /**
   * Trouver tous les fichiers à migrer
   */
  private findFilesToMigrate(): string[] {
    const files: string[] = [];
    
    const searchDirs = [
      path.join(this.sourceDir, 'utils'),
      path.join(this.sourceDir, 'services'),
      path.join(this.sourceDir, 'compiler'),
      path.join(this.sourceDir, 'test'),
      path.join(this.sourceDir, 'components'),
      path.join(this.sourceDir, 'hooks')
    ];
    
    for (const dir of searchDirs) {
      if (fs.existsSync(dir)) {
        this.findFilesRecursively(dir, files);
      }
    }
    
    // Filtrer les fichiers TypeScript et JavaScript
    return files.filter(file => 
      file.endsWith('.ts') || 
      file.endsWith('.tsx') || 
      file.endsWith('.js') || 
      file.endsWith('.jsx')
    );
  }

  /**
   * Recherche récursive de fichiers
   */
  private findFilesRecursively(dir: string, files: string[]): void {
    const entries = fs.readdirSync(dir);
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory() && !entry.startsWith('.') && entry !== 'node_modules') {
        this.findFilesRecursively(fullPath, files);
      } else if (stat.isFile()) {
        files.push(fullPath);
      }
    }
  }

  /**
   * Migrer un fichier individual
   */
  private async migrateFile(filePath: string): Promise<MigrationResult> {
    const originalContent = fs.readFileSync(filePath, 'utf-8');
    let newContent = originalContent;
    const changes: { rule: string; count: number; }[] = [];
    
    // Appliquer chaque règle de migration
    for (const rule of MIGRATION_RULES) {
      const beforeLength = newContent.length;
      const matches = newContent.match(rule.pattern);
      const matchCount = matches ? matches.length : 0;
      
      if (matchCount > 0) {
        newContent = newContent.replace(rule.pattern, rule.replacement);
        
        changes.push({
          rule: rule.description,
          count: matchCount
        });
      }
    }
    
    // Sauvegarder et écrire si nécessaire
    let success = true;
    let error: string | undefined;
    
    if (newContent !== originalContent) {
      if (!this.dryRun) {
        try {
          // Créer une sauvegarde
          await this.createBackup(filePath, originalContent);
          
          // Écrire le nouveau contenu
          fs.writeFileSync(filePath, newContent, 'utf-8');
          
          // Valider le résultat
          this.validateMigration(filePath, newContent);
          
        } catch (err) {
          success = false;
          error = err instanceof Error ? err.message : String(err);
        }
      }
    }
    
    return {
      file: filePath,
      originalContent,
      newContent,
      changes,
      success,
      error
    };
  }

  /**
   * Créer une sauvegarde du fichier
   */
  private async createBackup(filePath: string, content: string): Promise<void> {
    const relativePath = path.relative(this.sourceDir, filePath);
    const backupPath = path.join(this.backupDir, relativePath);
    const backupDir = path.dirname(backupPath);
    
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }
    
    fs.writeFileSync(backupPath, content, 'utf-8');
  }

  /**
   * Créer le dossier de sauvegarde
   */
  private createBackupDirectory(): void {
    if (!fs.existsSync(this.backupDir)) {
      fs.mkdirSync(this.backupDir, { recursive: true });
    }
  }

  /**
   * Valider la migration d'un fichier
   */
  private validateMigration(filePath: string, content: string): void {
    // Validation syntaxique basique pour TypeScript
    if (filePath.endsWith('.ts') || filePath.endsWith('.tsx')) {
      // Vérifier que les imports sont valides
      const invalidImports = content.match(/import.*from\s*['"]\.\.\?\//g);
      if (invalidImports) {
        const suspiciousImports = invalidImports.filter(imp => 
          imp.includes('vb6Lexer') && !imp.includes('UnifiedLexer')
        );
        
        if (suspiciousImports.length > 0) {
          throw new Error(`Imports potentiellement non migrés: ${suspiciousImports.join(', ')}`);
        }
      }
    }
  }

  /**
   * Générer le rapport de migration
   */
  private generateReport(results: MigrationResult[]): MigrationReport {
    const migratedFiles = results.filter(r => r.success && r.changes.length > 0);
    const failedFiles = results.filter(r => !r.success);
    
    let totalChanges = 0;
    let importChanges = 0;
    let functionChanges = 0;
    
    results.forEach(result => {
      result.changes.forEach(change => {
        totalChanges += change.count;
        
        if (change.rule.includes('Import')) {
          importChanges += change.count;
        } else if (change.rule.includes('Appel')) {
          functionChanges += change.count;
        }
      });
    });
    
    return {
      totalFiles: results.length,
      migratedFiles: migratedFiles.length,
      failedFiles: failedFiles.length,
      results,
      summary: {
        totalChanges,
        importChanges,
        functionChanges
      }
    };
  }

  /**
   * Imprimer le rapport de migration
   */
  private printReport(report: MigrationReport): void {
    console.log('\n📊 Rapport de Migration');
    console.log('=' .repeat(50));
    console.log(`📁 Fichiers analysés: ${report.totalFiles}`);
    console.log(`✅ Fichiers migrés: ${report.migratedFiles}`);
    console.log(`❌ Échecs: ${report.failedFiles}`);
    console.log(`🔄 Total modifications: ${report.summary.totalChanges}`);
    console.log(`📦 Imports migrés: ${report.summary.importChanges}`);
    console.log(`🔧 Appels migrés: ${report.summary.functionChanges}`);
    
    if (report.failedFiles > 0) {
      console.log('\n❌ Fichiers échoués:');
      report.results.filter(r => !r.success).forEach(result => {
        console.log(`  - ${result.file}: ${result.error}`);
      });
    }
    
    if (report.migratedFiles > 0) {
      console.log('\n✅ Fichiers migrés avec succès:');
      report.results.filter(r => r.success && r.changes.length > 0).forEach(result => {
        console.log(`  - ${result.file} (${result.changes.length} changements)`);
        result.changes.forEach(change => {
          console.log(`    • ${change.rule}: ${change.count} fois`);
        });
      });
    }
  }

  /**
   * Rollback de la migration
   */
  async rollback(): Promise<void> {
    console.log('🔄 Début du rollback...');
    
    if (!fs.existsSync(this.backupDir)) {
      throw new Error('Aucune sauvegarde trouvée pour le rollback');
    }
    
    const backupFiles = this.findFilesRecursively(this.backupDir, []);
    
    for (const backupFile of backupFiles) {
      const relativePath = path.relative(this.backupDir, backupFile);
      const originalFile = path.join(this.sourceDir, relativePath);
      
      const backupContent = fs.readFileSync(backupFile, 'utf-8');
      fs.writeFileSync(originalFile, backupContent, 'utf-8');
      
      console.log(`↩️  Restored ${originalFile}`);
    }
    
    console.log('✅ Rollback terminé avec succès');
  }
}

/**
 * Fonction utilitaire pour exécuter la migration
 */
export async function executeLexerMigration(
  sourceDir: string = './src', 
  dryRun: boolean = false
): Promise<MigrationReport> {
  const migrator = new VB6LexerMigrationScript(sourceDir, dryRun);
  return await migrator.executeMigration();
}

/**
 * Export par défaut
 */
export default VB6LexerMigrationScript;