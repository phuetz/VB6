/**
 * Propriétés VB6 complètes et exhaustives pour TOUS les contrôles
 * Assure une compatibilité 100% avec Visual Basic 6.0
 */

export interface VB6PropertyDefinition {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'color' | 'font' | 'picture' | 'enum' | 'object' | 'array' | 'currency' | 'date' | 'variant';
  defaultValue: any;
  enumValues?: string[];
  description?: string;
  category?: string;
  readOnly?: boolean;
  designTime?: boolean;
  runtime?: boolean;
  hidden?: boolean;
}

// Propriétés communes étendues avec TOUTES les propriétés VB6
export const VB6_COMMON_PROPERTIES: VB6PropertyDefinition[] = [
  // Identification
  { name: 'Name', type: 'string', defaultValue: '', description: 'Nom du contrôle', category: 'Misc', designTime: true },
  { name: 'Index', type: 'number', defaultValue: null, description: 'Index dans un tableau de contrôles', category: 'Misc', designTime: true },
  
  // Position et taille
  { name: 'Left', type: 'number', defaultValue: 0, description: 'Position horizontale', category: 'Position' },
  { name: 'Top', type: 'number', defaultValue: 0, description: 'Position verticale', category: 'Position' },
  { name: 'Width', type: 'number', defaultValue: 100, description: 'Largeur', category: 'Position' },
  { name: 'Height', type: 'number', defaultValue: 100, description: 'Hauteur', category: 'Position' },
  
  // Comportement
  { name: 'Visible', type: 'boolean', defaultValue: true, description: 'Visibilité', category: 'Behavior' },
  { name: 'Enabled', type: 'boolean', defaultValue: true, description: 'Activé', category: 'Behavior' },
  { name: 'TabStop', type: 'boolean', defaultValue: true, description: 'Arrêt de tabulation', category: 'Behavior' },
  { name: 'TabIndex', type: 'number', defaultValue: 0, description: 'Index de tabulation', category: 'Behavior' },
  { name: 'CausesValidation', type: 'boolean', defaultValue: true, description: 'Cause la validation', category: 'Behavior' },
  
  // Données utilisateur
  { name: 'Tag', type: 'string', defaultValue: '', description: 'Données utilisateur', category: 'Misc' },
  { name: 'ToolTipText', type: 'string', defaultValue: '', description: 'Texte d\'info-bulle', category: 'Misc' },
  
  // Aide
  { name: 'HelpContextID', type: 'number', defaultValue: 0, description: 'ID du contexte d\'aide', category: 'Misc' },
  { name: 'WhatsThisHelpID', type: 'number', defaultValue: 0, description: 'ID de l\'aide contextuelle', category: 'Misc' },
  
  // Drag & Drop
  { name: 'DragMode', type: 'enum', defaultValue: 0, enumValues: ['0 - Manual', '1 - Automatic'], description: 'Mode de glissement', category: 'Behavior' },
  { name: 'DragIcon', type: 'picture', defaultValue: null, description: 'Icône de glissement', category: 'Appearance' },
  
  // OLE Drag & Drop
  { name: 'OLEDragMode', type: 'enum', defaultValue: 0, enumValues: ['0 - Manual', '1 - Automatic'], description: 'Mode OLE drag', category: 'OLE' },
  { name: 'OLEDropMode', type: 'enum', defaultValue: 0, enumValues: ['0 - None', '1 - Manual'], description: 'Mode OLE drop', category: 'OLE' },
  
  // Souris
  { name: 'MousePointer', type: 'enum', defaultValue: 0, enumValues: ['0 - Default', '1 - Arrow', '2 - Cross', '3 - I-Beam', '4 - Icon', '5 - Size', '6 - Size NE SW', '7 - Size N S', '8 - Size NW SE', '9 - Size W E', '10 - Up Arrow', '11 - Hourglass', '12 - No Drop', '13 - Arrow and Hourglass', '14 - Arrow and Question', '15 - Size All', '99 - Custom'], description: 'Pointeur de souris', category: 'Misc' },
  { name: 'MouseIcon', type: 'picture', defaultValue: null, description: 'Icône de souris personnalisée', category: 'Misc' },
  
  // Relations
  { name: 'Container', type: 'object', defaultValue: null, description: 'Conteneur parent', category: 'Misc', readOnly: true },
  { name: 'Parent', type: 'object', defaultValue: null, description: 'Parent du contrôle', category: 'Misc', readOnly: true },
  
  // Autres
  { name: 'RightToLeft', type: 'boolean', defaultValue: false, description: 'Lecture de droite à gauche', category: 'Behavior' },
  { name: 'DataBindings', type: 'object', defaultValue: null, description: 'Liaisons de données', category: 'Data' },
  { name: 'DataChanged', type: 'boolean', defaultValue: false, description: 'Données modifiées', category: 'Data' },
  { name: 'DataField', type: 'string', defaultValue: '', description: 'Champ de données', category: 'Data' },
  { name: 'DataFormat', type: 'object', defaultValue: null, description: 'Format de données', category: 'Data' },
  { name: 'DataMember', type: 'string', defaultValue: '', description: 'Membre de données', category: 'Data' },
  { name: 'DataSource', type: 'object', defaultValue: null, description: 'Source de données', category: 'Data' },
];

