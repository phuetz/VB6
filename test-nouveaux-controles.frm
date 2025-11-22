VERSION 5.00
Object = "{6B7E6392-850A-101B-AFC0-4210102A8DA7}#1.3#0"; "COMCTL32.OCX"
Begin VB.Form TestNouveauxControles 
   Caption         =   "Test des Nouveaux Contrôles VB6"
   ClientHeight    =   6000
   ClientLeft      =   60
   ClientTop       =   450
   ClientWidth     =   8000
   LinkTopic       =   "Form1"
   ScaleHeight     =   6000
   ScaleWidth      =   8000
   StartUpPosition =   3  'Windows Default
   Begin VB.FileListBox File1 
      Height          =   1845
      Left            =   5280
      Pattern         =   "*.*"
      TabIndex        =   7
      Top             =   3480
      Width           =   2295
   End
   Begin VB.DirListBox Dir1 
      Height          =   1815
      Left            =   2760
      TabIndex        =   6
      Top             =   3480
      Width           =   2295
   End
   Begin VB.DriveListBox Drive1 
      Height          =   315
      Left            =   240
      TabIndex        =   5
      Top             =   3480
      Width           =   2295
   End
   Begin VB.Image Image1 
      Height          =   1575
      Left            =   5280
      Picture         =   "test.jpg"
      Stretch         =   -1  'True
      Top             =   1560
      Width           =   2295
   End
   Begin VB.Shape Shape2 
      FillColor       =   &H00FF0000&
      FillStyle       =   0  'Solid
      Height          =   975
      Left            =   2760
      Shape           =   3  'Circle
      Top             =   1560
      Width           =   975
   End
   Begin VB.Shape Shape1 
      BorderWidth     =   3
      FillColor       =   &H0000FF00&
      FillStyle       =   7  'Diagonal Cross
      Height          =   1575
      Left            =   240
      Shape           =   4  'Rounded Rectangle
      Top             =   1560
      Width           =   2295
   End
   Begin VB.Line Line2 
      BorderColor     =   &H000000FF&
      BorderStyle     =   3  'Dot
      BorderWidth     =   2
      X1              =   240
      X2              =   7680
      Y1              =   1320
      Y2              =   1320
   End
   Begin VB.Line Line1 
      BorderColor     =   &H00FF0000&
      BorderWidth     =   3
      X1              =   240
      X2              =   7680
      Y1              =   720
      Y2              =   720
   End
   Begin VB.Label Label3 
      Caption         =   "Contrôles de Navigation Fichiers:"
      BeginProperty Font 
         Name            =   "MS Sans Serif"
         Size            =   9.75
         Charset         =   0
         Weight          =   700
         Underline       =   0   'False
         Italic          =   0   'False
         Strikethrough   =   0   'False
      EndProperty
      Height          =   255
      Left            =   240
      TabIndex        =   4
      Top             =   3120
      Width           =   3615
   End
   Begin VB.Label Label2 
      Caption         =   "Contrôles Graphiques:"
      BeginProperty Font 
         Name            =   "MS Sans Serif"
         Size            =   9.75
         Charset         =   0
         Weight          =   700
         Underline       =   0   'False
         Italic          =   0   'False
         Strikethrough   =   0   'False
      EndProperty
      Height          =   255
      Left            =   240
      TabIndex        =   3
      Top             =   1200
      Width           =   2295
   End
   Begin VB.Label Label1 
      Caption         =   "Test des Nouveaux Contrôles VB6"
      BeginProperty Font 
         Name            =   "MS Sans Serif"
         Size            =   12
         Charset         =   0
         Weight          =   700
         Underline       =   0   'False
         Italic          =   0   'False
         Strikethrough   =   0   'False
      EndProperty
      Height          =   375
      Left            =   240
      TabIndex        =   0
      Top             =   240
      Width           =   4455
   End
End
Attribute VB_Name = "TestNouveauxControles"
Attribute VB_GlobalNameSpace = False
Attribute VB_Creatable = False
Attribute VB_PredeclaredId = True
Attribute VB_Exposed = False
Option Explicit

Private Sub Drive1_Change()
    ' Mettre à jour le DirListBox avec le nouveau lecteur
    Dir1.Path = Drive1.Drive
End Sub

Private Sub Dir1_Change()
    ' Mettre à jour le FileListBox avec le nouveau répertoire
    File1.Path = Dir1.Path
End Sub

Private Sub File1_Click()
    ' Afficher le fichier sélectionné
    Debug.Print "Fichier sélectionné: " & File1.FileName
End Sub

Private Sub Form_Load()
    ' Initialiser les contrôles
    Drive1.Drive = "C:"
    Dir1.Path = "C:\"
    File1.Path = "C:\"
    File1.Pattern = "*.*"
    
    ' Configurer les formes
    Shape1.FillStyle = 7  ' Diagonal Cross
    Shape2.Shape = 3      ' Circle
    Shape2.FillStyle = 0  ' Solid
    
    ' Configurer les lignes
    Line1.BorderWidth = 3
    Line2.BorderStyle = 3 ' Dot
End Sub