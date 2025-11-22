VERSION 5.00
Begin VB.Form frmGame 
   Caption         =   "Snake Game - Test VB6 Web IDE"
   ClientHeight    =   6630
   ClientLeft      =   60
   ClientTop       =   345
   ClientWidth     =   8175
   KeyPreview      =   -1  'True
   LinkTopic       =   "Form1"
   ScaleHeight     =   6630
   ScaleWidth      =   8175
   StartUpPosition =   2  'CenterScreen
   Begin VB.Timer tmrGame 
      Enabled         =   0   'False
      Interval        =   200
      Left            =   7560
      Top             =   6000
   End
   Begin VB.Frame frameControls 
      Caption         =   "Contrôles de Jeu"
      Height          =   975
      Left            =   120
      TabIndex        =   0
      Top             =   5520
      Width           =   7935
      Begin VB.CommandButton cmdPause 
         Caption         =   "&Pause"
         Enabled         =   0   'False
         Height          =   375
         Left            =   2160
         TabIndex        =   7
         Top             =   480
         Width           =   975
      End
      Begin VB.CommandButton cmdStart 
         Caption         =   "&Démarrer"
         Height          =   375
         Left            =   1080
         TabIndex        =   6
         Top             =   480
         Width           =   975
      End
      Begin VB.CommandButton cmdNewGame 
         Caption         =   "&Nouveau Jeu"
         Height          =   375
         Left            =   3240
         TabIndex        =   5
         Top             =   480
         Width           =   1215
      End
      Begin VB.CommandButton cmdExit 
         Caption         =   "&Quitter"
         Height          =   375
         Left            =   6600
         TabIndex        =   4
         Top             =   480
         Width           =   975
      End
      Begin VB.Label lblInstructions 
         Caption         =   "Utilisez les flèches pour diriger le serpent. Mangez les pommes pour grandir!"
         Height          =   255
         Left            =   240
         TabIndex        =   8
         Top             =   240
         Width           =   7455
      End
   End
   Begin VB.Label lblGameOver 
      Alignment       =   2  'Center
      BackStyle       =   0  'Transparent
      Caption         =   "GAME OVER"
      BeginProperty Font 
         Name            =   "Arial"
         Size            =   24
         Charset         =   0
         Weight          =   700
         Underline       =   0   'False
         Italic          =   0   'False
         Strikethrough   =   0   'False
      EndProperty
      ForeColor       =   &H000000FF&
      Height          =   615
      Left            =   2400
      TabIndex        =   9
      Top             =   2400
      Visible         =   0   'False
      Width           =   3375
   End
   Begin VB.Label lblSpeed 
      Caption         =   "Vitesse: Normale"
      Height          =   255
      Left            =   5640
      TabIndex        =   3
      Top             =   240
      Width           =   1455
   End
   Begin VB.Label lblLevel 
      Caption         =   "Niveau: 1"
      Height          =   255
      Left            =   4200
      TabIndex        =   2
      Top             =   240
      Width           =   975
   End
   Begin VB.Label lblScore 
      Caption         =   "Score: 0"
      Height          =   255
      Left            =   2760
      TabIndex        =   1
      Top             =   240
      Width           =   1215
   End
   Begin VB.PictureBox picGame 
      BackColor       =   &H00000000&
      Height          =   4935
      Left            =   120
      ScaleHeight     =   4875
      ScaleMode       =   3  'Pixel
      ScaleWidth      =   7875
      TabIndex        =   10
      Top             =   480
      Width           =   7935
   End
End
Attribute VB_Name = "frmGame"
Attribute VB_GlobalNameSpace = False
Attribute VB_Creatable = False
Attribute VB_PredeclaredId = True
Attribute VB_Exposed = False

'**************************************************
' Jeu Snake - Test avancé pour VB6 Web IDE
' Teste les graphiques, les timers et les entrées clavier
'**************************************************

' Constantes du jeu
Const GRID_SIZE = 15
Const MAX_SNAKE_LENGTH = 500

' Types de données
Private Type Point
    x As Integer
    y As Integer
End Type

Private Type Snake
    body(MAX_SNAKE_LENGTH) As Point
    length As Integer
    direction As Integer
End Type

' Variables du jeu
Private snake As Snake
Private food As Point
Private score As Long
Private level As Integer
Private gameRunning As Boolean
Private gamePaused As Boolean
Private gameSpeed As Integer
Private gridWidth As Integer
Private gridHeight As Integer

