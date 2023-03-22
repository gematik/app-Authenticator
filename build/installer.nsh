!macro customRemoveFiles
   CreateDirectory "$TEMP\${PRODUCT_NAME}\backup\certs-konnektor"
   CopyFiles /SILENT "$INSTDIR\resources\certs-konnektor\*.*" "$TEMP\${PRODUCT_NAME}\backup\certs-konnektor"
   CreateDirectory "$TEMP\${PRODUCT_NAME}\backup\certs-idp"
   CopyFiles /SILENT "$INSTDIR\resources\certs-idp\*.*" "$TEMP\${PRODUCT_NAME}\backup\certs-idp"
!macroend

!macro customInstall
  CreateDirectory "$INSTDIR\resources\certs-konnektor"
  CopyFiles /SILENT "$TEMP\${PRODUCT_NAME}\backup\certs-konnektor\*.*" "$INSTDIR\resources\certs-konnektor"
  SetOutPath "$INSTDIR\resources\certs-konnektor"
  SetOverwrite ifnewer
  File /r ${PROJECT_DIR}\src\assets\certs-konnektor\ca\pu\rsa\*.pem
  
  CreateDirectory "$INSTDIR\resources\certs-idp"
  CopyFiles /SILENT "$TEMP\${PRODUCT_NAME}\backup\certs-idp\*.*" "$INSTDIR\resources\certs-idp"
  SetOutPath "$INSTDIR\resources\certs-idp"
  SetOverwrite ifnewer
  File /r ${PROJECT_DIR}\src\assets\certs-idp\*.*

  SetOutPath "$INSTDIR\resources"
  File /r ${PROJECT_DIR}\src\assets\test-cases-config.json

  CreateDirectory "$PROFILE\AppData\Local\${PRODUCT_NAME}"
  ; Delete the created Temp Backup Folder
  RMDir /r "$TEMP\${PRODUCT_NAME}"
!macroend

