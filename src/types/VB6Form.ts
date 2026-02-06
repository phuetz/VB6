/**
 * VB6 Form Type - Interface complète pour les formulaires VB6
 */

import { VB6ControlPropsEnhanced } from '../components/Controls/VB6ControlsEnhanced';

export interface VB6Form {
  // Propriétés d'identification
  Name: string;
  Caption: string;
  Index?: number;
  Tag: string;

  // Position et taille
  Left: number;
  Top: number;
  Width: number;
  Height: number;
  ScaleLeft: number;
  ScaleTop: number;
  ScaleWidth: number;
  ScaleHeight: number;
  ScaleMode: number; // 0-User, 1-Twips, 2-Points, 3-Pixels, etc.

  // État de la fenêtre
  WindowState: number; // 0-Normal, 1-Minimized, 2-Maximized
  Visible: boolean;
  Enabled: boolean;

  // Apparence
  BackColor: string;
  ForeColor: string;
  Picture?: string;
  Icon?: string;
  Font: {
    Name: string;
    Size: number;
    Bold: boolean;
    Italic: boolean;
    Underline: boolean;
    Strikethrough: boolean;
  };

  // Bordure et contrôles
  BorderStyle: number; // 0-None, 1-Fixed Single, 2-Sizable, 3-Fixed Dialog, etc.
  ControlBox: boolean;
  MaxButton: boolean;
  MinButton: boolean;
  Moveable: boolean;
  ShowInTaskbar: boolean;

  // Position de démarrage
  StartUpPosition: number; // 0-Manual, 1-CenterOwner, 2-CenterScreen, 3-Windows Default

  // MDI
  MDIChild: boolean;

  // Dessin
  AutoRedraw: boolean;
  ClipControls: boolean;
  DrawMode: number;
  DrawStyle: number;
  DrawWidth: number;
  FillColor: string;
  FillStyle: number;

  // Police et transparence
  FontTransparent: boolean;

  // Handles système
  hWnd: number;
  hDC: number;
  HasDC: boolean;

  // Position du curseur de dessin
  CurrentX: number;
  CurrentY: number;

  // Liens DDE
  LinkMode: number;
  LinkTopic: string;

  // Menu
  NegotiateMenus: boolean;

  // OLE
  OLEDropMode: number;

  // Palette
  Palette?: string;
  PaletteMode: number;

  // Autres
  WhatsThisButton: boolean;
  WhatsThisHelp: boolean;
  KeyPreview: boolean;
  RightToLeft: boolean;

  // Collections
  Controls: VB6ControlPropsEnhanced[];

  // Méthodes VB6
  Show(modal?: boolean): void;
  Hide(): void;
  Load(): void;
  Unload(): void;
  SetFocus(): void;
  Move(left?: number, top?: number, width?: number, height?: number): void;
  Refresh(): void;
  Cls(): void;

  // Méthodes de dessin
  Line(x1: number, y1: number, x2: number, y2: number, color?: string): void;
  Circle(
    x: number,
    y: number,
    radius: number,
    color?: string,
    start?: number,
    end?: number,
    aspect?: number
  ): void;
  PSet(x: number, y: number, color?: string): void;
  Point(x: number, y: number): string;
  Print(text: string): void;
  PaintPicture(picture: string, x: number, y: number, width?: number, height?: number): void;

  // Méthodes de coordonnées
  ScaleX(value: number, fromScale: number, toScale: number): number;
  ScaleY(value: number, fromScale: number, toScale: number): number;

  // Événements (signatures)
  onLoad?: () => void;
  onUnload?: (cancel: { value: boolean }) => void;
  onActivate?: () => void;
  onDeactivate?: () => void;
  onResize?: () => void;
  onPaint?: () => void;
  onQueryUnload?: (unloadMode: number, cancel: { value: boolean }) => void;
  onTerminate?: () => void;
  onInitialize?: () => void;
  onClick?: () => void;
  onDblClick?: () => void;
  onMouseDown?: (button: number, shift: number, x: number, y: number) => void;
  onMouseMove?: (button: number, shift: number, x: number, y: number) => void;
  onMouseUp?: (button: number, shift: number, x: number, y: number) => void;
  onKeyDown?: (keyCode: { value: number }, shift: number) => void;
  onKeyPress?: (keyAscii: { value: number }) => void;
  onKeyUp?: (keyCode: { value: number }, shift: number) => void;
}
