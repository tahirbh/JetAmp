@echo off
setlocal
echo ========================================
echo Building JetAmp APK (Standalone Script)
echo ========================================

:: Check for Java
where java >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Java not found! Please install Java (JDK 17+) to build the APK.
    pause
    exit /b
)

echo [1/3] Building Web Assets...
cd app
call npm run build
if %errorlevel% neq 0 (
    echo [ERROR] Web build failed.
    pause
    exit /b
)

echo [2/3] Syncing with Capacitor...
call npx cap sync android
if %errorlevel% neq 0 (
    echo [ERROR] Capacitor sync failed.
    pause
    exit /b
)

echo [3/3] Building Android APK...
cd android
call gradlew assembleDebug
if %errorlevel% neq 0 (
    echo [ERROR] Android build failed.
    pause
    exit /b
)

echo ========================================
echo SUCCESS!
echo Your APK is located at:
echo app\android\app\build\outputs\apk\debug\app-debug.apk
echo ========================================
pause
