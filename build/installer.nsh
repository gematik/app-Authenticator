!macro customRemoveFiles
   CreateDirectory "$TEMP\${PRODUCT_NAME}\backup\certs-konnektor"
   CopyFiles /SILENT "$INSTDIR\resources\certs-konnektor\*.*" "$TEMP\${PRODUCT_NAME}\backup\certs-konnektor"
   CreateDirectory "$TEMP\${PRODUCT_NAME}\backup\certs-idp"
   CopyFiles /SILENT "$INSTDIR\resources\certs-idp\*.*" "$TEMP\${PRODUCT_NAME}\backup\certs-idp"

   Delete "$INSTDIR\resources\app.asar"
   Delete "$INSTDIR\resources\app-update.yml"
   Delete "$INSTDIR\resources\elevate.exe"
   Delete "$INSTDIR\resources\test-cases-config.json"
   Delete "$INSTDIR\resources\app.asar"
   Delete "$INSTDIR\resources\app-update.yml"
   Delete "$INSTDIR\resources\elevate.exe"
   Delete "$INSTDIR\resources\test-cases-config.json"
   Delete "$INSTDIR\resources\app.asar"
   Delete "$INSTDIR\resources\app-update.yml"
   Delete "$INSTDIR\resources\elevate.exe"
   Delete "$INSTDIR\resources\test-cases-config.json"

   RmDir /r "$INSTDIR\resources"
   RmDir /r "$INSTDIR\locales"

   Delete "$INSTDIR\chrome_100_percent.pak"
   Delete "$INSTDIR\chrome_200_percent.pak"
   Delete "$INSTDIR\d3dcompiler_47.dll"
   Delete "$INSTDIR\ffmpeg.dll"
   Delete "$INSTDIR\gematik Authenticator.exe"
   Delete "$INSTDIR\icudtl.dat"
   Delete "$INSTDIR\libEGL.dll"
   Delete "$INSTDIR\libGLESv2.dll"
   Delete "$INSTDIR\LICENSE.electron.txt"
   Delete "$INSTDIR\LICENSES.chromium.html"
   Delete "$INSTDIR\resources.pak"
   Delete "$INSTDIR\snapshot_blob.bin"
   Delete "$INSTDIR\v8_context_snapshot.bin"
   Delete "$INSTDIR\vk_swiftshader.dll"
   Delete "$INSTDIR\vk_swiftshader_icd.json"
   Delete "$INSTDIR\vulkan-1.dll"
   Delete "$INSTDIR\dxcompiler.dll"
   Delete "$INSTDIR\dxil.dll"
   Delete "$INSTDIR\Uninstall gematik Authenticator.exe"

   Delete "$INSTDIR\chrome_100_percent.pak"
   Delete "$INSTDIR\chrome_200_percent.pak"
   Delete "$INSTDIR\d3dcompiler_47.dll"
   Delete "$INSTDIR\ffmpeg.dll"
   Delete "$INSTDIR\gematik Authenticator.exe"
   Delete "$INSTDIR\icudtl.dat"
   Delete "$INSTDIR\libEGL.dll"
   Delete "$INSTDIR\libGLESv2.dll"
   Delete "$INSTDIR\LICENSE.electron.txt"
   Delete "$INSTDIR\LICENSES.chromium.html"
   Delete "$INSTDIR\resources.pak"
   Delete "$INSTDIR\snapshot_blob.bin"
   Delete "$INSTDIR\v8_context_snapshot.bin"
   Delete "$INSTDIR\vk_swiftshader.dll"
   Delete "$INSTDIR\vk_swiftshader_icd.json"
   Delete "$INSTDIR\vulkan-1.dll"
   Delete "$INSTDIR\dxcompiler.dll"
   Delete "$INSTDIR\dxil.dll"
   Delete "$INSTDIR\Uninstall gematik Authenticator.exe"

   Delete "$INSTDIR\chrome_100_percent.pak"
   Delete "$INSTDIR\chrome_200_percent.pak"
   Delete "$INSTDIR\d3dcompiler_47.dll"
   Delete "$INSTDIR\ffmpeg.dll"
   Delete "$INSTDIR\gematik Authenticator.exe"
   Delete "$INSTDIR\icudtl.dat"
   Delete "$INSTDIR\libEGL.dll"
   Delete "$INSTDIR\libGLESv2.dll"
   Delete "$INSTDIR\LICENSE.electron.txt"
   Delete "$INSTDIR\LICENSES.chromium.html"
   Delete "$INSTDIR\resources.pak"
   Delete "$INSTDIR\snapshot_blob.bin"
   Delete "$INSTDIR\v8_context_snapshot.bin"
   Delete "$INSTDIR\vk_swiftshader.dll"
   Delete "$INSTDIR\vk_swiftshader_icd.json"
   Delete "$INSTDIR\vulkan-1.dll"
   Delete "$INSTDIR\dxcompiler.dll"
   Delete "$INSTDIR\dxil.dll"
   Delete "$INSTDIR\Uninstall gematik Authenticator.exe"

   SetOutPath $TEMP
   RmDir "$INSTDIR"
!macroend

; Compile-time variable to check if the RU PEM files exist
!system 'if exist "${PROJECT_DIR}\src\assets\certs-konnektor\ru\*.pem" (echo !define RU_PEM_EXISTS) else (echo ; )'

!macro customInstall
  CreateDirectory "$INSTDIR\resources\certs-konnektor"
  CopyFiles /SILENT "$TEMP\${PRODUCT_NAME}\backup\certs-konnektor\*.*" "$INSTDIR\resources\certs-konnektor"
  SetOutPath "$INSTDIR\resources\certs-konnektor"
  SetOverwrite ifnewer
  File /nonfatal /r ${PROJECT_DIR}\src\assets\certs-konnektor\pu\*.pem
  !ifdef RU_PEM_EXISTS
    File /nonfatal /r ${PROJECT_DIR}\src\assets\certs-konnektor\ru\*.pem
  !endif

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

  ; Delete not needed Direct3D-API / DirectX DLL
  Delete "$INSTDIR\d3dcompiler_47.dll"
!macroend


