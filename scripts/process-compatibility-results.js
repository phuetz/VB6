#!/usr/bin/env node

/**
 * Script pour traiter les résultats des tests de compatibilité VB6
 * Génère des rapports HTML et JSON détaillés
 */

const fs = require('fs');
const path = require('path');

function processCompatibilityResults(testResultsFile) {
  console.log('Processing VB6 compatibility test results...');
  
  try {
    const results = JSON.parse(fs.readFileSync(testResultsFile, 'utf8'));
    
    const report = {
      summary: {
        totalTests: 0,
        passedTests: 0,
        failedTests: 0,
        skippedTests: 0,
        successRate: 0,
        timestamp: new Date().toISOString()
      },
      categories: {},
      functions: {},
      failedTests: [],
      performance: {
        averageDuration: 0,
        slowestTests: []
      }
    };
    
    // Traiter les résultats de test
    if (results.tests) {
      results.tests.forEach(test => {
        report.summary.totalTests++;
        
        switch (test.state) {
          case 'passed':
            report.summary.passedTests++;
            break;
          case 'failed':
            report.summary.failedTests++;
            report.failedTests.push({
              name: test.title,
              error: test.err?.message || 'Unknown error',
              stack: test.err?.stack
            });
            break;
          case 'skipped':
            report.summary.skippedTests++;
            break;
        }
        
        // Extraire la catégorie du nom du test
        const category = extractCategory(test.title);
        if (!report.categories[category]) {
          report.categories[category] = {
            total: 0,
            passed: 0,
            failed: 0,
            successRate: 0
          };
        }
        
        report.categories[category].total++;
        if (test.state === 'passed') {
          report.categories[category].passed++;
        } else if (test.state === 'failed') {
          report.categories[category].failed++;
        }
        
        // Données de performance
        if (test.duration) {
          if (!report.performance.averageDuration) {
            report.performance.averageDuration = 0;
          }
          report.performance.averageDuration += test.duration;
          
          report.performance.slowestTests.push({
            name: test.title,
            duration: test.duration
          });
        }
      });
    }
    
    // Calculer les taux de réussite
    report.summary.successRate = report.summary.totalTests > 0 
      ? (report.summary.passedTests / report.summary.totalTests) * 100 
      : 0;
    
    Object.keys(report.categories).forEach(category => {
      const cat = report.categories[category];
      cat.successRate = cat.total > 0 ? (cat.passed / cat.total) * 100 : 0;
    });
    
    if (report.summary.totalTests > 0) {
      report.performance.averageDuration /= report.summary.totalTests;
    }
    
    // Trier les tests les plus lents
    report.performance.slowestTests.sort((a, b) => b.duration - a.duration);
    report.performance.slowestTests = report.performance.slowestTests.slice(0, 10);
    
    // Sauvegarder le rapport JSON
    const reportFile = testResultsFile.replace('.json', '-report.json');
    fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));
    
    // Générer le rapport HTML
    generateHTMLReport(report, testResultsFile.replace('.json', '-report.html'));
    
    console.log(`✅ Report generated successfully`);
    console.log(`📊 Total Tests: ${report.summary.totalTests}`);
    console.log(`✅ Passed: ${report.summary.passedTests}`);
    console.log(`❌ Failed: ${report.summary.failedTests}`);
    console.log(`📈 Success Rate: ${report.summary.successRate.toFixed(2)}%`);
    
    // Alertes basées sur les résultats
    if (report.summary.successRate < 90) {
      console.warn('⚠️ Warning: Success rate below 90%');
    }
    
    if (report.summary.successRate < 80) {
      console.error('🚨 Critical: Success rate below 80%');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('❌ Error processing results:', error.message);
    process.exit(1);
  }
}

