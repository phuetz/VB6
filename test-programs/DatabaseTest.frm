VERSION 5.00
Object = "{CDE57A40-8B86-11D0-B3C6-00A0C90AEA82}#1.0#0"; "MSDATGRD.OCX"
Object = "{F0D2F211-CCB0-11D0-A316-00AA00688B10}#1.0#0"; "MSDATLST.OCX"
Begin VB.Form frmDatabase 
   Caption         =   "Test Base de Données - VB6 Web IDE"
   ClientHeight    =   6540
   ClientLeft      =   60
   ClientTop       =   345
   ClientWidth     =   8175
   LinkTopic       =   "Form1"
   ScaleHeight     =   6540
   ScaleWidth      =   8175
   StartUpPosition =   2  'CenterScreen
   Begin VB.Frame frameControls 
      Caption         =   "Contrôles"
      Height          =   1215
      Left            =   120
      TabIndex        =   11
      Top             =   5160
      Width           =   7935
      Begin VB.CommandButton cmdTest 
         Caption         =   "&Test Connexion"
         Height          =   375
         Left            =   6480
         TabIndex        =   16
         Top             =   720
         Width           =   1335
      End
      Begin VB.CommandButton cmdExport 
         Caption         =   "&Exporter"
         Height          =   375
         Left            =   5040
         TabIndex        =   15
         Top             =   720
         Width           =   1335
      End
      Begin VB.CommandButton cmdDelete 
         Caption         =   "&Supprimer"
         Height          =   375
         Left            =   3600
         TabIndex        =   14
         Top             =   720
         Width           =   1335
      End
      Begin VB.CommandButton cmdUpdate 
         Caption         =   "&Modifier"
         Height          =   375
         Left            =   2160
         TabIndex        =   13
         Top             =   720
         Width           =   1335
      End
      Begin VB.CommandButton cmdAdd 
         Caption         =   "&Ajouter"
         Height          =   375
         Left            =   720
         TabIndex        =   12
         Top             =   720
         Width           =   1335
      End
      Begin VB.TextBox txtSearch 
         Height          =   285
         Left            =   1080
         TabIndex        =   18
         Top             =   360
         Width           =   2415
      End
      Begin VB.Label lblSearch 
         Caption         =   "Recherche:"
         Height          =   255
         Left            =   240
         TabIndex        =   17
         Top             =   360
         Width           =   855
      End
   End
   Begin VB.Frame frameData 
      Caption         =   "Saisie des Données"
      Height          =   1455
      Left            =   120
      TabIndex        =   4
      Top             =   3600
      Width           =   7935
      Begin VB.TextBox txtEmail 
         Height          =   285
         Left            =   4080
         TabIndex        =   10
         Top             =   960
         Width           =   3615
      End
      Begin VB.TextBox txtPhone 
         Height          =   285
         Left            =   1080
         TabIndex        =   9
         Top             =   960
         Width           =   2175
      End
      Begin VB.TextBox txtCity 
         Height          =   285
         Left            =   4080
         TabIndex        =   8
         Top             =   600
         Width           =   3615
      End
      Begin VB.TextBox txtLastName 
         Height          =   285
         Left            =   4080
         TabIndex        =   7
         Top             =   240
         Width           =   3615
      End
      Begin VB.TextBox txtFirstName 
         Height          =   285
         Left            =   1080
         TabIndex        =   6
         Top             =   600
         Width           =   2175
      End
      Begin VB.TextBox txtID 
         Enabled         =   0   'False
         Height          =   285
         Left            =   1080
         TabIndex        =   5
         Top             =   240
         Width           =   855
      End
      Begin VB.Label lblEmail 
         Caption         =   "Email:"
         Height          =   255
         Left            =   3360
         TabIndex        =   26
         Top             =   960
         Width           =   615
      End
      Begin VB.Label lblPhone 
         Caption         =   "Téléphone:"
         Height          =   255
         Left            =   240
         TabIndex        =   25
         Top             =   960
         Width           =   855
      End
      Begin VB.Label lblCity 
         Caption         =   "Ville:"
         Height          =   255
         Left            =   3360
         TabIndex        =   24
         Top             =   600
         Width           =   615
      End
      Begin VB.Label lblLastName 
         Caption         =   "Nom:"
         Height          =   255
         Left            =   3360
         TabIndex        =   23
         Top             =   240
         Width           =   615
      End
      Begin VB.Label lblFirstName 
         Caption         =   "Prénom:"
         Height          =   255
         Left            =   240
         TabIndex        =   22
         Top             =   600
         Width           =   855
      End
      Begin VB.Label lblID 
         Caption         =   "ID:"
         Height          =   255
         Left            =   240
         TabIndex        =   21
         Top             =   240
         Width           =   615
      End
   End
   Begin MSDataListLib.DataList dlCustomers 
      Height          =   1140
      Left            =   4200
      TabIndex        =   3
      Top             =   2280
      Width           =   3855
      _ExtentX        =   6800
      _ExtentY        =   2011
      _Version        =   393216
      BackColor       =   16777215
      ForeColor       =   0
      SelectionStart  =   0
      SelectionEnd    =   0
   End
   Begin MSDataGridLib.DataGrid dgCustomers 
      Height          =   1695
      Left            =   120
      TabIndex        =   2
      Top             =   840
      Width           =   7935
      _ExtentX        =   14002
      _ExtentY        =   2990
      _Version        =   393216
      AllowUpdate     =   0   'False
      HeadLines       =   1
      RowHeight       =   15
      BeginProperty HeadFont {0BE35203-8F91-11CE-9DE3-00AA004BB851} 
         Name            =   "MS Sans Serif"
         Size            =   8.25
         Charset         =   0
         Weight          =   400
         Underline       =   0   'False
         Italic          =   0   'False
         Strikethrough   =   0   'False
      EndProperty
      BeginProperty Font {0BE35203-8F91-11CE-9DE3-00AA004BB851} 
         Name            =   "MS Sans Serif"
         Size            =   8.25
         Charset         =   0
         Weight          =   400
         Underline       =   0   'False
         Italic          =   0   'False
         Strikethrough   =   0   'False
      EndProperty
      ColumnCount     =   2
      BeginProperty Column00 
         DataField       =   ""
         Caption         =   ""
         BeginProperty DataFormat {6D835690-900B-11D0-9484-00A0C91110ED} 
            Type            =   0
            Format          =   ""
            HaveTrueFalseNull=   0
            FirstDayOfWeek  =   0
            FirstWeekOfYear =   0
            LCID            =   1036
            SubFormatType   =   0
         EndProperty
      EndProperty
      BeginProperty Column01 
         DataField       =   ""
         Caption         =   ""
         BeginProperty DataFormat {6D835690-900B-11D0-9484-00A0C91110ED} 
            Type            =   0
            Format          =   ""
            HaveTrueFalseNull=   0
            FirstDayOfWeek  =   0
            FirstWeekOfYear =   0
            LCID            =   1036
            SubFormatType   =   0
         EndProperty
      EndProperty
      SplitCount      =   1
      BeginProperty Split0 
         BeginProperty Column00 
         EndProperty
         BeginProperty Column01 
         EndProperty
      EndProperty
   End
   Begin VB.Label lblStatus 
      BorderStyle     =   1  'Fixed Single
      Caption         =   "Prêt - Base de données simulée"
      Height          =   255
      Left            =   120
      TabIndex        =   20
      Top             =   6240
      Width           =   7935
   End
   Begin VB.Label lblCustomerList 
      Caption         =   "Liste des Clients:"
      Height          =   255
      Left            =   4200
      TabIndex        =   19
      Top             =   2040
      Width           =   1575
   End
   Begin VB.Label lblDataGrid 
      Caption         =   "Données des Clients:"
      Height          =   255
      Left            =   120
      TabIndex        =   1
      Top             =   600
      Width           =   1815
   End
   Begin VB.Label lblTitle 
      Alignment       =   2  'Center
      Caption         =   "Test de Base de Données - VB6 Web IDE"
      BeginProperty Font 
         Name            =   "Arial"
         Size            =   14
         Charset         =   0
         Weight          =   700
         Underline       =   0   'False
         Italic          =   0   'False
         Strikethrough   =   0   'False
      EndProperty
      ForeColor       =   &H00FF0000&
      Height          =   375
      Left            =   120
      TabIndex        =   0
      Top             =   120
      Width           =   7935
   End
