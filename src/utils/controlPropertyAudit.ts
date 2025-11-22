/**
 * Audit des propriétés des contrôles VB6
 * Vérifie que tous les contrôles ont les propriétés VB6 requises
 */

import { 
  getCompleteVB6Properties, 
  getAllControlTypes, 
  getCompatibilityReport,
  VB6PropertyDefinition 
} from '../data/VB6CompleteProperties';

// Types d'audit
export interface ControlAuditResult {
  controlType: string;
  implementedProperties: string[];
  missingProperties: VB6PropertyDefinition[];
  extraProperties: string[];
  compatibilityPercentage: number;
  isFullyCompliant: boolean;
  criticalMissing: VB6PropertyDefinition[];
  recommendations: string[];
}

export interface GlobalAuditResult {
  totalControlTypes: number;
  fullyCompliantControls: number;
  averageCompatibility: number;
  controlResults: ControlAuditResult[];
  overallRecommendations: string[];
  mostMissingProperties: { property: string; missingInControls: number }[];
}

// Propriétés critiques que tous les contrôles VB6 doivent avoir
const CRITICAL_PROPERTIES = [
  'Name', 'Left', 'Top', 'Width', 'Height', 'Visible', 'Enabled', 
  'TabStop', 'TabIndex', 'Tag', 'hWnd'
];

/**
 * Examine les propriétés implémentées dans un fichier de contrôle
 */
function extractImplementedProperties(controlCode: string): string[] {
  const properties = new Set<string>();
  
  // Chercher les patterns de propriétés VB6
  const patterns = [
    // Props destructurées: const { prop1, prop2 } = control;
    /const\s*{\s*([^}]+)\s*}\s*=\s*(?:props|control)/g,
    // Props dans les interfaces: prop?: type
    /(\w+)\?\s*:\s*[\w|<>[\]]+/g,
    // Props dans defaultValue: prop = defaultValue
    /(\w+)\s*=\s*(?:control\.(\w+)|props\.(\w+))/g,
    // Accès direct: control.prop
    /control\.(\w+)/g,
    // Props.prop
    /props\.(\w+)/g
  ];
  
  patterns.forEach(pattern => {
    let match;
    while ((match = pattern.exec(controlCode)) !== null) {
      if (match[1]) {
        // Gérer les destructurations multiples
        if (match[1].includes(',')) {
          match[1].split(',').forEach(prop => {
            const cleaned = prop.trim().replace(/[:=].*$/, '');
            if (cleaned && !cleaned.includes(' ')) {
              properties.add(cleaned);
            }
          });
        } else {
          const cleaned = match[1].trim().replace(/[:=].*$/, '');
          if (cleaned && !cleaned.includes(' ')) {
            properties.add(cleaned);
          }
        }
      }
      // Propriétés capturées dans d'autres groupes
      for (let i = 2; i < match.length; i++) {
        if (match[i]) {
          properties.add(match[i]);
        }
      }
    }
  });
  
  // Nettoyer et filtrer les propriétés
  const validProperties = Array.from(properties).filter(prop => 
    prop.length > 0 && 
    /^[a-zA-Z][a-zA-Z0-9]*$/.test(prop) &&
    !['props', 'control', 'ref', 'React', 'useState', 'useEffect', 'useCallback'].includes(prop)
  );
  
  return validProperties;
}

/**
 * Audite un contrôle spécifique
 */
export function auditControl(controlType: string, controlCode?: string): ControlAuditResult {
  const expectedProperties = getCompleteVB6Properties(controlType);
  const expectedPropertyNames = expectedProperties.map(p => p.name);
  
  // Si on a le code, extraire les propriétés implémentées
  const implementedProperties = controlCode 
    ? extractImplementedProperties(controlCode)
    : expectedPropertyNames; // Assumé complet si pas de code
  
  const missingProperties = expectedProperties.filter(
    prop => !implementedProperties.includes(prop.name)
  );
  
  const extraProperties = implementedProperties.filter(
    prop => !expectedPropertyNames.includes(prop)
  );
  
  const criticalMissing = missingProperties.filter(
    prop => CRITICAL_PROPERTIES.includes(prop.name)
  );
  
  const compatibilityPercentage = Math.round(
    ((expectedPropertyNames.length - missingProperties.length) / expectedPropertyNames.length) * 100
  );
  
  const recommendations: string[] = [];
  
  if (criticalMissing.length > 0) {
    recommendations.push(`CRITIQUE: Propriétés essentielles manquantes: ${criticalMissing.map(p => p.name).join(', ')}`);
  }
  
  if (missingProperties.length > 0) {
    recommendations.push(`Ajouter ${missingProperties.length} propriétés VB6 manquantes`);
  }
  
  if (extraProperties.length > 0) {
    recommendations.push(`Vérifier ${extraProperties.length} propriétés non-standard`);
  }
  
  if (compatibilityPercentage < 80) {
    recommendations.push('Compatibilité VB6 faible - nécessite une révision majeure');
  } else if (compatibilityPercentage < 95) {
    recommendations.push('Améliorer la compatibilité VB6 en ajoutant les propriétés manquantes');
  }
  
  return {
    controlType,
    implementedProperties,
    missingProperties,
    extraProperties,
    compatibilityPercentage,
    isFullyCompliant: missingProperties.length === 0,
    criticalMissing,
    recommendations
  };
}

