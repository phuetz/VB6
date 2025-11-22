VERSION 5.00
Begin VB.Form frmGraphics 
   Caption         =   "Test Graphiques - VB6 Web IDE"
   ClientHeight    =   7590
   ClientLeft      =   60
   ClientTop       =   345
   ClientWidth     =   9480
   LinkTopic       =   "Form1"
   ScaleHeight     =   7590
   ScaleWidth      =   9480
   StartUpPosition =   2  'CenterScreen
   Begin VB.Timer tmrAnimation 
      Enabled         =   0   'False
      Interval        =   50
      Left            =   8760
      Top             =   6960
   End
   Begin VB.Frame frameControls 
      Caption         =   "Contrôles Graphiques"
      Height          =   1575
      Left            =   120
      TabIndex        =   0
      Top             =   5880
      Width           =   9255
      Begin VB.CheckBox chkAnimation 
         Caption         =   "Animation"
         Height          =   255
         Left            =   7680
         TabIndex        =   14
         Top             =   1200
         Width           =   1215
      End
      Begin VB.CommandButton cmdSave 
         Caption         =   "&Sauvegarder"
         Height          =   375
         Left            =   7680
         TabIndex        =   13
         Top             =   720
         Width           =   1215
      End
      Begin VB.CommandButton cmdClear 
         Caption         =   "&Effacer"
         Height          =   375
         Left            =   6360
         TabIndex        =   12
         Top             =   1080
         Width           =   1215
      End
      Begin VB.CommandButton cmdPattern 
         Caption         =   "&Motifs"
         Height          =   375
         Left            =   5040
         TabIndex        =   11
         Top             =   1080
         Width           =   1215
      End
      Begin VB.CommandButton cmdText 
         Caption         =   "&Texte"
         Height          =   375
         Left            =   3720
         TabIndex        =   10
         Top             =   1080
         Width           =   1215
      End
      Begin VB.CommandButton cmdShapes 
         Caption         =   "&Formes"
         Height          =   375
         Left            =   2400
         TabIndex        =   9
         Top             =   1080
         Width           =   1215
      End
      Begin VB.CommandButton cmdLines 
         Caption         =   "&Lignes"
         Height          =   375
         Left            =   1080
         TabIndex        =   8
         Top             =   1080
         Width           =   1215
      End
      Begin VB.CommandButton cmdColors 
         Caption         =   "&Couleurs"
         Height          =   375
         Left            =   6360
         TabIndex        =   7
         Top             =   720
         Width           =   1215
      End
      Begin VB.CommandButton cmdGradient 
         Caption         =   "&Dégradé"
         Height          =   375
         Left            =   5040
         TabIndex        =   6
         Top             =   720
         Width           =   1215
      End
      Begin VB.CommandButton cmdCircles 
         Caption         =   "&Cercles"
         Height          =   375
         Left            =   3720
         TabIndex        =   5
         Top             =   720
         Width           =   1215
      End
      Begin VB.CommandButton cmdRectangles 
         Caption         =   "&Rectangles"
         Height          =   375
         Left            =   2400
         TabIndex        =   4
         Top             =   720
         Width           =   1215
      End
      Begin VB.CommandButton cmdPixels 
         Caption         =   "&Pixels"
         Height          =   375
         Left            =   1080
         TabIndex        =   3
         Top             =   720
         Width           =   1215
      End
      Begin VB.HScrollBar hsbDemo 
         Height          =   255
         Left            =   1080
         Max             =   100
         TabIndex        =   2
         Top             =   360
         Value           =   50
         Width           =   7815
      End
      Begin VB.Label lblDemo 
         Caption         =   "Démo:"
         Height          =   255
         Left            =   240
         TabIndex        =   1
         Top             =   360
         Width           =   615
      End
   End
   Begin VB.PictureBox picCanvas 
      BackColor       =   &H00FFFFFF&
      Height          =   5535
      Left            =   120
      ScaleHeight     =   5475
      ScaleWidth      =   9195
      TabIndex        =   15
      Top             =   240
      Width           =   9255
   End
End
Attribute VB_Name = "frmGraphics"
Attribute VB_GlobalNameSpace = False
Attribute VB_Creatable = False
Attribute VB_PredeclaredId = True
Attribute VB_Exposed = False

'**************************************************
' Test Graphiques pour VB6 Web IDE
' Teste les fonctions graphiques et l'animation
'**************************************************

Dim animationStep As Integer
Dim animationDirection As Integer
Dim lastX As Single, lastY As Single

