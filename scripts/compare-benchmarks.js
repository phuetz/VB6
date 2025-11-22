#!/usr/bin/env node

/**
 * Script pour comparer les benchmarks de performance
 * Détecte les régressions de performance et génère un rapport
 */

const fs = require('fs');
const path = require('path');

function compareBenchmarks(currentFile, baselineFile) {
  console.log('Comparing performance benchmarks...');
  
  try {
    let currentResults = {};
    let baselineResults = {};
    
    // Charger les résultats actuels
    if (fs.existsSync(currentFile)) {
      const currentData = fs.readFileSync(currentFile, 'utf8');
      currentResults = JSON.parse(currentData);
    } else {
      console.error(`❌ Current benchmark file not found: ${currentFile}`);
      process.exit(1);
    }
    
    // Charger les résultats de référence
    if (fs.existsSync(baselineFile)) {
      const baselineData = fs.readFileSync(baselineFile, 'utf8');
      baselineResults = JSON.parse(baselineData);
    } else {
      console.warn(`⚠️ Baseline benchmark file not found: ${baselineFile}`);
      console.log('Creating baseline from current results...');
      baselineResults = currentResults;
    }
    
    const comparison = {
      timestamp: new Date().toISOString(),
      summary: {
        totalBenchmarks: 0,
        improvements: 0,
        regressions: 0,
        unchanged: 0,
        significantChanges: 0
      },
      categories: {},
      details: [],
      regressions: [],
      improvements: [],
      recommendations: []
    };
    
    // Comparer les benchmarks par catégorie
    const categories = extractBenchmarkCategories(currentResults, baselineResults);
    
    for (const category of categories) {
      comparison.categories[category] = {
        totalTests: 0,
        improvements: 0,
        regressions: 0,
        averageChange: 0,
        significantChanges: 0
      };
      
      const currentCategoryResults = filterByCategory(currentResults, category);
      const baselineCategoryResults = filterByCategory(baselineResults, category);
      
      for (const benchmarkName of Object.keys(currentCategoryResults)) {
        comparison.summary.totalBenchmarks++;
        comparison.categories[category].totalTests++;
        
        const current = currentCategoryResults[benchmarkName];
        const baseline = baselineCategoryResults[benchmarkName];
        
        if (!baseline) {
          // Nouveau benchmark
          comparison.details.push({
            name: benchmarkName,
            category: category,
            status: 'new',
            current: current,
            baseline: null,
            change: null,
            changePercent: null
          });
          continue;
        }
        
        const change = current - baseline;
        const changePercent = baseline !== 0 ? (change / baseline) * 100 : 0;
        const isSignificant = Math.abs(changePercent) > 5; // 5% threshold
        
        let status = 'unchanged';
        if (changePercent > 2) {
          status = 'regression';
          comparison.summary.regressions++;
          comparison.categories[category].regressions++;
          
          if (isSignificant) {
            comparison.regressions.push({
              name: benchmarkName,
              category: category,
              current: current,
              baseline: baseline,
              change: change,
              changePercent: changePercent
            });
          }
        } else if (changePercent < -2) {
          status = 'improvement';
          comparison.summary.improvements++;
          comparison.categories[category].improvements++;
          
          if (isSignificant) {
            comparison.improvements.push({
              name: benchmarkName,
              category: category,
              current: current,
              baseline: baseline,
              change: change,
              changePercent: changePercent
            });
          }
        } else {
          comparison.summary.unchanged++;
        }
        
        if (isSignificant) {
          comparison.summary.significantChanges++;
          comparison.categories[category].significantChanges++;
        }
        
        comparison.details.push({
          name: benchmarkName,
          category: category,
          status: status,
          current: current,
          baseline: baseline,
          change: change,
          changePercent: changePercent,
          isSignificant: isSignificant
        });
        
        comparison.categories[category].averageChange += changePercent;
      }
      
      // Calculer la moyenne des changements pour la catégorie
      if (comparison.categories[category].totalTests > 0) {
        comparison.categories[category].averageChange /= comparison.categories[category].totalTests;
      }
    }
    
    // Générer des recommandations
    generateRecommendations(comparison);
    
    // Sauvegarder le rapport
    const reportFile = 'performance-regression-report.json';
    fs.writeFileSync(reportFile, JSON.stringify(comparison, null, 2));
    
    // Générer le rapport HTML
    generateHTMLComparisonReport(comparison, 'performance-comparison.html');
    
    // Afficher le résumé
    console.log(`\n📊 Performance Comparison Summary:`);
    console.log(`📈 Improvements: ${comparison.summary.improvements}`);
    console.log(`📉 Regressions: ${comparison.summary.regressions}`);
    console.log(`➡️ Unchanged: ${comparison.summary.unchanged}`);
    console.log(`⚠️ Significant Changes: ${comparison.summary.significantChanges}`);
    
    if (comparison.regressions.length > 0) {
      console.log(`\n🚨 Performance Regressions Detected:`);
      comparison.regressions.slice(0, 5).forEach(regression => {
        console.log(`  - ${regression.name}: ${regression.changePercent.toFixed(1)}% slower`);
      });
    }
    
    if (comparison.improvements.length > 0) {
      console.log(`\n🎉 Performance Improvements:`);
      comparison.improvements.slice(0, 5).forEach(improvement => {
        console.log(`  - ${improvement.name}: ${Math.abs(improvement.changePercent).toFixed(1)}% faster`);
      });
    }
    
    // Exit avec code d'erreur si trop de régressions
    if (comparison.summary.regressions > comparison.summary.totalBenchmarks * 0.1) {
      console.error(`\n🚨 Too many performance regressions detected (${comparison.summary.regressions}/${comparison.summary.totalBenchmarks})`);
      process.exit(1);
    }
    
  } catch (error) {
    console.error('❌ Error comparing benchmarks:', error.message);
    process.exit(1);
  }
}

