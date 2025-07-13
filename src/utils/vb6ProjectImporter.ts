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

export interface FRMInfo {
  name: string;
  code: string;
}

export function parseFRM(content: string): FRMInfo {
  const nameMatch = content.match(/Attribute\s+VB_Name\s*=\s*"(.+?)"/i);
  const name = nameMatch ? nameMatch[1] : 'Form';
  return { name, code: content };
}