Private Sub Form_Load()
    Me.Caption = "Test Graphiques - VB6 Web IDE"
    
    ' Configuration du canvas
    With picCanvas
        .BackColor = RGB(255, 255, 255)
        .AutoRedraw = True
        .ScaleMode = vbPixels
        .DrawWidth = 2
        .ForeColor = RGB(0, 0, 0)
    End With
    
    ' Initialisation des variables d'animation
    animationStep = 0
    animationDirection = 1
    
    ' Message de bienvenue
    DrawWelcomeMessage
End Sub

Private Sub DrawWelcomeMessage()
    picCanvas.Cls
    
    With picCanvas
        .FontName = "Arial"
        .FontSize = 16
        .FontBold = True
        .ForeColor = RGB(255, 0, 0)
        
        .CurrentX = (.ScaleWidth - .TextWidth("Test Graphiques VB6 Web IDE")) / 2
        .CurrentY = 50
        .Print "Test Graphiques VB6 Web IDE"
        
        .FontSize = 12
        .FontBold = False
        .ForeColor = RGB(0, 0, 255)
        
        .CurrentX = (.ScaleWidth - .TextWidth("Cliquez sur les boutons pour tester les fonctions graphiques")) / 2
        .CurrentY = 100
        .Print "Cliquez sur les boutons pour tester les fonctions graphiques"
    End With
End Sub

Private Sub cmdPixels_Click()
    Dim i As Integer, x As Single, y As Single
    Dim r As Integer, g As Integer, b As Integer
    
    picCanvas.Cls
    DrawWelcomeMessage
    
    ' Dessiner des pixels colorés aléatoires
    For i = 1 To 1000
        x = Rnd * picCanvas.ScaleWidth
        y = Rnd * picCanvas.ScaleHeight
        r = Int(Rnd * 256)
        g = Int(Rnd * 256)
        b = Int(Rnd * 256)
        
        picCanvas.PSet (x, y), RGB(r, g, b)
    Next i
    
    ' Dessiner un motif de pixels
    For i = 0 To picCanvas.ScaleWidth Step 10
        picCanvas.PSet (i, 200), RGB(255 - i Mod 256, i Mod 256, 128)
        picCanvas.PSet (i, 250), RGB(i Mod 256, 255 - i Mod 256, 200)
    Next i
End Sub

Private Sub cmdRectangles_Click()
    Dim i As Integer
    Dim x1 As Single, y1 As Single, x2 As Single, y2 As Single
    Dim color As Long
    
    picCanvas.Cls
    DrawWelcomeMessage
    
    ' Dessiner des rectangles colorés
    For i = 1 To 20
        x1 = Rnd * (picCanvas.ScaleWidth - 100)
        y1 = Rnd * (picCanvas.ScaleHeight - 100) + 150
        x2 = x1 + 50 + Rnd * 100
        y2 = y1 + 30 + Rnd * 80
        
        color = RGB(Int(Rnd * 256), Int(Rnd * 256), Int(Rnd * 256))
        
        picCanvas.FillColor = color
        picCanvas.FillStyle = 0  ' Solid
        picCanvas.Line (x1, y1)-(x2, y2), color, BF
    Next i
    
    ' Dessiner des rectangles en dégradé
    For i = 0 To 50
        color = RGB(255 - i * 5, i * 5, 128)
        picCanvas.Line (100 + i * 2, 300)-(150 + i * 2, 350), color, BF
    Next i
End Sub

Private Sub cmdCircles_Click()
    Dim i As Integer
    Dim x As Single, y As Single, radius As Single
    Dim color As Long
    
    picCanvas.Cls
    DrawWelcomeMessage
    
    ' Dessiner des cercles concentriques
    For i = 1 To 15
        radius = i * 10
        color = RGB((i * 17) Mod 256, (i * 23) Mod 256, (i * 31) Mod 256)
        picCanvas.Circle (picCanvas.ScaleWidth / 2, picCanvas.ScaleHeight / 2), radius, color
    Next i
    
    ' Dessiner des cercles aléatoires
    For i = 1 To 30
        x = Rnd * picCanvas.ScaleWidth
        y = Rnd * picCanvas.ScaleHeight + 150
        radius = 10 + Rnd * 50
        color = RGB(Int(Rnd * 256), Int(Rnd * 256), Int(Rnd * 256))
        
        picCanvas.FillColor = color
        picCanvas.FillStyle = 0
        picCanvas.Circle (x, y), radius, color
    Next i
