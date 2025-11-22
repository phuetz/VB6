#!/usr/bin/env node

/**
 * Script de vérification du fix DragDropProvider
 * Vérifie que les dépendances useEffect ne créent plus de boucles infinies
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function checkDragDropProvider() {
    console.log('🔍 Vérification du fix DragDropProvider...');
    
    const filePath = join(__dirname, 'src/components/DragDrop/DragDropProvider.tsx');
    const content = readFileSync(filePath, 'utf8');
    
    const issues = [];
    
    // Vérifier que les setters ne sont plus dans les dépendances useEffect
    const problematicPatterns = [
        { pattern: /useEffect\([^}]+\}, \[[^\]]*set[A-Z][^,\]]*[,\]]/, description: 'Setter function in useEffect dependencies' },
        { pattern: /useEffect\([^}]+\}, \[[^\]]*addLog[,\]]/, description: 'addLog in useEffect dependencies' },
        { pattern: /useCallback\([^}]+\}, \[[^\]]*addLog[,\]]/, description: 'addLog in useCallback dependencies causing potential loops' }
    ];
    
    const lines = content.split('\n');
    
    problematicPatterns.forEach(({ pattern, description }) => {
        lines.forEach((line, index) => {
            if (pattern.test(line)) {
                issues.push({
                    line: index + 1,
                    content: line.trim(),
                    description
                });
            }
        });
    });
    
    // Vérifier les corrections spécifiques
    const fixes = [
        {
            pattern: /}, \[isDragging\]\); \/\/ INFINITE LOOP FIX: Remove setter functions from dependencies/,
            description: 'Fixed keyboard handler useEffect dependencies'
        },
        {
            pattern: /}, \[dropZones\.length\]\); \/\/ INFINITE LOOP FIX: Remove addLog from dependencies/,
            description: 'Fixed initialization useEffect dependencies'
        },
        {
            pattern: /\[activeDropZone, dropZones, dragData, vibrate, playSound\] \/\/ INFINITE LOOP FIX: Remove addLog from dependencies/,
            description: 'Fixed handleDragOver callback dependencies'
        }
    ];
    
    const appliedFixes = [];
    fixes.forEach(({ pattern, description }) => {
        if (pattern.test(content)) {
            appliedFixes.push(description);
        }
    });
    
    console.log('\n📊 Résultats de la vérification:');
    
    if (issues.length === 0) {
        console.log('✅ Aucun problème de dépendance détecté');
    } else {
        console.log(`❌ ${issues.length} problème(s) potentiel(s) détecté(s):`);
        issues.forEach(issue => {
            console.log(`   Ligne ${issue.line}: ${issue.description}`);
            console.log(`   Code: ${issue.content}`);
        });
    }
    
    console.log(`\n🛠️ Corrections appliquées: ${appliedFixes.length}`);
    appliedFixes.forEach(fix => {
        console.log(`   ✅ ${fix}`);
    });
    
    return issues.length === 0 && appliedFixes.length > 0;
}

function checkOtherPotentialIssues() {
    console.log('\n🔍 Vérification d\'autres fichiers potentiellement problématiques...');
    
    // Vérifier d'autres composants susceptibles d'avoir des problèmes similaires
    const filesToCheck = [
        'src/components/Designer/DesignerCanvas.tsx',
        'src/components/Designer/ControlManipulator.tsx',
        'src/stores/vb6Store.ts',
        'src/context/VB6Context.tsx'
    ];
    
    let totalIssues = 0;
    
    filesToCheck.forEach(relativePath => {
        const filePath = join(__dirname, relativePath);
        try {
            const content = readFileSync(filePath, 'utf8');
            const lines = content.split('\n');
            
            // Chercher des patterns problématiques simples
            const problematicLines = lines.filter((line, index) => {
                return (
                    line.includes('useEffect') && 
                    line.includes(', [') &&
                    (line.includes('set') || line.includes('dispatch') || line.includes('addLog'))
                );
            });
            
            if (problematicLines.length > 0) {
                console.log(`⚠️ ${relativePath}: ${problematicLines.length} ligne(s) suspecte(s)`);
                totalIssues += problematicLines.length;
            } else {
                console.log(`✅ ${relativePath}: OK`);
            }
        } catch (error) {
            console.log(`⚠️ ${relativePath}: Fichier non trouvé ou inaccessible`);
        }
    });
    
    return totalIssues === 0;
}

// Exécution du script
console.log('🚀 Démarrage de la vérification des corrections de boucles infinies...\n');

const dragDropFixed = checkDragDropProvider();
const otherFilesOk = checkOtherPotentialIssues();

console.log('\n📈 Résumé final:');
console.log(`DragDropProvider: ${dragDropFixed ? '✅ Corrigé' : '❌ Problèmes restants'}`);
console.log(`Autres fichiers: ${otherFilesOk ? '✅ OK' : '⚠️ Vérification recommandée'}`);

if (dragDropFixed && otherFilesOk) {
    console.log('\n🎉 Toutes les corrections semblent appliquées correctement!');
    process.exit(0);
} else {
    console.log('\n⚠️ Vérifications supplémentaires recommandées');
    process.exit(1);
}