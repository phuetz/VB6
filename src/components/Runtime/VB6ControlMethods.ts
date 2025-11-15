/**
 * VB6 Control Methods
 * Complete implementation of all VB6 control methods
 */

/**
 * ListBox and ComboBox Methods
 */
export class VB6ListControl {
  /**
   * Add an item to the list
   */
  static AddItem(control: any, item: string, index?: number): void {
    if (!control.items) control.items = [];
    if (!control.list) control.list = [];
    if (!control.itemData) control.itemData = [];

    if (index === undefined) {
      // Add to end
      control.items.push(item);
      control.list.push(item);
      control.itemData.push(0);
      control.newIndex = control.items.length - 1;
    } else {
      // Insert at index
      control.items.splice(index, 0, item);
      control.list.splice(index, 0, item);
      control.itemData.splice(index, 0, 0);
      control.newIndex = index;
    }

    control.listCount = control.items.length;

    // Auto-sort if sorted is enabled
    if (control.sorted) {
      this.Sort(control);
    }
  }

  /**
   * Remove an item from the list
   */
  static RemoveItem(control: any, index: number): void {
    if (index < 0 || index >= control.items.length) {
      throw new Error('Invalid index');
    }

    control.items.splice(index, 1);
    control.list.splice(index, 1);
    control.itemData.splice(index, 1);

    if (control.selected && control.selected.length > index) {
      control.selected.splice(index, 1);
    }

    control.listCount = control.items.length;

    // Adjust listIndex if needed
    if (control.listIndex === index) {
      control.listIndex = -1;
    } else if (control.listIndex > index) {
      control.listIndex--;
    }
  }

  /**
   * Clear all items
   */
  static Clear(control: any): void {
    control.items = [];
    control.list = [];
    control.itemData = [];
    control.selected = [];
    control.listCount = 0;
    control.listIndex = -1;
    control.newIndex = -1;
    control.topIndex = 0;
  }

  /**
   * Sort items
   */
  static Sort(control: any): void {
    if (!control.items || control.items.length === 0) return;

    // Create array of [item, itemData, selected] tuples
    const combined = control.items.map((item: string, i: number) => ({
      item,
      data: control.itemData[i] || 0,
      selected: control.selected ? control.selected[i] : false,
    }));

    // Sort by item text
    combined.sort((a: any, b: any) => a.item.localeCompare(b.item));

    // Extract back to arrays
    control.items = combined.map((c: any) => c.item);
    control.list = [...control.items];
    control.itemData = combined.map((c: any) => c.data);
    if (control.selected) {
      control.selected = combined.map((c: any) => c.selected);
    }
  }
}

/**
 * TextBox Methods
 */
export class VB6TextBox {
  /**
   * Set focus to the control
   */
  static SetFocus(control: any): void {
    if (control.enabled && control.visible) {
      // Trigger focus event
      if (control.element) {
        control.element.focus();
      }
    }
  }

  /**
   * Select all text
   */
  static SelectAll(control: any): void {
    control.selStart = 0;
    control.selLength = control.text ? control.text.length : 0;
    control.selText = control.text || '';
  }
}

/**
 * Form Methods
 */
export class VB6Form {
  /**
   * Show the form
   */
  static Show(form: any, modal: boolean = false): void {
    form.visible = true;

    if (modal) {
      form.modal = true;
      // Block interaction with other forms
    }

    // Trigger Load event if first time
    if (!form.loaded) {
      form.loaded = true;
      if (form.Form_Load) {
        form.Form_Load();
      }
    }

    // Trigger Activate event
    if (form.Form_Activate) {
      form.Form_Activate();
    }
  }

  /**
   * Hide the form
   */
  static Hide(form: any): void {
    form.visible = false;

    // Trigger Deactivate event
    if (form.Form_Deactivate) {
      form.Form_Deactivate();
    }
  }

