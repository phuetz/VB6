export interface VBPInfo {
  forms: string[];
  modules: string[];
  classes: string[];
  references: string[];
  startup: string | null;
}

export function parseVBP(content: string): VBPInfo {
  const info: VBPInfo = { forms: [], modules: [], classes: [], references: [], startup: null };
  const lines = content.split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (/^Form=/i.test(trimmed)) {
      const [, value] = trimmed.split('=');
      info.forms.push(value.trim());
    } else if (/^Module=/i.test(trimmed)) {
      const [, value] = trimmed.split('=');
      info.modules.push(value.trim());
    } else if (/^Class=/i.test(trimmed)) {
      const [, value] = trimmed.split('=');
      info.classes.push(value.trim());
    } else if (/^Reference=/i.test(trimmed)) {
      const [, value] = trimmed.split('=');
      info.references.push(value.trim());
    } else if (/^Startup\s*=/i.test(trimmed)) {
      const [, value] = trimmed.split('=');
      info.startup = value.replace(/"/g, '').trim();
    }
  }
  return info;
}

export interface FRMControl {
  type: string;
  name: string;
  properties: Record<string, string>;
}

export interface FRMInfo {
  name: string;
  code: string;
  properties: Record<string, string>;
  controls: FRMControl[];
}

export function parseFRM(content: string): FRMInfo {
  let name = 'Form';
  const properties: Record<string, string> = {};
  const controls: FRMControl[] = [];

  const lines = content.split(/\r?\n/);
  let currentControl: FRMControl | null = null;
  let inForm = false;

  for (const line of lines) {
    const trimmed = line.trim();

    const formBegin = trimmed.match(/^Begin\s+VB\.Form\s+(\w+)/i);
    if (formBegin) {
      inForm = true;
      name = formBegin[1];
      continue;
    }

    const controlBegin = trimmed.match(/^Begin\s+VB\.(\w+)\s+(\w+)/i);
    if (controlBegin) {
      currentControl = { type: controlBegin[1], name: controlBegin[2], properties: {} };
      continue;
    }

    if (/^End$/i.test(trimmed)) {
      if (currentControl) {
        controls.push(currentControl);
        currentControl = null;
        continue;
      }
      if (inForm) {
        inForm = false;
      }
      continue;
    }

    const propMatch = trimmed.match(/^(\w+)\s*=\s*(.+)$/);
    if (propMatch) {
      const key = propMatch[1];
      const value = propMatch[2].replace(/^"|"$/g, '');
      if (currentControl) {
        currentControl.properties[key] = value;
      } else if (inForm) {
        properties[key] = value;
      }
    }
  }

  const nameAttr = content.match(/Attribute\s+VB_Name\s*=\s*"(.+?)"/i);
  if (nameAttr) name = nameAttr[1];

  return { name, code: content, properties, controls };
}