// Propriétés complètes pour TOUS les contrôles VB6
export const VB6_COMPLETE_PROPERTIES: { [key: string]: VB6PropertyDefinition[] } = {
  // Form
  Form: [
    { name: 'Caption', type: 'string', defaultValue: 'Form1', description: 'Titre de la fenêtre', category: 'Appearance' },
    { name: 'BorderStyle', type: 'enum', defaultValue: 2, enumValues: ['0 - None', '1 - Fixed Single', '2 - Sizable', '3 - Fixed Dialog', '4 - Fixed ToolWindow', '5 - Sizable ToolWindow'], description: 'Style de bordure', category: 'Appearance' },
    { name: 'BackColor', type: 'color', defaultValue: '#8080FF', description: 'Couleur de fond', category: 'Appearance' },
    { name: 'ForeColor', type: 'color', defaultValue: '#000000', description: 'Couleur du texte', category: 'Appearance' },
    { name: 'Picture', type: 'picture', defaultValue: null, description: 'Image de fond', category: 'Appearance' },
    { name: 'Icon', type: 'picture', defaultValue: null, description: 'Icône de la fenêtre', category: 'Appearance' },
    { name: 'WindowState', type: 'enum', defaultValue: 0, enumValues: ['0 - Normal', '1 - Minimized', '2 - Maximized'], description: 'État de la fenêtre', category: 'Position' },
    { name: 'StartUpPosition', type: 'enum', defaultValue: 3, enumValues: ['0 - Manual', '1 - CenterOwner', '2 - CenterScreen', '3 - Windows Default'], description: 'Position de démarrage', category: 'Position' },
    { name: 'MDIChild', type: 'boolean', defaultValue: false, description: 'Fenêtre enfant MDI', category: 'Behavior' },
    { name: 'MaxButton', type: 'boolean', defaultValue: true, description: 'Bouton maximiser', category: 'Appearance' },
    { name: 'MinButton', type: 'boolean', defaultValue: true, description: 'Bouton minimiser', category: 'Appearance' },
    { name: 'ControlBox', type: 'boolean', defaultValue: true, description: 'Boîte de contrôle', category: 'Appearance' },
    { name: 'ShowInTaskbar', type: 'boolean', defaultValue: true, description: 'Afficher dans la barre des tâches', category: 'Appearance' },
    { name: 'Moveable', type: 'boolean', defaultValue: true, description: 'Déplaçable', category: 'Behavior' },
    { name: 'AutoRedraw', type: 'boolean', defaultValue: false, description: 'Redessiner automatiquement', category: 'Behavior' },
    { name: 'ClipControls', type: 'boolean', defaultValue: true, description: 'Découper les contrôles', category: 'Behavior' },
    { name: 'DrawMode', type: 'enum', defaultValue: 13, enumValues: ['1 - Blackness', '2 - Not Merge Pen', '3 - Mask Not Pen', '4 - Not Copy Pen', '5 - Mask Pen Not', '6 - Invert', '7 - Xor Pen', '8 - Not Mask Pen', '9 - Mask Pen', '10 - Not Xor Pen', '11 - Nop', '12 - Merge Not Pen', '13 - Copy Pen', '14 - Merge Pen Not', '15 - Merge Pen', '16 - Whiteness'], description: 'Mode de dessin', category: 'Misc' },
    { name: 'DrawStyle', type: 'enum', defaultValue: 0, enumValues: ['0 - Solid', '1 - Dash', '2 - Dot', '3 - Dash-Dot', '4 - Dash-Dot-Dot', '5 - Transparent', '6 - Inside Solid'], description: 'Style de dessin', category: 'Misc' },
    { name: 'DrawWidth', type: 'number', defaultValue: 1, description: 'Largeur de dessin', category: 'Misc' },
    { name: 'FillColor', type: 'color', defaultValue: '#000000', description: 'Couleur de remplissage', category: 'Misc' },
    { name: 'FillStyle', type: 'enum', defaultValue: 1, enumValues: ['0 - Solid', '1 - Transparent', '2 - Horizontal Line', '3 - Vertical Line', '4 - Upward Diagonal', '5 - Downward Diagonal', '6 - Cross', '7 - Diagonal Cross'], description: 'Style de remplissage', category: 'Misc' },
    { name: 'Font', type: 'font', defaultValue: { name: 'MS Sans Serif', size: 8, bold: false, italic: false, underline: false, strikethrough: false }, description: 'Police', category: 'Font' },
    { name: 'FontTransparent', type: 'boolean', defaultValue: true, description: 'Police transparente', category: 'Font' },
    { name: 'HasDC', type: 'boolean', defaultValue: true, description: 'A un contexte de périphérique', category: 'Misc', readOnly: true },
    { name: 'hDC', type: 'number', defaultValue: 0, description: 'Handle du contexte de périphérique', category: 'Misc', readOnly: true },
    { name: 'hWnd', type: 'number', defaultValue: 0, description: 'Handle de la fenêtre', category: 'Misc', readOnly: true },
    { name: 'Image', type: 'picture', defaultValue: null, description: 'Image persistante', category: 'Misc', readOnly: true },
    { name: 'KeyPreview', type: 'boolean', defaultValue: false, description: 'Aperçu des touches', category: 'Behavior' },
    { name: 'LinkMode', type: 'enum', defaultValue: 0, enumValues: ['0 - None', '1 - Source'], description: 'Mode de liaison', category: 'DDE' },
    { name: 'LinkTopic', type: 'string', defaultValue: '', description: 'Sujet de liaison', category: 'DDE' },
    { name: 'NegotiateMenus', type: 'boolean', defaultValue: true, description: 'Négocier les menus', category: 'OLE' },
    { name: 'OLEDropMode', type: 'enum', defaultValue: 0, enumValues: ['0 - None', '1 - Manual'], description: 'Mode OLE drop', category: 'OLE' },
    { name: 'PaintPicture', type: 'object', defaultValue: null, description: 'Image de peinture', category: 'Misc', hidden: true },
    { name: 'Palette', type: 'picture', defaultValue: null, description: 'Palette', category: 'Appearance' },
    { name: 'PaletteMode', type: 'enum', defaultValue: 0, enumValues: ['0 - Halftone', '1 - UseZOrder', '2 - Custom'], description: 'Mode de palette', category: 'Appearance' },
    { name: 'ScaleMode', type: 'enum', defaultValue: 1, enumValues: ['0 - User', '1 - Twips', '2 - Points', '3 - Pixels', '4 - Characters', '5 - Inches', '6 - Millimeters', '7 - Centimeters'], description: 'Mode d\'échelle', category: 'Scale' },
    { name: 'ScaleLeft', type: 'number', defaultValue: 0, description: 'Échelle gauche', category: 'Scale' },
    { name: 'ScaleTop', type: 'number', defaultValue: 0, description: 'Échelle haut', category: 'Scale' },
    { name: 'ScaleWidth', type: 'number', defaultValue: 0, description: 'Largeur d\'échelle', category: 'Scale' },
    { name: 'ScaleHeight', type: 'number', defaultValue: 0, description: 'Hauteur d\'échelle', category: 'Scale' },
  ],

  // CommandButton avec TOUTES les propriétés
  CommandButton: [
    { name: 'Caption', type: 'string', defaultValue: 'Command1', description: 'Texte du bouton', category: 'Appearance' },
    { name: 'Default', type: 'boolean', defaultValue: false, description: 'Bouton par défaut', category: 'Behavior' },
    { name: 'Cancel', type: 'boolean', defaultValue: false, description: 'Bouton d\'annulation', category: 'Behavior' },
    { name: 'Style', type: 'enum', defaultValue: 0, enumValues: ['0 - Standard', '1 - Graphical'], description: 'Style du bouton', category: 'Appearance' },
    { name: 'Picture', type: 'picture', defaultValue: null, description: 'Image du bouton', category: 'Appearance' },
    { name: 'DisabledPicture', type: 'picture', defaultValue: null, description: 'Image désactivée', category: 'Appearance' },
    { name: 'DownPicture', type: 'picture', defaultValue: null, description: 'Image enfoncée', category: 'Appearance' },
    { name: 'MaskColor', type: 'color', defaultValue: '#C0C0C0', description: 'Couleur de masque', category: 'Appearance' },
    { name: 'UseMaskColor', type: 'boolean', defaultValue: false, description: 'Utiliser la couleur de masque', category: 'Appearance' },
    { name: 'BackColor', type: 'color', defaultValue: '#8080FF', description: 'Couleur de fond', category: 'Appearance' },
    { name: 'ForeColor', type: 'color', defaultValue: '#000000', description: 'Couleur du texte', category: 'Appearance' },
    { name: 'Font', type: 'font', defaultValue: { name: 'MS Sans Serif', size: 8, bold: false, italic: false, underline: false, strikethrough: false }, description: 'Police', category: 'Font' },
    { name: 'Value', type: 'boolean', defaultValue: false, description: 'État du bouton', category: 'Misc', hidden: true },
    { name: 'Appearance', type: 'enum', defaultValue: 1, enumValues: ['0 - Flat', '1 - 3D'], description: 'Apparence', category: 'Appearance' },
    { name: 'hWnd', type: 'number', defaultValue: 0, description: 'Handle de la fenêtre', category: 'Misc', readOnly: true },
  ],

  // TextBox avec TOUTES les propriétés
  TextBox: [
    { name: 'Text', type: 'string', defaultValue: '', description: 'Contenu du texte', category: 'Appearance' },
    { name: 'MaxLength', type: 'number', defaultValue: 0, description: 'Longueur maximale', category: 'Behavior' },
    { name: 'MultiLine', type: 'boolean', defaultValue: false, description: 'Multiligne', category: 'Behavior' },
    { name: 'ScrollBars', type: 'enum', defaultValue: 0, enumValues: ['0 - None', '1 - Horizontal', '2 - Vertical', '3 - Both'], description: 'Barres de défilement', category: 'Appearance' },
    { name: 'PasswordChar', type: 'string', defaultValue: '', description: 'Caractère de mot de passe', category: 'Behavior' },
    { name: 'Locked', type: 'boolean', defaultValue: false, description: 'Verrouillé', category: 'Behavior' },
    { name: 'HideSelection', type: 'boolean', defaultValue: true, description: 'Masquer la sélection', category: 'Behavior' },
    { name: 'BackColor', type: 'color', defaultValue: '#FFFFFF', description: 'Couleur de fond', category: 'Appearance' },
    { name: 'ForeColor', type: 'color', defaultValue: '#000000', description: 'Couleur du texte', category: 'Appearance' },
    { name: 'Font', type: 'font', defaultValue: { name: 'MS Sans Serif', size: 8, bold: false, italic: false, underline: false, strikethrough: false }, description: 'Police', category: 'Font' },
    { name: 'Alignment', type: 'enum', defaultValue: 0, enumValues: ['0 - Left Justify', '1 - Right Justify', '2 - Center'], description: 'Alignement', category: 'Appearance' },
    { name: 'BorderStyle', type: 'enum', defaultValue: 1, enumValues: ['0 - None', '1 - Fixed Single'], description: 'Style de bordure', category: 'Appearance' },
    { name: 'Appearance', type: 'enum', defaultValue: 1, enumValues: ['0 - Flat', '1 - 3D'], description: 'Apparence', category: 'Appearance' },
    { name: 'LinkMode', type: 'enum', defaultValue: 0, enumValues: ['0 - None', '1 - Automatic', '2 - Manual', '3 - Notify'], description: 'Mode de liaison', category: 'DDE' },
    { name: 'LinkTopic', type: 'string', defaultValue: '', description: 'Sujet de liaison', category: 'DDE' },
    { name: 'LinkItem', type: 'string', defaultValue: '', description: 'Élément de liaison', category: 'DDE' },
    { name: 'LinkTimeout', type: 'number', defaultValue: 50, description: 'Timeout de liaison', category: 'DDE' },
    { name: 'SelStart', type: 'number', defaultValue: 0, description: 'Début de sélection', category: 'Misc', runtime: true },
    { name: 'SelLength', type: 'number', defaultValue: 0, description: 'Longueur de sélection', category: 'Misc', runtime: true },
    { name: 'SelText', type: 'string', defaultValue: '', description: 'Texte sélectionné', category: 'Misc', runtime: true },
    { name: 'hWnd', type: 'number', defaultValue: 0, description: 'Handle de la fenêtre', category: 'Misc', readOnly: true },
  ],

  // Label avec TOUTES les propriétés
  Label: [
    { name: 'Caption', type: 'string', defaultValue: 'Label1', description: 'Texte de l\'étiquette', category: 'Appearance' },
    { name: 'AutoSize', type: 'boolean', defaultValue: false, description: 'Taille automatique', category: 'Behavior' },
    { name: 'WordWrap', type: 'boolean', defaultValue: false, description: 'Retour à la ligne', category: 'Behavior' },
    { name: 'BackStyle', type: 'enum', defaultValue: 1, enumValues: ['0 - Transparent', '1 - Opaque'], description: 'Style de fond', category: 'Appearance' },
    { name: 'BackColor', type: 'color', defaultValue: '#8080FF', description: 'Couleur de fond', category: 'Appearance' },
    { name: 'ForeColor', type: 'color', defaultValue: '#000000', description: 'Couleur du texte', category: 'Appearance' },
    { name: 'Font', type: 'font', defaultValue: { name: 'MS Sans Serif', size: 8, bold: false, italic: false, underline: false, strikethrough: false }, description: 'Police', category: 'Font' },
    { name: 'Alignment', type: 'enum', defaultValue: 0, enumValues: ['0 - Left Justify', '1 - Right Justify', '2 - Center'], description: 'Alignement', category: 'Appearance' },
    { name: 'BorderStyle', type: 'enum', defaultValue: 0, enumValues: ['0 - None', '1 - Fixed Single'], description: 'Style de bordure', category: 'Appearance' },
    { name: 'Appearance', type: 'enum', defaultValue: 1, enumValues: ['0 - Flat', '1 - 3D'], description: 'Apparence', category: 'Appearance' },
    { name: 'UseMnemonic', type: 'boolean', defaultValue: true, description: 'Utiliser les mnémoniques', category: 'Behavior' },
    { name: 'LinkMode', type: 'enum', defaultValue: 0, enumValues: ['0 - None', '1 - Automatic', '2 - Manual', '3 - Notify'], description: 'Mode de liaison', category: 'DDE' },
    { name: 'LinkTopic', type: 'string', defaultValue: '', description: 'Sujet de liaison', category: 'DDE' },
    { name: 'LinkItem', type: 'string', defaultValue: '', description: 'Élément de liaison', category: 'DDE' },
    { name: 'LinkTimeout', type: 'number', defaultValue: 50, description: 'Timeout de liaison', category: 'DDE' },
  ],

  // CheckBox avec TOUTES les propriétés
  CheckBox: [
    { name: 'Caption', type: 'string', defaultValue: 'Check1', description: 'Texte de la case', category: 'Appearance' },
    { name: 'Value', type: 'enum', defaultValue: 0, enumValues: ['0 - Unchecked', '1 - Checked', '2 - Grayed'], description: 'État de la case', category: 'Misc' },
    { name: 'Style', type: 'enum', defaultValue: 0, enumValues: ['0 - Standard', '1 - Graphical'], description: 'Style de la case', category: 'Appearance' },
    { name: 'Picture', type: 'picture', defaultValue: null, description: 'Image de la case', category: 'Appearance' },
    { name: 'DisabledPicture', type: 'picture', defaultValue: null, description: 'Image désactivée', category: 'Appearance' },
    { name: 'DownPicture', type: 'picture', defaultValue: null, description: 'Image enfoncée', category: 'Appearance' },
    { name: 'MaskColor', type: 'color', defaultValue: '#C0C0C0', description: 'Couleur de masque', category: 'Appearance' },
    { name: 'UseMaskColor', type: 'boolean', defaultValue: false, description: 'Utiliser la couleur de masque', category: 'Appearance' },
    { name: 'BackColor', type: 'color', defaultValue: '#8080FF', description: 'Couleur de fond', category: 'Appearance' },
    { name: 'ForeColor', type: 'color', defaultValue: '#000000', description: 'Couleur du texte', category: 'Appearance' },
    { name: 'Font', type: 'font', defaultValue: { name: 'MS Sans Serif', size: 8, bold: false, italic: false, underline: false, strikethrough: false }, description: 'Police', category: 'Font' },
    { name: 'Alignment', type: 'enum', defaultValue: 0, enumValues: ['0 - Left Justify', '1 - Right Justify'], description: 'Alignement', category: 'Appearance' },
    { name: 'Appearance', type: 'enum', defaultValue: 1, enumValues: ['0 - Flat', '1 - 3D'], description: 'Apparence', category: 'Appearance' },
    { name: 'hWnd', type: 'number', defaultValue: 0, description: 'Handle de la fenêtre', category: 'Misc', readOnly: true },
  ],

  // OptionButton avec TOUTES les propriétés
  OptionButton: [
    { name: 'Caption', type: 'string', defaultValue: 'Option1', description: 'Texte du bouton radio', category: 'Appearance' },
    { name: 'Value', type: 'boolean', defaultValue: false, description: 'État du bouton', category: 'Misc' },
    { name: 'Style', type: 'enum', defaultValue: 0, enumValues: ['0 - Standard', '1 - Graphical'], description: 'Style du bouton', category: 'Appearance' },
    { name: 'Picture', type: 'picture', defaultValue: null, description: 'Image du bouton', category: 'Appearance' },
    { name: 'DisabledPicture', type: 'picture', defaultValue: null, description: 'Image désactivée', category: 'Appearance' },
    { name: 'DownPicture', type: 'picture', defaultValue: null, description: 'Image enfoncée', category: 'Appearance' },
    { name: 'MaskColor', type: 'color', defaultValue: '#C0C0C0', description: 'Couleur de masque', category: 'Appearance' },
    { name: 'UseMaskColor', type: 'boolean', defaultValue: false, description: 'Utiliser la couleur de masque', category: 'Appearance' },
    { name: 'BackColor', type: 'color', defaultValue: '#8080FF', description: 'Couleur de fond', category: 'Appearance' },
    { name: 'ForeColor', type: 'color', defaultValue: '#000000', description: 'Couleur du texte', category: 'Appearance' },
    { name: 'Font', type: 'font', defaultValue: { name: 'MS Sans Serif', size: 8, bold: false, italic: false, underline: false, strikethrough: false }, description: 'Police', category: 'Font' },
    { name: 'Alignment', type: 'enum', defaultValue: 0, enumValues: ['0 - Left Justify', '1 - Right Justify'], description: 'Alignement', category: 'Appearance' },
    { name: 'Appearance', type: 'enum', defaultValue: 1, enumValues: ['0 - Flat', '1 - 3D'], description: 'Apparence', category: 'Appearance' },
    { name: 'hWnd', type: 'number', defaultValue: 0, description: 'Handle de la fenêtre', category: 'Misc', readOnly: true },
  ],

  // ListBox avec TOUTES les propriétés
  ListBox: [
    { name: 'List', type: 'array', defaultValue: [], description: 'Liste des éléments', category: 'Data' },
    { name: 'ListIndex', type: 'number', defaultValue: -1, description: 'Index sélectionné', category: 'Data' },
    { name: 'ListCount', type: 'number', defaultValue: 0, description: 'Nombre d\'éléments', category: 'Data', readOnly: true },
    { name: 'Selected', type: 'array', defaultValue: [], description: 'Éléments sélectionnés', category: 'Data' },
    { name: 'MultiSelect', type: 'enum', defaultValue: 0, enumValues: ['0 - None', '1 - Simple', '2 - Extended'], description: 'Multi-sélection', category: 'Behavior' },
    { name: 'Sorted', type: 'boolean', defaultValue: false, description: 'Trié', category: 'Behavior' },
    { name: 'Style', type: 'enum', defaultValue: 0, enumValues: ['0 - Standard', '1 - Checkbox'], description: 'Style de la liste', category: 'Appearance' },
    { name: 'BackColor', type: 'color', defaultValue: '#FFFFFF', description: 'Couleur de fond', category: 'Appearance' },
    { name: 'ForeColor', type: 'color', defaultValue: '#000000', description: 'Couleur du texte', category: 'Appearance' },
    { name: 'Font', type: 'font', defaultValue: { name: 'MS Sans Serif', size: 8, bold: false, italic: false, underline: false, strikethrough: false }, description: 'Police', category: 'Font' },
    { name: 'IntegralHeight', type: 'boolean', defaultValue: true, description: 'Hauteur intégrale', category: 'Behavior' },
    { name: 'ItemData', type: 'array', defaultValue: [], description: 'Données des éléments', category: 'Data' },
    { name: 'Columns', type: 'number', defaultValue: 0, description: 'Nombre de colonnes', category: 'Appearance' },
    { name: 'TopIndex', type: 'number', defaultValue: 0, description: 'Index du premier élément visible', category: 'Misc' },
    { name: 'NewIndex', type: 'number', defaultValue: -1, description: 'Index du nouvel élément', category: 'Misc', readOnly: true },
    { name: 'Text', type: 'string', defaultValue: '', description: 'Texte de l\'élément sélectionné', category: 'Misc', readOnly: true },
    { name: 'Appearance', type: 'enum', defaultValue: 1, enumValues: ['0 - Flat', '1 - 3D'], description: 'Apparence', category: 'Appearance' },
    { name: 'hWnd', type: 'number', defaultValue: 0, description: 'Handle de la fenêtre', category: 'Misc', readOnly: true },
  ],

  // ComboBox avec TOUTES les propriétés
  ComboBox: [
    { name: 'List', type: 'array', defaultValue: [], description: 'Liste des éléments', category: 'Data' },
    { name: 'ListIndex', type: 'number', defaultValue: -1, description: 'Index sélectionné', category: 'Data' },
    { name: 'ListCount', type: 'number', defaultValue: 0, description: 'Nombre d\'éléments', category: 'Data', readOnly: true },
    { name: 'Text', type: 'string', defaultValue: '', description: 'Texte de la zone', category: 'Data' },
    { name: 'Style', type: 'enum', defaultValue: 0, enumValues: ['0 - Dropdown Combo', '1 - Simple Combo', '2 - Dropdown List'], description: 'Style de la combo', category: 'Appearance' },
    { name: 'Sorted', type: 'boolean', defaultValue: false, description: 'Trié', category: 'Behavior' },
    { name: 'BackColor', type: 'color', defaultValue: '#FFFFFF', description: 'Couleur de fond', category: 'Appearance' },
    { name: 'ForeColor', type: 'color', defaultValue: '#000000', description: 'Couleur du texte', category: 'Appearance' },
    { name: 'Font', type: 'font', defaultValue: { name: 'MS Sans Serif', size: 8, bold: false, italic: false, underline: false, strikethrough: false }, description: 'Police', category: 'Font' },
    { name: 'IntegralHeight', type: 'boolean', defaultValue: true, description: 'Hauteur intégrale', category: 'Behavior' },
    { name: 'ItemData', type: 'array', defaultValue: [], description: 'Données des éléments', category: 'Data' },
    { name: 'Locked', type: 'boolean', defaultValue: false, description: 'Verrouillé', category: 'Behavior' },
    { name: 'MaxLength', type: 'number', defaultValue: 0, description: 'Longueur maximale', category: 'Behavior' },
    { name: 'SelStart', type: 'number', defaultValue: 0, description: 'Début de sélection', category: 'Misc', runtime: true },
    { name: 'SelLength', type: 'number', defaultValue: 0, description: 'Longueur de sélection', category: 'Misc', runtime: true },
    { name: 'SelText', type: 'string', defaultValue: '', description: 'Texte sélectionné', category: 'Misc', runtime: true },
    { name: 'TopIndex', type: 'number', defaultValue: 0, description: 'Index du premier élément visible', category: 'Misc' },
    { name: 'NewIndex', type: 'number', defaultValue: -1, description: 'Index du nouvel élément', category: 'Misc', readOnly: true },
    { name: 'Appearance', type: 'enum', defaultValue: 1, enumValues: ['0 - Flat', '1 - 3D'], description: 'Apparence', category: 'Appearance' },
    { name: 'hWnd', type: 'number', defaultValue: 0, description: 'Handle de la fenêtre', category: 'Misc', readOnly: true },
  ],

  // Data Control avec TOUTES les propriétés
  Data: [
    { name: 'Caption', type: 'string', defaultValue: 'Data1', description: 'Titre du contrôle', category: 'Appearance' },
    { name: 'DatabaseName', type: 'string', defaultValue: '', description: 'Nom de la base de données', category: 'Data' },
    { name: 'RecordSource', type: 'string', defaultValue: '', description: 'Source des enregistrements', category: 'Data' },
    { name: 'RecordsetType', type: 'enum', defaultValue: 1, enumValues: ['0 - Table', '1 - Dynaset', '2 - Snapshot'], description: 'Type de recordset', category: 'Data' },
    { name: 'DefaultType', type: 'enum', defaultValue: 2, enumValues: ['1 - UseJet', '2 - UseODBC'], description: 'Type par défaut', category: 'Data' },
    { name: 'DefaultCursorType', type: 'enum', defaultValue: 0, enumValues: ['0 - DefaultCursor', '1 - ODBCCursor', '2 - ServerCursor'], description: 'Type de curseur par défaut', category: 'Data' },
    { name: 'Exclusive', type: 'boolean', defaultValue: false, description: 'Exclusif', category: 'Data' },
    { name: 'ReadOnly', type: 'boolean', defaultValue: false, description: 'Lecture seule', category: 'Data' },
    { name: 'Connect', type: 'string', defaultValue: '', description: 'Chaîne de connexion', category: 'Data' },
    { name: 'Options', type: 'number', defaultValue: 0, description: 'Options', category: 'Data' },
    { name: 'BOFAction', type: 'enum', defaultValue: 0, enumValues: ['0 - MoveFirst', '1 - BOF'], description: 'Action en début de fichier', category: 'Data' },
    { name: 'EOFAction', type: 'enum', defaultValue: 0, enumValues: ['0 - MoveLast', '1 - EOF', '2 - AddNew'], description: 'Action en fin de fichier', category: 'Data' },
    { name: 'BackColor', type: 'color', defaultValue: '#8080FF', description: 'Couleur de fond', category: 'Appearance' },
    { name: 'ForeColor', type: 'color', defaultValue: '#000000', description: 'Couleur du texte', category: 'Appearance' },
    { name: 'Font', type: 'font', defaultValue: { name: 'MS Sans Serif', size: 8, bold: false, italic: false, underline: false, strikethrough: false }, description: 'Police', category: 'Font' },
    { name: 'Appearance', type: 'enum', defaultValue: 1, enumValues: ['0 - Flat', '1 - 3D'], description: 'Apparence', category: 'Appearance' },
    { name: 'Recordset', type: 'object', defaultValue: null, description: 'Objet Recordset', category: 'Data', readOnly: true },
    { name: 'Database', type: 'object', defaultValue: null, description: 'Objet Database', category: 'Data', readOnly: true },
    { name: 'EditMode', type: 'enum', defaultValue: 0, enumValues: ['0 - None', '1 - Edit', '2 - AddNew'], description: 'Mode d\'édition', category: 'Data', readOnly: true },
    { name: 'hWnd', type: 'number', defaultValue: 0, description: 'Handle de la fenêtre', category: 'Misc', readOnly: true },
  ],

  // ADO Data Control
  ADODC: [
    { name: 'Caption', type: 'string', defaultValue: 'ADODC1', description: 'Titre du contrôle', category: 'Appearance' },
    { name: 'ConnectionString', type: 'string', defaultValue: '', description: 'Chaîne de connexion', category: 'Data' },
    { name: 'RecordSource', type: 'string', defaultValue: '', description: 'Source des enregistrements', category: 'Data' },
    { name: 'CommandType', type: 'enum', defaultValue: 8, enumValues: ['1 - adCmdText', '2 - adCmdTable', '4 - adCmdStoredProc', '8 - adCmdUnknown'], description: 'Type de commande', category: 'Data' },
    { name: 'CursorLocation', type: 'enum', defaultValue: 3, enumValues: ['2 - adUseServer', '3 - adUseClient'], description: 'Emplacement du curseur', category: 'Data' },
    { name: 'CursorType', type: 'enum', defaultValue: 1, enumValues: ['0 - adOpenForwardOnly', '1 - adOpenKeyset', '2 - adOpenDynamic', '3 - adOpenStatic'], description: 'Type de curseur', category: 'Data' },
    { name: 'LockType', type: 'enum', defaultValue: 3, enumValues: ['1 - adLockReadOnly', '2 - adLockPessimistic', '3 - adLockOptimistic', '4 - adLockBatchOptimistic'], description: 'Type de verrouillage', category: 'Data' },
    { name: 'MaxRecords', type: 'number', defaultValue: 0, description: 'Nombre maximum d\'enregistrements', category: 'Data' },
    { name: 'Mode', type: 'enum', defaultValue: 0, enumValues: ['0 - adModeUnknown', '1 - adModeRead', '2 - adModeWrite', '3 - adModeReadWrite'], description: 'Mode d\'accès', category: 'Data' },
    { name: 'Orientation', type: 'enum', defaultValue: 0, enumValues: ['0 - adHorizontal', '1 - adVertical'], description: 'Orientation', category: 'Appearance' },
    { name: 'Password', type: 'string', defaultValue: '', description: 'Mot de passe', category: 'Data' },
    { name: 'UserName', type: 'string', defaultValue: '', description: 'Nom d\'utilisateur', category: 'Data' },
    { name: 'BOFAction', type: 'enum', defaultValue: 0, enumValues: ['0 - adDoMoveFirst', '1 - adStayBOF'], description: 'Action en début de fichier', category: 'Data' },
    { name: 'EOFAction', type: 'enum', defaultValue: 0, enumValues: ['0 - adDoMoveLast', '1 - adStayEOF', '2 - adDoAddNew'], description: 'Action en fin de fichier', category: 'Data' },
    { name: 'BackColor', type: 'color', defaultValue: '#8080FF', description: 'Couleur de fond', category: 'Appearance' },
    { name: 'ForeColor', type: 'color', defaultValue: '#000000', description: 'Couleur du texte', category: 'Appearance' },
    { name: 'Font', type: 'font', defaultValue: { name: 'MS Sans Serif', size: 8, bold: false, italic: false, underline: false, strikethrough: false }, description: 'Police', category: 'Font' },
    { name: 'Appearance', type: 'enum', defaultValue: 1, enumValues: ['0 - ad2D', '1 - ad3D'], description: 'Apparence', category: 'Appearance' },
    { name: 'Recordset', type: 'object', defaultValue: null, description: 'Objet Recordset ADO', category: 'Data', readOnly: true },
  ],

  // MSFlexGrid
  MSFlexGrid: [
    { name: 'Rows', type: 'number', defaultValue: 2, description: 'Nombre de lignes', category: 'Grid' },
    { name: 'Cols', type: 'number', defaultValue: 2, description: 'Nombre de colonnes', category: 'Grid' },
    { name: 'FixedRows', type: 'number', defaultValue: 1, description: 'Lignes fixes', category: 'Grid' },
    { name: 'FixedCols', type: 'number', defaultValue: 1, description: 'Colonnes fixes', category: 'Grid' },
    { name: 'Row', type: 'number', defaultValue: 1, description: 'Ligne courante', category: 'Grid' },
    { name: 'Col', type: 'number', defaultValue: 1, description: 'Colonne courante', category: 'Grid' },
    { name: 'RowSel', type: 'number', defaultValue: 1, description: 'Ligne de fin de sélection', category: 'Grid' },
    { name: 'ColSel', type: 'number', defaultValue: 1, description: 'Colonne de fin de sélection', category: 'Grid' },
    { name: 'Text', type: 'string', defaultValue: '', description: 'Texte de la cellule courante', category: 'Grid' },
    { name: 'TextMatrix', type: 'array', defaultValue: [], description: 'Matrice de texte', category: 'Grid' },
    { name: 'GridLines', type: 'enum', defaultValue: 1, enumValues: ['0 - flexGridNone', '1 - flexGridFlat', '2 - flexGridInset', '3 - flexGridRaised'], description: 'Lignes de grille', category: 'Appearance' },
    { name: 'GridLinesFixed', type: 'enum', defaultValue: 2, enumValues: ['0 - flexGridNone', '1 - flexGridFlat', '2 - flexGridInset', '3 - flexGridRaised'], description: 'Lignes de grille fixes', category: 'Appearance' },
    { name: 'GridColor', type: 'color', defaultValue: '#C0C0C0', description: 'Couleur de grille', category: 'Appearance' },
    { name: 'GridColorFixed', type: 'color', defaultValue: '#000000', description: 'Couleur de grille fixe', category: 'Appearance' },
    { name: 'BackColor', type: 'color', defaultValue: '#FFFFFF', description: 'Couleur de fond', category: 'Appearance' },
    { name: 'BackColorFixed', type: 'color', defaultValue: '#8080FF', description: 'Couleur de fond fixe', category: 'Appearance' },
    { name: 'BackColorSel', type: 'color', defaultValue: '#0078D7', description: 'Couleur de fond de sélection', category: 'Appearance' },
    { name: 'BackColorBkg', type: 'color', defaultValue: '#808080', description: 'Couleur de fond d\'arrière-plan', category: 'Appearance' },
    { name: 'ForeColor', type: 'color', defaultValue: '#000000', description: 'Couleur du texte', category: 'Appearance' },
    { name: 'ForeColorFixed', type: 'color', defaultValue: '#000000', description: 'Couleur du texte fixe', category: 'Appearance' },
    { name: 'ForeColorSel', type: 'color', defaultValue: '#FFFFFF', description: 'Couleur du texte de sélection', category: 'Appearance' },
    { name: 'Font', type: 'font', defaultValue: { name: 'MS Sans Serif', size: 8, bold: false, italic: false, underline: false, strikethrough: false }, description: 'Police', category: 'Font' },
    { name: 'AllowBigSelection', type: 'boolean', defaultValue: true, description: 'Permettre grande sélection', category: 'Behavior' },
    { name: 'AllowUserResizing', type: 'enum', defaultValue: 0, enumValues: ['0 - flexResizeNone', '1 - flexResizeColumns', '2 - flexResizeRows', '3 - flexResizeBoth'], description: 'Redimensionnement utilisateur', category: 'Behavior' },
    { name: 'CellAlignment', type: 'enum', defaultValue: 0, enumValues: ['0 - flexAlignLeftTop', '1 - flexAlignLeftCenter', '2 - flexAlignLeftBottom', '3 - flexAlignCenterTop', '4 - flexAlignCenterCenter', '5 - flexAlignCenterBottom', '6 - flexAlignRightTop', '7 - flexAlignRightCenter', '8 - flexAlignRightBottom', '9 - flexAlignGeneral'], description: 'Alignement de cellule', category: 'Appearance' },
    { name: 'RowHeight', type: 'array', defaultValue: [], description: 'Hauteur des lignes', category: 'Grid' },
    { name: 'ColWidth', type: 'array', defaultValue: [], description: 'Largeur des colonnes', category: 'Grid' },
    { name: 'ScrollBars', type: 'enum', defaultValue: 3, enumValues: ['0 - flexScrollBarNone', '1 - flexScrollBarHorizontal', '2 - flexScrollBarVertical', '3 - flexScrollBarBoth'], description: 'Barres de défilement', category: 'Appearance' },
    { name: 'SelectionMode', type: 'enum', defaultValue: 0, enumValues: ['0 - flexSelectionFree', '1 - flexSelectionByRow', '2 - flexSelectionByColumn'], description: 'Mode de sélection', category: 'Behavior' },
    { name: 'HighLight', type: 'enum', defaultValue: 1, enumValues: ['0 - flexHighlightNever', '1 - flexHighlightAlways', '2 - flexHighlightWithFocus'], description: 'Surbrillance', category: 'Appearance' },
    { name: 'FillStyle', type: 'enum', defaultValue: 0, enumValues: ['0 - flexFillSingle', '1 - flexFillRepeat'], description: 'Style de remplissage', category: 'Behavior' },
    { name: 'FocusRect', type: 'enum', defaultValue: 1, enumValues: ['0 - flexFocusNone', '1 - flexFocusLight', '2 - flexFocusHeavy'], description: 'Rectangle de focus', category: 'Appearance' },
    { name: 'Editable', type: 'enum', defaultValue: 0, enumValues: ['0 - flexEDNone', '1 - flexEDKbdMouse', '2 - flexEDKbd'], description: 'Éditable', category: 'Behavior' },
    { name: 'Redraw', type: 'boolean', defaultValue: true, description: 'Redessiner', category: 'Behavior' },
    { name: 'WordWrap', type: 'boolean', defaultValue: false, description: 'Retour à la ligne', category: 'Behavior' },
    { name: 'TextStyle', type: 'enum', defaultValue: 0, enumValues: ['0 - flexTextFlat', '1 - flexTextRaised', '2 - flexTextInset', '3 - flexTextRaisedLight', '4 - flexTextInsetLight'], description: 'Style de texte', category: 'Appearance' },
    { name: 'TextStyleFixed', type: 'enum', defaultValue: 0, enumValues: ['0 - flexTextFlat', '1 - flexTextRaised', '2 - flexTextInset', '3 - flexTextRaisedLight', '4 - flexTextInsetLight'], description: 'Style de texte fixe', category: 'Appearance' },
    { name: 'Sort', type: 'enum', defaultValue: 0, enumValues: ['0 - flexSortNone', '1 - flexSortGenericAscending', '2 - flexSortGenericDescending', '3 - flexSortNumericAscending', '4 - flexSortNumericDescending', '5 - flexSortStringNoCaseAscending', '6 - flexSortStringNoCaseDescending', '7 - flexSortStringAscending', '8 - flexSortStringDescending', '9 - flexSortCustom'], description: 'Type de tri', category: 'Behavior' },
    { name: 'RowHeightMin', type: 'number', defaultValue: 0, description: 'Hauteur minimale de ligne', category: 'Grid' },
    { name: 'ColWidthMin', type: 'number', defaultValue: 0, description: 'Largeur minimale de colonne', category: 'Grid' },
    { name: 'ColWidthMax', type: 'number', defaultValue: 0, description: 'Largeur maximale de colonne', category: 'Grid' },
    { name: 'RowHeightMax', type: 'number', defaultValue: 0, description: 'Hauteur maximale de ligne', category: 'Grid' },
    { name: 'MergeCells', type: 'enum', defaultValue: 0, enumValues: ['0 - flexMergeNever', '1 - flexMergeFree', '2 - flexMergeRestrictRows', '3 - flexMergeRestrictColumns', '4 - flexMergeRestrictAll'], description: 'Fusion de cellules', category: 'Behavior' },
    { name: 'MergeRow', type: 'array', defaultValue: [], description: 'Fusion de lignes', category: 'Grid' },
    { name: 'MergeCol', type: 'array', defaultValue: [], description: 'Fusion de colonnes', category: 'Grid' },
    { name: 'Picture', type: 'picture', defaultValue: null, description: 'Image de fond', category: 'Appearance' },
    { name: 'PictureType', type: 'enum', defaultValue: 0, enumValues: ['0 - flexPicTypeColor', '1 - flexPicTypeMonochrome'], description: 'Type d\'image', category: 'Appearance' },
    { name: 'CellPicture', type: 'picture', defaultValue: null, description: 'Image de cellule', category: 'Appearance' },
    { name: 'CellPictureAlignment', type: 'enum', defaultValue: 0, enumValues: ['0 - flexAlignLeftTop', '1 - flexAlignLeftCenter', '2 - flexAlignLeftBottom', '3 - flexAlignCenterTop', '4 - flexAlignCenterCenter', '5 - flexAlignCenterBottom', '6 - flexAlignRightTop', '7 - flexAlignRightCenter', '8 - flexAlignRightBottom'], description: 'Alignement d\'image de cellule', category: 'Appearance' },
    { name: 'Clip', type: 'string', defaultValue: '', description: 'Presse-papiers', category: 'Data' },
    { name: 'RightToLeft', type: 'boolean', defaultValue: false, description: 'Droite à gauche', category: 'Behavior' },
    { name: 'FormatString', type: 'string', defaultValue: '', description: 'Chaîne de format', category: 'Grid' },
    { name: 'TopRow', type: 'number', defaultValue: 1, description: 'Ligne supérieure visible', category: 'Grid' },
    { name: 'LeftCol', type: 'number', defaultValue: 1, description: 'Colonne gauche visible', category: 'Grid' },
    { name: 'hWnd', type: 'number', defaultValue: 0, description: 'Handle de la fenêtre', category: 'Misc', readOnly: true },
    { name: 'hWndEditor', type: 'number', defaultValue: 0, description: 'Handle de l\'éditeur', category: 'Misc', readOnly: true },
  ],

  // DataGrid
  DataGrid: [
    { name: 'DataSource', type: 'object', defaultValue: null, description: 'Source de données', category: 'Data' },
    { name: 'DataMember', type: 'string', defaultValue: '', description: 'Membre de données', category: 'Data' },
    { name: 'AllowAddNew', type: 'boolean', defaultValue: false, description: 'Permettre l\'ajout', category: 'Behavior' },
    { name: 'AllowArrows', type: 'boolean', defaultValue: true, description: 'Permettre les flèches', category: 'Behavior' },
    { name: 'AllowDelete', type: 'boolean', defaultValue: false, description: 'Permettre la suppression', category: 'Behavior' },
    { name: 'AllowRowSizing', type: 'boolean', defaultValue: true, description: 'Permettre le redimensionnement des lignes', category: 'Behavior' },
    { name: 'AllowUpdate', type: 'boolean', defaultValue: true, description: 'Permettre la mise à jour', category: 'Behavior' },
    { name: 'Appearance', type: 'enum', defaultValue: 1, enumValues: ['0 - dbgFlat', '1 - dbg3D'], description: 'Apparence', category: 'Appearance' },
    { name: 'BackColor', type: 'color', defaultValue: '#FFFFFF', description: 'Couleur de fond', category: 'Appearance' },
    { name: 'BorderStyle', type: 'enum', defaultValue: 1, enumValues: ['0 - dbgNone', '1 - dbgFixedSingle'], description: 'Style de bordure', category: 'Appearance' },
    { name: 'Caption', type: 'string', defaultValue: '', description: 'Titre', category: 'Appearance' },
    { name: 'CaptionHeight', type: 'number', defaultValue: 200, description: 'Hauteur du titre', category: 'Appearance' },
    { name: 'Col', type: 'number', defaultValue: 0, description: 'Colonne courante', category: 'Data' },
    { name: 'ColumnHeaders', type: 'boolean', defaultValue: true, description: 'En-têtes de colonnes', category: 'Appearance' },
    { name: 'Columns', type: 'object', defaultValue: null, description: 'Collection de colonnes', category: 'Data' },
    { name: 'CurrentCellModified', type: 'boolean', defaultValue: false, description: 'Cellule courante modifiée', category: 'Data', readOnly: true },
    { name: 'CurrentCellVisible', type: 'boolean', defaultValue: true, description: 'Cellule courante visible', category: 'Data' },
    { name: 'DataChanged', type: 'boolean', defaultValue: false, description: 'Données modifiées', category: 'Data' },
    { name: 'DefColWidth', type: 'number', defaultValue: 0, description: 'Largeur par défaut des colonnes', category: 'Appearance' },
    { name: 'EditActive', type: 'boolean', defaultValue: false, description: 'Édition active', category: 'Data', readOnly: true },
    { name: 'Font', type: 'font', defaultValue: { name: 'MS Sans Serif', size: 8, bold: false, italic: false, underline: false, strikethrough: false }, description: 'Police', category: 'Font' },
    { name: 'ForeColor', type: 'color', defaultValue: '#000000', description: 'Couleur du texte', category: 'Appearance' },
    { name: 'HeadFont', type: 'font', defaultValue: { name: 'MS Sans Serif', size: 8, bold: false, italic: false, underline: false, strikethrough: false }, description: 'Police des en-têtes', category: 'Font' },
    { name: 'HeadLines', type: 'number', defaultValue: 1, description: 'Lignes d\'en-tête', category: 'Appearance' },
    { name: 'hWndEditor', type: 'number', defaultValue: 0, description: 'Handle de l\'éditeur', category: 'Misc', readOnly: true },
    { name: 'LeftCol', type: 'number', defaultValue: 0, description: 'Colonne gauche', category: 'Data' },
    { name: 'MarqueeStyle', type: 'enum', defaultValue: 6, enumValues: ['0 - dbgDottedCellBorder', '1 - dbgSolidCellBorder', '2 - dbgHighlightCell', '3 - dbgHighlightRow', '4 - dbgHighlightRowRaiseCell', '5 - dbgNoMarquee', '6 - dbgFloatingEditor'], description: 'Style de marquage', category: 'Appearance' },
    { name: 'RecordSelectors', type: 'boolean', defaultValue: true, description: 'Sélecteurs d\'enregistrements', category: 'Appearance' },
    { name: 'Row', type: 'number', defaultValue: 0, description: 'Ligne courante', category: 'Data' },
    { name: 'RowDividerStyle', type: 'enum', defaultValue: 2, enumValues: ['0 - dbgNoDividers', '1 - dbgBlackLine', '2 - dbgDarkGrayLine', '3 - dbgRaised', '4 - dbgInset', '5 - dbgUseForeColor'], description: 'Style de séparateur de lignes', category: 'Appearance' },
    { name: 'RowHeight', type: 'number', defaultValue: 225, description: 'Hauteur des lignes', category: 'Appearance' },
    { name: 'ScrollBars', type: 'enum', defaultValue: 3, enumValues: ['0 - dbgNone', '1 - dbgHorizontal', '2 - dbgVertical', '3 - dbgBoth', '4 - dbgAutomatic'], description: 'Barres de défilement', category: 'Appearance' },
    { name: 'SelEndCol', type: 'number', defaultValue: 0, description: 'Colonne de fin de sélection', category: 'Data', readOnly: true },
    { name: 'SelStartCol', type: 'number', defaultValue: 0, description: 'Colonne de début de sélection', category: 'Data', readOnly: true },
    { name: 'SelBookmarks', type: 'object', defaultValue: null, description: 'Signets de sélection', category: 'Data', readOnly: true },
    { name: 'Splits', type: 'object', defaultValue: null, description: 'Divisions', category: 'Data' },
    { name: 'TabAction', type: 'enum', defaultValue: 0, enumValues: ['0 - dbgControlNavigation', '1 - dbgColumnNavigation', '2 - dbgGridNavigation'], description: 'Action de tabulation', category: 'Behavior' },
    { name: 'TabAcrossSplits', type: 'boolean', defaultValue: false, description: 'Tabulation entre divisions', category: 'Behavior' },
    { name: 'Text', type: 'string', defaultValue: '', description: 'Texte de la cellule courante', category: 'Data' },
    { name: 'VisibleCols', type: 'number', defaultValue: 0, description: 'Colonnes visibles', category: 'Data', readOnly: true },
    { name: 'VisibleRows', type: 'number', defaultValue: 0, description: 'Lignes visibles', category: 'Data', readOnly: true },
    { name: 'WrapCellPointer', type: 'boolean', defaultValue: false, description: 'Retour à la ligne du pointeur', category: 'Behavior' },
    { name: 'hWnd', type: 'number', defaultValue: 0, description: 'Handle de la fenêtre', category: 'Misc', readOnly: true },
  ],

  // DataCombo
  DataCombo: [
    { name: 'BoundColumn', type: 'string', defaultValue: '', description: 'Colonne liée', category: 'Data' },
    { name: 'BoundText', type: 'string', defaultValue: '', description: 'Texte lié', category: 'Data' },
    { name: 'DataBindings', type: 'object', defaultValue: null, description: 'Liaisons de données', category: 'Data' },
    { name: 'DataField', type: 'string', defaultValue: '', description: 'Champ de données', category: 'Data' },
    { name: 'DataMember', type: 'string', defaultValue: '', description: 'Membre de données', category: 'Data' },
    { name: 'DataSource', type: 'object', defaultValue: null, description: 'Source de données', category: 'Data' },
    { name: 'IntegralHeight', type: 'boolean', defaultValue: false, description: 'Hauteur intégrale', category: 'Behavior' },
    { name: 'ListField', type: 'string', defaultValue: '', description: 'Champ de liste', category: 'Data' },
    { name: 'Locked', type: 'boolean', defaultValue: false, description: 'Verrouillé', category: 'Behavior' },
    { name: 'MatchEntry', type: 'enum', defaultValue: 2, enumValues: ['0 - dblBasicMatching', '1 - dblExtendedMatching', '2 - dblNoMatching'], description: 'Correspondance d\'entrée', category: 'Behavior' },
    { name: 'MatchedWithList', type: 'boolean', defaultValue: false, description: 'Correspondance avec la liste', category: 'Data', readOnly: true },
    { name: 'RightToLeft', type: 'boolean', defaultValue: false, description: 'Droite à gauche', category: 'Behavior' },
    { name: 'RowMember', type: 'string', defaultValue: '', description: 'Membre de ligne', category: 'Data' },
    { name: 'RowSource', type: 'object', defaultValue: null, description: 'Source de lignes', category: 'Data' },
    { name: 'SelectedItem', type: 'object', defaultValue: null, description: 'Élément sélectionné', category: 'Data', readOnly: true },
    { name: 'SelLength', type: 'number', defaultValue: 0, description: 'Longueur de sélection', category: 'Misc' },
    { name: 'SelStart', type: 'number', defaultValue: 0, description: 'Début de sélection', category: 'Misc' },
    { name: 'SelText', type: 'string', defaultValue: '', description: 'Texte sélectionné', category: 'Misc' },
    { name: 'Style', type: 'enum', defaultValue: 0, enumValues: ['0 - dbcDropdownCombo', '2 - dbcDropdownList'], description: 'Style', category: 'Appearance' },
    { name: 'Text', type: 'string', defaultValue: '', description: 'Texte', category: 'Data' },
    { name: 'VisibleCount', type: 'number', defaultValue: 8, description: 'Nombre visible', category: 'Appearance' },
    { name: 'VisibleItems', type: 'object', defaultValue: null, description: 'Éléments visibles', category: 'Data', readOnly: true },
    { name: 'BackColor', type: 'color', defaultValue: '#FFFFFF', description: 'Couleur de fond', category: 'Appearance' },
    { name: 'ForeColor', type: 'color', defaultValue: '#000000', description: 'Couleur du texte', category: 'Appearance' },
    { name: 'Font', type: 'font', defaultValue: { name: 'MS Sans Serif', size: 8, bold: false, italic: false, underline: false, strikethrough: false }, description: 'Police', category: 'Font' },
    { name: 'Appearance', type: 'enum', defaultValue: 1, enumValues: ['0 - dbc2D', '1 - dbc3D'], description: 'Apparence', category: 'Appearance' },
    { name: 'hWnd', type: 'number', defaultValue: 0, description: 'Handle de la fenêtre', category: 'Misc', readOnly: true },
  ],

  // DataList
  DataList: [
    { name: 'BoundColumn', type: 'string', defaultValue: '', description: 'Colonne liée', category: 'Data' },
    { name: 'BoundText', type: 'string', defaultValue: '', description: 'Texte lié', category: 'Data' },
    { name: 'DataBindings', type: 'object', defaultValue: null, description: 'Liaisons de données', category: 'Data' },
    { name: 'DataField', type: 'string', defaultValue: '', description: 'Champ de données', category: 'Data' },
    { name: 'DataMember', type: 'string', defaultValue: '', description: 'Membre de données', category: 'Data' },
    { name: 'DataSource', type: 'object', defaultValue: null, description: 'Source de données', category: 'Data' },
    { name: 'IntegralHeight', type: 'boolean', defaultValue: false, description: 'Hauteur intégrale', category: 'Behavior' },
    { name: 'ListField', type: 'string', defaultValue: '', description: 'Champ de liste', category: 'Data' },
    { name: 'Locked', type: 'boolean', defaultValue: false, description: 'Verrouillé', category: 'Behavior' },
    { name: 'MatchEntry', type: 'enum', defaultValue: 2, enumValues: ['0 - dblBasicMatching', '1 - dblExtendedMatching', '2 - dblNoMatching'], description: 'Correspondance d\'entrée', category: 'Behavior' },
    { name: 'MatchedWithList', type: 'boolean', defaultValue: false, description: 'Correspondance avec la liste', category: 'Data', readOnly: true },
    { name: 'RightToLeft', type: 'boolean', defaultValue: false, description: 'Droite à gauche', category: 'Behavior' },
    { name: 'RowMember', type: 'string', defaultValue: '', description: 'Membre de ligne', category: 'Data' },
    { name: 'RowSource', type: 'object', defaultValue: null, description: 'Source de lignes', category: 'Data' },
    { name: 'SelectedItem', type: 'object', defaultValue: null, description: 'Élément sélectionné', category: 'Data', readOnly: true },
    { name: 'Text', type: 'string', defaultValue: '', description: 'Texte', category: 'Data' },
    { name: 'VisibleCount', type: 'number', defaultValue: 8, description: 'Nombre visible', category: 'Appearance' },
    { name: 'VisibleItems', type: 'object', defaultValue: null, description: 'Éléments visibles', category: 'Data', readOnly: true },
    { name: 'BackColor', type: 'color', defaultValue: '#FFFFFF', description: 'Couleur de fond', category: 'Appearance' },
    { name: 'ForeColor', type: 'color', defaultValue: '#000000', description: 'Couleur du texte', category: 'Appearance' },
    { name: 'Font', type: 'font', defaultValue: { name: 'MS Sans Serif', size: 8, bold: false, italic: false, underline: false, strikethrough: false }, description: 'Police', category: 'Font' },
    { name: 'Appearance', type: 'enum', defaultValue: 1, enumValues: ['0 - dbl2D', '1 - dbl3D'], description: 'Apparence', category: 'Appearance' },
    { name: 'hWnd', type: 'number', defaultValue: 0, description: 'Handle de la fenêtre', category: 'Misc', readOnly: true },
  ],

  // CrystalReport
  CrystalReport: [
    { name: 'ReportFileName', type: 'string', defaultValue: '', description: 'Nom du fichier de rapport', category: 'Report' },
    { name: 'ReportSource', type: 'enum', defaultValue: 0, enumValues: ['0 - crptReport', '1 - crptCrystal'], description: 'Source du rapport', category: 'Report' },
    { name: 'Destination', type: 'enum', defaultValue: 0, enumValues: ['0 - crptToWindow', '1 - crptToPrinter', '2 - crptToFile'], description: 'Destination', category: 'Report' },
    { name: 'PrintFileName', type: 'string', defaultValue: '', description: 'Nom du fichier d\'impression', category: 'Report' },
    { name: 'PrintFileType', type: 'enum', defaultValue: 0, enumValues: ['0 - crptRecord', '1 - crptTabSeparated', '2 - crptText', '3 - crptDIF', '4 - crptCSV', '5 - crptTabSeparatedText', '6 - crptLotus123v1', '7 - crptLotus123v2', '8 - crptRTF', '9 - crptExcel21', '10 - crptExcel30', '11 - crptExcel40', '12 - crptExcel50', '13 - crptExcel70', '14 - crptWordForWindows', '15 - crptHTML32Std', '16 - crptExplorer32Ext', '17 - crptNetscape20Std', '18 - crptLotus123v3', '19 - crptPaginatedText', '20 - crptExcel50Tabular', '21 - crptExcel70Tabular', '22 - crptLotusWK3', '23 - crptLotusWK4', '24 - crptQuattroPro5', '25 - crptQuattroPro6', '26 - crptTabbedText', '27 - crptCommaDelimitedText', '28 - crptXML', '29 - crptPDF', '30 - crptExcel80', '31 - crptExcel80Tabular'], description: 'Type de fichier d\'impression', category: 'Report' },
    { name: 'WindowTitle', type: 'string', defaultValue: '', description: 'Titre de la fenêtre', category: 'Report' },
    { name: 'WindowLeft', type: 'number', defaultValue: 0, description: 'Position gauche de la fenêtre', category: 'Report' },
    { name: 'WindowTop', type: 'number', defaultValue: 0, description: 'Position haut de la fenêtre', category: 'Report' },
    { name: 'WindowWidth', type: 'number', defaultValue: 0, description: 'Largeur de la fenêtre', category: 'Report' },
    { name: 'WindowHeight', type: 'number', defaultValue: 0, description: 'Hauteur de la fenêtre', category: 'Report' },
    { name: 'WindowState', type: 'enum', defaultValue: 0, enumValues: ['0 - crptNormal', '1 - crptMinimized', '2 - crptMaximized'], description: 'État de la fenêtre', category: 'Report' },
    { name: 'WindowBorderStyle', type: 'enum', defaultValue: 2, enumValues: ['0 - crptNoBorder', '1 - crptFixedSingle', '2 - crptSizable'], description: 'Style de bordure de la fenêtre', category: 'Report' },
    { name: 'WindowControlBox', type: 'boolean', defaultValue: true, description: 'Boîte de contrôle de la fenêtre', category: 'Report' },
    { name: 'WindowMaxButton', type: 'boolean', defaultValue: true, description: 'Bouton maximiser de la fenêtre', category: 'Report' },
    { name: 'WindowMinButton', type: 'boolean', defaultValue: true, description: 'Bouton minimiser de la fenêtre', category: 'Report' },
    { name: 'WindowShowCloseButton', type: 'boolean', defaultValue: true, description: 'Afficher le bouton fermer', category: 'Report' },
    { name: 'WindowShowNavigationControls', type: 'boolean', defaultValue: true, description: 'Afficher les contrôles de navigation', category: 'Report' },
    { name: 'WindowShowCancelButton', type: 'boolean', defaultValue: true, description: 'Afficher le bouton annuler', category: 'Report' },
    { name: 'WindowShowPrintButton', type: 'boolean', defaultValue: true, description: 'Afficher le bouton imprimer', category: 'Report' },
    { name: 'WindowShowExportButton', type: 'boolean', defaultValue: true, description: 'Afficher le bouton exporter', category: 'Report' },
    { name: 'WindowShowZoomControl', type: 'boolean', defaultValue: true, description: 'Afficher le contrôle de zoom', category: 'Report' },
    { name: 'WindowShowProgressControls', type: 'boolean', defaultValue: true, description: 'Afficher les contrôles de progression', category: 'Report' },
    { name: 'WindowShowSearchButton', type: 'boolean', defaultValue: true, description: 'Afficher le bouton rechercher', category: 'Report' },
    { name: 'WindowShowPrintSetupButton', type: 'boolean', defaultValue: true, description: 'Afficher le bouton de configuration d\'impression', category: 'Report' },
    { name: 'WindowShowRefreshButton', type: 'boolean', defaultValue: true, description: 'Afficher le bouton actualiser', category: 'Report' },
    { name: 'WindowShowGroupTree', type: 'boolean', defaultValue: true, description: 'Afficher l\'arbre de groupes', category: 'Report' },
    { name: 'SelectionFormula', type: 'string', defaultValue: '', description: 'Formule de sélection', category: 'Report' },
    { name: 'GroupSelectionFormula', type: 'string', defaultValue: '', description: 'Formule de sélection de groupe', category: 'Report' },
    { name: 'Formulas', type: 'array', defaultValue: [], description: 'Formules', category: 'Report' },
    { name: 'SortFields', type: 'array', defaultValue: [], description: 'Champs de tri', category: 'Report' },
    { name: 'GroupSortFields', type: 'array', defaultValue: [], description: 'Champs de tri de groupe', category: 'Report' },
    { name: 'SQLQuery', type: 'string', defaultValue: '', description: 'Requête SQL', category: 'Report' },
    { name: 'Connect', type: 'string', defaultValue: '', description: 'Chaîne de connexion', category: 'Report' },
    { name: 'UserName', type: 'string', defaultValue: '', description: 'Nom d\'utilisateur', category: 'Report' },
    { name: 'Password', type: 'string', defaultValue: '', description: 'Mot de passe', category: 'Report' },
    { name: 'ReportTitle', type: 'string', defaultValue: '', description: 'Titre du rapport', category: 'Report' },
    { name: 'ReportSubject', type: 'string', defaultValue: '', description: 'Sujet du rapport', category: 'Report' },
    { name: 'ReportAuthor', type: 'string', defaultValue: '', description: 'Auteur du rapport', category: 'Report' },
    { name: 'ReportKeywords', type: 'string', defaultValue: '', description: 'Mots-clés du rapport', category: 'Report' },
    { name: 'ReportComments', type: 'string', defaultValue: '', description: 'Commentaires du rapport', category: 'Report' },
    { name: 'ReportTemplate', type: 'string', defaultValue: '', description: 'Modèle de rapport', category: 'Report' },
    { name: 'ParameterFields', type: 'array', defaultValue: [], description: 'Champs de paramètres', category: 'Report' },
    { name: 'StoredProcParams', type: 'array', defaultValue: [], description: 'Paramètres de procédure stockée', category: 'Report' },
    { name: 'LogonInfo', type: 'array', defaultValue: [], description: 'Informations de connexion', category: 'Report' },
    { name: 'DatabaseLogonTimeout', type: 'number', defaultValue: 15, description: 'Timeout de connexion à la base de données', category: 'Report' },
    { name: 'DiscardSavedData', type: 'boolean', defaultValue: false, description: 'Ignorer les données sauvegardées', category: 'Report' },
    { name: 'PrinterName', type: 'string', defaultValue: '', description: 'Nom de l\'imprimante', category: 'Report' },
    { name: 'PrinterDriver', type: 'string', defaultValue: '', description: 'Pilote d\'imprimante', category: 'Report' },
    { name: 'PrinterPort', type: 'string', defaultValue: '', description: 'Port d\'imprimante', category: 'Report' },
    { name: 'CopiesToPrinter', type: 'number', defaultValue: 1, description: 'Nombre de copies', category: 'Report' },
    { name: 'PrinterCollation', type: 'boolean', defaultValue: true, description: 'Assemblage', category: 'Report' },
    { name: 'PrinterStartPage', type: 'number', defaultValue: 1, description: 'Page de début', category: 'Report' },
    { name: 'PrinterStopPage', type: 'number', defaultValue: 999999, description: 'Page de fin', category: 'Report' },
    { name: 'MarginLeft', type: 'number', defaultValue: 0, description: 'Marge gauche', category: 'Report' },
    { name: 'MarginRight', type: 'number', defaultValue: 0, description: 'Marge droite', category: 'Report' },
    { name: 'MarginTop', type: 'number', defaultValue: 0, description: 'Marge haute', category: 'Report' },
    { name: 'MarginBottom', type: 'number', defaultValue: 0, description: 'Marge basse', category: 'Report' },
    { name: 'Action', type: 'enum', defaultValue: 0, enumValues: ['0 - crptNoAction', '1 - crptPrintReport', '2 - crptVerifyOnEveryPrint', '3 - crptExportReport', '4 - crptExportReportWithFormatOptions', '5 - crptPrintSetup', '6 - crptRefresh', '7 - crptSearchForText', '8 - crptShowLastPage', '9 - crptShowFirstPage', '10 - crptShowPreviousPage', '11 - crptShowNextPage', '12 - crptShowNthPage', '13 - crptZoom', '14 - crptCloseView', '15 - crptActivatePrintWindow', '16 - crptActivateExportWindow', '17 - crptMaximizeWindow', '18 - crptMinimizeWindow', '19 - crptRestoreWindow', '20 - crptCancelPrinting', '21 - crptPrintAllPrintJobs', '22 - crptShowAllTreeNodes', '23 - crptCollapseAllTreeNodes', '24 - crptSetLogonInfo', '25 - crptReadRecords', '26 - crptShowSQL'], description: 'Action', category: 'Report' },
    { name: 'DataFiles', type: 'array', defaultValue: [], description: 'Fichiers de données', category: 'Report' },
    { name: 'PageZoom', type: 'variant', defaultValue: 100, description: 'Zoom de page', category: 'Report' },
    { name: 'PageNumber', type: 'number', defaultValue: 1, description: 'Numéro de page', category: 'Report' },
    { name: 'ProgressDialog', type: 'boolean', defaultValue: true, description: 'Dialogue de progression', category: 'Report' },
    { name: 'TrackCursorInfo', type: 'object', defaultValue: null, description: 'Informations du curseur de suivi', category: 'Report' },
    { name: 'Status', type: 'enum', defaultValue: 0, enumValues: ['0 - crptBusy', '1 - crptCancelled', '2 - crptError', '3 - crptJobCompleted'], description: 'Statut', category: 'Report', readOnly: true },
    { name: 'RecordsPrinted', type: 'number', defaultValue: 0, description: 'Enregistrements imprimés', category: 'Report', readOnly: true },
    { name: 'RecordsSelected', type: 'number', defaultValue: 0, description: 'Enregistrements sélectionnés', category: 'Report', readOnly: true },
    { name: 'RecordsProcessed', type: 'number', defaultValue: 0, description: 'Enregistrements traités', category: 'Report', readOnly: true },
    { name: 'RecordsRead', type: 'number', defaultValue: 0, description: 'Enregistrements lus', category: 'Report', readOnly: true },
    { name: 'PrinterDuplex', type: 'enum', defaultValue: 0, enumValues: ['0 - crptDuplexDefault', '1 - crptDuplexSimplex', '2 - crptDuplexHorizontal', '3 - crptDuplexVertical'], description: 'Recto-verso', category: 'Report' },
    { name: 'PrinterOrientation', type: 'enum', defaultValue: 0, enumValues: ['0 - crptDefaultOrientation', '1 - crptPortrait', '2 - crptLandscape'], description: 'Orientation', category: 'Report' },
    { name: 'PrinterPaperSize', type: 'enum', defaultValue: 0, enumValues: ['0 - crptDefaultPaperSize', '1 - crptPaperLetter', '2 - crptPaperLetterSmall', '3 - crptPaperTabloid', '4 - crptPaperLedger', '5 - crptPaperLegal', '6 - crptPaperStatement', '7 - crptPaperExecutive', '8 - crptPaperA3', '9 - crptPaperA4', '10 - crptPaperA4Small', '11 - crptPaperA5', '12 - crptPaperB4', '13 - crptPaperB5', '14 - crptPaperFolio', '15 - crptPaperQuarto', '16 - crptPaper10x14', '17 - crptPaper11x17', '18 - crptPaperNote', '19 - crptPaperEnvelope9', '20 - crptPaperEnvelope10', '21 - crptPaperEnvelope11', '22 - crptPaperEnvelope12', '23 - crptPaperEnvelope14', '24 - crptPaperCsheet', '25 - crptPaperDsheet', '26 - crptPaperEsheet', '27 - crptPaperEnvelopeDL', '28 - crptPaperEnvelopeC5', '29 - crptPaperEnvelopeC3', '30 - crptPaperEnvelopeC4', '31 - crptPaperEnvelopeC6', '32 - crptPaperEnvelopeC65', '33 - crptPaperEnvelopeB4', '34 - crptPaperEnvelopeB5', '35 - crptPaperEnvelopeB6', '36 - crptPaperEnvelopeItaly', '37 - crptPaperEnvelopeMonarch', '38 - crptPaperEnvelopePersonal', '39 - crptPaperFanfoldUS', '40 - crptPaperFanfoldStdGerman', '41 - crptPaperFanfoldLglGerman', '256 - crptPaperUser'], description: 'Taille du papier', category: 'Report' },
    { name: 'PrinterPaperSource', type: 'enum', defaultValue: 0, enumValues: ['0 - crptPRBinUpper', '1 - crptPRBinLower', '2 - crptPRBinMiddle', '3 - crptPRBinManual', '4 - crptPRBinEnvelope', '5 - crptPRBinEnvManual', '6 - crptPRBinAuto', '7 - crptPRBinTractor', '8 - crptPRBinSmallFmt', '9 - crptPRBinLargeFmt', '10 - crptPRBinLargeCapacity', '11 - crptPRBinCassette', '12 - crptPRBinFormSource', '15 - crptPRBinDefaultSource'], description: 'Source du papier', category: 'Report' },
    { name: 'PrinterTray', type: 'string', defaultValue: '', description: 'Bac d\'imprimante', category: 'Report' },
    { name: 'SessionHandle', type: 'number', defaultValue: 0, description: 'Handle de session', category: 'Report' },
    { name: 'BoundReportFooter', type: 'boolean', defaultValue: false, description: 'Pied de rapport lié', category: 'Report' },
    { name: 'BoundReportHeading', type: 'string', defaultValue: '', description: 'En-tête de rapport lié', category: 'Report' },
    { name: 'MaxLinesPerPage', type: 'number', defaultValue: 0, description: 'Lignes maximum par page', category: 'Report' },
  ],
};

/**
 * Obtient toutes les propriétés d'un contrôle (communes + spécifiques)
 */
export function getCompleteVB6Properties(controlType: string): VB6PropertyDefinition[] {
  const specificProps = VB6_COMPLETE_PROPERTIES[controlType] || [];
  return [...VB6_COMMON_PROPERTIES, ...specificProps];
}

/**
 * Vérifie si une propriété est implémentée
 */
export function isPropertyImplemented(controlType: string, propertyName: string): boolean {
  const properties = getCompleteVB6Properties(controlType);
  return properties.some(p => p.name === propertyName);
}

/**
 * Obtient les propriétés manquantes d'un contrôle
 */
export function getMissingProperties(controlType: string, implementedProperties: string[]): VB6PropertyDefinition[] {
  const allProperties = getCompleteVB6Properties(controlType);
  return allProperties.filter(p => !implementedProperties.includes(p.name));
}

/**
 * Calcule le pourcentage de compatibilité
 */
export function getCompatibilityPercentage(controlType: string, implementedProperties: string[]): number {
  const allProperties = getCompleteVB6Properties(controlType);
  const implementedCount = allProperties.filter(p => implementedProperties.includes(p.name)).length;
  return Math.round((implementedCount / allProperties.length) * 100);
}