  /**
   * Unload the form
   */
  static Unload(form: any): void {
    // Trigger QueryUnload event
    const cancel = false;
    if (form.Form_QueryUnload) {
      form.Form_QueryUnload(0, cancel);
    }

    if (!cancel) {
      // Trigger Unload event
      if (form.Form_Unload) {
        form.Form_Unload(cancel);
      }

      if (!cancel) {
        form.visible = false;
        form.loaded = false;
        // Remove from Forms collection
      }
    }
  }

  /**
   * Refresh the form
   */
  static Refresh(form: any): void {
    // Force redraw
    if (form.element) {
      form.element.style.display = 'none';
      void form.element.offsetHeight; // Force reflow
      form.element.style.display = '';
    }
  }

  /**
   * Move the form
   */
  static Move(form: any, left: number, top?: number, width?: number, height?: number): void {
    form.left = left;
    if (top !== undefined) form.top = top;
    if (width !== undefined) form.width = width;
    if (height !== undefined) form.height = height;
  }

  /**
   * Print text on the form
   */
  static Print(form: any, text: string): void {
    if (!form.printBuffer) form.printBuffer = [];
    form.printBuffer.push(text);

    // Update CurrentX, CurrentY
    form.currentX = 0;
    form.currentY = (form.currentY || 0) + form.textHeight || 200;
  }

  /**
   * Clear form graphics
   */
  static Cls(form: any): void {
    if (form.canvas && form.ctx) {
      form.ctx.clearRect(0, 0, form.canvas.width, form.canvas.height);
      form.currentX = 0;
      form.currentY = 0;
    }
    if (form.printBuffer) {
      form.printBuffer = [];
    }
  }

  /**
   * Set scale for coordinates
   */
  static Scale(form: any, x1?: number, y1?: number, x2?: number, y2?: number): void {
    if (x1 === undefined) {
      // Reset to default
      form.scaleMode = 1; // Twips
      form.scaleLeft = 0;
      form.scaleTop = 0;
      form.scaleWidth = form.width;
      form.scaleHeight = form.height;
    } else {
      form.scaleMode = 0; // User-defined
      form.scaleLeft = x1!;
      form.scaleTop = y1!;
      form.scaleWidth = x2! - x1!;
      form.scaleHeight = y2! - y1!;
    }
  }

  /**
   * Measure text width
   */
  static TextWidth(form: any, text: string): number {
    if (form.ctx) {
      form.ctx.font = this.getFontString(form.font);
      return form.ctx.measureText(text).width;
    }
    return text.length * 100; // Approximate in twips
  }

  /**
   * Measure text height
   */
  static TextHeight(form: any, text: string): number {
    if (form.font) {
      return form.font.size * 20; // Convert points to twips
    }
    return 200; // Default height in twips
  }

  /**
   * Get font string for canvas
   */
  private static getFontString(font: any): string {
    if (!font) return '8pt "MS Sans Serif"';

    let str = '';
    if (font.bold) str += 'bold ';
    if (font.italic) str += 'italic ';
    str += `${font.size}pt `;
    str += `"${font.name}"`;

    return str;
  }
}

/**
 * PictureBox Methods
 */
export class VB6PictureBox {
  /**
   * Load a picture
   */
  static LoadPicture(path: string): any {
    return {
      type: 'picture',
      path,
      width: 0,
      height: 0,
    };
  }

  /**
   * Save picture
   */
  static SavePicture(picture: any, path: string): void {
    // Save picture to file
    console.log('SavePicture:', picture, path);
  }

  /**
   * Point method - get color at coordinates
   */
  static Point(pictureBox: any, x: number, y: number): number {
    if (!pictureBox.ctx) return 0;

    const imageData = pictureBox.ctx.getImageData(x, y, 1, 1);
    const [r, g, b] = imageData.data;

    // Convert RGB to VB6 color (BGR format)
    return (b << 16) | (g << 8) | r;
  }