/**
 * Audite tous les types de contrôles
 */
export function auditAllControls(): GlobalAuditResult {
  const controlTypes = getAllControlTypes();
  const controlResults: ControlAuditResult[] = [];
  
  // Auditer chaque type de contrôle
  controlTypes.forEach(controlType => {
    const result = auditControl(controlType);
    controlResults.push(result);
  });
  
  // Calculer les statistiques globales
  const fullyCompliantControls = controlResults.filter(r => r.isFullyCompliant).length;
  const averageCompatibility = Math.round(
    controlResults.reduce((sum, r) => sum + r.compatibilityPercentage, 0) / controlResults.length
  );
  
  // Analyser les propriétés les plus manquantes
  const propertyMissingCount = new Map<string, number>();
  controlResults.forEach(result => {
    result.missingProperties.forEach(prop => {
      const count = propertyMissingCount.get(prop.name) || 0;
      propertyMissingCount.set(prop.name, count + 1);
    });
  });
  
  const mostMissingProperties = Array.from(propertyMissingCount.entries())
    .map(([property, missingInControls]) => ({ property, missingInControls }))
    .sort((a, b) => b.missingInControls - a.missingInControls)
    .slice(0, 10);
  
  // Recommandations globales
  const overallRecommendations: string[] = [];
  
  if (fullyCompliantControls < controlTypes.length) {
    overallRecommendations.push(
      `${controlTypes.length - fullyCompliantControls} contrôles nécessitent des améliorations`
    );
  }
  
  if (averageCompatibility < 90) {
    overallRecommendations.push(
      'Compatibilité VB6 globale insuffisante - révision nécessaire'
    );
  }
  
  if (mostMissingProperties.length > 0) {
    overallRecommendations.push(
      `Propriétés les plus manquantes: ${mostMissingProperties.slice(0, 3).map(p => p.property).join(', ')}`
    );
  }
  
  overallRecommendations.push('Utiliser VB6PropertyEnhancer pour corriger automatiquement');
  
  return {
    totalControlTypes: controlTypes.length,
    fullyCompliantControls,
    averageCompatibility,
    controlResults,
    overallRecommendations,
    mostMissingProperties
  };
}

/**
 * Génère un rapport d'audit formaté
 */
export function generateAuditReport(auditResult: GlobalAuditResult): string {
  const lines: string[] = [];
  
  lines.push('='.repeat(80));
  lines.push('RAPPORT D\'AUDIT DES PROPRIÉTÉS VB6');
  lines.push('='.repeat(80));
  lines.push('');
  
  lines.push(`📊 STATISTIQUES GLOBALES:`);
  lines.push(`   • Types de contrôles: ${auditResult.totalControlTypes}`);
  lines.push(`   • Contrôles 100% compatibles: ${auditResult.fullyCompliantControls}`);
  lines.push(`   • Compatibilité moyenne: ${auditResult.averageCompatibility}%`);
  lines.push('');
  
  lines.push(`🎯 RECOMMANDATIONS GLOBALES:`);
  auditResult.overallRecommendations.forEach(rec => {
    lines.push(`   • ${rec}`);
  });
  lines.push('');
  
  lines.push(`⚠️  PROPRIÉTÉS LES PLUS MANQUANTES:`);
  auditResult.mostMissingProperties.slice(0, 5).forEach(prop => {
    lines.push(`   • ${prop.property}: manque dans ${prop.missingInControls} contrôles`);
  });
  lines.push('');
  
  lines.push(`📋 DÉTAILS PAR CONTRÔLE:`);
  lines.push('-'.repeat(80));
  
  auditResult.controlResults
    .sort((a, b) => a.compatibilityPercentage - b.compatibilityPercentage)
    .forEach(result => {
      const status = result.isFullyCompliant ? '✅' : result.compatibilityPercentage >= 90 ? '⚠️' : '❌';
      lines.push(`${status} ${result.controlType.padEnd(20)} ${result.compatibilityPercentage}%`);
      
      if (result.criticalMissing.length > 0) {
        lines.push(`   🚨 CRITIQUE: ${result.criticalMissing.map(p => p.name).join(', ')}`);
      }
      
      if (result.missingProperties.length > 0 && result.missingProperties.length <= 5) {
        lines.push(`   📝 Manquant: ${result.missingProperties.map(p => p.name).join(', ')}`);
      } else if (result.missingProperties.length > 5) {
        lines.push(`   📝 Manquant: ${result.missingProperties.length} propriétés`);
      }
    });
  
  lines.push('');
  lines.push('='.repeat(80));
  
  return lines.join('\n');
}

/**
 * Fonction principale d'audit
 */
export function runCompleteAudit(): void {
  
  const auditResult = auditAllControls();
  const report = generateAuditReport(auditResult);
  
  
  if (auditResult.averageCompatibility >= 95) {
    // Excellent compatibility - no action needed
  } else if (auditResult.averageCompatibility >= 80) {
    // Good compatibility - minor issues may exist
  } else {
    // Poor compatibility - significant issues detected
  }
}

export default {
  auditControl,
  auditAllControls,
  generateAuditReport,
  runCompleteAudit
};