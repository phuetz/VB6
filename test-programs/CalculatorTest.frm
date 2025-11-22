VERSION 5.00
Begin VB.Form frmCalculator 
   Caption         =   "Calculatrice - Test VB6"
   ClientHeight    =   4590
   ClientLeft      =   60
   ClientTop       =   345
   ClientWidth     =   3480
   LinkTopic       =   "Form1"
   MaxButton       =   0   'False
   ScaleHeight     =   4590
   ScaleWidth      =   3480
   StartUpPosition =   2  'CenterScreen
   Begin VB.CommandButton cmdClear 
      Caption         =   "C"
      BeginProperty Font 
         Name            =   "Arial"
         Size            =   12
         Charset         =   0
         Weight          =   700
         Underline       =   0   'False
         Italic          =   0   'False
         Strikethrough   =   0   'False
      EndProperty
      Height          =   615
      Left            =   2640
      TabIndex        =   19
      Top             =   3720
      Width           =   615
   End
   Begin VB.CommandButton cmdEquals 
      Caption         =   "="
      BeginProperty Font 
         Name            =   "Arial"
         Size            =   14
         Charset         =   0
         Weight          =   700
         Underline       =   0   'False
         Italic          =   0   'False
         Strikethrough   =   0   'False
      EndProperty
      Height          =   615
      Left            =   2640
      TabIndex        =   18
      Top             =   3000
      Width           =   615
   End
   Begin VB.CommandButton cmdOperation 
      Caption         =   "/"
      BeginProperty Font 
         Name            =   "Arial"
         Size            =   12
         Charset         =   0
         Weight          =   700
         Underline       =   0   'False
         Italic          =   0   'False
         Strikethrough   =   0   'False
      EndProperty
      Height          =   615
      Index           =   3
      Left            =   2640
      TabIndex        =   17
      Top             =   1560
      Width           =   615
   End
   Begin VB.CommandButton cmdOperation 
      Caption         =   "*"
      BeginProperty Font 
         Name            =   "Arial"
         Size            =   12
         Charset         =   0
         Weight          =   700
         Underline       =   0   'False
         Italic          =   0   'False
         Strikethrough   =   0   'False
      EndProperty
      Height          =   615
      Index           =   2
      Left            =   2640
      TabIndex        =   16
      Top             =   2280
      Width           =   615
   End
   Begin VB.CommandButton cmdOperation 
      Caption         =   "-"
      BeginProperty Font 
         Name            =   "Arial"
         Size            =   14
         Charset         =   0
         Weight          =   700
         Underline       =   0   'False
         Italic          =   0   'False
         Strikethrough   =   0   'False
      EndProperty
      Height          =   615
      Index           =   1
      Left            =   1800
      TabIndex        =   15
      Top             =   3720
      Width           =   615
   End
   Begin VB.CommandButton cmdOperation 
      Caption         =   "+"
      BeginProperty Font 
         Name            =   "Arial"
         Size            =   14
         Charset         =   0
         Weight          =   700
         Underline       =   0   'False
         Italic          =   0   'False
         Strikethrough   =   0   'False
      EndProperty
      Height          =   615
      Index           =   0
      Left            =   1800
      TabIndex        =   14
      Top             =   3000
      Width           =   615
   End
   Begin VB.CommandButton cmdNumber 
      Caption         =   "0"
      BeginProperty Font 
         Name            =   "Arial"
         Size            =   12
         Charset         =   0
         Weight          =   700
         Underline       =   0   'False
         Italic          =   0   'False
         Strikethrough   =   0   'False
      EndProperty
      Height          =   615
      Index           =   0
      Left            =   960
      TabIndex        =   13
      Top             =   3720
      Width           =   615
   End
   Begin VB.CommandButton cmdNumber 
      Caption         =   "."
      BeginProperty Font 
         Name            =   "Arial"
         Size            =   14
         Charset         =   0
         Weight          =   700
         Underline       =   0   'False
         Italic          =   0   'False
         Strikethrough   =   0   'False
      EndProperty
      Height          =   615
      Index           =   10
      Left            =   120
      TabIndex        =   12
      Top             =   3720
      Width           =   615
   End
   Begin VB.CommandButton cmdNumber 
      Caption         =   "3"
      BeginProperty Font 
         Name            =   "Arial"
         Size            =   12
         Charset         =   0
         Weight          =   700
         Underline       =   0   'False
         Italic          =   0   'False
         Strikethrough   =   0   'False
      EndProperty
      Height          =   615
      Index           =   3
      Left            =   1800
      TabIndex        =   11
      Top             =   2280
      Width           =   615
   End
   Begin VB.CommandButton cmdNumber 
      Caption         =   "2"
      BeginProperty Font 
         Name            =   "Arial"
         Size            =   12
         Charset         =   0
         Weight          =   700
         Underline       =   0   'False
         Italic          =   0   'False
         Strikethrough   =   0   'False
      EndProperty
      Height          =   615
      Index           =   2
      Left            =   960
      TabIndex        =   10
      Top             =   3000
      Width           =   615
   End
   Begin VB.CommandButton cmdNumber 
      Caption         =   "1"
      BeginProperty Font 
         Name            =   "Arial"
         Size            =   12
         Charset         =   0
         Weight          =   700
         Underline       =   0   'False
         Italic          =   0   'False
         Strikethrough   =   0   'False
      EndProperty
      Height          =   615
      Index           =   1
      Left            =   120
      TabIndex        =   9
      Top             =   3000
      Width           =   615
   End
   Begin VB.CommandButton cmdNumber 
      Caption         =   "6"
      BeginProperty Font 
         Name            =   "Arial"
         Size            =   12
         Charset         =   0
         Weight          =   700
         Underline       =   0   'False
         Italic          =   0   'False
         Strikethrough   =   0   'False
      EndProperty
      Height          =   615
      Index           =   6
      Left            =   1800
      TabIndex        =   8
      Top             =   2280
      Width           =   615
   End
   Begin VB.CommandButton cmdNumber 
      Caption         =   "5"
      BeginProperty Font 
         Name            =   "Arial"
         Size            =   12
         Charset         =   0
         Weight          =   700
         Underline       =   0   'False
         Italic          =   0   'False
         Strikethrough   =   0   'False
      EndProperty
      Height          =   615
      Index           =   5
      Left            =   960
      TabIndex        =   7
      Top             =   2280
      Width           =   615
   End
   Begin VB.CommandButton cmdNumber 
      Caption         =   "4"
      BeginProperty Font 
         Name            =   "Arial"
         Size            =   12
         Charset         =   0
         Weight          =   700
         Underline       =   0   'False
         Italic          =   0   'False
         Strikethrough   =   0   'False
      EndProperty
      Height          =   615
      Index           =   4
      Left            =   120
      TabIndex        =   6
      Top             =   2280
      Width           =   615
   End
   Begin VB.CommandButton cmdNumber 
      Caption         =   "9"
      BeginProperty Font 
         Name            =   "Arial"
         Size            =   12
         Charset         =   0
         Weight          =   700
         Underline       =   0   'False
         Italic          =   0   'False
         Strikethrough   =   0   'False
      EndProperty
      Height          =   615
      Index           =   9
      Left            =   1800
      TabIndex        =   5
      Top             =   1560
      Width           =   615
   End
   Begin VB.CommandButton cmdNumber 
      Caption         =   "8"
      BeginProperty Font 
         Name            =   "Arial"
         Size            =   12
         Charset         =   0
         Weight          =   700
         Underline       =   0   'False
         Italic          =   0   'False
         Strikethrough   =   0   'False
      EndProperty
      Height          =   615
      Index           =   8
      Left            =   960
      TabIndex        =   4
      Top             =   1560
      Width           =   615
   End
   Begin VB.CommandButton cmdNumber 
      Caption         =   "7"
      BeginProperty Font 
         Name            =   "Arial"
         Size            =   12
         Charset         =   0
         Weight          =   700
         Underline       =   0   'False
         Italic          =   0   'False
         Strikethrough   =   0   'False
      EndProperty
      Height          =   615
      Index           =   7
      Left            =   120
      TabIndex        =   3
      Top             =   1560
      Width           =   615
   End
   Begin VB.Label lblHistory 
      BackColor       =   &H80000005&
      BorderStyle     =   1  'Fixed Single
      Caption         =   "Historique des calculs"
      Height          =   495
      Left            =   120
      TabIndex        =   2
      Top             =   840
      Width           =   3135
   End
   Begin VB.Label lblOperation 
      Alignment       =   1  'Right Justify
      BackColor       =   &H80000005&
      BorderStyle     =   1  'Fixed Single
      Caption         =   "0"
      BeginProperty Font 
         Name            =   "Arial"
         Size            =   14
         Charset         =   0
         Weight          =   700
         Underline       =   0   'False
         Italic          =   0   'False
         Strikethrough   =   0   'False
      EndProperty
      Height          =   495
      Left            =   120
      TabIndex        =   1
      Top             =   240
      Width           =   3135
   End
   Begin VB.Label lblDisplay 
      Alignment       =   1  'Right Justify
      BackColor       =   &H00000000&
      BorderStyle     =   1  'Fixed Single
      Caption         =   "0"
      BeginProperty Font 
         Name            =   "Arial"
         Size            =   18
         Charset         =   0
         Weight          =   700
         Underline       =   0   'False
         Italic          =   0   'False
         Strikethrough   =   0   'False
      EndProperty
      ForeColor       =   &H0000FF00&
      Height          =   495
      Left            =   120
      TabIndex        =   0
      Top             =   120
      Width           =   3135
   End
