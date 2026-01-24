import { Project } from '../types/extended';
import JSZip from 'jszip';
import { parseVBP } from '../utils/vb6ProjectImporter';
import { createLogger } from './LoggingService';

const logger = createLogger('FileManager');

export class FileManager {
  static async openProject(): Promise<Project | null> {
    try {
      const getFile = async () => {
        // BROWSER COMPATIBILITY FIX: Feature detection with fallback
        if ('showOpenFilePicker' in window && typeof (window as any).showOpenFilePicker === 'function') {
          try {
            const fileHandle = await (window as any).showOpenFilePicker({
              types: [
                {
                  description: 'VB6 Projects',
                  accept: {
                    'application/json': ['.vbp', '.vb6'],
                    'application/zip': ['.vb6z'],
                  },
                },
              ],
            });
            return await fileHandle.getFile();
          } catch (err) {
            // User cancelled or API not available - fall through to input fallback
            logger.warn('File System Access API failed, using fallback:', err);
          }
        }

        // Fallback to traditional file input
        return new Promise<File | null>(resolve => {
          const input = document.createElement('input');
          input.type = 'file';
          input.accept = '.vbp,.vb6,.vb6z,.json,.zip';
          input.style.display = 'none';
          document.body.appendChild(input);
          
          input.onchange = async e => {
            const file = (e.target as HTMLInputElement).files?.[0] || null;
            document.body.removeChild(input);
            resolve(file);
          };
          
          input.oncancel = () => {
            document.body.removeChild(input);
            resolve(null);
          };
          
          input.click();
        });
      };

      const file = await getFile();
      if (!file) return null;

      if (file.name.endsWith('.vb6z') || file.name.endsWith('.zip')) {
        const buffer = await file.arrayBuffer();
        const zip = await JSZip.loadAsync(buffer);
        
        // PATH TRAVERSAL BUG FIX: Validate archive contents before extraction
        const fileNames = Object.keys(zip.files);
        for (const fileName of fileNames) {
          if (!this.isValidArchivePath(fileName)) {
            throw new Error(`Unsafe file path in archive: ${fileName}`);
          }
        }
        
        const projectText = await zip.file('project.json')?.async('string');
        if (!projectText) throw new Error('Invalid project archive');
        return this.safeParseJSON(projectText);
      }

      const content = await file.text();
      
      // RESOURCE EXHAUSTION BUG FIX: Limit content size
      if (content.length > 10 * 1024 * 1024) { // 10MB text limit
        throw new Error('File content too large');
      }

      if (file.name.endsWith('.vbp')) {
        const info = parseVBP(content);
        return {
          id: Date.now().toString(),
          name: file.name.replace(/\.vbp$/i, ''),
          version: '1.0',
          created: new Date(),
          modified: new Date(),
          forms: info.forms.map(f => ({
            id: f,
            name: f.replace(/\.frm$/i, ''),
            caption: f.replace(/\.frm$/i, ''),
            controls: [],
          })),
          modules: info.modules.map(m => ({
            id: m,
            name: m.replace(/\.bas$/i, ''),
            type: 'standard',
            code: '',
            procedures: [],
            variables: [],
            constants: [],
          })),
          classModules: info.classes.map(c => ({
            id: c,
            name: c.replace(/\.cls$/i, ''),
            type: 'class',
            code: '',
            procedures: [],
            variables: [],
            constants: [],
            events: [],
            properties: [],
            methods: [],
          })),
          userControls: [],
          resources: [],
          settings: {
            title: '',
            description: '',
            version: '1.0',
            autoIncrementVersion: false,
            compilationType: 'exe',
            startupObject: info.startup || '',
            icon: '',
            helpFile: '',
            threadingModel: 'apartment',
          },
          references: info.references.map(r => ({
            id: r,
            name: r,
            description: '',
            version: '',
            location: '',
            guid: '',
            checked: false,
            builtin: false,
            major: 0,
            minor: 0,
          })),
          components: [],
        } as unknown as Project;
      }

      return this.safeParseJSON(content);
    } catch (error) {
      logger.error('Error opening project:', error);
      return null;
    }
  }

