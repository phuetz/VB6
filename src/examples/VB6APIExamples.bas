' VB6 API Examples - Demonstration of Declare Function and external API calls
' This file shows various Windows API declarations and their usage in web environment

Option Explicit

' ===== USER32.DLL API Declarations =====

' MessageBox API for displaying dialog boxes
Declare Function MessageBox Lib "user32" Alias "MessageBoxA" ( _
    ByVal hwnd As Long, _
    ByVal lpText As String, _
    ByVal lpCaption As String, _
    ByVal wType As Long _
) As Long

' FindWindow API for finding windows by class name or title
Declare Function FindWindow Lib "user32" Alias "FindWindowA" ( _
    ByVal lpClassName As String, _
    ByVal lpWindowName As String _
) As Long

' GetWindowText API for retrieving window title
Declare Function GetWindowText Lib "user32" Alias "GetWindowTextA" ( _
    ByVal hwnd As Long, _
    ByVal lpString As String, _
    ByVal nMaxCount As Long _
) As Long

' GetCursorPos API for getting mouse cursor position
Declare Function GetCursorPos Lib "user32" ( _
    lpPoint As POINTAPI _
) As Long

' ===== KERNEL32.DLL API Declarations =====

' GetTickCount API for getting system uptime
Declare Function GetTickCount Lib "kernel32" () As Long

' Sleep API for pausing execution
Declare Sub Sleep Lib "kernel32" ( _
    ByVal dwMilliseconds As Long _
)

' GetComputerName API for getting computer name
Declare Function GetComputerName Lib "kernel32" Alias "GetComputerNameA" ( _
    ByVal lpBuffer As String, _
    nSize As Long _
) As Long

' GetUserName API for getting current user name
Declare Function GetUserName Lib "kernel32" Alias "GetUserNameA" ( _
    ByVal lpBuffer As String, _
    nSize As Long _
) As Long

' GetTempPath API for getting temporary directory path
Declare Function GetTempPath Lib "kernel32" Alias "GetTempPathA" ( _
    ByVal nBufferLength As Long, _
    ByVal lpBuffer As String _
) As Long

' ===== SHELL32.DLL API Declarations =====

' ShellExecute API for launching programs and opening files
Declare Function ShellExecute Lib "shell32" Alias "ShellExecuteA" ( _
    ByVal hwnd As Long, _
    ByVal lpOperation As String, _
    ByVal lpFile As String, _
    ByVal lpParameters As String, _
    ByVal lpDirectory As String, _
    ByVal nShowCmd As Long _
) As Long

' ===== ADVAPI32.DLL API Declarations (Registry) =====

' RegOpenKeyEx API for opening registry keys
Declare Function RegOpenKeyEx Lib "advapi32" Alias "RegOpenKeyExA" ( _
    ByVal hKey As Long, _
    ByVal lpSubKey As String, _
    ByVal ulOptions As Long, _
    ByVal samDesired As Long, _
    phkResult As Long _
) As Long

' RegQueryValueEx API for reading registry values
Declare Function RegQueryValueEx Lib "advapi32" Alias "RegQueryValueExA" ( _
    ByVal hKey As Long, _
    ByVal lpValueName As String, _
    ByVal lpReserved As Long, _
    lpType As Long, _
    ByVal lpData As String, _
    lpcbData As Long _
) As Long

' RegSetValueEx API for writing registry values
Declare Function RegSetValueEx Lib "advapi32" Alias "RegSetValueExA" ( _
    ByVal hKey As Long, _
    ByVal lpValueName As String, _
    ByVal Reserved As Long, _
    ByVal dwType As Long, _
    ByVal lpData As String, _
    ByVal cbData As Long _
) As Long

' RegCloseKey API for closing registry keys
Declare Function RegCloseKey Lib "advapi32" ( _
    ByVal hKey As Long _
) As Long

' ===== GDI32.DLL API Declarations =====

' GetPixel API for getting pixel color
Declare Function GetPixel Lib "gdi32" ( _
    ByVal hdc As Long, _
    ByVal x As Long, _
    ByVal y As Long _
) As Long

' SetPixel API for setting pixel color
Declare Function SetPixel Lib "gdi32" ( _
    ByVal hdc As Long, _
    ByVal x As Long, _
    ByVal y As Long, _
    ByVal color As Long _
) As Long

' ===== Type Definitions =====

Type POINTAPI
    x As Long
    y As Long
End Type

' ===== API Usage Examples =====

Public Sub TestMessageBoxAPI()
    ' Test MessageBox API with different button types
    Dim result As Long
    
    ' Simple OK message box
    result = MessageBox(0, "Hello from VB6 API!", "Information", MB_OK Or MB_ICONINFORMATION)
    
    ' Yes/No question
    result = MessageBox(0, "Do you want to continue?", "Question", MB_YESNO Or MB_ICONQUESTION)
    If result = IDYES Then
        MessageBox 0, "You clicked Yes!", "Result", MB_OK
    Else
        MessageBox 0, "You clicked No!", "Result", MB_OK
    End If