End Sub

Private Sub cmdGradient_Click()
    Dim i As Integer
    Dim r As Integer, g As Integer, b As Integer
    
    picCanvas.Cls
    DrawWelcomeMessage
    
    ' Dégradé horizontal rouge vers bleu
    For i = 0 To picCanvas.ScaleWidth
        r = 255 - Int((i / picCanvas.ScaleWidth) * 255)
        b = Int((i / picCanvas.ScaleWidth) * 255)
        picCanvas.Line (i, 200)-(i, 250), RGB(r, 0, b)
    Next i
    
    ' Dégradé vertical vert vers jaune
    For i = 0 To 100
        g = 255
        r = Int((i / 100) * 255)
        picCanvas.Line (100, 300 + i)-(300, 300 + i), RGB(r, g, 0)
    Next i
    
    ' Dégradé circulaire
    Dim x As Single, y As Single, distance As Single, maxDistance As Single
    Dim centerX As Single, centerY As Single
    
    centerX = picCanvas.ScaleWidth * 0.75
    centerY = picCanvas.ScaleHeight * 0.7
    maxDistance = 100
    
    For x = centerX - maxDistance To centerX + maxDistance Step 2
        For y = centerY - maxDistance To centerY + maxDistance Step 2
            distance = Sqr((x - centerX) ^ 2 + (y - centerY) ^ 2)
            If distance <= maxDistance Then
                r = Int(255 * (1 - distance / maxDistance))
                g = Int(128 * (distance / maxDistance))
                b = Int(255 * (distance / maxDistance))
                picCanvas.PSet (x, y), RGB(r, g, b)
            End If
        Next y
    Next x
End Sub

Private Sub cmdColors_Click()
    Dim i As Integer, j As Integer
    Dim x As Single, y As Single
    Dim hue As Single, saturation As Single, brightness As Single
    
    picCanvas.Cls
    DrawWelcomeMessage
    
    ' Palette de couleurs HSB
    For i = 0 To 360 Step 5
        For j = 0 To 100 Step 10
            x = 50 + i / 2
            y = 200 + j * 2
            hue = i
            saturation = 1
            brightness = j / 100
            
            ' Conversion HSB vers RGB simplifiée
            Dim r As Integer, g As Integer, b As Integer
            HSBtoRGB hue, saturation, brightness, r, g, b
            
            picCanvas.Line (x, y)-(x + 3, y + 10), RGB(r, g, b), BF
        Next j
    Next i
    
    ' Couleurs primaires et secondaires
    Dim colors As Variant
    colors = Array(RGB(255, 0, 0), RGB(0, 255, 0), RGB(0, 0, 255), _
                   RGB(255, 255, 0), RGB(255, 0, 255), RGB(0, 255, 255), _
                   RGB(255, 128, 0), RGB(128, 255, 0))
    
    For i = 0 To UBound(colors)
        picCanvas.FillColor = colors(i)
        picCanvas.FillStyle = 0
        picCanvas.Circle (100 + i * 80, 450), 30, colors(i)
    Next i
End Sub

Private Sub cmdLines_Click()
    Dim i As Integer
    Dim x1 As Single, y1 As Single, x2 As Single, y2 As Single
    
    picCanvas.Cls
    DrawWelcomeMessage
    
    ' Lignes rayonnantes
    For i = 0 To 360 Step 10
        x1 = picCanvas.ScaleWidth / 2
        y1 = picCanvas.ScaleHeight / 2
        x2 = x1 + 200 * Cos(i * 3.14159 / 180)
        y2 = y1 + 200 * Sin(i * 3.14159 / 180)
        
        picCanvas.ForeColor = RGB((i * 7) Mod 256, (i * 11) Mod 256, (i * 13) Mod 256)
        picCanvas.Line (x1, y1)-(x2, y2)
    Next i
    
    ' Lignes en zigzag
    For i = 0 To picCanvas.ScaleWidth Step 20
        If i Mod 40 = 0 Then
            picCanvas.Line (i, 150)-(i + 20, 180), RGB(255, 0, 0)
        Else
            picCanvas.Line (i, 180)-(i + 20, 150), RGB(0, 0, 255)
        End If
    Next i
End Sub

