VERSION 5.00
Begin VB.Form Form1 
   Caption         =   "Hello World - Test VB6"
   ClientHeight    =   3195
   ClientLeft      =   60
   ClientTop       =   345
   ClientWidth     =   4680
   LinkTopic       =   "Form1"
   ScaleHeight     =   3195
   ScaleWidth      =   4680
   StartUpPosition =   3  'Windows Default
   Begin VB.CommandButton cmdExit 
      Caption         =   "&Quitter"
      Height          =   375
      Left            =   2760
      TabIndex        =   2
      Top             =   2520
      Width           =   1215
   End
   Begin VB.CommandButton cmdHello 
      Caption         =   "&Bonjour"
      Height          =   375
      Left            =   720
      TabIndex        =   1
      Top             =   2520
      Width           =   1215
   End
   Begin VB.Label lblMessage 
      Alignment       =   2  'Center
      BackStyle       =   0  'Transparent
      Caption         =   "Cliquez sur Bonjour pour commencer"
      BeginProperty Font 
         Name            =   "Arial"
         Size            =   12
         Charset         =   0
         Weight          =   700
         Underline       =   0   'False
         Italic          =   0   'False
         Strikethrough   =   0   'False
      EndProperty
      ForeColor       =   &H00FF0000&
      Height          =   855
      Left            =   360
      TabIndex        =   0
      Top             =   720
      Width           =   3975
   End
End
Attribute VB_Name = "Form1"
Attribute VB_GlobalNameSpace = False
Attribute VB_Creatable = False
Attribute VB_PredeclaredId = True
Attribute VB_Exposed = False

'**************************************************
' Programme de test Hello World pour VB6 Web IDE
' Teste les fonctionnalités de base
'**************************************************

Private Sub Form_Load()
    ' Initialisation du formulaire
    Me.Caption = "Hello World - Test VB6 Web IDE"
    lblMessage.Caption = "Bienvenue dans VB6 Web IDE!"
    
    ' Centrer le formulaire
    Me.Left = (Screen.Width - Me.Width) / 2
    Me.Top = (Screen.Height - Me.Height) / 2
    
    ' Configuration initiale
    cmdHello.Default = True
End Sub

Private Sub cmdHello_Click()
    Dim userName As String
    Dim message As String
    
    ' Demander le nom de l'utilisateur
    userName = InputBox("Quel est votre nom ?", "Bonjour", "Utilisateur")
    
    If userName <> "" Then
        message = "Bonjour " & userName & "!" & vbCrLf & _
                 "Bienvenue dans VB6 Web IDE" & vbCrLf & _
                 "Date: " & Format(Now, "dd/mm/yyyy hh:nn:ss")
        
        lblMessage.Caption = message
        
        ' Afficher une MsgBox
        MsgBox "Hello " & userName & "!" & vbCrLf & _
               "VB6 Web IDE fonctionne parfaitement!", _
               vbInformation + vbOKOnly, "Test Réussi"
    End If
End Sub

Private Sub cmdExit_Click()
    Dim response As Integer
    
    response = MsgBox("Voulez-vous vraiment quitter?", _
                     vbQuestion + vbYesNo, "Confirmation")
    
    If response = vbYes Then
        End
    End If
End Sub

Private Sub Form_Resize()
    ' Redimensionnement automatique des contrôles
    If Me.WindowState <> vbMinimized Then
        ' Centrer le label
        lblMessage.Left = (Me.ScaleWidth - lblMessage.Width) / 2
        
        ' Positionner les boutons
        cmdHello.Top = Me.ScaleHeight - cmdHello.Height - 200
        cmdExit.Top = cmdHello.Top
        
        cmdHello.Left = (Me.ScaleWidth / 2) - cmdHello.Width - 100
        cmdExit.Left = (Me.ScaleWidth / 2) + 100
    End If
End Sub

Private Sub lblMessage_Click()
    ' Fonction bonus - animation du texte
    Dim i As Integer
    Dim originalColor As Long
    
    originalColor = lblMessage.ForeColor
    
    For i = 1 To 5
        lblMessage.ForeColor = RGB(255, 0, 0)  ' Rouge
        DoEvents
        Sleep 100
        
        lblMessage.ForeColor = RGB(0, 255, 0)  ' Vert
        DoEvents
        Sleep 100
        
        lblMessage.ForeColor = RGB(0, 0, 255)  ' Bleu
        DoEvents
        Sleep 100
    Next i
    
    lblMessage.ForeColor = originalColor
End Sub