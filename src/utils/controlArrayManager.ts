import { Control } from '../context/types';

interface ControlArrayInfo {
  name: string;
  members: Control[];
  baseProperties: Record<string, any>;
}

class ControlArrayManager {
  private static controlArrays: Map<string, ControlArrayInfo> = new Map();
  private static maxArraySize = 32767; // VB6 limit

  /**
   * Crée un nouveau tableau de contrôles ou ajoute un contrôle à un tableau existant
   */
  static createOrAddToArray(
    baseControl: Control,
    arrayName: string,
    controls: Control[]
  ): Control[] {
    // MEMORY LAYOUT PREDICTABILITY BUG FIX: Add randomization
    this.performMemoryLayoutJitter();

    const existingArray = this.controlArrays.get(arrayName);
    
    if (existingArray) {
      // Vérifier si on dépasse la limite VB6
      if (existingArray.members.length >= this.maxArraySize) {
        throw new Error(`Control array '${arrayName}' has reached maximum size (${this.maxArraySize})`);
      }
      
      // Trouver le prochain index disponible
      const usedIndices = existingArray.members.map(m => m.index || 0);
      const nextIndex = this.findNextAvailableIndex(usedIndices);
      
      const newControl: Control = {
        ...baseControl,
        id: Date.now(),
        name: `${arrayName}(${nextIndex})`,
        arrayName,
        index: nextIndex,
        isArray: true,
        // Hériter des propriétés communes du tableau
        ...this.getCommonProperties(existingArray.members),
      };
      
      existingArray.members.push(newControl);
      
      return [...controls, newControl];
    } else {
      // Créer un nouveau tableau
      const newControl: Control = {
        ...baseControl,
        id: Date.now(),
        name: `${arrayName}(0)`,
        arrayName,
        index: 0,
        isArray: true,
      };
      
      this.controlArrays.set(arrayName, {
        name: arrayName,
        members: [newControl],
        baseProperties: this.extractBaseProperties(baseControl),
      });
      
      return [...controls, newControl];
    }
  }

  /**
   * Trouve le prochain index disponible dans un tableau
   */
  private static findNextAvailableIndex(usedIndices: number[]): number {
    const sortedIndices = usedIndices.sort((a, b) => a - b);
    
    for (let i = 0; i < sortedIndices.length; i++) {
      if (sortedIndices[i] !== i) {
        return i;
      }
    }
    
    return sortedIndices.length;
  }

  /**
   * Extrait les propriétés de base d'un contrôle pour un tableau
   */
  private static extractBaseProperties(control: Control): Record<string, any> {
    const { id, name, x, y, index, arrayName, isArray, ...baseProps } = control;
    return baseProps;
  }

  /**
   * Obtient les propriétés communes à tous les membres d'un tableau
   */
  private static getCommonProperties(members: Control[]): Record<string, any> {
    if (members.length === 0) return {};
    
    const commonProps: Record<string, any> = {};
    const firstMember = members[0];
    
    // Propriétés qui doivent être communes à tous les membres d'un tableau
    const sharedProperties = [
      'type', 'width', 'height', 'visible', 'enabled', 
      'fontSize', 'fontFamily', 'color', 'backgroundColor'
    ];
    
    sharedProperties.forEach(prop => {
      if (prop in firstMember) {
        // Vérifier si la propriété est commune à tous les membres
        const isCommon = members.every(member => 
          member[prop as keyof Control] === firstMember[prop as keyof Control]
        );
        
        if (isCommon) {
          commonProps[prop] = firstMember[prop as keyof Control];
        }
      }
    });
    
    return commonProps;
  }

  /**
   * Supprime un contrôle d'un tableau
   */
  static removeFromArray(control: Control, controls: Control[]): Control[] {
    if (!control.isArray || !control.arrayName) {
      throw new Error('Control is not part of an array');
    }
    
    const arrayInfo = this.controlArrays.get(control.arrayName);
    if (!arrayInfo) {
      throw new Error(`Array '${control.arrayName}' not found`);
    }
    
    // Retirer le contrôle de l'info du tableau
    arrayInfo.members = arrayInfo.members.filter(m => m.id !== control.id);
    
    // Si le tableau est vide, le supprimer complètement
    if (arrayInfo.members.length === 0) {
      this.controlArrays.delete(control.arrayName);
    }
    
    return controls.filter(c => c.id !== control.id);
  }

  /**
   * Met à jour une propriété pour tous les membres d'un tableau
   */
  static updateArrayProperty(
    arrayName: string,
    property: string,
    value: any,
    controls: Control[]
  ): Control[] {
    const arrayInfo = this.controlArrays.get(arrayName);
    if (!arrayInfo) {
      throw new Error(`Array '${arrayName}' not found`);
    }
    
    return controls.map(control => {
      if (control.arrayName === arrayName && control.isArray) {
        return { ...control, [property]: value };
      }
      return control;
    });
  }