Private Sub cmdShapes_Click()
    picCanvas.Cls
    DrawWelcomeMessage
    
    ' Dessiner différentes formes
    ' Polygone
    DrawPolygon picCanvas.ScaleWidth * 0.2, picCanvas.ScaleHeight * 0.6, 50, 6, RGB(255, 0, 0)
    
    ' Étoile
    DrawStar picCanvas.ScaleWidth * 0.5, picCanvas.ScaleHeight * 0.6, 60, 5, RGB(0, 255, 0)
    
    ' Spirale
    DrawSpiral picCanvas.ScaleWidth * 0.8, picCanvas.ScaleHeight * 0.6, RGB(0, 0, 255)
End Sub

Private Sub cmdText_Click()
    picCanvas.Cls
    DrawWelcomeMessage
    
    Dim i As Integer
    Dim fonts As Variant
    fonts = Array("Arial", "Times New Roman", "Courier New", "Comic Sans MS")
    
    ' Différentes polices et tailles
    For i = 0 To UBound(fonts)
        With picCanvas
            .FontName = fonts(i)
            .FontSize = 12 + i * 2
            .ForeColor = RGB(Int(Rnd * 256), Int(Rnd * 256), Int(Rnd * 256))
            .CurrentX = 50
            .CurrentY = 200 + i * 40
            .Print "Police " & fonts(i) & " - Taille " & (12 + i * 2)
        End With
    Next i
    
    ' Texte en rotation (simulé)
    For i = 0 To 360 Step 30
        With picCanvas
            .ForeColor = RGB((i * 7) Mod 256, (i * 11) Mod 256, (i * 13) Mod 256)
            .CurrentX = picCanvas.ScaleWidth / 2 + 100 * Cos(i * 3.14159 / 180) - 20
            .CurrentY = picCanvas.ScaleHeight / 2 + 100 * Sin(i * 3.14159 / 180)
            .Print Format(i, "000") & "°"
        End With
    Next i
End Sub

Private Sub cmdPattern_Click()
    picCanvas.Cls
    DrawWelcomeMessage
    
    Dim i As Integer, j As Integer
    
    ' Motif en damier
    For i = 0 To 20
        For j = 0 To 15
            If (i + j) Mod 2 = 0 Then
                picCanvas.Line (50 + i * 20, 200 + j * 20)-(70 + i * 20, 220 + j * 20), RGB(0, 0, 0), BF
            Else
                picCanvas.Line (50 + i * 20, 200 + j * 20)-(70 + i * 20, 220 + j * 20), RGB(255, 255, 255), BF
            End If
        Next j
    Next i
    
    ' Motif sinusoïdal
    For i = 0 To picCanvas.ScaleWidth Step 2
        Dim y As Single
        y = 150 + 50 * Sin(i * 0.05)
        picCanvas.PSet (i, y), RGB(255, 0, 0)
        y = 150 + 50 * Cos(i * 0.03)
        picCanvas.PSet (i, y), RGB(0, 255, 0)
    Next i
End Sub

Private Sub cmdClear_Click()
    picCanvas.Cls
    DrawWelcomeMessage
End Sub

Private Sub cmdSave_Click()
    ' Simuler la sauvegarde de l'image
    On Error GoTo SaveError
    
    ' En VB6 réel, on utiliserait SavePicture
    ' SavePicture picCanvas.Image, App.Path & "\test_graphics.bmp"
    
    MsgBox "Image sauvegardée sous: " & App.Path & "\test_graphics.bmp", vbInformation, "Sauvegarde"
    Exit Sub
    
SaveError:
    MsgBox "Erreur lors de la sauvegarde: " & Err.Description, vbCritical, "Erreur"
End Sub

Private Sub chkAnimation_Click()
    tmrAnimation.Enabled = chkAnimation.Value
    If tmrAnimation.Enabled Then
        animationStep = 0
        animationDirection = 1
    End If
End Sub

Private Sub tmrAnimation_Timer()
    Static lastTime As Single
    
    ' Animation d'une balle qui rebondit
    picCanvas.Cls
    DrawWelcomeMessage
    
    animationStep = animationStep + animationDirection * 5
    
    If animationStep >= 300 Or animationStep <= 0 Then
        animationDirection = -animationDirection
    End If
    
    ' Dessiner la balle
    Dim ballX As Single, ballY As Single
    ballX = 100 + animationStep
    ballY = 300 + 100 * Sin(animationStep * 0.02)
    
    picCanvas.FillColor = RGB(255, 0, 0)
    picCanvas.FillStyle = 0
    picCanvas.Circle (ballX, ballY), 20, RGB(255, 0, 0)
    
    ' Traînée
    If lastX > 0 And lastY > 0 Then
        picCanvas.Line (lastX, lastY)-(ballX, ballY), RGB(255, 200, 200)
    End If
    
    lastX = ballX
    lastY = ballY
    
    ' Afficher les FPS
    Dim currentTime As Single
    currentTime = Timer
    If lastTime > 0 Then
        Dim fps As Single
        fps = 1 / (currentTime - lastTime)
        picCanvas.CurrentX = 10
        picCanvas.CurrentY = picCanvas.ScaleHeight - 30
        picCanvas.ForeColor = RGB(0, 0, 0)
        picCanvas.Print "FPS: " & Format(fps, "0.0")
    End If
    lastTime = currentTime