End
Attribute VB_Name = "frmDatabase"
Attribute VB_GlobalNameSpace = False
Attribute VB_Creatable = False
Attribute VB_PredeclaredId = True
Attribute VB_Exposed = False

'**************************************************
' Test de Base de Données pour VB6 Web IDE
' Teste les contrôles DataGrid, DataList et ADO
'**************************************************

Private Type Customer
    ID As Long
    FirstName As String
    LastName As String
    City As String
    Phone As String
    Email As String
End Type

Private customers() As Customer
Private customerCount As Long
Private currentCustomer As Long

Private Sub Form_Load()
    Me.Caption = "Test Base de Données - VB6 Web IDE"
    
    ' Initialiser les données de test
    InitializeTestData
    
    ' Configurer les contrôles
    SetupControls
    
    ' Charger les données
    LoadCustomerData
    
    lblStatus.Caption = "Base de données initialisée - " & customerCount & " clients chargés"
End Sub

Private Sub InitializeTestData()
    ' Créer des données de test
    customerCount = 10
    ReDim customers(1 To customerCount)
    
    ' Client 1
    customers(1).ID = 1
    customers(1).FirstName = "Jean"
    customers(1).LastName = "Dupont"
    customers(1).City = "Paris"
    customers(1).Phone = "01.23.45.67.89"
    customers(1).Email = "jean.dupont@email.com"
    
    ' Client 2
    customers(2).ID = 2
    customers(2).FirstName = "Marie"
    customers(2).LastName = "Martin"
    customers(2).City = "Lyon"
    customers(2).Phone = "04.12.34.56.78"
    customers(2).Email = "marie.martin@email.com"
    
    ' Client 3
    customers(3).ID = 3
    customers(3).FirstName = "Pierre"
    customers(3).LastName = "Durand"
    customers(3).City = "Marseille"
    customers(3).Phone = "04.98.76.54.32"
    customers(3).Email = "pierre.durand@email.com"
    
    ' Client 4
    customers(4).ID = 4
    customers(4).FirstName = "Sophie"
    customers(4).LastName = "Bernard"
    customers(4).City = "Toulouse"
    customers(4).Phone = "05.11.22.33.44"
    customers(4).Email = "sophie.bernard@email.com"
    
    ' Client 5
    customers(5).ID = 5
    customers(5).FirstName = "Michel"
    customers(5).LastName = "Petit"
    customers(5).City = "Nice"
    customers(5).Phone = "04.55.66.77.88"
    customers(5).Email = "michel.petit@email.com"
    
    ' Clients 6-10 générés automatiquement
    Dim i As Long
    For i = 6 To customerCount
        customers(i).ID = i
        customers(i).FirstName = "Client" & i
        customers(i).LastName = "Test" & i
        customers(i).City = "Ville" & i
        customers(i).Phone = "0" & i & ".12.34.56.78"
        customers(i).Email = "client" & i & "@test.com"
    Next i