function extractBenchmarkCategories(current, baseline) {
  const categories = new Set();
  
  // Extraire catégories des résultats actuels et de référence
  [current, baseline].forEach(results => {
    if (results.tests) {
      results.tests.forEach(test => {
        const category = extractCategoryFromTestName(test.title || test.name);
        categories.add(category);
      });
    }
  });
  
  return Array.from(categories);
}

function filterByCategory(results, category) {
  const filtered = {};
  
  if (results.tests) {
    results.tests.forEach(test => {
      const testCategory = extractCategoryFromTestName(test.title || test.name);
      if (testCategory === category && test.duration) {
        filtered[test.title || test.name] = test.duration;
      }
    });
  }
  
  return filtered;
}

function extractCategoryFromTestName(testName) {
  const categories = {
    'String Operations': /string|concatenat|search|replace|parsing/i,
    'Math Operations': /math|calculation|trigonometry|random/i,
    'Array Operations': /array|sorting|searching/i,
    'Object Operations': /object|creation|method|property/i,
    'Control Flow': /loop|conditional|conversion/i,
    'Specialized Operations': /date|variant/i,
    'Memory Management': /memory|allocation/i
  };
  
  for (const [category, pattern] of Object.entries(categories)) {
    if (pattern.test(testName)) {
      return category;
    }
  }
  
  return 'Other';
}

function generateRecommendations(comparison) {
  comparison.recommendations = [];
  
  // Recommandations basées sur les régressions
  if (comparison.summary.regressions > 5) {
    comparison.recommendations.push({
      type: 'critical',
      message: `Critical: ${comparison.summary.regressions} performance regressions detected. Immediate investigation required.`
    });
  }
  
  // Recommandations par catégorie
  Object.entries(comparison.categories).forEach(([category, data]) => {
    if (data.regressions > data.totalTests * 0.3) {
      comparison.recommendations.push({
        type: 'warning',
        message: `Warning: ${category} shows significant performance degradation (${data.regressions}/${data.totalTests} tests affected).`
      });
    }
    
    if (data.averageChange > 10) {
      comparison.recommendations.push({
        type: 'optimization',
        message: `Optimization needed: ${category} is ${data.averageChange.toFixed(1)}% slower on average. Consider optimizing this area.`
      });
    }
  });
  
  // Recommandations positives
  if (comparison.summary.improvements > comparison.summary.regressions * 2) {
    comparison.recommendations.push({
      type: 'positive',
      message: `Excellent: More performance improvements (${comparison.summary.improvements}) than regressions (${comparison.summary.regressions}).`
    });
  }
  
  // Recommandations spécifiques
  const slowestRegressions = comparison.regressions
    .sort((a, b) => b.changePercent - a.changePercent)
    .slice(0, 3);
  
  slowestRegressions.forEach(regression => {
    comparison.recommendations.push({
      type: 'specific',
      message: `Focus on: "${regression.name}" is ${regression.changePercent.toFixed(1)}% slower - high impact optimization target.`
    });
  });
}