End
Attribute VB_Name = "frmCalculator"
Attribute VB_GlobalNameSpace = False
Attribute VB_Creatable = False
Attribute VB_PredeclaredId = True
Attribute VB_Exposed = False

'**************************************************
' Calculatrice - Test avancé pour VB6 Web IDE
' Teste les arrays de contrôles et les calculs
'**************************************************

Dim currentValue As Double
Dim previousValue As Double
Dim currentOperation As String
Dim newNumber As Boolean
Dim history As String

Private Sub Form_Load()
    Me.Caption = "Calculatrice VB6 Web IDE - Test Avancé"
    
    ' Initialisation
    ClearCalculator
    
    ' Configuration de l'affichage
    lblDisplay.BackColor = RGB(0, 0, 0)
    lblDisplay.ForeColor = RGB(0, 255, 0)
    
    history = "Démarrage de la calculatrice" & vbCrLf
    UpdateHistory
End Sub

Private Sub cmdNumber_Click(Index As Integer)
    Dim numberStr As String
    
    If Index = 10 Then  ' Point décimal
        numberStr = "."
        If InStr(lblDisplay.Caption, ".") > 0 Then Exit Sub
        If newNumber Then
            lblDisplay.Caption = "0."
            newNumber = False
        Else
            lblDisplay.Caption = lblDisplay.Caption & "."
        End If
    Else  ' Chiffres 0-9
        numberStr = CStr(Index)
        If newNumber Or lblDisplay.Caption = "0" Then
            lblDisplay.Caption = numberStr
            newNumber = False
        Else
            lblDisplay.Caption = lblDisplay.Caption & numberStr
        End If
    End If
    
    currentValue = Val(lblDisplay.Caption)
    lblOperation.Caption = lblDisplay.Caption