End Sub

Private Sub SetupControls()
    ' Configuration du DataGrid
    With dgCustomers
        .AllowAddNew = False
        .AllowDelete = False
        .AllowUpdate = False
        .BackColor = RGB(255, 255, 255)
        .HeadBackColor = RGB(192, 192, 192)
    End With
    
    ' Configuration de la DataList
    With dlCustomers
        .BackColor = RGB(255, 255, 255)
    End With
End Sub

Private Sub LoadCustomerData()
    ' Simuler le chargement des données dans le DataGrid
    ' En réalité, ceci utiliserait ADO ou DAO
    
    Dim i As Long
    Dim dataString As String
    
    ' Construire une chaîne de données simulée
    dataString = "ID" & vbTab & "Prénom" & vbTab & "Nom" & vbTab & "Ville" & vbTab & "Téléphone" & vbTab & "Email" & vbCrLf
    
    For i = 1 To customerCount
        dataString = dataString & customers(i).ID & vbTab & _
                     customers(i).FirstName & vbTab & _
                     customers(i).LastName & vbTab & _
                     customers(i).City & vbTab & _
                     customers(i).Phone & vbTab & _
                     customers(i).Email & vbCrLf
    Next i
    
    ' Charger la DataList
    dlCustomers.Clear
    For i = 1 To customerCount
        dlCustomers.AddItem customers(i).LastName & ", " & customers(i).FirstName & " (" & customers(i).City & ")"
    Next i
    
    ' Sélectionner le premier élément
    If customerCount > 0 Then
        dlCustomers.ListIndex = 0
        LoadCustomerDetails 1
    End If
End Sub

Private Sub LoadCustomerDetails(customerID As Long)
    If customerID >= 1 And customerID <= customerCount Then
        txtID.Text = CStr(customers(customerID).ID)
        txtFirstName.Text = customers(customerID).FirstName
        txtLastName.Text = customers(customerID).LastName
        txtCity.Text = customers(customerID).City
        txtPhone.Text = customers(customerID).Phone
        txtEmail.Text = customers(customerID).Email
        currentCustomer = customerID
    End If
End Sub

Private Sub dlCustomers_Click()
    If dlCustomers.ListIndex >= 0 Then
        LoadCustomerDetails dlCustomers.ListIndex + 1
    End If
End Sub

Private Sub cmdAdd_Click()
    ' Ajouter un nouveau client
    ClearFields
    txtFirstName.SetFocus
    lblStatus.Caption = "Mode ajout - Saisissez les informations du nouveau client"
End Sub

Private Sub cmdUpdate_Click()
    ' Modifier le client actuel
    If currentCustomer > 0 Then
        With customers(currentCustomer)
            .FirstName = txtFirstName.Text
            .LastName = txtLastName.Text
            .City = txtCity.Text
            .Phone = txtPhone.Text
            .Email = txtEmail.Text
        End With
        
        LoadCustomerData
        lblStatus.Caption = "Client " & currentCustomer & " modifié avec succès"
        MsgBox "Client modifié avec succès!", vbInformation, "Modification"
    End If