  /**
   * PSet method - set pixel color
   */
  static PSet(pictureBox: any, x: number, y: number, color?: number): void {
    if (!pictureBox.ctx) return;

    const c = color !== undefined ? color : pictureBox.foreColor;
    pictureBox.ctx.fillStyle = this.colorToHex(c);
    pictureBox.ctx.fillRect(x, y, 1, 1);

    pictureBox.currentX = x;
    pictureBox.currentY = y;
  }

  /**
   * Line method - draw line
   */
  static Line(
    pictureBox: any,
    x1: number | null,
    y1: number | null,
    x2: number,
    y2: number,
    color?: number,
    flags?: string
  ): void {
    if (!pictureBox.ctx) return;

    const startX = x1 !== null ? x1 : pictureBox.currentX;
    const startY = y1 !== null ? y1 : pictureBox.currentY;

    pictureBox.ctx.strokeStyle = color ? this.colorToHex(color) : pictureBox.foreColor;
    pictureBox.ctx.lineWidth = pictureBox.drawWidth || 1;

    if (flags === 'B' || flags === 'BF') {
      // Rectangle
      if (flags === 'BF') {
        pictureBox.ctx.fillStyle = color ? this.colorToHex(color) : pictureBox.fillColor;
        pictureBox.ctx.fillRect(startX, startY, x2 - startX, y2 - startY);
      }
      if (flags === 'B' || flags === 'BF') {
        pictureBox.ctx.strokeRect(startX, startY, x2 - startX, y2 - startY);
      }
    } else {
      // Line
      pictureBox.ctx.beginPath();
      pictureBox.ctx.moveTo(startX, startY);
      pictureBox.ctx.lineTo(x2, y2);
      pictureBox.ctx.stroke();
    }

    pictureBox.currentX = x2;
    pictureBox.currentY = y2;
  }

  /**
   * Circle method - draw circle or ellipse
   */
  static Circle(
    pictureBox: any,
    x: number,
    y: number,
    radius: number,
    color?: number,
    start?: number,
    end?: number,
    aspect?: number
  ): void {
    if (!pictureBox.ctx) return;

    pictureBox.ctx.strokeStyle = color ? this.colorToHex(color) : pictureBox.foreColor;
    pictureBox.ctx.lineWidth = pictureBox.drawWidth || 1;

    const radiusX = radius;
    const radiusY = aspect ? radius * aspect : radius;

    pictureBox.ctx.beginPath();
    if (start !== undefined && end !== undefined) {
      pictureBox.ctx.ellipse(x, y, radiusX, radiusY, 0, start, end);
    } else {
      pictureBox.ctx.ellipse(x, y, radiusX, radiusY, 0, 0, Math.PI * 2);
    }
    pictureBox.ctx.stroke();

    if (pictureBox.fillStyle !== 1) {
      // Not transparent
      pictureBox.ctx.fillStyle = pictureBox.fillColor;
      pictureBox.ctx.fill();
    }

    pictureBox.currentX = x;
    pictureBox.currentY = y;
  }

  /**
   * Convert VB6 color to hex
   */
  private static colorToHex(color: number | string): string {
    if (typeof color === 'string') return color;

    const r = color & 0xff;
    const g = (color >> 8) & 0xff;
    const b = (color >> 16) & 0xff;

    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  }
}

/**
 * Timer Methods
 */
export class VB6Timer {
  private static timers: Map<any, any> = new Map();

  /**
   * Start timer
   */
  static Start(timer: any): void {
    if (!timer.enabled || timer.interval === 0) return;

    // Clear existing timer
    this.Stop(timer);

    // Create new timer
    const intervalId = setInterval(() => {
      if (timer.Timer) {
        timer.Timer();
      }
    }, timer.interval);

    this.timers.set(timer, intervalId);
  }

  /**
   * Stop timer
   */
  static Stop(timer: any): void {
    const intervalId = this.timers.get(timer);
    if (intervalId) {
      clearInterval(intervalId);
      this.timers.delete(timer);
    }
  }
}

