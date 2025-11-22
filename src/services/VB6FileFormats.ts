import { EventEmitter } from 'events';

// VB6 File Format Constants
export enum VB6FileType {
  FRX = '.frx',
  CTX = '.ctx', 
  OCA = '.oca',
  VBG = '.vbg',
  FRM = '.frm',
  BAS = '.bas',
  CLS = '.cls',
  VBP = '.vbp'
}

// VB6 Property Types for binary files
export enum VB6PropertyType {
  String = 8,
  Picture = 14,
  Binary = 17,
  Font = 18,
  Color = 19
}

// VB6 Picture Format Constants
export enum VB6PictureFormat {
  Bitmap = 1,
  Metafile = 2,
  Icon = 3,
  EnhancedMetafile = 4
}

// FRX/CTX Property Structure
export interface VB6BinaryProperty {
  size: number;
  type: VB6PropertyType;
  data: Uint8Array;
}

// VBG Project Group Structure
export interface VB6ProjectGroup {
  type: string;
  reference: string;
  project: string;
  package: string;
  startMode: number;
}

// OCA Cache Entry Structure
export interface VB6CacheEntry {
  typeLibGuid: string;
  version: string;
  lcid: number;
  description: string;
  helpFile: string;
  helpContext: number;
  flags: number;
}

export class VB6FileFormats extends EventEmitter {
  private static instance: VB6FileFormats;

  public static getInstance(): VB6FileFormats {
    if (!VB6FileFormats.instance) {
      VB6FileFormats.instance = new VB6FileFormats();
    }
    return VB6FileFormats.instance;
  }

  // FRX File Format Handler
  public parseFRXFile(data: ArrayBuffer): Map<number, VB6BinaryProperty> {
    const properties = new Map<number, VB6BinaryProperty>();
    const view = new DataView(data);
    let offset = 0;

    try {
      while (offset < data.byteLength) {
        // Read property index (4 bytes, little-endian)
        const index = view.getUint32(offset, true);
        offset += 4;

        // Read property size (4 bytes, little-endian)
        const size = view.getUint32(offset, true);
        offset += 4;

        // Read property type (2 bytes, little-endian)
        const type = view.getUint16(offset, true) as VB6PropertyType;
        offset += 2;

        // Skip reserved bytes (2 bytes)
        offset += 2;

        // Read property data
        const propData = new Uint8Array(data, offset, size);
        offset += size;

        properties.set(index, {
          size,
          type,
          data: propData
        });
      }

      this.emit('frxParsed', properties);
      return properties;
    } catch (error) {
      this.emit('error', `Error parsing FRX file: ${error}`);
      throw error;
    }
  }

  public generateFRXFile(properties: Map<number, VB6BinaryProperty>): ArrayBuffer {
    try {
      // Calculate total size
      let totalSize = 0;
      properties.forEach(prop => {
        totalSize += 12 + prop.size; // 4+4+2+2 header bytes + data
      });

      const buffer = new ArrayBuffer(totalSize);
      const view = new DataView(buffer);
      let offset = 0;

      properties.forEach((prop, index) => {
        // Write property index
        view.setUint32(offset, index, true);
        offset += 4;

        // Write property size
        view.setUint32(offset, prop.size, true);
        offset += 4;

        // Write property type
        view.setUint16(offset, prop.type, true);
        offset += 2;

        // Write reserved bytes
        view.setUint16(offset, 0, true);
        offset += 2;

        // Write property data
        const targetArray = new Uint8Array(buffer, offset, prop.size);
        targetArray.set(prop.data);
        offset += prop.size;
      });

      this.emit('frxGenerated', buffer);
      return buffer;
    } catch (error) {
      this.emit('error', `Error generating FRX file: ${error}`);
      throw error;
    }
  }

  // CTX File Format Handler (similar to FRX but for UserControls)
  public parseCTXFile(data: ArrayBuffer): Map<number, VB6BinaryProperty> {
    // CTX files use the same format as FRX files
    return this.parseFRXFile(data);
  }

  public generateCTXFile(properties: Map<number, VB6BinaryProperty>): ArrayBuffer {
    // CTX files use the same format as FRX files
    return this.generateFRXFile(properties);
  }

  // VBG Project Group File Handler
  public parseVBGFile(content: string): VB6ProjectGroup[] {
    const groups: VB6ProjectGroup[] = [];
    const lines = content.split('\r\n').filter(line => line.trim());

    try {
      for (const line of lines) {
        if (line.startsWith('Type=')) {
          const type = line.substring(5);
          continue;
        }

        if (line.startsWith('Reference=')) {
          const reference = line.substring(10);
          continue;
        }

        if (line.startsWith('Project=')) {
          const projectLine = line.substring(8);
          const parts = projectLine.split(';');
          
          if (parts.length >= 2) {
            groups.push({
              type: 'Project',
              reference: '',
              project: parts[0],
              package: parts[1] || '',
              startMode: 0
            });
          }
        }

        if (line.startsWith('Package=')) {
          const packageLine = line.substring(8);
          const parts = packageLine.split(';');
          
          if (parts.length >= 2 && groups.length > 0) {
            const lastGroup = groups[groups.length - 1];
            lastGroup.package = parts[0];
            lastGroup.startMode = parseInt(parts[1]) || 0;
          }
        }
      }

      this.emit('vbgParsed', groups);
      return groups;
    } catch (error) {
      this.emit('error', `Error parsing VBG file: ${error}`);
      throw error;
    }
  }

