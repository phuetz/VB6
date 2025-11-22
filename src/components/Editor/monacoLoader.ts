// ULTRA-OPTIMIZED: Monaco Editor lazy loading configuration
// This file is loaded only when the code editor is actually needed

let monacoPromise: Promise<typeof import('monaco-editor')> | null = null;
let isMonacoConfigured = false;

export async function loadMonaco() {
  if (!monacoPromise) {
    console.log('🔧 ULTRA-OPTIMIZE: Loading Monaco Editor (4.7MB)...');
    
    monacoPromise = import('monaco-editor').then(monaco => {
      if (!isMonacoConfigured) {
        configureMonaco(monaco);
        isMonacoConfigured = true;
      }
      
      console.log('✅ ULTRA-OPTIMIZE: Monaco Editor loaded successfully');
      return monaco;
    });
  }
  
  return monacoPromise;
}

function configureMonaco(monaco: typeof import('monaco-editor')) {
  // Configure Monaco workers
  if (typeof window !== 'undefined') {
    // @ts-expect-error - MonacoEnvironment is not typed on Window interface
    window.MonacoEnvironment = {
      getWorkerUrl: function (_moduleId: string, label: string) {
        if (label === 'json') {
          return '/monaco-editor/esm/vs/language/json/json.worker.js';
        }
        if (label === 'css' || label === 'scss' || label === 'less') {
          return '/monaco-editor/esm/vs/language/css/css.worker.js';
        }
        if (label === 'html' || label === 'handlebars' || label === 'razor') {
          return '/monaco-editor/esm/vs/language/html/html.worker.js';
        }
        if (label === 'typescript' || label === 'javascript') {
          return '/monaco-editor/esm/vs/language/typescript/ts.worker.js';
        }
        return '/monaco-editor/esm/vs/editor/editor.worker.js';
      }
    };
  }
  
  // Register VB6 language if not already registered
  if (!monaco.languages.getLanguages().some(lang => lang.id === 'vb')) {
    // VB6 Language Configuration
    monaco.languages.register({ id: 'vb' });
    
    monaco.languages.setLanguageConfiguration('vb', {
      comments: {
        lineComment: "'",
      },
      brackets: [
        ['(', ')'],
        ['[', ']'],
      ],
      autoClosingPairs: [
        { open: '(', close: ')' },
        { open: '[', close: ']' },
        { open: '"', close: '"' },
      ],
      surroundingPairs: [
        { open: '(', close: ')' },
        { open: '[', close: ']' },
        { open: '"', close: '"' },
      ],
      folding: {
        markers: {
          start: new RegExp('^\\s*(Sub|Function|If|For|While|Do|With|Select)\\b'),
          end: new RegExp('^\\s*(End\\s+(Sub|Function|If|For|While|Do|With|Select)|Loop|Wend|Next)\\b'),
        },
      },
    });
  }
}

// Preload Monaco in the background after initial render
export function preloadMonaco() {
  if (typeof window !== 'undefined' && !monacoPromise) {
    // Delay preload to not affect initial render
    setTimeout(() => {
      if (!monacoPromise) {
        console.log('🔧 ULTRA-OPTIMIZE: Preloading Monaco Editor in background...');
        loadMonaco();
      }
    }, 5000); // 5 seconds after initial render
  }
}