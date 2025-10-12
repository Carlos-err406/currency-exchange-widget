; Custom installer script for Currency Exchange Widget
!include "nsDialogs.nsh"
!include "LogicLib.nsh"

; Variables for custom options
Var Dialog
Var TrayIconRadio
Var DesktopWidgetRadio

; This is the correct macro that electron-builder recognizes
!macro customPageAfterChangeDir
  Page custom myCustomPageShow myCustomPageLeave
!macroend

; Custom page function
Function myCustomPageShow
  nsDialogs::Create 1018
  Pop $Dialog
  
  ${If} $Dialog == error
    Abort
  ${EndIf}
  
  ; Page title
  ${NSD_CreateLabel} 0u 0u 100% 20u "Installation Options"
  Pop $0
  
  ; Description
  ${NSD_CreateLabel} 0u 30u 100% 20u "Choose how you want to use Currency Exchange Widget:"
  Pop $0
  
  ; Tray Icon radio (Recommended - first option)
  ${NSD_CreateRadioButton} 0u 60u 100% 15u "&System tray icon (Recommended)"
  Pop $TrayIconRadio
  ${NSD_Check} $TrayIconRadio ; Default selected
  
  ; Desktop Widget radio
  ${NSD_CreateRadioButton} 0u 80u 100% 15u "&Desktop widget"
  Pop $DesktopWidgetRadio
  
  nsDialogs::Show
FunctionEnd

; Function to handle leaving the custom page
Function myCustomPageLeave
  ; Get the state of radio buttons
  ${NSD_GetState} $TrayIconRadio $0
  ${NSD_GetState} $DesktopWidgetRadio $1
  
  ; Create user data directory for persistent config
  CreateDirectory "$APPDATA\currency-exchange-widget"
  
  ; Determine which mode to enable based on selection and write to JSON file
  ${If} $0 == 1  ; Tray icon only
    FileOpen $R0 "$APPDATA\currency-exchange-widget\config.json" w
    FileWrite $R0 '{"mode": "tray"}'
    FileClose $R0
  ${ElseIf} $1 == 1  ; Desktop widget only
    FileOpen $R0 "$APPDATA\currency-exchange-widget\config.json" w
    FileWrite $R0 '{"mode": "widget"}'
    FileClose $R0
  ${Else}  ; Default fallback (shouldn't happen)
    FileOpen $R0 "$APPDATA\currency-exchange-widget\config.json" w
    FileWrite $R0 '{"mode": "tray"}'
    FileClose $R0
  ${EndIf}
FunctionEnd