' Directions
Const DIR_UP = 1
Const DIR_DOWN = 2
Const DIR_LEFT = 3
Const DIR_RIGHT = 4

Private Sub Form_Load()
    Me.Caption = "Snake Game - Test VB6 Web IDE"
    
    ' Initialisation du jeu
    InitializeGame
    
    ' Configuration de la zone de jeu
    With picGame
        .BackColor = RGB(0, 0, 0)
        .AutoRedraw = True
        .BorderStyle = 1
    End With
    
    ' Calculer la taille de la grille
    gridWidth = picGame.ScaleWidth \ GRID_SIZE
    gridHeight = picGame.ScaleHeight \ GRID_SIZE
    
    ' Afficher les instructions
    ShowWelcomeScreen
End Sub

Private Sub InitializeGame()
    ' Initialiser le serpent
    snake.length = 3
    snake.direction = DIR_RIGHT
    snake.body(0).x = 10
    snake.body(0).y = 10
    snake.body(1).x = 9
    snake.body(1).y = 10
    snake.body(2).x = 8
    snake.body(2).y = 10
    
    ' Initialiser les variables
    score = 0
    level = 1
    gameSpeed = 200
    gameRunning = False
    gamePaused = False
    
    ' Mettre à jour l'affichage
    UpdateScore
    
    ' Générer la première nourriture
    GenerateFood
End Sub

Private Sub ShowWelcomeScreen()
    picGame.Cls
    
    With picGame
        .ForeColor = RGB(255, 255, 0)
        .FontName = "Arial"
        .FontSize = 16
        .FontBold = True
        
        .CurrentX = (.ScaleWidth - .TextWidth("SNAKE GAME")) / 2
        .CurrentY = 100
        .Print "SNAKE GAME"
        
        .FontSize = 12
        .FontBold = False
        .ForeColor = RGB(255, 255, 255)
        
        .CurrentX = (.ScaleWidth - .TextWidth("Test VB6 Web IDE")) / 2
        .CurrentY = 150
        .Print "Test VB6 Web IDE"
        
        .FontSize = 10
        .CurrentX = 50
        .CurrentY = 200
        .Print "Instructions:"
        .CurrentX = 70
        .CurrentY = 230
        .Print "• Utilisez les touches fléchées pour diriger le serpent"
        .CurrentX = 70
        .CurrentY = 250
        .Print "• Mangez les pommes rouges pour grandir"
        .CurrentX = 70
        .CurrentY = 270
        .Print "• Évitez les murs et votre propre queue"
        .CurrentX = 70
        .CurrentY = 290
        .Print "• Plus vous mangez, plus le jeu devient rapide"
        
        .ForeColor = RGB(0, 255, 0)
        .CurrentX = (.ScaleWidth - .TextWidth("Cliquez sur 'Démarrer' pour commencer")) / 2
        .CurrentY = 350
        .Print "Cliquez sur 'Démarrer' pour commencer"
    End With
End Sub

Private Sub cmdStart_Click()
    If Not gameRunning Then
        StartGame
    End If
End Sub

Private Sub cmdPause_Click()
    If gameRunning Then
        PauseGame
    End If
End Sub

Private Sub cmdNewGame_Click()
    NewGame
End Sub

Private Sub cmdExit_Click()
    Dim response As Integer
    response = MsgBox("Voulez-vous vraiment quitter le jeu?", vbYesNo + vbQuestion, "Quitter")
    If response = vbYes Then
        End
    End If
End Sub

Private Sub StartGame()
    gameRunning = True
    gamePaused = False
    tmrGame.Enabled = True
    
    cmdStart.Enabled = False
    cmdPause.Enabled = True
    
    lblGameOver.Visible = False
    
    DrawGame
End Sub

Private Sub PauseGame()
    If gamePaused Then
        ' Reprendre le jeu
        gamePaused = False
        tmrGame.Enabled = True
        cmdPause.Caption = "&Pause"
    Else
        ' Pause
        gamePaused = True
        tmrGame.Enabled = False
        cmdPause.Caption = "&Reprendre"
        
        ' Afficher le message de pause
        With picGame
            .ForeColor = RGB(255, 255, 0)
            .FontName = "Arial"
            .FontSize = 20
            .FontBold = True
            .CurrentX = (.ScaleWidth - .TextWidth("PAUSE")) / 2
            .CurrentY = .ScaleHeight / 2
            .Print "PAUSE"
        End With
    End If
End Sub