  static async saveProject(project: Project, zip = false): Promise<boolean> {
    try {
      const projectData = JSON.stringify(project, null, 2);

      let blob: Blob;
      let extension = 'vb6';

      if (zip) {
        const zipFile = new JSZip();
        zipFile.file('project.json', projectData);
        const content = await zipFile.generateAsync({ type: 'blob' });
        blob = content;
        extension = 'vb6z';
      } else {
        blob = new Blob([projectData], { type: 'application/json' });
      }

      // BROWSER COMPATIBILITY FIX: Feature detection with fallback
      if ('showSaveFilePicker' in window && typeof (window as any).showSaveFilePicker === 'function') {
        try {
          const fileHandle = await (window as any).showSaveFilePicker({
            suggestedName: `${project.name}.${extension}`,
            types: [
              {
                description: 'VB6 Projects',
                accept: zip ? { 'application/zip': ['.vb6z'] } : { 'application/json': ['.vb6'] },
              },
            ],
          });

          const writable = await fileHandle.createWritable();
          await writable.write(blob);
          await writable.close();
          return true;
        } catch (err) {
          // User cancelled or API not available - fall through to download fallback
          logger.warn('File System Access API failed, using fallback:', err);
        }
      }
      
      // Fallback to download link
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${project.name}.${extension}`;
      a.click();
      URL.revokeObjectURL(url);
      return true;
    } catch (error) {
      logger.error('Error saving project:', error);
      return false;
    }
  }

  /**
   * Export the project in a detailed archive where forms and modules are
   * stored as individual JSON files. This allows easier inspection or manual
   * editing outside of the IDE.
   */
  static async exportProjectArchive(project: Project): Promise<boolean> {
    try {
      const zip = new JSZip();
      zip.file('project.json', JSON.stringify(project, null, 2));

      project.forms.forEach(form => {
        zip.file(`forms/${form.name}.json`, JSON.stringify(form, null, 2));
      });
      project.modules.forEach(module => {
        zip.file(`modules/${module.name}.json`, JSON.stringify(module, null, 2));
      });
      project.classModules.forEach(cls => {
        zip.file(`classes/${cls.name}.json`, JSON.stringify(cls, null, 2));
      });

      const content = await zip.generateAsync({ type: 'blob' });

      const fileName = `${project.name}.vb6z`;

      // BROWSER COMPATIBILITY FIX: Feature detection with fallback
      if ('showSaveFilePicker' in window && typeof (window as any).showSaveFilePicker === 'function') {
        try {
          const fileHandle = await (window as any).showSaveFilePicker({
            suggestedName: fileName,
            types: [
              {
                description: 'VB6 Project Archive',
                accept: { 'application/zip': ['.vb6z'] },
              },
            ],
          });

          const writable = await fileHandle.createWritable();
          await writable.write(content);
          await writable.close();
          return true;
        } catch (err) {
          // User cancelled or API not available - fall through to download fallback
          logger.warn('File System Access API failed, using fallback:', err);
        }
      }
      
      // Fallback to download link
      const url = URL.createObjectURL(content);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      a.click();
      URL.revokeObjectURL(url);
      return true;
    } catch (error) {
      logger.error('Error exporting project archive:', error);
      return false;
    }
  }

  /**
   * Import a project previously exported with exportProjectArchive.
   */
  static async importProjectArchive(file: File): Promise<Project | null> {
    try {
      const buffer = await file.arrayBuffer();
      const zip = await JSZip.loadAsync(buffer);
      const projectText = await zip.file('project.json')?.async('string');
      if (!projectText) throw new Error('Invalid project archive');

      const project: Project = this.safeParseJSON(projectText);

      return project;
    } catch (error) {
      logger.error('Error importing project archive:', error);
      return null;
    }
  }

  static async importFile(type: 'form' | 'module' | 'class'): Promise<string | null> {
    try {
      const extensions = {
        form: ['.frm'],
        module: ['.bas'],
        class: ['.cls'],
      };

      // BROWSER COMPATIBILITY FIX: Feature detection with fallback
      if ('showOpenFilePicker' in window && typeof (window as any).showOpenFilePicker === 'function') {
        try {
          const fileHandle = await (window as any).showOpenFilePicker({
            types: [
              {
                description: `VB6 ${type} files`,
                accept: {
                  'text/plain': extensions[type],
                },
              },
            ],
          });

          const file = await fileHandle.getFile();
          return await file.text();
        } catch (err) {
          // User cancelled or API not available - fall through to input fallback
          logger.warn('File System Access API failed, using fallback:', err);
        }
      }
      
      // Fallback to traditional file input
      return new Promise(resolve => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = extensions[type].join(',');
        input.onchange = async e => {
          const file = (e.target as HTMLInputElement).files?.[0];
          if (file) {
            const content = await file.text();
            // RESOURCE EXHAUSTION BUG FIX: Limit imported file size
            if (content.length > 5 * 1024 * 1024) { // 5MB limit
              throw new Error('Imported file too large');
            }
            resolve(content);
          }
        };
        input.click();
      });
    } catch (error) {
      logger.error('Error importing file:', error);
      return null;
    }
  }

  static async exportToJavaScript(project: Project): Promise<void> {
    const jsCode = this.generateJavaScript(project);
    const blob = new Blob([jsCode], { type: 'text/javascript' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project.name}.js`;
    a.click();
    URL.revokeObjectURL(url);
  }

  static async exportToHTML(project: Project): Promise<void> {
    const htmlCode = this.generateHTML(project);
    const blob = new Blob([htmlCode], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project.name}.html`;
    a.click();
    URL.revokeObjectURL(url);
  }

  private static generateJavaScript(project: Project): string {
    return `
// Generated from ${project.name}
// Created with VB6 Clone IDE

class ${project.name} {
  constructor() {
    this.forms = {};
    this.modules = {};
    this.initialize();
  }

  initialize() {
    // Initialize forms and modules
    ${project.forms.map(form => `this.forms['${form.name}'] = new ${form.name}();`).join('\n    ')}
    ${project.modules.map(module => `this.modules['${module.name}'] = new ${module.name}();`).join('\n    ')}
  }

  run() {
    // Start the application
    if (this.forms['${project.settings.startupObject}']) {
      this.forms['${project.settings.startupObject}'].show();
    }
  }
}

// Export the application
window.${project.name} = ${project.name};
`;
  }

  private static generateHTML(project: Project): string {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${project.name}</title>
    <style>
        body {
            font-family: 'MS Sans Serif', sans-serif;
            background-color: #C0C0C0;
            margin: 0;
            padding: 20px;
        }
        .vb-form {
            position: relative;
            background-color: #8080FF;
            border: 1px solid #000;
            margin: 0 auto;
            box-shadow: 2px 2px 5px rgba(0,0,0,0.3);
        }
        .vb-control {
            position: absolute;
            font-family: inherit;
            font-size: 11px;
        }
        .vb-button {
            background-color: #C0C0C0;
            border: 1px solid #000;
            box-shadow: inset 1px 1px 0 #fff, inset -1px -1px 0 #808080;
            cursor: pointer;
        }
        .vb-textbox {
            border: 1px solid #000;
            box-shadow: inset 1px 1px 0 #808080, inset -1px -1px 0 #fff;
            background-color: #fff;
            padding: 2px;
        }
    </style>
</head>
<body>
    <div id="app"></div>
    <script>
        ${this.generateJavaScript(project)}
        
        // Initialize and run the application
        const app = new ${project.name}();
        app.run();
    </script>
</body>
</html>
`;
  }

  /**
   * PROTOTYPE POLLUTION BUG FIX: Safe JSON parsing with prototype pollution protection
   */
  private static safeParseJSON(jsonString: string): any {
    try {
      const parsed = JSON.parse(jsonString);
      return this.sanitizeObject(parsed);
    } catch (error) {
      throw new Error(`Invalid JSON content: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Recursively sanitize objects to remove dangerous properties
   */
  private static sanitizeObject(obj: any): any {
    if (obj === null || typeof obj !== 'object') {
      return obj;
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.sanitizeObject(item));
    }

    // Remove dangerous prototype pollution properties
    const dangerousProperties = ['__proto__', 'constructor', 'prototype'];
    
    const sanitized: any = {};
    for (const [key, value] of Object.entries(obj)) {
      // Skip dangerous properties
      if (dangerousProperties.includes(key)) {
        logger.warn(`Blocked dangerous property in JSON: ${key}`);
        continue;
      }
      
      // Validate property names - only allow safe characters
      if (!/^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(key) && key !== 'length') {
        logger.warn(`Blocked suspicious property name in JSON: ${key}`);
        continue;
      }
      
      // Recursively sanitize nested objects
      sanitized[key] = this.sanitizeObject(value);
    }
    
    return sanitized;
  }

  /**
   * PATH TRAVERSAL BUG FIX: Validate archive file paths to prevent zip slip attacks
   */
  private static isValidArchivePath(filePath: string): boolean {
    // Normalize path separators
    const normalizedPath = filePath.replace(/\\/g, '/');
    
    // Check for dangerous patterns
    const dangerousPatterns = [
      /\.\./,              // Directory traversal
      /^[/\\]/,            // Absolute paths
      /^[a-zA-Z]:/,        // Windows drive letters
      /^\\\\[^\\]+\\/,     // UNC paths
      /<[^>]*>/,           // HTML/XML tags
      /[<>:"|?*]/,         // Invalid filename characters
      /\0/,                // Null bytes
    ];
    
    // Reject paths matching dangerous patterns
    if (dangerousPatterns.some(pattern => pattern.test(normalizedPath))) {
      return false;
    }
    
    // Only allow paths within reasonable subdirectories
    const pathParts = normalizedPath.split('/').filter(part => part !== '');
    
    // Check each path component
    for (const part of pathParts) {
      // Reject empty parts, dots, or suspicious names
      if (part === '' || part === '.' || part === '..' || 
          part.startsWith('.') && part.length > 4) {
        return false;
      }
      
      // Limit path depth to prevent deep directory structures
      if (pathParts.length > 10) {
        return false;
      }
      
      // Check for excessively long path components
      if (part.length > 255) {
        return false;
      }
    }
    
    // Only allow common project file extensions
    const allowedExtensions = [
      '.json', '.vbp', '.vb', '.frm', '.bas', '.cls', '.ctl', '.pag', '.dsr',
      '.txt', '.md', '.css', '.js', '.html', '.xml', '.ini', '.cfg'
    ];
    
    const hasValidExtension = allowedExtensions.some(ext => 
      normalizedPath.toLowerCase().endsWith(ext)
    );
    
    // Allow directories (no extension) or files with valid extensions
    return !normalizedPath.includes('.') || hasValidExtension;
  }
}
