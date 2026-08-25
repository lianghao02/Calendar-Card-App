@echo off
setlocal EnableExtensions

set "PORT=8000"
set "HOST=127.0.0.1"

py -3 -c "import sys" >nul 2>&1
if errorlevel 1 (
    echo [錯誤] 找不到 Python 3 Launcher。請安裝 Python 3，或手動執行 Python 3 的 http.server。
    pause
    exit /b 1
)

%SystemRoot%\System32\netstat.exe -ano | %SystemRoot%\System32\findstr.exe /R /C:":%PORT% .*LISTENING" >nul
if not errorlevel 1 (
    echo [錯誤] 連接埠 %PORT% 已被其他程式使用。
    echo 請關閉使用此連接埠的程式後再試，或手動以其他連接埠啟動伺服器。
    pause
    exit /b 1
)

echo 行事曆本機伺服器已啟動： http://%HOST%:%PORT%/
echo 請保持此視窗開啟；按 Ctrl+C 可停止伺服器。
start "" "http://%HOST%:%PORT%/"
py -3 -m http.server %PORT% --bind %HOST%

endlocal