Private Sub NewGame()
    ' Arrêter le jeu actuel
    gameRunning = False
    gamePaused = False
    tmrGame.Enabled = False
    
    ' Réinitialiser
    InitializeGame
    
    ' Mettre à jour les boutons
    cmdStart.Enabled = True
    cmdPause.Enabled = False
    cmdPause.Caption = "&Pause"
    
    lblGameOver.Visible = False
    
    ' Afficher l'écran d'accueil
    ShowWelcomeScreen
End Sub

Private Sub tmrGame_Timer()
    If gameRunning And Not gamePaused Then
        MoveSnake
        CheckCollisions
        DrawGame
    End If
End Sub

Private Sub MoveSnake()
    Dim i As Integer
    Dim newHead As Point
    
    ' Calculer la nouvelle position de la tête
    newHead = snake.body(0)
    
    Select Case snake.direction
        Case DIR_UP
            newHead.y = newHead.y - 1
        Case DIR_DOWN
            newHead.y = newHead.y + 1
        Case DIR_LEFT
            newHead.x = newHead.x - 1
        Case DIR_RIGHT
            newHead.x = newHead.x + 1
    End Select
    
    ' Déplacer le corps
    For i = snake.length - 1 To 1 Step -1
        snake.body(i) = snake.body(i - 1)
    Next i
    
    ' Mettre la nouvelle tête
    snake.body(0) = newHead
End Sub

Private Sub CheckCollisions()
    Dim head As Point
    Dim i As Integer
    
    head = snake.body(0)
    
    ' Vérifier les collisions avec les murs
    If head.x < 0 Or head.x >= gridWidth Or head.y < 0 Or head.y >= gridHeight Then
        GameOver
        Exit Sub
    End If
    
    ' Vérifier les collisions avec le corps
    For i = 1 To snake.length - 1
        If head.x = snake.body(i).x And head.y = snake.body(i).y Then
            GameOver
            Exit Sub
        End If
    Next i
    
    ' Vérifier si le serpent mange la nourriture
    If head.x = food.x And head.y = food.y Then
        EatFood
    End If
End Sub

Private Sub EatFood()
    ' Augmenter la taille du serpent
    snake.length = snake.length + 1
    
    ' Augmenter le score
    score = score + (level * 10)
    UpdateScore
    
    ' Générer une nouvelle nourriture
    GenerateFood
    
    ' Augmenter la vitesse tous les 5 points
    If score Mod 50 = 0 Then
        level = level + 1
        gameSpeed = gameSpeed - 20
        If gameSpeed < 50 Then gameSpeed = 50
        tmrGame.Interval = gameSpeed
        UpdateSpeed
    End If
    
    ' Son de succès (simulé)
    Beep
End Sub

Private Sub GenerateFood()
    Dim validPosition As Boolean
    Dim i As Integer
    
    Do
        food.x = Int(Rnd * gridWidth)
        food.y = Int(Rnd * gridHeight)
        
        ' Vérifier que la nourriture n'est pas sur le serpent
        validPosition = True
        For i = 0 To snake.length - 1
            If food.x = snake.body(i).x And food.y = snake.body(i).y Then
                validPosition = False
                Exit For
            End If
        Next i
    Loop Until validPosition
End Sub

Private Sub DrawGame()
    Dim i As Integer
    
    ' Effacer l'écran
    picGame.Cls
    
    ' Dessiner le serpent
    For i = 0 To snake.length - 1
        If i = 0 Then
            ' Tête du serpent (vert clair)
            DrawBlock snake.body(i).x, snake.body(i).y, RGB(0, 255, 0)
        Else
            ' Corps du serpent (vert foncé)
            DrawBlock snake.body(i).x, snake.body(i).y, RGB(0, 180, 0)
        End If
    Next i
    
    ' Dessiner la nourriture (rouge)
    DrawBlock food.x, food.y, RGB(255, 0, 0)
    
    ' Dessiner la grille (optionnel)
    DrawGrid
End Sub

Private Sub DrawBlock(x As Integer, y As Integer, color As Long)
    Dim pixelX As Integer, pixelY As Integer
    
    pixelX = x * GRID_SIZE
    pixelY = y * GRID_SIZE
    
    picGame.FillColor = color
    picGame.FillStyle = 0  ' Solid
    picGame.Line (pixelX, pixelY)-(pixelX + GRID_SIZE - 1, pixelY + GRID_SIZE - 1), color, BF
    
    ' Bordure noire
    picGame.Line (pixelX, pixelY)-(pixelX + GRID_SIZE - 1, pixelY + GRID_SIZE - 1), RGB(0, 0, 0), B