End Sub

Private Sub cmdOperation_Click(Index As Integer)
    Dim operation As String
    
    Select Case Index
        Case 0: operation = "+"
        Case 1: operation = "-"
        Case 2: operation = "*"
        Case 3: operation = "/"
    End Select
    
    ' Effectuer le calcul précédent si nécessaire
    If currentOperation <> "" And Not newNumber Then
        PerformCalculation
    End If
    
    previousValue = currentValue
    currentOperation = operation
    newNumber = True
    
    lblOperation.Caption = Format(previousValue, "0.########") & " " & operation
    
    ' Ajouter à l'historique
    history = history & Format(previousValue, "0.########") & " " & operation & " "
End Sub

Private Sub cmdEquals_Click()
    If currentOperation <> "" Then
        PerformCalculation
        
        ' Ajouter à l'historique
        history = history & Format(currentValue, "0.########") & " = " & Format(lblDisplay.Caption, "0.########") & vbCrLf
        UpdateHistory
        
        currentOperation = ""
        newNumber = True
        lblOperation.Caption = "= " & lblDisplay.Caption
    End If
End Sub

Private Sub PerformCalculation()
    Dim result As Double
    
    On Error GoTo ErrorHandler
    
    Select Case currentOperation
        Case "+"
            result = previousValue + currentValue
        Case "-"
            result = previousValue - currentValue
        Case "*"
            result = previousValue * currentValue
        Case "/"
            If currentValue = 0 Then
                MsgBox "Erreur: Division par zéro!", vbCritical, "Erreur"
                ClearCalculator
                Exit Sub
            End If
            result = previousValue / currentValue
    End Select
    
    lblDisplay.Caption = Format(result, "0.########")
    currentValue = result
    Exit Sub
    
