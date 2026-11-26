!macro customHeader
  !define MUI_WELCOMEPAGE_TITLE "Chào mừng đến với trình cài đặt Bản đồ An ninh Trật tự"
  !define MUI_WELCOMEPAGE_TEXT "Phần mềm quản lý bản đồ An ninh Trật tự Phường Bình Minh (Tỉnh Tây Ninh) vận hành độc lập 100% ngoại tuyến.$\r$\n$\r$\n• Nếu máy tính đã cài bản cũ: Trình cài đặt sẽ tự động NÂNG CẤP và giữ nguyên 100% dữ liệu & tài khoản.$\r$\n• Nếu cài đặt lần đầu: Hệ thống sẽ tự động cài đặt bản đồ nền ngoại tuyến độ nét cao.$\r$\n$\r$\nNhấn 'Cài đặt' để tiếp tục."
  !define MUI_FINISHPAGE_TITLE "Cài đặt hoàn tất"
!macroend

!macro customUnInit
  ${ifNot} ${isUpdated}
    MessageBox MB_YESNO|MB_ICONEXCLAMATION|MB_DEFBUTTON2 \
      "CẢNH BÁO GỠ CÀI ĐẶT:$\r$\n$\r$\nKhi gỡ bỏ phần mềm Bản đồ An ninh Trật tự, TOÀN BỘ DỮ LIỆU nghiệp vụ, tài khoản đăng nhập và bản đồ nền trên máy tính này sẽ BỊ XÓA TRẮNG.$\r$\n(Hệ thống chỉ giữ lại thư mục 'backups' chứa các bản sao lưu dự phòng tự động.)$\r$\n$\r$\nBạn có chắc chắn muốn tiếp tục gỡ cài đặt và xóa dữ liệu không?" \
      IDYES +2
    Abort
  ${endIf}
!macroend

!macro customUnInstall
  ${ifNot} ${isUpdated}
    ; BẮT BUỘC đặt SetShellVarContext current để $APPDATA luôn trỏ chính xác vào C:\Users\<User>\AppData\Roaming
    ; (tránh trường hợp NSIS đang ở ngữ cảnh 'all' trỏ nhầm sang C:\ProgramData)
    SetShellVarContext current

    ; 1. Xóa trắng toàn bộ dữ liệu hoạt động trong AppData\Roaming\Bản đồ An ninh Trật tự
    ; CHỈ CHỪA LẠI thư mục "backups" chứa các bản sao lưu dự phòng tự động (.bmsnap)
    StrCpy $R0 "$APPDATA\Bản đồ An ninh Trật tự"
    Delete /REBOOTOK "$R0\auth.vault"
    Delete /REBOOTOK "$R0\gis_security.db"
    Delete /REBOOTOK "$R0\gis_security.db-wal"
    Delete /REBOOTOK "$R0\gis_security.db-shm"
    Delete /REBOOTOK "$R0\phuongbinhminh.mbtiles"
    Delete /REBOOTOK "$R0\data.json"
    Delete /REBOOTOK "$R0\debug_log.txt"
    Delete /REBOOTOK "$R0\*.*"
    RMDir /r "$R0\Cache"
    RMDir /r "$R0\Code Cache"
    RMDir /r "$R0\GPUCache"
    RMDir /r "$R0\DawnGraphiteCache"
    RMDir /r "$R0\DawnWebGPUCache"
    RMDir /r "$R0\Local Storage"
    RMDir /r "$R0\Session Storage"
    RMDir /r "$R0\Network"
    RMDir /r "$R0\Shared Dictionary"
    RMDir /r "$R0\Dictionaries"
    RMDir /r "$R0\blob_storage"
    RMDir /r "$R0\databases"
    RMDir /r "$R0\IndexedDB"
    RMDir /r "$R0\WebStorage"
    RMDir /r "$R0\Crashpad"
    RMDir /r "$R0\Partitions"
    RMDir "$R0"

    ; 2. Dọn tương tự cho thư mục dữ liệu tên cũ (nếu có từ bản thử nghiệm trước), vẫn giữ backups
    StrCpy $R1 "$APPDATA\gis-an-ninh-trat-tu"
    Delete /REBOOTOK "$R1\auth.vault"
    Delete /REBOOTOK "$R1\gis_security.db"
    Delete /REBOOTOK "$R1\gis_security.db-wal"
    Delete /REBOOTOK "$R1\gis_security.db-shm"
    Delete /REBOOTOK "$R1\phuongbinhminh.mbtiles"
    Delete /REBOOTOK "$R1\data.json"
    Delete /REBOOTOK "$R1\debug_log.txt"
    Delete /REBOOTOK "$R1\*.*"
    RMDir /r "$R1\Cache"
    RMDir /r "$R1\Code Cache"
    RMDir /r "$R1\GPUCache"
    RMDir /r "$R1\DawnGraphiteCache"
    RMDir /r "$R1\DawnWebGPUCache"
    RMDir /r "$R1\Local Storage"
    RMDir /r "$R1\Session Storage"
    RMDir /r "$R1\Network"
    RMDir /r "$R1\Shared Dictionary"
    RMDir /r "$R1\Dictionaries"
    RMDir /r "$R1\blob_storage"
    RMDir /r "$R1\databases"
    RMDir /r "$R1\IndexedDB"
    RMDir /r "$R1\WebStorage"
    RMDir /r "$R1\Crashpad"
    RMDir /r "$R1\Partitions"
    RMDir "$R1"
  ${endIf}
!macroend