  public generateVBGFile(groups: VB6ProjectGroup[]): string {
    try {
      const lines: string[] = [];
      
      lines.push('VBGROUP 5.0');
      lines.push('StartupProject=(None)');
      lines.push('');

      groups.forEach(group => {
        if (group.reference) {
          lines.push(`Reference=${group.reference}`);
        }
        
        lines.push(`Project=${group.project};${group.package}`);
        
        if (group.package) {
          lines.push(`Package=${group.package};${group.startMode}`);
        }
        
        lines.push('');
      });

      const content = lines.join('\r\n');
      this.emit('vbgGenerated', content);
      return content;
    } catch (error) {
      this.emit('error', `Error generating VBG file: ${error}`);
      throw error;
    }
  }

  // OCA Object Cache File Handler
  public parseOCAFile(data: ArrayBuffer): VB6CacheEntry[] {
    const entries: VB6CacheEntry[] = [];
    const view = new DataView(data);
    let offset = 0;

    try {
      // Read OCA header
      const signature = new TextDecoder().decode(new Uint8Array(data, offset, 4));
      if (signature !== 'OCA\0') {
        throw new Error('Invalid OCA file signature');
      }
      offset += 4;

      // Read version
      const version = view.getUint32(offset, true);
      offset += 4;

      // Read number of entries
      const entryCount = view.getUint32(offset, true);
      offset += 4;

      // Read entries
      for (let i = 0; i < entryCount; i++) {
        // Read GUID (16 bytes)
        const guidBytes = new Uint8Array(data, offset, 16);
        const guid = Array.from(guidBytes)
          .map(b => b.toString(16).padStart(2, '0'))
          .join('');
        offset += 16;

        // Read version string length
        const versionLen = view.getUint32(offset, true);
        offset += 4;

        // Read version string
        const versionStr = new TextDecoder().decode(
          new Uint8Array(data, offset, versionLen)
        );
        offset += versionLen;

        // Read LCID
        const lcid = view.getUint32(offset, true);
        offset += 4;

        // Read description length
        const descLen = view.getUint32(offset, true);
        offset += 4;

        // Read description
        const description = new TextDecoder().decode(
          new Uint8Array(data, offset, descLen)
        );
        offset += descLen;

        // Read help file length
        const helpFileLen = view.getUint32(offset, true);
        offset += 4;

        // Read help file
        const helpFile = new TextDecoder().decode(
          new Uint8Array(data, offset, helpFileLen)
        );
        offset += helpFileLen;

        // Read help context
        const helpContext = view.getUint32(offset, true);
        offset += 4;

        // Read flags
        const flags = view.getUint32(offset, true);
        offset += 4;

        entries.push({
          typeLibGuid: guid,
          version: versionStr,
          lcid,
          description,
          helpFile,
          helpContext,
          flags
        });
      }

      this.emit('ocaParsed', entries);
      return entries;
    } catch (error) {
      this.emit('error', `Error parsing OCA file: ${error}`);
      throw error;
    }
  }

