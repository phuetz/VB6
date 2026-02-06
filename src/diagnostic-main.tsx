/**
 * ULTRA-THINK DIAGNOSTIC MAIN
 * Logs détaillés pour diagnostiquer le problème de démarrage
 */

// ÉTAPE 1: Vérifier les imports de base
try {
  const { StrictMode } = await import('react');

  const { createRoot } = await import('react-dom/client');

  // ÉTAPE 2: Vérifier l'élément root
  const rootElement = document.getElementById('root');

  if (!rootElement) {
    console.error('❌ DIAGNOSTIC: Root element not found!');

    // Create diagnostic error display safely
    const errorDiv = document.createElement('div');
    errorDiv.style.padding = '40px';
    errorDiv.style.fontFamily = 'Arial';
    errorDiv.style.background = '#ffebee';

    const title = document.createElement('h1');
    title.textContent = '❌ DIAGNOSTIC ERROR';

    const desc = document.createElement('p');
    desc.textContent = 'Root element (#root) not found in DOM';

    const availableTitle = document.createElement('p');
    availableTitle.textContent = 'Available elements:';

    const list = document.createElement('ul');
    Array.from(document.body.children).forEach(el => {
      const item = document.createElement('li');
      item.textContent = `${el.tagName}#${el.id || 'no-id'}`;
      list.appendChild(item);
    });

    errorDiv.appendChild(title);
    errorDiv.appendChild(desc);
    errorDiv.appendChild(availableTitle);
    errorDiv.appendChild(list);

    document.body.textContent = ''; // Clear safely
    document.body.appendChild(errorDiv);

    throw new Error('Root element not found');
  }

  // ÉTAPE 3: Créer le composant de diagnostic

  function DiagnosticApp() {
    const [logs, setLogs] = React.useState<string[]>([]);
    const [testResults, setTestResults] = React.useState<Record<string, boolean>>({});

    React.useEffect(() => {
      const runDiagnostics = async () => {
        const results: Record<string, boolean> = {};
        const logMessages: string[] = [];

        // Test 1: Basic JavaScript
        try {
          const testArray = [1, 2, 3];
          const testSum = testArray.reduce((a, b) => a + b, 0);
          results['JavaScript'] = testSum === 6;
          logMessages.push(`✅ JavaScript test: ${testSum === 6 ? 'PASS' : 'FAIL'}`);
        } catch (e) {
          results['JavaScript'] = false;
          logMessages.push(`❌ JavaScript test: FAIL - ${e}`);
        }

        // Test 2: DOM manipulation
        try {
          const testDiv = document.createElement('div');
          testDiv.textContent = 'test';
          results['DOM'] = testDiv.textContent === 'test';
          logMessages.push(`✅ DOM test: ${results['DOM'] ? 'PASS' : 'FAIL'}`);
        } catch (e) {
          results['DOM'] = false;
          logMessages.push(`❌ DOM test: FAIL - ${e}`);
        }

        // Test 3: localStorage
        try {
          localStorage.setItem('diagnostic-test', 'test-value');
          const value = localStorage.getItem('diagnostic-test');
          results['localStorage'] = value === 'test-value';
          localStorage.removeItem('diagnostic-test');
          logMessages.push(`✅ localStorage test: ${results['localStorage'] ? 'PASS' : 'FAIL'}`);
        } catch (e) {
          results['localStorage'] = false;
          logMessages.push(`❌ localStorage test: FAIL - ${e}`);
        }

        // Test 4: Fetch API
        try {
          await fetch('data:text/plain,test');
          results['Fetch'] = true;
          logMessages.push(`✅ Fetch test: PASS`);
        } catch (e) {
          results['Fetch'] = false;
          logMessages.push(`❌ Fetch test: FAIL - ${e}`);
        }

        // Test 5: Performance API
        try {
          const now = performance.now();
          results['Performance'] = typeof now === 'number' && now > 0;
          logMessages.push(`✅ Performance test: ${results['Performance'] ? 'PASS' : 'FAIL'}`);
        } catch (e) {
          results['Performance'] = false;
          logMessages.push(`❌ Performance test: FAIL - ${e}`);
        }

        setTestResults(results);
        setLogs(logMessages);
      };

      runDiagnostics().catch(e => {
        console.error('❌ DIAGNOSTIC: runDiagnostics failed:', e);
        setLogs(['❌ Diagnostic suite failed: ' + e.message]);
      });
    }, []);

    return React.createElement(
      'div',
      {
        style: {
          padding: '40px',
          fontFamily: 'Arial, sans-serif',
          maxWidth: '800px',
          margin: '0 auto',
          backgroundColor: '#f5f5f5',
          minHeight: '100vh',
        },
      },
      [
        React.createElement(
          'h1',
          {
            key: 'title',
            style: { color: '#2c3e50', borderBottom: '2px solid #3498db', paddingBottom: '10px' },
          },
          '🔍 VB6 Web IDE - Ultra Diagnostic'
        ),

        React.createElement(
          'div',
          {
            key: 'info',
            style: {
              background: '#e8f4fd',
              border: '1px solid #3498db',
              padding: '15px',
              margin: '20px 0',
              borderRadius: '5px',
            },
          },
          [
            React.createElement('h2', { key: 'info-title' }, '📊 System Information'),
            React.createElement('ul', { key: 'info-list' }, [
              React.createElement('li', { key: 'url' }, `URL: ${window.location.href}`),
              React.createElement('li', { key: 'ua' }, `User Agent: ${navigator.userAgent}`),
              React.createElement('li', { key: 'lang' }, `Language: ${navigator.language}`),
              React.createElement('li', { key: 'online' }, `Online: ${navigator.onLine}`),
              React.createElement(
                'li',
                { key: 'cookies' },
                `Cookies Enabled: ${navigator.cookieEnabled}`
              ),
            ]),
          ]
        ),

        React.createElement(
          'div',
          {
            key: 'tests',
            style: {
              background: '#fff',
              border: '1px solid #ddd',
              padding: '15px',
              margin: '20px 0',
              borderRadius: '5px',
            },
          },
          [
            React.createElement('h2', { key: 'tests-title' }, '🧪 Diagnostic Tests'),
            React.createElement(
              'div',
              {
                key: 'tests-grid',
                style: {
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '10px',
                },
              },
              Object.entries(testResults).map(([test, passed]) =>
                React.createElement(
                  'div',
                  {
                    key: test,
                    style: {
                      padding: '10px',
                      background: passed ? '#d4edda' : '#f8d7da',
                      border: `1px solid ${passed ? '#c3e6cb' : '#f5c6cb'}`,
                      borderRadius: '3px',
                    },
                  },
                  `${passed ? '✅' : '❌'} ${test}`
                )
              )
            ),
          ]
        ),

        React.createElement(
          'div',
          {
            key: 'logs',
            style: {
              background: '#2c3e50',
              color: '#ecf0f1',
              padding: '15px',
              margin: '20px 0',
              borderRadius: '5px',
              fontFamily: 'Consolas, Monaco, monospace',
              fontSize: '14px',
            },
          },
          [
            React.createElement(
              'h2',
              {
                key: 'logs-title',
                style: { color: '#ecf0f1', marginTop: 0 },
              },
              '📝 Diagnostic Logs'
            ),
            React.createElement(
              'div',
              { key: 'logs-content' },
              logs.map((log, i) =>
                React.createElement('div', { key: i, style: { margin: '5px 0' } }, log)
              )
            ),
          ]
        ),

        React.createElement(
          'button',
          {
            key: 'reload',
            onClick: () => window.location.reload(),
            style: {
              background: '#3498db',
              color: 'white',
              border: 'none',
              padding: '15px 30px',
              fontSize: '16px',
              borderRadius: '5px',
              cursor: 'pointer',
              marginTop: '20px',
            },
          },
          '🔄 Reload Page'
        ),

        React.createElement(
          'div',
          {
            key: 'next-steps',
            style: {
              background: '#fff3cd',
              border: '1px solid #ffeaa7',
              padding: '15px',
              margin: '20px 0',
              borderRadius: '5px',
            },
          },
          [
            React.createElement('h3', { key: 'next-title' }, '🚀 Next Steps'),
            React.createElement(
              'p',
              { key: 'next-text' },
              'If all tests pass, we can proceed to load the full VB6 Web IDE application.'
            ),
            React.createElement(
              'button',
              {
                key: 'load-full',
                onClick: () => {
                  window.location.href = window.location.href + '?loadFull=true';
                },
                style: {
                  background: '#27ae60',
                  color: 'white',
                  border: 'none',
                  padding: '10px 20px',
                  fontSize: '14px',
                  borderRadius: '3px',
                  cursor: 'pointer',
                },
              },
              '📱 Load Full VB6 IDE'
            ),
          ]
        ),
      ]
    );
  }

  // ÉTAPE 4: Créer et rendre l'application
  const root = createRoot(rootElement);

  root.render(React.createElement(StrictMode, {}, React.createElement(DiagnosticApp)));
} catch (error) {
  console.error('❌ DIAGNOSTIC: Critical error during initialization:', error);
  console.error('❌ DIAGNOSTIC: Error stack:', error.stack);

  // Create fallback error display safely
  document.body.textContent = ''; // Clear safely

  const container = document.createElement('div');
  container.style.cssText =
    'padding: 40px; font-family: Arial; background: #ffebee; min-height: 100vh;';

  const title = document.createElement('h1');
  title.style.color = '#c62828';
  title.textContent = '❌ DIAGNOSTIC: Critical Error';

  const errorDiv = document.createElement('div');
  errorDiv.style.cssText = 'background: #fff; padding: 20px; border-radius: 5px; margin: 20px 0;';

  const errorTitle = document.createElement('h2');
  errorTitle.textContent = 'Error Details:';

  const errorPre = document.createElement('pre');
  errorPre.style.cssText = 'background: #f5f5f5; padding: 15px; overflow: auto;';
  errorPre.textContent = `${error.message || 'Unknown error'}\n\n${error.stack || 'No stack trace'}`;

  const envDiv = document.createElement('div');
  envDiv.style.cssText = 'background: #e3f2fd; padding: 15px; border-radius: 5px;';

  const envTitle = document.createElement('h3');
  envTitle.textContent = 'Environment Info:';

  const envList = document.createElement('ul');
  const envInfo = [
    `URL: ${window.location.href}`,
    `User Agent: ${navigator.userAgent}`,
    `Document Ready State: ${document.readyState}`,
    `Root Element: ${document.getElementById('root') ? 'Found' : 'Missing'}`,
  ];

  envInfo.forEach(info => {
    const li = document.createElement('li');
    li.textContent = info;
    envList.appendChild(li);
  });

  const reloadBtn = document.createElement('button');
  reloadBtn.style.cssText =
    'background: #1976d2; color: white; border: none; padding: 15px 30px; font-size: 16px; border-radius: 5px; cursor: pointer; margin-top: 20px;';
  reloadBtn.textContent = '🔄 Reload Page';
  reloadBtn.onclick = () => window.location.reload();

  errorDiv.appendChild(errorTitle);
  errorDiv.appendChild(errorPre);
  envDiv.appendChild(envTitle);
  envDiv.appendChild(envList);

  container.appendChild(title);
  container.appendChild(errorDiv);
  container.appendChild(envDiv);
  container.appendChild(reloadBtn);

  document.body.appendChild(container);
}