  /**
   * Obtient tous les membres d'un tableau
   */
  static getArrayMembers(arrayName: string): Control[] {
    const arrayInfo = this.controlArrays.get(arrayName);
    return arrayInfo ? [...arrayInfo.members] : [];
  }

  /**
   * Obtient les informations sur tous les tableaux
   */
  static getAllArrays(): ControlArrayInfo[] {
    return Array.from(this.controlArrays.values());
  }

  /**
   * Vérifie si un nom peut être utilisé pour un tableau
   */
  static isValidArrayName(name: string, existingControls: Control[]): boolean {
    // Vérifier que le nom n'est pas déjà utilisé par un contrôle non-tableau
    const nonArrayControl = existingControls.find(c => c.name === name && !c.isArray);
    if (nonArrayControl) return false;
    
    // Vérifier la syntaxe du nom (VB6 naming rules)
    const validNameRegex = /^[a-zA-Z][a-zA-Z0-9_]*$/;
    return validNameRegex.test(name);
  }

  /**
   * Réorganise les indices d'un tableau pour éliminer les trous
   */
  static compactArray(arrayName: string, controls: Control[]): Control[] {
    const arrayInfo = this.controlArrays.get(arrayName);
    if (!arrayInfo) {
      throw new Error(`Array '${arrayName}' not found`);
    }
    
    // Trier les membres par index actuel
    const sortedMembers = arrayInfo.members.sort((a, b) => (a.index || 0) - (b.index || 0));
    
    // Réassigner les indices de manière continue
    const updatedControls = controls.map(control => {
      if (control.arrayName === arrayName && control.isArray) {
        const memberIndex = sortedMembers.findIndex(m => m.id === control.id);
        const newIndex = memberIndex;
        const newName = `${arrayName}(${newIndex})`;
        
        return { ...control, index: newIndex, name: newName };
      }
      return control;
    });
    
    // Mettre à jour l'info du tableau
    arrayInfo.members = sortedMembers.map((member, index) => ({
      ...member,
      index,
      name: `${arrayName}(${index})`,
    }));
    
    return updatedControls;
  }

  /**
   * Clone un membre de tableau existant
   */
  static cloneArrayMember(
    sourceControl: Control,
    controls: Control[]
  ): Control[] {
    if (!sourceControl.isArray || !sourceControl.arrayName) {
      throw new Error('Source control is not part of an array');
    }
    
    return this.createOrAddToArray(
      sourceControl,
      sourceControl.arrayName,
      controls
    );
  }

  /**
   * Convertit un contrôle normal en tableau
   */
  static convertToArray(control: Control, arrayName: string): Control {
    if (control.isArray) {
      throw new Error('Control is already part of an array');
    }
    
    return {
      ...control,
      name: `${arrayName}(0)`,
      arrayName,
      index: 0,
      isArray: true,
    };
  }

  /**
   * Convertit un membre de tableau en contrôle normal
   */
  static convertFromArray(control: Control): Control {
    if (!control.isArray || control.arrayName === undefined) {
      throw new Error('Control is not part of an array');
    }

    return {
      ...control,
      index: undefined,
      arrayName: undefined,
      isArray: false,
      name: control.arrayName,
    };
  }

  /**
   * MEMORY LAYOUT PREDICTABILITY BUG FIX: Memory layout jitter
   */
  private static performMemoryLayoutJitter(): void {
    // Create temporary allocations to randomize heap state
    const allocCount = Math.floor(Math.random() * 8) + 3; // 3-11 allocations
    const tempAllocs: any[] = [];
    
    for (let i = 0; i < allocCount; i++) {
      const allocSize = Math.floor(Math.random() * 30) + 5; // 5-35 elements
      const allocation = new Array(allocSize);
      
      // Fill with control-like data to match typical usage patterns
      for (let j = 0; j < allocSize; j++) {
        allocation[j] = {
          id: Math.random() * 1000000,
          name: `temp_control_${i}_${j}`,
          type: ['TextBox', 'Label', 'CommandButton'][Math.floor(Math.random() * 3)],
          x: Math.random() * 1000,
          y: Math.random() * 1000,
          width: Math.random() * 200 + 50,
          height: Math.random() * 100 + 20,
        };
      }
      
      tempAllocs.push(allocation);
      
      // Random delay for each allocation (0-3ms)
      const delay = Math.random() * 3;
      setTimeout(() => {
        // Reference allocation to prevent GC optimization
        const sum = allocation.reduce((acc, item) => acc + item.id, 0);
        // Use sum in a way that prevents compiler optimization
        if (sum > Number.MAX_SAFE_INTEGER) {
          console.debug('Memory jitter allocation sum:', sum);
        }
      }, delay);
    }
    
    // Schedule cleanup after 10-20ms to allow heap state changes
    const cleanupDelay = Math.random() * 10 + 10;
    setTimeout(() => {
      tempAllocs.length = 0; // Clear references
    }, cleanupDelay);
  }
}

export default ControlArrayManager;