function generateHTMLComparisonReport(comparison, outputFile) {
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Performance Benchmark Comparison</title>
    <style>
        body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            margin: 0; 
            padding: 20px; 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
        }
        .container { 
            max-width: 1200px; 
            margin: 0 auto; 
            background: white; 
            border-radius: 10px; 
            box-shadow: 0 10px 30px rgba(0,0,0,0.1);
            overflow: hidden;
        }
        .header { 
            background: linear-gradient(45deg, #1e3c72 0%, #2a5298 100%);
            color: white; 
            padding: 30px; 
            text-align: center;
        }
        
        .summary {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            padding: 30px;
            background: #f8f9fa;
        }
        .metric {
            text-align: center;
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .metric .value { font-size: 2rem; font-weight: bold; margin: 10px 0; }
        .metric.improvement .value { color: #28a745; }
        .metric.regression .value { color: #dc3545; }
        .metric.unchanged .value { color: #6c757d; }
        
        .content { padding: 30px; }
        .section { margin-bottom: 40px; }
        .section h2 { 
            color: #333; 
            border-bottom: 3px solid #007bff; 
            padding-bottom: 10px;
        }
        
        table { 
            width: 100%; 
            border-collapse: collapse; 
            margin-bottom: 20px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        th, td { 
            padding: 12px; 
            text-align: left; 
            border-bottom: 1px solid #dee2e6;
        }
        th { 
            background: #007bff; 
            color: white; 
        }
        
        .change-positive { color: #28a745; font-weight: bold; }
        .change-negative { color: #dc3545; font-weight: bold; }
        .change-neutral { color: #6c757d; }
        
        .recommendation {
            padding: 15px;
            margin: 10px 0;
            border-radius: 5px;
            border-left: 4px solid;
        }
        .recommendation.critical {
            background: #f8d7da;
            border-color: #dc3545;
            color: #721c24;
        }
        .recommendation.warning {
            background: #fff3cd;
            border-color: #ffc107;
            color: #856404;
        }
        .recommendation.positive {
            background: #d4edda;
            border-color: #28a745;
            color: #155724;
        }
        .recommendation.optimization {
            background: #d1ecf1;
            border-color: #17a2b8;
            color: #0c5460;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📈 Performance Benchmark Comparison</h1>
            <p>Generated on ${new Date(comparison.timestamp).toLocaleString()}</p>
        </div>
        
        <div class="summary">
            <div class="metric improvement">
                <h3>Improvements</h3>
                <div class="value">${comparison.summary.improvements}</div>
            </div>
            <div class="metric regression">
                <h3>Regressions</h3>
                <div class="value">${comparison.summary.regressions}</div>
            </div>
            <div class="metric unchanged">
                <h3>Unchanged</h3>
                <div class="value">${comparison.summary.unchanged}</div>
            </div>
            <div class="metric">
                <h3>Significant Changes</h3>
                <div class="value">${comparison.summary.significantChanges}</div>
            </div>
        </div>
        
        <div class="content">
            ${comparison.recommendations.length > 0 ? `
            <div class="section">
                <h2>💡 Recommendations</h2>
                ${comparison.recommendations.map(rec => `
                    <div class="recommendation ${rec.type}">
                        ${rec.message}
                    </div>
                `).join('')}
            </div>
            ` : ''}
            
            <div class="section">
                <h2>📊 Category Overview</h2>
                <table>
                    <thead>
                        <tr>
                            <th>Category</th>
                            <th>Total Tests</th>
                            <th>Improvements</th>
                            <th>Regressions</th>
                            <th>Avg Change</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${Object.entries(comparison.categories).map(([category, data]) => `
                            <tr>
                                <td><strong>${category}</strong></td>
                                <td>${data.totalTests}</td>
                                <td class="change-positive">${data.improvements}</td>
                                <td class="change-negative">${data.regressions}</td>
                                <td class="${data.averageChange > 2 ? 'change-negative' : data.averageChange < -2 ? 'change-positive' : 'change-neutral'}">
                                    ${data.averageChange > 0 ? '+' : ''}${data.averageChange.toFixed(1)}%
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
            
            ${comparison.regressions.length > 0 ? `
            <div class="section">
                <h2>🚨 Significant Regressions</h2>
                <table>
                    <thead>
                        <tr>
                            <th>Benchmark</th>
                            <th>Category</th>
                            <th>Current (ms)</th>
                            <th>Baseline (ms)</th>
                            <th>Change</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${comparison.regressions.slice(0, 10).map(reg => `
                            <tr>
                                <td>${reg.name}</td>
                                <td>${reg.category}</td>
                                <td>${reg.current.toFixed(2)}</td>
                                <td>${reg.baseline.toFixed(2)}</td>
                                <td class="change-negative">+${reg.changePercent.toFixed(1)}%</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
            ` : ''}
            
            ${comparison.improvements.length > 0 ? `
            <div class="section">
                <h2>🎉 Significant Improvements</h2>
                <table>
                    <thead>
                        <tr>
                            <th>Benchmark</th>
                            <th>Category</th>
                            <th>Current (ms)</th>
                            <th>Baseline (ms)</th>
                            <th>Change</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${comparison.improvements.slice(0, 10).map(imp => `
                            <tr>
                                <td>${imp.name}</td>
                                <td>${imp.category}</td>
                                <td>${imp.current.toFixed(2)}</td>
                                <td>${imp.baseline.toFixed(2)}</td>
                                <td class="change-positive">${imp.changePercent.toFixed(1)}%</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
            ` : ''}
        </div>
        
        <div class="footer" style="text-align: center; padding: 20px; background: #f8f9fa; color: #666;">
            <p>VB6 Web Compiler Performance Analysis | CI/CD Pipeline</p>
        </div>
    </div>
</body>
</html>
  `;
  
  fs.writeFileSync(outputFile, html);
}

// Exécution du script
if (require.main === module) {
  const currentFile = process.argv[2];
  const baselineFile = process.argv[3];
  
  if (!currentFile || !baselineFile) {
    console.error('Usage: node compare-benchmarks.js <current-results.json> <baseline-results.json>');
    process.exit(1);
  }
  
  compareBenchmarks(currentFile, baselineFile);
}

module.exports = { compareBenchmarks };