function extractCategory(testTitle) {
  const categories = {
    'String': /string|len|left|right|mid|trim|instr|replace/i,
    'Math': /math|sin|cos|tan|sqr|abs|round|rnd/i,
    'DateTime': /date|time|now|year|month|day|hour/i,
    'Array': /array|ubound|lbound|redim|erase/i,
    'Conversion': /conversion|cint|clng|cstr|cdbl|val/i,
    'FileSystem': /file|dir|open|close|input|output/i,
    'Validation': /validation|isnumeric|isdate|isarray|isobject/i,
    'Operators': /operator|arithmetic|comparison|logical/i,
    'ControlStructures': /control|if|for|while|do|select/i,
    'ErrorHandling': /error|on error|err\./i
  };
  
  for (const [category, pattern] of Object.entries(categories)) {
    if (pattern.test(testTitle)) {
      return category;
    }
  }
  
  return 'Other';
}

function generateHTMLReport(report, outputFile) {
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>VB6 Compatibility Test Report</title>
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
        .header h1 { margin: 0; font-size: 2.5rem; }
        .header p { margin: 10px 0 0 0; opacity: 0.9; }
        
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
        .metric h3 { margin: 0; color: #333; }
        .metric .value { 
            font-size: 2rem; 
            font-weight: bold; 
            margin: 10px 0;
        }
        .metric.success .value { color: #28a745; }
        .metric.warning .value { color: #ffc107; }
        .metric.danger .value { color: #dc3545; }
        
        .content { padding: 30px; }
        .section { margin-bottom: 40px; }
        .section h2 { 
            color: #333; 
            border-bottom: 3px solid #007bff; 
            padding-bottom: 10px;
            margin-bottom: 20px;
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
            font-weight: 600;
        }
        tbody tr:hover { background: #f8f9fa; }
        
        .progress-bar {
            width: 100%;
            height: 20px;
            background: #e9ecef;
            border-radius: 10px;
            overflow: hidden;
        }
        .progress-fill {
            height: 100%;
            transition: width 0.3s ease;
        }
        .progress-success { background: #28a745; }
        .progress-warning { background: #ffc107; }
        .progress-danger { background: #dc3545; }
        
        .alert {
            padding: 15px;
            margin: 15px 0;
            border-radius: 5px;
            border: 1px solid;
        }
        .alert-success {
            color: #155724;
            background: #d4edda;
            border-color: #c3e6cb;
        }
        .alert-warning {
            color: #856404;
            background: #fff3cd;
            border-color: #ffeaa7;
        }
        .alert-danger {
            color: #721c24;
            background: #f8d7da;
            border-color: #f5c6cb;
        }
        
        .failed-test {
            background: #fff;
            border: 1px solid #dee2e6;
            border-radius: 5px;
            padding: 15px;
            margin-bottom: 10px;
        }
        .failed-test h4 {
            color: #dc3545;
            margin: 0 0 10px 0;
        }
        .error-message {
            background: #f8f9fa;
            padding: 10px;
            border-radius: 3px;
            font-family: monospace;
            font-size: 0.9rem;
        }
        
        .footer {
            text-align: center;
            padding: 20px;
            background: #f8f9fa;
            color: #666;
            border-top: 1px solid #dee2e6;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>VB6 Compatibility Test Report</h1>
            <p>Generated on ${new Date(report.summary.timestamp).toLocaleString()}</p>
        </div>
        
        <div class="summary">
            <div class="metric">
                <h3>Total Tests</h3>
                <div class="value">${report.summary.totalTests}</div>
            </div>
            <div class="metric success">
                <h3>Passed</h3>
                <div class="value">${report.summary.passedTests}</div>
            </div>
            <div class="metric ${report.summary.failedTests > 0 ? 'danger' : 'success'}">
                <h3>Failed</h3>
                <div class="value">${report.summary.failedTests}</div>
            </div>
            <div class="metric ${report.summary.successRate >= 90 ? 'success' : report.summary.successRate >= 80 ? 'warning' : 'danger'}">
                <h3>Success Rate</h3>
                <div class="value">${report.summary.successRate.toFixed(1)}%</div>
            </div>
        </div>
        
        <div class="content">
            ${generateCompatibilityStatus(report)}
            
            <div class="section">
                <h2>📊 Category Breakdown</h2>
                <table>
                    <thead>
                        <tr>
                            <th>Category</th>
                            <th>Total</th>
                            <th>Passed</th>
                            <th>Failed</th>
                            <th>Success Rate</th>
                            <th>Progress</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${Object.entries(report.categories)
                          .sort(([,a], [,b]) => b.successRate - a.successRate)
                          .map(([category, data]) => `
                            <tr>
                                <td><strong>${category}</strong></td>
                                <td>${data.total}</td>
                                <td style="color: #28a745;">${data.passed}</td>
                                <td style="color: #dc3545;">${data.failed}</td>
                                <td>${data.successRate.toFixed(1)}%</td>
                                <td>
                                    <div class="progress-bar">
                                        <div class="progress-fill ${data.successRate >= 90 ? 'progress-success' : data.successRate >= 80 ? 'progress-warning' : 'progress-danger'}" 
                                             style="width: ${data.successRate}%"></div>
                                    </div>
                                </td>
                            </tr>
                          `).join('')}
                    </tbody>
                </table>
            </div>
            
            ${report.performance.slowestTests.length > 0 ? `
            <div class="section">
                <h2>⏱️ Performance Analysis</h2>
                <p><strong>Average Test Duration:</strong> ${report.performance.averageDuration.toFixed(2)}ms</p>
                
                <h3>Slowest Tests</h3>
                <table>
                    <thead>
                        <tr>
                            <th>Test Name</th>
                            <th>Duration (ms)</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${report.performance.slowestTests.map(test => `
                            <tr>
                                <td>${test.name}</td>
                                <td>${test.duration.toFixed(2)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
            ` : ''}
            
            ${report.failedTests.length > 0 ? `
            <div class="section">
                <h2>❌ Failed Tests</h2>
                ${report.failedTests.map(test => `
                    <div class="failed-test">
                        <h4>${test.name}</h4>
                        <div class="error-message">${test.error}</div>
                    </div>
                `).join('')}
            </div>
            ` : ''}
        </div>
        
        <div class="footer">
            <p>VB6 Web Compiler Compatibility Report | Generated by CI/CD Pipeline</p>
        </div>
    </div>
</body>
</html>
  `;
  
  fs.writeFileSync(outputFile, html);
}

function generateCompatibilityStatus(report) {
  const successRate = report.summary.successRate;
  
  if (successRate >= 95) {
    return `
      <div class="alert alert-success">
        <strong>🎉 Excellent Compatibility!</strong> 
        Your VB6 code has ${successRate.toFixed(1)}% compatibility. Ready for production deployment.
      </div>
    `;
  } else if (successRate >= 90) {
    return `
      <div class="alert alert-success">
        <strong>✅ Good Compatibility!</strong> 
        Your VB6 code has ${successRate.toFixed(1)}% compatibility. Minor issues may need attention.
      </div>
    `;
  } else if (successRate >= 80) {
    return `
      <div class="alert alert-warning">
        <strong>⚠️ Moderate Compatibility Issues!</strong> 
        Your VB6 code has ${successRate.toFixed(1)}% compatibility. Some features may need modification.
      </div>
    `;
  } else {
    return `
      <div class="alert alert-danger">
        <strong>🚨 Significant Compatibility Issues!</strong> 
        Your VB6 code has only ${successRate.toFixed(1)}% compatibility. Major modifications required.
      </div>
    `;
  }
}

// Exécution du script
if (require.main === module) {
  const testResultsFile = process.argv[2];
  
  if (!testResultsFile) {
    console.error('Usage: node process-compatibility-results.js <test-results.json>');
    process.exit(1);
  }
  
  if (!fs.existsSync(testResultsFile)) {
    console.error(`❌ Test results file not found: ${testResultsFile}`);
    process.exit(1);
  }
  
  processCompatibilityResults(testResultsFile);
}

module.exports = { processCompatibilityResults };