End Sub

Public Sub TestSystemInfoAPIs()
    Dim computerName As String
    Dim userName As String
    Dim tempPath As String
    Dim buffer As String
    Dim bufferSize As Long
    Dim tickCount As Long
    
    ' Get computer name
    buffer = Space$(256)
    bufferSize = 256
    If GetComputerName(buffer, bufferSize) <> 0 Then
        computerName = Left$(buffer, bufferSize)
        MessageBox 0, "Computer Name: " & computerName, "System Info", MB_OK
    End If
    
    ' Get user name
    buffer = Space$(256)
    bufferSize = 256
    If GetUserName(buffer, bufferSize) <> 0 Then
        userName = Left$(buffer, bufferSize)
        MessageBox 0, "User Name: " & userName, "System Info", MB_OK
    End If
    
    ' Get temporary path
    buffer = Space$(256)
    If GetTempPath(256, buffer) > 0 Then
        tempPath = Left$(buffer, InStr(buffer, Chr$(0)) - 1)
        MessageBox 0, "Temp Path: " & tempPath, "System Info", MB_OK
    End If
    
    ' Get system uptime
    tickCount = GetTickCount()
    MessageBox 0, "System Uptime: " & Format$(tickCount / 1000, "0.0") & " seconds", "System Info", MB_OK
End Sub

Public Sub TestWindowAPI()
    Dim hwnd As Long
    Dim windowTitle As String
    Dim buffer As String
    
    ' Find Notepad window
    hwnd = FindWindow("Notepad", vbNullString)
    If hwnd <> 0 Then
        ' Get window title
        buffer = Space$(256)
        If GetWindowText(hwnd, buffer, 256) > 0 Then
            windowTitle = Left$(buffer, InStr(buffer, Chr$(0)) - 1)
            MessageBox 0, "Found Notepad: " & windowTitle, "Window Info", MB_OK
        End If
    Else
        MessageBox 0, "Notepad window not found", "Window Info", MB_OK
    End If
End Sub

Public Sub TestMousePosition()
    Dim mousePos As POINTAPI
    Dim result As Long
    
    ' Get current mouse cursor position
    result = GetCursorPos(mousePos)
    If result <> 0 Then
        MessageBox 0, "Mouse Position: X=" & mousePos.x & ", Y=" & mousePos.y, "Mouse Info", MB_OK
    End If
End Sub

Public Sub TestShellExecuteAPI()
    Dim result As Long
    
    ' Open a website
    result = ShellExecute(0, "open", "https://www.example.com", vbNullString, vbNullString, SW_SHOWNORMAL)
    If result > 32 Then
        MessageBox 0, "Website opened successfully!", "ShellExecute", MB_OK
    Else
        MessageBox 0, "Failed to open website. Error: " & result, "ShellExecute", MB_OK
    End If
    
    ' Open Calculator (if available)
    result = ShellExecute(0, "open", "calc.exe", vbNullString, vbNullString, SW_SHOWNORMAL)
    If result > 32 Then
        MessageBox 0, "Calculator opened successfully!", "ShellExecute", MB_OK
    Else
        MessageBox 0, "Failed to open Calculator. Error: " & result, "ShellExecute", MB_OK
    End If
End Sub

Public Sub TestRegistryAPI()
    Dim hKey As Long
    Dim result As Long
    Dim dataType As Long
    Dim dataSize As Long
    Dim buffer As String
    
    ' Open HKEY_CURRENT_USER\Software
    result = RegOpenKeyEx(HKEY_CURRENT_USER, "Software", 0, KEY_READ, hKey)
    If result = 0 Then
        MessageBox 0, "Successfully opened registry key!", "Registry", MB_OK
        
        ' Try to read a value (this is just an example)
        buffer = Space$(256)
        dataSize = 256
        result = RegQueryValueEx(hKey, "Test", 0, dataType, buffer, dataSize)
        
        ' Close the key
        RegCloseKey hKey
    Else
        MessageBox 0, "Failed to open registry key. Error: " & result, "Registry", MB_OK
    End If
End Sub

Public Sub TestSleepAPI()
    MessageBox 0, "About to sleep for 2 seconds...", "Sleep Test", MB_OK
    
    ' Sleep for 2000 milliseconds (2 seconds)
    Sleep 2000
    
    MessageBox 0, "Sleep completed!", "Sleep Test", MB_OK
End Sub

Public Sub RunAllAPITests()
    ' Main test routine that runs all API examples
    MessageBox 0, "Starting VB6 API Tests...", "API Test Suite", MB_OK
    
    ' Run individual tests
    TestMessageBoxAPI
    TestSystemInfoAPIs
    TestWindowAPI
    TestMousePosition
    TestShellExecuteAPI
    TestRegistryAPI
    TestSleepAPI
    
    MessageBox 0, "All API tests completed!", "API Test Suite", MB_OK
End Sub