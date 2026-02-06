/**
 * VB6 Printer Type - Interface complète pour les objets imprimante VB6
 */

export class VB6Printer {
  // Propriétés d'identification
  public DeviceName: string;
  public DriverName: string = 'winspool';
  public Port: string = 'USB001';

  // Capacités d'impression
  public ColorMode: number = 1; // 1-Monochrome, 2-Color
  public Copies: number = 1;
  public Duplex: number = 1; // 1-Simplex, 2-Horizontal, 3-Vertical
  public Orientation: number = 1; // 1-Portrait, 2-Landscape
  public PaperBin: number = 1; // 1-Upper tray, 2-Lower tray, etc.
  public PaperSize: number = 1; // 1-Letter, 2-Legal, 3-A4, etc.
  public PrintQuality: number = -3; // -1-Draft, -2-Low, -3-Medium, -4-High

  // Propriétés de page
  public CurrentX: number = 0;
  public CurrentY: number = 0;
  public Height: number = 15840; // Hauteur en twips (11 pouces)
  public Width: number = 12240; // Largeur en twips (8.5 pouces)
  public ScaleLeft: number = 0;
  public ScaleTop: number = 0;
  public ScaleWidth: number = 0;
  public ScaleHeight: number = 0;
  public ScaleMode: number = 1; // 1-Twips

  // Zone imprimable
  public TwipsPerPixelX: number = 15;
  public TwipsPerPixelY: number = 15;
  public Zoom: number = 100;

  // Propriétés de police
  public Font: {
    Name: string;
    Size: number;
    Bold: boolean;
    Italic: boolean;
    Underline: boolean;
    Strikethrough: boolean;
  } = {
    Name: 'MS Sans Serif',
    Size: 8,
    Bold: false,
    Italic: false,
    Underline: false,
    Strikethrough: false,
  };

  public FontTransparent: boolean = true;
  public ForeColor: string = '#000000';

  // Propriétés de dessin
  public DrawMode: number = 13; // 13-Copy Pen
  public DrawStyle: number = 0; // 0-Solid
  public DrawWidth: number = 1;
  public FillColor: string = '#000000';
  public FillStyle: number = 1; // 1-Transparent

  // Handles système
  public hDC: number = 0;

  // État
  public Page: number = 0;
  private _trackDefault: boolean = false;

  constructor(
    deviceName: string,
    public Available: boolean = true,
    public Default: boolean = false
  ) {
    this.DeviceName = deviceName;
    this._trackDefault = Default;

    // Simuler un handle DC
    this.hDC = Math.floor(Math.random() * 10000) + 1000;
  }

  // Propriété TrackDefault
  get TrackDefault(): boolean {
    return this._trackDefault;
  }

  set TrackDefault(value: boolean) {
    this._trackDefault = value;
  }

  // Méthodes d'impression VB6

  /**
   * Démarre une nouvelle page
   */
  NewPage(): void {
    this.Page++;
    this.CurrentX = 0;
    this.CurrentY = 0;

    // Simuler l'impression dans le navigateur
    if (typeof window !== 'undefined') {
      // noop
    }
  }

  /**
   * Termine l'impression et envoie à l'imprimante
   */
  EndDoc(): void {
    // Simuler la fin de document
    if (typeof window !== 'undefined') {
      // Dans un navigateur réel, ouvrir la boîte de dialogue d'impression
      if (this.Page > 0) {
        setTimeout(() => {
          try {
            window.print();
          } catch (e) {
            console.error('Print failed:', e);
          }
        }, 100);
      }
    }

    this.Page = 0;
    this.CurrentX = 0;
    this.CurrentY = 0;
  }

  /**
   * Annule l'impression en cours
   */
  KillDoc(): void {
    this.Page = 0;
    this.CurrentX = 0;
    this.CurrentY = 0;

    if (typeof window !== 'undefined') {
      // noop
    }
  }

  /**
   * Imprime du texte à la position courante
   */
  Print(text: string): void {
    if (typeof window !== 'undefined') {
      // noop
    }

    // Avancer CurrentY pour la ligne suivante (approximation)
    this.CurrentY += this.Font.Size * 20; // Approximation en twips
  }

  /**
   * Dessine une ligne
   */
  Line(x1?: number, y1?: number, x2?: number, y2?: number, color?: string): void {
    const startX = x1 !== undefined ? x1 : this.CurrentX;
    const startY = y1 !== undefined ? y1 : this.CurrentY;
    const endX = x2 !== undefined ? x2 : this.CurrentX;
    const endY = y2 !== undefined ? y2 : this.CurrentY;

    if (typeof window !== 'undefined') {
      // noop
    }

    this.CurrentX = endX;
    this.CurrentY = endY;
  }

  /**
   * Dessine un cercle
   */
  Circle(
    x: number,
    y: number,
    radius: number,
    color?: string,
    start?: number,
    end?: number,
    aspect?: number
  ): void {
    if (typeof window !== 'undefined') {
      // noop
    }

    this.CurrentX = x;
    this.CurrentY = y;
  }

  /**
   * Définit un pixel
   */
  PSet(x: number, y: number, color?: string): void {
    if (typeof window !== 'undefined') {
      // noop
    }

    this.CurrentX = x;
    this.CurrentY = y;
  }

  /**
   * Convertit les coordonnées d'échelle
   */
  ScaleX(value: number, fromScale: number, toScale: number): number {
    // Conversion simplifiée - dans VB6 réel c'est plus complexe
    const conversionFactor = this.getScaleConversionFactor(fromScale, toScale);
    return value * conversionFactor;
  }

  /**
   * Convertit les coordonnées d'échelle Y
   */
  ScaleY(value: number, fromScale: number, toScale: number): number {
    const conversionFactor = this.getScaleConversionFactor(fromScale, toScale);
    return value * conversionFactor;
  }

  private getScaleConversionFactor(fromScale: number, toScale: number): number {
    // Facteurs de conversion approximatifs entre les différentes unités VB6
    const scaleFactors: { [key: number]: number } = {
      0: 1, // User
      1: 1, // Twips (unité de base)
      2: 20, // Points
      3: 15, // Pixels
      4: 1440, // Caractères
      5: 1440, // Pouces
      6: 567, // Millimètres
      7: 56.7, // Centimètres
    };

    const fromFactor = scaleFactors[fromScale] || 1;
    const toFactor = scaleFactors[toScale] || 1;

    return fromFactor / toFactor;
  }

  /**
   * Obtient la largeur du texte
   */
  TextWidth(text: string): number {
    // Approximation basée sur la police
    const avgCharWidth = this.Font.Size * 0.6; // Approximation
    return text.length * avgCharWidth * 20; // Conversion en twips
  }

  /**
   * Obtient la hauteur du texte
   */
  TextHeight(text: string): number {
    return this.Font.Size * 20; // Conversion en twips
  }
}