End Sub

Private Sub cmdDelete_Click()
    ' Supprimer le client actuel
    If currentCustomer > 0 Then
        Dim response As Integer
        response = MsgBox("Êtes-vous sûr de vouloir supprimer ce client?" & vbCrLf & _
                         customers(currentCustomer).FirstName & " " & customers(currentCustomer).LastName, _
                         vbYesNo + vbQuestion, "Confirmation")
        
        If response = vbYes Then
            ' Simuler la suppression (déplacer les données)
            Dim i As Long
            For i = currentCustomer To customerCount - 1
                customers(i) = customers(i + 1)
                customers(i).ID = i
            Next i
            
            customerCount = customerCount - 1
            ReDim Preserve customers(1 To customerCount)
            
            LoadCustomerData
            lblStatus.Caption = "Client supprimé - " & customerCount & " clients restants"
            MsgBox "Client supprimé avec succès!", vbInformation, "Suppression"
        End If
    End If
End Sub

Private Sub cmdExport_Click()
    ' Exporter les données
    Dim fileName As String
    Dim fileNum As Integer
    Dim i As Long
    
    fileName = App.Path & "\clients_export.txt"
    fileNum = FreeFile
    
    Open fileName For Output As fileNum
    
    Print #fileNum, "=== EXPORT CLIENTS - " & Format(Now, "dd/mm/yyyy hh:nn:ss") & " ==="
    Print #fileNum, ""
    
    For i = 1 To customerCount
        Print #fileNum, "Client #" & customers(i).ID
        Print #fileNum, "Nom: " & customers(i).LastName & ", " & customers(i).FirstName
        Print #fileNum, "Ville: " & customers(i).City
        Print #fileNum, "Téléphone: " & customers(i).Phone
        Print #fileNum, "Email: " & customers(i).Email
        Print #fileNum, "---"
    Next i
    
    Close fileNum
    
    lblStatus.Caption = "Export terminé - " & customerCount & " clients exportés vers " & fileName
    MsgBox "Export terminé!" & vbCrLf & "Fichier: " & fileName, vbInformation, "Export"
End Sub

Private Sub cmdTest_Click()
    ' Test de connexion simulé
    Dim testResult As String
    Dim testTime As Single
    
    lblStatus.Caption = "Test de connexion en cours..."
    DoEvents
    
    ' Simuler un délai de connexion
    testTime = Timer
    Sleep 1000  ' Pause d'1 seconde
    testTime = Timer - testTime
    
    testResult = "Test de connexion réussi!" & vbCrLf & _
                "Serveur: localhost" & vbCrLf & _
                "Base: TestVB6" & vbCrLf & _
                "Temps de réponse: " & Format(testTime, "0.00") & " secondes" & vbCrLf & _
                "Enregistrements: " & customerCount
    
    MsgBox testResult, vbInformation, "Test de Connexion"
    lblStatus.Caption = "Test de connexion terminé - Connexion OK"
End Sub

Private Sub txtSearch_Change()
    ' Recherche en temps réel
    Dim searchText As String
    Dim i As Long
    Dim found As Boolean
    
    searchText = UCase(txtSearch.Text)
    
    If Len(searchText) > 0 Then
        For i = 1 To customerCount
            If InStr(UCase(customers(i).FirstName), searchText) > 0 Or _
               InStr(UCase(customers(i).LastName), searchText) > 0 Or _
               InStr(UCase(customers(i).City), searchText) > 0 Then
                dlCustomers.ListIndex = i - 1
                LoadCustomerDetails i
                found = True
                Exit For
            End If
        Next i
        
        If found Then
            lblStatus.Caption = "Client trouvé: " & customers(i).FirstName & " " & customers(i).LastName
        Else
            lblStatus.Caption = "Aucun client trouvé pour: " & txtSearch.Text
        End If
    Else
        lblStatus.Caption = "Saisissez du texte pour rechercher"
    End If
End Sub

Private Sub ClearFields()
    txtID.Text = ""
    txtFirstName.Text = ""
    txtLastName.Text = ""
    txtCity.Text = ""
    txtPhone.Text = ""
    txtEmail.Text = ""
    currentCustomer = 0
End Sub

Private Sub Form_Unload(Cancel As Integer)
    Dim response As Integer
    response = MsgBox("Voulez-vous sauvegarder les modifications?", vbYesNoCancel, "Fermeture")
    
    Select Case response
        Case vbYes
            ' Simuler la sauvegarde
            MsgBox "Données sauvegardées!", vbInformation
        Case vbCancel
            Cancel = 1
    End Select
End Sub