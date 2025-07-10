import { Project } from '../types/extended';
import JSZip from 'jszip';

export class FileManager {
  static async openProject(): Promise<Project | null> {
    try {
      const getFile = async () => {
        if ('showOpenFilePicker' in window) {
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
          return fileHandle.getFile();
        }

        return new Promise<File | null>(resolve => {
          const input = document.createElement('input');
          input.type = 'file';
          input.accept = '.vbp,.vb6,.vb6z,.json,.zip';
          input.onchange = async e => {
            const file = (e.target as HTMLInputElement).files?.[0] || null;
            resolve(file);
          };
          input.click();
        });
      };

      const file = await getFile();
      if (!file) return null;

      if (file.name.endsWith('.vb6z') || file.name.endsWith('.zip')) {
        const buffer = await file.arrayBuffer();
        const zip = await JSZip.loadAsync(buffer);
        const projectText = await zip.file('project.json')?.async('string');
        if (!projectText) throw new Error('Invalid project archive');
        return JSON.parse(projectText);
      }

      const content = await file.text();
      return JSON.parse(content);
    } catch (error) {
      console.error('Error opening project:', error);
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

      if ('showSaveFilePicker' in window) {
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
      } else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${project.name}.${extension}`;
        a.click();
        URL.revokeObjectURL(url);
        return true;
      }
    } catch (error) {
      console.error('Error saving project:', error);
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

      if ('showSaveFilePicker' in window) {
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
      } else {
        const url = URL.createObjectURL(content);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        a.click();
        URL.revokeObjectURL(url);
      }

      return true;
    } catch (error) {
      console.error('Error exporting project archive:', error);
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

      const project: Project = JSON.parse(projectText);

      return project;
    } catch (error) {
      console.error('Error importing project archive:', error);
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

      if ('showOpenFilePicker' in window) {
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
      } else {
        return new Promise(resolve => {
          const input = document.createElement('input');
          input.type = 'file';
          input.accept = extensions[type].join(',');
          input.onchange = async e => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (file) {
              const content = await file.text();
              resolve(content);
            }
          };
          input.click();
        });
      }
    } catch (error) {
      console.error('Error importing file:', error);
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
}