ErrorHandler:
    MsgBox "Erreur de calcul: " & Err.Description, vbCritical, "Erreur"
    ClearCalculator
End Sub

Private Sub cmdClear_Click()
    ClearCalculator
    history = history & "--- Effacement ---" & vbCrLf
    UpdateHistory
End Sub

Private Sub ClearCalculator()
    currentValue = 0
    previousValue = 0
    currentOperation = ""
    newNumber = True
    lblDisplay.Caption = "0"
    lblOperation.Caption = "0"
End Sub

Private Sub UpdateHistory()
    ' Garder seulement les 5 dernières lignes
    Dim lines() As String
    Dim i As Integer
    Dim displayText As String
    
    lines = Split(history, vbCrLf)
    
    If UBound(lines) > 4 Then
        displayText = ""
        For i = UBound(lines) - 4 To UBound(lines)
            If lines(i) <> "" Then
                displayText = displayText & lines(i) & vbCrLf
            End If
        Next i
        lblHistory.Caption = displayText
    Else
        lblHistory.Caption = history
    End If
End Sub

Private Sub Form_KeyPress(KeyAscii As Integer)
    ' Support du clavier
    Select Case Chr(KeyAscii)
        Case "0" To "9"
            cmdNumber_Click(Val(Chr(KeyAscii)))
        Case "+"
            cmdOperation_Click(0)
        Case "-"
            cmdOperation_Click(1)
        Case "*"
            cmdOperation_Click(2)
        Case "/"
            cmdOperation_Click(3)
        Case ".", ","
            cmdNumber_Click(10)
        Case Chr(13), "="  ' Entrée ou =
            cmdEquals_Click
        Case Chr(27), "c", "C"  ' Escape ou C
            cmdClear_Click
    End Select
End Sub

Private Sub lblDisplay_DblClick()
    ' Fonction bonus - test de la mémoire
    Static memoryValue As Double
    Static hasMemory As Boolean
    
    If hasMemory Then
        lblDisplay.Caption = Format(memoryValue, "0.########")
        currentValue = memoryValue
        MsgBox "Valeur récupérée de la mémoire: " & memoryValue, vbInformation
    Else
        memoryValue = currentValue
        hasMemory = True
        MsgBox "Valeur sauvée en mémoire: " & memoryValue, vbInformation
    End If
End Sub