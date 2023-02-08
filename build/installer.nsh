!macro customInstall
  CreateDirectory "$INSTDIR\resources\certs-konnektor"
  SetOutPath "$INSTDIR\resources\certs-konnektor"
  File /r ${PROJECT_DIR}\src\assets\certs-konnektor\ca\pu\rsa\*.pem
  
  CreateDirectory "$INSTDIR\resources\certs-idp"
  SetOutPath "$INSTDIR\resources\certs-idp"
  File /r ${PROJECT_DIR}\src\assets\certs-idp\*.*

  SetOutPath "$INSTDIR\resources"
  File /r ${PROJECT_DIR}\src\assets\test-cases-config.json

  CreateDirectory "$PROFILE\AppData\Local\${PRODUCT_NAME}"
  CreateDirectory "$PROFILE\AppData\Local\${PRODUCT_NAME}\resources\certs-konnektor"
  CreateDirectory "$PROFILE\AppData\Local\${PRODUCT_NAME}\resources\certs-idp"
  CreateDirectory "$PROFILE\AppData\Local\gematik Authenticator-updater"
  CreateDirectory "$PROFILE\AppData\Roaming\${PRODUCT_NAME}"
!macroend