End Sub

Private Sub DrawGrid()
    Dim i As Integer
    
    picGame.ForeColor = RGB(32, 32, 32)
    
    ' Lignes verticales
    For i = 0 To gridWidth
        picGame.Line (i * GRID_SIZE, 0)-(i * GRID_SIZE, picGame.ScaleHeight)
    Next i
    
    ' Lignes horizontales
    For i = 0 To gridHeight
        picGame.Line (0, i * GRID_SIZE)-(picGame.ScaleWidth, i * GRID_SIZE)
    Next i
End Sub

Private Sub GameOver()
    gameRunning = False
    tmrGame.Enabled = False
    
    ' Afficher le message de fin
    lblGameOver.Visible = True
    
    With picGame
        .ForeColor = RGB(255, 0, 0)
        .FontName = "Arial"
        .FontSize = 24
        .FontBold = True
        .CurrentX = (.ScaleWidth - .TextWidth("GAME OVER")) / 2
        .CurrentY = .ScaleHeight / 2 - 50
        .Print "GAME OVER"
        
        .FontSize = 14
        .ForeColor = RGB(255, 255, 255)
        .CurrentX = (.ScaleWidth - .TextWidth("Score Final: " & score)) / 2
        .CurrentY = .ScaleHeight / 2 + 20
        .Print "Score Final: " & score
        
        .FontSize = 12
        .ForeColor = RGB(255, 255, 0)
        .CurrentX = (.ScaleWidth - .TextWidth("Cliquez sur 'Nouveau Jeu' pour recommencer")) / 2
        .CurrentY = .ScaleHeight / 2 + 60
        .Print "Cliquez sur 'Nouveau Jeu' pour recommencer"
    End With
    
    ' Mettre à jour les boutons
    cmdStart.Enabled = True
    cmdPause.Enabled = False
    
    ' Son de fin de jeu
    Dim i As Integer
    For i = 1 To 3
        Beep
        Sleep 200
    Next i
    
    ' Enregistrer le high score (simulé)
    SaveHighScore
End Sub

Private Sub UpdateScore()
    lblScore.Caption = "Score: " & score
    lblLevel.Caption = "Niveau: " & level
End Sub

Private Sub UpdateSpeed()
    Dim speedText As String
    
    Select Case gameSpeed
        Case Is > 150
            speedText = "Lente"
        Case Is > 100
            speedText = "Normale"
        Case Is > 75
            speedText = "Rapide"
        Case Else
            speedText = "Très Rapide"
    End Select
    
    lblSpeed.Caption = "Vitesse: " & speedText
End Sub

Private Sub SaveHighScore()
    Static highScore As Long
    
    If score > highScore Then
        highScore = score
        MsgBox "Nouveau record!" & vbCrLf & "Score: " & score, vbInformation, "Félicitations"
        
        ' En réalité, on sauvegarderait dans un fichier ou le registre
        ' SaveSetting "SnakeGame", "Scores", "HighScore", CStr(highScore)
    End If
End Sub

Private Sub Form_KeyDown(KeyCode As Integer, Shift As Integer)
    If Not gameRunning Or gamePaused Then Exit Sub
    
    ' Empêcher le serpent de faire demi-tour
    Select Case KeyCode
        Case vbKeyUp
            If snake.direction <> DIR_DOWN Then snake.direction = DIR_UP
        Case vbKeyDown
            If snake.direction <> DIR_UP Then snake.direction = DIR_DOWN
        Case vbKeyLeft
            If snake.direction <> DIR_RIGHT Then snake.direction = DIR_LEFT
        Case vbKeyRight
            If snake.direction <> DIR_LEFT Then snake.direction = DIR_RIGHT
        Case vbKeySpace
            ' Pause avec espace
            PauseGame
    End Select
End Sub

Private Sub picGame_Click()
    ' Permettre de cliquer sur la zone de jeu pour donner le focus
    picGame.SetFocus
End Sub

Private Sub Form_Activate()
    ' S'assurer que le formulaire peut recevoir les événements clavier
    Me.SetFocus
End Sub

' Fonction utilitaire pour les pauses
Private Sub Sleep(milliseconds As Long)
    Dim startTime As Single
    startTime = Timer
    
    Do While Timer < startTime + (milliseconds / 1000)
        DoEvents
    Loop
End Sub