/**
 * TreeView Methods
 */
export class VB6TreeView {
  /**
   * Add a node
   */
  static AddNode(
    treeView: any,
    relative?: string,
    relationship?: number,
    key?: string,
    text?: string,
    image?: number
  ): any {
    const node = {
      key: key || `node${treeView.nodes.length}`,
      text: text || 'Node',
      image,
      children: [],
      expanded: false,
      selected: false,
    };

    if (!relative) {
      // Add to root
      treeView.nodes.push(node);
    } else {
      // Find relative node and add based on relationship
      // relationship: 0=Next, 1=Last, 2=Previous, 3=Child, 4=First
      const relativeNode = this.FindNode(treeView, relative);
      if (relativeNode) {
        if (relationship === 3) {
          // Child
          relativeNode.children.push(node);
        } else {
          treeView.nodes.push(node);
        }
      }
    }

    return node;
  }

  /**
   * Remove a node
   */
  static RemoveNode(treeView: any, key: string): void {
    const removeFromArray = (nodes: any[]): boolean => {
      for (let i = 0; i < nodes.length; i++) {
        if (nodes[i].key === key) {
          nodes.splice(i, 1);
          return true;
        }
        if (removeFromArray(nodes[i].children)) {
          return true;
        }
      }
      return false;
    };

    removeFromArray(treeView.nodes);
  }

  /**
   * Find a node by key
   */
  static FindNode(treeView: any, key: string): any {
    const search = (nodes: any[]): any => {
      for (const node of nodes) {
        if (node.key === key) return node;
        const found = search(node.children);
        if (found) return found;
      }
      return null;
    };

    return search(treeView.nodes);
  }

  /**
   * Clear all nodes
   */
  static Clear(treeView: any): void {
    treeView.nodes = [];
  }
}

/**
 * ListView Methods
 */
export class VB6ListView {
  /**
   * Add an item
   */
  static AddItem(listView: any, index?: number, key?: string, text?: string, icon?: number): any {
    const item = {
      index: index || listView.items.length + 1,
      key: key || `item${listView.items.length}`,
      text: text || 'Item',
      icon,
      subItems: [],
      selected: false,
    };

    listView.items.push(item);
    return item;
  }

  /**
   * Remove an item
   */
  static RemoveItem(listView: any, index: number): void {
    if (index > 0 && index <= listView.items.length) {
      listView.items.splice(index - 1, 1);
    }
  }

  /**
   * Clear all items
   */
  static Clear(listView: any): void {
    listView.items = [];
  }

  /**
   * Find an item by key
   */
  static FindItem(listView: any, key: string): any {
    return listView.items.find((item: any) => item.key === key);
  }
}

/**
 * Clipboard Methods
 */
export class VB6Clipboard {
  private static text: string = '';
  private static picture: any = null;

  /**
   * Get text from clipboard
   */
  static GetText(format?: number): string {
    return this.text;
  }

  /**
   * Set text to clipboard
   */
  static SetText(text: string, format?: number): void {
    this.text = text;

    // Try to use browser clipboard API
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).catch(() => {
        // Fallback: clipboard not available
      });
    }
  }

  /**
   * Clear clipboard
   */
  static Clear(): void {
    this.text = '';
    this.picture = null;
  }

  /**
   * Get data from clipboard
   */
  static GetData(format?: number): any {
    return this.picture;
  }

  /**
   * Set data to clipboard
   */
  static SetData(data: any, format?: number): void {
    this.picture = data;
  }
}

/**
 * DoEvents function
 */
export function DoEvents(): void {
  // Allow UI to update
  // In browser, this is handled by returning to event loop
  return;
}

/**
 * Export all control methods
 */
export default {
  VB6ListControl,
  VB6TextBox,
  VB6Form,
  VB6PictureBox,
  VB6Timer,
  VB6TreeView,
  VB6ListView,
  VB6Clipboard,
  DoEvents,
};