End Sub

Private Sub hsbDemo_Change()
    ' Démo interactive avec la barre de défilement
    picCanvas.Cls
    DrawWelcomeMessage
    
    Dim value As Integer
    value = hsbDemo.Value
    
    ' Dessiner un graphique basé sur la valeur
    Dim i As Integer
    For i = 0 To value
        picCanvas.ForeColor = RGB(255 - i * 2, i * 2, 128)
        picCanvas.Line (50 + i * 4, 200)-(50 + i * 4, 200 + value), picCanvas.ForeColor
    Next i
    
    ' Afficher la valeur
    picCanvas.CurrentX = 50
    picCanvas.CurrentY = 250
    picCanvas.ForeColor = RGB(0, 0, 0)
    picCanvas.Print "Valeur: " & value & "%"
End Sub

' Fonctions utilitaires pour les formes complexes
Private Sub DrawPolygon(centerX As Single, centerY As Single, radius As Single, sides As Integer, color As Long)
    Dim i As Integer
    Dim angle As Single
    Dim x As Single, y As Single
    Dim startX As Single, startY As Single
    
    For i = 0 To sides
        angle = i * 2 * 3.14159 / sides
        x = centerX + radius * Cos(angle)
        y = centerY + radius * Sin(angle)
        
        If i = 0 Then
            startX = x
            startY = y
            picCanvas.PSet (x, y), color
        Else
            picCanvas.Line -(x, y), color
        End If
    Next i
    
    ' Fermer le polygone
    picCanvas.Line -(startX, startY), color
End Sub

Private Sub DrawStar(centerX As Single, centerY As Single, radius As Single, points As Integer, color As Long)
    Dim i As Integer
    Dim angle As Single
    Dim x As Single, y As Single
    Dim innerRadius As Single
    
    innerRadius = radius * 0.4
    
    For i = 0 To points * 2
        angle = i * 3.14159 / points
        
        If i Mod 2 = 0 Then
            x = centerX + radius * Cos(angle)
            y = centerY + radius * Sin(angle)
        Else
            x = centerX + innerRadius * Cos(angle)
            y = centerY + innerRadius * Sin(angle)
        End If
        
        If i = 0 Then
            picCanvas.PSet (x, y), color
        Else
            picCanvas.Line -(x, y), color
        End If
    Next i
End Sub

Private Sub DrawSpiral(centerX As Single, centerY As Single, color As Long)
    Dim i As Integer
    Dim angle As Single
    Dim x As Single, y As Single
    Dim radius As Single
    
    For i = 0 To 360 * 3 Step 2
        angle = i * 3.14159 / 180
        radius = i / 10
        x = centerX + radius * Cos(angle)
        y = centerY + radius * Sin(angle)
        
        If i = 0 Then
            picCanvas.PSet (x, y), color
        Else
            picCanvas.Line -(x, y), color
        End If
    Next i
End Sub

Private Sub HSBtoRGB(h As Single, s As Single, b As Single, r As Integer, g As Integer, b As Integer)
    ' Conversion HSB vers RGB simplifiée
    Dim c As Single, x As Single, m As Single
    
    c = b * s
    x = c * (1 - Abs(((h / 60) Mod 2) - 1))
    m = b - c
    
    If h < 60 Then
        r = (c + m) * 255
        g = (x + m) * 255
        b = m * 255
    ElseIf h < 120 Then
        r = (x + m) * 255
        g = (c + m) * 255
        b = m * 255
    ElseIf h < 180 Then
        r = m * 255
        g = (c + m) * 255
        b = (x + m) * 255
    ElseIf h < 240 Then
        r = m * 255
        g = (x + m) * 255
        b = (c + m) * 255
    ElseIf h < 300 Then
        r = (x + m) * 255
        g = m * 255
        b = (c + m) * 255
    Else
        r = (c + m) * 255
        g = m * 255
        b = (x + m) * 255
    End If
End Sub