  public generateOCAFile(entries: VB6CacheEntry[]): ArrayBuffer {
    try {
      // Calculate total size
      let totalSize = 12; // Header: signature(4) + version(4) + count(4)
      
      entries.forEach(entry => {
        totalSize += 16; // GUID
        totalSize += 4 + entry.version.length; // Version string
        totalSize += 4; // LCID
        totalSize += 4 + entry.description.length; // Description
        totalSize += 4 + entry.helpFile.length; // Help file
        totalSize += 4; // Help context
        totalSize += 4; // Flags
      });

      const buffer = new ArrayBuffer(totalSize);
      const view = new DataView(buffer);
      let offset = 0;

      // Write header
      const signature = new TextEncoder().encode('OCA\0');
      new Uint8Array(buffer, offset, 4).set(signature);
      offset += 4;

      // Write version
      view.setUint32(offset, 1, true);
      offset += 4;

      // Write entry count
      view.setUint32(offset, entries.length, true);
      offset += 4;

      // Write entries
      entries.forEach(entry => {
        // Write GUID
        const guidBytes = entry.typeLibGuid.match(/.{2}/g)?.map(hex => parseInt(hex, 16)) || [];
        new Uint8Array(buffer, offset, 16).set(guidBytes);
        offset += 16;

        // Write version string
        const versionBytes = new TextEncoder().encode(entry.version);
        view.setUint32(offset, versionBytes.length, true);
        offset += 4;
        new Uint8Array(buffer, offset, versionBytes.length).set(versionBytes);
        offset += versionBytes.length;

        // Write LCID
        view.setUint32(offset, entry.lcid, true);
        offset += 4;

        // Write description
        const descBytes = new TextEncoder().encode(entry.description);
        view.setUint32(offset, descBytes.length, true);
        offset += 4;
        new Uint8Array(buffer, offset, descBytes.length).set(descBytes);
        offset += descBytes.length;

        // Write help file
        const helpBytes = new TextEncoder().encode(entry.helpFile);
        view.setUint32(offset, helpBytes.length, true);
        offset += 4;
        new Uint8Array(buffer, offset, helpBytes.length).set(helpBytes);
        offset += helpBytes.length;

        // Write help context
        view.setUint32(offset, entry.helpContext, true);
        offset += 4;

        // Write flags
        view.setUint32(offset, entry.flags, true);
        offset += 4;
      });

      this.emit('ocaGenerated', buffer);
      return buffer;
    } catch (error) {
      this.emit('error', `Error generating OCA file: ${error}`);
      throw error;
    }
  }

  // Utility Methods
  public extractImageFromFRX(property: VB6BinaryProperty): HTMLImageElement | null {
    if (property.type !== VB6PropertyType.Picture) {
      return null;
    }

    try {
      // Create image from binary data
      const blob = new Blob([property.data]);
      const url = URL.createObjectURL(blob);
      const img = new Image();
      img.src = url;
      
      return img;
    } catch (error) {
      this.emit('error', `Error extracting image: ${error}`);
      return null;
    }
  }

  public createImageProperty(imageData: Uint8Array): VB6BinaryProperty {
    return {
      size: imageData.length,
      type: VB6PropertyType.Picture,
      data: imageData
    };
  }

  public createStringProperty(text: string): VB6BinaryProperty {
    const data = new TextEncoder().encode(text);
    return {
      size: data.length,
      type: VB6PropertyType.String,
      data
    };
  }

  public createFontProperty(fontName: string, fontSize: number, bold: boolean = false, italic: boolean = false): VB6BinaryProperty {
    // VB6 Font property format (simplified)
    const fontData = new ArrayBuffer(64);
    const view = new DataView(fontData);
    const nameBytes = new TextEncoder().encode(fontName);
    
    // Font structure
    view.setFloat32(0, fontSize, true); // Size
    view.setUint32(4, bold ? 700 : 400, true); // Weight
    view.setUint8(8, italic ? 1 : 0); // Italic
    view.setUint8(9, 0); // Underline
    view.setUint8(10, 0); // Strikethrough
    view.setUint8(11, 1); // Charset
    
    // Font name (starting at offset 12)
    new Uint8Array(fontData, 12, Math.min(nameBytes.length, 32)).set(nameBytes);
    
    return {
      size: 64,
      type: VB6PropertyType.Font,
      data: new Uint8Array(fontData)
    };
  }

  public validateFileFormat(filename: string, data: ArrayBuffer | string): boolean {
    const ext = filename.toLowerCase().substring(filename.lastIndexOf('.'));
    
    try {
      switch (ext) {
        case VB6FileType.FRX:
        case VB6FileType.CTX:
          if (typeof data === 'string') return false;
          this.parseFRXFile(data);
          return true;
          
        case VB6FileType.VBG:
          if (typeof data !== 'string') return false;
          this.parseVBGFile(data);
          return true;
          
        case VB6FileType.OCA:
          if (typeof data === 'string') return false;
          this.parseOCAFile(data);
          return true;
          
        default:
          return false;
      }
    } catch {
      return false;
    }
  }

  // File I/O Integration
  public async loadFile(filename: string): Promise<ArrayBuffer | string> {
    const ext = filename.toLowerCase().substring(filename.lastIndexOf('.'));
    
    try {
      if (ext === VB6FileType.VBG) {
        // Text file
        const response = await fetch(filename);
        return await response.text();
      } else {
        // Binary file
        const response = await fetch(filename);
        return await response.arrayBuffer();
      }
    } catch (error) {
      this.emit('error', `Error loading file ${filename}: ${error}`);
      throw error;
    }
  }

  public saveFile(filename: string, data: ArrayBuffer | string): Blob {
    const ext = filename.toLowerCase().substring(filename.lastIndexOf('.'));
    
    if (ext === VB6FileType.VBG && typeof data === 'string') {
      return new Blob([data], { type: 'text/plain' });
    } else if (data instanceof ArrayBuffer) {
      return new Blob([data], { type: 'application/octet-stream' });
    } else {
      throw new Error('Invalid data type for file format');
    }
  }
}

export default VB6FileFormats;